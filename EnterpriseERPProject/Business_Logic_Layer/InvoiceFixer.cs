using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    /// <summary>
    /// نتيجة معالجة إصلاح وترحيل الفواتير غير المرحلة للتقارير
    /// </summary>
    public class InvoiceFixResult
    {
        public bool Success { get; set; }
        public int InvoiceID { get; set; }
        public string InvoiceNumber { get; set; }
        public int JournalEntryID { get; set; }
        public string Message { get; set; }
    }

    /// <summary>
    /// نتيجة الإصلاح الجماعي للفواتير المفقودة من التقارير المالية
    /// </summary>
    public class BatchInvoiceFixReport
    {
        public int TotalScanned { get; set; }
        public int SuccessfullyFixed { get; set; }
        public int FailedCount { get; set; }
        public decimal TotalAmountFixed { get; set; }
        public List<string> ErrorLogs { get; set; } = new List<string>();
    }

    /// <summary>
    /// أداة ومحرك إصلاح وترحيل فواتير المبيعات المتخلفة عن القيود المحاسبية لضمان ظهورها في ميزان المراجعة وقائمة الدخل
    /// </summary>
    public class InvoiceFixer
    {
        private readonly string _connectionString;

        public InvoiceFixer()
        {
            _connectionString = DBConnection.ConnectionString;
        }

        public InvoiceFixer(string connectionString)
        {
            _connectionString = string.IsNullOrWhiteSpace(connectionString) 
                ? DBConnection.ConnectionString 
                : connectionString;
        }

        /// <summary>
        /// التحقق التلقائي من وجود عمود IsPosted في جدول المبيعات والمشتريات وإضافته برمجياً إن لم يكن موجوداً
        /// </summary>
        public void EnsurePostingColumnsExist(SqlConnection conn)
        {
            string alterSql = @"
                IF COL_LENGTH('SalesInvoices', 'IsPosted') IS NULL
                    ALTER TABLE SalesInvoices ADD IsPosted BIT NOT NULL DEFAULT 0;
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PurchaseInvoices') AND COL_LENGTH('PurchaseInvoices', 'IsPosted') IS NULL
                    ALTER TABLE PurchaseInvoices ADD IsPosted BIT NOT NULL DEFAULT 0;";

            using (SqlCommand cmd = new SqlCommand(alterSql, conn))
            {
                cmd.ExecuteNonQuery();
            }
        }

        /// <summary>
        /// ترحيل وتثبيت فاتورة مبيعات في دفتر اليومية العامة لربطها بالتقارير المالية وميزان المراجعة
        /// مع الحماية الصارمة من الترحيل المزدوج وضمان توازن القيد
        /// </summary>
        public bool SaveAndPostInvoiceToReports(int invoiceId, string invoiceNo, decimal netTotal, decimal totalBeforeVat, decimal totalVat, int branchId, out string errorMsg)
        {
            errorMsg = string.Empty;

            // 1. التحقق من التوازن المحاسبي للقيد قبل التنفيذ (Debit == Credit)
            if (Math.Abs(netTotal - (totalBeforeVat + totalVat)) >= 0.01m)
            {
                errorMsg = $"خطأ محاسبي: الفاتورة غير متوازنة! الصافي ({netTotal:N2}) لا يساوي مجموع القيمة قبل الضريبة ({totalBeforeVat:N2}) + الضريبة ({totalVat:N2}).";
                return false;
            }

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                EnsurePostingColumnsExist(conn);

                // 2. فحص استباقي لمنع الترحيل المزدوج وحماية ميزان المراجعة من تكرار الإيراد
                string checkQuery = @"
                    SELECT TOP 1 IsPosted 
                    FROM SalesInvoices 
                    WHERE InvoiceID = @InvID;";

                using (SqlCommand checkCmd = new SqlCommand(checkQuery, conn))
                {
                    checkCmd.Parameters.Add("@InvID", SqlDbType.Int).Value = invoiceId;
                    object isPostedVal = checkCmd.ExecuteScalar();

                    if (isPostedVal != null && isPostedVal != DBNull.Value && Convert.ToBoolean(isPostedVal))
                    {
                        // التحقق أيضاً من وجود قيد فعلي في اليومية العامة
                        string checkJournal = "SELECT TOP 1 EntryID FROM JournalEntries WHERE ReferenceNumber = @RefNo AND BranchID = @BranchID;";
                        using (SqlCommand cmdJCheck = new SqlCommand(checkJournal, conn))
                        {
                            cmdJCheck.Parameters.Add("@RefNo", SqlDbType.NVarChar, 50).Value = invoiceNo;
                            cmdJCheck.Parameters.Add("@BranchID", SqlDbType.Int).Value = branchId;
                            object existingEntry = cmdJCheck.ExecuteScalar();
                            if (existingEntry != null && existingEntry != DBNull.Value)
                            {
                                errorMsg = $"تنبيه أمني: الفاتورة رقم {invoiceNo} مرحلة مسبقاً برقم قيد #{existingEntry}. تم إلغاء العملية لمنع مضاعفة الإيرادات.";
                                return false;
                            }
                        }
                    }
                }

                // معرفة طريقة الدفع لتحديد الطرف المدين بدقة (الصندوق أم العملاء)
                string paymentMethod = "Cash";
                int? customerId = null;
                string getMethodQuery = "SELECT PaymentMethod, CustomerID FROM SalesInvoices WHERE InvoiceID = @InvID";
                using (SqlCommand cmdGetMethod = new SqlCommand(getMethodQuery, conn))
                {
                    cmdGetMethod.Parameters.Add("@InvID", SqlDbType.Int).Value = invoiceId;
                    using (SqlDataReader rdr = cmdGetMethod.ExecuteReader())
                    {
                        if (rdr.Read())
                        {
                            paymentMethod = rdr["PaymentMethod"] != DBNull.Value ? rdr["PaymentMethod"].ToString() : "Cash";
                            if (rdr["CustomerID"] != DBNull.Value) customerId = Convert.ToInt32(rdr["CustomerID"]);
                        }
                    }
                }

                // 3. بدء Transaction آمنة ACID لضمان ترحيل رأس القيد والتفاصيل وتحديث الفاتورة كوحدة واحدة
                SqlTransaction trans = conn.BeginTransaction();

                try
                {
                    // 4. إنشاء رأس القيد المحاسبي في جدول القيود اليومية (الذي تقرأ منه التقارير)
                    string insertJournal = @"
                        INSERT INTO JournalEntries (EntryDate, ReferenceNumber, Description, BranchID, IsPosted, CreatedBy, CreatedAt) 
                        VALUES (GETDATE(), @Ref, @Desc, @BranchID, 1, @CreatedBy, GETDATE()); 
                        SELECT SCOPE_IDENTITY();";

                    int entryId;
                    using (SqlCommand cmd = new SqlCommand(insertJournal, conn, trans))
                    {
                        cmd.Parameters.Add("@Ref", SqlDbType.NVarChar, 50).Value = invoiceNo;
                        cmd.Parameters.Add("@Desc", SqlDbType.NVarChar, 255).Value = $"قيد تلقائي مبيعات للفاتورة رقم: {invoiceNo}";
                        cmd.Parameters.Add("@BranchID", SqlDbType.Int).Value = branchId;
                        cmd.Parameters.Add("@CreatedBy", SqlDbType.NVarChar, 100).Value = UserSession.CurrentUserName ?? "محرك تصحيح القيود";

                        entryId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    // 5. إدراج أسطر القيد المزدوج المتوازن (Journal Entry Details)
                    string insertLines = @"
                        INSERT INTO JournalEntryDetails (EntryID, AccountID, Debit, Credit, CostCenterID, LineDescription) 
                        VALUES (@EntryID, @AccID, @Deb, @Cred, @CCID, @LineDesc);";

                    // السطر الأول (المدين): حساب الصندوق الرئيسي (101001) للنقدي أو حساب العملاء (103001 / 110201) للآجل
                    bool isCredit = (paymentMethod == "Credit" || paymentMethod == "آجل");
                    int debitAccountId = isCredit ? 103001 : 101001;

                    using (SqlCommand cmdLine = new SqlCommand(insertLines, conn, trans))
                    {
                        cmdLine.Parameters.Add("@EntryID", SqlDbType.Int).Value = entryId;
                        cmdLine.Parameters.Add("@AccID", SqlDbType.Int).Value = debitAccountId;

                        var pDeb = cmdLine.Parameters.Add("@Deb", SqlDbType.Decimal);
                        pDeb.Precision = 18; pDeb.Scale = 2; pDeb.Value = netTotal;

                        var pCred = cmdLine.Parameters.Add("@Cred", SqlDbType.Decimal);
                        pCred.Precision = 18; pCred.Scale = 2; pCred.Value = 0m;

                        cmdLine.Parameters.Add("@CCID", SqlDbType.Int).Value = branchId; // ربط مركز التكلفة بالفرع
                        cmdLine.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255).Value = isCredit 
                            ? $"مديونية عميل فاتورة آجلة #{invoiceNo}" 
                            : $"قبض كاشير مبيعات نقدية فاتورة #{invoiceNo}";

                        cmdLine.ExecuteNonQuery();
                    }

                    // السطر الثاني (الدائن للإيراد): حساب إيرادات المبيعات (401001) بقيمة البضاعة صافية بدون الضريبة
                    using (SqlCommand cmdLine = new SqlCommand(insertLines, conn, trans))
                    {
                        cmdLine.Parameters.Add("@EntryID", SqlDbType.Int).Value = entryId;
                        cmdLine.Parameters.Add("@AccID", SqlDbType.Int).Value = 401001; // حساب المبيعات

                        var pDeb = cmdLine.Parameters.Add("@Deb", SqlDbType.Decimal);
                        pDeb.Precision = 18; pDeb.Scale = 2; pDeb.Value = 0m;

                        var pCred = cmdLine.Parameters.Add("@Cred", SqlDbType.Decimal);
                        pCred.Precision = 18; pCred.Scale = 2; pCred.Value = totalBeforeVat;

                        cmdLine.Parameters.Add("@CCID", SqlDbType.Int).Value = branchId;
                        cmdLine.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255).Value = $"إيراد مبيعات فاتورة #{invoiceNo}";

                        cmdLine.ExecuteNonQuery();
                    }

                    // السطر الثالث (الدائن للضريبة): حساب ضريبة القيمة المضافة المستحقة (202001)
                    if (totalVat > 0)
                    {
                        using (SqlCommand cmdLine = new SqlCommand(insertLines, conn, trans))
                        {
                            cmdLine.Parameters.Add("@EntryID", SqlDbType.Int).Value = entryId;
                            cmdLine.Parameters.Add("@AccID", SqlDbType.Int).Value = 202001; // ضريبة القيمة المضافة المستحقة

                            var pDeb = cmdLine.Parameters.Add("@Deb", SqlDbType.Decimal);
                            pDeb.Precision = 18; pDeb.Scale = 2; pDeb.Value = 0m;

                            var pCred = cmdLine.Parameters.Add("@Cred", SqlDbType.Decimal);
                            pCred.Precision = 18; pCred.Scale = 2; pCred.Value = totalVat;

                            cmdLine.Parameters.Add("@CCID", SqlDbType.Int).Value = branchId;
                            cmdLine.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255).Value = $"ضريبة مخرجات مستحقة 15% للفاتورة #{invoiceNo}";

                            cmdLine.ExecuteNonQuery();
                        }
                    }

                    // 6. تحديث حالة الفاتورة في جدول المبيعات لتصبح معتمدة ومرحلة رسمياً
                    string updateInvoiceStatus = "UPDATE SalesInvoices SET IsPosted = 1 WHERE InvoiceID = @InvID;";
                    using (SqlCommand cmdUpdate = new SqlCommand(updateInvoiceStatus, conn, trans))
                    {
                        cmdUpdate.Parameters.Add("@InvID", SqlDbType.Int).Value = invoiceId;
                        cmdUpdate.ExecuteNonQuery();
                    }

                    // 7. توثيق العملية في سجل الرقابة والأمان (Audit Trail)
                    string logAction = $"تصحيح وترحيل فاتورة مبيعات رقم {invoiceNo} وتوليد القيد المحاسبي رقم {entryId} للفرع {branchId}";
                    string insertAudit = @"
                        INSERT INTO AuditLogs (UserID, ActionType, ActionDescription, LogTimestamp) 
                        VALUES (@UID, 'INVOICE_POST_FIX', @Desc, GETDATE());";

                    using (SqlCommand cmdAudit = new SqlCommand(insertAudit, conn, trans))
                    {
                        cmdAudit.Parameters.Add("@UID", SqlDbType.Int).Value = UserSession.CurrentUserID > 0 ? UserSession.CurrentUserID : 1;
                        cmdAudit.Parameters.Add("@Desc", SqlDbType.NVarChar, 500).Value = logAction;
                        cmdAudit.ExecuteNonQuery();
                    }

                    trans.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    try { trans.Rollback(); } catch { }
                    errorMsg = $"فشل ترحيل الفاتورة رقم {invoiceNo}: {ex.Message}";
                    return false;
                }
            }
        }

        /// <summary>
        /// النسخة المتوافقة مع الاستدعاء البسيط القديم بدون معامل out
        /// </summary>
        public bool SaveAndPostInvoiceToReports(int invoiceId, string invoiceNo, decimal netTotal, decimal totalBeforeVat, decimal totalVat, int branchId)
        {
            return SaveAndPostInvoiceToReports(invoiceId, invoiceNo, netTotal, totalBeforeVat, totalVat, branchId, out _);
        }

        /// <summary>
        /// ترحيل وتثبيت فاتورة مشتريات في دفتر اليومية العامة لربطها فوراً بفواتير وتقارير المشتريات والمخزون
        /// مع إدراج القيد المحاسبي المزدوج (مدين: المخزون والضريبة المدخلات - دائن: المورد أو الصندوق)
        /// </summary>
        public bool SaveAndPostPurchaseInvoiceToReports(int invoiceId, string invoiceNo, decimal netTotal, decimal totalBeforeVat, decimal totalVat, int branchId, out string errorMsg)
        {
            errorMsg = string.Empty;

            // 1. التحقق من التوازن المحاسبي للقيد
            if (Math.Abs(netTotal - (totalBeforeVat + totalVat)) >= 0.01m)
            {
                errorMsg = $"خطأ محاسبي: فاتورة المشتريات غير متوازنة! الصافي ({netTotal:N2}) لا يساوي المجموع ({totalBeforeVat:N2} + {totalVat:N2}).";
                return false;
            }

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();

                // 2. فحص استباقي لمنع الترحيل المزدوج
                string checkQuery = @"
                    SELECT TOP 1 IsPosted 
                    FROM PurchaseInvoices 
                    WHERE InvoiceID = @InvID;";

                using (SqlCommand checkCmd = new SqlCommand(checkQuery, conn))
                {
                    checkCmd.Parameters.Add("@InvID", SqlDbType.Int).Value = invoiceId;
                    object isPostedVal = checkCmd.ExecuteScalar();

                    if (isPostedVal != null && isPostedVal != DBNull.Value && Convert.ToBoolean(isPostedVal))
                    {
                        string checkJournal = "SELECT TOP 1 EntryID FROM JournalEntries WHERE ReferenceNumber = @RefNo AND BranchID = @BranchID;";
                        using (SqlCommand cmdJCheck = new SqlCommand(checkJournal, conn))
                        {
                            cmdJCheck.Parameters.Add("@RefNo", SqlDbType.NVarChar, 50).Value = invoiceNo;
                            cmdJCheck.Parameters.Add("@BranchID", SqlDbType.Int).Value = branchId;
                            object existingEntry = cmdJCheck.ExecuteScalar();
                            if (existingEntry != null && existingEntry != DBNull.Value)
                            {
                                errorMsg = $"تنبيه: فاتورة المشتريات رقم {invoiceNo} مرحلة مسبقاً بالقيد #{existingEntry}.";
                                return false;
                            }
                        }
                    }
                }

                // معرفة طريقة الدفع لتحديد الطرف الدائن (الصندوق أم المورد)
                string paymentMethod = "Cash";
                int? supplierId = null;
                string getMethodQuery = "SELECT PaymentMethod, SupplierID FROM PurchaseInvoices WHERE InvoiceID = @InvID";
                using (SqlCommand cmdGetMethod = new SqlCommand(getMethodQuery, conn))
                {
                    cmdGetMethod.Parameters.Add("@InvID", SqlDbType.Int).Value = invoiceId;
                    using (SqlDataReader rdr = cmdGetMethod.ExecuteReader())
                    {
                        if (rdr.Read())
                        {
                            paymentMethod = rdr["PaymentMethod"] != DBNull.Value ? rdr["PaymentMethod"].ToString() : "Cash";
                            if (rdr["SupplierID"] != DBNull.Value) supplierId = Convert.ToInt32(rdr["SupplierID"]);
                        }
                    }
                }

                // 3. بدء Transaction لضمان ذرية العملية (ACID)
                SqlTransaction trans = conn.BeginTransaction();

                try
                {
                    // 4. رأس القيد المحاسبي لليومية العامة
                    string insertJournal = @"
                        INSERT INTO JournalEntries (EntryDate, ReferenceNumber, Description, BranchID, IsPosted, CreatedBy, CreatedAt) 
                        VALUES (GETDATE(), @Ref, @Desc, @BranchID, 1, @CreatedBy, GETDATE()); 
                        SELECT SCOPE_IDENTITY();";

                    int entryId;
                    using (SqlCommand cmd = new SqlCommand(insertJournal, conn, trans))
                    {
                        cmd.Parameters.Add("@Ref", SqlDbType.NVarChar, 50).Value = invoiceNo;
                        cmd.Parameters.Add("@Desc", SqlDbType.NVarChar, 255).Value = $"قيد تلقائي مشتريات للفاتورة رقم: {invoiceNo}";
                        cmd.Parameters.Add("@BranchID", SqlDbType.Int).Value = branchId;
                        cmd.Parameters.Add("@CreatedBy", SqlDbType.NVarChar, 100).Value = UserSession.CurrentUserName ?? "محرك ترحيل المشتريات";

                        entryId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    // 5. إدراج أسطر القيد المزدوج
                    string insertLines = @"
                        INSERT INTO JournalEntryDetails (EntryID, AccountID, Debit, Credit, CostCenterID, LineDescription) 
                        VALUES (@EntryID, @AccID, @Deb, @Cred, @CCID, @LineDesc);";

                    // السطر الأول (المدين الأول): حساب المخزون/المشتريات (110301 أو 102001)
                    using (SqlCommand cmdLine = new SqlCommand(insertLines, conn, trans))
                    {
                        cmdLine.Parameters.Add("@EntryID", SqlDbType.Int).Value = entryId;
                        cmdLine.Parameters.Add("@AccID", SqlDbType.Int).Value = 110301; // مستودع البضائع الرئيسي / المشتريات

                        var pDeb = cmdLine.Parameters.Add("@Deb", SqlDbType.Decimal);
                        pDeb.Precision = 18; pDeb.Scale = 2; pDeb.Value = totalBeforeVat;

                        var pCred = cmdLine.Parameters.Add("@Cred", SqlDbType.Decimal);
                        pCred.Precision = 18; pCred.Scale = 2; pCred.Value = 0m;

                        cmdLine.Parameters.Add("@CCID", SqlDbType.Int).Value = branchId;
                        cmdLine.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255).Value = $"بضاعة مشتريات فاتورة #{invoiceNo}";

                        cmdLine.ExecuteNonQuery();
                    }

                    // السطر الثاني (المدين الثاني): ضريبة القيمة المضافة - مدخلات 15% (1104 أو 104001)
                    if (totalVat > 0)
                    {
                        using (SqlCommand cmdLine = new SqlCommand(insertLines, conn, trans))
                        {
                            cmdLine.Parameters.Add("@EntryID", SqlDbType.Int).Value = entryId;
                            cmdLine.Parameters.Add("@AccID", SqlDbType.Int).Value = 1104; // ضريبة مدخلات 15%

                            var pDeb = cmdLine.Parameters.Add("@Deb", SqlDbType.Decimal);
                            pDeb.Precision = 18; pDeb.Scale = 2; pDeb.Value = totalVat;

                            var pCred = cmdLine.Parameters.Add("@Cred", SqlDbType.Decimal);
                            pCred.Precision = 18; pCred.Scale = 2; pCred.Value = 0m;

                            cmdLine.Parameters.Add("@CCID", SqlDbType.Int).Value = branchId;
                            cmdLine.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255).Value = $"ضريبة مدخلات 15% فاتورة مشتريات #{invoiceNo}";

                            cmdLine.ExecuteNonQuery();
                        }
                    }

                    // السطر الثالث (الدائن): حساب المورد (210101 أو 201001) للآجل أو الصندوق الرئيسي (110101 أو 101001) للنقدي
                    bool isCredit = (paymentMethod == "Credit" || paymentMethod == "آجل");
                    int creditAccountId = isCredit ? 210101 : 110101;

                    using (SqlCommand cmdLine = new SqlCommand(insertLines, conn, trans))
                    {
                        cmdLine.Parameters.Add("@EntryID", SqlDbType.Int).Value = entryId;
                        cmdLine.Parameters.Add("@AccID", SqlDbType.Int).Value = creditAccountId;

                        var pDeb = cmdLine.Parameters.Add("@Deb", SqlDbType.Decimal);
                        pDeb.Precision = 18; pDeb.Scale = 2; pDeb.Value = 0m;

                        var pCred = cmdLine.Parameters.Add("@Cred", SqlDbType.Decimal);
                        pCred.Precision = 18; pCred.Scale = 2; pCred.Value = netTotal;

                        cmdLine.Parameters.Add("@CCID", SqlDbType.Int).Value = branchId;
                        cmdLine.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255).Value = isCredit 
                            ? $"مستحق مورد فاتورة مشتريات آجلة #{invoiceNo}" 
                            : $"سداد نقدي من الصندوق فاتورة مشتريات #{invoiceNo}";

                        cmdLine.ExecuteNonQuery();
                    }

                    // 6. تحديث حالة الفاتورة في جدول المشتريات لتصبح معتمدة ومرحلة رسمياً
                    string updateInvoiceStatus = "UPDATE PurchaseInvoices SET IsPosted = 1 WHERE InvoiceID = @InvID;";
                    using (SqlCommand cmdUpdate = new SqlCommand(updateInvoiceStatus, conn, trans))
                    {
                        cmdUpdate.Parameters.Add("@InvID", SqlDbType.Int).Value = invoiceId;
                        cmdUpdate.ExecuteNonQuery();
                    }

                    // 7. توثيق العملية في سجل الرقابة والأمان (Audit Trail)
                    string logAction = $"ترحيل فاتورة مشتريات رقم {invoiceNo} وتوليد القيد المحاسبي رقم {entryId} للفرع {branchId}";
                    string insertAudit = @"
                        INSERT INTO AuditLogs (UserID, ActionType, ActionDescription, LogTimestamp) 
                        VALUES (@UID, 'PURCHASE_INVOICE_POST', @Desc, GETDATE());";

                    using (SqlCommand cmdAudit = new SqlCommand(insertAudit, conn, trans))
                    {
                        cmdAudit.Parameters.Add("@UID", SqlDbType.Int).Value = UserSession.CurrentUserID > 0 ? UserSession.CurrentUserID : 1;
                        cmdAudit.Parameters.Add("@Desc", SqlDbType.NVarChar, 500).Value = logAction;
                        cmdAudit.ExecuteNonQuery();
                    }

                    trans.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    try { trans.Rollback(); } catch { }
                    errorMsg = $"فشل ترحيل فاتورة المشتريات رقم {invoiceNo}: {ex.Message}";
                    return false;
                }
            }
        }

        public bool SaveAndPostPurchaseInvoiceToReports(int invoiceId, string invoiceNo, decimal netTotal, decimal totalBeforeVat, decimal totalVat, int branchId)
        {
            return SaveAndPostPurchaseInvoiceToReports(invoiceId, invoiceNo, netTotal, totalBeforeVat, totalVat, branchId, out _);
        }

        /// <summary>
        /// فحص ومعالجة جماعية لكافة الفواتير غير المرحلة (Batch Auto-Fix)
        /// لإصلاح أي فواتير مبيعات تائهة لا تظهر في تقارير الأرباح والخسائر وميزان المراجعة
        /// </summary>
        public BatchInvoiceFixReport FixAllUnpostedInvoices(int? branchId = null)
        {
            var report = new BatchInvoiceFixReport();

            var unpostedInvoices = new List<(int ID, string No, decimal Net, decimal Sub, decimal Vat, int Branch)>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                EnsurePostingColumnsExist(conn);

                // استخراج الفواتير التي لم تُرحل أو التي ليس لها قيد في اليومية العامة
                string selectQuery = @"
                    SELECT s.InvoiceID, s.InvoiceNumber, s.NetTotal, s.TotalBeforeVat, s.TotalVat, s.BranchID 
                    FROM SalesInvoices s
                    WHERE (s.IsPosted = 0 OR s.IsPosted IS NULL OR NOT EXISTS (
                        SELECT 1 FROM JournalEntries j WHERE j.ReferenceNumber = s.InvoiceNumber
                    ))";

                if (branchId.HasValue) selectQuery += " AND s.BranchID = @BranchID";

                using (SqlCommand cmd = new SqlCommand(selectQuery, conn))
                {
                    if (branchId.HasValue)
                    {
                        cmd.Parameters.Add("@BranchID", SqlDbType.Int).Value = branchId.Value;
                    }

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            unpostedInvoices.Add((
                                Convert.ToInt32(reader["InvoiceID"]),
                                reader["InvoiceNumber"].ToString(),
                                Convert.ToDecimal(reader["NetTotal"]),
                                Convert.ToDecimal(reader["TotalBeforeVat"]),
                                Convert.ToDecimal(reader["TotalVat"]),
                                Convert.ToInt32(reader["BranchID"])
                            ));
                        }
                    }
                }
            }

            report.TotalScanned = unpostedInvoices.Count;

            // معالجة كل فاتورة مبيعات على حدة
            foreach (var inv in unpostedInvoices)
            {
                bool success = SaveAndPostInvoiceToReports(
                    inv.ID, inv.No, inv.Net, inv.Sub, inv.Vat, inv.Branch, out string err
                );

                if (success)
                {
                    report.SuccessfullyFixed++;
                    report.TotalAmountFixed += inv.Net;
                }
                else
                {
                    report.FailedCount++;
                    report.ErrorLogs.Add($"فاتورة مبيعات #{inv.No}: {err}");
                }
            }

            // فحص وترحيل فواتير المشتريات غير المرحلة
            var unpostedPurchases = new List<(int ID, string No, decimal Net, decimal Sub, decimal Vat, int Branch)>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string selectPurQuery = @"
                    SELECT p.InvoiceID, p.InvoiceNumber, p.NetTotal, p.TotalBeforeVat, p.TotalVat, p.BranchID 
                    FROM PurchaseInvoices p
                    WHERE (p.IsPosted = 0 OR p.IsPosted IS NULL OR NOT EXISTS (
                        SELECT 1 FROM JournalEntries j WHERE j.ReferenceNumber = p.InvoiceNumber
                    ))";

                if (branchId.HasValue) selectPurQuery += " AND p.BranchID = @BranchID";

                using (SqlCommand cmdPur = new SqlCommand(selectPurQuery, conn))
                {
                    if (branchId.HasValue) cmdPur.Parameters.Add("@BranchID", SqlDbType.Int).Value = branchId.Value;

                    using (SqlDataReader reader = cmdPur.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            unpostedPurchases.Add((
                                Convert.ToInt32(reader["InvoiceID"]),
                                reader["InvoiceNumber"].ToString(),
                                Convert.ToDecimal(reader["NetTotal"]),
                                Convert.ToDecimal(reader["TotalBeforeVat"]),
                                Convert.ToDecimal(reader["TotalVat"]),
                                Convert.ToInt32(reader["BranchID"])
                            ));
                        }
                    }
                }
            }

            report.TotalScanned += unpostedPurchases.Count;
            foreach (var pur in unpostedPurchases)
            {
                bool success = SaveAndPostPurchaseInvoiceToReports(
                    pur.ID, pur.No, pur.Net, pur.Sub, pur.Vat, pur.Branch, out string err
                );

                if (success)
                {
                    report.SuccessfullyFixed++;
                    report.TotalAmountFixed += pur.Net;
                }
                else
                {
                    report.FailedCount++;
                    report.ErrorLogs.Add($"فاتورة مشتريات #{pur.No}: {err}");
                }
            }

            return report;
        }

        /// <summary>
        /// نسخة غير متزامنة لإصلاح الفواتير بالخلفية دون تجميد شاشات الإدارة والتقارير
        /// </summary>
        public async Task<BatchInvoiceFixReport> FixAllUnpostedInvoicesAsync(int? branchId = null)
        {
            return await Task.Run(() => FixAllUnpostedInvoices(branchId));
        }
    }
}
