using System;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;

namespace EnterpriseERPProject.Data_Access_Layer
{
    /// <summary>
    /// طبقة الوصول للبيانات الخاصة بالفروع مع تطبيق العزل البرمجي الآمن (Multi-Branch Isolation)
    /// </summary>
    public class BranchDataLayer
    {
        private string _connectionString = "Server=YOUR_SERVER;Database=ERP_DB;Trusted_Connection=True;";

        public BranchDataLayer() { }

        public BranchDataLayer(string connectionString)
        {
            _connectionString = connectionString;
        }

        /// <summary>
        /// دالة جلب الفواتير المفلترة آلياً بحسب صلاحية المستخدم وفرعه (متزامنة)
        /// </summary>
        public DataTable GetSalesInvoices()
        {
            var dt = new DataTable("SalesInvoices");
            using (var conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                // السيناريو: إذا كان مسؤولاً يرى كل شيء، وإذا كان كاشير يرى فرعه فقط برمجياً
                string query = "SELECT * FROM SalesInvoices WHERE 1=1";
                
                if (UserSession.UserRole != "Admin")
                {
                    query += " AND BranchID = @BranchID";
                }

                using (var cmd = new SqlCommand(query, conn))
                {
                    if (UserSession.UserRole != "Admin")
                    {
                        cmd.Parameters.AddWithValue("@BranchID", UserSession.CurrentBranchID);
                    }

                    using (var adapter = new SqlDataAdapter(cmd))
                    {
                        adapter.Fill(dt);
                    }
                }
            }
            return dt;
        }

        /// <summary>
        /// النسخة غير المتزامنة عالية الأداء لبيئات الإنتاج (Non-blocking Async)
        /// </summary>
        public async Task<DataTable> GetSalesInvoicesAsync(DateTime? fromDate = null, DateTime? toDate = null)
        {
            var dt = new DataTable("SalesInvoices");
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                string query = @"
                    SELECT 
                        InvoiceID, InvoiceNumber, InvoiceDate, PaymentMethod, 
                        CustomerCode, CustomerName, TotalBeforeVat, TotalVat, 
                        NetTotal, BranchID, CreatedBy, IsPosted
                    FROM SalesInvoices 
                    WHERE 1=1";

                if (!UserSession.IsAdmin)
                {
                    query += " AND BranchID = @BranchID";
                }

                if (fromDate.HasValue) query += " AND InvoiceDate >= @FromDate";
                if (toDate.HasValue) query += " AND InvoiceDate <= @ToDate";

                query += " ORDER BY InvoiceDate DESC, InvoiceID DESC";

                using (var cmd = new SqlCommand(query, conn))
                {
                    if (!UserSession.IsAdmin)
                    {
                        cmd.Parameters.Add("@BranchID", SqlDbType.Int).Value = UserSession.CurrentBranchID;
                    }

                    if (fromDate.HasValue)
                        cmd.Parameters.Add("@FromDate", SqlDbType.DateTime).Value = fromDate.Value;

                    if (toDate.HasValue)
                        cmd.Parameters.Add("@ToDate", SqlDbType.DateTime).Value = toDate.Value;

                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        dt.Load(reader);
                    }
                }
            }
            return dt;
        }
    }
}
