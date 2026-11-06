using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Drawing;
using System.Windows.Forms;
using EnterpriseERPProject.Business_Logic_Layer;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Presentation_Layer
{
    /// <summary>
    /// شاشة التحويل المخزني المباشر بين الفروع - نظام العقرب والأسهل انتربرايس
    /// </summary>
    public partial class FrmInterBranchTransfer : Form
    {
        private readonly TransferEngine _transferEngine = new TransferEngine();
        private readonly string _connectionString = DBConnection.ConnectionString;

        public FrmInterBranchTransfer()
        {
            InitializeComponent();
        }

        private void FrmInterBranchTransfer_Load(object sender, EventArgs e)
        {
            // تحديث شريط عنوان النافذة وبيانات المستخدم والفرع الحالي
            this.Text = UserSession.GetWindowHeader("برنامج العقرب المحاسبي - التحويل المخزني بين الفروع");
            txtFromBranch.Text = string.IsNullOrEmpty(UserSession.BranchName) ? "المركز الرئيسي - الرياض" : UserSession.BranchName;
            txtOperator.Text = $"{UserSession.CurrentUserName} ({UserSession.UserRole})";
            txtTransferDate.Text = DateTime.Now.ToString("yyyy/MM/dd HH:mm");

            LoadDestinationBranches();
            LoadProductsCatalog();
        }

        /// <summary>
        /// تحميل قائمة الفروع المتاح التحويل إليها في القائمة المنسدلة
        /// </summary>
        private void LoadDestinationBranches()
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    // استبعاد الفرع الحالي للمستخدم من القائمة المنسدلة تلقائياً
                    string query = "SELECT BranchID, BranchName FROM Branches WHERE BranchID <> @CurrentBranch ORDER BY BranchID;";
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@CurrentBranch", UserSession.CurrentBranchID > 0 ? UserSession.CurrentBranchID : 1);
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            var dt = new DataTable();
                            dt.Load(reader);
                            cmbToBranch.DisplayMember = "BranchName";
                            cmbToBranch.ValueMember = "BranchID";
                            cmbToBranch.DataSource = dt;
                        }
                    }
                }
            }
            catch
            {
                // قائمة فروع احتياطية في حال العمل بدون اتصال
                var dt = new DataTable();
                dt.Columns.Add("BranchID", typeof(int));
                dt.Columns.Add("BranchName", typeof(string));

                int current = UserSession.CurrentBranchID > 0 ? UserSession.CurrentBranchID : 1;
                if (current != 1) dt.Rows.Add(1, "المركز الرئيسي - الرياض");
                if (current != 2) dt.Rows.Add(2, "فرع عنيزة - القصيم");
                if (current != 3) dt.Rows.Add(3, "فرع بريدة - القصيم");

                cmbToBranch.DisplayMember = "BranchName";
                cmbToBranch.ValueMember = "BranchID";
                cmbToBranch.DataSource = dt;
            }
        }

        /// <summary>
        /// تحميل الأصناف في قائمة الاختيار السريع بالجدول
        /// </summary>
        private void LoadProductsCatalog()
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    string query = "SELECT ProductID, ProductCode, ProductName, CostPrice, CurrentStock FROM Products;";
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        var dt = new DataTable();
                        dt.Load(reader);
                        ColProductLookup.DataSource = dt;
                        ColProductLookup.DisplayMember = "ProductName";
                        ColProductLookup.ValueMember = "ProductID";
                    }
                }
            }
            catch { }
        }

        /// <summary>
        /// حدث تأكيد وتنفيذ التحويل وتعديل كميات الفروع وتوليد القيد المالي المزدوج
        /// </summary>
        private void btnConfirmTransfer_Click(object sender, EventArgs e)
        {
            if (cmbToBranch.SelectedValue == null)
            {
                MessageBox.Show("يرجى اختيار الفرع المستهدف المحول إليه.", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                cmbToBranch.Focus();
                return;
            }

            // بناء كائن أمر التحويل من واقع البيانات المحددة بالشاشة
            TransferOrder order = new TransferOrder
            {
                FromBranchID = UserSession.CurrentBranchID > 0 ? UserSession.CurrentBranchID : 1, // الفرع الحالي المسجل فيه الموظف آلياً
                ToBranchID = Convert.ToInt32(cmbToBranch.SelectedValue), // الفرع المستهدف المحول إليه
                Notes = txtNotes.Text.Trim(),
                Items = new List<TransferItem>()
            };

            // قراءة الأصناف المضافة في جدول الشاشة (Grid Loop)
            foreach (DataGridViewRow row in TransferGrid.Rows)
            {
                if (row.Cells["ProductID"].Value == null) continue;

                decimal qty = Convert.ToDecimal(row.Cells["Quantity"].Value ?? 0);
                if (qty <= 0) continue;

                order.Items.Add(new TransferItem
                {
                    ProductID = Convert.ToInt32(row.Cells["ProductID"].Value),
                    ProductCode = row.Cells["ProductCode"].Value?.ToString(),
                    ProductName = row.Cells["ProductName"].Value?.ToString(),
                    Quantity = qty,
                    CostPrice = Convert.ToDecimal(row.Cells["CostPrice"].Value ?? 0) // متوسط تكلفة الصنف
                });
            }

            if (order.Items.Count == 0)
            {
                MessageBox.Show("يرجى إدخال صنف واحد على الأقل بكمية صالحة أكبر من صفر.", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            // تأكيد العملية من المستخدم
            var confirmResult = MessageBox.Show(
                $"هل أنت متأكد من تحويل عدد ({order.Items.Count}) صنف إلى ({cmbToBranch.Text}) وتوليد القيد المالي فورياً؟",
                "تأكيد التحويل المخزني والمحاسبي",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question
            );

            if (confirmResult != DialogResult.Yes) return;

            // تنفيذ العملية عبر المحرك البرمجي وفحص النتيجة
            if (_transferEngine.ExecuteBranchTransfer(order, out string errorMsg))
            {
                MessageBox.Show("تمت عملية التحويل المخزني بنجاح، وتم تعديل كميات الفروع وتوليد القيد المالي المزدوج تبعا لها!", "نجاح العملية", MessageBoxButtons.OK, MessageBoxIcon.Information);
                TransferGrid.Rows.Clear();
                txtNotes.Clear();
                CalculateSummaryTotals();
            }
            else
            {
                MessageBox.Show($"فشلت عملية التحويل بسبب: {errorMsg}", "خطأ في النظام", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        /// <summary>
        /// تحديث بيانات الصنف والتكلفة الإجمالية عند تغيير الصنف أو الكمية
        /// </summary>
        private void TransferGrid_CellValueChanged(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;

            string colName = TransferGrid.Columns[e.ColumnIndex].Name;
            var row = TransferGrid.Rows[e.RowIndex];

            if (colName == "ColProductLookup")
            {
                if (row.Cells["ColProductLookup"].Value != null)
                {
                    int prodId = Convert.ToInt32(row.Cells["ColProductLookup"].Value);
                    row.Cells["ProductID"].Value = prodId;

                    // تعيين القيم التلقائية للصنف المختار
                    FetchProductDetails(prodId, row);
                }
            }
            else if (colName == "Quantity" || colName == "CostPrice")
            {
                decimal q = Convert.ToDecimal(row.Cells["Quantity"].Value ?? 0);
                decimal c = Convert.ToDecimal(row.Cells["CostPrice"].Value ?? 0);
                row.Cells["TotalCost"].Value = (q * c);
                CalculateSummaryTotals();
            }
        }

        private void FetchProductDetails(int productId, DataGridViewRow row)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    string query = "SELECT ProductCode, ProductName, CostPrice, CurrentStock FROM Products WHERE ProductID = @PID;";
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@PID", productId);
                        using (var reader = cmd.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                row.Cells["ProductCode"].Value = reader["ProductCode"];
                                row.Cells["ProductName"].Value = reader["ProductName"];
                                row.Cells["CostPrice"].Value = reader["CostPrice"];
                                row.Cells["Quantity"].Value = 1;
                                decimal cost = Convert.ToDecimal(reader["CostPrice"]);
                                row.Cells["TotalCost"].Value = cost;
                            }
                        }
                    }
                }
            }
            catch
            {
                row.Cells["ProductCode"].Value = $"P-{productId}";
                row.Cells["ProductName"].Value = $"صنف رقم {productId}";
                row.Cells["CostPrice"].Value = 50.00m;
                row.Cells["Quantity"].Value = 1;
                row.Cells["TotalCost"].Value = 50.00m;
            }
            CalculateSummaryTotals();
        }

        private void CalculateSummaryTotals()
        {
            decimal totalQty = 0;
            decimal totalCost = 0;
            int count = 0;

            foreach (DataGridViewRow row in TransferGrid.Rows)
            {
                if (row.IsNewRow || row.Cells["ProductID"].Value == null) continue;
                totalQty += Convert.ToDecimal(row.Cells["Quantity"].Value ?? 0);
                totalCost += Convert.ToDecimal(row.Cells["TotalCost"].Value ?? 0);
                count++;
            }

            lblTotalQty.Text = totalQty.ToString("N0");
            lblTotalCost.Text = totalCost.ToString("N2") + " ر.س";
            lblItemCount.Text = $"{count} صنف";
        }

        private void btnClear_Click(object sender, EventArgs e)
        {
            TransferGrid.Rows.Clear();
            txtNotes.Clear();
            CalculateSummaryTotals();
        }

        private void btnClose_Click(object sender, EventArgs e)
        {
            this.Close();
        }
    }
}
