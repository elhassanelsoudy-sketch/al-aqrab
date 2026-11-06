using System;
using System.Data;
using System.Data.SqlClient;
using EnterpriseERPProject.Data_Access_Layer;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    // =========================================================================
    // 1. النماذج البرمجية للورديات ومشاريع المقاولات الآجلة
    // =========================================================================
    
    public class PosShiftDto
    {
        public int ShiftID { get; set; }
        public int UserID { get; set; }
        public int BranchID { get; set; }
        public decimal OpeningCash { get; set; }
        public decimal ClosingActualCash { get; set; }
        public decimal ClosingExpectedCash { get; set; }
        public decimal Variance { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string Status { get; set; } // "Open", "Closed"
    }

    public class CreditProjectInvoiceDto
    {
        public string InvoiceNumber { get; set; }
        public int CustomerID { get; set; }
        public int ProjectID { get; set; } // ربط الفاتورة بمشروع مقاولات محدد (مركز التكلفة)
        public decimal NetTotal { get; set; }
        public DateTime DueDate { get; set; } // تاريخ استحقاق الدفعة الآجلة للمستخلص
        public int BranchID { get; set; }
        public int UserID { get; set; }
        public string CreatedBy { get; set; }
        public string Notes { get; set; }
    }

    // =========================================================================
    // 2. المحرك التشغيلي الموحد لإدارة الـ POS وفواتير المقاولات الآجلة
    // =========================================================================
    
    public class HybridOperationsEngine
    {
        private readonly string _connectionString;

        public HybridOperationsEngine()
        {
            _connectionString = DBConnection.ConnectionString;
        }

        public HybridOperationsEngine(string connectionString)
        {
            _connectionString = string.IsNullOrWhiteSpace(connectionString) 
                ? DBConnection.ConnectionString 
                : connectionString;
        }

        /// <summary>
        /// أولاً: فتح وردية كاشير جديدة لنقاط البيع السريعة مع التحقق من عدم وجود وردية معلقة
        /// </summary>
        public int OpenPosShift(int userId, int branchId, decimal openingCash, out string errorMsg)
        {
            errorMsg = string.Empty;

            if (openingCash < 0)
            {
                errorMsg = "خطأ تشغيلي: لا يمكن أن يكون رصيد العهدة النقدية الافتتاحية سالباً.";
                return 0;
            }

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                try
                {
                    conn.Open();

                    // 1. التحقق من عدم وجود وردية مفتوحة حالياً لنفس المستخدم في هذا الفرع
                    string checkOpenShiftQuery = @"
                        SELECT TOP 1 ShiftID 
                        FROM PosShifts 
                        WHERE UserID = @User AND BranchID = @Branch AND Status = 'Open' 
                        ORDER BY ShiftID DESC;";

                    using (SqlCommand checkCmd = new SqlCommand(checkOpenShiftQuery, conn))
                    {
                        checkCmd.Parameters.Add("@User", SqlDbType.Int).Value = userId;
                        checkCmd.Parameters.Add("@Branch", SqlDbType.Int).Value = branchId;
                        object existingShift = checkCmd.ExecuteScalar();

                        if (existingShift != null && existingShift != DBNull.Value)
                        {
                            errorMsg = $"تنبيه أمني: يوجد وردية مفتوحة بالفعل برقم #{existingShift} لهذا المستخدم. يجب إغلاقها أولاً قبل فتح وردية جديدة.";
                            return 0;
                        }
                    }

                    // 2. إنشاء الوردية وتصفير العداد وبدء توثيق الحركات
                    string query = @"
                        INSERT INTO PosShifts (UserID, BranchID, OpeningCash, StartTime, Status) 
                        VALUES (@User, @Branch, @OpenCash, GETDATE(), 'Open'); 
                        SELECT SCOPE_IDENTITY();";

                    int newShiftId;
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        cmd.Parameters.Add("@User", SqlDbType.Int).Value = userId;
                        cmd.Parameters.Add("@Branch", SqlDbType.Int).Value = branchId;
                        
                        var pCash = cmd.Parameters.Add("@OpenCash", SqlDbType.Decimal);
                        pCash.Precision = 18; pCash.Scale = 2;
                        pCash.Value = openingCash;

                        newShiftId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    // 3. تحديث سياق الجلسة إذا كان المستخدم النشط هو نفس الكاشير
                    if (userId == UserSession.CurrentUserID)
                    {
                        UserSession.CurrentShiftID = newShiftId;
                    }

                    return newShiftId;
                }
                catch (Exception ex)
                {
                    errorMsg = $"فشل فتح الوردية: {ex.Message}";
                    return 0;
                }
            }
        }

        /// <summary>
        /// ثانياً: إغلاق الوردية ومقارنة الكاش الدفتري بالفعلي واحتساب العجز أو الزيادة بدقة
        /// يعتمد حساب المبيعات على مبيعات النقدية فقط الواقعة داخل الإطار الزمني للوردية حصراً
        /// </summary>
        public bool ClosePosShift(PosShiftDto shift, out decimal variance, out string errorMsg)
        {
            errorMsg = string.Empty;
            variance = 0;

            if (shift == null || shift.ShiftID <= 0)
            {
                errorMsg = "بيانات الوردية المراد إغلاقها غير صالحة.";
                return false;
            }

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                SqlTransaction trans = conn.BeginTransaction();

                try
                {
                    DateTime shiftStartTime;
                    decimal openingCash = shift.OpeningCash;

                    // 1. استرجاع بيانات الوردية والتأكد من أنها لا تزال مفتوحة
                    string getShiftQuery = "SELECT StartTime, OpeningCash, Status FROM PosShifts WHERE ShiftID = @ShiftID";
                    using (SqlCommand cmd = new SqlCommand(getShiftQuery, conn, trans))
                    {
                        cmd.Parameters.Add("@ShiftID", SqlDbType.Int).Value = shift.ShiftID;
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            if (!reader.Read())
                            {
                                throw new Exception($"لم يتم العثور على الوردية رقم #{shift.ShiftID}.");
                            }

                            string status = reader["Status"]?.ToString();
                            if (status == "Closed")
                            {
                                throw new Exception($"الوردية رقم #{shift.ShiftID} مغلقة بالفعل مسبقاً.");
                            }

                            shiftStartTime = Convert.ToDateTime(reader["StartTime"]);
                            if (openingCash == 0 && reader["OpeningCash"] != DBNull.Value)
                            {
                                openingCash = Convert.ToDecimal(reader["OpeningCash"]);
                            }
                        }
                    }

                    // 2. حساب إجمالي المبيعات النقدية الصافية المحققة خلال زمن الوردية بدقة
                    // (يستثني المبيعات الآجلة ومبيعات البطاقات/الشبكة لأنها لا تدخل درج الكاش الفعلي)
                    decimal totalCashSales = 0;
                    string sumSalesQuery = @"
                        SELECT ISNULL(SUM(NetTotal), 0) 
                        FROM SalesInvoices 
                        WHERE BranchID = @Branch 
                          AND (CreatedBy = @UserName OR CreatedBy = @UserIDStr)
                          AND InvoiceDate >= @StartTime 
                          AND InvoiceDate <= GETDATE()
                          AND (PaymentMethod = N'نقدي' OR PaymentMethod = 'Cash');";

                    using (SqlCommand cmd = new SqlCommand(sumSalesQuery, conn, trans))
                    {
                        cmd.Parameters.Add("@Branch", SqlDbType.Int).Value = shift.BranchID;
                        cmd.Parameters.Add("@UserName", SqlDbType.NVarChar, 100).Value = UserSession.CurrentUserName ?? "";
                        cmd.Parameters.Add("@UserIDStr", SqlDbType.NVarChar, 50).Value = shift.UserID.ToString();
                        cmd.Parameters.Add("@StartTime", SqlDbType.DateTime).Value = shiftStartTime;

                        totalCashSales = Convert.ToDecimal(cmd.ExecuteScalar());
                    }

                    // 3. حساب الكاش المتوقع دفترياً = الكاش الافتتاحي + المبيعات النقدية
                    decimal expectedCash = openingCash + totalCashSales;

                    // 4. حساب الفارق (قيمة موجبة تعني زيادة في الصندوق، وسالبة تعني عجزاً مالياً)
                    variance = shift.ClosingActualCash - expectedCash;

                    // 5. تحديث سجل الوردية في قاعدة البيانات وتثبيت نتيجة الجرد والرقابة
                    string updateShiftQuery = @"
                        UPDATE PosShifts 
                        SET EndTime = GETDATE(), 
                            ClosingExpectedCash = @Expected, 
                            ClosingActualCash = @Actual, 
                            Variance = @Variance, 
                            Status = 'Closed' 
                        WHERE ShiftID = @ShiftID;";

                    using (SqlCommand cmd = new SqlCommand(updateShiftQuery, conn, trans))
                    {
                        var pExp = cmd.Parameters.Add("@Expected", SqlDbType.Decimal);
                        pExp.Precision = 18; pExp.Scale = 2;
                        pExp.Value = expectedCash;

                        var pAct = cmd.Parameters.Add("@Actual", SqlDbType.Decimal);
                        pAct.Precision = 18; pAct.Scale = 2;
                        pAct.Value = shift.ClosingActualCash;

                        var pVar = cmd.Parameters.Add("@Variance", SqlDbType.Decimal);
                        pVar.Precision = 18; pVar.Scale = 2;
                        pVar.Value = variance;

                        cmd.Parameters.Add("@ShiftID", SqlDbType.Int).Value = shift.ShiftID;
                        cmd.ExecuteNonQuery();
                    }

                    trans.Commit();

                    // تصفير معرف الوردية من الجلسة في حال كان المستخدم هو الكاشير المسجل
                    if (shift.UserID == UserSession.CurrentUserID)
                    {
                        UserSession.CurrentShiftID = null;
                    }

                    return true;
                }
                catch (Exception ex)
                {
                    try { trans.Rollback(); } catch { }
                    errorMsg = $"فشل إغلاق الوردية: {ex.Message}";
                    return false;
                }
            }
        }

        /// <summary>
        /// ثالثاً: معالجة وترحيل فواتير المقاولات والشركات بالآجل وربطها بالمشاريع والذمم وتوليد القيد المحاسبي المتوازن آلياً
        /// </summary>
        public bool PostCreditProjectInvoice(CreditProjectInvoiceDto inv, out string errorMsg)
        {
            errorMsg = string.Empty;

            if (inv == null || inv.NetTotal <= 0)
            {
                errorMsg = "قيمة الفاتورة الآجلة يجب أن تكون أكبر من الصفر.";
                return false;
            }

            if (inv.CustomerID <= 0 || inv.ProjectID <= 0)
            {
                errorMsg = "خطأ: يجب تحديد العميل ومشروع المقاولات المرتبط بالفاتورة.";
                return false;
            }

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                SqlTransaction trans = conn.BeginTransaction();

                try
                {
                    // 1. إدراج الفاتورة الآجلة في جدول فواتير المشاريع وربطها بالمشروع والعميل وتاريخ الاستحقاق
                    string queryInvoice = @"
                        INSERT INTO ProjectInvoices (InvoiceNumber, CustomerID, ProjectID, NetTotal, DueDate, BranchID, IsPaid, CreatedAt) 
                        VALUES (@InvNo, @CustID, @ProjID, @Net, @Due, @Branch, 0, GETDATE()); 
                        SELECT SCOPE_IDENTITY();";

                    int projectInvoiceId;
                    using (SqlCommand cmd = new SqlCommand(queryInvoice, conn, trans))
                    {
                        cmd.Parameters.Add("@InvNo", SqlDbType.NVarChar, 50).Value = inv.InvoiceNumber;
                        cmd.Parameters.Add("@CustID", SqlDbType.Int).Value = inv.CustomerID;
                        cmd.Parameters.Add("@ProjID", SqlDbType.Int).Value = inv.ProjectID;

                        var pNet = cmd.Parameters.Add("@Net", SqlDbType.Decimal);
                        pNet.Precision = 18; pNet.Scale = 2;
                        pNet.Value = inv.NetTotal;

                        cmd.Parameters.Add("@Due", SqlDbType.DateTime).Value = inv.DueDate;
                        cmd.Parameters.Add("@Branch", SqlDbType.Int).Value = inv.BranchID;

                        projectInvoiceId = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    // 2. توليد رأس القيد المحاسبي المزدوج في دفتر اليومية العامة JournalEntries
                    string insertJournalHeader = @"
                        INSERT INTO JournalEntries (EntryDate, ReferenceNumber, Description, BranchID, IsPosted, CreatedBy, CreatedAt) 
                        VALUES (GETDATE(), @RefNo, @Desc, @BranchID, 1, @CreatedBy, GETDATE()); 
                        SELECT SCOPE_IDENTITY();";

                    int newEntryId;
                    using (SqlCommand cmdHeader = new SqlCommand(insertJournalHeader, conn, trans))
                    {
                        cmdHeader.Parameters.Add("@RefNo", SqlDbType.NVarChar, 50).Value = (object)inv.InvoiceNumber ?? DBNull.Value;
                        cmdHeader.Parameters.Add("@Desc", SqlDbType.NVarChar, 255).Value = $"فاتورة مقاولات آجلة رقم {inv.InvoiceNumber} - مشروع #{inv.ProjectID}";
                        cmdHeader.Parameters.Add("@BranchID", SqlDbType.Int).Value = inv.BranchID;
                        cmdHeader.Parameters.Add("@CreatedBy", SqlDbType.NVarChar, 100).Value = inv.CreatedBy ?? UserSession.CurrentUserName ?? "النظام المالي";

                        newEntryId = Convert.ToInt32(cmdHeader.ExecuteScalar());
                    }

                    // 3. تطبيق قاعدة القيد المزدوج الإلزامية المتوازنة (Debit = Credit):
                    string insertLines = @"
                        INSERT INTO JournalEntryDetails (EntryID, AccountID, Debit, Credit, CostCenterID, LineDescription) 
                        VALUES (@EntryID, @AccID, @Deb, @Cred, @CCID, @LineDesc);";

                    // السطر الأول (الطرف المدين): حساب ذمم العملاء / عقود مقاولات (103001) لإثبات المديونية
                    using (SqlCommand cmdLineDebit = new SqlCommand(insertLines, conn, trans))
                    {
                        cmdLineDebit.Parameters.Add("@EntryID", SqlDbType.Int).Value = newEntryId;
                        cmdLineDebit.Parameters.Add("@AccID", SqlDbType.Int).Value = 103001; // ذمم عقود ومشاريع مقاولات

                        var pDeb = cmdLineDebit.Parameters.Add("@Deb", SqlDbType.Decimal);
                        pDeb.Precision = 18; pDeb.Scale = 2;
                        pDeb.Value = inv.NetTotal;

                        var pCred = cmdLineDebit.Parameters.Add("@Cred", SqlDbType.Decimal);
                        pCred.Precision = 18; pCred.Scale = 2;
                        pCred.Value = 0m;

                        cmdLineDebit.Parameters.Add("@CCID", SqlDbType.Int).Value = inv.ProjectID; // ربط مركز التكلفة بالمشروع
                        cmdLineDebit.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255).Value = $"استحقاق مستخلص فاتورة #{inv.InvoiceNumber} - عميل #{inv.CustomerID}";
                        cmdLineDebit.ExecuteNonQuery();
                    }

                    // السطر الثاني (الطرف الدائن): حساب إيرادات مشاريع المقاولات والإنشاءات (410201) لإتمام التوازن
                    using (SqlCommand cmdLineCredit = new SqlCommand(insertLines, conn, trans))
                    {
                        cmdLineCredit.Parameters.Add("@EntryID", SqlDbType.Int).Value = newEntryId;
                        cmdLineCredit.Parameters.Add("@AccID", SqlDbType.Int).Value = 410201; // إيرادات عقود ومشاريع المقاولات

                        var pDeb = cmdLineCredit.Parameters.Add("@Deb", SqlDbType.Decimal);
                        pDeb.Precision = 18; pDeb.Scale = 2;
                        pDeb.Value = 0m;

                        var pCred = cmdLineCredit.Parameters.Add("@Cred", SqlDbType.Decimal);
                        pCred.Precision = 18; pCred.Scale = 2;
                        pCred.Value = inv.NetTotal;

                        cmdLineCredit.Parameters.Add("@CCID", SqlDbType.Int).Value = inv.ProjectID;
                        cmdLineCredit.Parameters.Add("@LineDesc", SqlDbType.NVarChar, 255).Value = $"إيراد مشروع مقاولات #{inv.ProjectID} - فاتورة #{inv.InvoiceNumber}";
                        cmdLineCredit.ExecuteNonQuery();
                    }

                    trans.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    try { trans.Rollback(); } catch { }
                    errorMsg = $"فشل ترحيل فاتورة المشروع: {ex.Message}";
                    return false;
                }
            }
        }
    }
}
