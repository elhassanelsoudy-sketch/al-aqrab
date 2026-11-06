using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    /// <summary>
    /// صنف من الأصناف المدرجة في سند التحويل المخزني
    /// </summary>
    public class StockTransferItem
    {
        public int ProductID { get; set; }
        public string ProductCode { get; set; }
        public string ProductName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitCost { get; set; }
    }

    /// <summary>
    /// كائن يمثل حركة التحويل المخزني بين الفروع (Stock Transfer Header & Details)
    /// </summary>
    public class StockTransfer
    {
        public int TransferID { get; set; }
        public string TransferNumber { get; set; }
        public DateTime TransferDate { get; set; } = DateTime.Now;
        public int FromBranchID { get; set; }
        public string FromBranchName { get; set; }
        public int ToBranchID { get; set; }
        public string ToBranchName { get; set; }
        public int CreatedBy { get; set; }
        public string CreatedByName { get; set; }
        public string Status { get; set; } = "Pending"; // "Pending" (معلق / بالطريق), "Confirmed" (مؤكد ومستلم), "Cancelled" (ملغي)
        public string Notes { get; set; }
        public int? ConfirmedBy { get; set; }
        public DateTime? ConfirmedDate { get; set; }
        public List<StockTransferItem> Items { get; set; } = new List<StockTransferItem>();
    }

    /// <summary>
    /// محرك إدارة التحويلات المخزنية بين الفروع وتحديث الأرصدة ومعاملات SQL Transactions
    /// </summary>
    public class StockTransferEngine
    {
        private readonly string _connectionString = DBConnection.ConnectionString;

        public StockTransferEngine() { }

        public StockTransferEngine(string connectionString)
        {
            _connectionString = connectionString;
        }

        /// <summary>
        /// 1. إنشاء سند تحويل مخزني جديد بحالة Pending وخصم الكمية من الفرع المصدر
        /// </summary>
        public async Task<(bool Success, int TransferID, string Message)> CreateTransferAsync(StockTransfer transfer)
        {
            if (transfer.FromBranchID == transfer.ToBranchID)
            {
                return (false, 0, "خطأ: لا يمكن إجراء تحويل مخزني إلى نفس الفرع المصدر.");
            }

            if (transfer.Items == null || transfer.Items.Count == 0)
            {
                return (false, 0, "خطأ: يجب تحديد صنف واحد على الأقل للتحويل.");
            }

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                SqlTransaction trans = conn.BeginTransaction();

                try
                {
                    // 1. إدراج رأس التحويل في جدول StockTransfers
                    string insertHeader = @"
                        INSERT INTO StockTransfers (TransferDate, FromBranchID, ToBranchID, CreatedBy, Status, Notes) 
                        VALUES (@Date, @FromBranch, @ToBranch, @CreatedBy, N'Pending', @Notes); 
                        SELECT SCOPE_IDENTITY();";

                    int transferId;
                    using (SqlCommand cmd = new SqlCommand(insertHeader, conn, trans))
                    {
                        cmd.Parameters.Add("@Date", SqlDbType.DateTime).Value = transfer.TransferDate;
                        cmd.Parameters.Add("@FromBranch", SqlDbType.Int).Value = transfer.FromBranchID;
                        cmd.Parameters.Add("@ToBranch", SqlDbType.Int).Value = transfer.ToBranchID;
                        cmd.Parameters.Add("@CreatedBy", SqlDbType.Int).Value = transfer.CreatedBy > 0 ? transfer.CreatedBy : UserSession.CurrentUserID;
                        cmd.Parameters.Add("@Notes", SqlDbType.NVarChar, 255).Value = (object)transfer.Notes ?? DBNull.Value;

                        transferId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                    }

                    // 2. إدراج تفاصيل الأصناف وخصم رصيد المخزون من الفرع المحول منه
                    string insertDetail = @"
                        INSERT INTO StockTransferDetails (TransferID, ProductID, Quantity) 
                        VALUES (@TransferID, @ProductID, @Qty);";

                    string deductStock = @"
                        UPDATE Products 
                        SET CurrentStock = CurrentStock - @Qty 
                        WHERE ProductID = @ProductID;";

                    foreach (var it in transfer.Items)
                    {
                        if (it.Quantity <= 0) throw new InvalidOperationException($"كمية الصنف {it.ProductID} غير صحيحة.");

                        using (SqlCommand cmdDetail = new SqlCommand(insertDetail, conn, trans))
                        {
                            cmdDetail.Parameters.Add("@TransferID", SqlDbType.Int).Value = transferId;
                            cmdDetail.Parameters.Add("@ProductID", SqlDbType.Int).Value = it.ProductID;
                            cmdDetail.Parameters.Add("@Qty", SqlDbType.Decimal).Value = it.Quantity;
                            await cmdDetail.ExecuteNonQueryAsync();
                        }

                        // خصم الكمية من مخزون الفرع المصدر
                        using (SqlCommand cmdStock = new SqlCommand(deductStock, conn, trans))
                        {
                            cmdStock.Parameters.Add("@ProductID", SqlDbType.Int).Value = it.ProductID;
                            cmdStock.Parameters.Add("@Qty", SqlDbType.Decimal).Value = it.Quantity;
                            await cmdStock.ExecuteNonQueryAsync();
                        }
                    }

                    trans.Commit();
                    return (true, transferId, $"✓ تم إنشاء إذن التحويل المخزني رقم #{transferId} بنجاح، وخصم البضاعة من الفرع المصدر (قيد النقل).");
                }
                catch (Exception ex)
                {
                    trans.Rollback();
                    return (false, 0, $"فشل إنشاء التحويل المخزني: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// 2. تأكيد استلام الشحنة في الفرع المستلم وإضافة البضاعة إلى رصيده (Confirmed)
        /// </summary>
        public async Task<(bool Success, string Message)> ConfirmTransferAsync(int transferId, int confirmedByUserId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                SqlTransaction trans = conn.BeginTransaction();

                try
                {
                    // التحقق من حالة التحويل الحالي
                    string checkStatus = "SELECT Status, ToBranchID FROM StockTransfers WHERE TransferID = @TransferID;";
                    string currentStatus = null;
                    int toBranchId = 0;

                    using (SqlCommand cmdCheck = new SqlCommand(checkStatus, conn, trans))
                    {
                        cmdCheck.Parameters.Add("@TransferID", SqlDbType.Int).Value = transferId;
                        using (var reader = await cmdCheck.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                currentStatus = reader["Status"].ToString();
                                toBranchId = Convert.ToInt32(reader["ToBranchID"]);
                            }
                        }
                    }

                    if (currentStatus == null) return (false, "إذن التحويل غير موجود.");
                    if (currentStatus == "Confirmed") return (false, "تم تأكيد استلام هذا التحويل مسبقاً.");
                    if (currentStatus == "Cancelled") return (false, "لا يمكن استلام تحويل ملغي.");

                    // جلب الأصناف والكميات
                    string getItems = "SELECT ProductID, Quantity FROM StockTransferDetails WHERE TransferID = @TransferID;";
                    var itemsToReceive = new List<(int ProductId, decimal Qty)>();

                    using (SqlCommand cmdItems = new SqlCommand(getItems, conn, trans))
                    {
                        cmdItems.Parameters.Add("@TransferID", SqlDbType.Int).Value = transferId;
                        using (var reader = await cmdItems.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                itemsToReceive.Add((Convert.ToInt32(reader["ProductID"]), Convert.ToDecimal(reader["Quantity"])));
                            }
                        }
                    }

                    // إضافة الكميات إلى رصيد الفرع المستلم
                    string addStock = @"
                        UPDATE Products 
                        SET CurrentStock = CurrentStock + @Qty 
                        WHERE ProductID = @ProductID;";

                    foreach (var item in itemsToReceive)
                    {
                        using (SqlCommand cmdAdd = new SqlCommand(addStock, conn, trans))
                        {
                            cmdAdd.Parameters.Add("@ProductID", SqlDbType.Int).Value = item.ProductId;
                            cmdAdd.Parameters.Add("@Qty", SqlDbType.Decimal).Value = item.Qty;
                            await cmdAdd.ExecuteNonQueryAsync();
                        }
                    }

                    // تحديث حالة السند إلى Confirmed
                    string updateStatus = @"
                        UPDATE StockTransfers 
                        SET Status = N'Confirmed', ConfirmedBy = @ConfirmedBy, ConfirmedDate = GETDATE() 
                        WHERE TransferID = @TransferID;";

                    using (SqlCommand cmdUpdate = new SqlCommand(updateStatus, conn, trans))
                    {
                        cmdUpdate.Parameters.Add("@TransferID", SqlDbType.Int).Value = transferId;
                        cmdUpdate.Parameters.Add("@ConfirmedBy", SqlDbType.Int).Value = confirmedByUserId;
                        await cmdUpdate.ExecuteNonQueryAsync();
                    }

                    trans.Commit();
                    return (true, $"✓ تم تأكيد استلام سند التحويل رقم #{transferId} بنجاح، وإيداع البضاعة في رصيد الفرع المستلم.");
                }
                catch (Exception ex)
                {
                    trans.Rollback();
                    return (false, $"فشل تأكيد استلام التحويل: {ex.Message}");
                }
            }
        }
    }
}
