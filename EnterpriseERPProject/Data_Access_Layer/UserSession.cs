using System;

namespace EnterpriseERPProject.Data_Access_Layer
{
    /// <summary>
    /// حاوية سياق جلسة المستخدم النشط في برنامج العقرب المحاسبي (Al-Ashal Enterprise ERP)
    /// تُستخدم في كافة نماذج الشاشات والتقارير وطبقة البيانات لفرض عزل الفروع وتحديد الصلاحيات
    /// </summary>
    public static class UserSession
    {
        // 1. المعرفات الأساسية للمستخدم والفرع
        public static int CurrentUserID { get; set; }
        public static string CurrentUserName { get; set; } = "مدير النظام: الحسن";
        public static int CurrentBranchID { get; set; }
        public static string BranchName { get; set; } = "المركز الرئيسي - الرياض";
        public static string UserRole { get; set; } = "Admin"; // "Admin", "Manager", "Cashier", "Auditor"
        
        // 2. معلومات الوردية ووقت تسجيل الدخول (Shift Details)
        public static DateTime LoginTime { get; set; } = DateTime.Now;
        public static int? CurrentShiftID { get; set; }

        // 3. خصائص التحقق المنطقي السريع من الصلاحيات (Role Helper Properties)
        public static bool IsAdmin => string.Equals(UserRole, "Admin", StringComparison.OrdinalIgnoreCase);
        public static bool IsManager => string.Equals(UserRole, "Manager", StringComparison.OrdinalIgnoreCase);
        public static bool IsCashier => string.Equals(UserRole, "Cashier", StringComparison.OrdinalIgnoreCase);

        /// <summary>
        /// الحصول على نص الترويسة المعتمد لشريط عنوان النوافذ (مطابق للأسهل انتربرايس)
        /// </summary>
        public static string GetWindowHeader(string formTitle)
        {
            return $"{formTitle} - [{BranchName} - المستخدم: {CurrentUserID} - {CurrentUserName} ({UserRole})]";
        }

        /// <summary>
        /// تصفير الجلسة عند تسجيل الخروج أو تغيير المستخدم
        /// </summary>
        public static void Clear()
        {
            CurrentUserID = 0;
            CurrentUserName = string.Empty;
            CurrentBranchID = 0;
            BranchName = string.Empty;
            UserRole = string.Empty;
            CurrentShiftID = null;
            LoginTime = DateTime.MinValue;
        }

        /// <summary>
        /// تهيئة بيانات الجلسة بعد نجاح شاشة تسجيل الدخول
        /// </summary>
        public static void Initialize(int userId, string userName, int branchId, string branchName, string role, int? shiftId = null)
        {
            CurrentUserID = userId;
            CurrentUserName = userName;
            CurrentBranchID = branchId;
            BranchName = branchName;
            UserRole = role;
            CurrentShiftID = shiftId;
            LoginTime = DateTime.Now;
        }
    }
}
