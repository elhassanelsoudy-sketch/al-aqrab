using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    /// <summary>
    /// سطر تفاصيل القيد المحاسبي المزدوج (Debit / Credit Line)
    /// </summary>
    public class JournalLine
    {
        public int AccountID { get; set; }
        public string AccountCode { get; set; }
        public string AccountName { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public int? CostCenterID { get; set; }
        public string Description { get; set; }
    }

    /// <summary>
    /// رأس سند القيد اليومي (General Journal Entry Header)
    /// </summary>
    public class JournalEntry
    {
        public int EntryID { get; set; }
        public DateTime EntryDate { get; set; } = DateTime.Now;
        public string EntryNumber { get; set; }
        public string ReferenceNumber { get; set; }
        public string DocType { get; set; } = "قيد يومية عام";
        public string Description { get; set; }
        public int BranchID { get; set; }
        public string BranchName { get; set; }
        public bool IsPosted { get; set; } = true;
        public string CreatedBy { get; set; }
        public List<JournalLine> Lines { get; set; } = new List<JournalLine>();

        public decimal TotalDebit => Lines?.Sum(l => l.Debit) ?? 0;
        public decimal TotalCredit => Lines?.Sum(l => l.Credit) ?? 0;
        public bool IsBalanced => Math.Abs(TotalDebit - TotalCredit) < 0.001m;
    }

    /// <summary>
    /// نتيجة عملية ترحيل القيد المحاسبي
    /// </summary>
    public class JournalPostingResult
    {
        public bool Success { get; set; }
        public int EntryID { get; set; }
        public string EntryNumber { get; set; }
        public string Message { get; set; }
    }

    /// <summary>
    /// محرك قيود اليومية العامة وترحيل الحسابات (Double-Entry Bookkeeping & Posting Engine)
    /// يفرض قواعد التوازن المحاسبي ومعاملات الأمان المالي ACID Transactions
    /// </summary>
    public class AccountingEngine
    {
        private readonly string _connString = "Server=YOUR_SERVER;Database=ERP_DB;Trusted_Connection=True;";

        public AccountingEngine() { }

        public AccountingEngine(string connString)
        {
            _connString = connString;
        }

        /// <summary>
        /// ترحيل قيد اليومية المزدوج إلى دفتر اليومية العامة وقاعدة البيانات (متزامن)
        /// </summary>
        public bool PostJournalEntry(JournalEntry entry, out string errorMsg)
        {
            errorMsg = string.Empty;

            // 1. التحقق من وجود سطرين على الأقل (طرف مدين وطرف دائن)
            if (entry.Lines == null || entry.Lines.Count < 2)
            {
                errorMsg = "خطأ محاسبي: يجب أن يحتوي القيد على سطرين على الأقل (طرف مدين وطرف دائن).";
                return false;
            }

            // 2. التحقق من التوازن المحاسبي الصارم (Debit == Credit)
            decimal totalDebit = entry.Lines.Sum(l => l.Debit);
            decimal totalCredit = entry.Lines.Sum(l => l.Credit);

            if (Math.Abs(totalDebit - totalCredit) >= 0.001m)
            {
                errorMsg = $"خطأ محاسبي: القيد غير متوازن. إجمالي المدين ({totalDebit:N2}) لا يساوي إجمالي الدائن ({totalCredit:N2}). الفارق: {Math.Abs(totalDebit - totalCredit):N2}";
                return false;
            }

            // 3. التحقق من عدم وجود مبالغ سالبة
            if (entry.Lines.Any(l => l.Debit < 0 || l.Credit < 0))
            {
                errorMsg = "خطأ محاسبي: لا يُسمح بإدخال مبالغ سالبة في أسطر القيد المحاسبي.";
                return false;
            }

            using (SqlConnection conn = new SqlConnection(_connString))
            {
                conn.Open();
                SqlTransaction trans = conn.BeginTransaction();
                try
                {
                    // 4. حفظ رأس القيد في جدول JournalEntries
                    string insertHeader = @"
                        INSERT INTO JournalEntries (EntryDate, ReferenceNumber, Description, BranchID, IsPosted, CreatedBy, CreatedAt) 
                        VALUES (@EntryDate, @RefNo, @Desc, @BranchID, 1, @CreatedBy, GETDATE()); 
                        SELECT SCOPE_IDENTITY();";

                    int entryId;
                    using (SqlCommand cmd = new SqlCommand(insertHeader, conn, trans))
                    {
                        cmd.Parameters.Add("@EntryDate", SqlDbType.DateTime).Value = entry.EntryDate;
                        cmd.Parameters.Add("@RefNo", SqlDbType.NVarChar, 50).Value = (object)entry.ReferenceNumber ?? DBNull.Value;
                        cmd.Parameters.Add("@Desc", SqlDbType.NVarChar, 255).Value = (object)entry.Description ?? DBNull.Value;
                        cmd.Parameters.Add("@BranchID", SqlDbType.Int).Value = entry.BranchID;
                        cmd.Parameters.Add("@CreatedBy", SqlDbType.NVarChar, 100).Value = (object)entry.CreatedBy ?? "مدير النظام: الحسن";
                        entryId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    entry.EntryID = entryId;

                    // 5. حفظ تفاصيل وأطراف القيد باستخدام Prepared Statement عالي الكفاءة
                    string insertDetail = @"
                        INSERT INTO JournalEntryDetails (EntryID, AccountID, Debit, Credit, CostCenterID, LineDescription) 
                        VALUES (@EntryID, @AccID, @Deb, @Cred, @CCID, @LineDesc);";

                    using (SqlCommand cmdDetail = new SqlCommand(insertDetail, conn, trans))
                    {
                        var pEntryId = cmdDetail.Parameters.Add("@EntryID", SqlDbType.Int);
                        var pAccId = cmdDetail.Parameters.Add("@AccID", SqlDbType.Int);
                        var pDeb = cmdDetail.Parameters.Add("@Deb", SqlDbType.Decimal);
                        pDeb.Precision = 18; pDeb.Scale = 2;
                        var pCred = cmdDetail.Parameters.Add("@Cred", SqlDbType.Decimal);
                        pCred.Precision = 18; pCred.Scale = 2;
                        var pCcId = cmdDetail.Parameters.Add("@CCID", SqlDbType.Int);
                        var pDesc = cmdDetail.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255);

                        foreach (var line in entry.Lines)
                        {
                            pEntryId.Value = entryId;
                            pAccId.Value = line.AccountID;
                            pDeb.Value = line.Debit;
                            pCred.Value = line.Credit;
                            pCcId.Value = (object)line.CostCenterID ?? DBNull.Value;
                            pDesc.Value = (object)line.Description ?? DBNull.Value;

                            cmdDetail.ExecuteNonQuery();
                        }
                    }

                    trans.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    trans.Rollback();
                    errorMsg = $"فشل ترحيل القيد المحاسبي: {ex.Message}";
                    return false;
                }
            }
        }

        /// <summary>
        /// النسخة غير المتزامنة لترحيل القيود الضخمة (مسيرات الرواتب والجرد السنوي) دون تجميد واجهة المستخدم
        /// </summary>
        public async Task<JournalPostingResult> PostJournalEntryAsync(JournalEntry entry)
        {
            var result = new JournalPostingResult();

            if (entry.Lines == null || entry.Lines.Count < 2)
            {
                result.Success = false;
                result.Message = "خطأ محاسبي: يجب أن يحتوي القيد على سطرين على الأقل.";
                return result;
            }

            if (!entry.IsBalanced)
            {
                result.Success = false;
                result.Message = $"القيد غير متوازن: المدين ({entry.TotalDebit:N2}) != الدائن ({entry.TotalCredit:N2})";
                return result;
            }

            using (SqlConnection conn = new SqlConnection(_connString))
            {
                await conn.OpenAsync();
                SqlTransaction trans = conn.BeginTransaction();
                try
                {
                    string insertHeader = @"
                        INSERT INTO JournalEntries (EntryDate, ReferenceNumber, Description, BranchID, IsPosted, CreatedBy, CreatedAt) 
                        VALUES (@EntryDate, @RefNo, @Desc, @BranchID, 1, @CreatedBy, GETDATE()); 
                        SELECT SCOPE_IDENTITY();";

                    int entryId;
                    using (SqlCommand cmd = new SqlCommand(insertHeader, conn, trans))
                    {
                        cmd.Parameters.Add("@EntryDate", SqlDbType.DateTime).Value = entry.EntryDate;
                        cmd.Parameters.Add("@RefNo", SqlDbType.NVarChar, 50).Value = (object)entry.ReferenceNumber ?? DBNull.Value;
                        cmd.Parameters.Add("@Desc", SqlDbType.NVarChar, 255).Value = (object)entry.Description ?? DBNull.Value;
                        cmd.Parameters.Add("@BranchID", SqlDbType.Int).Value = entry.BranchID;
                        cmd.Parameters.Add("@CreatedBy", SqlDbType.NVarChar, 100).Value = (object)entry.CreatedBy ?? "مدير النظام: الحسن";
                        entryId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                    }

                    string insertDetail = @"
                        INSERT INTO JournalEntryDetails (EntryID, AccountID, Debit, Credit, CostCenterID, LineDescription) 
                        VALUES (@EntryID, @AccID, @Deb, @Cred, @CCID, @LineDesc);";

                    using (SqlCommand cmdDetail = new SqlCommand(insertDetail, conn, trans))
                    {
                        cmdDetail.Parameters.Add("@EntryID", SqlDbType.Int).Value = entryId;
                        var pAccId = cmdDetail.Parameters.Add("@AccID", SqlDbType.Int);
                        var pDeb = cmdDetail.Parameters.Add("@Deb", SqlDbType.Decimal);
                        pDeb.Precision = 18; pDeb.Scale = 2;
                        var pCred = cmdDetail.Parameters.Add("@Cred", SqlDbType.Decimal);
                        pCred.Precision = 18; pCred.Scale = 2;
                        var pCcId = cmdDetail.Parameters.Add("@CCID", SqlDbType.Int);
                        var pDesc = cmdDetail.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255);

                        foreach (var line in entry.Lines)
                        {
                            pAccId.Value = line.AccountID;
                            pDeb.Value = line.Debit;
                            pCred.Value = line.Credit;
                            pCcId.Value = (object)line.CostCenterID ?? DBNull.Value;
                            pDesc.Value = (object)line.Description ?? DBNull.Value;

                            await cmdDetail.ExecuteNonQueryAsync();
                        }
                    }

                    trans.Commit();
                    result.Success = true;
                    result.EntryID = entryId;
                    result.Message = $"✓ تم ترحيل القيد المحاسبي بنجاح برقم قيد #{entryId}.";
                    return result;
                }
                catch (Exception ex)
                {
                    trans.Rollback();
                    result.Success = false;
                    result.Message = ex.Message;
                    return result;
                }
            }
        }
    }
}
