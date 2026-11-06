using System;
using System.Data;
using System.Data.SqlClient;
using System.Windows.Forms;
using EnterpriseERPProject.Business_Logic_Layer;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Presentation_Layer
{
    /// <summary>
    /// شاشة معالجة فاتورة المبيعات الإلكترونية لنظام الأسهل والعقرب (Sales Invoice WinForms)
    /// </summary>
    public partial class FrmSalesInvoice : Form
    {
        private readonly string _connectionString = DBConnection.ConnectionString;

        public FrmSalesInvoice()
        {
            InitializeComponent();
        }

        private void FrmSalesInvoice_Load(object sender, EventArgs e)
        {
            // تحديث شريط عنوان النافذة بناءً على جلسة المستخدم الحالية
            this.Text = UserSession.GetWindowHeader("برنامج العقرب المحاسبي - فاتورة المبيعات الإلكترونية");
            txtBranch.Text = UserSession.BranchName;
            txtCashier.Text = UserSession.CurrentUserName;
            txtInvoiceDate.Text = DateTime.Now.ToString("yyyy/MM/dd");

            try
            {
                var prodEngine = new EnterpriseProductionEngine(_connectionString);
                txtInvoiceNumber.Text = prodEngine.GenerateNextInvoiceNumber(UserSession.CurrentBranchID, "INV");
            }
            catch
            {
                if (string.IsNullOrWhiteSpace(txtInvoiceNumber.Text))
                    txtInvoiceNumber.Text = "INV-000001";
            }
        }

        /// <summary>
        /// 1. حدث تغيير السعر أو الكمية أو الخصم في سطر جدول المنتجات
        /// </summary>
        private void ProductsGrid_CellValueChanged(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;

            string colName = ProductsGrid.Columns[e.ColumnIndex].Name;
            if (colName == "Quantity" || colName == "Price" || colName == "Discount")
            {
                var row = ProductsGrid.Rows[e.RowIndex];

                // 1. جلب القيم المدخلة من السطر الحالي
                decimal quantity = row.Cells["Quantity"].Value != null ? Convert.ToDecimal(row.Cells["Quantity"].Value) : 0;
                decimal price = row.Cells["Price"].Value != null ? Convert.ToDecimal(row.Cells["Price"].Value) : 0;
                decimal discount = row.Cells["Discount"].Value != null ? Convert.ToDecimal(row.Cells["Discount"].Value) : 0;
                decimal vatPercent = 0.15m; // نسبة الضريبة المعتمدة في السعودية 15%

                // 2. معادلة حساب الإجمالي قبل الضريبة (الصافي بعد الخصم)
                decimal subTotal = Math.Max(0, (quantity * price) - discount);
                row.Cells["SubTotal"].Value = subTotal;

                // 3. معادلة حساب قيمة ضريبة القيمة المضافة بناءً على الصافي الخاضع للضريبة
                decimal vatAmount = subTotal * vatPercent;
                row.Cells["VatAmount"].Value = vatAmount;

                // 4. تحديث إجماليات الفاتورة أسفل الشاشة آلياً
                CalculateInvoiceTotals();
            }
        }

        /// <summary>
        /// 2. تجميع إجماليات الفاتورة وتحديث مربعات العرض ورمز ZATCA QR وشاشة LCD
        /// </summary>
        private void CalculateInvoiceTotals()
        {
            decimal totalBeforeVat = 0;
            decimal totalVat = 0;

            // المرور على كل الأسطر الممتلئة في الجدول
            foreach (DataGridViewRow row in ProductsGrid.Rows)
            {
                if (row.Cells["SubTotal"].Value != null)
                {
                    totalBeforeVat += Convert.ToDecimal(row.Cells["SubTotal"].Value);
                    totalVat += Convert.ToDecimal(row.Cells["VatAmount"].Value);
                }
            }

            // عرض النتائج في الـ TextBoxes أسفل الشاشة تماماً مثل الأسهل
            txtInvoiceTotal.Text = totalBeforeVat.ToString("N2"); // إجمالي الفاتورة قبل الضريبة
            txtVatTotal.Text = totalVat.ToString("N2");           // إجمالي الضريبة 15%
            
            decimal netTotal = totalBeforeVat + totalVat;
            txtNetTotal.Text = netTotal.ToString("N2");           // صافي الفاتورة النهائي
            lblDigitalLcd.Text = netTotal.ToString("N2");         // شاشة الـ LCD الرقمية الخضراء

            // توليد رمز ZATCA QR المعتمد
            try
            {
                string qrBase64 = ZatcaQrEncoder.GenerateZatcaBase64Qr(
                    UserSession.BranchName, 
                    "310485923800003", 
                    DateTime.Now, 
                    netTotal, 
                    totalVat
                );
                // picZatcaQr.Image = RenderQrCode(qrBase64);
            }
            catch { }
        }

        /// <summary>
        /// 3. حفظ الفاتورة وتطبيق الحركات المخزنية ومعاملة الأمان SQL Transaction
        /// </summary>
        private void btnSave_Click(object sender, EventArgs e)
        {
            CalculateInvoiceTotals();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                SqlTransaction transaction = conn.BeginTransaction();

                try
                {
                    var prodEngine = new EnterpriseProductionEngine(_connectionString);
                    if (string.IsNullOrWhiteSpace(txtInvoiceNumber.Text) || txtInvoiceNumber.Text.StartsWith("INV-"))
                    {
                        txtInvoiceNumber.Text = prodEngine.GenerateNextInvoiceNumber(UserSession.CurrentBranchID, conn, transaction, "INV");
                    }

                    // 1. حفظ رأس الفاتورة في جدول SalesInvoices مع الترحيل الفوري (IsPosted = 1)
                    string insertInvoiceQuery = @"
                        INSERT INTO SalesInvoices 
                            (InvoiceNumber, InvoiceDate, PaymentMethod, CustomerID, TotalBeforeVat, TotalVat, NetTotal, BranchID, CreatedBy, IsPosted) 
                        VALUES 
                            (@InvNo, @InvDate, @PayMethod, @CustomerID, @TotalBeforeVat, @TotalVat, @NetTotal, @BranchID, @CreatedBy, 1);
                        SELECT SCOPE_IDENTITY();";

                    int invoiceId;
                    using (SqlCommand cmd = new SqlCommand(insertInvoiceQuery, conn, transaction))
                    {
                        cmd.Parameters.AddWithValue("@InvNo", txtInvoiceNumber.Text);
                        cmd.Parameters.AddWithValue("@InvDate", DateTime.Now);
                        cmd.Parameters.AddWithValue("@PayMethod", cmbPaymentMethod.SelectedItem?.ToString() ?? "نقدي");
                        cmd.Parameters.AddWithValue("@CustomerID", cmbCustomers.SelectedValue ?? 1);
                        cmd.Parameters.AddWithValue("@TotalBeforeVat", Convert.ToDecimal(txtInvoiceTotal.Text));
                        cmd.Parameters.AddWithValue("@TotalVat", Convert.ToDecimal(txtVatTotal.Text));
                        cmd.Parameters.AddWithValue("@NetTotal", Convert.ToDecimal(txtNetTotal.Text));
                        cmd.Parameters.AddWithValue("@BranchID", UserSession.CurrentBranchID);
                        cmd.Parameters.AddWithValue("@CreatedBy", UserSession.CurrentUserName);

                        invoiceId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    // 2. حفظ أسطر الفاتورة وخصم الكميات من المخزون فورياً
                    string insertDetailQuery = @"
                        INSERT INTO SalesInvoiceDetails (InvoiceID, ProductID, Quantity, Price, Discount, SubTotal, VatAmount) 
                        VALUES (@InvID, @ProdID, @Qty, @Price, @Disc, @SubTotal, @VatAmount);";

                    string updateStockQuery = @"
                        UPDATE Products 
                        SET CurrentStock = CurrentStock - @Qty 
                        WHERE ProductID = @ProdID;";

                    foreach (DataGridViewRow row in ProductsGrid.Rows)
                    {
                        if (row.Cells["ProductID"].Value == null) continue;

                        int productId = Convert.ToInt32(row.Cells["ProductID"].Value);
                        decimal qty = Convert.ToDecimal(row.Cells["Quantity"].Value);
                        decimal price = Convert.ToDecimal(row.Cells["Price"].Value);
                        decimal disc = Convert.ToDecimal(row.Cells["Discount"].Value);
                        decimal subTotal = Convert.ToDecimal(row.Cells["SubTotal"].Value);
                        decimal vatAmount = Convert.ToDecimal(row.Cells["VatAmount"].Value);

                        using (SqlCommand cmdDetail = new SqlCommand(insertDetailQuery, conn, transaction))
                        {
                            cmdDetail.Parameters.AddWithValue("@InvID", invoiceId);
                            cmdDetail.Parameters.AddWithValue("@ProdID", productId);
                            cmdDetail.Parameters.AddWithValue("@Qty", qty);
                            cmdDetail.Parameters.AddWithValue("@Price", price);
                            cmdDetail.Parameters.AddWithValue("@Disc", disc);
                            cmdDetail.Parameters.AddWithValue("@SubTotal", subTotal);
                            cmdDetail.Parameters.AddWithValue("@VatAmount", vatAmount);
                            cmdDetail.ExecuteNonQuery();
                        }

                        // خصم المخزون
                        using (SqlCommand cmdStock = new SqlCommand(updateStockQuery, conn, transaction))
                        {
                            cmdStock.Parameters.AddWithValue("@Qty", qty);
                            cmdStock.Parameters.AddWithValue("@ProdID", productId);
                            cmdStock.ExecuteNonQuery();
                        }
                    }

                    // 3. توليد القيد المحاسبي المزدوج الآلي في اليومية العامة
                    GenerateAutoJournalEntry(invoiceId, conn, transaction);

                    transaction.Commit();

                    // 4. المزامنة السحابية غير المتزامنة مع Firebase في الخلفية دون تعطيل الكاشير
                    _ = Task.Run(async () =>
                    {
                        var cloudDto = new FirebaseInvoiceDto
                        {
                            InvoiceNumber = txtInvoiceNumber.Text,
                            InvoiceDate = DateTime.Now.ToString("yyyy-MM-dd"),
                            BranchID = UserSession.CurrentBranchID,
                            BranchName = UserSession.BranchName,
                            TotalBeforeVat = Convert.ToDecimal(txtInvoiceTotal.Text),
                            TotalVat = Convert.ToDecimal(txtVatTotal.Text),
                            NetTotal = Convert.ToDecimal(txtNetTotal.Text),
                            PaymentMethod = cmbPaymentMethod.SelectedItem?.ToString() ?? "نقدي",
                            CreatedBy = UserSession.CurrentUserName
                        };
                        await FirebaseSyncEngine.UploadInvoiceToCloud(cloudDto);
                    });

                    MessageBox.Show($"✓ تم حفظ وترحيل فاتورة المبيعات رقم {txtInvoiceNumber.Text} وتوليد القيد المحاسبي وتحديث المخزون بنجاح.", 
                        "نجاح الترحيل", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    MessageBox.Show($"فشل حفظ الفاتورة: {ex.Message}", "خطأ في الترحيل", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        /// <summary>
        /// 4. توليد القيد المحاسبي المزدوج المتوازن تلقائياً للفاتورة
        /// </summary>
        private void GenerateAutoJournalEntry(int invoiceId, SqlConnection conn, SqlTransaction trans)
        {
            decimal netTotal = Convert.ToDecimal(txtNetTotal.Text);
            decimal totalBeforeVat = Convert.ToDecimal(txtInvoiceTotal.Text);
            decimal totalVat = Convert.ToDecimal(txtVatTotal.Text);

            string insertJournalQuery = @"
                INSERT INTO JournalEntries (EntryDate, ReferenceNumber, Description, BranchID, IsPosted, CreatedBy) 
                VALUES (GETDATE(), @Ref, @Desc, @BranchID, 1, @CreatedBy); 
                SELECT SCOPE_IDENTITY();";
            
            int entryId;
            using (SqlCommand cmd = new SqlCommand(insertJournalQuery, conn, trans))
            {
                cmd.Parameters.AddWithValue("@Ref", txtInvoiceNumber.Text);
                cmd.Parameters.AddWithValue("@Desc", $"قيد آلي ناتج عن فاتورة مبيعات رقم {txtInvoiceNumber.Text} ({UserSession.BranchName})");
                cmd.Parameters.AddWithValue("@BranchID", UserSession.CurrentBranchID);
                cmd.Parameters.AddWithValue("@CreatedBy", UserSession.CurrentUserName);
                entryId = Convert.ToInt32(cmd.ExecuteScalar());
            }

            string insertLinesQuery = @"
                INSERT INTO JournalEntryDetails (EntryID, AccountID, Debit, Credit, LineDescription) 
                VALUES (@EntryID, @AccID, @Deb, @Cred, @LineDesc);";

            // تحديد حساب المدين: الصندوق للنقدي أو العميل للآجل
            bool isCredit = cmbPaymentMethod.SelectedItem?.ToString() == "آجل";
            int debitAccountID = isCredit ? 110201 : 110101; // حـ/ العملاء أو الصندوق

            var lines = new[]
            {
                new { AccID = debitAccountID, Debit = netTotal, Credit = 0m, Desc = $"مقبوضات فاتورة مبيعات {txtInvoiceNumber.Text}" },
                new { AccID = 4101, Debit = 0m, Credit = totalBeforeVat, Desc = $"إيراد مبيعات بضاعة فاتورة {txtInvoiceNumber.Text}" },
                new { AccID = 2102, Debit = 0m, Credit = totalVat, Desc = $"ضريبة مخرجات 15% فاتورة {txtInvoiceNumber.Text}" }
            };

            foreach (var l in lines)
            {
                using (SqlCommand cmdLine = new SqlCommand(insertLinesQuery, conn, trans))
                {
                    cmdLine.Parameters.AddWithValue("@EntryID", entryId);
                    cmdLine.Parameters.AddWithValue("@AccID", l.AccID);
                    cmdLine.Parameters.AddWithValue("@Deb", l.Debit);
                    cmdLine.Parameters.AddWithValue("@Cred", l.Credit);
                    cmdLine.Parameters.AddWithValue("@LineDesc", l.Desc);
                    cmdLine.ExecuteNonQuery();
                }
            }
        }
    }
}
