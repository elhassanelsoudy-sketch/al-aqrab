using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    public class TransferItem
    {
        public int ProductID { get; set; }
        public decimal Quantity { get; set; }
        public decimal CostPrice { get; set; } // تكلفة الصنف لحساب القيد
    }

    public class TransferOrder
    {
        public int FromBranchID { get; set; }
        public int ToBranchID { get; set; }
        public List<TransferItem> Items { get; set; } = new List<TransferItem>();
    }

    public class TransferEngine
    {
        private readonly string _connString = DBConnection.ConnectionString ?? "Server=YOUR_SERVER;Database=ERP_DB;Trusted_Connection=True;";

        public TransferEngine() { }

        public TransferEngine(string connectionString)
        {
            if (!string.IsNullOrWhiteSpace(connectionString))
                _connString = connectionString;
        }

        public bool ExecuteBranchTransfer(TransferOrder order, out string errorMsg)
        {
            errorMsg = string.Empty;

            if (order.FromBranchID == order.ToBranchID)
            {
                errorMsg = "خطأ برمجي: لا يمكن التحويل لنفس الفرع.";
                return false;
            }

            using (SqlConnection conn = new SqlConnection(_connString))
            {
                conn.Open();
                SqlTransaction trans = conn.BeginTransaction();

                try
                {
                    // 1. تسجيل حركة التحويل في جدول StockTransfers
                    string insertTransfer = @"INSERT INTO StockTransfers (FromBranchID, ToBranchID, CreatedBy, Status) 
                                             VALUES (@From, @To, @User, N'Confirmed'); SELECT SCOPE_IDENTITY();";
                    int transferId;
                    using (SqlCommand cmd = new SqlCommand(insertTransfer, conn, trans))
                    {
                        cmd.Parameters.AddWithValue("@From", order.FromBranchID);
                        cmd.Parameters.AddWithValue("@To", order.ToBranchID);
                        cmd.Parameters.AddWithValue("@User", UserSession.CurrentUserID > 0 ? UserSession.CurrentUserID : 1);
                        transferId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    decimal totalTransferCost = 0;

                    // 2. تحديث المخازن للأصناف (Loop)
                    foreach (var item in order.Items)
                    {
                        totalTransferCost += (item.Quantity * item.CostPrice);

                        // إدراج تفاصيل الأصناف المحولة
                        string insertDetail = "INSERT INTO StockTransferDetails (TransferID, ProductID, Quantity) VALUES (@TID, @PID, @Qty)";
                        using (SqlCommand cmd = new SqlCommand(insertDetail, conn, trans))
                        {
                            cmd.Parameters.AddWithValue("@TID", transferId);
                            cmd.Parameters.AddWithValue("@PID", item.ProductID);
                            cmd.Parameters.AddWithValue("@Qty", item.Quantity);
                            cmd.ExecuteNonQuery();
                        }

                        // خصم المخزن من الفرع المرسل (FromBranch)
                        string decreaseStock = "UPDATE ProductBranches SET Stock = Stock - @Qty WHERE ProductID = @PID AND BranchID = @BranchID";
                        using (SqlCommand cmd = new SqlCommand(decreaseStock, conn, trans))
                        {
                            cmd.Parameters.AddWithValue("@Qty", item.Quantity);
                            cmd.Parameters.AddWithValue("@PID", item.ProductID);
                            cmd.Parameters.AddWithValue("@BranchID", order.FromBranchID);
                            int rowsAffected = cmd.ExecuteNonQuery();

                            // Fallback إذا لم يكن الصنف مدرجاً مسبقاً في جدول فروع المنتجات
                            if (rowsAffected == 0)
                            {
                                string updateProd = "UPDATE Products SET CurrentStock = CurrentStock - @Qty WHERE ProductID = @PID";
                                using (SqlCommand cmdProd = new SqlCommand(updateProd, conn, trans))
                                {
                                    cmdProd.Parameters.AddWithValue("@Qty", item.Quantity);
                                    cmdProd.Parameters.AddWithValue("@PID", item.ProductID);
                                    cmdProd.ExecuteNonQuery();
                                }
                            }
                        }

                        // زيادة المخزن في الفرع المستقبل (ToBranch)
                        string increaseStock = @"
                            IF EXISTS (SELECT 1 FROM ProductBranches WHERE ProductID = @PID AND BranchID = @BranchID)
                                UPDATE ProductBranches SET Stock = Stock + @Qty WHERE ProductID = @PID AND BranchID = @BranchID
                            ELSE
                                INSERT INTO ProductBranches (ProductID, BranchID, Stock) VALUES (@PID, @BranchID, @Qty)";
                        using (SqlCommand cmd = new SqlCommand(increaseStock, conn, trans))
                        {
                            cmd.Parameters.AddWithValue("@Qty", item.Quantity);
                            cmd.Parameters.AddWithValue("@PID", item.ProductID);
                            cmd.Parameters.AddWithValue("@BranchID", order.ToBranchID);
                            cmd.ExecuteNonQuery();
                        }
                    }

                    // 3. توليد القيد المحاسبي المزدوج للتحويل بين الفروع
                    GenerateTransferJournalEntry(transferId, totalTransferCost, order, conn, trans);

                    trans.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    trans.Rollback();
                    errorMsg = ex.Message;
                    return false;
                }
            }
        }

        private void GenerateTransferJournalEntry(int transferId, decimal totalCost, TransferOrder order, SqlConnection conn, SqlTransaction trans)
        {
            // إنشاء رأس القيد
            string insertJournal = "INSERT INTO JournalEntries (EntryDate, Description, BranchID) VALUES (GETDATE(), @Desc, @BranchID); SELECT SCOPE_IDENTITY();";
            int entryId;
            using (SqlCommand cmd = new SqlCommand(insertJournal, conn, trans))
            {
                cmd.Parameters.AddWithValue("@Desc", $"قيد تحويل مخزني تلقائي رقم {transferId} بين الفروع");
                cmd.Parameters.AddWithValue("@BranchID", order.FromBranchID); // يُسجل بفرع المنشأ
                entryId = Convert.ToInt32(cmd.ExecuteScalar());
            }

            string insertLines = "INSERT INTO JournalEntryDetails (EntryID, AccountID, Debit, Credit, CostCenterID) VALUES (@EntryID, @AccID, @Deb, @Cred, @CCID)";

            // السطر الأول: جلب حساب المخزن للفرع المستلم (مدين بالقيمة)
            using (SqlCommand cmd = new SqlCommand(insertLines, conn, trans))
            {
                cmd.Parameters.AddWithValue("@EntryID", entryId);
                cmd.Parameters.AddWithValue("@AccID", 102001); // حساب المخزون العام أو الفرعي للفرع المستلم
                cmd.Parameters.AddWithValue("@Deb", totalCost);
                cmd.Parameters.AddWithValue("@Cred", 0);
                cmd.Parameters.AddWithValue("@CCID", order.ToBranchID); // ربط التكلفة بالفرع المستلم كمركز تكلفة
                cmd.ExecuteNonQuery();
            }

            // السطر الثاني: خفض حساب مخزن الفرع المرسل (دائن بالقيمة)
            using (SqlCommand cmd = new SqlCommand(insertLines, conn, trans))
            {
                cmd.Parameters.AddWithValue("@EntryID", entryId);
                cmd.Parameters.AddWithValue("@AccID", 102001); 
                cmd.Parameters.AddWithValue("@Deb", 0);
                cmd.Parameters.AddWithValue("@Cred", totalCost);
                cmd.Parameters.AddWithValue("@CCID", order.FromBranchID); // ربط التكلفة بالفرع المرسل كمركز تكلفة
                cmd.ExecuteNonQuery();
            }
        }
    }
}
