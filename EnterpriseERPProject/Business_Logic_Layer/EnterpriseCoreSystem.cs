using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;
using System.Linq;
using System.Text;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    // =========================================================================
    // 1. نماذج البيانات وهياكل الكائنات (Data Models & DTOs)
    // =========================================================================
    public class InvoiceDto
    {
        public string InvoiceNumber { get; set; }
        public int CustomerID { get; set; }
        public int? ProjectID { get; set; } // للمقاولات والمشاريع بالآجل
        public decimal TotalBeforeVat { get; set; }
        public decimal TotalVat { get; set; }
        public decimal NetTotal { get; set; }
        public int BranchID { get; set; }
        public int UserID { get; set; }
        public string PaymentMethod { get; set; } // "Cash" أو "Credit"
        public List<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    }

    public class InvoiceItem
    {
        public int ProductID { get; set; }
        public string ProductName { get; set; }
        public decimal Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Total => Quantity * Price;
    }

    public class ReportRow
    {
        public int AccountID { get; set; }
        public string AccountName { get; set; }
        public string AccountType { get; set; }
        public decimal TotalDebit { get; set; }
        public decimal TotalCredit { get; set; }
        public decimal CurrentBalance { get; set; }
    }

    public class StatementRow
    {
        public DateTime TransactionDate { get; set; }
        public string ReferenceNumber { get; set; }
        public string Description { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public decimal Balance { get; set; }
    }

    // =========================================================================
    // 2. النواة المحاسبية والتشغيلية الكاملة للنظام (The Accounting Engine)
    // =========================================================================
    public class EnterpriseCoreSystem
    {
        private readonly string _connectionString;
        private InvoiceDto _printRef;
        private string _qrRef;

        public EnterpriseCoreSystem()
        {
            _connectionString = !string.IsNullOrWhiteSpace(DBConnection.ConnectionString)
                ? DBConnection.ConnectionString
                : "Server=YOUR_SERVER;Database=ERP_DB;Trusted_Connection=True;MultipleActiveResultSets=True;";
        }

        public EnterpriseCoreSystem(string connectionString)
        {
            _connectionString = !string.IsNullOrWhiteSpace(connectionString)
                ? connectionString
                : (!string.IsNullOrWhiteSpace(DBConnection.ConnectionString)
                    ? DBConnection.ConnectionString
                    : "Server=YOUR_SERVER;Database=ERP_DB;Trusted_Connection=True;MultipleActiveResultSets=True;");
        }

        // ---------------------------------------------------------------------
        // أولاً: محرك توليد الأرقام التسلسلية الآمنة ومنع التضارب
        // ---------------------------------------------------------------------
        public string GetNextInvoiceNumber(int branchId, SqlConnection conn, SqlTransaction trans)
        {
            string query = @"SELECT ISNULL(MAX(CAST(SUBSTRING(InvoiceNumber, 5, LEN(InvoiceNumber)) AS INT)), 0) + 1 
                             FROM SalesInvoices WITH (UPDLOCK, HOLDLOCK) WHERE BranchID = @BranchID";
            using (SqlCommand cmd = new SqlCommand(query, conn, trans))
            {
                cmd.Parameters.AddWithValue("@BranchID", branchId);
                int nextNo = Convert.ToInt32(cmd.ExecuteScalar());
                return $"INV-{nextNo:D6}";
            }
        }

        public string GetNextInvoiceNumber(int branchId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                return GetNextInvoiceNumber(branchId, conn, null);
            }
        }

        // ---------------------------------------------------------------------
        // ثانياً: المحرك الشامل لحفظ الفواتير والترحيل اللحظي للتقارير المالي
        // ---------------------------------------------------------------------
        public bool SaveAndPostInvoice(InvoiceDto inv, out string generatedInvoiceNo, out string errorMsg)
        {
            errorMsg = string.Empty;
            generatedInvoiceNo = string.Empty;

            if (inv == null)
            {
                errorMsg = "بيانات الفاتورة فارغة أو غير صحيحة.";
                return false;
            }

            if (inv.Items == null || inv.Items.Count == 0)
            {
                errorMsg = "لا يمكن حفظ فاتورة مبيعات بدون أصناف.";
                return false;
            }

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                EnsureDatabaseSchema(conn);

                SqlTransaction trans = conn.BeginTransaction();

                try
                {
                    // 1. توليد الرقم المتسلسل المقفل برمجياً لمنع التكرار
                    inv.InvoiceNumber = GetNextInvoiceNumber(inv.BranchID, conn, trans);
                    generatedInvoiceNo = inv.InvoiceNumber;

                    // 2. حفظ الفاتورة بجدول المبيعات
                    string insertInv = @"INSERT INTO SalesInvoices (InvoiceNumber, CustomerID, ProjectID, TotalBeforeVat, TotalVat, NetTotal, BranchID, PaymentMethod, CreatedBy, InvoiceDate, IsPosted) 
                                         VALUES (@InvNo, @CustID, @ProjID, @Sub, @Vat, @Net, @Branch, @Method, @User, GETDATE(), 1);
                                         SELECT SCOPE_IDENTITY();";
                    
                    int invoiceId;
                    using (SqlCommand cmd = new SqlCommand(insertInv, conn, trans))
                    {
                        cmd.Parameters.AddWithValue("@InvNo", inv.InvoiceNumber);
                        cmd.Parameters.AddWithValue("@CustID", inv.CustomerID);
                        cmd.Parameters.AddWithValue("@ProjID", (object)inv.ProjectID ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Sub", inv.TotalBeforeVat);
                        cmd.Parameters.AddWithValue("@Vat", inv.TotalVat);
                        cmd.Parameters.AddWithValue("@Net", inv.NetTotal);
                        cmd.Parameters.AddWithValue("@Branch", inv.BranchID);
                        cmd.Parameters.AddWithValue("@Method", inv.PaymentMethod ?? "Cash");
                        cmd.Parameters.AddWithValue("@User", inv.UserID);
                        invoiceId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    // 3. معالجة المستودعات وحساب التكلفة بالمتوسط المرجح المتحرك (Loop)
                    foreach (var item in inv.Items)
                    {
                        string insertDetail = "INSERT INTO SalesInvoiceDetails (InvoiceID, ProductID, Quantity, Price) VALUES (@InvID, @ProdID, @Qty, @Price)";
                        using (SqlCommand cmd = new SqlCommand(insertDetail, conn, trans))
                        {
                            cmd.Parameters.AddWithValue("@InvID", invoiceId);
                            cmd.Parameters.AddWithValue("@ProdID", item.ProductID);
                            cmd.Parameters.AddWithValue("@Qty", item.Quantity);
                            cmd.Parameters.AddWithValue("@Price", item.Price);
                            cmd.ExecuteNonQuery();
                        }

                        // خصم الكمية المباعة من المستودع
                        string updateStock = "UPDATE Products SET CurrentStock = CurrentStock - @Qty WHERE ProductID = @ProdID";
                        using (SqlCommand cmd = new SqlCommand(updateStock, conn, trans))
                        {
                            cmd.Parameters.AddWithValue("@Qty", item.Quantity);
                            cmd.Parameters.AddWithValue("@ProdID", item.ProductID);
                            cmd.ExecuteNonQuery();
                        }
                    }

                    // 4. حل مشكلة اختفاء التقارير: ترحيل رأس القيد لدفتر الأستاذ العام فوراً
                    string insertJournal = @"INSERT INTO JournalEntries (EntryDate, ReferenceNumber, Description, BranchID, IsPosted, CreatedAt) 
                                           VALUES (GETDATE(), @Ref, @Desc, @BranchID, 1, GETDATE()); SELECT SCOPE_IDENTITY();";
                    int entryId;
                    using (SqlCommand cmd = new SqlCommand(insertJournal, conn, trans))
                    {
                        cmd.Parameters.AddWithValue("@Ref", inv.InvoiceNumber);
                        cmd.Parameters.AddWithValue("@Desc", $"قيد تلقائي لفاتورة مبيعات رقم {inv.InvoiceNumber}");
                        cmd.Parameters.AddWithValue("@BranchID", inv.BranchID);
                        entryId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    string insertLines = "INSERT INTO JournalEntryDetails (EntryID, AccountID, Debit, Credit, CostCenterID) VALUES (@EntryID, @AccID, @Deb, @Cred, @CCID)";

                    // السطر الأول (المدين): حساب الصندوق (101001) للكاش أو ذمم العملاء/المقاولات (103001) للآجل
                    int debitAccount = (inv.PaymentMethod == "Cash" || inv.PaymentMethod == "نقدي") ? 101001 : 103001;
                    using (SqlCommand cmdLine = new SqlCommand(insertLines, conn, trans))
                    {
                        cmdLine.Parameters.AddWithValue("@EntryID", entryId);
                        cmdLine.Parameters.AddWithValue("@AccID", debitAccount);
                        cmdLine.Parameters.AddWithValue("@Deb", inv.NetTotal);
                        cmdLine.Parameters.AddWithValue("@Cred", 0m);
                        cmdLine.Parameters.AddWithValue("@CCID", (object)inv.ProjectID ?? DBNull.Value);
                        cmdLine.ExecuteNonQuery();
                    }

                    // السطر الثاني (الدائن): حساب المبيعات (401001) بقيمة البضاعة صافية
                    using (SqlCommand cmdLine = new SqlCommand(insertLines, conn, trans))
                    {
                        cmdLine.Parameters.AddWithValue("@EntryID", entryId);
                        cmdLine.Parameters.AddWithValue("@AccID", 401001);
                        cmdLine.Parameters.AddWithValue("@Deb", 0m);
                        cmdLine.Parameters.AddWithValue("@Cred", inv.TotalBeforeVat);
                        cmdLine.Parameters.AddWithValue("@CCID", (object)inv.ProjectID ?? DBNull.Value);
                        cmdLine.ExecuteNonQuery();
                    }

                    // السطر الثالث (الدائن للضريبة): حساب ضريبة القيمة المضافة (202001)
                    if (inv.TotalVat > 0)
                    {
                        using (SqlCommand cmdLine = new SqlCommand(insertLines, conn, trans))
                        {
                            cmdLine.Parameters.AddWithValue("@EntryID", entryId);
                            cmdLine.Parameters.AddWithValue("@AccID", 202001);
                            cmdLine.Parameters.AddWithValue("@Deb", 0m);
                            cmdLine.Parameters.AddWithValue("@Cred", inv.TotalVat);
                            cmdLine.Parameters.AddWithValue("@CCID", (object)inv.ProjectID ?? DBNull.Value);
                            cmdLine.ExecuteNonQuery();
                        }
                    }

                    trans.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    try { trans.Rollback(); } catch { }
                    errorMsg = $"فشل حفظ وترحيل الفاتورة: {ex.Message}";
                    return false;
                }
            }
        }

        // ---------------------------------------------------------------------
        // ثالثاً: محرك التقارير المالية وميزان المراجعة وكشف الحساب
        // ---------------------------------------------------------------------

        /// <summary>
        /// استخراج ميزان المراجعة الشامل لجميع الحسابات للتحقق من التوازن المحاسبي
        /// </summary>
        public List<ReportRow> GetTrialBalance(DateTime? asOfDate = null, int? branchId = null)
        {
            var rows = new List<ReportRow>();
            DateTime targetDate = asOfDate ?? DateTime.Now;

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string query = @"
                    SELECT 
                        a.AccountID,
                        a.AccountName,
                        a.AccountType,
                        ISNULL(SUM(d.Debit), 0) AS TotalDebit,
                        ISNULL(SUM(d.Credit), 0) AS TotalCredit,
                        CASE 
                            WHEN a.AccountType IN ('Asset', 'Expense', 'أصول', 'مصروفات') 
                                THEN ISNULL(SUM(d.Debit - d.Credit), 0)
                            ELSE 
                                ISNULL(SUM(d.Credit - d.Debit), 0)
                        END AS CurrentBalance
                    FROM Accounts a
                    LEFT JOIN JournalEntryDetails d ON a.AccountID = d.AccountID
                    LEFT JOIN JournalEntries e ON d.EntryID = e.EntryID AND e.EntryDate <= @TargetDate
                        " + (branchId.HasValue ? " AND e.BranchID = @BranchID" : "") + @"
                    GROUP BY a.AccountID, a.AccountName, a.AccountType
                    ORDER BY a.AccountID ASC;";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@TargetDate", targetDate);
                    if (branchId.HasValue)
                        cmd.Parameters.AddWithValue("@BranchID", branchId.Value);

                    using (SqlDataReader rdr = cmd.ExecuteReader())
                    {
                        while (rdr.Read())
                        {
                            rows.Add(new ReportRow
                            {
                                AccountID = Convert.ToInt32(rdr["AccountID"]),
                                AccountName = rdr["AccountName"] != DBNull.Value ? rdr["AccountName"].ToString() : "",
                                AccountType = rdr["AccountType"] != DBNull.Value ? rdr["AccountType"].ToString() : "",
                                TotalDebit = Convert.ToDecimal(rdr["TotalDebit"]),
                                TotalCredit = Convert.ToDecimal(rdr["TotalCredit"]),
                                CurrentBalance = Convert.ToDecimal(rdr["CurrentBalance"])
                            });
                        }
                    }
                }
            }

            return rows;
        }

        /// <summary>
        /// كشف حساب تفصيلي لعميل أو صندوق أو مورد مع الرصيد الافتتاحي والرصيد التراكمي
        /// </summary>
        public List<StatementRow> GetAccountStatement(int accountId, DateTime fromDate, DateTime toDate, int? branchId = null)
        {
            var statement = new List<StatementRow>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                // 1. حساب الرصيد الافتتاحي قبل تاريخ البداية
                decimal openingBalance = 0m;
                string openQuery = @"
                    SELECT ISNULL(SUM(d.Debit - d.Credit), 0)
                    FROM JournalEntryDetails d
                    JOIN JournalEntries e ON d.EntryID = e.EntryID
                    WHERE d.AccountID = @AccID AND e.EntryDate < @FromDate";
                if (branchId.HasValue) openQuery += " AND e.BranchID = @BranchID";

                using (SqlCommand cmdOpen = new SqlCommand(openQuery, conn))
                {
                    cmdOpen.Parameters.AddWithValue("@AccID", accountId);
                    cmdOpen.Parameters.AddWithValue("@FromDate", fromDate);
                    if (branchId.HasValue) cmdOpen.Parameters.AddWithValue("@BranchID", branchId.Value);
                    var res = cmdOpen.ExecuteScalar();
                    if (res != null && res != DBNull.Value) openingBalance = Convert.ToDecimal(res);
                }

                // سطر الرصيد الافتتاحي
                decimal runningBalance = openingBalance;
                statement.Add(new StatementRow
                {
                    TransactionDate = fromDate,
                    ReferenceNumber = "OPENING",
                    Description = "الرصيد الافتتاحي السابق",
                    Debit = openingBalance > 0 ? openingBalance : 0m,
                    Credit = openingBalance < 0 ? Math.Abs(openingBalance) : 0m,
                    Balance = runningBalance
                });

                // 2. جلب الحركات التفصيلية ضمن الفترة
                string transQuery = @"
                    SELECT e.EntryDate, e.ReferenceNumber, e.Description, d.Debit, d.Credit
                    FROM JournalEntryDetails d
                    JOIN JournalEntries e ON d.EntryID = e.EntryID
                    WHERE d.AccountID = @AccID AND e.EntryDate BETWEEN @FromDate AND @ToDate
                    " + (branchId.HasValue ? " AND e.BranchID = @BranchID" : "") + @"
                    ORDER BY e.EntryDate ASC, e.EntryID ASC;";

                using (SqlCommand cmdTrans = new SqlCommand(transQuery, conn))
                {
                    cmdTrans.Parameters.AddWithValue("@AccID", accountId);
                    cmdTrans.Parameters.AddWithValue("@FromDate", fromDate);
                    cmdTrans.Parameters.AddWithValue("@ToDate", toDate);
                    if (branchId.HasValue) cmdTrans.Parameters.AddWithValue("@BranchID", branchId.Value);

                    using (SqlDataReader rdr = cmdTrans.ExecuteReader())
                    {
                        while (rdr.Read())
                        {
                            decimal deb = Convert.ToDecimal(rdr["Debit"]);
                            decimal cred = Convert.ToDecimal(rdr["Credit"]);
                            runningBalance += (deb - cred);

                            statement.Add(new StatementRow
                            {
                                TransactionDate = Convert.ToDateTime(rdr["EntryDate"]),
                                ReferenceNumber = rdr["ReferenceNumber"] != DBNull.Value ? rdr["ReferenceNumber"].ToString() : "",
                                Description = rdr["Description"] != DBNull.Value ? rdr["Description"].ToString() : "",
                                Debit = deb,
                                Credit = cred,
                                Balance = runningBalance
                            });
                        }
                    }
                }
            }

            return statement;
        }

        /// <summary>
        /// تقرير قائمة الدخل والأرباح والخسائر لفترة محددة
        /// </summary>
        public List<ReportRow> GetIncomeStatement(DateTime fromDate, DateTime toDate, int? branchId, out decimal totalRevenues, out decimal totalExpenses, out decimal netProfit)
        {
            var rows = new List<ReportRow>();
            totalRevenues = 0m;
            totalExpenses = 0m;

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string query = @"
                    SELECT 
                        a.AccountID,
                        a.AccountName,
                        a.AccountType,
                        ISNULL(SUM(d.Debit), 0) AS TotalDebit,
                        ISNULL(SUM(d.Credit), 0) AS TotalCredit
                    FROM Accounts a
                    JOIN JournalEntryDetails d ON a.AccountID = d.AccountID
                    JOIN JournalEntries e ON d.EntryID = e.EntryID
                    WHERE e.EntryDate BETWEEN @FromDate AND @ToDate
                      AND (a.AccountType IN ('Revenue', 'Expense', 'إيرادات', 'مصروفات') OR a.AccountID >= 400000)
                      " + (branchId.HasValue ? " AND e.BranchID = @BranchID" : "") + @"
                    GROUP BY a.AccountID, a.AccountName, a.AccountType
                    ORDER BY a.AccountID ASC;";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@FromDate", fromDate);
                    cmd.Parameters.AddWithValue("@ToDate", toDate);
                    if (branchId.HasValue) cmd.Parameters.AddWithValue("@BranchID", branchId.Value);

                    using (SqlDataReader rdr = cmd.ExecuteReader())
                    {
                        while (rdr.Read())
                        {
                            var r = new ReportRow
                            {
                                AccountID = Convert.ToInt32(rdr["AccountID"]),
                                AccountName = rdr["AccountName"] != DBNull.Value ? rdr["AccountName"].ToString() : "",
                                AccountType = rdr["AccountType"] != DBNull.Value ? rdr["AccountType"].ToString() : "",
                                TotalDebit = Convert.ToDecimal(rdr["TotalDebit"]),
                                TotalCredit = Convert.ToDecimal(rdr["TotalCredit"])
                            };

                            if (r.AccountType == "Revenue" || r.AccountType == "إيرادات" || r.AccountID.ToString().StartsWith("4"))
                            {
                                r.CurrentBalance = r.TotalCredit - r.TotalDebit;
                                totalRevenues += r.CurrentBalance;
                            }
                            else
                            {
                                r.CurrentBalance = r.TotalDebit - r.TotalCredit;
                                totalExpenses += r.CurrentBalance;
                            }

                            rows.Add(r);
                        }
                    }
                }
            }

            netProfit = totalRevenues - totalExpenses;
            return rows;
        }

        // ---------------------------------------------------------------------
        // رابعاً: نظام الطباعة الحرارية المباشرة والباركود ZATCA QR
        // ---------------------------------------------------------------------

        /// <summary>
        /// طباعة الفاتورة الضريبية إلى طابعة الإيصالات الحرارية مباشرة
        /// </summary>
        public bool PrintDirectInvoice(InvoiceDto invoice, string zatcaQrBase64, string printerName, out string errorMsg)
        {
            errorMsg = string.Empty;
            _printRef = invoice;
            _qrRef = zatcaQrBase64;

            if (_printRef == null)
            {
                errorMsg = "بيانات الفاتورة المراد طباعتها غير متوفرة.";
                return false;
            }

            try
            {
                using (PrintDocument pd = new PrintDocument())
                {
                    if (!string.IsNullOrWhiteSpace(printerName))
                    {
                        pd.PrinterSettings.PrinterName = printerName;
                    }

                    if (!pd.PrinterSettings.IsValid)
                    {
                        errorMsg = $"طابعة الإيصالات المحددة '{printerName}' غير متصلة أو غير صالحة.";
                        return false;
                    }

                    pd.PrintPage += PrintInvoiceHandler;
                    pd.Print();
                }

                return true;
            }
            catch (Exception ex)
            {
                errorMsg = $"فشل عملية الطباعة: {ex.Message}";
                return false;
            }
        }

        private void PrintInvoiceHandler(object sender, PrintPageEventArgs e)
        {
            Graphics g = e.Graphics;
            int yOffset = 10;
            int pageWidth = 280; // مقاس ورق الإيصالات الحرارية 80 مم

            using (Font fontHeader = new Font("Arial", 12, FontStyle.Bold))
            using (Font fontSub = new Font("Arial", 9, FontStyle.Bold))
            using (Font fontBody = new Font("Arial", 8, FontStyle.Regular))
            using (Font fontBold = new Font("Arial", 8, FontStyle.Bold))
            using (StringFormat sfCenter = new StringFormat { Alignment = StringAlignment.Center })
            using (StringFormat sfRight = new StringFormat { Alignment = StringAlignment.Far })
            {
                // 1. الترويسة المؤسسية
                g.DrawString("برنامج العقرب المحاسبي - Enterprise ERP", fontHeader, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 22), sfCenter);
                yOffset += 24;
                g.DrawString("*** فاتورة ضريبية مبسطة ***", fontSub, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 18), sfCenter);
                yOffset += 20;

                g.DrawString($"رقم الفاتورة: {_printRef.InvoiceNumber}", fontBold, Brushes.Black, 10, yOffset);
                yOffset += 16;
                g.DrawString($"التاريخ: {DateTime.Now:yyyy/MM/dd HH:mm}", fontBody, Brushes.Black, 10, yOffset);
                yOffset += 16;
                g.DrawString($"الفرع: #{_printRef.BranchID} | المستخدم: #{_printRef.UserID}", fontBody, Brushes.Black, 10, yOffset);
                yOffset += 16;
                string payDesc = (_printRef.PaymentMethod == "Cash" || _printRef.PaymentMethod == "نقدي") ? "نقداً (Cash)" : "آجل (Credit)";
                g.DrawString($"طريقة الدفع: {payDesc}", fontBody, Brushes.Black, 10, yOffset);
                yOffset += 16;

                g.DrawLine(Pens.Black, 10, yOffset, pageWidth - 10, yOffset);
                yOffset += 6;

                // 2. جدول بنود الفاتورة
                if (_printRef.Items != null && _printRef.Items.Count > 0)
                {
                    g.DrawString("الصنف", fontBold, Brushes.Black, 10, yOffset);
                    g.DrawString("الكمية", fontBold, Brushes.Black, 140, yOffset);
                    g.DrawString("الإجمالي", fontBold, Brushes.Black, 210, yOffset);
                    yOffset += 16;
                    g.DrawLine(Pens.Gray, 10, yOffset, pageWidth - 10, yOffset);
                    yOffset += 5;

                    foreach (var item in _printRef.Items)
                    {
                        string pName = !string.IsNullOrWhiteSpace(item.ProductName) ? item.ProductName : $"صنف #{item.ProductID}";
                        g.DrawString(pName, fontBody, Brushes.Black, 10, yOffset);
                        g.DrawString($"{item.Quantity:N0}", fontBody, Brushes.Black, 145, yOffset);
                        g.DrawString($"{(item.Quantity * item.Price):N2}", fontBody, Brushes.Black, 210, yOffset);
                        yOffset += 16;
                    }

                    g.DrawLine(Pens.Black, 10, yOffset, pageWidth - 10, yOffset);
                    yOffset += 6;
                }

                // 3. الإجماليات والضريبة 15%
                g.DrawString("الإجمالي قبل الضريبة:", fontBody, Brushes.Black, 10, yOffset);
                g.DrawString($"{_printRef.TotalBeforeVat:N2} ر.س", fontBody, Brushes.Black, new RectangleF(10, yOffset, pageWidth - 20, 16), sfRight);
                yOffset += 16;

                g.DrawString("ضريبة القيمة المضافة (15%):", fontBody, Brushes.Black, 10, yOffset);
                g.DrawString($"{_printRef.TotalVat:N2} ر.س", fontBody, Brushes.Black, new RectangleF(10, yOffset, pageWidth - 20, 16), sfRight);
                yOffset += 16;

                g.DrawString("الصافي الإجمالي:", fontHeader, Brushes.Black, 10, yOffset);
                yOffset += 20;
                g.DrawString($"{_printRef.NetTotal:N2} ريال سعودي", fontHeader, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 22), sfCenter);
                yOffset += 26;

                // 4. باركود هيئة الزكاة والضريبة ZATCA
                g.DrawString("[ رمز الاستجابة السريعة المعتمد ZATCA QR ]", fontSub, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 16), sfCenter);
                yOffset += 18;

                if (!string.IsNullOrWhiteSpace(_qrRef))
                {
                    // طباعة نص الباركود أو المؤشر
                    g.DrawString("تم التشفير طبقاً للمواصفة القياسية TLV", fontBody, Brushes.DarkGray, new RectangleF(0, yOffset, pageWidth, 14), sfCenter);
                    yOffset += 16;
                }

                g.DrawString("شكراً لتعاملكم معنا", fontBody, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 16), sfCenter);
                yOffset += 20;
            }
        }

        // ---------------------------------------------------------------------
        // خامساً: محرك تشفير باركود الزكاة ZATCA TLV Base64
        // ---------------------------------------------------------------------
        public static string GenerateZatcaQr(string sellerName, string vatNumber, DateTime invoiceDate, decimal totalWithVat, decimal totalVat)
        {
            if (string.IsNullOrWhiteSpace(sellerName)) sellerName = "شركة الأعمال المتكاملة";
            if (string.IsNullOrWhiteSpace(vatNumber)) vatNumber = "300000000000003";

            byte[] bSeller = Encoding.UTF8.GetBytes(sellerName.Trim());
            byte[] bVat = Encoding.UTF8.GetBytes(vatNumber.Trim());
            byte[] bTime = Encoding.UTF8.GetBytes(invoiceDate.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"));
            byte[] bTotal = Encoding.UTF8.GetBytes(totalWithVat.ToString("F2"));
            byte[] bVatTotal = Encoding.UTF8.GetBytes(totalVat.ToString("F2"));

            using (var ms = new MemoryStream())
            {
                WriteTlv(ms, 1, bSeller);
                WriteTlv(ms, 2, bVat);
                WriteTlv(ms, 3, bTime);
                WriteTlv(ms, 4, bTotal);
                WriteTlv(ms, 5, bVatTotal);
                return Convert.ToBase64String(ms.ToArray());
            }
        }

        private static void WriteTlv(MemoryStream ms, byte tag, byte[] val)
        {
            ms.WriteByte(tag);
            ms.WriteByte((byte)val.Length);
            ms.Write(val, 0, val.Length);
        }

        // ---------------------------------------------------------------------
        // سادساً: النسخ الاحتياطي التلقائي وفحص الجداول
        // ---------------------------------------------------------------------
        public bool ExecuteDatabaseBackup(string backupFolderDirectory, out string responseMessage)
        {
            responseMessage = string.Empty;
            if (!Directory.Exists(backupFolderDirectory))
            {
                try { Directory.CreateDirectory(backupFolderDirectory); }
                catch (Exception ex)
                {
                    responseMessage = $"تعذر إنشاء مجلد النسخ الاحتياطي: {ex.Message}";
                    return false;
                }
            }

            string backupFileName = $"ERP_DB_Backup_{DateTime.Now:yyyyMMdd_HHmmss}.bak";
            string fullPath = Path.Combine(backupFolderDirectory, backupFileName);

            string query = $@"BACKUP DATABASE [ERP_DB] TO DISK = N'{fullPath}' WITH NOFORMAT, NOINIT, NAME = N'ERP_DB-Full Database Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10";

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                try
                {
                    conn.Open();
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        cmd.ExecuteNonQuery();
                        responseMessage = $"تم إنشاء النسخة الاحتياطية بنجاح في: {fullPath}";
                        return true;
                    }
                }
                catch (Exception ex)
                {
                    responseMessage = $"فشل عمل النسخة الاحتياطية: {ex.Message}";
                    return false;
                }
            }
        }

        public void EnsureDatabaseSchema(SqlConnection conn, SqlTransaction trans = null)
        {
            string schemaSql = @"
                IF COL_LENGTH('SalesInvoices', 'IsPosted') IS NULL
                    ALTER TABLE SalesInvoices ADD IsPosted BIT NOT NULL DEFAULT 0;
                IF COL_LENGTH('SalesInvoices', 'ProjectID') IS NULL
                    ALTER TABLE SalesInvoices ADD ProjectID INT NULL;
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PurchaseInvoices') AND COL_LENGTH('PurchaseInvoices', 'IsPosted') IS NULL
                    ALTER TABLE PurchaseInvoices ADD IsPosted BIT NOT NULL DEFAULT 0;
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'JournalEntryDetails') AND COL_LENGTH('JournalEntryDetails', 'CostCenterID') IS NULL
                    ALTER TABLE JournalEntryDetails ADD CostCenterID INT NULL;";

            using (SqlCommand cmd = new SqlCommand(schemaSql, conn, trans))
            {
                cmd.ExecuteNonQuery();
            }
        }
    }
}

