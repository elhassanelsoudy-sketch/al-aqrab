using System;
using System.Data.SqlClient;

namespace EnterpriseERPProject.Data_Access_Layer
{
    /// <summary>
    /// إدارة وسلسلة الاتصال بقاعدة بيانات النظام المالي SQL Server (ERP_DB)
    /// </summary>
    public class DBConnection
    {
        private static string _connectionString = "Server=YOUR_SERVER;Database=ERP_DB;Trusted_Connection=True;MultipleActiveResultSets=True;";

        public static string ConnectionString
        {
            get => _connectionString;
            set => _connectionString = value;
        }

        public SqlConnection GetConnection()
        {
            return new SqlConnection(_connectionString);
        }
    }
}
