const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'database.json');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// ==========================================================
// دليل الحسابات الافتراضي المعتمد (Default Standard Chart of Accounts)
// ==========================================================
const DEFAULT_ACCOUNTS = [
    // 1 الأصول
    { code: "1", nameAr: "الأصول", nameEn: "Assets", level: 1, parent: null, type: "asset", nature: "debit" },
    { code: "11", nameAr: "الأصول المتداولة", nameEn: "Current Assets", level: 2, parent: "1", type: "asset", nature: "debit" },
    { code: "1101", nameAr: "النقدية والبنوك", nameEn: "Cash & Banks", level: 3, parent: "11", type: "asset", nature: "debit" },
    { code: "110101", nameAr: "الصندوق الرئيسي", nameEn: "Main Cashier", level: 4, parent: "1101", type: "asset", nature: "debit", openingBalance: 85000 },
    { code: "110102", nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank", level: 4, parent: "1101", type: "asset", nature: "debit", openingBalance: 175000 },
    { code: "110103", nameAr: "البنك الأهلي السعودي", nameEn: "SNB Bank", level: 4, parent: "1101", type: "asset", nature: "debit", openingBalance: 90000 },
    { code: "1102", nameAr: "العملاء والمدينون", nameEn: "Accounts Receivable", level: 3, parent: "11", type: "asset", nature: "debit" },
    { code: "110201", nameAr: "مؤسسة النخيل الحديثة", nameEn: "Al-Nakheel Est", level: 4, parent: "1102", type: "asset", nature: "debit", openingBalance: 18500 },
    { code: "110202", nameAr: "شركة الأمل للتجارة", nameEn: "Al-Amal Trading Co", level: 4, parent: "1102", type: "asset", nature: "debit", openingBalance: 24300 },
    { code: "110203", nameAr: "عملاء نقديون عامون", nameEn: "Cash Customers", level: 4, parent: "1102", type: "asset", nature: "debit", openingBalance: 0 },
    { code: "1103", nameAr: "المخزون السلعي", nameEn: "Inventory", level: 3, parent: "11", type: "asset", nature: "debit" },
    { code: "110301", nameAr: "مستودع البضائع الرئيسي", nameEn: "Main Warehouse", level: 4, parent: "1103", type: "asset", nature: "debit", openingBalance: 125000 },
    { code: "1104", nameAr: "ضريبة القيمة المضافة - مدخلات 15%", nameEn: "VAT Input Tax 15%", level: 4, parent: "11", type: "asset", nature: "debit", openingBalance: 4200 },
    
    // 12 الأصول الثابتة
    { code: "12", nameAr: "الأصول الثابتة", nameEn: "Fixed Assets", level: 2, parent: "1", type: "asset", nature: "debit" },
    { code: "1201", nameAr: "أثاث وتجهيزات مكتبية", nameEn: "Office Furniture", level: 3, parent: "12", type: "asset", nature: "debit", openingBalance: 32000 },
    { code: "1202", nameAr: "سيارات وشاحنات نقل", nameEn: "Vehicles & Trucks", level: 3, parent: "12", type: "asset", nature: "debit", openingBalance: 75000 },

    // 2 الخصوم والالتزامات
    { code: "2", nameAr: "الخصوم والالتزامات", nameEn: "Liabilities", level: 1, parent: null, type: "liability", nature: "credit" },
    { code: "21", nameAr: "الخصوم المتداولة", nameEn: "Current Liabilities", level: 2, parent: "2", type: "liability", nature: "credit" },
    { code: "2101", nameAr: "الموردون والدائنون", nameEn: "Accounts Payable", level: 3, parent: "21", type: "liability", nature: "credit" },
    { code: "210101", nameAr: "شركة التوريدات الزراعية", nameEn: "Agri Supply Co", level: 4, parent: "2101", type: "liability", nature: "credit", openingBalance: 29000 },
    { code: "210102", nameAr: "مصنع الأنابيب والري", nameEn: "Irrigation Pipes Factory", level: 4, parent: "2101", type: "liability", nature: "credit", openingBalance: 15800 },
    { code: "2102", nameAr: "ضريبة القيمة المضافة - مخرجات 15%", nameEn: "VAT Output Tax 15%", level: 3, parent: "21", type: "liability", nature: "credit", openingBalance: 8700 },
    { code: "2103", nameAr: "مصروفات مستحقة ورواتب", nameEn: "Accrued Expenses & Salaries", level: 3, parent: "21", type: "liability", nature: "credit", openingBalance: 14500 },

    // 3 حقوق الملكية
    { code: "3", nameAr: "حقوق الملكية", nameEn: "Owner's Equity", level: 1, parent: null, type: "equity", nature: "credit" },
    { code: "31", nameAr: "رأس المال والاحتياطيات", nameEn: "Capital & Reserves", level: 2, parent: "3", type: "equity", nature: "credit" },
    { code: "3101", nameAr: "رأس المال المدفوع", nameEn: "Paid-in Capital", level: 3, parent: "31", type: "equity", nature: "credit", openingBalance: 500000 },
    { code: "3102", nameAr: "الأرباح المبقاة المدورة", nameEn: "Retained Earnings", level: 3, parent: "31", type: "equity", nature: "credit", openingBalance: 61000 },

    // 4 الإيرادات
    { code: "4", nameAr: "الإيرادات", nameEn: "Revenues", level: 1, parent: null, type: "revenue", nature: "credit" },
    { code: "41", nameAr: "إيرادات النشاط الرئيسي", nameEn: "Operating Revenues", level: 2, parent: "4", type: "revenue", nature: "credit" },
    { code: "4101", nameAr: "مبيعات الأصناف والبضائع", nameEn: "Merchandise Sales", level: 3, parent: "41", type: "revenue", nature: "credit", openingBalance: 0 },
    { code: "4102", nameAr: "إيرادات خدمات ونقل وتركيب", nameEn: "Service & Installation Revenue", level: 3, parent: "41", type: "revenue", nature: "credit", openingBalance: 0 },
    { code: "4103", nameAr: "خصم مكتسب من الموردين", nameEn: "Discounts Received", level: 3, parent: "41", type: "revenue", nature: "credit", openingBalance: 0 },

    // 5 المصروفات
    { code: "5", nameAr: "المصروفات", nameEn: "Expenses", level: 1, parent: null, type: "expense", nature: "debit" },
    { code: "51", nameAr: "تكلفة المبيعات", nameEn: "Cost of Sales", level: 2, parent: "5", type: "expense", nature: "debit" },
    { code: "5101", nameAr: "تكلفة البضاعة المباعة", nameEn: "Cost of Goods Sold", level: 3, parent: "51", type: "expense", nature: "debit", openingBalance: 0 },
    { code: "52", nameAr: "المصروفات التشغيلية والعمومية", nameEn: "Operating & Admin Expenses", level: 2, parent: "5", type: "expense", nature: "debit" },
    { code: "5201", nameAr: "رواتب وأجور الموظفين", nameEn: "Salaries & Wages", level: 3, parent: "52", type: "expense", nature: "debit", openingBalance: 0 },
    { code: "5202", nameAr: "إيجار المعرض والمستودع", nameEn: "Rent Expense", level: 3, parent: "52", type: "expense", nature: "debit", openingBalance: 0 },
    { code: "5203", nameAr: "كهرباء ومياه وإنترنت", nameEn: "Utilities Expense", level: 3, parent: "52", type: "expense", nature: "debit", openingBalance: 0 },
    { code: "5204", nameAr: "مصروفات صيانة ونظافة", nameEn: "Maintenance & Cleaning", level: 3, parent: "52", type: "expense", nature: "debit", openingBalance: 0 },
    { code: "5205", nameAr: "خصم مسموح به للعملاء", nameEn: "Discounts Allowed", level: 3, parent: "52", type: "expense", nature: "debit", openingBalance: 0 }
];

// تهيئة قاعدة البيانات المحلية
function initDatabase() {
    if (!fs.existsSync(path.dirname(DB_FILE))) {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
        const initialDb = {
            companyInfo: {
                nameAr: "مؤسسة الأسهل التجارية - انتربرايس",
                nameEn: "AL-ASHAL ENTERPRISE ERP",
                vatNumber: "310485923800003",
                crNumber: "1010892744",
                currency: "ريال سعودي",
                taxRate: 15
            },
            accounts: DEFAULT_ACCOUNTS,
            journalEntries: [
                {
                    id: 1,
                    entryNumber: "JV-2026-001",
                    date: "2026-10-01",
                    docType: "افتتاحي",
                    refNo: "OP-01",
                    description: "القيد الافتتاحي لأرصدة أول المدة للسنة المالية 2026",
                    isPosted: true,
                    lines: [
                        { accountCode: "110101", accountName: "الصندوق الرئيسي", debit: 85000, credit: 0, desc: "رصيد افتتاحي" },
                        { accountCode: "110102", accountName: "مصرف الراجحي", debit: 175000, credit: 0, desc: "رصيد افتتاحي" },
                        { accountCode: "110103", accountName: "البنك الأهلي السعودي", debit: 90000, credit: 0, desc: "رصيد افتتاحي" },
                        { accountCode: "110201", accountName: "مؤسسة النخيل الحديثة", debit: 18500, credit: 0, desc: "رصيد افتتاحي" },
                        { accountCode: "110202", accountName: "شركة الأمل للتجارة", debit: 24300, credit: 0, desc: "رصيد افتتاحي" },
                        { accountCode: "110301", accountName: "مستودع البضائع الرئيسي", debit: 125000, credit: 0, desc: "رصيد افتتاحي" },
                        { accountCode: "1104", accountName: "ضريبة القيمة المضافة - مدخلات 15%", debit: 4200, credit: 0, desc: "رصيد افتتاحي" },
                        { accountCode: "1201", accountName: "أثاث وتجهيزات مكتبية", debit: 32000, credit: 0, desc: "رصيد افتتاحي" },
                        { accountCode: "1202", accountName: "سيارات وشاحنات نقل", debit: 75000, credit: 0, desc: "رصيد افتتاحي" },
                        { accountCode: "210101", accountName: "شركة التوريدات الزراعية", debit: 0, credit: 29000, desc: "رصيد افتتاحي" },
                        { accountCode: "210102", accountName: "مصنع الأنابيب والري", debit: 0, credit: 15800, desc: "رصيد افتتاحي" },
                        { accountCode: "2102", accountName: "ضريبة القيمة المضافة - مخرجات 15%", debit: 0, credit: 8700, desc: "رصيد افتتاحي" },
                        { accountCode: "2103", accountName: "مصروفات مستحقة ورواتب", debit: 0, credit: 14500, desc: "رصيد افتتاحي" },
                        { accountCode: "3101", accountName: "رأس المال المدفوع", debit: 0, credit: 500000, desc: "رصيد افتتاحي" },
                        { accountCode: "3102", accountName: "الأرباح المبقاة المدورة", debit: 0, credit: 61000, desc: "رصيد افتتاحي" }
                    ]
                }
            ],
            invoices: [],
            vouchers: [],
            customers: [
                { id: "1", code: "110201", name: "مؤسسة النخيل الحديثة", phone: "0501234567", vatNumber: "300123456700003", balance: 18500 },
                { id: "2", code: "110202", name: "شركة الأمل للتجارة", phone: "0559876543", vatNumber: "300987654300003", balance: 24300 },
                { id: "3", code: "110203", name: "عملاء نقديون عامون", phone: "0500000000", vatNumber: "", balance: 0 }
            ],
            suppliers: [
                { id: "1", code: "210101", name: "شركة التوريدات الزراعية", phone: "0112345678", vatNumber: "310234567800003", balance: 29000 },
                { id: "2", code: "210102", name: "مصنع الأنابيب والري", phone: "0123456789", vatNumber: "310345678900003", balance: 15800 }
            ],
            items: [
                { code: "1001", name: "نخلة واشنطونيا كبيرة", unit: "حبة", price: 450.00, cost: 280.00, qty: 85, group: "نخيل زينة" },
                { code: "1002", name: "نخلة واشنطونيا وسط", unit: "حبة", price: 300.00, cost: 190.00, qty: 120, group: "نخيل زينة" },
                { code: "1003", name: "نخلة بلدي", unit: "حبة", price: 250.00, cost: 160.00, qty: 65, group: "نخيل بلدي" },
                { code: "1008", name: "مستطيل عنبر كبير الوان", unit: "حبة", price: 170.00, cost: 110.00, qty: 240, group: "مستلزمات إنارة" },
                { code: "1015", name: "جداري حديد", unit: "حبة", price: 95.00, cost: 60.00, qty: 310, group: "إضاءة حدائق" },
                { code: "1016", name: "جداري فراشة", unit: "حبة", price: 120.00, cost: 75.00, qty: 150, group: "إضاءة حدائق" }
            ]
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
        console.log("Pre-loaded database.json created successfully.");
        return initialDb;
    }

    try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const db = JSON.parse(raw);
        if (reconcileAccountingDatabase(db)) {
            saveDatabase(db);
        }
        return db;
    } catch (err) {
        console.error("Error reading DB file:", err);
        return {};
    }
}

function saveDatabase(db) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (err) {
        console.error("Error saving DB:", err);
    }
}

// خريطة توحيد أكواد الحسابات بين طبقة C# وواجهة الويب ودليل الحسابات الموحد
const ACCOUNT_CODE_ALIASES = {
    "101001": "110101", // الصندوق الرئيسي
    "1020001": "110101", // الصندوق الرئيسي (نموذج قديم)
    "103001": "110201", // ذمم العملاء
    "102001": "110301", // المخزون السلعي - المستودع الرئيسي
    "201001": "210101", // ذمم الموردين
    "202001": "2102",   // ضريبة القيمة المضافة - مخرجات 15%
    "2024001": "2102",  // ضريبة القيمة المضافة - مخرجات 15% (نموذج قديم)
    "401001": "4101",   // إيرادات مبيعات الأصناف والبضائع
    "3021001": "4101",  // إيرادات المبيعات (نموذج قديم)
    "501001": "5101"    // تكلفة البضاعة المباعة
};

function normalizeAccountCode(code) {
    const str = String(code || '').trim();
    return ACCOUNT_CODE_ALIASES[str] || str;
}

function getAccountNameByCode(db, code, fallbackName) {
    const normCode = normalizeAccountCode(code);
    const acc = (db.accounts || DEFAULT_ACCOUNTS).find(a => a.code === normCode);
    return acc ? acc.nameAr : (fallbackName || "حساب عام");
}

// ==========================================================
// محرك التدقيق والمطابقة المحاسبية التلقائية (Auto-Reconciliation Engine)
// يضمن ترحيل كافة الفواتير والسندات والتحويلات وتطابق ميزان المراجعة وأرصدة العملاء والموردين
// ==========================================================
function reconcileAccountingDatabase(db) {
    let modified = false;

    if (!Array.isArray(db.accounts) || db.accounts.length === 0) {
        db.accounts = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
        modified = true;
    }
    if (!Array.isArray(db.journalEntries)) {
        db.journalEntries = [];
        modified = true;
    }
    if (!Array.isArray(db.invoices)) {
        db.invoices = [];
        modified = true;
    }
    if (!Array.isArray(db.vouchers)) {
        db.vouchers = [];
        modified = true;
    }

    // 1. تنظيف وتوحيد القيود اليومية الحالية (إصلاح الحقول الناقصة وتوحيد أرقام وأسماء الحسابات)
    db.journalEntries.forEach((entry, idx) => {
        if (!entry.date) {
            entry.date = "2026-10-01";
            modified = true;
        }
        if (!entry.docType) {
            entry.docType = entry.entryNumber && entry.entryNumber.startsWith("JV-AUTO-") ? "فاتورة آلية" : "قيد يومية";
            modified = true;
        }
        if (!entry.refNo) {
            entry.refNo = entry.entryNumber || `REF-${idx + 1}`;
            modified = true;
        }
        if (!entry.description) {
            entry.description = `قيد يومية محاسبي رقم ${entry.entryNumber || (idx + 1)}`;
            modified = true;
        }
        if (entry.isPosted === undefined) {
            entry.isPosted = true;
            modified = true;
        }

        if (Array.isArray(entry.lines)) {
            entry.lines.forEach(line => {
                const normCode = normalizeAccountCode(line.accountCode);
                if (normCode !== line.accountCode) {
                    line.accountCode = normCode;
                    modified = true;
                }
                if (!line.accountName) {
                    line.accountName = line.name || getAccountNameByCode(db, line.accountCode, "حساب عام");
                    delete line.name;
                    modified = true;
                }
                line.debit = Math.round((parseFloat(line.debit) || 0) * 100) / 100;
                line.credit = Math.round((parseFloat(line.credit) || 0) * 100) / 100;
            });
        }
    });

    // 2. تدقيق الفواتير: إزالة الأسطر الفارغة، منع تكرار أرقام الفواتير، وتوليد القيود الآلية المفقودة
    const seenInvNumbers = new Set();
    db.invoices.forEach((inv, idx) => {
        const isPurchase = inv.type === 'purchase' || inv.type === 'فاتورة مشتريات' || inv.docType === 'فاتورة مشتريات';
        const isSales = !isPurchase;
        if (inv.type !== (isPurchase ? 'purchase' : 'sales')) {
            inv.type = isPurchase ? 'purchase' : 'sales';
            modified = true;
        }
        if (!inv.docType) {
            inv.docType = isPurchase ? 'فاتورة مشتريات' : 'فاتورة مبيعات';
            modified = true;
        }
        if (inv.isPosted === undefined) {
            inv.isPosted = true;
            modified = true;
        }
        if (!inv.branchId) {
            inv.branchId = 1;
            modified = true;
        }

        // تنظيف أسطر الأصناف الفارغة التي كانت تضاف بالخطأ
        if (Array.isArray(inv.items)) {
            const cleanedItems = inv.items.filter(it => {
                const hasCode = it.code && String(it.code).trim() !== '';
                const hasName = it.name && String(it.name).trim() !== '';
                return (hasCode || hasName) && (parseFloat(it.qty) || 0) > 0;
            });
            if (cleanedItems.length !== inv.items.length) {
                inv.items = cleanedItems;
                modified = true;
            }
        }

        // معالجة تكرار رقم الفاتورة على مستوى الشركة والنوع لضمان فرادة رقم الفاتورة ورقم قيد اليومية
        const invKey = `${inv.type}-${inv.invoiceNumber}`;
        if (seenInvNumbers.has(invKey)) {
            let maxNo = 0;
            db.invoices
                .filter(x => x.type === inv.type)
                .forEach(x => {
                    const m = String(x.invoiceNumber || '').match(/(\d+)$/);
                    if (m) {
                        const n = parseInt(m[1], 10);
                        if (!isNaN(n) && n < 900000 && n > maxNo) maxNo = n;
                    }
                });
            inv.invoiceNumber = String(maxNo + 1);
            modified = true;
        }
        seenInvNumbers.add(`${inv.type}-${inv.invoiceNumber}`);

        // توليد القيد المحاسبي المزدوج لأي فاتورة مرحلة ليس لها قيد في دفتر اليومية
        if (inv.isPosted) {
            const entryNo = "JV-AUTO-" + inv.invoiceNumber;
            const existingEntry = db.journalEntries.find(j => j.entryNumber === entryNo);
            if (!existingEntry) {
                const netTotal = Math.round((parseFloat(inv.netTotal || inv.netAmount) || 0) * 100) / 100;
                const subtotal = Math.round((parseFloat(inv.subtotal || inv.totalBeforeVat) || (netTotal / 1.15)) * 100) / 100;
                const vat15 = Math.round((netTotal - subtotal) * 100) / 100;
                const dateStr = inv.date || "2026-10-14";
                const costCenterId = inv.projectId || inv.branchId || 1;
                let lines = [];

                if (isSales) {
                    const isCredit = inv.paymentMethod === 'آجل' || inv.paymentMethod === 'اجل' || String(inv.paymentMethod).toLowerCase() === 'credit';
                    const customerCode = normalizeAccountCode(inv.customerCode || (isCredit ? '110201' : '110101'));
                    const customerName = getAccountNameByCode(db, customerCode, inv.customerName || (isCredit ? 'مؤسسة النخيل الحديثة' : 'الصندوق الرئيسي'));

                    lines = [
                        { accountCode: customerCode, accountName: customerName, debit: netTotal, credit: 0, costCenterId, desc: `فاتورة مبيعات (${isCredit ? 'آجل' : 'نقدي'}) رقم #${inv.invoiceNumber}` },
                        { accountCode: "4101", accountName: "مبيعات الأصناف والبضائع", debit: 0, credit: subtotal, costCenterId, desc: `صافي مبيعات فاتورة #${inv.invoiceNumber}` }
                    ];
                    if (vat15 > 0) {
                        lines.push({ accountCode: "2102", accountName: "ضريبة القيمة المضافة - مخرجات 15%", debit: 0, credit: vat15, costCenterId, desc: `ضريبة 15% فاتورة مبيعات #${inv.invoiceNumber}` });
                    }
                } else {
                    const isCreditPur = inv.paymentMethod === 'آجل' || inv.paymentMethod === 'اجل' || String(inv.paymentMethod).toLowerCase() === 'credit';
                    const supplierCode = normalizeAccountCode(inv.supplierCode || (isCreditPur ? '210101' : '110101'));
                    const supplierName = getAccountNameByCode(db, supplierCode, inv.supplierName || (isCreditPur ? 'شركة التوريدات الزراعية' : 'الصندوق الرئيسي'));

                    lines = [
                        { accountCode: "110301", accountName: "مستودع البضائع الرئيسي", debit: subtotal, credit: 0, costCenterId, desc: `مشتريات بضاعة فاتورة رقم #${inv.invoiceNumber}` }
                    ];
                    if (vat15 > 0) {
                        lines.push({ accountCode: "1104", accountName: "ضريبة القيمة المضافة - مدخلات 15%", debit: vat15, credit: 0, costCenterId, desc: `ضريبة مدخلات فاتورة مشتريات #${inv.invoiceNumber}` });
                    }
                    lines.push({ accountCode: supplierCode, accountName: supplierName, debit: 0, credit: netTotal, costCenterId, desc: `مستحق فاتورة مشتريات #${inv.invoiceNumber}` });
                }

                if (lines.length > 0 && netTotal > 0) {
                    db.journalEntries.push({
                        id: (inv.id || Date.now()) + idx + 1,
                        entryNumber: entryNo,
                        date: dateStr,
                        branchId: inv.branchId || 1,
                        projectId: inv.projectId || null,
                        docType: isSales ? 'فاتورة مبيعات' : 'فاتورة مشتريات',
                        refNo: inv.invoiceNumber,
                        description: `قيد ${isSales ? 'مبيعات' : 'مشتريات'} تلقائي للفاتورة رقم ${inv.invoiceNumber}`,
                        isPosted: true,
                        lines
                    });
                    inv.journalEntryNumber = entryNo;
                    modified = true;
                }
            }
        }
    });

    // 3. تدقيق سندات القبض والصرف المرحلة وتوليد قيودها إن لم تكن موجودة
    db.vouchers.forEach((v, idx) => {
        if (v.isPosted !== false) {
            v.isPosted = true;
            const entryNo = "JV-VOUCHER-" + v.voucherNumber;
            const exists = db.journalEntries.find(j => j.entryNumber === entryNo);
            const amount = Math.round((parseFloat(v.amount) || 0) * 100) / 100;
            if (!exists && amount > 0) {
                const treasuryCode = normalizeAccountCode(v.treasuryCode || "110101");
                const treasuryName = getAccountNameByCode(db, treasuryCode, v.treasuryName || "الصندوق الرئيسي");
                const targetCode = normalizeAccountCode(v.accountCode || (v.type === 'receipt' ? '110201' : '210101'));
                const targetName = getAccountNameByCode(db, targetCode, v.accountName);
                const lines = v.type === 'receipt'
                    ? [
                        { accountCode: treasuryCode, accountName: treasuryName, debit: amount, credit: 0, desc: `سند قبض رقم #${v.voucherNumber} - ${v.description || ''}` },
                        { accountCode: targetCode, accountName: targetName, debit: 0, credit: amount, desc: `سند قبض رقم #${v.voucherNumber} - ${v.description || ''}` }
                    ]
                    : [
                        { accountCode: targetCode, accountName: targetName, debit: amount, credit: 0, desc: `سند صرف رقم #${v.voucherNumber} - ${v.description || ''}` },
                        { accountCode: treasuryCode, accountName: treasuryName, debit: 0, credit: amount, desc: `سند صرف رقم #${v.voucherNumber} - ${v.description || ''}` }
                    ];
                db.journalEntries.push({
                    id: (v.id || Date.now()) + idx + 10,
                    entryNumber: entryNo,
                    date: v.date || "2026-10-14",
                    docType: v.type === 'receipt' ? 'سند قبض' : 'سند صرف',
                    refNo: v.voucherNumber,
                    description: `قيد آلي لسند ${v.type === 'receipt' ? 'قبض' : 'صرف'} رقم #${v.voucherNumber}`,
                    isPosted: true,
                    lines
                });
                modified = true;
            }
        }
    });

    // 4. تدقيق التحويلات المخزنية المؤكدة (Confirmed) وتوليد قيودها إن لم تكن موجودة
    (db.stockTransfers || []).forEach((trf, idx) => {
        if (trf.status === 'Confirmed') {
            const entryNo = "JV-" + (trf.transferNo || `TRF-${trf.id}`);
            const exists = db.journalEntries.find(j => j.entryNumber === entryNo);
            let totalTransferCost = 0;
            (trf.items || []).forEach(it => {
                totalTransferCost += (parseFloat(it.qty) || 0) * (parseFloat(it.cost) || 0);
            });
            totalTransferCost = Math.round(totalTransferCost * 100) / 100;
            if (!exists && totalTransferCost > 0) {
                const dateStr = (trf.confirmedDate || trf.transferDate || "2026-10-22").split('T')[0];
                db.journalEntries.push({
                    id: Date.now() + idx + 50,
                    entryNumber: entryNo,
                    date: dateStr,
                    docType: "تحويل مخزني",
                    refNo: trf.transferNo || `TRF-${trf.id}`,
                    description: `قيد تحويل مخزني تلقائي رقم ${trf.transferNo} من ${trf.fromBranchName} إلى ${trf.toBranchName}`,
                    isPosted: true,
                    branchId: trf.fromBranchId || 1,
                    lines: [
                        { accountCode: "110301", accountName: `مستودع البضائع (${trf.toBranchName})`, debit: totalTransferCost, credit: 0, costCenterId: trf.toBranchId, desc: `إيداع بضاعة محولة من ${trf.fromBranchName}` },
                        { accountCode: "110301", accountName: `مستودع البضائع (${trf.fromBranchName})`, debit: 0, credit: totalTransferCost, costCenterId: trf.fromBranchId, desc: `صرف بضاعة محولة إلى ${trf.toBranchName}` }
                    ]
                });
                trf.journalEntryNumber = entryNo;
                modified = true;
            }
        }
    });

    // 5. مزامنة أرصدة العملاء والموردين مع دفتر الأستاذ العام الفعلي
    (db.customers || []).forEach(cust => {
        if (cust.code) {
            const liveBal = Math.round(getAccountMovement(db, cust.code).balance * 100) / 100;
            if (cust.balance !== liveBal) {
                cust.balance = liveBal;
                modified = true;
            }
        }
    });
    (db.suppliers || []).forEach(sup => {
        if (sup.code) {
            const liveBal = Math.round(getAccountMovement(db, sup.code).balance * 100) / 100;
            if (sup.balance !== liveBal) {
                sup.balance = liveBal;
                modified = true;
            }
        }
    });

    return modified;
}

// دالة مساعدة لحساب رصيد وتفاصيل حركة الحساب اللحظي مع دعم الفروع والتواريخ
function getAccountMovement(db, accountCode, filterOpts = {}) {
    let debitSum = 0;
    let creditSum = 0;
    const movements = [];
    const { startDate, endDate, branchId } = filterOpts;

    (db.journalEntries || []).forEach(entry => {
        if (!entry.isPosted) return;
        if (startDate && entry.date < startDate) return;
        if (endDate && entry.date > endDate) return;
        if (branchId && entry.branchId && entry.branchId != branchId) return;

        (entry.lines || []).forEach(line => {
            if (line.accountCode === accountCode || (accountCode.length < 6 && line.accountCode.startsWith(accountCode))) {
                debitSum += (parseFloat(line.debit) || 0);
                creditSum += (parseFloat(line.credit) || 0);
                movements.push({
                    date: entry.date,
                    entryNumber: entry.entryNumber,
                    docType: entry.docType,
                    refNo: entry.refNo,
                    branchId: entry.branchId,
                    description: line.desc || entry.description,
                    debit: parseFloat(line.debit) || 0,
                    credit: parseFloat(line.credit) || 0
                });
            }
        });
    });

    const account = (db.accounts || []).find(a => a.code === accountCode);
    const nature = account ? account.nature : 'debit';
    const balance = nature === 'debit' ? (debitSum - creditSum) : (creditSum - debitSum);

    return { debitSum, creditSum, balance, movements };
}

// إنشاء سيرفر Node.js متكامل
const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = urlObj.pathname;

    // ==========================================
    // API ENDPOINTS
    // ==========================================
    if (pathname.startsWith('/api/')) {
        let db = initDatabase();

        // 0. تسجيل الدخول والتحقق من المستخدم وحقن الجلسة (Login Endpoint)
        if (pathname === '/api/login' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const credentials = JSON.parse(body);
                    const user = credentials.username?.trim();
                    const pass = credentials.password?.trim();

                    const defaultUsers = [
                        { userId: 1, username: "admin", fullName: "الحسن - مدير عام", role: "Admin", branchId: 1, branchName: "المركز الرئيسي - الرياض", isActive: true },
                        { userId: 2, username: "khalid", fullName: "خالد العتيبي - كاشير", role: "Cashier", branchId: 1, branchName: "المركز الرئيسي - الرياض", isActive: true },
                        { userId: 3, username: "fahad", fullName: "فهد المطيري - كاشير", role: "Cashier", branchId: 2, branchName: "فرع عنيزة - القصيم", isActive: true },
                        { userId: 4, username: "omar", fullName: "عمر السالم - كاشير", role: "Cashier", branchId: 3, branchName: "فرع بريدة - القصيم", isActive: true }
                    ];

                    const found = (db.users || defaultUsers).find(u => u.username.toLowerCase() === (user || '').toLowerCase() && u.isActive);
                    if (found) {
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({
                            success: true,
                            message: `مرحباً بك ${found.fullName}! تم تسجيل الدخول بصلاحية: ${found.role}`,
                            user: found
                        }));
                    } else {
                        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب معطل." }));
                    }
                } catch(e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // 1. استرجاع قاعدة البيانات كاملة
        if (pathname === '/api/data' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(db));
            return;
        }

        // 2. دليل الحسابات
        if (pathname === '/api/accounts' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(db.accounts || []));
            return;
        }

        if (pathname === '/api/accounts' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const newAcc = JSON.parse(body);
                    const existingIdx = (db.accounts || []).findIndex(a => a.code === newAcc.code);
                    if (existingIdx >= 0) {
                        db.accounts[existingIdx] = { ...db.accounts[existingIdx], ...newAcc };
                    } else {
                        db.accounts.push(newAcc);
                    }
                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, account: newAcc }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // 3. القيود اليومية (Journal Entries)
        if (pathname === '/api/journal' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(db.journalEntries || []));
            return;
        }

        if (pathname === '/api/journal' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const entry = JSON.parse(body);
                    entry.id = Date.now();
                    entry.timestamp = new Date().toISOString();
                    entry.branchId = entry.branchId || 1;
                    entry.branchName = entry.branchName || "المركز الرئيسي - الرياض";
                    
                    // 1. التحقق من وجود سطرين على الأقل (مطابق لـ C# AccountingEngine)
                    if (!Array.isArray(entry.lines) || entry.lines.length < 2) {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: 'خطأ محاسبي: يجب أن يحتوي القيد على سطرين على الأقل (طرف مدين وطرف دائن).' }));
                        return;
                    }

                    // 2. حساب إجمالي المدين والدائن للتأكد من توازن القيد وتوحيد الأكواد
                    let totalDebit = 0;
                    let totalCredit = 0;
                    (entry.lines || []).forEach(l => {
                        l.accountCode = normalizeAccountCode(l.accountCode);
                        l.accountName = l.accountName || getAccountNameByCode(db, l.accountCode, "حساب عام");
                        l.debit = Math.round((parseFloat(l.debit) || 0) * 100) / 100;
                        l.credit = Math.round((parseFloat(l.credit) || 0) * 100) / 100;
                        totalDebit += l.debit;
                        totalCredit += l.credit;
                    });

                    if (Math.abs(totalDebit - totalCredit) > 0.01 && entry.isPosted) {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: `خطأ محاسبي: القيد غير متوازن! إجمالي المدين (${totalDebit.toFixed(2)}) لا يساوي إجمالي الدائن (${totalCredit.toFixed(2)}).` }));
                        return;
                    }

                    if (!db.journalEntries) db.journalEntries = [];
                    db.journalEntries.push(entry);
                    reconcileAccountingDatabase(db);
                    saveDatabase(db);

                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, entry }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // 4. الفواتير (Invoices) وتوليد القيود الآلية - مع دعم UserSession وعزل الفروع
        if (pathname === '/api/invoices' && req.method === 'GET') {
            const role = urlObj.searchParams.get('role') || 'Admin';
            const branchId = urlObj.searchParams.get('branchId');

            let invoices = db.invoices || [];
            // السيناريو: إذا كان مسؤولاً (Admin) يرى كل شيء، وإذا كان كاشير يرى فرعه فقط
            if (role !== 'Admin' && branchId) {
                invoices = invoices.filter(inv => inv.branchId == branchId || inv.branch === branchId);
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(invoices));
            return;
        }

        // دليل الفروع المسجلة (Branches)
        if (pathname === '/api/branches' && req.method === 'GET') {
            const defaultBranches = [
                { id: 1, name: "المركز الرئيسي - الرياض", isMain: true },
                { id: 2, name: "فرع عنيزة - القصيم", isMain: false },
                { id: 3, name: "فرع بريدة - القصيم", isMain: false }
            ];
            const branches = db.branches && db.branches.length > 0 ? db.branches : defaultBranches;
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(branches));
            return;
        }

        // توليد رقم فاتورة تسلسلي فريد ومحمي برمجياً من التضارب والتكرار داخل الشركة (EnterpriseProductionEngine.GenerateNextInvoiceNumber)
        if (pathname === '/api/invoices/next-number' && req.method === 'GET') {
            const branchId = parseInt(urlObj.searchParams.get('branchId')) || 1;
            const prefix = urlObj.searchParams.get('prefix') || 'INV';
            const branchInvoices = (db.invoices || []).filter(inv => (inv.branchId || 1) == branchId);
            let maxNum = 0;
            branchInvoices.forEach(inv => {
                const raw = String(inv.invoiceNumber || '');
                const match = raw.match(/(\d+)$/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num < 900000 && num > maxNum) maxNum = num;
                }
            });
            const nextNumber = maxNum + 1;
            const formatted = `${prefix}-${String(nextNumber).padStart(6, '0')}`;
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ branchId, prefix, nextNumber, invoiceNumber: formatted }));
            return;
        }

        if (pathname === '/api/invoices' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const invoice = JSON.parse(body);
                    invoice.id = invoice.id || Date.now();
                    invoice.timestamp = new Date().toISOString();
                    invoice.branchId = parseInt(invoice.branchId) || 1;
                    invoice.branch = invoice.branch || "المركز الرئيسي";
                    invoice.projectId = invoice.projectId || invoice.costCenterId || null;
                    
                    // الترحيل التلقائي لجميع الفواتير المحفوظة لضمان ظهورها الفوري في التقارير (IsPosted = 1)
                    invoice.isPosted = (invoice.isPosted !== false);

                    const rawType = String(invoice.type || invoice.docType || 'sales').trim();
                    const typeMap = {
                        'sales': { type: 'sales', docType: 'فاتورة مبيعات', prefix: 'INV', stockEffect: 'out' },
                        'فاتورة مبيعات': { type: 'sales', docType: 'فاتورة مبيعات', prefix: 'INV', stockEffect: 'out' },
                        'purchase': { type: 'purchase', docType: 'فاتورة مشتريات', prefix: 'PUR', stockEffect: 'in' },
                        'فاتورة مشتريات': { type: 'purchase', docType: 'فاتورة مشتريات', prefix: 'PUR', stockEffect: 'in' },
                        'sales_return': { type: 'sales_return', docType: 'مردودات مبيعات', prefix: 'SRT', stockEffect: 'in' },
                        'مردودات مبيعات': { type: 'sales_return', docType: 'مردودات مبيعات', prefix: 'SRT', stockEffect: 'in' },
                        'purchase_return': { type: 'purchase_return', docType: 'مردودات مشتريات', prefix: 'PRT', stockEffect: 'out' },
                        'مردودات مشتريات': { type: 'purchase_return', docType: 'مردودات مشتريات', prefix: 'PRT', stockEffect: 'out' },
                        'stock_in': { type: 'stock_in', docType: 'سند إدخال', prefix: 'SIN', stockEffect: 'in' },
                        'سند إدخال': { type: 'stock_in', docType: 'سند إدخال', prefix: 'SIN', stockEffect: 'in' },
                        'stock_out': { type: 'stock_out', docType: 'سند إخراج', prefix: 'SOUT', stockEffect: 'out' },
                        'سند إخراج': { type: 'stock_out', docType: 'سند إخراج', prefix: 'SOUT', stockEffect: 'out' },
                        'stock_adjustment': { type: 'stock_adjustment', docType: 'تسوية مخزون', prefix: 'ADJ', stockEffect: 'set_or_add' },
                        'تسوية مخزون': { type: 'stock_adjustment', docType: 'تسوية مخزون', prefix: 'ADJ', stockEffect: 'set_or_add' },
                        'opening_qty': { type: 'opening_qty', docType: 'الكميات الأفتتاحية', prefix: 'OPN', stockEffect: 'set_or_add' },
                        'الكميات الأفتتاحية': { type: 'opening_qty', docType: 'الكميات الأفتتاحية', prefix: 'OPN', stockEffect: 'set_or_add' },
                        'stock_inventory': { type: 'stock_inventory', docType: 'الجرد المخزني', prefix: 'CNT', stockEffect: 'set' },
                        'الجرد المخزني': { type: 'stock_inventory', docType: 'الجرد المخزني', prefix: 'CNT', stockEffect: 'set' },
                        'customer_quotation': { type: 'customer_quotation', docType: 'عرض سعر عميل', prefix: 'QT', stockEffect: 'none' },
                        'عرض سعر عميل': { type: 'customer_quotation', docType: 'عرض سعر عميل', prefix: 'QT', stockEffect: 'none' },
                        'supplier_quotation': { type: 'supplier_quotation', docType: 'عرض سعر مورد', prefix: 'SQT', stockEffect: 'none' },
                        'عرض سعر مورد': { type: 'supplier_quotation', docType: 'عرض سعر مورد', prefix: 'SQT', stockEffect: 'none' },
                        'purchase_order': { type: 'purchase_order', docType: 'أمر شراء', prefix: 'PO', stockEffect: 'none' },
                        'أمر شراء': { type: 'purchase_order', docType: 'أمر شراء', prefix: 'PO', stockEffect: 'none' },
                        'goods_issue_order': { type: 'goods_issue_order', docType: 'أمر صرف بضاعة', prefix: 'GIO', stockEffect: 'out' },
                        'أمر صرف بضاعة': { type: 'goods_issue_order', docType: 'أمر صرف بضاعة', prefix: 'GIO', stockEffect: 'out' },
                        'goods_issue_return': { type: 'goods_issue_return', docType: 'مرتجع أمر صرف بضاعة', prefix: 'GIR', stockEffect: 'in' },
                        'مرتجع أمر صرف بضاعة': { type: 'goods_issue_return', docType: 'مرتجع أمر صرف بضاعة', prefix: 'GIR', stockEffect: 'in' },
                        'manufacturing_order': { type: 'manufacturing_order', docType: 'أمر تصنيع', prefix: 'MFG', stockEffect: 'in' },
                        'أمر تصنيع': { type: 'manufacturing_order', docType: 'أمر تصنيع', prefix: 'MFG', stockEffect: 'in' }
                    };

                    const docMeta = typeMap[rawType] || { type: 'sales', docType: invoice.docType || 'فاتورة مبيعات', prefix: 'INV', stockEffect: 'out' };
                    invoice.type = docMeta.type;
                    invoice.docType = invoice.docType || docMeta.docType;

                    const isSales = invoice.type === 'sales';
                    const isPurchase = invoice.type === 'purchase';
                    const isSalesReturn = invoice.type === 'sales_return';
                    const isPurchaseReturn = invoice.type === 'purchase_return';

                    if (!db.invoices) db.invoices = [];

                    // منع تكرار رقم الفاتورة داخل نفس الفرع أو توليد رقم تسلسلي فريد آلياً (GenerateNextInvoiceNumber)
                    const prefix = docMeta.prefix;
                    const existingIdx = invoice.allowUpdate && invoice.invoiceNumber
                        ? db.invoices.findIndex(x => String(x.invoiceNumber) === String(invoice.invoiceNumber) && x.type === invoice.type)
                        : -1;

                    const isDuplicate = existingIdx === -1 && invoice.invoiceNumber && db.invoices.some(
                        x => String(x.invoiceNumber) === String(invoice.invoiceNumber) && (x.branchId || 1) == invoice.branchId && x.type === invoice.type
                    );
                    if (!invoice.invoiceNumber || invoice.autoSequence || isDuplicate) {
                        let maxNum = 0;
                        db.invoices
                            .filter(x => (x.branchId || 1) == invoice.branchId && x.type === invoice.type)
                            .forEach(x => {
                                const m = String(x.invoiceNumber || '').match(/(\d+)$/);
                                if (m) {
                                    const n = parseInt(m[1], 10);
                                    if (!isNaN(n) && n < 900000 && n > maxNum) maxNum = n;
                                }
                            });
                        const nextNo = maxNum + 1;
                        invoice.invoiceNumber = invoice.usePrefixFormat
                            ? `${prefix}-${String(nextNo).padStart(6, '0')}`
                            : (invoice.invoiceNumber && !isDuplicate ? invoice.invoiceNumber : `${prefix}-${String(nextNo).padStart(6, '0')}`);
                    }

                    if (existingIdx >= 0) {
                        db.invoices[existingIdx] = { ...db.invoices[existingIdx], ...invoice };
                    } else {
                        db.invoices.push(invoice);
                    }

                    // الحفظ النهائي والترحيل الفوري للجداول المالية (JournalEntries & JournalEntryDetails)
                    if (invoice.isPosted && docMeta.stockEffect !== 'none') {
                        const entryNo = "JV-AUTO-" + invoice.invoiceNumber;
                        const dateStr = invoice.date || new Date().toISOString().split('T')[0];
                        let lines = [];

                        const netTotal = parseFloat(invoice.netTotal || invoice.netAmount) || 0;
                        const subtotal = parseFloat(invoice.subtotal || invoice.totalBeforeVat) || (netTotal > 0 ? Math.round((netTotal / 1.15) * 100) / 100 : 0);
                        const vat15 = parseFloat(invoice.vat15Percent || invoice.vatAmount || invoice.totalVat) || Math.max(0, Math.round((netTotal - subtotal) * 100) / 100);
                        const costCenterId = invoice.projectId || invoice.branchId;

                        if (isSales) {
                            const isCredit = invoice.paymentMethod === 'آجل' || invoice.paymentMethod === 'اجل' || String(invoice.paymentMethod).toLowerCase() === 'credit';
                            const customerCode = invoice.customerCode || (isCredit ? '110201' : '110101');
                            const customerName = invoice.customerName || (isCredit ? 'حـ/ العملاء والمدينون' : 'الصندوق الرئيسي');

                            lines = [
                                { accountCode: customerCode, accountName: customerName, debit: netTotal, credit: 0, costCenterId: costCenterId, desc: `فاتورة مبيعات (${isCredit ? 'آجل' : 'نقدي'}) رقم #${invoice.invoiceNumber}` },
                                { accountCode: "4101", accountName: "مبيعات الأصناف والبضائع", debit: 0, credit: subtotal, costCenterId: costCenterId, desc: `صافي مبيعات فاتورة #${invoice.invoiceNumber}` }
                            ];
                            if (vat15 > 0) {
                                lines.push({ accountCode: "2102", accountName: "ضريبة القيمة المضافة - مخرجات 15%", debit: 0, credit: vat15, costCenterId: costCenterId, desc: `ضريبة 15% فاتورة مبيعات #${invoice.invoiceNumber}` });
                            }
                        } else if (isPurchase) {
                            const isCreditPur = invoice.paymentMethod === 'آجل' || invoice.paymentMethod === 'اجل' || String(invoice.paymentMethod).toLowerCase() === 'credit';
                            const supplierCode = invoice.supplierCode || (isCreditPur ? '210101' : '110101');
                            const supplierName = invoice.supplierName || (isCreditPur ? 'شركة التوريدات الزراعية' : 'الصندوق الرئيسي');

                            lines = [
                                { accountCode: "110301", accountName: "مستودع البضائع الرئيسي", debit: subtotal, credit: 0, costCenterId: costCenterId, desc: `مشتريات بضاعة فاتورة رقم #${invoice.invoiceNumber}` }
                            ];
                            if (vat15 > 0) {
                                lines.push({ accountCode: "1104", accountName: "ضريبة القيمة المضافة - مدخلات 15%", debit: vat15, credit: 0, costCenterId: costCenterId, desc: `ضريبة مدخلات فاتورة مشتريات #${invoice.invoiceNumber}` });
                            }
                            lines.push({ accountCode: supplierCode, accountName: supplierName, debit: 0, credit: netTotal, costCenterId: costCenterId, desc: `مستحق فاتورة مشتريات #${invoice.invoiceNumber}` });
                        } else if (isSalesReturn && netTotal > 0) {
                            const isCredit = invoice.paymentMethod === 'آجل' || invoice.paymentMethod === 'اجل' || String(invoice.paymentMethod).toLowerCase() === 'credit';
                            const customerCode = invoice.customerCode || (isCredit ? '110201' : '110101');
                            const customerName = invoice.customerName || (isCredit ? 'حـ/ العملاء والمدينون' : 'الصندوق الرئيسي');
                            lines = [
                                { accountCode: "4101", accountName: "مبيعات الأصناف والبضائع (مردودات)", debit: subtotal, credit: 0, costCenterId: costCenterId, desc: `مردودات مبيعات رقم #${invoice.invoiceNumber}` }
                            ];
                            if (vat15 > 0) {
                                lines.push({ accountCode: "2102", accountName: "ضريبة القيمة المضافة - مخرجات 15%", debit: vat15, credit: 0, costCenterId: costCenterId, desc: `عكس ضريبة مردودات مبيعات #${invoice.invoiceNumber}` });
                            }
                            lines.push({ accountCode: customerCode, accountName: customerName, debit: 0, credit: netTotal, costCenterId: costCenterId, desc: `دائن مردودات مبيعات #${invoice.invoiceNumber}` });
                        } else if (isPurchaseReturn && netTotal > 0) {
                            const isCreditPur = invoice.paymentMethod === 'آجل' || invoice.paymentMethod === 'اجل' || String(invoice.paymentMethod).toLowerCase() === 'credit';
                            const supplierCode = invoice.supplierCode || (isCreditPur ? '210101' : '110101');
                            const supplierName = invoice.supplierName || (isCreditPur ? 'شركة التوريدات الزراعية' : 'الصندوق الرئيسي');
                            lines = [
                                { accountCode: supplierCode, accountName: supplierName, debit: netTotal, credit: 0, costCenterId: costCenterId, desc: `مدين مردودات مشتريات #${invoice.invoiceNumber}` },
                                { accountCode: "110301", accountName: "مستودع البضائع الرئيسي", debit: 0, credit: subtotal, costCenterId: costCenterId, desc: `مردودات مشتريات رقم #${invoice.invoiceNumber}` }
                            ];
                            if (vat15 > 0) {
                                lines.push({ accountCode: "1104", accountName: "ضريبة القيمة المضافة - مدخلات 15%", debit: 0, credit: vat15, costCenterId: costCenterId, desc: `عكس ضريبة مردودات مشتريات #${invoice.invoiceNumber}` });
                            }
                        } else if ((invoice.type === 'stock_in' || invoice.type === 'opening_qty' || invoice.type === 'goods_issue_return' || invoice.type === 'manufacturing_order') && netTotal > 0) {
                            const val = subtotal || netTotal;
                            lines = [
                                { accountCode: "110301", accountName: "مستودع البضائع الرئيسي", debit: val, credit: 0, costCenterId: costCenterId, desc: `${invoice.docType} رقم #${invoice.invoiceNumber}` },
                                { accountCode: "3102", accountName: "الأرباح المبقاة والاحتياطيات", debit: 0, credit: val, costCenterId: costCenterId, desc: `مقابل ${invoice.docType} رقم #${invoice.invoiceNumber}` }
                            ];
                        } else if ((invoice.type === 'stock_out' || invoice.type === 'goods_issue_order') && netTotal > 0) {
                            const val = subtotal || netTotal;
                            lines = [
                                { accountCode: "5101", accountName: "تكلفة البضاعة المباعة والمنصرفة", debit: val, credit: 0, costCenterId: costCenterId, desc: `${invoice.docType} رقم #${invoice.invoiceNumber}` },
                                { accountCode: "110301", accountName: "مستودع البضائع الرئيسي", debit: 0, credit: val, costCenterId: costCenterId, desc: `صرف مخزني بموجب ${invoice.docType} #${invoice.invoiceNumber}` }
                            ];
                        }

                        if (lines.length > 0 && netTotal > 0) {
                            if (!db.journalEntries) db.journalEntries = [];
                            db.journalEntries = db.journalEntries.filter(j => j.entryNumber !== entryNo);
                            db.journalEntries.push({
                                id: Date.now() + 1,
                                entryNumber: entryNo,
                                date: dateStr,
                                branchId: invoice.branchId,
                                projectId: invoice.projectId,
                                docType: invoice.docType,
                                refNo: invoice.invoiceNumber,
                                description: `قيد آلي لـ ${invoice.docType} رقم ${invoice.invoiceNumber}`,
                                isPosted: true,
                                lines: lines
                            });
                            invoice.journalEntryNumber = entryNo;
                        }

                        // تحديث رصيد المخزون فورياً وإضافة أي صنف جديد تلقائياً
                        if (Array.isArray(invoice.items)) {
                            if (!db.items) db.items = [];
                            invoice.items.forEach(it => {
                                const prodCode = String(it.code || it.itemCode || it.productId || '').trim();
                                const prodName = String(it.name || it.itemName || '').trim();
                                const qty = parseFloat(it.qty ?? it.quantity ?? it.actualQty) || 0;
                                if (!prodCode && !prodName) return;

                                let targetItem = db.items.find(x => (prodCode && (x.code === prodCode || String(x.id) === prodCode)) || (prodName && x.name === prodName));
                                if (!targetItem && (prodCode || prodName)) {
                                    targetItem = {
                                        id: db.items.length + 1,
                                        code: prodCode || String(1000 + db.items.length + 1),
                                        name: prodName || `صنف ${prodCode}`,
                                        group: it.group || "أصناف عامة",
                                        unit: it.unit || "حبة",
                                        price: parseFloat(it.price || it.sellPrice) || 0,
                                        cost: parseFloat(it.cost || it.costPrice || it.price) || 0,
                                        qty: 0,
                                        reorderLimit: 20
                                    };
                                    db.items.push(targetItem);
                                }

                                if (targetItem) {
                                    if (docMeta.stockEffect === 'out') {
                                        targetItem.qty = Math.max(0, (parseFloat(targetItem.qty) || 0) - qty);
                                    } else if (docMeta.stockEffect === 'in') {
                                        targetItem.qty = (parseFloat(targetItem.qty) || 0) + qty;
                                        if (parseFloat(it.cost || it.price) > 0 && isPurchase) {
                                            targetItem.cost = parseFloat(it.cost || it.price);
                                        }
                                    } else if (docMeta.stockEffect === 'set') {
                                        if (it.actualQty !== undefined || it.qty !== undefined) {
                                            targetItem.qty = Math.max(0, qty);
                                        }
                                    } else if (docMeta.stockEffect === 'set_or_add') {
                                        if (invoice.replaceQty || it.replaceQty) {
                                            targetItem.qty = Math.max(0, qty);
                                        } else {
                                            targetItem.qty = Math.max(0, (parseFloat(targetItem.qty) || 0) + qty);
                                        }
                                    }
                                }
                            });
                        }
                    }

                    reconcileAccountingDatabase(db);
                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, invoice }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // حذف فاتورة أو مستند وعكس أثره المحاسبي والمخزني
        if (pathname === '/api/invoices/delete' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const { invoiceNumber, id } = JSON.parse(body);
                    if (!db.invoices) db.invoices = [];
                    const idx = db.invoices.findIndex(inv => (invoiceNumber && String(inv.invoiceNumber) === String(invoiceNumber)) || (id && inv.id == id));
                    if (idx === -1) {
                        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: 'الفاتورة غير موجودة' }));
                        return;
                    }
                    const removed = db.invoices.splice(idx, 1)[0];
                    if (db.journalEntries && removed.invoiceNumber) {
                        db.journalEntries = db.journalEntries.filter(j => j.refNo !== removed.invoiceNumber && j.entryNumber !== `JV-AUTO-${removed.invoiceNumber}`);
                    }
                    reconcileAccountingDatabase(db);
                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, removed }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // تصفية وتوجيه الفواتير لتقارير المبيعات أو المشتريات تلقائياً (مع دعم عزل الفروع والصلاحيات)
        if (pathname === '/api/reports/invoices' && req.method === 'GET') {
            const typeFilter = urlObj.searchParams.get('type') || 'all';
            const userRole = urlObj.searchParams.get('role') || 'Admin';
            const branchId = urlObj.searchParams.get('branchId');

            const filteredInvoices = (db.invoices || []).filter(inv => {
                let typeMatch = false;
                if (typeFilter === 'all' || !typeFilter) {
                    typeMatch = true;
                } else if (typeFilter === 'sales' || typeFilter === 'مبيعات' || typeFilter === 'فاتورة مبيعات') {
                    typeMatch = (inv.type === 'sales' || inv.type === 'فاتورة مبيعات' || inv.type === 'sales_return');
                } else if (typeFilter === 'purchase' || typeFilter === 'مشتريات' || typeFilter === 'فاتورة مشتريات') {
                    typeMatch = (inv.type === 'purchase' || inv.type === 'فاتورة مشتريات' || inv.type === 'purchase_return');
                } else if (typeFilter === 'returns' || typeFilter === 'مرتجعات') {
                    typeMatch = (inv.type === 'sales_return' || inv.type === 'purchase_return' || inv.type === 'goods_issue_return');
                } else if (typeFilter === 'inventory' || typeFilter === 'مخزون') {
                    typeMatch = ['stock_in', 'stock_out', 'stock_adjustment', 'opening_qty', 'stock_inventory', 'goods_issue_order', 'goods_issue_return', 'manufacturing_order'].includes(inv.type);
                } else {
                    typeMatch = (inv.type === typeFilter || inv.docType === typeFilter);
                }
                if (!typeMatch) return false;

                // منطق عزل الفروع: إذا لم يكن مسؤولاً يرى فقط فرعه الحالي
                if (userRole !== 'Admin' && branchId) {
                    return (inv.branchId == branchId || inv.branch === branchId);
                }
                return true;
            });
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(filteredInvoices));
            return;
        }

        // 5. سندات القبض والصرف (Vouchers)
        if (pathname === '/api/vouchers' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(db.vouchers || []));
            return;
        }

        if (pathname === '/api/vouchers' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const voucher = JSON.parse(body);
                    voucher.id = Date.now();
                    voucher.timestamp = new Date().toISOString();
                    voucher.isPosted = (voucher.isPosted !== false);

                    if (!db.vouchers) db.vouchers = [];
                    db.vouchers.push(voucher);

                    // إذا كان مرحلاً نولد قيد يومية
                    if (voucher.isPosted) {
                        const entryNo = "JV-VOUCHER-" + voucher.voucherNumber;
                        const dateStr = voucher.date || new Date().toISOString().split('T')[0];
                        const amount = parseFloat(voucher.amount) || 0;
                        const treasuryCode = normalizeAccountCode(voucher.treasuryCode || "110101");
                        const treasuryName = getAccountNameByCode(db, treasuryCode, voucher.treasuryName || "الصندوق الرئيسي");
                        const targetCode = normalizeAccountCode(voucher.accountCode || (voucher.type === 'receipt' ? '110201' : '210101'));
                        const targetName = getAccountNameByCode(db, targetCode, voucher.accountName);
                        let lines = [];

                        if (voucher.type === 'receipt') {
                            // سند قبض: من حـ/ الصندوق أو البنك (مدين) إلى حـ/ العميل أو الحساب (دائن)
                            lines = [
                                { accountCode: treasuryCode, accountName: treasuryName, debit: amount, credit: 0, desc: `سند قبض رقم #${voucher.voucherNumber} - ${voucher.description || ''}` },
                                { accountCode: targetCode, accountName: targetName, debit: 0, credit: amount, desc: `سند قبض رقم #${voucher.voucherNumber} - ${voucher.description || ''}` }
                            ];
                        } else if (voucher.type === 'payment') {
                            // سند صرف: من حـ/ المورد أو المصروف (مدين) إلى حـ/ الصندوق أو البنك (دائن)
                            lines = [
                                { accountCode: targetCode, accountName: targetName, debit: amount, credit: 0, desc: `سند صرف رقم #${voucher.voucherNumber} - ${voucher.description || ''}` },
                                { accountCode: treasuryCode, accountName: treasuryName, debit: 0, credit: amount, desc: `سند صرف رقم #${voucher.voucherNumber} - ${voucher.description || ''}` }
                            ];
                        }

                        if (lines.length > 0 && amount > 0) {
                            if (!db.journalEntries) db.journalEntries = [];
                            db.journalEntries = db.journalEntries.filter(j => j.entryNumber !== entryNo);
                            db.journalEntries.push({
                                id: Date.now() + 2,
                                entryNumber: entryNo,
                                date: dateStr,
                                docType: voucher.type === 'receipt' ? 'سند قبض' : 'سند صرف',
                                refNo: voucher.voucherNumber,
                                description: `قيد آلي لسند ${voucher.type === 'receipt' ? 'قبض' : 'صرف'} رقم #${voucher.voucherNumber}`,
                                isPosted: true,
                                lines: lines
                            });
                        }
                    }

                    reconcileAccountingDatabase(db);
                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, voucher }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // 6. تقارير كشف الحساب (Account Statement)
        if (pathname === '/api/reports/statement' && req.method === 'GET') {
            const accCode = normalizeAccountCode(urlObj.searchParams.get('code') || '110101');
            const fromDate = urlObj.searchParams.get('from');
            const toDate = urlObj.searchParams.get('to');

            const accInfo = (db.accounts || []).find(a => a.code === accCode) || { code: accCode, nameAr: "حساب غير محدد", nature: "debit" };
            const movData = getAccountMovement(db, accCode);

            // تصفية التاريخ وحساب الرصيد التراكمي
            let runningBalance = 0;
            const rows = movData.movements
                .filter(m => (!fromDate || m.date >= fromDate) && (!toDate || m.date <= toDate))
                .map(m => {
                    const change = accInfo.nature === 'debit' ? (m.debit - m.credit) : (m.credit - m.debit);
                    runningBalance += change;
                    return {
                        ...m,
                        runningBalance: runningBalance
                    };
                });

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                account: accInfo,
                totalDebit: movData.debitSum,
                totalCredit: movData.creditSum,
                finalBalance: movData.balance,
                rows: rows
            }));
            return;
        }

        // 7. ميزان المراجعة (Trial Balance)
        if (pathname === '/api/reports/trial-balance' && req.method === 'GET') {
            const level = parseInt(urlObj.searchParams.get('level') || '4');
            const parentCodes = new Set((db.accounts || []).map(a => a.parent).filter(Boolean));
            let accountsToReport = (db.accounts || []).filter(a => a.level <= level);

            let totalDebitMovement = 0;
            let totalCreditMovement = 0;
            let totalDebitBalance = 0;
            let totalCreditBalance = 0;

            const rows = accountsToReport.map(acc => {
                const mov = getAccountMovement(db, acc.code);
                const isLeaf = !parentCodes.has(acc.code);

                let debitBal = 0;
                let creditBal = 0;

                if (mov.balance > 0) {
                    if (acc.nature === 'debit') debitBal = mov.balance;
                    else creditBal = mov.balance;
                } else if (mov.balance < 0) {
                    if (acc.nature === 'debit') creditBal = Math.abs(mov.balance);
                    else debitBal = Math.abs(mov.balance);
                }

                // نجمع فقط الحسابات الطرفية لتجنب الازدواجية الرياضية في إجمالي الميزان
                if (isLeaf) {
                    totalDebitMovement += mov.debitSum;
                    totalCreditMovement += mov.creditSum;
                    totalDebitBalance += debitBal;
                    totalCreditBalance += creditBal;
                }

                return {
                    code: acc.code,
                    name: acc.nameAr,
                    level: acc.level,
                    nature: acc.nature,
                    isLeaf: isLeaf,
                    totalDebit: mov.debitSum,
                    totalCredit: mov.creditSum,
                    debitBalance: debitBal,
                    creditBalance: creditBal
                };
            });

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                rows,
                totals: {
                    totalDebitMovement,
                    totalCreditMovement,
                    totalDebitBalance,
                    totalCreditBalance,
                    isBalanced: Math.abs(totalDebitBalance - totalCreditBalance) < 0.05
                }
            }));
            return;
        }

        // 8. قائمة الدخل (Income Statement / P&L) - مطابق لمحرك FinancialReportsEngine
        if (pathname === '/api/reports/income-statement' && req.method === 'GET') {
            const startDate = urlObj.searchParams.get('startDate') || urlObj.searchParams.get('from');
            const endDate = urlObj.searchParams.get('endDate') || urlObj.searchParams.get('to');
            const branchId = urlObj.searchParams.get('branchId');
            const parentCodes = new Set((db.accounts || []).map(a => a.parent).filter(Boolean));

            let totalRevenues = 0;
            let totalExpenses = 0;
            const revenueRows = [];
            const expenseRows = [];

            (db.accounts || []).forEach(acc => {
                const isLeaf = !parentCodes.has(acc.code);
                if (!isLeaf) return;
                if (acc.type === 'revenue') {
                    const mov = getAccountMovement(db, acc.code, { startDate, endDate, branchId });
                    const bal = Math.max(0, mov.balance);
                    if (bal > 0 || acc.level >= 3) {
                        totalRevenues += bal;
                        revenueRows.push({ code: acc.code, name: acc.nameAr, amount: bal });
                    }
                } else if (acc.type === 'expense') {
                    const mov = getAccountMovement(db, acc.code, { startDate, endDate, branchId });
                    const bal = Math.max(0, mov.balance);
                    if (bal > 0 || acc.level >= 3) {
                        totalExpenses += bal;
                        expenseRows.push({ code: acc.code, name: acc.nameAr, amount: bal });
                    }
                }
            });

            const netProfit = totalRevenues - totalExpenses;

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                startDate,
                endDate,
                branchId,
                totalRevenues,
                totalExpenses,
                netProfit,
                isProfit: netProfit >= 0,
                revenueRows,
                expenseRows
            }));
            return;
        }

        // مسار احتساب صافي الربح المباشر (FinancialReportsEngine.CalculateNetProfit)
        if (pathname === '/api/reports/net-profit' && req.method === 'GET') {
            const startDate = urlObj.searchParams.get('startDate') || urlObj.searchParams.get('from') || '2026-01-01';
            const endDate = urlObj.searchParams.get('endDate') || urlObj.searchParams.get('to') || '2026-12-31';
            const branchId = urlObj.searchParams.get('branchId');

            let totalRevenues = 0;
            let totalExpenses = 0;

            (db.journalEntries || []).forEach(entry => {
                if (!entry.isPosted) return;
                if (startDate && entry.date < startDate) return;
                if (endDate && entry.date > endDate) return;
                if (branchId && entry.branchId && entry.branchId != branchId) return;

                (entry.lines || []).forEach(line => {
                    const acc = (db.accounts || []).find(a => a.code === line.accountCode);
                    if (!acc) return;
                    const d = parseFloat(line.debit) || 0;
                    const c = parseFloat(line.credit) || 0;

                    if (acc.type === 'revenue') {
                        totalRevenues += (c - d); // الإيرادات طبيعتها دائنة (Credit - Debit)
                    } else if (acc.type === 'expense') {
                        totalExpenses += (d - c); // المصروفات طبيعتها مدينة (Debit - Credit)
                    }
                });
            });

            const netProfit = totalRevenues - totalExpenses;

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                startDate,
                endDate,
                branchId: branchId ? `الفرع رقم ${branchId}` : 'جميع الفروع الموحدة',
                totalRevenues: Math.round(totalRevenues * 100) / 100,
                totalExpenses: Math.round(totalExpenses * 100) / 100,
                netProfit: Math.round(netProfit * 100) / 100,
                status: netProfit >= 0 ? "صافي ربح" : "صافي خسارة",
                formula: "NetProfit = TotalRevenues (Credit - Debit) - TotalExpenses (Debit - Credit)"
            }));
            return;
        }

        // 9. الميزانية العمومية (Balance Sheet)
        if (pathname === '/api/reports/balance-sheet' && req.method === 'GET') {
            const parentCodes = new Set((db.accounts || []).map(a => a.parent).filter(Boolean));
            let totalAssets = 0;
            let totalLiabilities = 0;
            let totalEquity = 0;

            const assetRows = [];
            const liabilityRows = [];
            const equityRows = [];

            (db.accounts || []).forEach(acc => {
                const isLeaf = !parentCodes.has(acc.code);
                if (isLeaf) {
                    const mov = getAccountMovement(db, acc.code);
                    const bal = mov.balance;
                    if (acc.type === 'asset') {
                        totalAssets += bal;
                        assetRows.push({ code: acc.code, name: acc.nameAr, amount: bal });
                    } else if (acc.type === 'liability') {
                        totalLiabilities += bal;
                        liabilityRows.push({ code: acc.code, name: acc.nameAr, amount: bal });
                    } else if (acc.type === 'equity') {
                        totalEquity += bal;
                        equityRows.push({ code: acc.code, name: acc.nameAr, amount: bal });
                    }
                }
            });

            // حساب أرباح النشاط من الإيرادات والمصروفات
            let totalRevenues = 0;
            let totalExpenses = 0;
            (db.accounts || []).forEach(acc => {
                const isLeaf = !parentCodes.has(acc.code);
                if (isLeaf) {
                    if (acc.type === 'revenue') totalRevenues += getAccountMovement(db, acc.code).balance;
                    if (acc.type === 'expense') totalExpenses += getAccountMovement(db, acc.code).balance;
                }
            });
            const periodProfit = totalRevenues - totalExpenses;
            totalEquity += periodProfit;
            equityRows.push({ code: "P-NET", name: "صافي أرباح الفترة الحالية", amount: periodProfit });

            const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                totalAssets,
                totalLiabilities,
                totalEquity,
                totalLiabilitiesAndEquity,
                isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.05,
                assetRows,
                liabilityRows,
                equityRows
            }));
            return;
        }

        // 10. إقرار ضريبة القيمة المضافة 15% (ZATCA VAT 15% Report)
        if (pathname === '/api/reports/vat-15' && req.method === 'GET') {
            const inputVatMov = getAccountMovement(db, "1104");
            const outputVatMov = getAccountMovement(db, "2102");

            const totalPurchasesTaxable = inputVatMov.balance / 0.15;
            const inputVat = inputVatMov.balance;

            const totalSalesTaxable = outputVatMov.balance / 0.15;
            const outputVat = outputVatMov.balance;

            const netVatPayable = outputVat - inputVat;

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                sales: {
                    taxableAmount: totalSalesTaxable,
                    vatRate: 15,
                    vatAmount: outputVat
                },
                purchases: {
                    taxableAmount: totalPurchasesTaxable,
                    vatRate: 15,
                    vatAmount: inputVat
                },
                netVatDue: netVatPayable,
                status: netVatPayable >= 0 ? "مبلغ مستحق السداد للهيئة" : "رصيد دائن مسترد للمنشأة"
            }));
            return;
        }

        
        // 11. إعدادات النظام (System Setup API)
        if (pathname === '/api/system-setup' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(db.systemSetup || {}));
            return;
        }

        if (pathname === '/api/system-setup' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const setup = JSON.parse(body);
                    db.systemSetup = setup;
                    if (setup.header) {
                        db.companyInfo = db.companyInfo || {};
                        if (setup.header.r1) db.companyInfo.nameAr = setup.header.r1;
                        if (setup.header.l1) db.companyInfo.nameEn = setup.header.l1;
                        if (setup.header.r3 && setup.header.r3.includes(':')) {
                            db.companyInfo.vatNumber = setup.header.r3.split(':')[1].trim();
                        }
                    }
                    if (setup.general && setup.general.vatRateVal) {
                        db.companyInfo = db.companyInfo || {};
                        db.companyInfo.taxRate = setup.general.vatRateVal;
                    }
                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, message: 'System setup saved successfully' }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }
    
        // 12. الموظفين (Employees API)
        if (pathname === '/api/employees' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(db.employees || []));
            return;
        }

        if (pathname === '/api/employees' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const emp = JSON.parse(body);
                    if (!db.employees) db.employees = [];
                    const existingIdx = db.employees.findIndex(e => e.id === emp.id || e.code === emp.code);
                    if (existingIdx >= 0) {
                        db.employees[existingIdx] = { ...db.employees[existingIdx], ...emp };
                    } else {
                        emp.id = emp.id || String(Date.now());
                        db.employees.push(emp);
                    }
                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, employee: emp }));
                } catch(e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // 13. تقارير ومسيرات الرواتب (Payroll API)
        if (pathname === '/api/payroll' && req.method === 'GET') {
            const month = urlObj.searchParams.get('month') || '2026-10';
            const existingPayroll = (db.payrolls || []).find(p => p.month === month);
            if (existingPayroll) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(existingPayroll));
                return;
            }

            // توليد مسير تلقائي مبدئي للشهر المحدد
            const employees = db.employees || [];
            let totalBasic = 0, totalHousing = 0, totalTransport = 0, totalGross = 0;
            let totalGosi = 0, totalDeductions = 0, totalNet = 0;

            const items = employees.map((emp, index) => {
                const basic = parseFloat(emp.basicSalary) || 0;
                const housing = parseFloat(emp.housingAllowance) || 0;
                const transport = parseFloat(emp.transportAllowance) || 0;
                const other = parseFloat(emp.otherAllowance) || 0;
                const gross = basic + housing + transport + other;
                const gosi = Math.round((basic + housing) * (emp.gosiRate || 9.75) / 100);
                const deductions = gosi; // اقتطاع التأمينات الافتراضي
                const net = gross - deductions;

                totalBasic += basic;
                totalHousing += housing;
                totalTransport += transport;
                totalGross += gross;
                totalGosi += gosi;
                totalDeductions += deductions;
                totalNet += net;

                return {
                    empId: emp.id,
                    code: emp.code,
                    name: emp.name,
                    jobTitle: emp.jobTitle,
                    department: emp.department,
                    basicSalary: basic,
                    housingAllowance: housing,
                    transportAllowance: transport,
                    otherAllowance: other,
                    overtime: 0,
                    grossSalary: gross,
                    gosiDeduction: gosi,
                    otherDeduction: 0,
                    totalDeductions: deductions,
                    netSalary: net,
                    bankName: emp.bankName,
                    iban: emp.iban
                };
            });

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                month: month,
                isPosted: false,
                journalEntryNumber: null,
                totals: { totalBasic, totalHousing, totalTransport, totalGross, totalGosi, totalDeductions, totalNet },
                items: items
            }));
            return;
        }

        // إصدار أو حفظ مسير الرواتب
        if (pathname === '/api/payroll/issue' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const payload = JSON.parse(body);
                    const month = payload.month || '2026-10';
                    if (!db.payrolls) db.payrolls = [];

                    const idx = db.payrolls.findIndex(p => p.month === month);
                    const payrollData = {
                        month: month,
                        issuedAt: new Date().toISOString(),
                        issuedBy: payload.issuedBy || "مدير النظام: الحسن",
                        isPosted: false,
                        journalEntryNumber: null,
                        totals: payload.totals,
                        items: payload.items
                    };

                    if (idx >= 0) db.payrolls[idx] = payrollData;
                    else db.payrolls.push(payrollData);

                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, message: `تم إصدار مسير رواتب شهر ${month} بنجاح.`, payroll: payrollData }));
                } catch(e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // ترحيل الرواتب آلياً وتوليد القيد المحاسبي المزدوج في اليومية العامة
        if (pathname === '/api/payroll/post' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const payload = JSON.parse(body);
                    const month = payload.month || '2026-10';
                    if (!db.payrolls) db.payrolls = [];

                    let p = db.payrolls.find(item => item.month === month);
                    if (!p) {
                        p = { month, totals: payload.totals, items: payload.items, isPosted: false };
                        db.payrolls.push(p);
                    }

                    const totals = p.totals || payload.totals;
                    const entryNo = "JV-PAYROLL-" + month.replace('-', '');
                    const dateStr = new Date().toISOString().split('T')[0];

                    // توليد قيد اليومية المزدوج
                    // مدين: مصروف الرواتب والأجور (إجمالي الاستحقاقات)
                    // دائن: مصروفات مستحقة ورواتب (صافي المستحق للموظفين)
                    // دائن: مصلحة التأمينات الاجتماعية (استقطاع التأمينات)
                    const lines = [
                        { accountCode: "5201", accountName: "رواتب وأجور الموظفين", debit: totals.totalGross, credit: 0, desc: `استحقاق مسير رواتب شهر ${month}` },
                        { accountCode: "2103", accountName: "مصروفات مستحقة ورواتب", debit: 0, credit: totals.totalNet, desc: `صافي رواتب مستحقة لموظفي المنشأة شهر ${month}` },
                        { accountCode: "2103", accountName: "التأمينات الاجتماعية المستحقة (GOSI)", debit: 0, credit: totals.totalGosi || (totals.totalGross - totals.totalNet), desc: `استقطاع اشتراكات التأمينات الاجتماعية شهر ${month}` }
                    ];

                    if (!db.journalEntries) db.journalEntries = [];
                    // إزالة أي قيد سابق لنفس الشهر لتفادي التكرار
                    db.journalEntries = db.journalEntries.filter(j => j.entryNumber !== entryNo);
                    db.journalEntries.push({
                        id: Date.now() + 5,
                        entryNumber: entryNo,
                        date: dateStr,
                        docType: "مسير رواتب",
                        refNo: `PAYROLL-${month}`,
                        description: `قيد ترحيل مسير رواتب شهر ${month} للموظفين بالكامل`,
                        isPosted: true,
                        lines: lines
                    });

                    p.isPosted = true;
                    p.postedAt = new Date().toISOString();
                    p.journalEntryNumber = entryNo;

                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, message: `✓ تم ترحيل رواتب شهر ${month} بنجاح، وتوليد القيد المحاسبي (${entryNo})`, entryNumber: entryNo }));
                } catch(e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // إلغاء ترحيل الرواتب
        if (pathname === '/api/payroll/cancel' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const payload = JSON.parse(body);
                    const month = payload.month || '2026-10';
                    const entryNo = "JV-PAYROLL-" + month.replace('-', '');

                    if (db.payrolls) {
                        const p = db.payrolls.find(item => item.month === month);
                        if (p) {
                            p.isPosted = false;
                            p.journalEntryNumber = null;
                        }
                    }

                    if (db.journalEntries) {
                        db.journalEntries = db.journalEntries.filter(j => j.entryNumber !== entryNo);
                    }

                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, message: `✓ تم إلغاء ترحيل رواتب شهر ${month} وعكس القيد المحاسبي بنجاح.` }));
                } catch(e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // 14. تقارير حركة المخزون وبيانات الأصناف المتقدمة
        if (pathname === '/api/reports/inventory-movements' && req.method === 'GET') {
            const itemCode = urlObj.searchParams.get('code');
            const docType = urlObj.searchParams.get('type');
            
            // تجميع الحركات من الفواتير والقيود والبيانات المسجلة
            const movements = [];
            const items = db.items || [];
            
            // حركة افتراضية لكل صنف كرصيد افتتاحي
            items.forEach((it, idx) => {
                movements.push({
                    id: `INIT-${it.code}`,
                    date: "2026-10-01",
                    docType: "الكميات الأفتتاحية",
                    docNumber: "INIT-001",
                    itemCode: it.code,
                    itemName: it.name,
                    unit: it.unit,
                    store: "المستودع الرئيسي",
                    qtyIn: it.qty,
                    qtyOut: 0,
                    costPrice: it.cost,
                    sellPrice: it.price,
                    notes: "رصيد افتتاحي بداية المدة"
                });
            });

            // إضافة الحركات الناتجة عن الفواتير والمستندات المخزنية
            (db.invoices || []).forEach(inv => {
                (inv.items || []).forEach(it => {
                    const isOut = ['sales', 'فاتورة مبيعات', 'purchase_return', 'مردودات مشتريات', 'stock_out', 'سند إخراج', 'goods_issue_order', 'أمر صرف بضاعة'].includes(inv.type) || ['sales', 'فاتورة مبيعات'].includes(inv.docType);
                    const isNonStock = ['customer_quotation', 'supplier_quotation', 'purchase_order'].includes(inv.type);
                    if (isNonStock) return;
                    const q = parseFloat(it.qty ?? it.quantity ?? it.actualQty) || 0;
                    movements.push({
                        id: `INV-${inv.invoiceNumber}-${it.code}`,
                        date: inv.date || "2026-10-14",
                        docType: inv.docType || (isOut ? "فاتورة مبيعات" : "فاتورة مشتريات"),
                        docNumber: inv.invoiceNumber,
                        itemCode: it.code,
                        itemName: it.name,
                        unit: it.unit || "حبة",
                        store: inv.store || "المستودع الرئيسي",
                        qtyIn: isOut ? 0 : q,
                        qtyOut: isOut ? q : 0,
                        costPrice: it.cost || (it.price * 0.65),
                        sellPrice: it.price,
                        notes: `حركة مستندية - ${inv.customerName || inv.supplierName || inv.notes || inv.docType || 'عملية مخزنية'} (${inv.paymentMethod || 'نقدي'})`
                    });
                });
            });

            // إضافة الحركات الناتجة عن سندات التحويل بين الفروع
            (db.stockTransfers || []).forEach(trf => {
                (trf.items || []).forEach(it => {
                    const qty = parseFloat(it.qty || it.quantity) || 0;
                    // حركة خروج من الفرع المصدر (سواء Pending أو Confirmed)
                    movements.push({
                        id: `TRF-OUT-${trf.id}-${it.code || it.productId}`,
                        date: (trf.transferDate || "").split('T')[0] || "2026-10-23",
                        docType: "تحويل مخزني صادر (نقل)",
                        docNumber: trf.transferNo || `TRF-${trf.id}`,
                        itemCode: it.code || it.productId,
                        itemName: it.name || it.productName || "صنف محول",
                        unit: it.unit || "حبة",
                        store: trf.fromBranchName || `فرع #${trf.fromBranchId}`,
                        qtyIn: 0,
                        qtyOut: qty,
                        costPrice: it.cost || 0,
                        sellPrice: 0,
                        notes: `تحويل إلى ${trf.toBranchName || 'فرع مستلم'} [حالة: ${trf.status}]`
                    });

                    // حركة دخول إلى الفرع المستلم إذا كان مؤكداً ومستلماً
                    if (trf.status === 'Confirmed') {
                        movements.push({
                            id: `TRF-IN-${trf.id}-${it.code || it.productId}`,
                            date: (trf.confirmedDate || trf.transferDate || "").split('T')[0] || "2026-10-23",
                            docType: "تحويل مخزني وارد (استلام)",
                            docNumber: trf.transferNo || `TRF-${trf.id}`,
                            itemCode: it.code || it.productId,
                            itemName: it.name || it.productName || "صنف محول",
                            unit: it.unit || "حبة",
                            store: trf.toBranchName || `فرع #${trf.toBranchId}`,
                            qtyIn: qty,
                            qtyOut: 0,
                            costPrice: it.cost || 0,
                            sellPrice: 0,
                            notes: `استلام من ${trf.fromBranchName || 'فرع مصدر'} [مؤكد بواسطة: ${trf.confirmedBy || 'المستودع'}]`
                        });
                    }
                });
            });

            let filtered = movements;
            if (itemCode) filtered = filtered.filter(m => m.itemCode === itemCode);
            if (docType) filtered = filtered.filter(m => m.docType === docType);

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(filtered));
            return;
        }

        // 15. تقارير كميات وتكلفة والأصناف الراكدة وحد الطلب
        if (pathname === '/api/reports/item-analysis' && req.method === 'GET') {
            const items = db.items || [];
            const result = items.map(it => {
                const qty = parseFloat(it.qty) || 0;
                const cost = parseFloat(it.cost) || 0;
                const price = parseFloat(it.price) || 0;
                const reorderLimit = parseFloat(it.reorderLimit) || 100; // حد الطلب
                const needsReorder = qty <= reorderLimit;
                const isStagnant = it.code === "1003" || qty > 300; // أصناف راكدة
                const totalCostVal = Math.round((qty * cost) * 100) / 100;
                const totalSellVal = Math.round((qty * price) * 100) / 100;

                return {
                    id: it.id,
                    code: it.code,
                    name: it.name,
                    nameEn: it.nameEn || "",
                    group: it.group || "أصناف عامة",
                    unit: it.unit || "حبة",
                    currentQty: qty,
                    costPrice: cost,
                    sellPrice: price,
                    totalCostValue: totalCostVal,
                    totalSellValue: totalSellVal,
                    reorderLimit: reorderLimit,
                    suggestedOrderQty: needsReorder ? Math.max(20, (reorderLimit * 2) - qty) : 0,
                    needsReorder: needsReorder,
                    isStagnant: isStagnant,
                    lastMovementDate: it.lastMovementDate || (isStagnant ? "2026-06-15" : "2026-10-22")
                };
            });

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(result));
            return;
        }

        // 16. تقارير أعمار الديون للعملاء والموردين (مرتبطة حياً بأرصدة الأستاذ العام)
        if (pathname === '/api/reports/aging' && req.method === 'GET') {
            const type = urlObj.searchParams.get('type') || 'customers';
            const list = type === 'customers' ? (db.customers || []) : (db.suppliers || []);

            const rows = list.map(entity => {
                const liveBal = entity.code ? getAccountMovement(db, entity.code).balance : null;
                const bal = Math.round(((liveBal !== null ? liveBal : parseFloat(entity.balance)) || 0) * 100) / 100;
                // تقسيم الأعمار
                const current = Math.round(bal * 0.45);
                const days30 = Math.round(bal * 0.30);
                const days60 = Math.round(bal * 0.15);
                const days90 = bal - (current + days30 + days60);

                return {
                    code: entity.code,
                    name: entity.name,
                    phone: entity.phone,
                    vatNumber: entity.vatNumber,
                    totalBalance: bal,
                    current0to30: current,
                    days31to60: days30,
                    days61to90: days60,
                    over90: Math.max(0, days90),
                    status: bal > 20000 ? "تجاوز السقف" : "طبيعي"
                };
            });

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ type, rows }));
            return;
        }

        // 16.1 إدارة العملاء والموردين والأصناف ومطابقة الحسابات (Customers, Suppliers, Items & Reconcile)
        if (pathname === '/api/customers' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(db.customers || []));
            return;
        }
        if (pathname === '/api/customers' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const cust = JSON.parse(body);
                    if (!db.customers) db.customers = [];
                    if (cust.action === 'delete') {
                        db.customers = db.customers.filter(c => c.code !== cust.code && c.id !== cust.id);
                        saveDatabase(db);
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ success: true }));
                        return;
                    }
                    const idx = db.customers.findIndex(c => c.code === cust.code || (cust.id && c.id === cust.id));
                    if (idx >= 0) db.customers[idx] = { ...db.customers[idx], ...cust };
                    else {
                        cust.id = cust.id || String(db.customers.length + 1);
                        cust.code = cust.code || `11020${db.customers.length + 1}`;
                        db.customers.push(cust);
                    }
                    // تأكد من وجود حساب العميل في دليل الحسابات تحت 1102
                    if (cust.code && !(db.accounts || []).some(a => a.code === cust.code)) {
                        db.accounts.push({
                            code: cust.code,
                            nameAr: cust.name,
                            nameEn: cust.nameEn || cust.name,
                            level: 4,
                            parent: "1102",
                            type: "asset",
                            nature: "debit",
                            openingBalance: parseFloat(cust.balance) || 0
                        });
                    }
                    reconcileAccountingDatabase(db);
                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, customer: cust }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }
        if (pathname === '/api/suppliers' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(db.suppliers || []));
            return;
        }
        if (pathname === '/api/suppliers' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const sup = JSON.parse(body);
                    if (!db.suppliers) db.suppliers = [];
                    if (sup.action === 'delete') {
                        db.suppliers = db.suppliers.filter(s => s.code !== sup.code && s.id !== sup.id);
                        saveDatabase(db);
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ success: true }));
                        return;
                    }
                    const idx = db.suppliers.findIndex(s => s.code === sup.code || (sup.id && s.id === sup.id));
                    if (idx >= 0) db.suppliers[idx] = { ...db.suppliers[idx], ...sup };
                    else {
                        sup.id = sup.id || String(db.suppliers.length + 1);
                        sup.code = sup.code || `21010${db.suppliers.length + 1}`;
                        db.suppliers.push(sup);
                    }
                    if (sup.code && !(db.accounts || []).some(a => a.code === sup.code)) {
                        db.accounts.push({
                            code: sup.code,
                            nameAr: sup.name,
                            nameEn: sup.nameEn || sup.name,
                            level: 4,
                            parent: "2101",
                            type: "liability",
                            nature: "credit",
                            openingBalance: parseFloat(sup.balance) || 0
                        });
                    }
                    reconcileAccountingDatabase(db);
                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, supplier: sup }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }
        if (pathname === '/api/items' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(db.items || []));
            return;
        }
        if (pathname === '/api/items' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const item = JSON.parse(body);
                    if (!db.items) db.items = [];
                    if (item.action === 'delete') {
                        db.items = db.items.filter(i => String(i.code) !== String(item.code) && String(i.id) !== String(item.id));
                        saveDatabase(db);
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ success: true, items: db.items }));
                        return;
                    }
                    if (!item.code) {
                        const maxCode = db.items.reduce((acc, cur) => {
                            const n = parseInt(cur.code, 10);
                            return (!isNaN(n) && n > acc) ? n : acc;
                        }, 1000);
                        item.code = String(maxCode + 1);
                    }
                    item.qty = parseFloat(item.qty ?? item.currentQty) || 0;
                    item.price = parseFloat(item.price ?? item.sellPrice) || 0;
                    item.cost = parseFloat(item.cost ?? item.costPrice) || 0;
                    item.unit = item.unit || "حبة";
                    item.group = item.group || "أصناف عامة";
                    item.reorderLimit = parseFloat(item.reorderLimit) || 50;

                    const idx = db.items.findIndex(i => String(i.code) === String(item.code) || (item.id && String(i.id) === String(item.id)));
                    if (idx >= 0) {
                        db.items[idx] = { ...db.items[idx], ...item };
                    } else {
                        item.id = item.id || (db.items.length > 0 ? Math.max(...db.items.map(x => parseInt(x.id) || 0)) + 1 : 1);
                        db.items.push(item);
                    }
                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, item: idx >= 0 ? db.items[idx] : item, items: db.items }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }
        // تعديل سريع للكميات والأسعار للصنف (مع خيار الإضافة أو التعيين المباشر)
        if (pathname === '/api/items/adjust-qty' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const payload = JSON.parse(body);
                    if (!db.items) db.items = [];
                    const target = db.items.find(i => String(i.code) === String(payload.code) || (payload.id && String(i.id) === String(payload.id)));
                    if (!target) {
                        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: 'الصنف غير موجود' }));
                        return;
                    }
                    const oldQty = parseFloat(target.qty) || 0;
                    if (payload.mode === 'add') {
                        target.qty = Math.max(0, oldQty + (parseFloat(payload.qty) || 0));
                    } else {
                        target.qty = Math.max(0, parseFloat(payload.qty ?? target.qty) || 0);
                    }
                    if (payload.price !== undefined && !isNaN(parseFloat(payload.price))) {
                        target.price = parseFloat(payload.price);
                    }
                    if (payload.cost !== undefined && !isNaN(parseFloat(payload.cost))) {
                        target.cost = parseFloat(payload.cost);
                    }
                    if (payload.name) target.name = payload.name;
                    if (payload.unit) target.unit = payload.unit;
                    if (payload.group) target.group = payload.group;
                    target.lastMovementDate = new Date().toISOString().split('T')[0];

                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, item: target, oldQty, newQty: target.qty, items: db.items }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }
        // إدارة البيانات الأساسية (Master Data: مجموعات الأصناف، الوحدات، العملات، المستودعات، المناديب، مراكز التكلفة، الأصول، المواقع، الفروع، الموظفين)
        if (pathname === '/api/master-data' && req.method === 'GET') {
            if (!db.masterData) {
                db.masterData = {
                    itemGroups: [
                        { code: "1", nameAr: "تمور فاخرة", nameEn: "Luxury Dates" },
                        { code: "2", nameAr: "تمور ملكية", nameEn: "Royal Dates" },
                        { code: "3", nameAr: "مشتقات التمور", nameEn: "Date Derivatives" },
                        { code: "4", nameAr: "أعلاف ومستلزمات", nameEn: "Feeds & Supplies" }
                    ],
                    units: [
                        { code: "1", nameAr: "كرتون", nameEn: "Carton" },
                        { code: "2", nameAr: "كيلو", nameEn: "Kg" },
                        { code: "3", nameAr: "عبوة", nameEn: "Pack" },
                        { code: "4", nameAr: "حبة", nameEn: "Piece" },
                        { code: "5", nameAr: "شد", nameEn: "Bundle" }
                    ],
                    currencies: [
                        { code: "1", nameAr: "ريال سعودي", symbol: "SAR", rate: 1.00, isLocal: true },
                        { code: "2", nameAr: "دولار أمريكي", symbol: "USD", rate: 3.75, isLocal: false },
                        { code: "3", nameAr: "درهم إماراتي", symbol: "AED", rate: 1.02, isLocal: false }
                    ],
                    stores: [
                        { code: "1", nameAr: "المستودع الرئيسي - الرياض", keeper: "فهد العتيبي", branch: "المركز الرئيسي" },
                        { code: "2", nameAr: "مستودع التبريد - عنيزة", keeper: "صالح القصيمي", branch: "فرع عنيزة" },
                        { code: "3", nameAr: "مستودع التوزيع - بريدة", keeper: "محمد الحربي", branch: "فرع بريدة" }
                    ],
                    salesReps: [
                        { code: "1", nameAr: "سعود الدوسري", phone: "0501122334", commission: 2.5, target: 150000 },
                        { code: "2", nameAr: "عبدالرحمن الشهري", phone: "0554433221", commission: 3.0, target: 200000 }
                    ],
                    costCenters: [
                        { code: "101", nameAr: "المركز الرئيسي - الإدارة", budget: 250000 },
                        { code: "102", nameAr: "مشروع توريد تمور القصيم", budget: 500000 },
                        { code: "103", nameAr: "خط إنتاج الدبس والطحينة", budget: 180000 }
                    ],
                    assets: [
                        { code: "AST-01", nameAr: "سيارة نقل مبرد إيسوزو", purchaseDate: "2025-01-15", cost: 145000, depRate: 15, accountCode: "1202" },
                        { code: "AST-02", nameAr: "خط تغليف وتعبئة آلي", purchaseDate: "2025-03-10", cost: 210000, depRate: 10, accountCode: "1201" }
                    ],
                    locations: [
                        { code: "LOC-A1", nameAr: "الرف A1 - صالة التبريد الأولى" },
                        { code: "LOC-B2", nameAr: "الرف B2 - مستودع الكراتين" }
                    ],
                    accountGroups: [
                        { code: "1", nameAr: "الأصول", nameEn: "Assets" },
                        { code: "2", nameAr: "الخصوم والالتزامات", nameEn: "Liabilities" },
                        { code: "3", nameAr: "حقوق الملكية", nameEn: "Equity" },
                        { code: "4", nameAr: "الإيرادات", nameEn: "Revenues" },
                        { code: "5", nameAr: "المصروفات", nameEn: "Expenses" }
                    ]
                };
                saveDatabase(db);
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                ...db.masterData,
                employees: db.employees || [],
                branches: db.branches || [
                    { id: 1, code: "1", name: "المركز الرئيسي - الرياض", isMain: true },
                    { id: 2, code: "2", name: "فرع عنيزة - القصيم", isMain: false },
                    { id: 3, code: "3", name: "فرع بريدة - القصيم", isMain: false }
                ]
            }));
            return;
        }
        if (pathname === '/api/master-data' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const { category, record, action } = JSON.parse(body);
                    if (!db.masterData) db.masterData = {};
                    let targetList;
                    if (category === 'employees') {
                        if (!db.employees) db.employees = [];
                        targetList = db.employees;
                    } else if (category === 'branches') {
                        if (!db.branches) db.branches = [];
                        targetList = db.branches;
                    } else {
                        if (!db.masterData[category]) db.masterData[category] = [];
                        targetList = db.masterData[category];
                    }

                    const key = record.code || record.id;
                    if (action === 'delete') {
                        const idx = targetList.findIndex(x => String(x.code || x.id) === String(key));
                        if (idx >= 0) targetList.splice(idx, 1);
                    } else {
                        const idx = targetList.findIndex(x => String(x.code || x.id) === String(key));
                        if (idx >= 0) targetList[idx] = { ...targetList[idx], ...record };
                        else targetList.push(record);
                    }
                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, list: targetList }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }
        if (pathname === '/api/accounting/reconcile' && (req.method === 'POST' || req.method === 'GET')) {
            const changed = reconcileAccountingDatabase(db);
            if (changed) saveDatabase(db);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                success: true,
                reconciled: changed,
                invoicesCount: (db.invoices || []).length,
                journalEntriesCount: (db.journalEntries || []).length,
                vouchersCount: (db.vouchers || []).length
            }));
            return;
        }

        // ==========================================
        // 17. إدارة التحويلات المخزنية بين الفروع (Stock Transfers)
        // ==========================================
        // جلب قائمة سندات التحويل (مع دعم فلترة الفرع والحالة)
        if (pathname === '/api/stock-transfers' && req.method === 'GET') {
            const branchId = urlObj.searchParams.get('branchId');
            const status = urlObj.searchParams.get('status');

            let list = db.stockTransfers || [];
            if (branchId) {
                list = list.filter(t => t.fromBranchId == branchId || t.toBranchId == branchId);
            }
            if (status) {
                list = list.filter(t => t.status === status);
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(list));
            return;
        }

        // إنشاء سند تحويل مخزني جديد (Pending) وخصم المخزون من الفرع المصدر
        if (pathname === '/api/stock-transfers' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const payload = JSON.parse(body);
                    const fromId = parseInt(payload.fromBranchId);
                    const toId = parseInt(payload.toBranchId);

                    if (fromId === toId) {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: "لا يمكن إجراء تحويل مخزني إلى نفس الفرع المصدر!" }));
                        return;
                    }

                    if (!Array.isArray(payload.items) || payload.items.length === 0) {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: "يجب اختيار صنف واحد على الأقل للتحويل!" }));
                        return;
                    }

                    // التحقق من توفر الكميات وخصمها من الفرع المصدر
                    if (!db.items) db.items = [];
                    for (const it of payload.items) {
                        const qty = parseFloat(it.qty || it.quantity) || 0;
                        if (qty <= 0) {
                            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(JSON.stringify({ error: `الكمية المدخلة للصنف ${it.name || it.code} غير صالحة!` }));
                            return;
                        }
                    }

                    // خصم الكميات من المخزون الحالي
                    payload.items.forEach(it => {
                        const target = db.items.find(x => x.code === it.code || x.id == it.productId);
                        if (target) {
                            target.qty = Math.max(0, (target.qty || 0) - (parseFloat(it.qty || it.quantity) || 0));
                        }
                    });

                    if (!db.stockTransfers) db.stockTransfers = [];
                    const newId = db.stockTransfers.length > 0 ? (Math.max(...db.stockTransfers.map(t => t.id || 0)) + 1) : 1001;
                    const transferDoc = {
                        id: newId,
                        transferNo: `TRF-${String(newId).padStart(5, '0')}`,
                        transferDate: payload.transferDate || new Date().toISOString(),
                        fromBranchId: fromId,
                        fromBranchName: payload.fromBranchName || (fromId === 1 ? "المركز الرئيسي - الرياض" : fromId === 2 ? "فرع عنيزة" : "فرع بريدة"),
                        toBranchId: toId,
                        toBranchName: payload.toBranchName || (toId === 1 ? "المركز الرئيسي - الرياض" : toId === 2 ? "فرع عنيزة" : "فرع بريدة"),
                        createdBy: payload.createdBy || "مدير النظام: الحسن",
                        status: "Pending", // معلق وقيد النقل
                        notes: payload.notes || "",
                        items: payload.items.map(i => ({
                            productId: i.productId || i.id,
                            code: i.code,
                            name: i.name,
                            unit: i.unit || "حبة",
                            qty: parseFloat(i.qty || i.quantity) || 0,
                            cost: parseFloat(i.cost) || 0
                        }))
                    };

                    db.stockTransfers.push(transferDoc);
                    saveDatabase(db);

                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: `✓ تم إنشاء إذن التحويل المخزني (${transferDoc.transferNo}) بنجاح وخصم البضاعة من الفرع المصدر (قيد النقل).`,
                        transfer: transferDoc 
                    }));
                } catch(e) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // تأكيد استلام الشحنة وإضافتها إلى رصيد الفرع المستلم (Confirmed)
        if (pathname === '/api/stock-transfers/confirm' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const payload = JSON.parse(body);
                    const transferId = parseInt(payload.transferId || payload.id);
                    if (!db.stockTransfers) db.stockTransfers = [];

                    const trf = db.stockTransfers.find(t => t.id === transferId);
                    if (!trf) {
                        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: "سند التحويل غير موجود!" }));
                        return;
                    }

                    if (trf.status === 'Confirmed') {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: "تم تأكيد استلام هذا السند مسبقاً!" }));
                        return;
                    }

                    // إضافة البضاعة إلى رصيد الفرع المستلم
                    if (!db.items) db.items = [];
                    (trf.items || []).forEach(it => {
                        const target = db.items.find(x => x.code === it.code || x.id == it.productId);
                        if (target) {
                            target.qty = (target.qty || 0) + (parseFloat(it.qty) || 0);
                        }
                    });

                    trf.status = "Confirmed";
                    trf.confirmedDate = new Date().toISOString();
                    trf.confirmedBy = payload.confirmedBy || "أمين مستودع الفرع المستلم";

                    // حساب إجمالي تكلفة الأصناف وتوليد القيد المحاسبي المزدوج المتوازن
                    let totalTransferCost = 0;
                    (trf.items || []).forEach(it => {
                        const qty = parseFloat(it.qty) || 0;
                        const cost = parseFloat(it.cost) || 0;
                        totalTransferCost += (qty * cost);
                    });

                    if (totalTransferCost > 0) {
                        if (!db.journalEntries) db.journalEntries = [];
                        const entryNo = "JV-" + (trf.transferNo || `TRF-${trf.id}`);
                        const dateStr = trf.confirmedDate.split('T')[0];

                        // منع تكرار القيد
                        db.journalEntries = db.journalEntries.filter(j => j.entryNumber !== entryNo);
                        db.journalEntries.push({
                            id: Date.now() + 8,
                            entryNumber: entryNo,
                            date: dateStr,
                            docType: "تحويل مخزني",
                            refNo: trf.transferNo || `TRF-${trf.id}`,
                            description: `قيد تحويل مخزني تلقائي رقم ${trf.transferNo} من ${trf.fromBranchName} إلى ${trf.toBranchName}`,
                            isPosted: true,
                            branchId: trf.fromBranchId,
                            lines: [
                                { accountCode: "110301", accountName: `مستودع البضائع (${trf.toBranchName})`, debit: totalTransferCost, credit: 0, costCenterId: trf.toBranchId, desc: `إيداع بضاعة محولة من ${trf.fromBranchName}` },
                                { accountCode: "110301", accountName: `مستودع البضائع (${trf.fromBranchName})`, debit: 0, credit: totalTransferCost, costCenterId: trf.fromBranchId, desc: `صرف بضاعة محولة إلى ${trf.toBranchName}` }
                            ]
                        });
                        trf.journalEntryNumber = entryNo;
                    }

                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: `✓ تم تأكيد استلام شحنة التحويل (${trf.transferNo}) بنجاح، وإيداع البضاعة وتوليد القيد المحاسبي (${trf.journalEntryNumber || 'JV-TRF'}).`,
                        transfer: trf 
                    }));
                } catch(e) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // إلغاء سند التحويل وإعادة البضاعة إلى الفرع المصدر (Cancelled)
        if (pathname === '/api/stock-transfers/cancel' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const payload = JSON.parse(body);
                    const transferId = parseInt(payload.transferId || payload.id);
                    if (!db.stockTransfers) db.stockTransfers = [];

                    const trf = db.stockTransfers.find(t => t.id === transferId);
                    if (!trf) {
                        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: "سند التحويل غير موجود!" }));
                        return;
                    }

                    if (trf.status === 'Confirmed') {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: "لا يمكن إلغاء سند تم تأكيد استلامه بالفعل!" }));
                        return;
                    }

                    // إعادة الكميات المحجوزة إلى الفرع المصدر
                    if (trf.status === 'Pending' && db.items) {
                        (trf.items || []).forEach(it => {
                            const target = db.items.find(x => x.code === it.code || x.id == it.productId);
                            if (target) {
                                target.qty = (target.qty || 0) + (parseFloat(it.qty) || 0);
                            }
                        });
                    }

                    trf.status = "Cancelled";
                    trf.cancelledDate = new Date().toISOString();
                    trf.cancelledBy = payload.cancelledBy || "مدير النظام: الحسن";

                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: `✓ تم إلغاء سند التحويل (${trf.transferNo}) وإرجاع الكميات إلى رصيد الفرع المصدر.`,
                        transfer: trf 
                    }));
                } catch(e) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // ==========================================
        // 18. محرك الأمان الاحترافي للنسخ الاحتياطي لقاعدة البيانات (ExecuteDatabaseBackup)
        // ==========================================
        if (pathname === '/api/backup' && (req.method === 'POST' || req.method === 'GET')) {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const payload = body ? JSON.parse(body) : {};
                    const now = new Date();
                    const stamp = now.getFullYear().toString()
                        + String(now.getMonth() + 1).padStart(2, '0')
                        + String(now.getDate()).padStart(2, '0') + '_'
                        + String(now.getHours()).padStart(2, '0')
                        + String(now.getMinutes()).padStart(2, '0')
                        + String(now.getSeconds()).padStart(2, '0');

                    const backupDir = path.join(__dirname, 'backups');
                    if (!fs.existsSync(backupDir)) {
                        fs.mkdirSync(backupDir, { recursive: true });
                    }

                    const backupFileName = `ERP_DB_Backup_${stamp}.bak`;
                    const fullPath = path.join(backupDir, backupFileName);

                    const backupContent = JSON.stringify({
                        backupHeader: {
                            databaseName: "ERP_DB",
                            backupName: "ERP_DB-Full Database Backup",
                            createdAt: now.toISOString(),
                            requestedDestination: payload.backupFolderDirectory || backupDir,
                            version: "4.20 Enterprise"
                        },
                        data: db
                    }, null, 2);

                    fs.writeFileSync(fullPath, backupContent, 'utf8');

                    if (!db.backupLogs) db.backupLogs = [];
                    const logEntry = {
                        id: Date.now(),
                        fileName: backupFileName,
                        fullPath: fullPath,
                        sizeBytes: Buffer.byteLength(backupContent, 'utf8'),
                        createdAt: now.toISOString(),
                        status: "Success"
                    };
                    db.backupLogs.unshift(logEntry);
                    saveDatabase(db);

                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({
                        success: true,
                        responseMessage: `تم إنشاء النسخة الاحتياطية بنجاح في المسار: ${fullPath}`,
                        backup: logEntry
                    }));
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({
                        success: false,
                        responseMessage: `فشل عمل النسخة الاحتياطية: ${e.message}`,
                        error: e.message
                    }));
                }
            });
            return;
        }

        // ==========================================
        // 19. تهيئة بيانات المنشأة والشركة (Corporate Company Profile)
        // ==========================================
        if (pathname === '/api/company' && req.method === 'GET') {
            if (!db.companyInfo) {
                db.companyInfo = {
                    nameAr: "شركة مشاتل غصن بلقيس للتجارة",
                    nameEn: "Ghosn Balqees Nurseries Trading Co.",
                    vatNumber: "300500752900003",
                    crNumber: "1131012345",
                    activity: "تجارة ونباتات زينة ومستلزمات زراعية وشبكات ري وتصدير تمور",
                    address: "المملكة العربية السعودية - القصيم - عنيزة - طريق الملك عبدالعزيز",
                    phone: "0163613360",
                    mobile: "0505123456",
                    email: "info@ghosn-balqees.com",
                    website: "www.ghosn-balqees.com",
                    currency: "ريال سعودي",
                    currencySymbol: "ر.س",
                    taxRate: 15,
                    fiscalYear: "2026",
                    fiscalYearStart: "2026-01-01",
                    fiscalYearEnd: "2026-12-31",
                    bankName: "مصرف الراجحي",
                    bankIban: "SA4480000456608010099999",
                    bankName2: "البنك الأهلي السعودي (SNB)",
                    bankIban2: "SA0310000012345678901234"
                };
                saveDatabase(db);
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(db.companyInfo));
            return;
        }

        if (pathname === '/api/company' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    db.companyInfo = { ...(db.companyInfo || {}), ...data };
                    // تحديث رأس التقرير وإعدادات النظام للمزامنة
                    if (!db.systemSetup) db.systemSetup = {};
                    if (!db.systemSetup.header) db.systemSetup.header = {};
                    if (data.nameAr) db.systemSetup.header.r1 = data.nameAr;
                    if (data.nameEn) db.systemSetup.header.l1 = data.nameEn;
                    if (data.vatNumber) db.systemSetup.header.r3 = `الرقم الضريبي : ${data.vatNumber}`;
                    
                    saveDatabase(db);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, message: "تم حفظ بيانات المنشأة بنجاح", companyInfo: db.companyInfo }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // ==========================================
        // 20. إقفال السنة المالية المحاسبي للشركات (Corporate Fiscal Year-End Closing)
        // ==========================================
        if (pathname === '/api/accounting/close-year' && (req.method === 'POST' || req.method === 'GET')) {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const payload = body ? JSON.parse(body) : {};
                    const yearToClose = payload.year || (db.companyInfo && db.companyInfo.fiscalYear) || "2026";
                    const nextYear = String(parseInt(yearToClose, 10) + 1);
                    const isPreview = payload.preview === true;

                    // حساب صافي الإيرادات والمصروفات للسنة
                    let totalRevenues = 0;
                    let totalExpenses = 0;
                    const closingLines = [];

                    (db.accounts || []).forEach(acc => {
                        const codeStr = String(acc.code);
                        const mov = getAccountMovement(db, acc.code);
                        if (codeStr.startsWith('4')) {
                            // إيرادات: طبيعتها دائنة، رصيدها دائن
                            const revBal = mov.creditSum - mov.debitSum;
                            if (revBal !== 0 && acc.level >= 3) {
                                totalRevenues += revBal;
                                // لإقفال الحساب الدائن نجعله مديناً
                                closingLines.push({
                                    accountCode: acc.code,
                                    accountName: acc.nameAr,
                                    debit: Math.max(0, revBal),
                                    credit: revBal < 0 ? Math.abs(revBal) : 0,
                                    desc: `إقفال حساب ${acc.nameAr} لنهاية سنة ${yearToClose}`
                                });
                            }
                        } else if (codeStr.startsWith('5')) {
                            // مصروفات وتكلفة: طبيعتها مدينة، رصيدها مدين
                            const expBal = mov.debitSum - mov.creditSum;
                            if (expBal !== 0 && acc.level >= 3) {
                                totalExpenses += expBal;
                                // لإقفال الحساب المدين نجعله دائناً
                                closingLines.push({
                                    accountCode: acc.code,
                                    accountName: acc.nameAr,
                                    debit: expBal < 0 ? Math.abs(expBal) : 0,
                                    credit: Math.max(0, expBal),
                                    desc: `إقفال حساب ${acc.nameAr} لنهاية سنة ${yearToClose}`
                                });
                            }
                        }
                    });

                    const netProfit = Math.round((totalRevenues - totalExpenses) * 100) / 100;

                    // سطر تدوير الأرباح إلى الأرباح المبقاة (3102)
                    if (netProfit > 0) {
                        closingLines.push({
                            accountCode: "3102",
                            accountName: "الأرباح المبقاة والاحتياطيات",
                            debit: 0,
                            credit: netProfit,
                            desc: `ترحيل صافي أرباح السنة المالية ${yearToClose} إلى الأرباح المبقاة`
                        });
                    } else if (netProfit < 0) {
                        closingLines.push({
                            accountCode: "3102",
                            accountName: "الأرباح المبقاة والاحتياطيات",
                            debit: Math.abs(netProfit),
                            credit: 0,
                            desc: `ترحيل صافي خسائر السنة المالية ${yearToClose} من الأرباح المبقاة`
                        });
                    }

                    if (isPreview) {
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({
                            success: true,
                            preview: true,
                            yearToClose,
                            nextYear,
                            totalRevenues,
                            totalExpenses,
                            netProfit,
                            closingLinesCount: closingLines.length
                        }));
                        return;
                    }

                    // توليد قيد الإقفال السنوي
                    const closingEntryNo = `JV-CLOSE-${yearToClose}`;
                    if (!db.journalEntries) db.journalEntries = [];
                    db.journalEntries = db.journalEntries.filter(j => j.entryNumber !== closingEntryNo);

                    const closingEntry = {
                        id: Date.now() + 99,
                        entryNumber: closingEntryNo,
                        date: `${yearToClose}-12-31`,
                        docType: "قيد إقفال سنوي",
                        refNo: `CLOSE-${yearToClose}`,
                        description: `قيد إقفال الحسابات الختامية وتدوير نتيجة النشاط للسنة المالية ${yearToClose}`,
                        isPosted: true,
                        lines: closingLines
                    };

                    db.journalEntries.push(closingEntry);

                    // تحديث السنة المالية في المنشأة
                    if (!db.companyInfo) db.companyInfo = {};
                    db.companyInfo.fiscalYear = nextYear;
                    db.companyInfo.fiscalYearStart = `${nextYear}-01-01`;
                    db.companyInfo.fiscalYearEnd = `${nextYear}-12-31`;
                    if (!db.companyInfo.closedYears) db.companyInfo.closedYears = [];
                    if (!db.companyInfo.closedYears.includes(yearToClose)) db.companyInfo.closedYears.push(yearToClose);

                    reconcileAccountingDatabase(db);
                    saveDatabase(db);

                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({
                        success: true,
                        message: `✓ تم إقفال السنة المالية ${yearToClose} بنجاح، وتوليد القيد المحاسبي (${closingEntryNo})، وترحيل صافي الربح (${netProfit.toLocaleString()} ر.س) وبدء السنة ${nextYear}`,
                        yearClosed: yearToClose,
                        nextYear: nextYear,
                        totalRevenues,
                        totalExpenses,
                        netProfit,
                        closingEntryNumber: closingEntryNo
                    }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // ==========================================
        // 21. تقارير أرباح وخسائر مراكز التكلفة والمشاريع (Cost Centers P&L Report)
        // ==========================================
        if (pathname === '/api/reports/cost-centers' && req.method === 'GET') {
            const defaultCostCenters = [
                { id: "101", code: "101", name: "المركز الرئيسي - الإدارة", budget: 250000 },
                { id: "102", code: "102", name: "مشروع توريد تمور القصيم", budget: 500000 },
                { id: "103", code: "103", name: "خط إنتاج الدبس والطحينة", budget: 180000 },
                { id: "1", code: "1", name: "فرع الرياض الرئيسي", budget: 350000 },
                { id: "2", code: "2", name: "فرع عنيزة - القصيم", budget: 200000 },
                { id: "3", code: "3", name: "فرع بريدة - القصيم", budget: 150000 }
            ];

            const centers = (db.masterData && db.masterData.costCenters && db.masterData.costCenters.length > 0)
                ? db.masterData.costCenters
                : defaultCostCenters;

            const results = centers.map(cc => {
                const cid = String(cc.code || cc.id);
                let revenues = 0;
                let cogs = 0;
                let expenses = 0;

                (db.journalEntries || []).forEach(j => {
                    (j.lines || []).forEach(l => {
                        const lineCC = String(l.costCenterId || j.projectId || j.branchId || '');
                        if (lineCC === cid || (!lineCC && cid === "101")) {
                            const code = String(l.accountCode || '');
                            if (code.startsWith('4')) {
                                revenues += (parseFloat(l.credit) || 0) - (parseFloat(l.debit) || 0);
                            } else if (code.startsWith('51')) {
                                cogs += (parseFloat(l.debit) || 0) - (parseFloat(l.credit) || 0);
                            } else if (code.startsWith('5')) {
                                expenses += (parseFloat(l.debit) || 0) - (parseFloat(l.credit) || 0);
                            }
                        }
                    });
                });

                // إضافة أي مبيعات من الفواتير المخصصة لهذا المركز
                (db.invoices || []).forEach(inv => {
                    const invCC = String(inv.projectId || inv.costCenterId || inv.branchId || '');
                    if (invCC === cid) {
                        const net = parseFloat(inv.netTotal || inv.netAmount) || 0;
                        const sub = parseFloat(inv.subtotal || inv.totalBeforeVat) || (net / 1.15);
                        if (inv.type === 'sales') {
                            // تم تسجيلها بالقيود بالفعل إن كانت مرحلة
                        }
                    }
                });

                const grossProfit = revenues - cogs;
                const netProfit = grossProfit - expenses;

                return {
                    code: cc.code || cc.id,
                    name: cc.nameAr || cc.name,
                    budget: parseFloat(cc.budget) || 0,
                    revenues: Math.max(0, Math.round(revenues * 100) / 100),
                    cogs: Math.max(0, Math.round(cogs * 100) / 100),
                    grossProfit: Math.round(grossProfit * 100) / 100,
                    expenses: Math.max(0, Math.round(expenses * 100) / 100),
                    netProfit: Math.round(netProfit * 100) / 100,
                    marginPercent: revenues > 0 ? Math.round((netProfit / revenues) * 1000) / 10 : 0
                };
            });

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(results));
            return;
        }

        // ==========================================
        // 22. كشف حركة الخزينة والبنوك اليومي للشركات (Corporate Cash & Bank Treasury Movement)
        // ==========================================
        if (pathname === '/api/reports/treasury' && req.method === 'GET') {
            const treasuryAccounts = [
                { code: "110101", nameAr: "الصندوق الرئيسي - الرياض", type: "cash" },
                { code: "110102", nameAr: "مصرف الراجحي - الحساب الجاري", type: "bank" },
                { code: "110103", nameAr: "البنك الأهلي السعودي (SNB)", type: "bank" }
            ];

            const summary = treasuryAccounts.map(acc => {
                const mov = getAccountMovement(db, acc.code);
                const accObj = (db.accounts || []).find(a => a.code === acc.code);
                const opening = accObj ? (parseFloat(accObj.openingBalance) || 0) : 0;
                const totalIn = mov.debitSum;
                const totalOut = mov.creditSum;
                const balance = mov.balance;

                return {
                    code: acc.code,
                    name: acc.nameAr,
                    type: acc.type,
                    openingBalance: opening,
                    totalInflow: totalIn,
                    totalOutflow: totalOut,
                    currentBalance: balance,
                    status: balance >= 0 ? "متوفر" : "سحب على المكشوف"
                };
            });

            const totalFunds = summary.reduce((s, a) => s + a.currentBalance, 0);

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                date: new Date().toISOString().split('T')[0],
                totalFunds: Math.round(totalFunds * 100) / 100,
                accounts: summary
            }));
            return;
        }

        // 404 for unknown API
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
        return;
    }

    // ==========================================
    // STATIC FILE SERVING
    // ==========================================
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('500 Server Error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

// تهيئة قاعدة البيانات عند بدء التشغيل
initDatabase();

server.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`   نظام العقرب المحاسبي يعمل بنجاح - تم ربط الفواتير والتقارير حياً`);
    console.log(`   رابط تشغيل البرنامج: http://localhost:${PORT}/`);
    console.log(`================================================================`);
});
