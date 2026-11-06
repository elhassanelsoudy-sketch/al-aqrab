using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;
using System.Threading.Tasks;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    // =========================================================================
    // 1. النماذج البرمجية لكشوفات الحساب والطباعة
    // =========================================================================
    
    public class CustomerStatementRow
    {
        public DateTime TransactionDate { get; set; }
        public string ReferenceNumber { get; set; }
        public string Description { get; set; }
        public decimal Debit { get; set; }   // مستخلصات وفواتير آجلة صادرة عليه (مدين)
        public decimal Credit { get; set; }  // سندات قبض ومبالغ محصلة منه (دائن)
        public decimal Balance { get; set; } // الرصيد التراكمي المتغير
    }

    public class PrintableInvoiceItem
    {
        public string ItemName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Total => Quantity * UnitPrice;
    }

    public class PrintableInvoiceDto
    {
        public string InvoiceNumber { get; set; }
        public string DateStr { get; set; } = DateTime.Now.ToString("yyyy/MM/dd HH:mm");
        public string BranchName { get; set; }
        public string CashierName { get; set; }
        public string CustomerName { get; set; } = "عميل نقدي";
        public decimal SubTotal { get; set; }
        public decimal VatAmount { get; set; }
        public decimal NetTotal { get; set; }
        public string QrCodeBase64 { get; set; }
        public List<PrintableInvoiceItem> Items { get; set; } = new List<PrintableInvoiceItem>();
    }

    // =========================================================================
    // 2. المحرك البرمجي الموحد للتعرف على الطابعات وكشوف الحسابات
    // =========================================================================
    
    public class EnterpriseOperationsEngine
    {
        private readonly string _connectionString;
        private PrintableInvoiceDto _invoiceToPrint;

        public EnterpriseOperationsEngine()
        {
            _connectionString = DBConnection.ConnectionString;
        }

        public EnterpriseOperationsEngine(string connectionString)
        {
            _connectionString = string.IsNullOrWhiteSpace(connectionString) 
                ? DBConnection.ConnectionString 
                : connectionString;
        }

        // ---------------------------------------------------------------------
        // أولاً: نظام إدارة الطابعات المتعددة والطباعة الحرارية المباشرة (Direct POS Printing)
        // ---------------------------------------------------------------------

        /// <summary>
        /// جلب جميع الطابعات المثبتة على نظام التشغيل للاختيار منها في الإعدادات
        /// </summary>
        public List<string> GetInstalledPrinters()
        {
            var printersList = new List<string>();
            foreach (string printer in PrinterSettings.InstalledPrinters)
            {
                printersList.Add(printer);
            }
            return printersList;
        }

        /// <summary>
        /// إرسال الفاتورة الحرارية مباشرة لطابعة الكاشير المحددة دون فتح نافذة المعاينة
        /// </summary>
        public bool PrintPosInvoiceDirect(PrintableInvoiceDto invoice, string targetPrinterName, out string errorMsg)
        {
            errorMsg = string.Empty;
            _invoiceToPrint = invoice;

            if (_invoiceToPrint == null)
            {
                errorMsg = "بيانات الفاتورة المراد طباعتها غير متوفرة.";
                return false;
            }

            try
            {
                using (PrintDocument pd = new PrintDocument())
                {
                    // التحقق من اسم الطابعة أو استخدام الطابعة الافتراضية
                    if (!string.IsNullOrWhiteSpace(targetPrinterName))
                    {
                        pd.PrinterSettings.PrinterName = targetPrinterName;
                    }

                    if (!pd.PrinterSettings.IsValid)
                    {
                        errorMsg = $"طابعة الإيصالات المحددة '{targetPrinterName}' غير متصلة أو غير صالحة.";
                        return false;
                    }

                    // ربط محرك الرسم المخصص لورق الكاشير الحراري 80mm
                    pd.PrintPage += PrintPosLayoutHandler;
                    pd.Print();
                }

                return true;
            }
            catch (Exception ex)
            {
                errorMsg = $"خطأ أثناء عملية الطباعة: {ex.Message}";
                return false;
            }
        }

        /// <summary>
        /// رسم إيصال نقطة البيع الحراري برمجياً (Thermal POS Receipt Layout)
        /// </summary>
        private void PrintPosLayoutHandler(object sender, PrintPageEventArgs e)
        {
            Graphics g = e.Graphics;
            int yOffset = 10;
            int pageWidth = 280; // العرض القياسي لورق الفواتير الحراري 80mm

            using (Font fontHeader = new Font("Arial", 12, FontStyle.Bold))
            using (Font fontSubHeader = new Font("Arial", 9, FontStyle.Bold))
            using (Font fontBody = new Font("Arial", 8, FontStyle.Regular))
            using (Font fontBold = new Font("Arial", 8, FontStyle.Bold))
            using (StringFormat sfCenter = new StringFormat { Alignment = StringAlignment.Center })
            using (StringFormat sfRight = new StringFormat { Alignment = StringAlignment.Far })
            using (StringFormat sfLeft = new StringFormat { Alignment = StringAlignment.Near })
            {
                // 1. ترويسة الفاتورة والمنشأة
                g.DrawString("برنامج العقرب المحاسبي", fontHeader, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 20), sfCenter);
                yOffset += 22;
                g.DrawString("*** فاتورة ضريبية مبسطة ***", fontSubHeader, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 18), sfCenter);
                yOffset += 20;

                if (!string.IsNullOrEmpty(_invoiceToPrint.BranchName))
                {
                    g.DrawString($"الفرع: {_invoiceToPrint.BranchName}", fontBody, Brushes.Black, 10, yOffset);
                    yOffset += 16;
                }

                g.DrawString($"رقم الفاتورة: {_invoiceToPrint.InvoiceNumber}", fontBold, Brushes.Black, 10, yOffset);
                yOffset += 16;
                g.DrawString($"التاريخ: {_invoiceToPrint.DateStr}", fontBody, Brushes.Black, 10, yOffset);
                yOffset += 16;
                g.DrawString($"العميل: {_invoiceToPrint.CustomerName}", fontBody, Brushes.Black, 10, yOffset);
                yOffset += 16;

                if (!string.IsNullOrEmpty(_invoiceToPrint.CashierName))
                {
                    g.DrawString($"الكاشير: {_invoiceToPrint.CashierName}", fontBody, Brushes.Black, 10, yOffset);
                    yOffset += 16;
                }

                g.DrawLine(Pens.Black, 10, yOffset, pageWidth - 10, yOffset);
                yOffset += 6;

                // 2. تفاصيل الأصناف (إن وُجدت)
                if (_invoiceToPrint.Items != null && _invoiceToPrint.Items.Count > 0)
                {
                    g.DrawString("الصنف", fontBold, Brushes.Black, 10, yOffset);
                    g.DrawString("الكمية", fontBold, Brushes.Black, 140, yOffset);
                    g.DrawString("الإجمالي", fontBold, Brushes.Black, 220, yOffset);
                    yOffset += 16;
                    g.DrawLine(Pens.Gray, 10, yOffset, pageWidth - 10, yOffset);
                    yOffset += 5;

                    foreach (var item in _invoiceToPrint.Items)
                    {
                        g.DrawString(item.ItemName, fontBody, Brushes.Black, 10, yOffset);
                        g.DrawString($"{item.Quantity:N0}", fontBody, Brushes.Black, 145, yOffset);
                        g.DrawString($"{item.Total:N2}", fontBody, Brushes.Black, 220, yOffset);
                        yOffset += 16;
                    }

                    g.DrawLine(Pens.Black, 10, yOffset, pageWidth - 10, yOffset);
                    yOffset += 6;
                }

                // 3. الإجماليات والضريبة
                if (_invoiceToPrint.SubTotal > 0)
                {
                    g.DrawString("المبلغ الخاضع للضريبة:", fontBody, Brushes.Black, 10, yOffset);
                    g.DrawString($"{_invoiceToPrint.SubTotal:N2} ر.س", fontBody, Brushes.Black, new RectangleF(10, yOffset, pageWidth - 20, 16), sfRight);
                    yOffset += 16;
                }

                if (_invoiceToPrint.VatAmount > 0)
                {
                    g.DrawString("ضريبة القيمة المضافة (15%):", fontBody, Brushes.Black, 10, yOffset);
                    g.DrawString($"{_invoiceToPrint.VatAmount:N2} ر.س", fontBody, Brushes.Black, new RectangleF(10, yOffset, pageWidth - 20, 16), sfRight);
                    yOffset += 16;
                }

                g.DrawString("الصافي الإجمالي المطلوب:", fontHeader, Brushes.Black, 10, yOffset);
                yOffset += 20;
                g.DrawString($"{_invoiceToPrint.NetTotal:N2} ريال سعودي", fontHeader, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 22), sfCenter);
                yOffset += 26;

                // 4. رمز الاستجابة السريعة لهيئة الزكاة والضريبة والجمارك (ZATCA QR Code)
                if (!string.IsNullOrEmpty(_invoiceToPrint.QrCodeBase64))
                {
                    g.DrawLine(Pens.Gray, 10, yOffset, pageWidth - 10, yOffset);
                    yOffset += 8;

                    try
                    {
                        // فحص ما إذا كانت السلسلة صورة Base64 صريحة
                        byte[] imageBytes = Convert.FromBase64String(_invoiceToPrint.QrCodeBase64.Replace("data:image/png;base64,", ""));
                        using (MemoryStream ms = new MemoryStream(imageBytes))
                        using (Image qrImage = Image.FromStream(ms))
                        {
                            int qrSize = 100;
                            int qrX = (pageWidth - qrSize) / 2;
                            g.DrawImage(qrImage, qrX, yOffset, qrSize, qrSize);
                            yOffset += qrSize + 6;
                        }
                    }
                    catch
                    {
                        // في حال كانت السلسلة هي TLV الخام
                        g.DrawString("[رمز الاستجابة السريعة المعتمد ZATCA]", fontSubHeader, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 16), sfCenter);
                        yOffset += 18;
                    }

                    g.DrawString("شكراً لتعاملكم معنا", fontBody, Brushes.Black, new RectangleF(0, yOffset, pageWidth, 16), sfCenter);
                    yOffset += 20;
                }
            }
        }

        // ---------------------------------------------------------------------
        // ثانياً: نظام ومحرك كشف حساب العميل التفصيلي (المقاولات والشركات)
        // ---------------------------------------------------------------------

        /// <summary>
        /// استخراج كشف حساب مالي دقيق متوازن متضمناً الرصيد الافتتاحي السابق للفترة والرصيد التراكمي المتحرك
        /// </summary>
        public List<CustomerStatementRow> GetCustomerStatement(int customerAccountId, DateTime startDate, DateTime endDate)
        {
            var statement = new List<CustomerStatementRow>();
            decimal runningBalance = 0;

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                // 1. حساب الرصيد الافتتاحي المنقول لما قبل تاريخ بداية الكشف (Opening Balance before Start Date)
                // هذا الإجراء ضروري محاسبياً لحماية صحة الرصيد التراكمي عند طلب فترات محددة
                string openingBalanceQuery = @"
                    SELECT ISNULL(SUM(d.Debit - d.Credit), 0)
                    FROM JournalEntryDetails d
                    JOIN JournalEntries e ON d.EntryID = e.EntryID
                    WHERE d.AccountID = @AccountID AND e.EntryDate < @Start;";

                using (SqlCommand cmdOpening = new SqlCommand(openingBalanceQuery, conn))
                {
                    cmdOpening.Parameters.Add("@AccountID", SqlDbType.Int).Value = customerAccountId;
                    cmdOpening.Parameters.Add("@Start", SqlDbType.DateTime).Value = startDate;

                    object result = cmdOpening.ExecuteScalar();
                    if (result != null && result != DBNull.Value)
                    {
                        runningBalance = Convert.ToDecimal(result);
                    }
                }

                // إضافة سطر الرصيد الافتتاحي السابق في صدارة الكشف
                statement.Add(new CustomerStatementRow
                {
                    TransactionDate = startDate,
                    ReferenceNumber = "OP-BALANCE",
                    Description = "رصيد سابق منقول ما قبل الفترة",
                    Debit = runningBalance > 0 ? runningBalance : 0,
                    Credit = runningBalance < 0 ? Math.Abs(runningBalance) : 0,
                    Balance = runningBalance
                });

                // 2. استعلام استخراج القيود والحركات لدفتر الأستاذ المساعد للعميل خلال الفترة المحددة
                string query = @"
                    SELECT e.EntryDate, e.ReferenceNumber, e.Description, d.Debit, d.Credit
                    FROM JournalEntryDetails d
                    JOIN JournalEntries e ON d.EntryID = e.EntryID
                    WHERE d.AccountID = @AccountID 
                      AND e.EntryDate >= @Start 
                      AND e.EntryDate <= @End
                    ORDER BY e.EntryDate ASC, d.EntryID ASC;";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.Add("@AccountID", SqlDbType.Int).Value = customerAccountId;
                    cmd.Parameters.Add("@Start", SqlDbType.DateTime).Value = startDate;
                    cmd.Parameters.Add("@End", SqlDbType.DateTime).Value = endDate;

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            decimal debit = reader["Debit"] != DBNull.Value ? Convert.ToDecimal(reader["Debit"]) : 0;
                            decimal credit = reader["Credit"] != DBNull.Value ? Convert.ToDecimal(reader["Credit"]) : 0;

                            // الرصيد التراكمي للعميل (طبيعته مدين): يزيد بالمبيعات والمستخلصات وينقص بالدفعات والتحصيلات
                            runningBalance += (debit - credit);

                            statement.Add(new CustomerStatementRow
                            {
                                TransactionDate = Convert.ToDateTime(reader["EntryDate"]),
                                ReferenceNumber = reader["ReferenceNumber"] != DBNull.Value ? reader["ReferenceNumber"].ToString() : "",
                                Description = reader["Description"] != DBNull.Value ? reader["Description"].ToString() : "",
                                Debit = debit,
                                Credit = credit,
                                Balance = runningBalance
                            });
                        }
                    }
                }
            }

            return statement;
        }

        /// <summary>
        /// النسخة غير المتزامنة عالية الأداء لاستخراج كشف الحساب لمنع تجمد واجهة المستخدم (Async Data Loading)
        /// </summary>
        public async Task<List<CustomerStatementRow>> GetCustomerStatementAsync(int customerAccountId, DateTime startDate, DateTime endDate)
        {
            var statement = new List<CustomerStatementRow>();
            decimal runningBalance = 0;

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                // 1. حساب الرصيد الافتتاحي المنقول
                string openingBalanceQuery = @"
                    SELECT ISNULL(SUM(d.Debit - d.Credit), 0)
                    FROM JournalEntryDetails d
                    JOIN JournalEntries e ON d.EntryID = e.EntryID
                    WHERE d.AccountID = @AccountID AND e.EntryDate < @Start;";

                using (SqlCommand cmdOpening = new SqlCommand(openingBalanceQuery, conn))
                {
                    cmdOpening.Parameters.Add("@AccountID", SqlDbType.Int).Value = customerAccountId;
                    cmdOpening.Parameters.Add("@Start", SqlDbType.DateTime).Value = startDate;

                    object result = await cmdOpening.ExecuteScalarAsync();
                    if (result != null && result != DBNull.Value)
                    {
                        runningBalance = Convert.ToDecimal(result);
                    }
                }

                statement.Add(new CustomerStatementRow
                {
                    TransactionDate = startDate,
                    ReferenceNumber = "OP-BALANCE",
                    Description = "رصيد سابق منقول ما قبل الفترة",
                    Debit = runningBalance > 0 ? runningBalance : 0,
                    Credit = runningBalance < 0 ? Math.Abs(runningBalance) : 0,
                    Balance = runningBalance
                });

                // 2. جلب حركات الفترة
                string query = @"
                    SELECT e.EntryDate, e.ReferenceNumber, e.Description, d.Debit, d.Credit
                    FROM JournalEntryDetails d
                    JOIN JournalEntries e ON d.EntryID = e.EntryID
                    WHERE d.AccountID = @AccountID 
                      AND e.EntryDate >= @Start 
                      AND e.EntryDate <= @End
                    ORDER BY e.EntryDate ASC, d.EntryID ASC;";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.Add("@AccountID", SqlDbType.Int).Value = customerAccountId;
                    cmd.Parameters.Add("@Start", SqlDbType.DateTime).Value = startDate;
                    cmd.Parameters.Add("@End", SqlDbType.DateTime).Value = endDate;

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            decimal debit = reader["Debit"] != DBNull.Value ? Convert.ToDecimal(reader["Debit"]) : 0;
                            decimal credit = reader["Credit"] != DBNull.Value ? Convert.ToDecimal(reader["Credit"]) : 0;

                            runningBalance += (debit - credit);

                            statement.Add(new CustomerStatementRow
                            {
                                TransactionDate = Convert.ToDateTime(reader["EntryDate"]),
                                ReferenceNumber = reader["ReferenceNumber"] != DBNull.Value ? reader["ReferenceNumber"].ToString() : "",
                                Description = reader["Description"] != DBNull.Value ? reader["Description"].ToString() : "",
                                Debit = debit,
                                Credit = credit,
                                Balance = runningBalance
                            });
                        }
                    }
                }
            }

            return statement;
        }
    }
}
