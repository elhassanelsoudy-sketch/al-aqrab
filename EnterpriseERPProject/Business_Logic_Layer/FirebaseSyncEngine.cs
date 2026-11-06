using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    /// <summary>
    /// كائن يمثل هيكل الفاتورة الجاهزة للإرسال السحابي لقاعدة بيانات الفروع
    /// </summary>
    public class FirebaseInvoiceDto
    {
        public string InvoiceNumber { get; set; }
        public string InvoiceDate { get; set; }
        public int BranchID { get; set; }
        public string BranchName { get; set; }
        public decimal TotalBeforeVat { get; set; }
        public decimal TotalVat { get; set; }
        public decimal NetTotal { get; set; }
        public string QrCodeBase64 { get; set; }
        public string PaymentMethod { get; set; } = "نقدي";
        public string CreatedBy { get; set; }
        public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// محرك المزامنة السحابية اللحظية مع منصة Firebase Realtime Database لربط الفروع بالمركز الرئيسي
    /// يدعم استمرار العمل Offline في حال انقطاع الإنترنت وإعادة الإرسال
    /// </summary>
    public class FirebaseSyncEngine
    {
        // رابط مشروع Firebase في السحابة
        public static string FirebaseProjectUrl { get; set; } = "https://al-aqrab-erp-default-rtdb.firebaseio.com/";

        // استخدام كائن HttpClient وحيد لتفادي استنزاف منافذ ومقابس الشبكة (Socket Exhaustion Prevention)
        private static readonly HttpClient _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(10)
        };

        /// <summary>
        /// رفع الفاتورة ومزامنتها فورياً إلى مستودع الفرع السحابي في Firebase
        /// </summary>
        public static async Task<bool> UploadInvoiceToCloud(FirebaseInvoiceDto invoice)
        {
            if (invoice == null) return false;

            try
            {
                // التأكد من تنسيق الرابط ليكون متوافقاً مع معايير Firebase REST API
                string baseUrl = FirebaseProjectUrl.TrimEnd('/') + "/";
                string targetUrl = $"{baseUrl}branches/branch_{invoice.BranchID}/invoices/{invoice.InvoiceNumber}.json";

                // تحويل كائن الفاتورة إلى صيغة JSON نصية UTF-8
                string jsonPayload = JsonConvert.SerializeObject(invoice);
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                // إرسال طلب PUT السحابي لحفظ الفاتورة برقمها الفريد داخل مستودع الفروع
                HttpResponseMessage response = await _httpClient.PutAsync(targetUrl, content);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                // تسجيل الخطأ محلياً في سجل أخطاء المزامنة (Sync Error Logging)
                System.Diagnostics.Debug.WriteLine($"[Firebase Sync Warning]: فشل الإرسال السحابي للفرع {invoice.BranchID} - {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// فحص حالة الاتصال السحابي بالخادم المركزي للـ Firebase
        /// </summary>
        public static async Task<bool> TestCloudConnectionAsync()
        {
            try
            {
                string baseUrl = FirebaseProjectUrl.TrimEnd('/') + "/";
                string pingUrl = $"{baseUrl}.json?shallow=true";
                HttpResponseMessage res = await _httpClient.GetAsync(pingUrl);
                return res.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }
    }
}
