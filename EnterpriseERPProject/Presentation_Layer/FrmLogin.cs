using System;
using System.Data;
using System.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Presentation_Layer
{
    public partial class FrmLogin : Form
    {
        private readonly DBConnection _dbConn = new DBConnection();

        public FrmLogin()
        {
            InitializeComponent();
        }

        /// <summary>
        /// حدث الضغط على زر تسجيل الدخول
        /// </summary>
        private async void btnLogin_Click(object sender, EventArgs e)
        {
            string username = txtUsername.Text.Trim();
            string password = txtPassword.Text.Trim();

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                MessageBox.Show("يرجى إدخال اسم المستخدم وكلمة المرور.", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtUsername.Focus();
                return;
            }

            btnLogin.Enabled = false;
            Cursor = Cursors.WaitCursor;

            try
            {
                using (SqlConnection conn = _dbConn.GetConnection())
                {
                    await conn.OpenAsync();

                    // استعلام التحقق من الموظف وجلب اسمه وفرعه الفعلي
                    string query = @"
                        SELECT 
                            u.UserID, 
                            ISNULL(u.FullName, u.Username) AS FullName, 
                            u.Role, 
                            u.BranchID,
                            ISNULL(b.BranchName, N'المركز الرئيسي') AS BranchName
                        FROM Users u
                        LEFT JOIN Branches b ON u.BranchID = b.BranchID
                        WHERE u.Username = @User 
                          AND (u.Password = @Pass OR u.Password = @HashPass)
                          AND u.IsActive = 1";

                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        cmd.Parameters.Add("@User", SqlDbType.NVarChar, 50).Value = username;
                        cmd.Parameters.Add("@Pass", SqlDbType.NVarChar, 100).Value = password;
                        cmd.Parameters.Add("@HashPass", SqlDbType.NVarChar, 100).Value = ComputeSha256Hash(password);

                        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                int userId = Convert.ToInt32(reader["UserID"]);
                                string userName = reader["FullName"].ToString();
                                int branchId = Convert.ToInt32(reader["BranchID"]);
                                string branchName = reader["BranchName"].ToString();
                                string role = reader["Role"].ToString();

                                // 1. حقن بيانات الموظف والفرع داخل الـ UserSession الثابتة لإدارة أمان النظام بالكامل
                                UserSession.Initialize(userId, userName, branchId, branchName, role);

                                MessageBox.Show($"مرحباً بك {userName}!\nتم تسجيل الدخول بنجاح.\nالفرع: {branchName}\nالصلاحية: {role}", 
                                    "تسجيل الدخول ناجح", MessageBoxButtons.OK, MessageBoxIcon.Information);

                                // 2. فتح شاشة الفواتير الرئيسية وإخفاء شاشة تسجيل الدخول
                                FrmSalesInvoice mainInvoiceForm = new FrmSalesInvoice();
                                mainInvoiceForm.FormClosed += (s, args) => this.Close(); // إغلاق التطبيق كاملاً عند إغلاق الشاشة الرئيسية
                                mainInvoiceForm.Show();
                                this.Hide();
                            }
                            else
                            {
                                MessageBox.Show("اسم المستخدم أو كلمة المرور غير صحيحة، أو تم تعطيل هذا الحساب من قبل الإدارة.", 
                                    "خطأ في الدخول", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                txtPassword.Clear();
                                txtPassword.Focus();
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"فشل الاتصال بقاعدة البيانات:\n{ex.Message}\n\nيرجى التأكد من تشغيل خادم SQL Server وسلسلة الاتصال.", 
                    "خطأ نظام", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                btnLogin.Enabled = true;
                Cursor = Cursors.Default;
            }
        }

        /// <summary>
        /// تشفير كلمة المرور بـ SHA-256 للمطابقة المحاسبية الآمنة
        /// </summary>
        private static string ComputeSha256Hash(string rawData)
        {
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }

        // دعم الضغط على زر Enter لتسجيل الدخول السريع
        private void txtPassword_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                btnLogin_Click(this, EventArgs.Empty);
            }
        }
    }
}
