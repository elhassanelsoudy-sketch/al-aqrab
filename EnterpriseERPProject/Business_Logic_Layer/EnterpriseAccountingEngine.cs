using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    // =========================================================================
    // 1. النماذج البرمجية للهيكل المالي والمخزني ورقابة الأمان
    // =========================================================================
    
    public class JournalLine
    {
        public int AccountID { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public int? CostCenterID { get; set; } // رقم الفرع كمرجع لمركز التكلفة
        public string Description { get; set; }
    }

    public class JournalEntryDto
    {
        public DateTime EntryDate { get; set; } = DateTime.Now;
        public string ReferenceNumber { get; set; }
        public string Description { get; set; }
        public int BranchID { get; set; }
        public int UserID { get; set; }
        public List<JournalLine> Lines { get; set; } = new List<JournalLine>();
    }

    public class InventoryPurchaseItem
    {
        public int ProductID { get; set; }
        public decimal NewQty { get; set; }
        public decimal NewPrice { get; set; }
    }

    // =========================================================================
    // 2. المحرك الشامل الموحد لضبط الحسابات والمخازن ورقابة النظام
    // =========================================================================
    
    public class EnterpriseAccountingEngine
    {
        private readonly string _connectionString;

        public EnterpriseAccountingEngine()
        {
            // الاعتماد على سلسلة الاتصال الموحدة للنظام
            _connectionString = DBConnection.ConnectionString;
        }

        public EnterpriseAccountingEngine(string connectionString)
        {
            _connectionString = string.IsNullOrWhiteSpace(connectionString) 
                ? DBConnection.ConnectionString 
                : connectionString;
        }

        /// <summary>
        /// المحرك الأول: توليد وترحيل القيود المحاسبية التلقائية مع التحقق الصارم من التوازن والتسجيل في سجل الرقابة
        /// </summary>
        public bool PostJournalEntry(JournalEntryDto entry, out string errorMessage)
        {
            errorMessage = string.Empty;

            // التحقق من صحة القيد وعدد الأسطر
            if (entry == null || entry.Lines == null || entry.Lines.Count < 2)
            {
                errorMessage = "خطأ محاسبي: القيد يجب أن يحتوي على سطرين ماليين على الأقل (مدين ودائن).";
                return false;
            }

            // التحقق من عدم وجود مبالغ سالبة
            if (entry.Lines.Any(l => l.Debit < 0 || l.Credit < 0))
            {
                errorMessage = "خطأ محاسبي: لا يُسمح بإدخال قيم سالبة في أسطر القيد.";
                return false;
            }

            // قانون القيد المزدوج الإلزامي: التحقق من توازن المدين والدائن مع معالجة فوارق التقريب العشري
            decimal totalDebit = entry.Lines.Sum(l => l.Debit);
            decimal totalCredit = entry.Lines.Sum(l => l.Credit);

            if (Math.Abs(totalDebit - totalCredit) >= 0.001m)
            {
                errorMessage = $"خطأ في التوازن: القيد غير متوازن برمجياً! مجموع المدين ({totalDebit:N2}) لا يساوي مجموع الدائن ({totalCredit:N2}).";
                return false;
            }

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                SqlTransaction transaction = connection.BeginTransaction();

                try
                {
                    // 1. ترحيل رأس القيد لدفتر الأستاذ العام
                    string insertHeaderQuery = @"
                        INSERT INTO JournalEntries (EntryDate, ReferenceNumber, Description, BranchID, IsPosted, CreatedAt) 
                        VALUES (@EntryDate, @RefNo, @Desc, @BranchID, 1, GETDATE()); 
                        SELECT SCOPE_IDENTITY();";

                    int newEntryID;
                    using (SqlCommand cmd = new SqlCommand(insertHeaderQuery, connection, transaction))
                    {
                        cmd.Parameters.Add("@EntryDate", SqlDbType.DateTime).Value = entry.EntryDate;
                        cmd.Parameters.Add("@RefNo", SqlDbType.NVarChar, 50).Value = (object)entry.ReferenceNumber ?? DBNull.Value;
                        cmd.Parameters.Add("@Desc", SqlDbType.NVarChar, 255).Value = (object)entry.Description ?? DBNull.Value;
                        cmd.Parameters.Add("@BranchID", SqlDbType.Int).Value = entry.BranchID;
                        
                        newEntryID = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    // 2. ترحيل أسطر وتفاصيل القيد المالي
                    string insertDetailQuery = @"
                        INSERT INTO JournalEntryDetails (EntryID, AccountID, Debit, Credit, CostCenterID, LineDescription) 
                        VALUES (@EntryID, @AccountID, @Debit, @Credit, @CostCenterID, @LineDesc);";

                    foreach (var line in entry.Lines)
                    {
                        using (SqlCommand cmd = new SqlCommand(insertDetailQuery, connection, transaction))
                        {
                            cmd.Parameters.Add("@EntryID", SqlDbType.Int).Value = newEntryID;
                            cmd.Parameters.Add("@AccountID", SqlDbType.Int).Value = line.AccountID;

                            var pDeb = cmd.Parameters.Add("@Debit", SqlDbType.Decimal);
                            pDeb.Precision = 18; pDeb.Scale = 2;
                            pDeb.Value = line.Debit;

                            var pCred = cmd.Parameters.Add("@Credit", SqlDbType.Decimal);
                            pCred.Precision = 18; pCred.Scale = 2;
                            pCred.Value = line.Credit;

                            cmd.Parameters.Add("@CostCenterID", SqlDbType.Int).Value = (object)line.CostCenterID ?? DBNull.Value;
                            cmd.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255).Value = (object)line.Description ?? DBNull.Value;

                            cmd.ExecuteNonQuery();
                        }
                    }

                    // 3. المحرك الثالث (مدمج): كتابة سجل الرقابة المباشر (Audit Trail) لتوثيق الحركة بالأمن والسلامة
                    string logAction = $"ترحيل قيد يومية تلقائي رقم {newEntryID} للمرجع {entry.ReferenceNumber}";
                    WriteAuditLog(entry.UserID, "POST_ENTRY", logAction, connection, transaction);

                    transaction.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    try { transaction.Rollback(); } catch { }
                    errorMessage = $"فشلت العملية وتم التراجع آلياً لحماية الحسابات. السبب: {ex.Message}";
                    return false;
                }
            }
        }

        /// <summary>
        /// المحرك الثاني: حساب متوسط تكلفة المخزون المرجح المتحرك فورياً وتعديل قيم الأصول بجدول الأصناف
        /// </summary>
        public bool UpdateInventoryMovingAverage(InventoryPurchaseItem purchasedItem, int branchId, int userId, out string errorMessage)
        {
            errorMessage = string.Empty;

            if (purchasedItem == null || purchasedItem.ProductID <= 0 || purchasedItem.NewQty <= 0)
            {
                errorMessage = "بيانات صنف الشراء غير صالحة.";
                return false;
            }

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                SqlTransaction transaction = connection.BeginTransaction();

                try
                {
                    decimal currentStock = 0;
                    decimal oldCost = 0;

                    // 1. جلب الكمية الحالية ومتوسط التكلفة السابق للصنف من قاعدة البيانات لقراءة الواقع المخزني
                    string getProductQuery = "SELECT CurrentStock, CostPrice FROM Products WHERE ProductID = @PID";
                    using (SqlCommand cmd = new SqlCommand(getProductQuery, connection, transaction))
                    {
                        cmd.Parameters.Add("@PID", SqlDbType.Int).Value = purchasedItem.ProductID;
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                currentStock = reader["CurrentStock"] != DBNull.Value ? Convert.ToDecimal(reader["CurrentStock"]) : 0;
                                oldCost = reader["CostPrice"] != DBNull.Value ? Convert.ToDecimal(reader["CostPrice"]) : 0;
                            }
                            else
                            {
                                throw new Exception($"لم يتم العثور على الصنف برقم #{purchasedItem.ProductID}.");
                            }
                        }
                    }

                    // 2. تطبيق المعادلة الرياضية للمتوسط المرجح المتحرك (Moving Average Cost Formula)
                    decimal newTotalQty = currentStock + purchasedItem.NewQty;
                    decimal newAverageCost;

                    if (currentStock <= 0)
                    {
                        // في حال كان الرصيد السابق صفراً أو سالباً، تصبح التكلفة الجديدة مساوية لسعر الشراء الجديد مباشرة
                        newAverageCost = purchasedItem.NewPrice;
                    }
                    else if (newTotalQty > 0)
                    {
                        newAverageCost = ((currentStock * oldCost) + (purchasedItem.NewQty * purchasedItem.NewPrice)) / newTotalQty;
                    }
                    else
                    {
                        newAverageCost = purchasedItem.NewPrice;
                    }

                    // 3. تحديث التكلفة الجديدة والكمية الإجمالية في جدول المنتجات
                    string updateProductQuery = "UPDATE Products SET CurrentStock = @NewQty, CostPrice = @NewCost WHERE ProductID = @PID";
                    using (SqlCommand cmd = new SqlCommand(updateProductQuery, connection, transaction))
                    {
                        var pQty = cmd.Parameters.Add("@NewQty", SqlDbType.Decimal);
                        pQty.Precision = 18; pQty.Scale = 2;
                        pQty.Value = newTotalQty;

                        var pCost = cmd.Parameters.Add("@NewCost", SqlDbType.Decimal);
                        pCost.Precision = 18; pCost.Scale = 4;
                        pCost.Value = Math.Round(newAverageCost, 4);

                        cmd.Parameters.Add("@PID", SqlDbType.Int).Value = purchasedItem.ProductID;
                        cmd.ExecuteNonQuery();
                    }

                    // 4. توثيق العملية برمجياً في سجل الرقابة والأمان لضمان سلامة جرد المخزون
                    string logAction = $"تحديث متوسط تكلفة الصنف {purchasedItem.ProductID} من {oldCost:N2} إلى {newAverageCost:N2} (الفرع: {branchId}) بناءً على فاتورة مشتريات جديدة";
                    WriteAuditLog(userId, "INVENTORY_VALUATION", logAction, connection, transaction);

                    transaction.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    try { transaction.Rollback(); } catch { }
                    errorMessage = $"فشل تحديث تكلفة المخزون: {ex.Message}";
                    return false;
                }
            }
        }

        /// <summary>
        /// التابع المساعد لحقن وحفظ سجلات الرقابة (Audit Trail / Logs System)
        /// </summary>
        private void WriteAuditLog(int userId, string actionType, string actionDescription, SqlConnection conn, SqlTransaction trans)
        {
            string insertLogQuery = @"
                INSERT INTO AuditLogs (UserID, ActionType, ActionDescription, LogTimestamp) 
                VALUES (@UserID, @Type, @Desc, GETDATE());";

            using (SqlCommand cmd = new SqlCommand(insertLogQuery, conn, trans))
            {
                cmd.Parameters.Add("@UserID", SqlDbType.Int).Value = userId;
                cmd.Parameters.Add("@Type", SqlDbType.NVarChar, 50).Value = (object)actionType ?? DBNull.Value;
                cmd.Parameters.Add("@Desc", SqlDbType.NVarChar, 500).Value = (object)actionDescription ?? DBNull.Value;

                cmd.ExecuteNonQuery();
            }
        }
    }
}
