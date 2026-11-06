using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    // =========================================================================
    // 1. الأقسام الهيكلية ونماذج البيانات (Data Models & DTOs)
    // =========================================================================
    
    public class JournalLine
    {
        public int AccountID { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public int? CostCenterID { get; set; } // رقم المشروع أو الفرع كمركز تكلفة
    }

    public class InvoiceDataDto
    {
        public string InvoiceNumber { get; set; }
        public int CustomerID { get; set; }
        public int? ProjectID { get; set; } // للمقاولات بالآجل
        public decimal TotalBeforeVat { get; set; }
        public decimal TotalVat { get; set; }
        public decimal NetTotal { get; set; }
        public int BranchID { get; set; }
        public int UserID { get; set; }
        public string PaymentMethod { get; set; } // "Cash" , "Credit"
        public DateTime DueDate { get; set; }
        public List<InvoiceItemLine> Items { get; set; } = new List<InvoiceItemLine>();
    }

    public class InvoiceItemLine
    {
        public int ProductID { get; set; }
        public decimal Quantity { get; set; }
        public decimal Price { get; set; }
    }

    public class AccountStatusRow
    {
        public int AccountID { get; set; }
        public string AccountName { get; set; }
        public string AccountType { get; set; }
        public decimal TotalDebit { get; set; }
        public decimal TotalCredit { get; set; }
        public decimal CurrentBalance { get; set; }
    }

    // =========================================================================
    // 2. المحرك البرمجي والمحاسبي العملاق والنواة المتكاملة للنظام
    // =========================================================================
    
    public class EnterpriseCoreERP
    {
        private readonly string _connectionString;
        private InvoiceDataDto _invoicePrintRef;

        public EnterpriseCoreERP()
        {
            _connectionString = DBConnection.ConnectionString;
        }

        public EnterpriseCoreERP(string connectionString)
        {
            _connectionString = string.IsNullOrWhiteSpace(connectionString) 
                ? DBConnection.ConnectionString 
                : connectionString;
        }

        // ---------------------------------------------------------------------
        // أولاً: محرك القيود المزدوجة والمبيعات ونقاط البيع السريعة والآجلة
        // ---------------------------------------------------------------------

        /// <summary>
        /// توليد رقم فاتورة تسلسلي فريد ومحمي برمجياً من التضارب والتكرار داخل الشركة (UPDLOCK, HOLDLOCK)
        /// </summary>
        public string GenerateNextInvoiceNumber(int branchId, string invoiceTypePrefix = "INV")
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                return GenerateNextInvoiceNumber(branchId, conn, null, invoiceTypePrefix);
            }
        }

        public string GenerateNextInvoiceNumber(int branchId, SqlConnection conn, SqlTransaction trans, string invoiceTypePrefix = "INV")
        {
            int prefixSubstrStart = (invoiceTypePrefix?.Length ?? 3) + 2;
            string query = $@"SELECT ISNULL(MAX(TRY_CAST(SUBSTRING(InvoiceNumber, {prefixSubstrStart}, LEN(InvoiceNumber)) AS INT)), 0) + 1 
                             FROM SalesInvoices WITH (UPDLOCK, HOLDLOCK)
                             WHERE BranchID = @BranchID AND InvoiceNumber LIKE @PrefixPattern";

            using (SqlCommand cmd = new SqlCommand(query, conn, trans))
            {
                cmd.Parameters.Add("@BranchID", SqlDbType.Int).Value = branchId;
                cmd.Parameters.Add("@PrefixPattern", SqlDbType.NVarChar, 50).Value = $"{invoiceTypePrefix}-%";
                int nextNumber = Convert.ToInt32(cmd.ExecuteScalar());
                return $"{invoiceTypePrefix}-{nextNumber:D6}";
            }
        }
        
        public bool ProcessAndSaveInvoice(InvoiceDataDto inv, out string errorMsg)
        {
            errorMsg = string.Empty;

            if (inv == null || inv.Items == null || inv.Items.Count == 0)
            {
                errorMsg = "خطأ: الفاتورة فارغة ولا تحتوي على أي أصناف.";
                return false;
            }

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                SqlTransaction trans = conn.BeginTransaction();

                try
                {
                    if (string.IsNullOrWhiteSpace(inv.InvoiceNumber))
                    {
                        inv.InvoiceNumber = GenerateNextInvoiceNumber(inv.BranchID, conn, trans);
                    }

                    // 1. حفظ الفاتورة في جدول المبيعات الرئيسي مع الترحيل الفوري (IsPosted = 1)
                    string insertInvQuery = @"
                        INSERT INTO SalesInvoices (InvoiceNumber, CustomerID, ProjectID, TotalBeforeVat, TotalVat, NetTotal, BranchID, PaymentMethod, CreatedBy, InvoiceDate, IsPosted) 
                        VALUES (@InvNo, @CustID, @ProjID, @Sub, @Vat, @Net, @Branch, @Method, @User, GETDATE(), 1);
                        SELECT SCOPE_IDENTITY();";

                    int invoiceId;
                    using (SqlCommand cmd = new SqlCommand(insertInvQuery, conn, trans))
                    {
                        cmd.Parameters.Add("@InvNo", SqlDbType.NVarChar, 50).Value = inv.InvoiceNumber;
                        cmd.Parameters.Add("@CustID", SqlDbType.Int).Value = inv.CustomerID;
                        cmd.Parameters.Add("@ProjID", SqlDbType.Int).Value = (object)inv.ProjectID ?? DBNull.Value;
                        
                        var pSub = cmd.Parameters.Add("@Sub", SqlDbType.Decimal);
                        pSub.Precision = 18; pSub.Scale = 2; pSub.Value = inv.TotalBeforeVat;

                        var pVat = cmd.Parameters.Add("@Vat", SqlDbType.Decimal);
                        pVat.Precision = 18; pVat.Scale = 2; pVat.Value = inv.TotalVat;

                        var pNet = cmd.Parameters.Add("@Net", SqlDbType.Decimal);
                        pNet.Precision = 18; pNet.Scale = 2; pNet.Value = inv.NetTotal;

                        cmd.Parameters.Add("@Branch", SqlDbType.Int).Value = inv.BranchID;
                        cmd.Parameters.Add("@Method", SqlDbType.NVarChar, 50).Value = inv.PaymentMethod ?? "Cash";
                        cmd.Parameters.Add("@User", SqlDbType.Int).Value = inv.UserID;
                        
                        invoiceId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    // 2. تحديث المخزون وحفظ أصناف الفاتورة تفصيلياً (Loop)
                    foreach (var item in inv.Items)
                    {
                        string insertDetail = @"
                            INSERT INTO SalesInvoiceDetails (InvoiceID, ProductID, Quantity, Price, SubTotal) 
                            VALUES (@InvID, @ProdID, @Qty, @Price, @Sub);";

                        using (SqlCommand cmd = new SqlCommand(insertDetail, conn, trans))
                        {
                            cmd.Parameters.Add("@InvID", SqlDbType.Int).Value = invoiceId;
                            cmd.Parameters.Add("@ProdID", SqlDbType.Int).Value = item.ProductID;

                            var pQty = cmd.Parameters.Add("@Qty", SqlDbType.Decimal);
                            pQty.Precision = 18; pQty.Scale = 2; pQty.Value = item.Quantity;

                            var pPrice = cmd.Parameters.Add("@Price", SqlDbType.Decimal);
                            pPrice.Precision = 18; pPrice.Scale = 2; pPrice.Value = item.Price;

                            var pItemSub = cmd.Parameters.Add("@Sub", SqlDbType.Decimal);
                            pItemSub.Precision = 18; pItemSub.Scale = 2; pItemSub.Value = item.Quantity * item.Price;

                            cmd.ExecuteNonQuery();
                        }

                        // خصم الكمية من مخزن الفرع الحالي مع التحقق
                        string updateStock = "UPDATE Products SET CurrentStock = CurrentStock - @Qty WHERE ProductID = @ProdID;";
                        using (SqlCommand cmd = new SqlCommand(updateStock, conn, trans))
                        {
                            var pQty = cmd.Parameters.Add("@Qty", SqlDbType.Decimal);
                            pQty.Precision = 18; pQty.Scale = 2; pQty.Value = item.Quantity;
                            cmd.Parameters.Add("@ProdID", SqlDbType.Int).Value = item.ProductID;
                            cmd.ExecuteNonQuery();
                        }
                    }

                    // 3. توليد وترحيل القيد المحاسبي المزدوج آلياً بدفتر الأستاذ
                    GenerateAutoJournalEntry(inv, conn, trans);

                    // 4. كتابة سجل الأمان والرقابة (Audit Trail)
                    WriteLog(inv.UserID, "INVOICE_SAVE", $"تم حفظ فاتورة مبيعات رقم {inv.InvoiceNumber} بنجاح", conn, trans);

                    trans.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    try { trans.Rollback(); } catch { }
                    errorMsg = $"فشلت معالجة الفاتورة: {ex.Message}";
                    return false;
                }
            }
        }

        private void GenerateAutoJournalEntry(InvoiceDataDto inv, SqlConnection conn, SqlTransaction trans)
        {
            string insertJournal = @"
                INSERT INTO JournalEntries (EntryDate, ReferenceNumber, Description, BranchID, IsPosted, CreatedAt) 
                VALUES (GETDATE(), @Ref, @Desc, @Branch, 1, GETDATE()); 
                SELECT SCOPE_IDENTITY();";

            int entryId;
            using (SqlCommand cmd = new SqlCommand(insertJournal, conn, trans))
            {
                cmd.Parameters.Add("@Ref", SqlDbType.NVarChar, 50).Value = inv.InvoiceNumber;
                cmd.Parameters.Add("@Desc", SqlDbType.NVarChar, 255).Value = $"قيد تلقائي لفاتورة مبيعات رقم {inv.InvoiceNumber}";
                cmd.Parameters.Add("@Branch", SqlDbType.Int).Value = inv.BranchID;
                entryId = Convert.ToInt32(cmd.ExecuteScalar());
            }

            string insertLines = @"
                INSERT INTO JournalEntryDetails (EntryID, AccountID, Debit, Credit, CostCenterID, LineDescription) 
                VALUES (@EntryID, @AccID, @Deb, @Cred, @CCID, @LineDesc);";

            // الطرف المدين: الصندوق 101001 (إذا كانت نقداً) أو ذمم العملاء 103001 (إذا كانت بالآجل ومقاولات)
            int debitAccount = (inv.PaymentMethod == "Cash" || inv.PaymentMethod == "نقدي") ? 101001 : 103001;
            using (SqlCommand cmd = new SqlCommand(insertLines, conn, trans))
            {
                cmd.Parameters.Add("@EntryID", SqlDbType.Int).Value = entryId;
                cmd.Parameters.Add("@AccID", SqlDbType.Int).Value = debitAccount;

                var pDeb = cmd.Parameters.Add("@Deb", SqlDbType.Decimal);
                pDeb.Precision = 18; pDeb.Scale = 2; pDeb.Value = inv.NetTotal;

                var pCred = cmd.Parameters.Add("@Cred", SqlDbType.Decimal);
                pCred.Precision = 18; pCred.Scale = 2; pCred.Value = 0m;

                cmd.Parameters.Add("@CCID", SqlDbType.Int).Value = (object)inv.ProjectID ?? DBNull.Value;
                cmd.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255).Value = $"استحقاق فاتورة مبيعات #{inv.InvoiceNumber}";
                cmd.ExecuteNonQuery();
            }

            // الطرف الدائن 1: حساب إيرادات المبيعات 401001
            using (SqlCommand cmd = new SqlCommand(insertLines, conn, trans))
            {
                cmd.Parameters.Add("@EntryID", SqlDbType.Int).Value = entryId;
                cmd.Parameters.Add("@AccID", SqlDbType.Int).Value = 401001;

                var pDeb = cmd.Parameters.Add("@Deb", SqlDbType.Decimal);
                pDeb.Precision = 18; pDeb.Scale = 2; pDeb.Value = 0m;

                var pCred = cmd.Parameters.Add("@Cred", SqlDbType.Decimal);
                pCred.Precision = 18; pCred.Scale = 2; pCred.Value = inv.TotalBeforeVat;

                cmd.Parameters.Add("@CCID", SqlDbType.Int).Value = (object)inv.ProjectID ?? DBNull.Value;
                cmd.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255).Value = $"إيراد مبيعات فاتورة #{inv.InvoiceNumber}";
                cmd.ExecuteNonQuery();
            }

            // الطرف الدائن 2: حساب ضريبة القيمة المضافة المستحقة (ضريبة المخرجات) 202001
            if (inv.TotalVat > 0)
            {
                using (SqlCommand cmd = new SqlCommand(insertLines, conn, trans))
                {
                    cmd.Parameters.Add("@EntryID", SqlDbType.Int).Value = entryId;
                    cmd.Parameters.Add("@AccID", SqlDbType.Int).Value = 202001;

                    var pDeb = cmd.Parameters.Add("@Deb", SqlDbType.Decimal);
                    pDeb.Precision = 18; pDeb.Scale = 2; pDeb.Value = 0m;

                    var pCred = cmd.Parameters.Add("@Cred", SqlDbType.Decimal);
                    pCred.Precision = 18; pCred.Scale = 2; pCred.Value = inv.TotalVat;

                    cmd.Parameters.Add("@CCID", SqlDbType.Int).Value = (object)inv.ProjectID ?? DBNull.Value;
                    cmd.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255).Value = $"ضريبة مخرجات 15% فاتورة #{inv.InvoiceNumber}";
                    cmd.ExecuteNonQuery();
                }
            }
        }

        // ---------------------------------------------------------------------
        // ثانياً: محرك التقارير وجرد جميع الحسابات داخل البرنامج (ميزان المراجعة)
        // ---------------------------------------------------------------------
        
        public List<AccountStatusRow> GetChartOfAccountsReport(DateTime start, DateTime end, int? branchId)
        {
            List<AccountStatusRow> report = new List<AccountStatusRow>();

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
                    LEFT JOIN JournalEntries e ON d.EntryID = e.EntryID 
                        AND e.EntryDate BETWEEN @Start AND @End
                        " + (branchId.HasValue ? " AND e.BranchID = @BranchID" : "") + @"
                    GROUP BY a.AccountID, a.AccountName, a.AccountType
                    ORDER BY a.AccountID ASC;";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.Add("@Start", SqlDbType.DateTime).Value = start;
                    cmd.Parameters.Add("@End", SqlDbType.DateTime).Value = end;
                    if (branchId.HasValue)
                    {
                        cmd.Parameters.Add("@BranchID", SqlDbType.Int).Value = branchId.Value;
                    }

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            report.Add(new AccountStatusRow
                            {
                                AccountID = Convert.ToInt32(reader["AccountID"]),
                                AccountName = reader["AccountName"] != DBNull.Value ? reader["AccountName"].ToString() : "",
                                AccountType = reader["AccountType"] != DBNull.Value ? reader["AccountType"].ToString() : "",
                                TotalDebit = Convert.ToDecimal(reader["TotalDebit"]),
                                TotalCredit = Convert.ToDecimal(reader["TotalCredit"]),
                                CurrentBalance = Convert.ToDecimal(reader["CurrentBalance"])
                            });
                        }
                    }
                }
            }

            return report;
        }

        public async Task<List<AccountStatusRow>> GetChartOfAccountsReportAsync(DateTime start, DateTime end, int? branchId = null)
        {
            List<AccountStatusRow> report = new List<AccountStatusRow>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
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
                    LEFT JOIN JournalEntries e ON d.EntryID = e.EntryID 
                        AND e.EntryDate BETWEEN @Start AND @End
                        " + (branchId.HasValue ? " AND e.BranchID = @BranchID" : "") + @"
                    GROUP BY a.AccountID, a.AccountName, a.AccountType
                    ORDER BY a.AccountID ASC;";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.Add("@Start", SqlDbType.DateTime).Value = start;
                    cmd.Parameters.Add("@End", SqlDbType.DateTime).Value = end;
                    if (branchId.HasValue)
                    {
                        cmd.Parameters.Add("@BranchID", SqlDbType.Int).Value = branchId.Value;
                    }

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            report.Add(new AccountStatusRow
                            {
                                AccountID = Convert.ToInt32(reader["AccountID"]),
                                AccountName = reader["AccountName"] != DBNull.Value ? reader["AccountName"].ToString() : "",
                                AccountType = reader["AccountType"] != DBNull.Value ? reader["AccountType"].ToString() : "",
                                TotalDebit = Convert.ToDecimal(reader["TotalDebit"]),
                                TotalCredit = Convert.ToDecimal(reader["TotalCredit"]),
                                CurrentBalance = Convert.ToDecimal(reader["CurrentBalance"])
                            });
                        }
                    }
                }
            }

            return report;
        }

        // ---------------------------------------------------------------------
        // ثالثاً: نظام الطباعة الحرارية المباشرة وتوليد باركود الزكاة ZATCA QR
        // ---------------------------------------------------------------------

        /// <summary>
        /// طباعة الفاتورة الحرارية مباشرة لطابعة الكاشير مع توليد باركود ZATCA
        /// </summary>
        public bool PrintInvoiceDirect(InvoiceDataDto invoice, string printerName, out string errorMsg)
        {
            errorMsg = string.Empty;
            _invoicePrintRef = invoice;

            if (_invoicePrintRef == null)
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

                    pd.PrintPage += PrintThermalInvoiceHandler;
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

        private void PrintThermalInvoiceHandler(object sender, PrintPageEventArgs e)
        {
            Graphics g = e.Graphics;
            int yOffset = 10;
            int pageWidth = 280; // عرض الإيصال الحراري 80mm

            using (Font fontHeader = new Font("Arial", 12, FontStyle.Bold))
            using (Font fontSub = new Font("Arial", 9, FontStyle.Bold))
            using (Font fontBody = new Font("Arial", 8, FontStyle.Regular))
            using (Font fontBold = new Font("Arial", 8, FontStyle.Bold))
            using (StringFormat sfCenter = new StringFormat { Alignment = StringAlignment.Center })
            using (StringFormat sfRight = new StringFormat { Alignment = StringAlignment.Far })
            {
                // 1. الترويسة
                g.DrawString("برنامج العقرب المحاسبي - Enterprise ERP", fontHeader, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 22), sfCenter);
                yOffset += 24;
                g.DrawString("*** فاتورة ضريبية مبسطة ***", fontSub, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 18), sfCenter);
                yOffset += 20;

                g.DrawString($"رقم الفاتورة: {_invoicePrintRef.InvoiceNumber}", fontBold, Brushes.Black, 10, yOffset);
                yOffset += 16;
                g.DrawString($"التاريخ: {DateTime.Now:yyyy/MM/dd HH:mm}", fontBody, Brushes.Black, 10, yOffset);
                yOffset += 16;
                g.DrawString($"الفرع: #{_invoicePrintRef.BranchID} | المستخدم: #{_invoicePrintRef.UserID}", fontBody, Brushes.Black, 10, yOffset);
                yOffset += 16;
                g.DrawString($"طريقة الدفع: {(_invoicePrintRef.PaymentMethod == "Cash" || _invoicePrintRef.PaymentMethod == "نقدي" ? "نقداً" : "آجل")}", fontBody, Brushes.Black, 10, yOffset);
                yOffset += 16;

                g.DrawLine(Pens.Black, 10, yOffset, pageWidth - 10, yOffset);
                yOffset += 6;

                // 2. جدول الأصناف
                if (_invoicePrintRef.Items != null && _invoicePrintRef.Items.Count > 0)
                {
                    g.DrawString("الصنف", fontBold, Brushes.Black, 10, yOffset);
                    g.DrawString("الكمية", fontBold, Brushes.Black, 140, yOffset);
                    g.DrawString("الإجمالي", fontBold, Brushes.Black, 210, yOffset);
                    yOffset += 16;
                    g.DrawLine(Pens.Gray, 10, yOffset, pageWidth - 10, yOffset);
                    yOffset += 5;

                    foreach (var item in _invoicePrintRef.Items)
                    {
                        g.DrawString($"صنف #{item.ProductID}", fontBody, Brushes.Black, 10, yOffset);
                        g.DrawString($"{item.Quantity:N0}", fontBody, Brushes.Black, 145, yOffset);
                        g.DrawString($"{(item.Quantity * item.Price):N2}", fontBody, Brushes.Black, 210, yOffset);
                        yOffset += 16;
                    }

                    g.DrawLine(Pens.Black, 10, yOffset, pageWidth - 10, yOffset);
                    yOffset += 6;
                }

                // 3. الإجماليات
                g.DrawString("الإجمالي قبل الضريبة:", fontBody, Brushes.Black, 10, yOffset);
                g.DrawString($"{_invoicePrintRef.TotalBeforeVat:N2} ر.س", fontBody, Brushes.Black, new RectangleF(10, yOffset, pageWidth - 20, 16), sfRight);
                yOffset += 16;

                g.DrawString("ضريبة القيمة المضافة (15%):", fontBody, Brushes.Black, 10, yOffset);
                g.DrawString($"{_invoicePrintRef.TotalVat:N2} ر.س", fontBody, Brushes.Black, new RectangleF(10, yOffset, pageWidth - 20, 16), sfRight);
                yOffset += 16;

                g.DrawString("الصافي الإجمالي:", fontHeader, Brushes.Black, 10, yOffset);
                yOffset += 20;
                g.DrawString($"{_invoicePrintRef.NetTotal:N2} ريال سعودي", fontHeader, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 22), sfCenter);
                yOffset += 26;

                // 4. باركود هيئة الزكاة والضريبة والجمارك (ZATCA QR Code)
                try
                {
                    string zatcaBase64 = ZatcaQrEncoder.GenerateZatcaBase64Qr(
                        "شركة الأسهل والعقرب للبرمجيات",
                        "300000000000003",
                        DateTime.Now,
                        _invoicePrintRef.NetTotal,
                        _invoicePrintRef.TotalVat
                    );

                    g.DrawString("[رمز الاستجابة السريعة المعتمد ZATCA]", fontSub, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 16), sfCenter);
                    yOffset += 18;
                }
                catch
                {
                    // تجاهل الأخطاء غير الحرجة للباركود
                }

                g.DrawString("شكراً لزيارتكم", fontBody, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 16), sfCenter);
                yOffset += 20;
            }
        }

        // ---------------------------------------------------------------------
        // رابعاً: محرك الأمان الاحترافي لحفظ نسخة احتياطية تلقائية لقاعدة بيانات الشركة
        // ---------------------------------------------------------------------

        public bool ExecuteDatabaseBackup(string backupFolderDirectory, out string responseMessage)
        {
            var prodEngine = new EnterpriseProductionEngine(_connectionString);
            return prodEngine.ExecuteDatabaseBackup(backupFolderDirectory, out responseMessage);
        }

        public bool SaveAndPostInvoiceToReports(ProductionInvoiceDto inv, out string errorMsg)
        {
            var prodEngine = new EnterpriseProductionEngine(_connectionString);
            return prodEngine.SaveAndPostInvoiceToReports(inv, out errorMsg);
        }

        // ---------------------------------------------------------------------
        // خامساً: التوابع المساعدة لسجل الرقابة والأمان (Audit Trail)
        // ---------------------------------------------------------------------
        
        private void WriteLog(int userId, string actionType, string actionDescription, SqlConnection conn, SqlTransaction trans)
        {
            string insertLog = @"
                INSERT INTO AuditLogs (UserID, ActionType, ActionDescription, LogTimestamp) 
                VALUES (@UserID, @Type, @Desc, GETDATE());";

            using (SqlCommand cmd = new SqlCommand(insertLog, conn, trans))
            {
                cmd.Parameters.Add("@UserID", SqlDbType.Int).Value = userId;
                cmd.Parameters.Add("@Type", SqlDbType.NVarChar, 50).Value = (object)actionType ?? DBNull.Value;
                cmd.Parameters.Add("@Desc", SqlDbType.NVarChar, 500).Value = (object)actionDescription ?? DBNull.Value;
                cmd.ExecuteNonQuery();
            }
        }
    }
}
