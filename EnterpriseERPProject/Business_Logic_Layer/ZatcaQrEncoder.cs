using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace EnterpriseERPProject.Business_Logic_Layer
{
    /// <summary>
    /// نموذج نتائج فك تشفير باركود هيئة الزكاة والضريبة والجمارك (ZATCA TLV Inspector Result)
    /// </summary>
    public class ZatcaQrTagInfo
    {
        public int TagNumber { get; set; }
        public string TagName { get; set; }
        public int Length { get; set; }
        public string Value { get; set; }
    }

    /// <summary>
    /// محرك تشفير وفك تشفير باركود الفاتورة الضريبية الإلكترونية المعتمد من هيئة الزكاة والضريبة والجمارك (ZATCA Phase 1 & 2)
    /// بنظام ترميز الـ TLV (Tag-Length-Value) Base64 UTF-8
    /// </summary>
    public class ZatcaQrEncoder
    {
        /// <summary>
        /// توليد كود Base64 المشفر لباركود الفاتورة الإلكترونية للمرحلة الأولى (5 Tags إجبارية)
        /// </summary>
        /// <param name="sellerName">اسم المورد أو المنشأة المسجل ضريبياً (Tag 1)</param>
        /// <param name="vatNumber">الرقم الضريبي المكون من 15 رقماً يبدأ وينتهي بـ 3 (Tag 2)</param>
        /// <param name="timestamp">تاريخ ووقت الفاتورة بتنسيق UTC ISO 8601 (Tag 3)</param>
        /// <param name="totalWithVat">إجمالي الفاتورة شاملاً ضريبة القيمة المضافة 15% (Tag 4)</param>
        /// <param name="vatTotal">إجمالي مبلغ ضريبة القيمة المضافة (Tag 5)</param>
        /// <returns>سلسلة Base64 جاهزة للتمرير لأي مكتبة توليد QR Code</returns>
        public static string GenerateZatcaBase64Qr(string sellerName, string vatNumber, DateTime timestamp, decimal totalWithVat, decimal vatTotal)
        {
            if (string.IsNullOrWhiteSpace(sellerName)) throw new ArgumentNullException(nameof(sellerName));
            if (string.IsNullOrWhiteSpace(vatNumber)) throw new ArgumentNullException(nameof(vatNumber));

            byte[] tag1Seller = Encoding.UTF8.GetBytes(sellerName.Trim());
            byte[] tag2VatNo = Encoding.UTF8.GetBytes(vatNumber.Trim());
            byte[] tag3Time = Encoding.UTF8.GetBytes(timestamp.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"));
            byte[] tag4Total = Encoding.UTF8.GetBytes(totalWithVat.ToString("F2"));
            byte[] tag5Vat = Encoding.UTF8.GetBytes(vatTotal.ToString("F2"));

            using (var tlvStream = new MemoryStream())
            {
                // Tag 1: اسم المورد
                WriteTlvTag(tlvStream, 1, tag1Seller);

                // Tag 2: الرقم الضريبي
                WriteTlvTag(tlvStream, 2, tag2VatNo);

                // Tag 3: الطابع الزمني بتنسيق ISO 8601
                WriteTlvTag(tlvStream, 3, tag3Time);

                // Tag 4: إجمالي الفاتورة مع الضريبة
                WriteTlvTag(tlvStream, 4, tag4Total);

                // Tag 5: مبلغ الضريبة 15%
                WriteTlvTag(tlvStream, 5, tag5Vat);

                return Convert.ToBase64String(tlvStream.ToArray());
            }
        }

        /// <summary>
        /// كتابة وسم TLV قياسي في مجرى البايتات (Tag + Length + Value)
        /// </summary>
        private static void WriteTlvTag(MemoryStream stream, byte tagNumber, byte[] valueBytes)
        {
            stream.WriteByte(tagNumber);
            stream.WriteByte((byte)valueBytes.Length);
            stream.Write(valueBytes, 0, valueBytes.Length);
        }

        /// <summary>
        /// فك تشفير سلسلة ZATCA Base64 إلى حقولها الأصلية لفحص المطابقة والتحقق من صحة الفاتورة
        /// </summary>
        public static List<ZatcaQrTagInfo> DecodeZatcaBase64Qr(string base64String)
        {
            var list = new List<ZatcaQrTagInfo>();
            if (string.IsNullOrWhiteSpace(base64String)) return list;

            byte[] bytes = Convert.FromBase64String(base64String);
            int index = 0;

            var tagNames = new Dictionary<int, string>
            {
                { 1, "اسم المورد (Seller Name)" },
                { 2, "الرقم الضريبي (VAT Registration Number)" },
                { 3, "الوقت والتاريخ (Invoice Timestamp)" },
                { 4, "إجمالي الفاتورة مع الضريبة (Invoice Total with VAT)" },
                { 5, "مبلغ الضريبة 15% (VAT Amount)" },
                { 6, "هاش الفاتورة (Invoice Hash - Phase 2)" },
                { 7, "التوقيع الرقمي (ECDSA Signature - Phase 2)" },
                { 8, "المفتاح العام (Public Key - Phase 2)" }
            };

            while (index < bytes.Length)
            {
                if (index + 2 > bytes.Length) break;

                int tag = bytes[index++];
                int length = bytes[index++];

                if (index + length > bytes.Length) break;

                string val;
                if (tag == 6 || tag == 7 || tag == 8)
                {
                    // الحقول الثنائية المشفرة في المرحلة الثانية
                    byte[] sub = new byte[length];
                    Array.Copy(bytes, index, sub, 0, length);
                    val = Convert.ToBase64String(sub);
                }
                else
                {
                    // حقول النصوص العربية والإنجليزية في المرحلة الأولى
                    val = Encoding.UTF8.GetString(bytes, index, length);
                }

                index += length;

                list.Add(new ZatcaQrTagInfo
                {
                    TagNumber = tag,
                    TagName = tagNames.ContainsKey(tag) ? tagNames[tag] : $"وسم إضافي (Tag {tag})",
                    Length = length,
                    Value = val
                });
            }

            return list;
        }
    }
}
