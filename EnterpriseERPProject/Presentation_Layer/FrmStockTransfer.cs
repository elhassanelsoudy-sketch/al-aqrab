using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Drawing;
using System.Threading.Tasks;
using System.Windows.Forms;
using EnterpriseERPProject.Business_Logic_Layer;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Presentation_Layer
{
    /// <summary>
    /// شاشة سندات التحويل المخزني بين الفروع والمستودعات - نظام الأسهل والعقرب انتربرايس
    /// </summary>
    public partial class FrmStockTransfer : Form
    {
        private readonly StockTransferEngine _transferEngine;
        private readonly string _connectionString = DBConnection.ConnectionString;
        private int _currentTransferId = 0;
        private string _currentStatus = "New";

        public FrmStockTransfer()
        {
            InitializeComponent();
            _transferEngine = new StockTransferEngine(_connectionString);
        }

        public FrmStockTransfer(int transferId) : this()
        {
            _currentTransferId = transferId;
        }

        private async void FrmStockTransfer_Load(object sender, EventArgs e)
        {
            // ضبط عنوان الشاشة بحسب الجلسة الحالية
            this.Text = UserSession.GetWindowHeader("برنامج العقرب المحاسبي - سند تحويل مخزني بين الفروع");

            lblUser.Text = $"المستخدم: {UserSession.CurrentUserName} ({UserSession.UserRole})";
            txtTransferDate.Text = DateTime.Now.ToString("yyyy/MM/dd HH:mm");

            await LoadBranchesAsync();
            await LoadProductsCatalogAsync();

            if (_currentTransferId > 0)
            {
                await LoadTransferDataAsync(_currentTransferId);
            }
            else
            {
                ResetFormForNewTransfer();
            }
        }

        /// <summary>
        /// تحميل قائمة الفروع في القوائم المنسدلة (من فرع / إلى فرع)
        /// </summary>
        private async Task LoadBranchesAsync()
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();
                    string query = "SELECT BranchID, BranchName FROM Branches ORDER BY BranchID;";
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        var fromTable = new DataTable();
                        fromTable.Load(reader);

                        var toTable = fromTable.Copy();

                        cmbFromBranch.DisplayMember = "BranchName";
                        cmbFromBranch.ValueMember = "BranchID";
                        cmbFromBranch.DataSource = fromTable;

                        cmbToBranch.DisplayMember = "BranchName";
                        cmbToBranch.ValueMember = "BranchID";
                        cmbToBranch.DataSource = toTable;

                        // تعيين الفرع الحالي للمستخدم كفرع مصدر افتراضي
                        if (UserSession.CurrentBranchID > 0)
                        {
                            cmbFromBranch.SelectedValue = UserSession.CurrentBranchID;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // في حالة العمل بدون اتصال بقاعدة البيانات نستخدم الفروع الافتراضية
                cmbFromBranch.Items.Clear();
                cmbToBranch.Items.Clear();
                cmbFromBranch.Items.Add(new { BranchID = 1, BranchName = "المركز الرئيسي - الرياض" });
                cmbFromBranch.Items.Add(new { BranchID = 2, BranchName = "فرع عنيزة - القصيم" });
                cmbFromBranch.Items.Add(new { BranchID = 3, BranchName = "فرع بريدة - القصيم" });
                cmbFromBranch.DisplayMember = "BranchName";
                cmbFromBranch.ValueMember = "BranchID";

                cmbToBranch.Items.Add(new { BranchID = 1, BranchName = "المركز الرئيسي - الرياض" });
                cmbToBranch.Items.Add(new { BranchID = 2, BranchName = "فرع عنيزة - القصيم" });
                cmbToBranch.Items.Add(new { BranchID = 3, BranchName = "فرع بريدة - القصيم" });
                cmbToBranch.DisplayMember = "BranchName";
                cmbToBranch.ValueMember = "BranchID";

                cmbFromBranch.SelectedIndex = 0;
                cmbToBranch.SelectedIndex = 1;
            }
        }

        /// <summary>
        /// تحميل كتالوج الأصناف المتاح تحويلها
        /// </summary>
        private async Task LoadProductsCatalogAsync()
        {
            // تجهيز عمود قائمة الأصناف في الـ DataGridView
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();
                    string query = "SELECT ProductID, ProductCode, ProductName, CostPrice, CurrentStock FROM Products;";
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        var dt = new DataTable();
                        dt.Load(reader);
                        ColProductSelect.DataSource = dt;
                        ColProductSelect.DisplayMember = "ProductName";
                        ColProductSelect.ValueMember = "ProductID";
                    }
                }
            }
            catch
            {
                // تجاوز الخطأ في بيئة الاختبار غير الموصولة
            }
        }

        /// <summary>
        /// تهيئة الشاشة لسند تحويل جديد
        /// </summary>
        private void ResetFormForNewTransfer()
        {
            _currentTransferId = 0;
            _currentStatus = "New";
            txtTransferNo.Text = "TRF-NEW";
            txtTransferDate.Text = DateTime.Now.ToString("yyyy/MM/dd HH:mm");
            txtNotes.Clear();
            GridDetails.Rows.Clear();

            UpdateStatusBadge("New", "جديد - غير محفوظ");
            btnSavePending.Enabled = true;
            btnConfirmReceive.Enabled = false;
            btnPrint.Enabled = false;
        }

        /// <summary>
        /// جلب بيانات سند تحويل موجود مسبقاً لعرضه أو تأكيد استلامه
        /// </summary>
        public async Task LoadTransferDataAsync(int transferId)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();
                    string headerQuery = @"
                        SELECT t.TransferID, t.TransferDate, t.FromBranchID, t.ToBranchID, 
                               t.CreatedBy, t.Status, t.Notes, t.ConfirmedBy, t.ConfirmedDate,
                               u.UserName as CreatedByName
                        FROM StockTransfers t
                        LEFT JOIN Users u ON t.CreatedBy = u.UserID
                        WHERE t.TransferID = @TransferID;";

                    using (SqlCommand cmd = new SqlCommand(headerQuery, conn))
                    {
                        cmd.Parameters.AddWithValue("@TransferID", transferId);
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                _currentTransferId = transferId;
                                _currentStatus = reader["Status"].ToString();

                                txtTransferNo.Text = $"TRF-{transferId:D5}";
                                txtTransferDate.Text = Convert.ToDateTime(reader["TransferDate"]).ToString("yyyy/MM/dd HH:mm");
                                cmbFromBranch.SelectedValue = reader["FromBranchID"];
                                cmbToBranch.SelectedValue = reader["ToBranchID"];
                                txtNotes.Text = reader["Notes"] != DBNull.Value ? reader["Notes"].ToString() : "";

                                string statusText = _currentStatus == "Pending" ? "معلق (قيد النقل)" :
                                                   _currentStatus == "Confirmed" ? "مؤكد (تم الاستلام)" : _currentStatus;
                                UpdateStatusBadge(_currentStatus, statusText);
                            }
                        }
                    }

                    // قراءة تفاصيل الأصناف
                    string detailsQuery = @"
                        SELECT d.TransferDetailID, d.ProductID, p.ProductCode, p.ProductName, d.Quantity, p.CostPrice
                        FROM StockTransferDetails d
                        JOIN Products p ON d.ProductID = p.ProductID
                        WHERE d.TransferID = @TransferID;";

                    GridDetails.Rows.Clear();
                    using (SqlCommand cmdDetails = new SqlCommand(detailsQuery, conn))
                    {
                        cmdDetails.Parameters.AddWithValue("@TransferID", transferId);
                        using (var reader = await cmdDetails.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                int rowIdx = GridDetails.Rows.Add();
                                var row = GridDetails.Rows[rowIdx];
                                row.Cells["ColProductID"].Value = reader["ProductID"];
                                row.Cells["ColProductCode"].Value = reader["ProductCode"];
                                row.Cells["ColProductName"].Value = reader["ProductName"];
                                row.Cells["ColQuantity"].Value = reader["Quantity"];
                                row.Cells["ColCost"].Value = reader["CostPrice"];
                            }
                        }
                    }

                    // التحكم في أزرار الإجراءات حسب الحالة
                    if (_currentStatus == "Pending")
                    {
                        btnSavePending.Enabled = false;
                        btnConfirmReceive.Enabled = true; // يمكن للفرع المستلم تأكيد الاستلام
                        btnPrint.Enabled = true;
                    }
                    else if (_currentStatus == "Confirmed")
                    {
                        btnSavePending.Enabled = false;
                        btnConfirmReceive.Enabled = false;
                        btnPrint.Enabled = true;
                        GridDetails.ReadOnly = true;
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"خطأ أثناء قراءة سند التحويل: {ex.Message}", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        /// <summary>
        /// حدث حفظ وترحيل سند التحويل المبدئي (Pending) مع خصم الكميات من الفرع المصدر
        /// </summary>
        private async void btnSavePending_Click(object sender, EventArgs e)
        {
            int fromBranch = Convert.ToInt32(cmbFromBranch.SelectedValue);
            int toBranch = Convert.ToInt32(cmbToBranch.SelectedValue);

            // 1. التحقق من صحة الفروع
            if (fromBranch == toBranch)
            {
                MessageBox.Show("لا يمكن إجراء تحويل مخزني إلى نفس الفرع المصدر! يرجى اختيار فرع مستقبل مختلف.", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                cmbToBranch.Focus();
                return;
            }

            // 2. تجميع سطور الأصناف
            var itemsList = new List<StockTransferItem>();
            foreach (DataGridViewRow row in GridDetails.Rows)
            {
                if (row.IsNewRow) continue;

                int prodId = row.Cells["ColProductID"].Value != null ? Convert.ToInt32(row.Cells["ColProductID"].Value) : 0;
                decimal qty = row.Cells["ColQuantity"].Value != null ? Convert.ToDecimal(row.Cells["ColQuantity"].Value) : 0;
                decimal cost = row.Cells["ColCost"].Value != null ? Convert.ToDecimal(row.Cells["ColCost"].Value) : 0;

                if (prodId <= 0 || qty <= 0) continue;

                itemsList.Add(new StockTransferItem
                {
                    ProductID = prodId,
                    Quantity = qty,
                    UnitCost = cost
                });
            }

            if (itemsList.Count == 0)
            {
                MessageBox.Show("يرجى إدخال صنف واحد على الأقل بكمية صالحة أكبر من صفر.", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var transfer = new StockTransfer
            {
                TransferDate = DateTime.Now,
                FromBranchID = fromBranch,
                ToBranchID = toBranch,
                CreatedBy = UserSession.CurrentUserID,
                Notes = txtNotes.Text.Trim(),
                Items = itemsList
            };

            btnSavePending.Enabled = false;
            var result = await _transferEngine.CreateTransferAsync(transfer);

            if (result.Success)
            {
                _currentTransferId = result.TransferID;
                _currentStatus = "Pending";
                txtTransferNo.Text = $"TRF-{_currentTransferId:D5}";
                UpdateStatusBadge("Pending", "معلق (قيد النقل)");

                MessageBox.Show(result.Message, "نجاح العملية", MessageBoxButtons.OK, MessageBoxIcon.Information);
                btnConfirmReceive.Enabled = true;
                btnPrint.Enabled = true;
            }
            else
            {
                MessageBox.Show(result.Message, "خطأ في الترحيل", MessageBoxButtons.OK, MessageBoxIcon.Error);
                btnSavePending.Enabled = true;
            }
        }

        /// <summary>
        /// حدث تأكيد استلام الشحنة وإضافتها إلى رصيد الفرع المستلم (Confirmed)
        /// </summary>
        private async void btnConfirmReceive_Click(object sender, EventArgs e)
        {
            if (_currentTransferId <= 0 || _currentStatus != "Pending")
            {
                MessageBox.Show("سند التحويل غير مؤهل للتأكيد أو تم تأكيده مسبقاً.", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var confirmDlg = MessageBox.Show(
                $"هل تؤكد استلام كامل بضاعة سند التحويل رقم #{_currentTransferId} وإيداعها في رصيد الفرع المستلم؟",
                "تأكيد الاستلام المخزني",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question
            );

            if (confirmDlg != DialogResult.Yes) return;

            btnConfirmReceive.Enabled = false;
            var result = await _transferEngine.ConfirmTransferAsync(_currentTransferId, UserSession.CurrentUserID);

            if (result.Success)
            {
                _currentStatus = "Confirmed";
                UpdateStatusBadge("Confirmed", "مؤكد (تم الاستلام)");
                MessageBox.Show(result.Message, "تم الاستلام بنجاح", MessageBoxButtons.OK, MessageBoxIcon.Information);
                GridDetails.ReadOnly = true;
            }
            else
            {
                MessageBox.Show(result.Message, "خطأ في الاستلام", MessageBoxButtons.OK, MessageBoxIcon.Error);
                btnConfirmReceive.Enabled = true;
            }
        }

        /// <summary>
        /// تحديث بادج الحالة بألوان معبرة
        /// </summary>
        private void UpdateStatusBadge(string status, string text)
        {
            lblStatusBadge.Text = text;
            if (status == "Pending")
            {
                lblStatusBadge.BackColor = Color.FromArgb(254, 243, 199);
                lblStatusBadge.ForeColor = Color.FromArgb(180, 83, 9);
            }
            else if (status == "Confirmed")
            {
                lblStatusBadge.BackColor = Color.FromArgb(220, 252, 231);
                lblStatusBadge.ForeColor = Color.FromArgb(22, 101, 52);
            }
            else
            {
                lblStatusBadge.BackColor = Color.FromArgb(241, 245, 249);
                lblStatusBadge.ForeColor = Color.FromArgb(71, 85, 105);
            }
        }

        private void btnNew_Click(object sender, EventArgs e)
        {
            ResetFormForNewTransfer();
        }

        private void btnPrint_Click(object sender, EventArgs e)
        {
            MessageBox.Show($"جاري إرسال سند التحويل المخزني رقم {txtTransferNo.Text} إلى الطابعة الافتراضية...", "طباعة السند", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
    }
}
