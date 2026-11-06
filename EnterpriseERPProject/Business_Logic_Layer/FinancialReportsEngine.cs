using System;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    /// <summary>
    /// نموذج نتائج تقرير الأرباح والخسائر وقائمة الدخل (P&L Report Result)
    /// </summary>
    public class NetProfitReportResult
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? BranchID { get; set; }
        public decimal TotalRevenues { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetProfit => TotalRevenues - TotalExpenses;
        public bool IsProfit => NetProfit >= 0;
        public string Status => IsProfit ? "صافي ربح" : "صافي خسارة";
    }

    /// <summary>
    /// محرك التقارير المالية والحسابات الختامية (Financial Reports & P&L Engine)
    /// </summary>
    public class FinancialReportsEngine
    {
        private readonly string _connString = "Server=YOUR_SERVER;Database=ERP_DB;Trusted_Connection=True;";

        public FinancialReportsEngine() { }

        public FinancialReportsEngine(string connString)
        {
            _connString = connString;
        }

        /// <summary>
        /// احتساب صافي الربح المحاسبي لفترة محددة ولفرع محدد (متزامن)
        /// صافي الربح = إجمالي الإيرادات (Credit - Debit) - إجمالي المصروفات وتكلفة البضاعة (Debit - Credit)
        /// </summary>
        public decimal CalculateNetProfit(DateTime start, DateTime end, int? branchId)
        {
            decimal revenues = 0;
            decimal expenses = 0;

            using (SqlConnection conn = new SqlConnection(_connString))
            {
                conn.Open();

                // 1. حساب حركات الإيرادات الدائنة (Revenues: Credit - Debit)
                string revQuery = @"SELECT SUM(d.Credit - d.Debit) FROM JournalEntryDetails d
                                    JOIN JournalEntries e ON d.EntryID = e.EntryID
                                    JOIN Accounts a ON d.AccountID = a.AccountID
                                    WHERE a.AccountType = 'Revenue' AND e.EntryDate BETWEEN @Start AND @End";
                if (branchId.HasValue) revQuery += " AND e.BranchID = @BranchID";

                using (SqlCommand cmd = new SqlCommand(revQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@Start", start);
                    cmd.Parameters.AddWithValue("@End", end);
                    if (branchId.HasValue) cmd.Parameters.AddWithValue("@BranchID", branchId.Value);
                    var res = cmd.ExecuteScalar();
                    revenues = res != DBNull.Value ? Convert.ToDecimal(res) : 0;
                }

                // 2. حساب حركات المصروفات المدينة (Expenses & COGS: Debit - Credit)
                string expQuery = @"SELECT SUM(d.Debit - d.Credit) FROM JournalEntryDetails d
                                    JOIN JournalEntries e ON d.EntryID = e.EntryID
                                    JOIN Accounts a ON d.AccountID = a.AccountID
                                    WHERE a.AccountType = 'Expense' AND e.EntryDate BETWEEN @Start AND @End";
                if (branchId.HasValue) expQuery += " AND e.BranchID = @BranchID";

                using (SqlCommand cmd = new SqlCommand(expQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@Start", start);
                    cmd.Parameters.AddWithValue("@End", end);
                    if (branchId.HasValue) cmd.Parameters.AddWithValue("@BranchID", branchId.Value);
                    var res = cmd.ExecuteScalar();
                    expenses = res != DBNull.Value ? Convert.ToDecimal(res) : 0;
                }
            }

            // المعادلة المحاسبية الختامية
            return revenues - expenses;
        }

        /// <summary>
        /// النسخة غير المتزامنة المحسنة في استعلام موحد واحد (Single-Pass Query) لرفع كفاءة التقارير
        /// </summary>
        public async Task<NetProfitReportResult> CalculateNetProfitAsync(DateTime start, DateTime end, int? branchId = null)
        {
            var result = new NetProfitReportResult
            {
                StartDate = start,
                EndDate = end,
                BranchID = branchId
            };

            using (SqlConnection conn = new SqlConnection(_connString))
            {
                await conn.OpenAsync();

                string query = @"
                    SELECT 
                        ISNULL(SUM(CASE WHEN a.AccountType = 'Revenue' THEN (d.Credit - d.Debit) ELSE 0 END), 0) AS TotalRevenues,
                        ISNULL(SUM(CASE WHEN a.AccountType = 'Expense' THEN (d.Debit - d.Credit) ELSE 0 END), 0) AS TotalExpenses
                    FROM JournalEntryDetails d
                    INNER JOIN JournalEntries e ON d.EntryID = e.EntryID
                    INNER JOIN Accounts a ON d.AccountID = a.AccountID
                    WHERE a.AccountType IN ('Revenue', 'Expense')
                      AND e.EntryDate BETWEEN @Start AND @End";

                if (branchId.HasValue) query += " AND e.BranchID = @BranchID";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.Add("@Start", SqlDbType.DateTime).Value = start;
                    cmd.Parameters.Add("@End", SqlDbType.DateTime).Value = end;
                    if (branchId.HasValue) cmd.Parameters.Add("@BranchID", SqlDbType.Int).Value = branchId.Value;

                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            result.TotalRevenues = reader["TotalRevenues"] != DBNull.Value ? Convert.ToDecimal(reader["TotalRevenues"]) : 0;
                            result.TotalExpenses = reader["TotalExpenses"] != DBNull.Value ? Convert.ToDecimal(reader["TotalExpenses"]) : 0;
                        }
                    }
                }
            }

            return result;
        }
    }
}
