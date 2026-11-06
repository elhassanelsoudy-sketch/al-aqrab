using System;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    public class ProductionInvoiceDto
    {
        public string InvoiceNumber { get; set; }
        public int CustomerID { get; set; }
        public int? ProjectID { get; set; }
        public decimal TotalBeforeVat { get; set; }
        public decimal TotalVat { get; set; }
        public decimal NetTotal { get; set; }
        public int BranchID { get; set; }
        public int UserID { get; set; }
        public string PaymentMethod { get; set; } // "Cash" , "Credit"
    }

    public class EnterpriseProductionEngine
    {
        private readonly string _connectionString;

        public EnterpriseProductionEngine()
        {
            _connectionString = !string.IsNullOrWhiteSpace(DBConnection.ConnectionString)
                ? DBConnection.ConnectionString
                : "Server=YOUR_SERVER;Database=ERP_DB;Trusted_Connection=True;";
        }

        public EnterpriseProductionEngine(string connectionString)
        {
            _connectionString = !string.IsNullOrWhiteSpace(connectionString)
                ? connectionString
                : "Server=YOUR_SERVER;Database=ERP_DB;Trusted_Connection=True;";
        }

        /// <summary>
        /// 1. توليد رقم فاتورة تسلسلي فريد ومحمي برمجياً من التضارب والتكرار داخل الشركة
        /// </summary>
        public string GenerateNextInvoiceNumber(int branchId, string invoiceTypePrefix = "INV")
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                return GenerateNextInvoiceNumber(branchId, conn, null, invoiceTypePrefix);
            }
        }

        /// <summary>
        /// توليد رقم الفاتورة التسلسلي ضمن نفس الـ SqlTransaction لضمان بقاء قفل (UPDLOCK, HOLDLOCK) فعالاً حتى إتمام الإدراج
        /// </summary>
        public string GenerateNextInvoiceNumber(int branchId, SqlConnection conn, SqlTransaction trans, string invoiceTypePrefix = "INV")
        {
            int prefixSubstrStart = (invoiceTypePrefix?.Length ?? 3) + 2; // بعد "INV-"
            // استخدام شرط قفل الجدول لمنع أي مستخدم آخر من جلب نفس الرقم في نفس اللحظة
            string query = $@"SELECT ISNULL(MAX(TRY_CAST(SUBSTRING(InvoiceNumber, {prefixSubstrStart}, LEN(InvoiceNumber)) AS INT)), 0) + 1 
                             FROM SalesInvoices WITH (UPDLOCK, HOLDLOCK)
                             WHERE BranchID = @BranchID AND InvoiceNumber LIKE @PrefixPattern";

            using (SqlCommand cmd = new SqlCommand(query, conn, trans))
            {
                cmd.Parameters.Add("@BranchID", SqlDbType.Int).Value = branchId;
                cmd.Parameters.Add("@PrefixPattern", SqlDbType.NVarChar, 50).Value = $"{invoiceTypePrefix}-%";
                int nextNumber = Convert.ToInt32(cmd.ExecuteScalar());
                return $"{invoiceTypePrefix}-{nextNumber:D6}"; // ينتج رقم مثل: INV-000001
            }
        }

        /// <summary>
        /// التأكد الآلي من وجود عمود IsPosted و ProjectID في جدول SalesInvoices قبل الحفظ والترحيل
        /// </summary>
        public void EnsurePostingSchemaColumns(SqlConnection conn, SqlTransaction trans = null)
        {
            string schemaFixSql = @"
                IF COL_LENGTH('SalesInvoices', 'IsPosted') IS NULL
                    ALTER TABLE SalesInvoices ADD IsPosted BIT NOT NULL DEFAULT 0;
                IF COL_LENGTH('SalesInvoices', 'ProjectID') IS NULL
                    ALTER TABLE SalesInvoices ADD ProjectID INT NULL;
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'JournalEntryDetails') AND COL_LENGTH('JournalEntryDetails', 'CostCenterID') IS NULL
                    ALTER TABLE JournalEntryDetails ADD CostCenterID INT NULL;";

            using (SqlCommand cmd = new SqlCommand(schemaFixSql, conn, trans))
            {
                cmd.ExecuteNonQuery();
            }
        }

        /// <summary>
        /// 2. الحفظ النهائي والترحيل الفوري للجداول المالية لحل مشكلة عدم ظهور الفاتورة في التقارير
        /// </summary>
        public bool SaveAndPostInvoiceToReports(ProductionInvoiceDto inv, out string errorMsg)
        {
            errorMsg = string.Empty;

            if (inv == null)
            {
                errorMsg = "بيانات الفاتورة غير صالحة.";
                return false;
            }

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                EnsurePostingSchemaColumns(conn);
                SqlTransaction trans = conn.BeginTransaction();

                try
                {
                    // جلب رقم الفاتورة التسلسلي الصحيح آلياً قبل الحفظ ضمن نفس المعاملة (Transaction)
                    inv.InvoiceNumber = GenerateNextInvoiceNumber(inv.BranchID, conn, trans);

                    // إدراج الفاتورة في جدول المبيعات مع الترحيل الفوري (IsPosted = 1)
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

                    // ترحيل رأس القيد لدفتر الأستاذ العام (الذي تقرأ منه تقارير ميزان الحسابات)
                    string insertJournal = @"INSERT INTO JournalEntries (EntryDate, ReferenceNumber, Description, BranchID, IsPosted) 
                                             VALUES (GETDATE(), @Ref, @Desc, @BranchID, 1); SELECT SCOPE_IDENTITY();";
                    int entryId;
                    using (SqlCommand cmd = new SqlCommand(insertJournal, conn, trans))
                    {
                        cmd.Parameters.AddWithValue("@Ref", inv.InvoiceNumber);
                        cmd.Parameters.AddWithValue("@Desc", $"قيد مبيعات تلقائي للفاتورة رقم {inv.InvoiceNumber}");
                        cmd.Parameters.AddWithValue("@BranchID", inv.BranchID);
                        entryId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    string insertLines = "INSERT INTO JournalEntryDetails (EntryID, AccountID, Debit, Credit, CostCenterID) VALUES (@EntryID, @AccID, @Deb, @Cred, @CCID)";

                    // سطر المدين: حساب الصندوق (101001) أو ذمم العملاء (103001)
                    bool isCash = inv.PaymentMethod == "Cash" || inv.PaymentMethod == "نقدي";
                    int debitAccount = isCash ? 101001 : 103001;
                    using (SqlCommand cmdLine = new SqlCommand(insertLines, conn, trans))
                    {
                        cmdLine.Parameters.AddWithValue("@EntryID", entryId);
                        cmdLine.Parameters.AddWithValue("@AccID", debitAccount);
                        cmdLine.Parameters.AddWithValue("@Deb", inv.NetTotal);
                        cmdLine.Parameters.AddWithValue("@Cred", 0m);
                        cmdLine.Parameters.AddWithValue("@CCID", (object)inv.ProjectID ?? DBNull.Value);
                        cmdLine.ExecuteNonQuery();
                    }

                    // سطر الدائن: حساب المبيعات (401001) صافي القيمة
                    using (SqlCommand cmdLine = new SqlCommand(insertLines, conn, trans))
                    {
                        cmdLine.Parameters.AddWithValue("@EntryID", entryId);
                        cmdLine.Parameters.AddWithValue("@AccID", 401001);
                        cmdLine.Parameters.AddWithValue("@Deb", 0m);
                        cmdLine.Parameters.AddWithValue("@Cred", inv.TotalBeforeVat);
                        cmdLine.Parameters.AddWithValue("@CCID", (object)inv.ProjectID ?? DBNull.Value);
                        cmdLine.ExecuteNonQuery();
                    }

                    // سطر الدائن للضريبة (202001)
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
                    errorMsg = ex.Message;
                    return false;
                }
            }
        }

        /// <summary>
        /// 3. محرك الأمان الاحترافي لحفظ نسخة احتياطية تلقائية لقاعدة بيانات الشركة لضمان عدم ضياع الحسابات
        /// </summary>
        public bool ExecuteDatabaseBackup(string backupFolderDirectory, out string responseMessage)
        {
            responseMessage = string.Empty;

            try
            {
                if (string.IsNullOrWhiteSpace(backupFolderDirectory))
                {
                    backupFolderDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Backups");
                }

                if (!Directory.Exists(backupFolderDirectory))
                {
                    Directory.CreateDirectory(backupFolderDirectory);
                }

                string backupFileName = $"ERP_DB_Backup_{DateTime.Now:yyyyMMdd_HHmmss}.bak";
                string fullPath = Path.Combine(backupFolderDirectory, backupFileName);

                string query = @"BACKUP DATABASE [ERP_DB] TO DISK = @BackupPath WITH NOFORMAT, NOINIT, NAME = N'ERP_DB-Full Database Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10";

                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        cmd.CommandTimeout = 300; // منح مهلة كافية للنسخ الاحتياطي لقواعد البيانات الكبيرة
                        cmd.Parameters.Add("@BackupPath", SqlDbType.NVarChar, 500).Value = fullPath;
                        cmd.ExecuteNonQuery();
                        responseMessage = $"تم إنشاء النسخة الاحتياطية بنجاح في المسار: {fullPath}";
                        return true;
                    }
                }
            }
            catch (Exception ex)
            {
                responseMessage = $"فشل عمل النسخة الاحتياطية: {ex.Message}";
                return false;
            }
        }
    }
}

