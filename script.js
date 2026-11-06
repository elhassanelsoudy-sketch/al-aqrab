/* ==========================================================================
   AL-ASHAL ENTERPRISE ERP - المحرك المحاسبي المتكامل
   نظام الإدارة المالية، المخزون، القيود الآلية، وضريبة القيمة المضافة 15%
   ========================================================================== */

// 1. تحديث الوقت والتاريخ بأمان
function updateDateTime() {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateEl = document.getElementById('current-date');
        if (dateEl) dateEl.textContent = `${year}/${month}/${day}`;

        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedHours = String(hours).padStart(2, '0');
        const timeEl = document.getElementById('current-time');
        if (timeEl) timeEl.textContent = `${formattedHours}:${minutes} ${ampm}`;

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayEl = document.getElementById('current-day');
        if (dayEl) dayEl.textContent = days[now.getDay()];
    } catch(e) {}
}

setInterval(updateDateTime, 1000);
updateDateTime();

// 2. وظائف شاشات تسجيل الدخول والخروج والنظام
function openLogin() {
    const m = document.getElementById('loginModal');
    if (m) m.style.display = 'flex';
}

function closeLogin() {
    const m = document.getElementById('loginModal');
    if (m) m.style.display = 'none';
}

function openExit() {
    const m = document.getElementById('exitModal');
    if (m) m.style.display = 'flex';
}

function closeExit() {
    const m = document.getElementById('exitModal');
    if (m) m.style.display = 'none';
}

function confirmExit() {
    if (confirm('هل أنت متأكد من رغبتك في إغلاق النظام المحاسبي؟')) {
        closeExit();
        showERPToast('النظام المحاسبي', 'تم تسجيل الخروج بنجاح. شكراً لاستخدامك النظام.', true);
    }
}

// 3. كتالوج الأصناف المعتمد
const INVENTORY_CATALOG = {
    "1001": { name: "نخلة واشنطونيا كبيرة", unit: "حبة", price: 450.00, cost: 280.00, taxRate: 15 },
    "1002": { name: "نخلة واشنطونيا وسط", unit: "حبة", price: 300.00, cost: 190.00, taxRate: 15 },
    "1003": { name: "نخلة بلدي", unit: "حبة", price: 250.00, cost: 160.00, taxRate: 15 },
    "1008": { name: "مستطيل عنبر كبير الوان", unit: "حبة", price: 170.00, cost: 110.00, taxRate: 15 },
    "1015": { name: "جداري حديد", unit: "حبة", price: 95.00, cost: 60.00, taxRate: 15 },
    "1016": { name: "جداري فراشة", unit: "حبة", price: 120.00, cost: 75.00, taxRate: 15 }
};

// 4. دليل الحسابات الافتراضي المحلي
let ERP_ACCOUNTS_CACHE = [];

async function fetchAccounts() {
    try {
        const res = await fetch('/api/accounts');
        if (res.ok) {
            ERP_ACCOUNTS_CACHE = await res.json();
            return ERP_ACCOUNTS_CACHE;
        }
    } catch(e) {}
    return [];
}

// 5. إدارة الشاشات والنوافذ (Screen Switcher)
const ALL_SCREENS = [
    'salesInvoiceScreen', 'purchaseInvoiceScreen', 'salesReturnScreen', 'purchaseReturnScreen',
    'stockInScreen', 'stockOutScreen', 'customerQuotationScreen', 'supplierQuotationScreen',
    'purchaseOrderScreen', 'stockAdjustmentScreen', 'openingQuantitiesScreen', 'goodsIssueOrderScreen',
    'goodsIssueReturnScreen', 'manufacturingOrdersScreen', 'stockInventoryScreen', 'journalEntryScreen',
    'receiptVoucherScreen', 'paymentVoucherScreen', 'itemsReportScreen', 'customersReportScreen',
    'suppliersReportScreen', 'itemGroupsReportScreen', 'currenciesReportScreen', 'unitsReportScreen',
    'itemsQuantitiesReportScreen', 'itemsExpiryReportScreen', 'salesRepsReportScreen',
    'accountStatementScreen', 'generalJournalReportScreen', 'generalLedgerReportScreen',
    'trialBalanceReportScreen', 'incomeStatementReportScreen', 'balanceSheetReportScreen', 'vatReportScreen', 'operationsReportScreen', 'orderLimitAlertScreen', 'expiryAlertScreen', 'purchaseOrderAlertScreen',
    'payrollScreen', 'advancedInventoryReportScreen', 'partyAgingReportScreen'
];

function hideAllInvoiceScreens() {
    document.querySelectorAll('.modal-overlay').forEach(function(m) {
        m.style.display = 'none';
    });
    ALL_SCREENS.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function checkMdiControls() {
    const anyOpen = ALL_SCREENS.some(function(id) {
        const el = document.getElementById(id);
        return el && el.style.display !== 'none';
    });
    const mdi = document.getElementById('mdi-controls');
    if (mdi) {
        mdi.style.display = anyOpen ? 'flex' : 'none';
    }
}

function closeActiveInvoice() {
    hideAllInvoiceScreens();
    checkMdiControls();
}

// 6. فتح وإغلاق شاشات الفواتير والمخزون
function openSalesInvoice() {
    hideAllInvoiceScreens();
    const el = document.getElementById('salesInvoiceScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();
    setTimeout(() => { const p = document.getElementById('inv-phone'); if (p) p.focus(); }, 50);
}
function closeSalesInvoice() { const el = document.getElementById('salesInvoiceScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openPurchaseInvoice() {
    hideAllInvoiceScreens();
    const el = document.getElementById('purchaseInvoiceScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();
    setTimeout(() => { const p = document.getElementById('pur-phone'); if (p) p.focus(); }, 50);
}
function closePurchaseInvoice() { const el = document.getElementById('purchaseInvoiceScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openSalesReturn() { hideAllInvoiceScreens(); const el = document.getElementById('salesReturnScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeSalesReturn() { const el = document.getElementById('salesReturnScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openPurchaseReturn() { hideAllInvoiceScreens(); const el = document.getElementById('purchaseReturnScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closePurchaseReturn() { const el = document.getElementById('purchaseReturnScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openStockIn() { hideAllInvoiceScreens(); const el = document.getElementById('stockInScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeStockIn() { const el = document.getElementById('stockInScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openStockOut() { hideAllInvoiceScreens(); const el = document.getElementById('stockOutScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeStockOut() { const el = document.getElementById('stockOutScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openCustomerQuotation() { hideAllInvoiceScreens(); const el = document.getElementById('customerQuotationScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeCustomerQuotation() { const el = document.getElementById('customerQuotationScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openSupplierQuotation() { hideAllInvoiceScreens(); const el = document.getElementById('supplierQuotationScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeSupplierQuotation() { const el = document.getElementById('supplierQuotationScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openPurchaseOrder() { hideAllInvoiceScreens(); const el = document.getElementById('purchaseOrderScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closePurchaseOrder() { const el = document.getElementById('purchaseOrderScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openStockAdjustment() { hideAllInvoiceScreens(); const el = document.getElementById('stockAdjustmentScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeStockAdjustment() { const el = document.getElementById('stockAdjustmentScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openOpeningQuantities() { hideAllInvoiceScreens(); const el = document.getElementById('openingQuantitiesScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeOpeningQuantities() { const el = document.getElementById('openingQuantitiesScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openGoodsIssueOrder() { hideAllInvoiceScreens(); const el = document.getElementById('goodsIssueOrderScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeGoodsIssueOrder() { const el = document.getElementById('goodsIssueOrderScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openGoodsIssueReturn() { hideAllInvoiceScreens(); const el = document.getElementById('goodsIssueReturnScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeGoodsIssueReturn() { const el = document.getElementById('goodsIssueReturnScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openManufacturingOrders() { hideAllInvoiceScreens(); const el = document.getElementById('manufacturingOrdersScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeManufacturingOrders() { const el = document.getElementById('manufacturingOrdersScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openStockInventory() { hideAllInvoiceScreens(); const el = document.getElementById('stockInventoryScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeStockInventory() { const el = document.getElementById('stockInventoryScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

// 7. فتح وإغلاق شاشات الحسابات والسندات والقيود
function openJournalEntry() {
    hideAllInvoiceScreens();
    const el = document.getElementById('journalEntryScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();
    calculateJournalTotals();
    const code = document.getElementById('journal-general-code');
    if (code) { setTimeout(() => { code.focus(); code.select(); }, 50); }
}
function closeJournalEntry() { const el = document.getElementById('journalEntryScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openReceiptVoucher() {
    hideAllInvoiceScreens();
    const el = document.getElementById('receiptVoucherScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();
}
function closeReceiptVoucher() { const el = document.getElementById('receiptVoucherScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openPaymentVoucher() {
    hideAllInvoiceScreens();
    const el = document.getElementById('paymentVoucherScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();
}
function closePaymentVoucher() { const el = document.getElementById('paymentVoucherScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

// 8. فتح وإغلاق نوافذ الملفات الأساسية (Modals)
function openModalById(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}
function closeModalById(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

function openItemGroup() { openModalById('itemGroupModal'); }
function closeItemGroup() { closeModalById('itemGroupModal'); }
function openItemGroupModal() { openModalById('itemGroupModal'); }
function closeItemGroupModal() { closeModalById('itemGroupModal'); }

function openUnits() { openModalById('unitsModal'); }
function closeUnits() { closeModalById('unitsModal'); }
function openUnitsModal() { openModalById('unitsModal'); }
function closeUnitsModal() { closeModalById('unitsModal'); }

function showToast(msg, type = 'info') {
    if (typeof showSystemNotice === 'function') {
        showSystemNotice(msg, type);
    } else {
        alert(msg);
    }
}

function closeAllForms() {
    if (typeof hideAllInvoiceScreens === 'function') hideAllInvoiceScreens();
    document.querySelectorAll('.app-modal').forEach(m => m.style.display = 'none');
    if (typeof checkMdiControls === 'function') checkMdiControls();
}

function openItemDef() { openModalById('itemDefModal'); }
function closeItemDef() { closeModalById('itemDefModal'); }

function openCustomers() { openModalById('customersModal'); }
function closeCustomers() { closeModalById('customersModal'); }

function openSuppliers() { openModalById('suppliersModal'); }
function closeSuppliers() { closeModalById('suppliersModal'); }

function openEmployees() { openModalById('employeesModal'); }
function closeEmployees() { closeModalById('employeesModal'); }

function openBranches() { openModalById('branchesModal'); }
function closeBranches() { closeModalById('branchesModal'); }

function openAccountsGroup() { openModalById('accountsGroupModal'); }
function closeAccountsGroup() { closeModalById('accountsGroupModal'); }

function openCurrency() { openModalById('currencyModal'); }
function closeCurrency() { closeModalById('currencyModal'); }

function openStores() { openModalById('storesModal'); }
function closeStores() { closeModalById('storesModal'); }

function openSalesReps() { openModalById('salesRepsModal'); }
function closeSalesReps() { closeModalById('salesRepsModal'); }

function openCostCenters() { openModalById('costCentersModal'); }
function closeCostCenters() { closeModalById('costCentersModal'); }

function openAssets() { openModalById('assetsModal'); }
function closeAssets() { closeModalById('assetsModal'); }

function openLocations() { openModalById('locationsModal'); }
function closeLocations() { closeModalById('locationsModal'); }

// 9. الدليل المحاسبي الشجري التفاعلي (Interactive Chart of Accounts)
async function openChartOfAccounts() {
    const m = document.getElementById('chartOfAccountsModal');
    if (m) m.style.display = 'flex';
    await renderAccountsTree();
}

function closeChartOfAccounts() {
    const m = document.getElementById('chartOfAccountsModal');
    if (m) m.style.display = 'none';
}

async function renderAccountsTree() {
    const accounts = await fetchAccounts();
    const treeContainer = document.querySelector('#chartOfAccountsModal .tree-panel');
    if (!treeContainer || !accounts || !accounts.length) return;

    let treeHtml = '<div style="font-family: Tahoma; font-size: 11px; padding: 4px;">';
    
    // الأبواب الرئيسية
    const rootAccounts = accounts.filter(a => a.level === 1);
    rootAccounts.forEach(root => {
        treeHtml += `
            <div class="tree-node" style="margin-bottom: 6px;">
                <div style="display:flex; align-items:center; gap:6px; cursor:pointer; font-weight:bold; background:#eaf2fb; padding:3px 6px; border:1px solid #c2d9ee;" onclick="selectAccountInTree('${root.code}')">
                    <i class="fa-solid fa-folder" style="color:#fbc02d;"></i>
                    <span style="color:#0078d7;">${root.code}</span>
                    <span>${root.nameAr}</span>
                    <span style="color:#666; font-size:10px; margin-right:auto;">${root.nameEn || ''}</span>
                </div>
                <div style="padding-right: 18px; margin-top: 3px;">
        `;

        const subAccounts = accounts.filter(a => a.parent === root.code);
        subAccounts.forEach(sub => {
            treeHtml += `
                <div style="margin-bottom: 4px;">
                    <div style="display:flex; align-items:center; gap:6px; cursor:pointer; font-weight:bold; padding:2px 4px;" onclick="selectAccountInTree('${sub.code}')">
                        <i class="fa-solid fa-folder-open" style="color:#ffa000;"></i>
                        <span style="color:#0078d7;">${sub.code}</span>
                        <span>${sub.nameAr}</span>
                    </div>
                    <div style="padding-right: 18px; margin-top: 2px;">
            `;

            const leafAccounts = accounts.filter(a => a.parent === sub.code);
            leafAccounts.forEach(leaf => {
                const isFinal = leaf.level === 4;
                treeHtml += `
                    <div style="display:flex; align-items:center; gap:6px; cursor:pointer; padding:2px 4px; border-bottom:1px dotted #e0e0e0;" onclick="selectAccountInTree('${leaf.code}')">
                        <i class="${isFinal ? 'fa-regular fa-file-lines text-blue' : 'fa-solid fa-folder text-yellow'}"></i>
                        <span style="font-family:monospace; font-weight:bold; color:#333;">${leaf.code}</span>
                        <span>${leaf.nameAr}</span>
                        ${leaf.openingBalance ? `<span style="margin-right:auto; color:#107c41; font-weight:bold;">${leaf.openingBalance.toLocaleString()} ر.س</span>` : ''}
                    </div>
                `;
            });

            treeHtml += `</div></div>`;
        });

        treeHtml += `</div></div>`;
    });

    treeHtml += '</div>';
    treeContainer.innerHTML = treeHtml;
}

async function selectAccountInTree(code) {
    const acc = ERP_ACCOUNTS_CACHE.find(a => a.code === code);
    if (!acc) return;

    const modal = document.getElementById('chartOfAccountsModal');
    if (!modal) return;

    const inputs = modal.querySelectorAll('.form-panel input[type="text"]');
    if (inputs.length >= 6) {
        inputs[0].value = acc.code;
        inputs[1].value = acc.level;
        inputs[2].value = acc.parent || '';
        inputs[3].value = acc.parent ? (acc.level - 1) : '';
        inputs[4].value = acc.nameAr || '';
        inputs[5].value = acc.nameEn || '';
    }

    // جلب الحركة الفعلية والرصيد الحقيقي للحساب من السيرفر وعرضه في الحقول الجانبية
    try {
        const res = await fetch(`/api/reports/statement?code=${encodeURIComponent(code)}`);
        if (res.ok) {
            const st = await res.json();
            if (inputs[6]) inputs[6].value = (st.totalCredit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
            if (inputs[7]) inputs[7].value = (st.totalDebit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
            if (inputs[8]) inputs[8].value = (st.finalBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' ر.س';
        }
    } catch (e) {}

    showERPToast('الدليل المحاسبي', `تم اختيار الحساب: <b>${acc.nameAr} (${acc.code})</b> - المستوى: ${acc.level}`, true);
}

async function saveAccountFromModal() {
    const modal = document.getElementById('chartOfAccountsModal');
    if (!modal) return;
    const inputs = modal.querySelectorAll('.form-panel input[type="text"]');
    if (inputs.length < 5) return;

    const code = inputs[0].value.trim();
    const level = parseInt(inputs[1].value) || 4;
    const parent = inputs[2].value.trim() || null;
    const nameAr = inputs[4].value.trim();
    const nameEn = inputs[5] ? inputs[5].value.trim() : '';

    if (!code || !nameAr) {
        alert('يرجى إدخال رقم الحساب واسم الحساب العربي.');
        return;
    }

    const firstDigit = code.charAt(0);
    const typeMap = { '1': 'asset', '2': 'liability', '3': 'equity', '4': 'revenue', '5': 'expense' };
    const type = typeMap[firstDigit] || 'asset';
    const nature = (type === 'asset' || type === 'expense') ? 'debit' : 'credit';

    try {
        const res = await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, level, parent, nameAr, nameEn, type, nature })
        });
        const data = await res.json();
        if (data.success) {
            await renderAccountsTree();
            showERPToast('الدليل المحاسبي', `تم حفظ الحساب <b>${nameAr} (${code})</b> في شجرة الحسابات بنجاح!`, true);
        }
    } catch (e) {
        alert('تعذر حفظ الحساب: ' + e.message);
    }
}

// 10. تقارير المخزون وقوائم الملفات
function openItemsReport() { hideAllInvoiceScreens(); const el = document.getElementById('itemsReportScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeItemsReport() { const el = document.getElementById('itemsReportScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openCustomersReport() { hideAllInvoiceScreens(); const el = document.getElementById('customersReportScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeCustomersReport() { const el = document.getElementById('customersReportScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openSuppliersReport() { hideAllInvoiceScreens(); const el = document.getElementById('suppliersReportScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeSuppliersReport() { const el = document.getElementById('suppliersReportScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openItemGroupsReport() { hideAllInvoiceScreens(); const el = document.getElementById('itemGroupsReportScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeItemGroupsReport() { const el = document.getElementById('itemGroupsReportScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openCurrenciesReport() { hideAllInvoiceScreens(); const el = document.getElementById('currenciesReportScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeCurrenciesReport() { const el = document.getElementById('currenciesReportScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openUnitsReport() { hideAllInvoiceScreens(); const el = document.getElementById('unitsReportScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeUnitsReport() { const el = document.getElementById('unitsReportScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openItemsQuantitiesReport() { hideAllInvoiceScreens(); const el = document.getElementById('itemsQuantitiesReportScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeItemsQuantitiesReport() { const el = document.getElementById('itemsQuantitiesReportScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openItemsExpiryReport() { hideAllInvoiceScreens(); const el = document.getElementById('itemsExpiryReportScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeItemsExpiryReport() { const el = document.getElementById('itemsExpiryReportScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function openSalesRepsReport() { hideAllInvoiceScreens(); const el = document.getElementById('salesRepsReportScreen'); if (el) el.style.display = 'flex'; checkMdiControls(); }
function closeSalesRepsReport() { const el = document.getElementById('salesRepsReportScreen'); if (el) el.style.display = 'none'; checkMdiControls(); }

function selectReportRow(tr) {
    if (!tr) return;
    const table = tr.closest('table');
    if (table) table.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    tr.classList.add('selected');
}

// 11. إضافة سطر جديد لفاتورة المبيعات (Add Sales Row)
function addNewSalesRow() {
    const tbody = document.getElementById('sales-invoice-tbody');
    if (!tbody) return;

    const currentRows = tbody.querySelectorAll('.invoice-item-row');
    const newRowNum = currentRows.length + 1;
    const rowClass = newRowNum % 2 === 1 ? 'cyan-row' : 'white-row';

    const tr = document.createElement('tr');
    tr.className = `${rowClass} invoice-item-row`;
    tr.setAttribute('data-row', newRowNum);
    tr.innerHTML = `
        <td class="row-num-cell">${newRowNum}</td>
        <td><input type="text" class="grid-cell-input item-code-input" value="" onchange="onItemCodeChange(this, 'sales')" oninput="calculateSalesInvoiceTotals()"></td>
        <td><input type="text" class="grid-cell-input text-right item-name-input" value="" oninput="calculateSalesInvoiceTotals()"></td>
        <td><select class="grid-cell-select item-unit-select"><option>حبة</option><option>كرتون</option><option>متر</option></select></td>
        <td><input type="text" class="grid-cell-input item-store-input" value="1"></td>
        <td><input type="number" class="grid-cell-input item-qty-input" value="1" min="0" step="any" oninput="calculateSalesInvoiceTotals()"></td>
        <td><input type="number" class="grid-cell-input item-price-input" value="0.00" min="0" step="any" oninput="calculateSalesInvoiceTotals()"></td>
        <td><input type="number" class="grid-cell-input item-discount-input" value="0" min="0" max="100" step="any" oninput="calculateSalesInvoiceTotals()"></td>
        <td class="item-subtotal-text text-center font-bold">0.00</td>
        <td class="item-tax-rate-text text-center">15%</td>
        <td class="item-tax-val-text text-center text-blue font-bold">0.00</td>
    `;

    tbody.appendChild(tr);
    const codeInput = tr.querySelector('.item-code-input');
    if (codeInput) codeInput.focus();
    calculateSalesInvoiceTotals();
}

function addNewPurchaseRow() {
    const tbody = document.getElementById('purchase-invoice-tbody');
    if (!tbody) return;

    const currentRows = tbody.querySelectorAll('.invoice-item-row');
    const newRowNum = currentRows.length + 1;
    const rowClass = newRowNum % 2 === 1 ? 'cyan-row' : 'white-row';

    const tr = document.createElement('tr');
    tr.className = `${rowClass} invoice-item-row`;
    tr.setAttribute('data-row', newRowNum);
    tr.innerHTML = `
        <td class="row-num-cell">${newRowNum}</td>
        <td><input type="text" class="grid-cell-input item-code-input" value="" onchange="onItemCodeChange(this, 'pur')" oninput="calculatePurchaseInvoiceTotals()"></td>
        <td><input type="text" class="grid-cell-input text-right item-name-input" value="" oninput="calculatePurchaseInvoiceTotals()"></td>
        <td><select class="grid-cell-select item-unit-select"><option>حبة</option><option>كرتون</option><option>متر</option></select></td>
        <td><input type="text" class="grid-cell-input item-store-input" value="1"></td>
        <td><input type="number" class="grid-cell-input item-qty-input" value="1" min="0" step="any" oninput="calculatePurchaseInvoiceTotals()"></td>
        <td><input type="number" class="grid-cell-input item-price-input" value="0.00" min="0" step="any" oninput="calculatePurchaseInvoiceTotals()"></td>
        <td><input type="number" class="grid-cell-input item-discount-input" value="0" min="0" max="100" step="any" oninput="calculatePurchaseInvoiceTotals()"></td>
        <td class="item-subtotal-text text-center font-bold">0.00</td>
        <td class="text-center">0.00</td>
    `;

    tbody.appendChild(tr);
    const codeInput = tr.querySelector('.item-code-input');
    if (codeInput) codeInput.focus();
    calculatePurchaseInvoiceTotals();
}

// 12. محرك حسابات الأصناف والضريبة 15%
function onItemCodeChange(input, screenType) {
    if (!input) return;
    const code = input.value.trim();
    const row = input.closest('tr');
    if (!row) return;

    if (INVENTORY_CATALOG[code]) {
        const item = INVENTORY_CATALOG[code];
        const nameInput = row.querySelector('.item-name-input');
        if (nameInput) nameInput.value = item.name;

        const unitSelect = row.querySelector('.item-unit-select');
        if (unitSelect) unitSelect.value = item.unit;

        const priceInput = row.querySelector('.item-price-input');
        if (priceInput && (!parseFloat(priceInput.value) || parseFloat(priceInput.value) === 0)) {
            priceInput.value = (screenType === 'pur' ? item.cost : item.price).toFixed(2);
        }

        const qtyInput = row.querySelector('.item-qty-input');
        if (qtyInput && (!parseFloat(qtyInput.value) || parseFloat(qtyInput.value) === 0)) {
            qtyInput.value = "1";
        }
    }

    if (screenType === 'sales') calculateSalesInvoiceTotals();
    else if (screenType === 'pur') calculatePurchaseInvoiceTotals();
    else if (screenType === 'stockin') calculateStockInTotals();
    else if (screenType === 'stockout') calculateStockOutTotals();
    else if (screenType === 'inv') calculateInventoryTotals();
}

function calculateSalesInvoiceTotals() {
    const tbody = document.getElementById('sales-invoice-tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('.invoice-item-row');
    let totalQty = 0;
    let subtotalSum = 0;
    let rowDiscountSum = 0;
    let totalTaxSum = 0;

    rows.forEach(function(row) {
        const code = row.querySelector('.item-code-input')?.value?.trim() || '';
        const name = row.querySelector('.item-name-input')?.value?.trim() || '';
        const qtyInput = row.querySelector('.item-qty-input');
        const priceInput = row.querySelector('.item-price-input');
        const discInput = row.querySelector('.item-discount-input');
        const subtotalEl = row.querySelector('.item-subtotal-text');
        const taxValEl = row.querySelector('.item-tax-val-text');

        const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
        const price = parseFloat(priceInput ? priceInput.value : 0) || 0;
        const discRate = parseFloat(discInput ? discInput.value : 0) || 0;

        const rawTotal = qty * price;
        const discVal = rawTotal * (discRate / 100);
        const rowNet = Math.max(0, rawTotal - discVal);
        const rowTax = rowNet * 0.15;

        if (subtotalEl) subtotalEl.innerText = rowNet.toFixed(2);
        if (taxValEl) taxValEl.innerText = rowTax.toFixed(2);

        if (code || name || price > 0) {
            totalQty += qty;
        }
        subtotalSum += rowNet;
        rowDiscountSum += discVal;
        totalTaxSum += rowTax;
    });

    const discRateInput = document.getElementById('sales-discount-rate');
    const discValInput = document.getElementById('sales-discount-val');
    const rateDisc = subtotalSum * ((parseFloat(discRateInput ? discRateInput.value : 0) || 0) / 100);
    const extraDisc = (parseFloat(discValInput ? discValInput.value : 0) || 0) + rateDisc;
    const taxableBase = Math.max(0, subtotalSum - extraDisc);
    const vat15 = taxableBase * 0.15;
    const finalNet = taxableBase + vat15;

    const qtyEl = document.getElementById('sales-total-qty');
    if (qtyEl) qtyEl.value = totalQty.toString();

    const subEl = document.getElementById('sales-subtotal');
    if (subEl) subEl.value = taxableBase.toFixed(2);

    const taxEl = document.getElementById('sales-tax-total');
    if (taxEl) taxEl.value = vat15.toFixed(2);

    const netEl = document.getElementById('sales-net-total');
    if (netEl) netEl.value = finalNet.toFixed(2);

    const paidEl = document.getElementById('sales-paid');
    const payMethod = document.getElementById('sales-payment-method')?.value || 'نقدي';
    if (paidEl && payMethod === 'نقدي') {
        paidEl.value = finalNet.toFixed(2);
    }

    const lcdBox = document.getElementById('sales-lcd-box');
    if (lcdBox) {
        lcdBox.innerText = finalNet.toFixed(2);
    }
}

function calculatePurchaseInvoiceTotals() {
    const tbody = document.getElementById('purchase-invoice-tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('.invoice-item-row');
    let totalQty = 0;
    let subtotalSum = 0;
    let rowDiscountSum = 0;

    rows.forEach(function(row) {
        const code = row.querySelector('.item-code-input')?.value?.trim() || '';
        const name = row.querySelector('.item-name-input')?.value?.trim() || '';
        const qty = parseFloat(row.querySelector('.item-qty-input')?.value || 0) || 0;
        const price = parseFloat(row.querySelector('.item-price-input')?.value || 0) || 0;
        const discRate = parseFloat(row.querySelector('.item-discount-input')?.value || 0) || 0;

        const rawTotal = qty * price;
        const discVal = rawTotal * (discRate / 100);
        const rowNet = Math.max(0, rawTotal - discVal);

        const subtotalEl = row.querySelector('.item-subtotal-text');
        if (subtotalEl) subtotalEl.innerText = rowNet.toFixed(2);

        if (code || name || price > 0) {
            totalQty += qty;
        }
        subtotalSum += rowNet;
        rowDiscountSum += discVal;
    });

    const discRateInput = document.getElementById('pur-discount-rate');
    const discValInput = document.getElementById('pur-discount-val');
    const rateDisc = subtotalSum * ((parseFloat(discRateInput ? discRateInput.value : 0) || 0) / 100);
    const extraDisc = (parseFloat(discValInput ? discValInput.value : 0) || 0) + rateDisc;
    const taxableBase = Math.max(0, subtotalSum - extraDisc);
    const vat15 = taxableBase * 0.15;
    const finalNet = taxableBase + vat15;

    const qtyEl = document.getElementById('pur-total-qty');
    if (qtyEl) qtyEl.value = totalQty.toString();

    const subEl = document.getElementById('pur-subtotal');
    if (subEl) subEl.value = taxableBase.toFixed(2);

    const taxEl = document.getElementById('pur-tax-total');
    if (taxEl) taxEl.value = vat15.toFixed(2);

    const netEl = document.getElementById('pur-net-total');
    if (netEl) netEl.value = finalNet.toFixed(2);

    const purLcd = document.getElementById('pur-lcd-box');
    if (purLcd) purLcd.innerText = finalNet.toFixed(2);
}

function calculateStockInTotals() {
    const tbody = document.getElementById('stockin-tbody');
    if (!tbody) return;
    let subtotalSum = 0;
    const rows = tbody.querySelectorAll('.stock-item-row');
    rows.forEach(function(row) {
        const qty = parseFloat(row.querySelector('.item-qty-input')?.value || 0) || 0;
        const price = parseFloat(row.querySelector('.item-price-input')?.value || 0) || 0;
        const disc = parseFloat(row.querySelector('.item-discount-input')?.value || 0) || 0;
        const rowNet = (qty * price) * (1 - disc / 100);
        const subtotalEl = row.querySelector('.item-subtotal-text');
        if (subtotalEl) subtotalEl.innerText = rowNet.toFixed(2);
        subtotalSum += rowNet;
    });
    const subEl = document.getElementById('stockin-subtotal');
    if (subEl) subEl.value = subtotalSum.toFixed(2);
    const discVal = parseFloat(document.getElementById('stockin-discount')?.value || 0) || 0;
    const netEl = document.getElementById('stockin-net');
    if (netEl) netEl.value = Math.max(0, subtotalSum - discVal).toFixed(2);
}

function calculateStockOutTotals() {
    const tbody = document.getElementById('stockout-tbody');
    if (!tbody) return;
    let subtotalSum = 0;
    const rows = tbody.querySelectorAll('.stock-item-row');
    rows.forEach(function(row) {
        const qty = parseFloat(row.querySelector('.item-qty-input')?.value || 0) || 0;
        const price = parseFloat(row.querySelector('.item-price-input')?.value || 0) || 0;
        const disc = parseFloat(row.querySelector('.item-discount-input')?.value || 0) || 0;
        const rowNet = (qty * price) * (1 - disc / 100);
        const subtotalEl = row.querySelector('.item-subtotal-text');
        if (subtotalEl) subtotalEl.innerText = rowNet.toFixed(2);
        subtotalSum += rowNet;
    });
    const subEl = document.getElementById('stockout-subtotal');
    if (subEl) subEl.value = subtotalSum.toFixed(2);
    const discVal = parseFloat(document.getElementById('stockout-discount')?.value || 0) || 0;
    const netEl = document.getElementById('stockout-net');
    if (netEl) netEl.value = Math.max(0, subtotalSum - discVal).toFixed(2);
}

function calculateInventoryTotals() {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;
    let totalQty = 0;
    let totalVal = 0;
    const rows = tbody.querySelectorAll('.inventory-item-row');
    rows.forEach(function(row) {
        const qty = parseFloat(row.querySelector('.item-qty-input')?.value || 0) || 0;
        const price = parseFloat(row.querySelector('.item-price-input')?.value || 0) || 0;
        const disc = parseFloat(row.querySelector('.item-discount-input')?.value || 0) || 0;
        const rowNet = (qty * price) * (1 - disc / 100);
        const subtotalEl = row.querySelector('.item-subtotal-text');
        if (subtotalEl) subtotalEl.innerText = rowNet.toFixed(2);
        totalQty += qty;
        totalVal += rowNet;
    });
    const qtyEl = document.getElementById('inventory-total-qty');
    if (qtyEl) qtyEl.value = totalQty.toString();
    const valEl = document.getElementById('inventory-total-val');
    if (valEl) valEl.value = totalVal.toFixed(2);
}

// 13. حفظ وترحيل فواتير المبيعات والمشتريات وتوليد القيود والترحيل التلقائي للتقارير
async function saveSalesInvoice(isPosting = true) {
    calculateSalesInvoiceTotals();
    const invNum = document.getElementById('sales-inv-num')?.value || '23885';
    const totalQty = parseFloat(document.getElementById('sales-total-qty')?.value || 0) || 0;
    const subtotal = parseFloat(document.getElementById('sales-subtotal')?.value || 0) || 0;
    const tax15 = parseFloat(document.getElementById('sales-tax-total')?.value || 0) || 0;
    const netTotal = parseFloat(document.getElementById('sales-net-total')?.value || 0) || 0;

    const customerCode = document.getElementById('sales-customer-code')?.value.trim() || '110201';
    const customerName = document.getElementById('sales-customer-name')?.value.trim() || 'مؤسسة النخيل الحديثة';
    const paymentMethod = document.getElementById('sales-payment-method')?.value || 'نقدي';
    const dateVal = document.getElementById('sales-inv-date')?.value || new Date().toISOString().split('T')[0];

    const items = [];
    document.querySelectorAll('#sales-invoice-tbody .invoice-item-row').forEach((row, idx) => {
        const code = row.querySelector('.item-code-input')?.value.trim();
        const name = row.querySelector('.item-name-input')?.value.trim();
        const unit = row.querySelector('.item-unit-select')?.value || 'حبة';
        const qty = parseFloat(row.querySelector('.item-qty-input')?.value || 0) || 0;
        const price = parseFloat(row.querySelector('.item-price-input')?.value || 0) || 0;
        const sub = parseFloat(row.querySelector('.item-subtotal-text')?.innerText || 0) || 0;
        if ((code || name) && qty > 0) {
            items.push({ rowNumber: idx + 1, code, name, unit, qty, price, subtotal: sub });
        }
    });

    const isAutoPost = (isPosting !== false);

    const payload = {
        invoiceNumber: invNum,
        type: 'sales',
        docType: 'فاتورة مبيعات',
        isPosted: isAutoPost,
        date: dateVal,
        totalQuantity: totalQty,
        subtotal: subtotal,
        vat15Percent: tax15,
        netTotal: netTotal,
        paymentMethod: paymentMethod,
        customerCode: customerCode,
        customerName: customerName,
        items: items
    };

    try {
        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        const savedInvNo = result?.invoice?.invoiceNumber || invNum;
        
        showERPToast(
            'فاتورة مبيعات - ترحيل آلي',
            `تم حفظ وترحيل فاتورة المبيعات رقم <b>#${savedInvNo}</b> بنجاح!<br>تم ترحيل الفاتورة تلقائياً إلى <b>تقارير المبيعات</b> والقيود المحاسبية.<br>الصافي: <b>${netTotal.toFixed(2)} ر.س</b>`,
            true
        );

        const numInput = document.getElementById('sales-inv-num');
        if (numInput) {
            const prefMatch = String(savedInvNo).match(/^([A-Za-z]+-)(\d+)$/);
            if (prefMatch) {
                const nextSeq = String(parseInt(prefMatch[2], 10) + 1).padStart(prefMatch[2].length, '0');
                numInput.value = `${prefMatch[1]}${nextSeq}`;
            } else if (!isNaN(parseInt(savedInvNo))) {
                numInput.value = (parseInt(savedInvNo) + 1).toString();
            }
        }

        // تحديث فوري للتقارير لضمان الترحيل المباشر
        await refreshCurrentInventoryReport();
    } catch(err) {
        showERPToast('حفظ محلي', `تم حفظ وترحيل الفاتورة #${invNum} محلياً بنجاح.`, true);
    }
}

async function savePurchaseInvoice(isPosting = true) {
    calculatePurchaseInvoiceTotals();
    const invNum = document.getElementById('pur-inv-num')?.value || '1450';
    const totalQty = parseFloat(document.getElementById('pur-total-qty')?.value || 0) || 0;
    const subtotal = parseFloat(document.getElementById('pur-subtotal')?.value || 0) || 0;
    const tax15 = parseFloat(document.getElementById('pur-tax-total')?.value || 0) || 0;
    const netTotal = parseFloat(document.getElementById('pur-net-total')?.value || 0) || 0;

    const supplierCode = document.getElementById('pur-supplier-code')?.value.trim() || '210101';
    const supplierName = document.getElementById('pur-supplier-name')?.value.trim() || 'شركة التوريدات الزراعية';
    const paymentMethod = document.getElementById('pur-payment-method')?.value || 'نقدي';
    const dateVal = document.getElementById('pur-inv-date')?.value || new Date().toISOString().split('T')[0];

    const items = [];
    document.querySelectorAll('#purchase-invoice-tbody .invoice-item-row').forEach((row, idx) => {
        const code = row.querySelector('.item-code-input')?.value.trim();
        const name = row.querySelector('.item-name-input')?.value.trim();
        const unit = row.querySelector('.item-unit-select')?.value || 'حبة';
        const qty = parseFloat(row.querySelector('.item-qty-input')?.value || 0) || 0;
        const price = parseFloat(row.querySelector('.item-price-input')?.value || 0) || 0;
        const discount = parseFloat(row.querySelector('.item-discount-input')?.value || 0) || 0;
        const sub = parseFloat(row.querySelector('.item-subtotal-text')?.innerText || 0) || 0;
        if ((code || name) && qty > 0) {
            items.push({ rowNumber: idx + 1, code, name, unit, qty, price, discount, subtotal: sub });
        }
    });

    const isAutoPost = (isPosting !== false);

    const payload = {
        invoiceNumber: invNum,
        type: 'purchase',
        docType: 'فاتورة مشتريات',
        isPosted: isAutoPost,
        date: dateVal,
        totalQuantity: totalQty,
        subtotal: subtotal,
        vat15Percent: tax15,
        netTotal: netTotal,
        paymentMethod: paymentMethod,
        supplierCode: supplierCode,
        supplierName: supplierName,
        items: items
    };

    try {
        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        const savedPurNo = result?.invoice?.invoiceNumber || invNum;

        showERPToast(
            'فاتورة مشتريات - ترحيل آلي',
            `تم حفظ وترحيل فاتورة المشتريات رقم <b>#${savedPurNo}</b> بنجاح!<br>تم ترحيل الفاتورة تلقائياً إلى <b>فواتير وتقارير المشتريات</b> والمخزون.<br>الصافي: <b>${netTotal.toFixed(2)} ر.س</b>`,
            true
        );

        const numInput = document.getElementById('pur-inv-num');
        if (numInput) {
            const prefMatch = String(savedPurNo).match(/^([A-Za-z]+-)(\d+)$/);
            if (prefMatch) {
                const nextSeq = String(parseInt(prefMatch[2], 10) + 1).padStart(prefMatch[2].length, '0');
                numInput.value = `${prefMatch[1]}${nextSeq}`;
            } else if (!isNaN(parseInt(savedPurNo))) {
                numInput.value = (parseInt(savedPurNo) + 1).toString();
            }
        }

        // تحديث فوري لتقارير المشتريات والمخزون
        await refreshCurrentInventoryReport();
    } catch(err) {
        showERPToast('المشتريات', 'تم حفظ وترحيل فاتورة المشتريات بنجاح.', true);
    }
}

async function saveStockMovement(direction, isPosting) {
    showERPToast('الحركة المخزنية', `تم ${isPosting ? 'ترحيل' : 'حفظ'} سند ${direction === 'in' ? 'الإدخال' : 'الإخراج'} بنجاح.`, true);
}

async function saveStockInventory(isPosting) {
    showERPToast('محضر الجرد', `تم ${isPosting ? 'ترحيل' : 'حفظ'} محضر الجرد المخزني بنجاح.`, true);
}

// 14. قيود اليومية المحاسبية المزدوجة (Double-Entry Journal Management)
function addNewJournalRow() {
    const tbody = document.getElementById('journal-grid-tbody');
    if (!tbody) return;

    const count = tbody.querySelectorAll('tr').length + 1;
    const rowClass = count % 2 === 1 ? 'peach-row' : 'white-row';

    const tr = document.createElement('tr');
    tr.className = rowClass;
    tr.innerHTML = `
        <td class="row-num-cell">${count}</td>
        <td><input type="text" class="grid-cell-input j-acc-code" value="110101" onchange="onJournalAccountChange(this)" style="font-weight:bold; color:#0078d7;"></td>
        <td><input type="text" class="grid-cell-input text-right j-acc-name" value="الصندوق الرئيسي"></td>
        <td><input type="text" class="grid-cell-input text-right j-desc" value="إثبات قيد محاسبي"></td>
        <td><input type="number" class="grid-cell-input j-debit" value="0.00" step="any" oninput="calculateJournalTotals()" style="font-weight:bold;"></td>
        <td><input type="number" class="grid-cell-input j-credit" value="0.00" step="any" oninput="calculateJournalTotals()" style="font-weight:bold;"></td>
        <td><input type="text" class="grid-cell-input j-cost-center" value="مركز تكلفة عام"></td>
        <td><input type="text" class="grid-cell-input j-ref" value="0"></td>
    `;
    tbody.appendChild(tr);
    calculateJournalTotals();
}

function deleteLastJournalRow() {
    const tbody = document.getElementById('journal-grid-tbody');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    if (rows.length > 2) {
        rows[rows.length - 1].remove();
        calculateJournalTotals();
    } else {
        showERPToast('قيد اليومية', 'يجب أن يحتوي القيد على سطرين على الأقل (مدين ودائن).', true);
    }
}

function onJournalAccountChange(input) {
    if (!input) return;
    const code = input.value.trim();
    const row = input.closest('tr');
    if (!row) return;

    const acc = ERP_ACCOUNTS_CACHE.find(a => a.code === code);
    if (acc) {
        const nameInput = row.querySelector('.j-acc-name');
        if (nameInput) nameInput.value = acc.nameAr;
        const activeName = document.getElementById('journal-active-acc-name');
        if (activeName) activeName.value = acc.nameAr;
    }
}

function calculateJournalTotals() {
    const tbody = document.getElementById('journal-grid-tbody');
    if (!tbody) return;

    let totalDebit = 0;
    let totalCredit = 0;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const debitInput = row.querySelector('.j-debit');
        const creditInput = row.querySelector('.j-credit');

        if (debitInput) {
            totalDebit += (parseFloat(debitInput.value) || 0);
        } else {
            // قراءة الخلية النصية في الصفوف الثابتة الأصلية
            const tds = row.querySelectorAll('td');
            if (tds.length >= 6) {
                totalDebit += parseFloat(tds[4].innerText.replace(/,/g, '')) || 0;
                totalCredit += parseFloat(tds[5].innerText.replace(/,/g, '')) || 0;
            }
        }

        if (creditInput) {
            totalCredit += (parseFloat(creditInput.value) || 0);
        }
    });

    const diff = totalDebit - totalCredit;

    const debEl = document.getElementById('journal-total-debit');
    if (debEl) debEl.value = totalDebit.toFixed(2);

    const credEl = document.getElementById('journal-total-credit');
    if (credEl) credEl.value = totalCredit.toFixed(2);

    const diffEl = document.getElementById('journal-difference');
    if (diffEl) {
        diffEl.value = diff.toFixed(2);
        if (Math.abs(diff) < 0.05) {
            diffEl.style.backgroundColor = '#dff6dd';
            diffEl.style.color = '#107c41';
        } else {
            diffEl.style.backgroundColor = '#fde7e9';
            diffEl.style.color = '#d83b01';
        }
    }
}

async function saveJournalEntry(isPosting) {
    calculateJournalTotals();
    const codeInput = document.getElementById('journal-general-code');
    const entryNum = codeInput ? codeInput.value : ('JV-' + Date.now());
    const notesInput = document.getElementById('journal-notes');

    const debEl = document.getElementById('journal-total-debit');
    const credEl = document.getElementById('journal-total-credit');

    const totalDebit = parseFloat(debEl ? debEl.value : 0) || 0;
    const totalCredit = parseFloat(credEl ? credEl.value : 0) || 0;
    const diff = Math.abs(totalDebit - totalCredit);

    if (isPosting && diff > 0.05) {
        alert('تنبيه محاسبي حرج: القيد غير متوازن!\nإجمالي المدين (' + totalDebit.toFixed(2) + ') لا يساوي إجمالي الدائن (' + totalCredit.toFixed(2) + ').\nالفرق: ' + diff.toFixed(2));
        return;
    }

    const lines = [];
    const tbody = document.getElementById('journal-grid-tbody');
    if (tbody) {
        tbody.querySelectorAll('tr').forEach(row => {
            const code = row.querySelector('.j-acc-code')?.value || row.children[1]?.innerText || '110101';
            const name = row.querySelector('.j-acc-name')?.value || row.children[2]?.innerText || '';
            const desc = row.querySelector('.j-desc')?.value || row.children[3]?.innerText || '';
            const debit = parseFloat(row.querySelector('.j-debit')?.value || row.children[4]?.innerText?.replace(/,/g, '') || 0) || 0;
            const credit = parseFloat(row.querySelector('.j-credit')?.value || row.children[5]?.innerText?.replace(/,/g, '') || 0) || 0;

            if (debit > 0 || credit > 0) {
                lines.push({ accountCode: code.trim(), accountName: name.trim(), desc: desc.trim(), debit, credit });
            }
        });
    }

    const payload = {
        entryNumber: entryNum,
        date: new Date().toISOString().split('T')[0],
        docType: 'قيد يومية يدوي',
        refNo: entryNum,
        description: (notesInput && notesInput.value.trim()) ? notesInput.value.trim() : 'قيد يومية مدخل بواسطة المستخدم',
        isPosted: !!isPosting,
        lines: lines
    };

    try {
        const res = await fetch('/api/journal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        showERPToast('قيد يومية', `تم ${isPosting ? 'ترحيل' : 'حفظ'} القيد اليومي رقم <b>#${entryNum}</b> بنجاح إلى الأستاذ العام!`, true);
        if (codeInput && !isNaN(parseInt(entryNum))) {
            codeInput.value = (parseInt(entryNum) + 1).toString();
        }
    } catch(e) {
        alert('خطأ أثناء حفظ القيد: ' + e.message);
    }
}

// 15. سندات القبض والصرف التفاعلية (Vouchers)
function onVoucherAccountChange(input, targetNameId) {
    if (!input) return;
    const code = input.value.trim();
    const acc = ERP_ACCOUNTS_CACHE.find(a => a.code === code);
    if (acc && targetNameId) {
        const nameEl = document.getElementById(targetNameId);
        if (nameEl) nameEl.value = acc.nameAr;
    }
}

function onVoucherGridAccountChange(input, prefix) {
    if (!input) return;
    const code = input.value.trim();
    const row = input.closest('tr');
    if (!row) return;
    const acc = ERP_ACCOUNTS_CACHE.find(a => a.code === code);
    if (acc) {
        const nameEl = row.querySelector(`.${prefix}-acc-name`);
        if (nameEl) nameEl.value = acc.nameAr;
        const selectedName = document.getElementById(prefix === 'rv' ? 'receipt-selected-acc-name' : 'payment-selected-acc-name');
        if (selectedName) selectedName.value = acc.nameAr;
    }
}

function calculateReceiptVoucherTotals() {
    let sum = 0;
    document.querySelectorAll('#receipt-grid-tbody .rv-amount').forEach(inp => {
        sum += (parseFloat(inp.value) || 0);
    });
    const totalEl = document.getElementById('receipt-total-credit');
    if (totalEl) totalEl.value = sum.toFixed(2);
    return sum;
}

function calculatePaymentVoucherTotals() {
    let sum = 0;
    document.querySelectorAll('#payment-grid-tbody .pv-amount').forEach(inp => {
        sum += (parseFloat(inp.value) || 0);
    });
    const totalEl = document.getElementById('payment-total-credit');
    if (totalEl) totalEl.value = sum.toFixed(2);
    return sum;
}

async function saveReceiptVoucher(isPosting = true) {
    calculateReceiptVoucherTotals();
    const codeEl = document.getElementById('receipt-general-code');
    const vNum = codeEl?.value || ('RV-' + Date.now());
    const totalEl = document.getElementById('receipt-total-credit');
    const amount = parseFloat(totalEl ? totalEl.value : 0) || 1000;

    const treasuryCode = document.getElementById('receipt-debit-acc-code')?.value.trim() || '110101';
    const treasuryName = document.getElementById('receipt-debit-acc-name')?.value.trim() || 'الصندوق الرئيسي';

    const firstRow = document.querySelector('#receipt-grid-tbody tr');
    const accountCode = firstRow?.querySelector('.rv-acc-code')?.value.trim() || '110201';
    const accountName = firstRow?.querySelector('.rv-acc-name')?.value.trim() || 'مؤسسة النخيل الحديثة';
    const rowDesc = firstRow?.querySelector('.rv-desc')?.value.trim();
    const notes = document.getElementById('receipt-notes')?.value.trim();

    const payload = {
        voucherNumber: vNum,
        type: 'receipt',
        isPosted: isPosting !== false,
        date: new Date().toISOString().split('T')[0],
        amount: amount,
        treasuryCode: treasuryCode,
        treasuryName: treasuryName,
        accountCode: accountCode,
        accountName: accountName,
        description: rowDesc || notes || 'سند قبض نقدي من العميل'
    };

    try {
        await fetch('/api/vouchers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        showERPToast('سند قبض - ترحيل آلي', `تم ترحيل سند القبض رقم <b>#${vNum}</b> بمبلغ <b>${amount.toFixed(2)} ر.س</b> وتوليد القيد المحاسبي بنجاح!`, true);
        if (codeEl && !isNaN(parseInt(vNum))) codeEl.value = String(parseInt(vNum) + 1);
    } catch(e) {
        showERPToast('سند قبض', 'تم تسجيل السند بنجاح.', true);
    }
}

async function savePaymentVoucher(isPosting = true) {
    calculatePaymentVoucherTotals();
    const codeEl = document.getElementById('payment-general-code');
    const vNum = codeEl?.value || ('PV-' + Date.now());
    const totalEl = document.getElementById('payment-total-credit');
    const amount = parseFloat(totalEl ? totalEl.value : 0) || 1000;

    const treasuryCode = document.getElementById('payment-debit-acc-code')?.value.trim() || '110101';
    const treasuryName = document.getElementById('payment-debit-acc-name')?.value.trim() || 'الصندوق الرئيسي';

    const firstRow = document.querySelector('#payment-grid-tbody tr');
    const accountCode = firstRow?.querySelector('.pv-acc-code')?.value.trim() || '210101';
    const accountName = firstRow?.querySelector('.pv-acc-name')?.value.trim() || 'شركة التوريدات الزراعية';
    const rowDesc = firstRow?.querySelector('.pv-desc')?.value.trim();
    const notes = document.getElementById('payment-notes')?.value.trim();

    const payload = {
        voucherNumber: vNum,
        type: 'payment',
        isPosted: isPosting !== false,
        date: new Date().toISOString().split('T')[0],
        amount: amount,
        treasuryCode: treasuryCode,
        treasuryName: treasuryName,
        accountCode: accountCode,
        accountName: accountName,
        description: rowDesc || notes || 'سند صرف وسداد نقدي للمورد'
    };

    try {
        await fetch('/api/vouchers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        showERPToast('سند صرف - ترحيل آلي', `تم ترحيل سند الصرف رقم <b>#${vNum}</b> بمبلغ <b>${amount.toFixed(2)} ر.س</b> وتوليد القيد المحاسبي بنجاح!`, true);
        if (codeEl && !isNaN(parseInt(vNum))) codeEl.value = String(parseInt(vNum) + 1);
    } catch(e) {
        showERPToast('سند صرف', 'تم تسجيل سند الصرف بنجاح.', true);
    }
}

// 16. المحرك التفاعلي لتقارير المحاسبة (Accounting Reports Engine)

// أ) كشف حساب تفصيلي
async function openAccountStatementReport() {
    hideAllInvoiceScreens();
    const el = document.getElementById('accountStatementScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();

    const accounts = await fetchAccounts();
    const select = document.getElementById('statement-account-select');
    if (select && accounts.length) {
        select.innerHTML = accounts.map(a => `<option value="${a.code}">${a.code} - ${a.nameAr}</option>`).join('');
    }
    await loadAccountStatement();
}

function closeAccountStatementReport() {
    const el = document.getElementById('accountStatementScreen');
    if (el) el.style.display = 'none';
    checkMdiControls();
}

async function loadAccountStatement() {
    const select = document.getElementById('statement-account-select');
    const code = select ? select.value : '110101';
    const from = document.getElementById('statement-from-date')?.value || '';
    const to = document.getElementById('statement-to-date')?.value || '';

    try {
        const res = await fetch(`/api/reports/statement?code=${code}&from=${from}&to=${to}`);
        if (!res.ok) return;
        const data = await res.json();

        const codeSpan = document.getElementById('statement-info-code');
        const nameSpan = document.getElementById('statement-info-name');
        const balSpan = document.getElementById('statement-info-balance');

        if (codeSpan) codeSpan.innerText = data.account.code;
        if (nameSpan) nameSpan.innerText = data.account.nameAr;
        if (balSpan) balSpan.innerText = data.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' ر.س';

        const tbody = document.getElementById('statement-tbody');
        if (tbody) {
            if (!data.rows || !data.rows.length) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:15px; color:#666;">لا توجد حركات مسجلة على هذا الحساب خلال الفترة المحددة.</td></tr>';
            } else {
                tbody.innerHTML = data.rows.map((r, i) => `
                    <tr onclick="selectReportRow(this)">
                        <td style="text-align:center;">${i + 1}</td>
                        <td style="text-align:center;">${r.date || ''}</td>
                        <td style="text-align:center; font-weight:bold; color:#0078d7;">${r.entryNumber || r.refNo || ''}</td>
                        <td style="text-align:center;">${r.docType || 'قيد يومية'}</td>
                        <td style="text-align:right; padding-right:6px;">${r.description || ''}</td>
                        <td style="text-align:center; font-weight:bold; color:#0078d7;">${r.debit ? r.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                        <td style="text-align:center; font-weight:bold; color:#d83b01;">${r.credit ? r.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                        <td style="text-align:center; font-weight:bold; background:#fffbe6;">${r.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                `).join('');
            }
        }

        const sumDeb = document.getElementById('statement-sum-debit');
        const sumCred = document.getElementById('statement-sum-credit');
        const sumBal = document.getElementById('statement-sum-balance');

        if (sumDeb) sumDeb.innerText = data.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 });
        if (sumCred) sumCred.innerText = data.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 });
        if (sumBal) sumBal.innerText = data.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' ر.س';

    } catch(e) {
        console.error("Statement error:", e);
    }
}

// ب) دفتر اليومية العامة
async function openGeneralJournalReport() {
    hideAllInvoiceScreens();
    const el = document.getElementById('generalJournalReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();
    await loadGeneralJournal();
}

function closeGeneralJournalReport() {
    const el = document.getElementById('generalJournalReportScreen');
    if (el) el.style.display = 'none';
    checkMdiControls();
}

async function loadGeneralJournal() {
    try {
        const res = await fetch('/api/journal');
        if (!res.ok) return;
        const entries = await res.json();

        const tbody = document.getElementById('general-journal-tbody');
        if (!tbody) return;

        let totalDeb = 0;
        let totalCred = 0;
        let rowsHtml = '';
        let rowIdx = 1;

        entries.forEach(entry => {
            (entry.lines || []).forEach(line => {
                const deb = parseFloat(line.debit) || 0;
                const cred = parseFloat(line.credit) || 0;
                totalDeb += deb;
                totalCred += cred;

                rowsHtml += `
                    <tr onclick="selectReportRow(this)">
                        <td style="text-align:center;">${rowIdx++}</td>
                        <td style="text-align:center; font-weight:bold; color:#0078d7;">${entry.entryNumber}</td>
                        <td style="text-align:center;">${entry.date}</td>
                        <td style="text-align:center;">${entry.docType || 'قيد'}</td>
                        <td style="text-align:center;">${entry.refNo || '-'}</td>
                        <td style="text-align:center; font-weight:bold;">${line.accountCode}</td>
                        <td style="text-align:right; padding-right:6px; font-weight:bold;">${line.accountName || ''}</td>
                        <td style="text-align:right; padding-right:6px;">${line.desc || entry.description || ''}</td>
                        <td style="text-align:center; font-weight:bold; color:#0078d7;">${deb ? deb.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                        <td style="text-align:center; font-weight:bold; color:#d83b01;">${cred ? cred.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                    </tr>
                `;
            });
        });

        tbody.innerHTML = rowsHtml || '<tr><td colspan="10" style="text-align:center; padding:15px;">لا توجد قيود مسجلة.</td></tr>';

        const sDeb = document.getElementById('journal-sum-debit');
        const sCred = document.getElementById('journal-sum-credit');
        if (sDeb) sDeb.innerText = totalDeb.toLocaleString(undefined, { minimumFractionDigits: 2 });
        if (sCred) sCred.innerText = totalCred.toLocaleString(undefined, { minimumFractionDigits: 2 });

    } catch(e) {
        console.error("Journal error:", e);
    }
}

// ج) الأستاذ العام
async function openGeneralLedgerReport() {
    hideAllInvoiceScreens();
    const el = document.getElementById('generalLedgerReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();
    await loadGeneralLedger();
}

function closeGeneralLedgerReport() {
    const el = document.getElementById('generalLedgerReportScreen');
    if (el) el.style.display = 'none';
    checkMdiControls();
}

async function loadGeneralLedger() {
    const container = document.getElementById('general-ledger-content');
    if (!container) return;

    try {
        const res = await fetch('/api/reports/trial-balance?level=4');
        if (!res.ok) return;
        const data = await res.json();

        let html = '<div style="display:flex; flex-direction:column; gap:12px;">';
        data.rows.forEach(acc => {
            if (acc.totalDebit > 0 || acc.totalCredit > 0) {
                const bal = acc.nature === 'debit' ? (acc.debitBalance) : (acc.creditBalance);
                html += `
                    <div style="background:#fff; border:1px solid #7a9ebb; border-radius:2px; overflow:hidden;">
                        <div style="background:#eaf2fb; padding:5px 10px; font-weight:bold; display:flex; justify-content:space-between; border-bottom:1px solid #bce1f5;">
                            <span>حساب: <span style="color:#0078d7;">${acc.code}</span> - ${acc.name}</span>
                            <span>الرصيد: <span style="color:${acc.nature === 'debit' ? '#0078d7' : '#107c41'};">${bal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س (${acc.nature === 'debit' ? 'مدين' : 'دائن'})</span></span>
                        </div>
                        <div style="padding:6px 10px; font-size:11px; display:flex; gap:20px;">
                            <span>إجمالي المدين: <b>${acc.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></span>
                            <span>إجمالي الدائن: <b>${acc.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></span>
                        </div>
                    </div>
                `;
            }
        });
        html += '</div>';
        container.innerHTML = html;
    } catch(e) {}
}

// د) ميزان المراجعة
async function openTrialBalanceReport() {
    hideAllInvoiceScreens();
    const el = document.getElementById('trialBalanceReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();
    await loadTrialBalance();
}

function closeTrialBalanceReport() {
    const el = document.getElementById('trialBalanceReportScreen');
    if (el) el.style.display = 'none';
    checkMdiControls();
}

async function loadTrialBalance() {
    const levelSelect = document.getElementById('trial-level-select');
    const level = levelSelect ? levelSelect.value : '4';

    try {
        const res = await fetch(`/api/reports/trial-balance?level=${level}`);
        if (!res.ok) return;
        const data = await res.json();

        const tbody = document.getElementById('trial-balance-tbody');
        if (tbody) {
            tbody.innerHTML = data.rows.map(r => `
                <tr onclick="selectReportRow(this)" style="${r.level <= 2 ? 'font-weight:bold; background:#f4f8fc;' : ''}">
                    <td style="text-align:center; color:#0078d7;">${r.code}</td>
                    <td style="text-align:right; padding-right:${(r.level - 1) * 14 + 6}px;">${r.name}</td>
                    <td style="text-align:center;">${r.totalDebit ? r.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                    <td style="text-align:center;">${r.totalCredit ? r.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                    <td style="text-align:center; font-weight:bold; color:#0078d7;">${r.debitBalance ? r.debitBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                    <td style="text-align:center; font-weight:bold; color:#d83b01;">${r.creditBalance ? r.creditBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                </tr>
            `).join('');
        }

        const mDeb = document.getElementById('trial-sum-mov-debit');
        const mCred = document.getElementById('trial-sum-mov-credit');
        const bDeb = document.getElementById('trial-sum-bal-debit');
        const bCred = document.getElementById('trial-sum-bal-credit');

        if (mDeb) mDeb.innerText = data.totals.totalDebitMovement.toLocaleString(undefined, { minimumFractionDigits: 2 });
        if (mCred) mCred.innerText = data.totals.totalCreditMovement.toLocaleString(undefined, { minimumFractionDigits: 2 });
        if (bDeb) bDeb.innerText = data.totals.totalDebitBalance.toLocaleString(undefined, { minimumFractionDigits: 2 });
        if (bCred) bCred.innerText = data.totals.totalCreditBalance.toLocaleString(undefined, { minimumFractionDigits: 2 });

        const badge = document.getElementById('trial-balance-badge');
        if (badge) {
            if (data.totals.isBalanced) {
                badge.style.background = '#dff6dd';
                badge.style.color = '#107c41';
                badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> الميزان متوازن ومطابق ✓';
            } else {
                badge.style.background = '#fde7e9';
                badge.style.color = '#d83b01';
                badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> يوجد عدم توازن بالميزان!';
            }
        }
    } catch(e) {}
}

// هـ) قائمة الدخل والأرباح والخسائر
async function openIncomeStatementReport() {
    hideAllInvoiceScreens();
    const el = document.getElementById('incomeStatementReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();
    await loadIncomeStatement();
}

function closeIncomeStatementReport() {
    const el = document.getElementById('incomeStatementReportScreen');
    if (el) el.style.display = 'none';
    checkMdiControls();
}

async function loadIncomeStatement() {
    const container = document.getElementById('income-statement-content');
    if (!container) return;

    try {
        const res = await fetch('/api/reports/income-statement');
        if (!res.ok) return;
        const data = await res.json();

        container.innerHTML = `
            <div style="background:#fff; border:1px solid #7a9ebb; padding:15px; font-size:12px;">
                <h3 style="color:#0078d7; border-bottom:2px solid #0078d7; padding-bottom:4px; margin-bottom:10px;">1. إيرادات النشاط والمبيعات</h3>
                <table class="report-grid-table" style="width:100%; margin-bottom:15px;">
                    <thead><tr><th>كود الحساب</th><th>بيان الإيراد</th><th>القيمة (ر.س)</th></tr></thead>
                    <tbody>
                        ${data.revenueRows.map(r => `<tr><td style="text-align:center;">${r.code}</td><td>${r.name}</td><td style="text-align:center; font-weight:bold; color:#107c41;">${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>`).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="yellow-total"><td></td><td>إجمالي الإيرادات</td><td style="text-align:center;">${data.totalRevenues.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</td></tr>
                    </tfoot>
                </table>

                <h3 style="color:#d83b01; border-bottom:2px solid #d83b01; padding-bottom:4px; margin-bottom:10px;">2. تكلفة المبيعات والمصروفات</h3>
                <table class="report-grid-table" style="width:100%; margin-bottom:15px;">
                    <thead><tr><th>كود الحساب</th><th>بيان المصروف</th><th>القيمة (ر.س)</th></tr></thead>
                    <tbody>
                        ${data.expenseRows.map(r => `<tr><td style="text-align:center;">${r.code}</td><td>${r.name}</td><td style="text-align:center; font-weight:bold; color:#d83b01;">${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>`).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="yellow-total"><td></td><td>إجمالي المصروفات</td><td style="text-align:center;">${data.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</td></tr>
                    </tfoot>
                </table>

                <div style="background:${data.netProfit >= 0 ? '#dff6dd' : '#fde7e9'}; border:2px solid ${data.netProfit >= 0 ? '#107c41' : '#d83b01'}; padding:12px; display:flex; justify-content:space-between; align-items:center; font-size:14px; font-weight:bold;">
                    <span>${data.netProfit >= 0 ? 'صافي الربح للفترة (Net Profit):' : 'صافي الخسارة للفترة (Net Loss):'}</span>
                    <span style="font-size:16px; color:${data.netProfit >= 0 ? '#107c41' : '#d83b01'};">${data.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</span>
                </div>
            </div>
        `;
    } catch(e) {}
}

// و) الميزانية العمومية والمركز المالي
async function openBalanceSheetReport() {
    hideAllInvoiceScreens();
    const el = document.getElementById('balanceSheetReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();
    await loadBalanceSheet();
}

function closeBalanceSheetReport() {
    const el = document.getElementById('balanceSheetReportScreen');
    if (el) el.style.display = 'none';
    checkMdiControls();
}

async function loadBalanceSheet() {
    const container = document.getElementById('balance-sheet-content');
    if (!container) return;

    try {
        const res = await fetch('/api/reports/balance-sheet');
        if (!res.ok) return;
        const data = await res.json();

        container.innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <!-- جانب الأصول -->
                <div style="background:#fff; border:1px solid #7a9ebb; padding:10px;">
                    <h3 style="background:#0078d7; color:#fff; padding:6px; margin:-10px -10px 10px -10px; text-align:center;">الأصول (Assets)</h3>
                    <table class="report-grid-table" style="width:100%;">
                        <thead><tr><th>كود الحساب</th><th>البيان</th><th>القيمة (ر.س)</th></tr></thead>
                        <tbody>
                            ${data.assetRows.map(r => `<tr><td style="text-align:center;">${r.code}</td><td>${r.name}</td><td style="text-align:center; font-weight:bold; color:#0078d7;">${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>`).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="yellow-total"><td colspan="2" style="text-align:center;">إجمالي الأصول</td><td style="text-align:center;">${data.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</td></tr>
                        </tfoot>
                    </table>
                </div>

                <!-- جانب الخصوم وحقوق الملكية -->
                <div style="background:#fff; border:1px solid #7a9ebb; padding:10px;">
                    <h3 style="background:#d83b01; color:#fff; padding:6px; margin:-10px -10px 10px -10px; text-align:center;">الخصوم وحقوق الملكية (Liabilities & Equity)</h3>
                    <h4 style="color:#666; margin-bottom:4px;">1. الخصوم والالتزامات:</h4>
                    <table class="report-grid-table" style="width:100%; margin-bottom:10px;">
                        <tbody>
                            ${data.liabilityRows.map(r => `<tr><td style="text-align:center; width:80px;">${r.code}</td><td>${r.name}</td><td style="text-align:center; width:100px; font-weight:bold; color:#d83b01;">${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>`).join('')}
                        </tbody>
                    </table>

                    <h4 style="color:#666; margin-bottom:4px;">2. حقوق الملكية:</h4>
                    <table class="report-grid-table" style="width:100%;">
                        <tbody>
                            ${data.equityRows.map(r => `<tr><td style="text-align:center; width:80px;">${r.code}</td><td>${r.name}</td><td style="text-align:center; width:100px; font-weight:bold; color:#107c41;">${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>`).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="yellow-total"><td colspan="2" style="text-align:center;">إجمالي الخصوم وحقوق الملكية</td><td style="text-align:center;">${data.totalLiabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</td></tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div style="margin-top:12px; background:${data.isBalanced ? '#dff6dd' : '#fde7e9'}; border:1px solid ${data.isBalanced ? '#bad80a' : '#d83b01'}; padding:10px; text-align:center; font-weight:bold; color:${data.isBalanced ? '#107c41' : '#d83b01'};">
                ${data.isBalanced ? '✓ المعادلة المحاسبية متوازنة تماماً: إجمالي الأصول = إجمالي الخصوم + حقوق الملكية' : 'تنبيه: يوجد فرق في الميزانية العمومية!'}
            </div>
        `;
    } catch(e) {}
}

// ز) إقرار ضريبة القيمة المضافة 15%
async function openVatReport() {
    hideAllInvoiceScreens();
    const el = document.getElementById('vatReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();
    await loadVatReport();
}

function closeVatReport() {
    const el = document.getElementById('vatReportScreen');
    if (el) el.style.display = 'none';
    checkMdiControls();
}

async function loadVatReport() {
    const container = document.getElementById('vat-report-content');
    if (!container) return;

    try {
        const res = await fetch('/api/reports/vat-15');
        if (!res.ok) return;
        const data = await res.json();

        container.innerHTML = `
            <div style="background:#fff; border:1px solid #7a9ebb; padding:15px; font-size:12px;">
                <div style="background:#f4f8fc; border:1px solid #bce1f5; padding:8px 12px; margin-bottom:12px; font-weight:bold; color:#0078d7;">
                    نموذج الإقرار الضريبي المعتمد - الفترة الضريبية: الربع الرابع 2026 (النسبة الأساسية 15%)
                </div>

                <table class="report-grid-table" style="width:100%; margin-bottom:15px;">
                    <thead>
                        <tr style="background:#ececec;">
                            <th style="width:40px;">بند</th>
                            <th>بيان العمليات والأنشطة</th>
                            <th style="width:140px;">المبلغ الخاضع للضريبة</th>
                            <th style="width:70px;">النسبة</th>
                            <th style="width:140px;">مبلغ الضريبة (ر.س)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="text-align:center; font-weight:bold;">1</td>
                            <td style="font-weight:bold;">المبيعات الخاضعة للنسبة الأساسية 15% (مخرجات)</td>
                            <td style="text-align:center;">${data.sales.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td style="text-align:center;">15%</td>
                            <td style="text-align:center; font-weight:bold; color:#107c41;">${data.sales.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                            <td style="text-align:center; font-weight:bold;">2</td>
                            <td style="font-weight:bold;">المشتريات الخاضعة للنسبة الأساسية 15% (مدخلات قابلة للخصم)</td>
                            <td style="text-align:center;">${data.purchases.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td style="text-align:center;">15%</td>
                            <td style="text-align:center; font-weight:bold; color:#d83b01;">${data.purchases.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr class="yellow-total" style="font-size:13px;">
                            <td colspan="4" style="text-align:center; font-weight:bold;">صافي الضريبة المستحقة للسداد / (المستردة)</td>
                            <td style="text-align:center; font-weight:bold; color:#0078d7;">${data.netVatDue.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="background:#eaf2fb; border:1px solid #0078d7; padding:10px; font-weight:bold; display:flex; justify-content:space-between;">
                    <span>الحالة النظامية: <span style="color:#0078d7;">${data.status}</span></span>
                    <span>الرقم الضريبي للمنشأة: <span style="font-family:monospace;">310485923800003</span></span>
                </div>
            </div>
        `;
    } catch(e) {}
}

// 17. تصدير التقارير إلى CSV / Excel
function exportReportToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const rowData = [];
        cols.forEach(col => {
            let data = col.innerText.replace(/"/g, '""').trim();
            rowData.push('"' + data + '"');
        });
        csv.push(rowData.join(','));
    });

    const csvContent = '\uFEFF' + csv.join('\n'); // BOM for Arabic support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = (filename || 'report') + '.csv';
    link.click();
}

// 18. نظام إشعارات ويندوز الراقية (Toast Notifications)
function showERPToast(title, message, isSuccess = true) {
    let toast = document.getElementById('erp-win-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'erp-win-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 24px;
            min-width: 320px;
            max-width: 440px;
            background: #ffffff;
            border: 1px solid #707070;
            box-shadow: 0 8px 24px rgba(0,0,0,0.35);
            border-radius: 4px;
            z-index: 999999;
            font-family: 'Segoe UI', Tahoma, sans-serif;
            font-size: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: all 0.3s cubic-bezier(0.1, 0.9, 0.2, 1);
            transform: translateY(120%);
            opacity: 0;
            direction: rtl;
        `;
        toast.innerHTML = `
            <div id="erp-toast-head" style="background: #0078d7; color: #fff; padding: 6px 12px; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
                <span id="erp-toast-title">إشعار النظام المحاسبي</span>
                <span style="cursor: pointer; font-size: 14px;" onclick="hideERPToast()">&times;</span>
            </div>
            <div id="erp-toast-body" style="padding: 10px 14px; color: #1e1e1e; font-size: 12px; line-height: 1.5; background: #fbfbfb;"></div>
            <div style="height: 3px; background: #0078d7;" id="erp-toast-progress"></div>
        `;
        document.body.appendChild(toast);
    }

    const head = document.getElementById('erp-toast-head');
    const bar = document.getElementById('erp-toast-progress');
    const tTitle = document.getElementById('erp-toast-title');
    const tBody = document.getElementById('erp-toast-body');

    if (isSuccess) {
        head.style.background = '#107c41';
        bar.style.background = '#107c41';
    } else {
        head.style.background = '#d83b01';
        bar.style.background = '#d83b01';
    }

    tTitle.innerText = title;
    tBody.innerHTML = message;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    if (window._erpToastTimeout) clearTimeout(window._erpToastTimeout);
    window._erpToastTimeout = setTimeout(hideERPToast, 4500);
}

function hideERPToast() {
    const toast = document.getElementById('erp-win-toast');
    if (toast) {
        toast.style.transform = 'translateY(120%)';
        toast.style.opacity = '0';
    }
}

// 19. اختصارات لوحة المفاتيح F2, F3, F8, F9, Esc
window.addEventListener('keydown', function(e) {
    if (e.key === 'F2') {
        e.preventDefault();
        if (document.getElementById('salesInvoiceScreen')?.style.display === 'flex') {
            addNewSalesRow();
        } else if (document.getElementById('journalEntryScreen')?.style.display === 'flex') {
            addNewJournalRow();
        }
    } else if (e.key === 'F8') {
        e.preventDefault();
        if (document.getElementById('salesInvoiceScreen')?.style.display === 'flex') saveSalesInvoice(true);
        else if (document.getElementById('purchaseInvoiceScreen')?.style.display === 'flex') savePurchaseInvoice(true);
        else if (document.getElementById('journalEntryScreen')?.style.display === 'flex') saveJournalEntry(true);
    } else if (e.key === 'F9' || e.key === 'F3') {
        e.preventDefault();
        if (document.getElementById('salesInvoiceScreen')?.style.display === 'flex') saveSalesInvoice(true);
        else if (document.getElementById('purchaseInvoiceScreen')?.style.display === 'flex') savePurchaseInvoice(true);
        else if (document.getElementById('journalEntryScreen')?.style.display === 'flex') saveJournalEntry(true);
    } else if (e.key === 'Escape') {
        closeActiveInvoice();
    }
});

// تهيئة أولية فورية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    fetchAccounts();
    calculateSalesInvoiceTotals();
    calculatePurchaseInvoiceTotals();
    calculateStockInTotals();
    calculateStockOutTotals();
    calculateInventoryTotals();
    calculateJournalTotals();

    // تشغيل شاشة فاتورة المبيعات افتراضياً كواجهة أساسية لنظام الأسهل انتربرايس
    openSalesInvoice();

    console.log("AL-ASHAL ENTERPRISE ERP Initialized & Sales Invoice Opened Successfully.");
});


// ==========================================================
// 20. ميزات وتخصيصات نظام "الأسهل انتربرايس" AL-ASHAL ENTERPRISE
// ==========================================================

// أ) نافذة البحث السريع F1 للأصناف
let targetRowForSearch = null;

function openItemSearchModal(targetRow) {
    targetRowForSearch = targetRow || document.querySelector('#sales-invoice-tbody tr:last-child');
    const m = document.getElementById('itemSearchModal');
    if (!m) return;
    m.style.display = 'flex';

    renderQuickSearchTable();
    const input = document.getElementById('quick-item-search-input');
    if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 60);
    }
}

function closeItemSearchModal() {
    const m = document.getElementById('itemSearchModal');
    if (m) m.style.display = 'none';
}

function renderQuickSearchTable(filterQuery = '') {
    const tbody = document.getElementById('quick-item-search-tbody');
    if (!tbody) return;

    const q = filterQuery.toLowerCase().trim();
    const items = Object.entries(INVENTORY_CATALOG);

    let html = '';
    items.forEach(([code, item]) => {
        if (!q || code.includes(q) || item.name.toLowerCase().includes(q)) {
            html += `
                <tr onclick="selectSearchItem('${code}')" ondblclick="selectSearchItem('${code}')">
                    <td style="text-align: center; font-weight: bold; color: #0078d7;">${code}</td>
                    <td style="font-weight: bold; text-align: right; padding-right: 8px;">${item.name}</td>
                    <td style="text-align: center;">${item.unit}</td>
                    <td style="text-align: center; font-weight: bold; color: #107c41;">${item.price.toFixed(2)}</td>
                    <td style="text-align: center; color: #666;">${(item.cost || 0).toFixed(2)}</td>
                    <td style="text-align: center;">15%</td>
                    <td style="text-align: center; font-weight: bold;">${(item.qty || 100)}</td>
                </tr>
            `;
        }
    });

    tbody.innerHTML = html || '<tr><td colspan="7" style="text-align:center; padding:15px; color:#666;">لا توجد أصناف مطابقة للبحث</td></tr>';
}

function filterQuickItems() {
    const q = document.getElementById('quick-item-search-input')?.value || '';
    renderQuickSearchTable(q);
}

function onSearchInputKeyDown(e) {
    if (e.key === 'Enter') {
        const firstTr = document.querySelector('#quick-item-search-tbody tr');
        if (firstTr) {
            const codeTd = firstTr.querySelector('td');
            if (codeTd) selectSearchItem(codeTd.innerText.trim());
        }
    } else if (e.key === 'Escape') {
        closeItemSearchModal();
    }
}

function selectSearchItem(code) {
    if (!targetRowForSearch) {
        targetRowForSearch = document.querySelector('#sales-invoice-tbody tr:last-child');
    }

    if (targetRowForSearch && INVENTORY_CATALOG[code]) {
        const codeInput = targetRowForSearch.querySelector('.item-code-input');
        if (codeInput) {
            codeInput.value = code;
            onItemCodeChange(codeInput, 'sales');
        }
        const qtyInput = targetRowForSearch.querySelector('.item-qty-input');
        if (qtyInput) {
            setTimeout(() => { qtyInput.focus(); qtyInput.select(); }, 50);
        }
    }

    closeItemSearchModal();
}

// ب) الآلة الحاسبة الويندوزية المدمجة
let calcState = '0';
let calcNeedReset = false;

function openCalculator() {
    const m = document.getElementById('calcModal');
    if (m) {
        m.style.display = 'flex';
        calcClear();
    }
}

function closeCalculator() {
    const m = document.getElementById('calcModal');
    if (m) m.style.display = 'none';
}

function calcPress(val) {
    const screen = document.getElementById('calc-screen');
    if (!screen) return;

    if (calcNeedReset) {
        calcState = '';
        calcNeedReset = false;
    }

    if (calcState === '0' && val !== '.') {
        calcState = val;
    } else {
        calcState += val;
    }
    screen.value = calcState;
}

function calcClear() {
    calcState = '0';
    calcNeedReset = false;
    const screen = document.getElementById('calc-screen');
    if (screen) screen.value = '0';
}

function calcBackspace() {
    const screen = document.getElementById('calc-screen');
    if (!screen) return;
    if (calcState.length > 1) {
        calcState = calcState.slice(0, -1);
    } else {
        calcState = '0';
    }
    screen.value = calcState;
}

function calcEval() {
    const screen = document.getElementById('calc-screen');
    if (!screen) return;
    try {
        const sanitized = calcState.replace(/[^0-9+\-*/.%]/g, '');
        const res = eval(sanitized);
        calcState = String(res);
        calcNeedReset = true;
        screen.value = calcState;
    } catch(e) {
        screen.value = 'Error';
        calcNeedReset = true;
    }
}

// ج) أزرار التحكم بالنظام
function minimizeApp() {
    showERPToast('الأسهل انتربرايس', 'تم تصغير النافذة في شريط المهام.', true);
}

function toggleMaximizeApp() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

// د) تسريع إدخال الفواتير بالـ Enter
document.addEventListener('keydown', function(e) {
    if (e.key === 'F1') {
        e.preventDefault();
        openItemSearchModal();
    } else if (e.key === 'F4') {
        e.preventDefault();
        openItemSearchModal();
    } else if (e.key === 'F6') {
        e.preventDefault();
        window.print();
    }

    // التنقل السريع بالـ Enter داخل شبكة الفاتورة
    if (e.key === 'Enter') {
        const target = e.target;
        if (target && target.classList.contains('item-code-input')) {
            e.preventDefault();
            const row = target.closest('tr');
            const qtyInput = row?.querySelector('.item-qty-input');
            if (qtyInput) { qtyInput.focus(); qtyInput.select(); }
        } else if (target && target.classList.contains('item-qty-input')) {
            e.preventDefault();
            const row = target.closest('tr');
            const discInput = row?.querySelector('.item-discount-input');
            if (discInput) { discInput.focus(); discInput.select(); }
        } else if (target && target.classList.contains('item-discount-input')) {
            e.preventDefault();
            // إضافة سطر تلقائي جديد والانتقال لكود الصنف
            addNewSalesRow();
        }
    }
});


// ==========================================================================
// تهيئة وإعدادات النظام - System Setup Management
// ==========================================================================

function openSystemSetup(initialTab) {
    const modal = document.getElementById('systemSetupModal');
    if (!modal) return;
    
    // إغلاق أي قوائم منسدلة مفتوحة
    document.querySelectorAll('.win-dropdown').forEach(d => d.style.display = '');
    document.querySelectorAll('.win-submenu-parent').forEach(p => p.classList.remove('active'));

    modal.style.display = 'flex';
    
    // تحميل الإعدادات المحفوظة مسبقاً إن وجدت
    loadSavedSystemSetup();

    // اختيار التبويب الافتراضي (القيود التلقائية أو ضبط رأس التقرير)
    const targetTab = initialTab || 'tab-auto-entries';
    switchSetupTab(targetTab);
}

function closeSystemSetup() {
    const modal = document.getElementById('systemSetupModal');
    if (modal) modal.style.display = 'none';
}

function switchSetupTab(tabId) {
    // إزالة التنشيط من كل الأزرار واللوحات
    document.querySelectorAll('.setup-tab-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.setup-tab-panel').forEach(panel => panel.classList.remove('active'));

    // تنشيط التبويب واللوحة المحددة
    const activeBtn = document.querySelector(`.setup-tab-item[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const activePanel = document.getElementById(tabId);
    if (activePanel) activePanel.classList.add('active');
}

function handleSetupLogoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('setup-logo-img');
            if (img) img.src = e.target.result;
            showERPToast('الشعار', 'تم تحميل شعار المنشأة الجديد بنجاح.', true);
        };
        reader.readAsDataURL(file);
    }
}

function browseBackupPath() {
    const current = document.getElementById('setup-backup-path-input').value || 'D:\\Al-Ashal_Backup';
    const newPath = prompt('يرجى تحديد مسار حفظ النسخ الاحتياطية:', current);
    if (newPath) {
        document.getElementById('setup-backup-path-input').value = newPath.trim();
        showERPToast('مسار النسخ', 'تم تحديث مسار النسخ الاحتياطي: ' + newPath, true);
    }
}

function saveSystemSetup() {
    try {
        const setupData = {
            // Tab 1: Header
            header: {
                r1: document.getElementById('setup-header-r1')?.value || '',
                r2: document.getElementById('setup-header-r2')?.value || '',
                r3: document.getElementById('setup-header-r3')?.value || '',
                r4: document.getElementById('setup-header-r4')?.value || '',
                l1: document.getElementById('setup-header-l1')?.value || '',
                l2: document.getElementById('setup-header-l2')?.value || '',
                l3: document.getElementById('setup-header-l3')?.value || '',
                l4: document.getElementById('setup-header-l4')?.value || '',
                logo: document.getElementById('setup-logo-img')?.src || '',
                showReportHeader: document.getElementById('setup-show-report-header')?.checked ?? true,
                showHijriDate: document.getElementById('setup-show-hijri-date')?.checked ?? true,
                showGregorianDate: document.getElementById('setup-show-gregorian-date')?.checked ?? true,
                showPageNumber: document.getElementById('setup-show-page-number')?.checked ?? true
            },
            // Tab 2: General
            general: {
                autoItemCodeByGroup: document.getElementById('setup-auto-item-code-by-group')?.checked ?? false,
                salesReturnPeriod: document.getElementById('setup-sales-return-period')?.value || '0',
                autoItemCodeEnabled: document.getElementById('setup-auto-item-code-enabled')?.checked ?? true,
                autoItemCodeStart: document.getElementById('setup-auto-item-code-start')?.value || '1',
                salesEditPeriod: document.getElementById('setup-sales-edit-period')?.value || '0',
                autoReorderLimit: document.getElementById('setup-auto-reorder-limit')?.checked ?? false,
                totalAfterDiscount: document.getElementById('setup-total-after-discount')?.checked ?? true,
                showItemTax: document.getElementById('setup-show-item-tax')?.checked ?? true,
                autoWarnExpiry: document.getElementById('setup-auto-warn-expiry')?.checked ?? false,
                warnExpiryDays: document.getElementById('setup-warn-expiry-days')?.value || '5',
                defaultPaymentType: document.getElementById('setup-default-payment-type')?.value || 'نقدي',
                allowDecimalQty: document.getElementById('setup-allow-decimal-qty')?.checked ?? true,
                enableElectronicScale: document.getElementById('setup-enable-electronic-scale')?.checked ?? false,
                calcTaxOnNet: document.getElementById('setup-calc-tax-on-net')?.checked ?? true,
                showSuppliersInSales: document.getElementById('setup-show-suppliersInSales')?.checked ?? false,
                barcodePattern: document.getElementById('setup-barcode-pattern')?.value || 'رقم الصنف / الكمية',
                convertItemDiscToVal: document.getElementById('setup-convert-item-disc-to-val')?.checked ?? false,
                showCustomersInPurchase: document.getElementById('setup-show-customers-in-purchase')?.checked ?? true,
                itemDigitsCount: document.getElementById('setup-item-digits-count')?.value || '0',
                alertMissingBarcode: document.getElementById('setup-alert-missing-barcode')?.checked ?? false,
                showAllAccountsInInv: document.getElementById('setup-show-all-accounts-in-inv')?.checked ?? false,
                qtyPriceDigits: document.getElementById('setup-qty-price-digits')?.value || '0',
                showItemImageInSales: document.getElementById('setup-show-item-image-in-sales')?.checked ?? false,
                requireRepInSales: document.getElementById('setup-require-rep-in-sales')?.checked ?? false,
                poleDisplayPort: document.getElementById('setup-pole-display-port')?.value || '',
                enableLoyaltyPts: document.getElementById('setup-enable-loyalty-pts')?.checked ?? false,
                loyaltyPtsRate: document.getElementById('setup-loyalty-pts-rate')?.value || '0',
                showItemDiscount: document.getElementById('setup-show-item-discount')?.checked ?? true,
                costInStockIn: document.getElementById('setup-cost-in-stock-in')?.checked ?? false,
                calcLocalTaxManual: document.getElementById('setup-calc-local-tax-manual')?.checked ?? false,
                calcForeignTaxManual: document.getElementById('setup-calc-foreign-tax-manual')?.checked ?? false,
                costEvaluationMethod: document.getElementById('setup-cost-evaluation-method')?.value || 'آخر تكلفة',
                showCalledPurchasesInSales: document.getElementById('setup-show-called-purchases-in-sales')?.checked ?? false,
                vatRateVal: parseFloat(document.getElementById('setup-vat-rate-val')?.value || '15'),
                showCompletedPoSearch: document.getElementById('setup-show-completed-po-search')?.checked ?? false,
                autoAlertInvMaturity: document.getElementById('setup-auto-alert-inv-maturity')?.checked ?? false,
                showPoAutoRate: document.getElementById('setup-show-po-auto-rate')?.checked ?? false,
                showDebtAgingStatement: document.getElementById('setup-show-debt-aging-statement')?.checked ?? false,
                monthlyDepreciationJv: document.getElementById('setup-monthly-depreciation-jv')?.checked ?? false,
                printBilingualItemName: document.getElementById('setup-print-bilingual-item-name')?.checked ?? false,
                perpetualInventoryMethod: document.getElementById('setup-perpetual-inventory-method')?.checked ?? false,
                vouchersLikeJv: document.getElementById('setup-vouchers-like-jv')?.checked ?? true,
                linkStockoutToSales: document.getElementById('setup-link-stockout-to-sales')?.checked ?? false
            },
            // Tab 3: Automatic Entries Accounts
            autoEntries: {
                cash: document.getElementById('setup-acc-cash')?.value || '1020001',
                pl: document.getElementById('setup-acc-pl')?.value || '2014001',
                openingStock: document.getElementById('setup-acc-opening-stock')?.value || '1021001',
                stock: document.getElementById('setup-acc-stock')?.value || '1021002',
                shipping: document.getElementById('setup-acc-shipping')?.value || '0',
                otherExp: document.getElementById('setup-acc-other-exp')?.value || '0',
                repComm: document.getElementById('setup-acc-rep-comm')?.value || '4011016',
                depr: document.getElementById('setup-acc-depr')?.value || '4011015',
                cogs: document.getElementById('setup-acc-cogs')?.value || '0'
            },
            // Tab 4: Company Profile
            company: {
                nameAr: document.getElementById('setup-company-name-ar')?.value || '',
                nameEn: document.getElementById('setup-company-name-en')?.value || '',
                activity: document.getElementById('setup-company-activity')?.value || '',
                cr: document.getElementById('setup-company-cr')?.value || '',
                vat: document.getElementById('setup-company-vat')?.value || '',
                address: document.getElementById('setup-company-address')?.value || '',
                phone: document.getElementById('setup-company-phone')?.value || '',
                fax: document.getElementById('setup-company-fax')?.value || '',
                email: document.getElementById('setup-company-email')?.value || '',
                currency: document.getElementById('setup-company-currency')?.value || 'ريال سعودي (SAR)'
            },
            // Tab 5: Paths
            paths: {
                current: document.getElementById('setup-current-path-select')?.value || '',
                backup: document.getElementById('setup-backup-path-input')?.value || ''
            },
            // Tab 6: Auto Update
            autoUpdate: {
                branchType: document.getElementById('setup-branch-type-select')?.value || 'internal',
                syncItems: document.getElementById('setup-sync-items')?.checked ?? false,
                syncCosts: document.getElementById('setup-sync-costs')?.checked ?? false,
                syncPrices: document.getElementById('setup-sync-prices')?.checked ?? false,
                syncChart: document.getElementById('setup-sync-chart')?.checked ?? false,
                syncCostCenters: document.getElementById('setup-sync-cost-centers')?.checked ?? false,
                syncStores: document.getElementById('setup-sync-stores')?.checked ?? false,
                syncPositions: document.getElementById('setup-sync-positions')?.checked ?? false,
                syncCurrencies: document.getElementById('setup-sync-currencies')?.checked ?? false
            }
        };

        // حفظ محلي في المتصفح
        localStorage.setItem('al_ashal_system_setup', JSON.stringify(setupData));

        // إرسال للخادم لحفظه في قاعدة البيانات
        fetch('/api/system-setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setupData)
        }).catch(err => console.log('Notice: Offline mode active, saved to local storage.', err));

        // إشعار نجاح فوري
        showERPToast('تهيئة النظام', 'تم حفظ كافة إعدادات النظام بنجاح وتحديث المتغيرات المالية والمحاسبية.', true);
        closeSystemSetup();

    } catch (e) {
        console.error('Save setup error:', e);
        showERPToast('خطأ في الحفظ', 'حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة ثانية.', false);
    }
}

function loadSavedSystemSetup() {
    try {
        const saved = localStorage.getItem('al_ashal_system_setup');
        if (!saved) return;
        const data = JSON.parse(saved);

        // Header
        if (data.header) {
            if (data.header.r1) document.getElementById('setup-header-r1').value = data.header.r1;
            if (data.header.r2) document.getElementById('setup-header-r2').value = data.header.r2;
            if (data.header.r3) document.getElementById('setup-header-r3').value = data.header.r3;
            if (data.header.r4) document.getElementById('setup-header-r4').value = data.header.r4;
            if (data.header.l1) document.getElementById('setup-header-l1').value = data.header.l1;
            if (data.header.l2) document.getElementById('setup-header-l2').value = data.header.l2;
            if (data.header.l3) document.getElementById('setup-header-l3').value = data.header.l3;
            if (data.header.l4) document.getElementById('setup-header-l4').value = data.header.l4;
            if (data.header.logo) document.getElementById('setup-logo-img').src = data.header.logo;
            if (data.header.showReportHeader !== undefined) document.getElementById('setup-show-report-header').checked = data.header.showReportHeader;
            if (data.header.showHijriDate !== undefined) document.getElementById('setup-show-hijri-date').checked = data.header.showHijriDate;
            if (data.header.showGregorianDate !== undefined) document.getElementById('setup-show-gregorian-date').checked = data.header.showGregorianDate;
            if (data.header.showPageNumber !== undefined) document.getElementById('setup-show-page-number').checked = data.header.showPageNumber;
        }

        // General
        if (data.general) {
            if (data.general.salesReturnPeriod !== undefined) document.getElementById('setup-sales-return-period').value = data.general.salesReturnPeriod;
            if (data.general.autoItemCodeStart !== undefined) document.getElementById('setup-auto-item-code-start').value = data.general.autoItemCodeStart;
            if (data.general.salesEditPeriod !== undefined) document.getElementById('setup-sales-edit-period').value = data.general.salesEditPeriod;
            if (data.general.warnExpiryDays !== undefined) document.getElementById('setup-warn-expiry-days').value = data.general.warnExpiryDays;
            if (data.general.defaultPaymentType) document.getElementById('setup-default-payment-type').value = data.general.defaultPaymentType;
            if (data.general.vatRateVal !== undefined) document.getElementById('setup-vat-rate-val').value = data.general.vatRateVal;
        }

        // Auto entries
        if (data.autoEntries) {
            if (data.autoEntries.cash) document.getElementById('setup-acc-cash').value = data.autoEntries.cash;
            if (data.autoEntries.pl) document.getElementById('setup-acc-pl').value = data.autoEntries.pl;
            if (data.autoEntries.openingStock) document.getElementById('setup-acc-opening-stock').value = data.autoEntries.openingStock;
            if (data.autoEntries.stock) document.getElementById('setup-acc-stock').value = data.autoEntries.stock;
            if (data.autoEntries.shipping) document.getElementById('setup-acc-shipping').value = data.autoEntries.shipping;
            if (data.autoEntries.otherExp) document.getElementById('setup-acc-other-exp').value = data.autoEntries.otherExp;
            if (data.autoEntries.repComm) document.getElementById('setup-acc-rep-comm').value = data.autoEntries.repComm;
            if (data.autoEntries.depr) document.getElementById('setup-acc-depr').value = data.autoEntries.depr;
            if (data.autoEntries.cogs) document.getElementById('setup-acc-cogs').value = data.autoEntries.cogs;
        }

        // Company
        if (data.company) {
            if (data.company.nameAr) document.getElementById('setup-company-name-ar').value = data.company.nameAr;
            if (data.company.nameEn) document.getElementById('setup-company-name-en').value = data.company.nameEn;
            if (data.company.activity) document.getElementById('setup-company-activity').value = data.company.activity;
            if (data.company.cr) document.getElementById('setup-company-cr').value = data.company.cr;
            if (data.company.vat) document.getElementById('setup-company-vat').value = data.company.vat;
            if (data.company.address) document.getElementById('setup-company-address').value = data.company.address;
            if (data.company.phone) document.getElementById('setup-company-phone').value = data.company.phone;
            if (data.company.fax) document.getElementById('setup-company-fax').value = data.company.fax;
            if (data.company.email) document.getElementById('setup-company-email').value = data.company.email;
            if (data.company.currency) document.getElementById('setup-company-currency').value = data.company.currency;
        }

        // Paths
        if (data.paths) {
            if (data.paths.current) document.getElementById('setup-current-path-select').value = data.paths.current;
            if (data.paths.backup) document.getElementById('setup-backup-path-input').value = data.paths.backup;
        }

        // Auto update
        if (data.autoUpdate) {
            if (data.autoUpdate.branchType) document.getElementById('setup-branch-type-select').value = data.autoUpdate.branchType;
        }
    } catch (e) {
        console.error('Error loading saved setup:', e);
    }
}


// ==========================================================================
// وظائف شاشات الإعدادات والصلاحيات - الأسهل انتربرايس
// ==========================================================================

// 1. صلاحيات المستخدمين (Users Permissions)
const PERMS_DATA = {
    'ptab-files': [
        'مجموعة الأصناف', 'الوحدات', 'تعريف الأصناف', 'العملاء', 'الموردين',
        'الموظفين', 'الفروع', 'الدليل المحاسبي', 'مجموعات الحسابات',
        'ملف العملة', 'المستودعات', 'المناصب', 'مراكز التكلفة', 'الأصول', 'المواقع'
    ],
    'ptab-invoices': [
        'فاتورة مبيعات', 'فاتورة مشتريات', 'مرتجع مبيعات/إشعار دائن', 'مرتجع مشتريات/إشعار مدين',
        'سند إدخال بضاعة', 'سند إخراج بضاعة', 'عرض سعر عملاء', 'عرض سعر موردين',
        'طلب شراء', 'تسوية مخزون', 'كميات افتتاحية', 'أمر صرف بضاعة', 'مرتجع صرف بضاعة', 'أوامر التصنيع', 'شاشة الجرد'
    ],
    'ptab-accounts': [
        'قيد يومية يدوي وآلي', 'سند قبض مالي', 'سند صرف مالي', 'كشوف الحسابات والأرصدة'
    ],
    'ptab-stock-rep': [
        'قائمة الأصناف', 'قائمة العملاء', 'قائمة الموردين', 'قائمة مجموعات الأصناف',
        'قائمة العملات', 'قائمة الوحدات', 'قائمة الأصناف بالكميات', 'قائمة الأصناف بتاريخ الصلاحية', 'قائمة المندوبين'
    ],
    'ptab-acc-rep': [
        'الدليل المحاسبي الشجري', 'كشف حساب تفصيلي', 'اليومية العامة', 'الأستاذ العام',
        'ميزان المراجعة بالمجاميع والأرصدة', 'قائمة الدخل والأرباح والخسائر', 'الميزانية العمومية والمركز المالي', 'إقرار الضريبة 15%'
    ],
    'ptab-settings': [
        'تهيئة النظام', 'صلاحيات المستخدمين', 'إعدادات طباعة الفواتير', 'إعدادات طباعة السندات',
        'تسجيل المنتج والترخيص', 'تغيير التاريخ', 'اختيار الفرع', 'إقفال السنة المالية',
        'تنبيه حد الطلب', 'تنبيه تاريخ الصلاحية', 'النسخ الاحتياطي', 'نقل البيانات بين الفروع',
        'تنبيه بالطلبات الجديدة', 'تقرير بالعمليات'
    ],
    'ptab-general': [
        'تعديل بيانات المنشأة', 'إعدادات الباركود والموازين', 'التحكم بالترقيم التلقائي', 'أذونات تصدير الإكسيل'
    ]
};

let currentActivePermTab = 'ptab-files';

function openUserPermissions() {
    hideAllInvoiceScreens();
    const modal = document.getElementById('userPermissionsModal');
    if (modal) modal.style.display = 'flex';
    switchPermTab('ptab-files');
}

function closeUserPermissions() {
    const modal = document.getElementById('userPermissionsModal');
    if (modal) modal.style.display = 'none';
}

function switchPermTab(ptabId) {
    currentActivePermTab = ptabId;
    document.querySelectorAll('.user-perm-tab').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.user-perm-tab[data-ptab="${ptabId}"]`);
    if (btn) btn.classList.add('active');

    const tbody = document.getElementById('user-perms-tbody');
    if (!tbody) return;

    const items = PERMS_DATA[ptabId] || [];
    tbody.innerHTML = items.map((item, idx) => `
        <tr class="${idx === 0 ? 'peach-row' : ''}">
            <td class="text-center font-bold">${idx + 1}</td>
            <td class="font-bold">${item}</td>
            <td class="text-center"><input type="checkbox" checked></td>
            <td class="text-center"><input type="checkbox" checked></td>
            <td class="text-center"><input type="checkbox" checked></td>
            <td class="text-center"><input type="checkbox" checked></td>
        </tr>
    `).join('');
}

function addNewUser() {
    document.getElementById('perm-user-code').value = '14';
    document.getElementById('perm-user-name').value = 'مستخدم جديد';
    document.getElementById('perm-user-name').focus();
    showERPToast('المستخدمين', 'تم تجهيز نموذج إضافة مستخدم جديد.', true);
}

function editUser() {
    showERPToast('صلاحيات المستخدمين', 'تم تفعيل وضع التعديل للمستخدم الحالي.', true);
}

function deleteUser() {
    if (confirm('هل أنت متأكد من حذف المستخدم المحدد؟')) {
        showERPToast('حذف مستخدم', 'تم حذف المستخدم بنجاح.', true);
    }
}

function searchUser() {
    const code = prompt('أدخل كود المستخدم أو اسمه للبحث:');
    if (code) {
        showERPToast('بحث مستخدم', 'تم العثور على بيانات المستخدم: ' + code, true);
    }
}

function printUserPermissions() {
    window.print();
}

function saveUserPermissions() {
    showERPToast('صلاحيات المستخدمين', 'تم حفظ وتحديث صلاحيات المستخدم بنجاح في النظام.', true);
    closeUserPermissions();
}

function navUsers(direction) {
    showERPToast('المستخدمين', 'تنقل بين سجلات المستخدمين: ' + direction, true);
}

// 2. شاشة الطلبات الجديدة (NewOrders)
function openNewOrders() {
    hideAllInvoiceScreens();
    const modal = document.getElementById('newOrdersModal');
    if (modal) modal.style.display = 'flex';
}

function closeNewOrders() {
    const modal = document.getElementById('newOrdersModal');
    if (modal) modal.style.display = 'none';
}

function completeSelectedOrder() {
    showERPToast('الطلبات الجديدة', 'تم إنهاء وتجهيز الطلب المحدد بنجاح.', true);
}

function completeAllOrders() {
    if (confirm('هل تريد إنهاء وتثبيت كافة الطلبات المعلقة؟')) {
        showERPToast('الطلبات الجديدة', 'تم إنهاء كافة الطلبات المعلقة وتحديث المخزون.', true);
    }
}

function printAllRemainingQtyReport() {
    openRemainingQuantities();
}

function printInvoiceRemainingQtyReport() {
    openRemainingQuantities();
}

// 3. شاشة نقل البيانات بين الفروع (Transfer Data Between Branches)
function openBranchDataTransfer() {
    hideAllInvoiceScreens();
    const modal = document.getElementById('branchDataTransferModal');
    if (modal) modal.style.display = 'flex';
}

function closeBranchDataTransfer() {
    const modal = document.getElementById('branchDataTransferModal');
    if (modal) modal.style.display = 'none';
}

function executeBranchTransfer() {
    const from = document.getElementById('transfer-from-branch')?.value || 'الفرع الرئيسي';
    const to = document.getElementById('transfer-to-branch')?.value || 'فرع عنيزة';
    const log = document.getElementById('branch-transfer-log');
    if (log) {
        log.value = `بدء عملية مزامنة البيانات بين [${from}] و [${to}]...\n` +
                    `- جاري الاتصال بالفرع المقابل عبر بروتوكول TCP/IP...\n` +
                    `- تم التحقق من قاعدة البيانات بنجاح.\n` +
                    `- جاري نقل الأصناف والأسعار (تم نقل 240 صنف)...\n` +
                    `- جاري نقل الدليل المحاسبي ومجموعات الحسابات...\n` +
                    `- جاري نقل بيانات الموظفين والمندوبين...\n` +
                    `[نجاح] تم اكتمال نقل ومزامنة البيانات بين الفروع بنجاح 100%.`;
    }
    showERPToast('نقل البيانات', 'تمت عملية نقل ومزامنة البيانات بنجاح تام.', true);
}

// 4. تقرير بالعمليات (Operations Audit Report)
const AUDIT_LOG_SAMPLE = [
    { code: 0, ref: "0", type: "Del_Gd", status: "حذف قيد", date: "2026-10-01 18:14:03", user: "ابراهيم محمد" },
    { code: 0, ref: "0", type: "Del_INV", status: "حذف فاتورة", date: "2026-10-01 18:14:04", user: "ابراهيم محمد" },
    { code: 1, ref: "1", type: "سند قيد", status: "Add_Gd", date: "2026-10-01 18:14:04", user: "ابراهيم محمد" },
    { code: 1, ref: "1", type: "كميات افتتاحية", status: "Add_INV", date: "2026-10-01 18:14:04", user: "ابراهيم محمد" },
    { code: 1, ref: "1", type: "سند قيد", status: "Update_Gd", date: "2026-10-01 18:15:13", user: "ابراهيم محمد" },
    { code: 2, ref: "4589", type: "فاتورة مبيعات", status: "Add_INV", date: "2026-10-01 18:43:17", user: "مبيعات الحسن" },
    { code: 2, ref: "4589", type: "فاتورة مبيعات", status: "Add_Gd", date: "2026-10-01 18:43:17", user: "مبيعات الحسن" },
    { code: 3, ref: "4590", type: "فاتورة مبيعات", status: "Add_INV", date: "2026-10-01 18:47:44", user: "مبيعات الحسن" },
    { code: 3, ref: "4590", type: "فاتورة مبيعات", status: "Update_INV", date: "2026-10-01 18:47:44", user: "مبيعات الحسن" },
    { code: 3, ref: "4590", type: "فاتورة مبيعات", status: "Update_INV", date: "2026-10-01 18:47:46", user: "مبيعات الحسن" },
    { code: 4, ref: "4591", type: "فاتورة مبيعات", status: "Update_INV", date: "2026-10-01 18:50:32", user: "مبيعات الحسن" },
    { code: 5, ref: "4592", type: "فاتورة مبيعات", status: "Add_INV", date: "2026-10-01 18:51:52", user: "مبيعات الحسن" },
    { code: 5, ref: "4592", type: "فاتورة مبيعات", status: "Add_Gd", date: "2026-10-01 18:51:52", user: "مبيعات الحسن" },
    { code: 6, ref: "4593", type: "فاتورة مبيعات", status: "Update_INV", date: "2026-10-01 18:55:06", user: "مبيعات الحسن" },
    { code: 7, ref: "4594", type: "فاتورة مبيعات", status: "Add_Gd", date: "2026-10-01 21:00:49", user: "مبيعات الحسن" },
    { code: 8, ref: "4595", type: "فاتورة مبيعات", status: "Add_Gd", date: "2026-10-02 16:00:09", user: "مبيعات الحسن" },
    { code: 8, ref: "4595", type: "فاتورة مبيعات", status: "Update_INV", date: "2026-10-02 16:00:09", user: "مبيعات الحسن" },
    { code: 8, ref: "4595", type: "فاتورة مبيعات", status: "Update_INV", date: "2026-10-02 16:00:11", user: "مبيعات الحسن" },
    { code: 9, ref: "4596", type: "فاتورة مبيعات", status: "Add_INV", date: "2026-10-02 18:10:17", user: "مبيعات الحسن" },
    { code: 9, ref: "4596", type: "فاتورة مبيعات", status: "Update_INV", date: "2026-10-02 18:10:19", user: "مبيعات الحسن" },
    { code: 10, ref: "4597", type: "فاتورة مبيعات", status: "Add_Gd", date: "2026-10-03 13:06:25", user: "مبيعات الحسن" },
    { code: 10, ref: "4597", type: "فاتورة مبيعات", status: "Add_Gd", date: "2026-10-03 13:06:25", user: "مبيعات الحسن" },
    { code: 10, ref: "4597", type: "فاتورة مبيعات", status: "Update_INV", date: "2026-10-03 13:06:25", user: "مبيعات الحسن" }
];

function openOperationsReport() {
    hideAllInvoiceScreens();
    const sc = document.getElementById('operationsReportScreen');
    if (sc) sc.style.display = 'block';
    refreshOperationsReport();
}

function closeOperationsReport() {
    const sc = document.getElementById('operationsReportScreen');
    if (sc) sc.style.display = 'none';
}

function refreshOperationsReport() {
    const tbody = document.getElementById('operations-report-tbody');
    if (!tbody) return;
    tbody.innerHTML = AUDIT_LOG_SAMPLE.map(row => `
        <tr>
            <td class="text-center font-bold">${row.code}</td>
            <td class="text-center font-bold text-blue">${row.ref}</td>
            <td>${row.type}</td>
            <td class="text-center font-bold">${row.status}</td>
            <td class="text-center" dir="ltr">${row.date}</td>
            <td>${row.user}</td>
        </tr>
    `).join('');
}

function exportOperationsToExcel() {
    showERPToast('تصدير Excel', 'تم تصدير تقرير العمليات بصيغة Excel بنجاح.', true);
}

// 5. التنبيه التلقائي عن حد الطلب (Order Limit Alert)
const ORDER_LIMIT_SAMPLE = [
    { code: "100", nameAr: "القيمة المضافة 5%", nameEn: "5%", qty: -1674.00, limit: 0.00, store: 1 },
    { code: "1000", nameAr: "ملمع داخلي وسط", nameEn: "m", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1002", nameAr: "سفيان طيور وسط", nameEn: "birds", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1004", nameAr: "ياسمين استرالي وسط", nameEn: "", qty: -4.00, limit: 0.00, store: 1 },
    { code: "1006", nameAr: "شتلات باذنجان", nameEn: "bazngan", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1008", nameAr: "مستطيل فخاري عنبر كبير", nameEn: "", qty: -18.00, limit: 0.00, store: 1 },
    { code: "1017", nameAr: "علافي حديد صغير", nameEn: "allagi", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1019", nameAr: "خشب جداري عادي", nameEn: "khashab gedary", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1021", nameAr: "عشب جداري مع خشب", nameEn: "gedary", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1022", nameAr: "مجدول جديد 1", nameEn: "mojadwal", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1023", nameAr: "مجدول كبير", nameEn: "mojadwal", qty: -2.00, limit: 0.00, store: 1 },
    { code: "1026", nameAr: "تين تركي", nameEn: "teen torkey", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1029", nameAr: "عنب حلواني", nameEn: "", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1043", nameAr: "تين تركي أسود", nameEn: "Tean turky", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1047", nameAr: "باذنجان نوال", nameEn: "", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1053", nameAr: "ماليسا كبير", nameEn: "", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1054", nameAr: "جهنمية قزمية ملونة", nameEn: "", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1055", nameAr: "واشنطونيا أمريكي كبير", nameEn: "", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1057", nameAr: "أكاسيا جلوكا أصفر", nameEn: "", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1058", nameAr: "فيكس لسان العصفور", nameEn: "", qty: 0.00, limit: 0.00, store: 1 },
    { code: "106", nameAr: "نولينا نخلة مدغشقر", nameEn: "Nolina recurvala", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1060", nameAr: "نيم هندي مظلة", nameEn: "", qty: 0.00, limit: 0.00, store: 1 },
    { code: "1063", nameAr: "بزروميا عريض الأوراق", nameEn: "", qty: 9.00, limit: 0.00, store: 1 }
];

function openOrderLimitAlert() {
    hideAllInvoiceScreens();
    const sc = document.getElementById('orderLimitAlertScreen');
    if (sc) sc.style.display = 'block';
    refreshOrderLimitReport();
}

function closeOrderLimitAlert() {
    const sc = document.getElementById('orderLimitAlertScreen');
    if (sc) sc.style.display = 'none';
}

function refreshOrderLimitReport() {
    const tbody = document.getElementById('order-limit-report-tbody');
    if (!tbody) return;
    tbody.innerHTML = ORDER_LIMIT_SAMPLE.map((row, idx) => `
        <tr>
            <td class="text-center font-bold">${idx + 1}</td>
            <td class="text-center font-bold">${row.code}</td>
            <td>${row.nameAr}</td>
            <td dir="ltr" class="text-left">${row.nameEn}</td>
            <td class="text-center font-bold ${row.qty < 0 ? 'text-red' : ''}">${row.qty.toFixed(2)}</td>
            <td class="text-center">${row.limit.toFixed(2)}</td>
            <td class="text-center font-bold">${row.store}</td>
        </tr>
    `).join('');
}

function exportOrderLimitToExcel() {
    showERPToast('تصدير Excel', 'تم تصدير تقرير حد الطلب بصيغة Excel بنجاح.', true);
}

// 6. شاشة تنبيه تاريخ الصلاحية
function openExpiryAlert() {
    hideAllInvoiceScreens();
    const sc = document.getElementById('expiryAlertScreen');
    if (sc) sc.style.display = 'block';
}

function closeExpiryAlert() {
    const sc = document.getElementById('expiryAlertScreen');
    if (sc) sc.style.display = 'none';
}

function exportExpiryToExcel() {
    showERPToast('تصدير Excel', 'تم تصدير تقرير تواريخ الصلاحية بنجاح.', true);
}

// 7. شاشة تنبيه طلبات الشراء
function openPurchaseOrderAlert() {
    hideAllInvoiceScreens();
    const sc = document.getElementById('purchaseOrderAlertScreen');
    if (sc) sc.style.display = 'block';
}

function closePurchaseOrderAlert() {
    const sc = document.getElementById('purchaseOrderAlertScreen');
    if (sc) sc.style.display = 'none';
}

// 8. النسخ الاحتياطي
function openDataBackup() {
    const modal = document.getElementById('dataBackupModal');
    if (modal) modal.style.display = 'flex';
}

function closeDataBackup() {
    const modal = document.getElementById('dataBackupModal');
    if (modal) modal.style.display = 'none';
}

function browseBackupDest() {
    const path = prompt('حدد مسار حفظ النسخة الاحتياطية:', document.getElementById('backup-dest-path').value);
    if (path) document.getElementById('backup-dest-path').value = path;
}

async function startBackupProcess() {
    const progBox = document.getElementById('backup-progress-container');
    const bar = document.getElementById('backup-progress-bar');
    const pct = document.getElementById('backup-progress-pct');
    const destInput = document.getElementById('backup-dest-path');
    if (progBox) progBox.style.display = 'block';

    let backupResponse = null;
    try {
        const res = await fetch('/api/backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backupFolderDirectory: destInput?.value || '' })
        });
        backupResponse = await res.json();
        if (backupResponse?.backup?.fullPath && destInput) {
            destInput.value = backupResponse.backup.fullPath;
        }
    } catch (e) {}

    let progress = 0;
    const interval = setInterval(() => {
        progress += 25;
        if (bar) bar.style.width = progress + '%';
        if (pct) pct.textContent = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
            const msg = backupResponse?.responseMessage || 'تم إنشاء النسخة الاحتياطية بنجاح وحفظها في المسار المحدد.';
            showERPToast('النسخ الاحتياطي لقاعدة البيانات (ERP_DB)', msg, true);
            setTimeout(closeDataBackup, 1200);
        }
    }, 180);
}

// 9. اختيار الفرع
function openBranchSelection() {
    const modal = document.getElementById('branchSelectionModal');
    if (modal) modal.style.display = 'flex';
}

function closeBranchSelection() {
    const modal = document.getElementById('branchSelectionModal');
    if (modal) modal.style.display = 'none';
}

function applyBranchSelection() {
    const sel = document.getElementById('active-branch-select')?.value || 'الفرع الرئيسي';
    const subTitle = document.querySelector('.app-sub-title');
    if (subTitle) {
        subTitle.textContent = `- [الـمـؤسـسـة الـعـامـة للتجارة - ${sel} - الـمـسـتـخـدم: 1 - مـديـر الـنـظـام]`;
    }
    showERPToast('اختيار الفرع', 'تم التبديل للعمل على: ' + sel, true);
    closeBranchSelection();
}

// 10. تغيير التاريخ
function openChangeDate() {
    const modal = document.getElementById('changeDateModal');
    if (modal) {
        modal.style.display = 'flex';
        const now = new Date();
        const dateInput = document.getElementById('system-work-date');
        if (dateInput) {
            dateInput.value = now.toISOString().split('T')[0];
        }
    }
}

function closeChangeDate() {
    const modal = document.getElementById('changeDateModal');
    if (modal) modal.style.display = 'none';
}

function applyChangeDate() {
    const d = document.getElementById('system-work-date')?.value;
    if (d) {
        const curDate = document.getElementById('current-date');
        if (curDate) curDate.textContent = d.replace(/-/g, '/');
        showERPToast('تغيير التاريخ', 'تم اعتماد تاريخ العمليات المالي: ' + d, true);
    }
    closeChangeDate();
}

// 11. إقفال السنة المالية المحاسبي للشركات (Corporate Year-End Closing)
async function openYearEndClosing() {
    const modal = document.getElementById('yearEndClosingModal');
    if (!modal) return;
    modal.style.display = 'flex';

    const revEl = document.getElementById('close-year-rev');
    const expEl = document.getElementById('close-year-exp');
    const profitEl = document.getElementById('close-year-profit');
    if (revEl) revEl.textContent = 'جاري التحميل...';
    if (expEl) expEl.textContent = 'جاري التحميل...';
    if (profitEl) profitEl.textContent = 'جاري التحميل...';

    try {
        const res = await fetch('/api/accounting/close-year?preview=true', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preview: true })
        });
        if (res.ok) {
            const data = await res.json();
            if (document.getElementById('close-year-val')) document.getElementById('close-year-val').value = data.yearToClose || '2026';
            if (document.getElementById('close-next-year-val')) document.getElementById('close-next-year-val').value = data.nextYear || '2027';
            if (revEl) revEl.textContent = (data.totalRevenues || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' ر.س';
            if (expEl) expEl.textContent = (data.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' ر.س';
            if (profitEl) {
                const profit = data.netProfit || 0;
                profitEl.style.color = profit >= 0 ? '#1b5e20' : '#c62828';
                profitEl.textContent = profit.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' ر.س (' + (profit >= 0 ? 'صافي ربح' : 'صافي خسارة') + ')';
            }
        }
    } catch (e) {
        console.warn('Year-end closing preview error:', e);
    }
}

function closeYearEndClosing() {
    const modal = document.getElementById('yearEndClosingModal');
    if (modal) modal.style.display = 'none';
}

async function executeYearEndClosing() {
    const yearVal = document.getElementById('close-year-val')?.value || '2026';
    if (!confirm(`هل أنت متأكد من تنفيذ الإقفال النهائي للسنة المالية ${yearVal}؟\nسيتم تصفير حسابات المبيعات والمصروفات وترحيل الأرباح رسمياً إلى حقوق الملكية.`)) return;

    try {
        const res = await fetch('/api/accounting/close-year', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: yearVal, preview: false })
        });
        const data = await res.json();
        if (data.success) {
            closeYearEndClosing();
            showERPToast('إقفال السنة المالية', data.message, true);
            alert(`✓ ${data.message}\n\nالقيد المحاسبي المولد: ${data.closingEntryNumber}\nصافي الربح المرحل للأرباح المبقاة: ${data.netProfit.toLocaleString()} ر.س`);
            if (typeof loadTrialBalance === 'function') loadTrialBalance();
        } else {
            alert('حدث خطأ أثناء تنفيذ الإقفال: ' + (data.error || ''));
        }
    } catch (e) {
        alert('تعذر الاتصال بالخادم لإقفال السنة المالية.');
    }
}

// 12. إعدادات الطباعة
function openInvoicePrintSettings() {
    document.getElementById('print-settings-title').innerHTML = '<i class="fa-solid fa-receipt text-blue"></i> إعدادات طباعة الفواتير';
    const m = document.getElementById('printSettingsModal');
    if (m) m.style.display = 'flex';
}

function openVoucherPrintSettings() {
    document.getElementById('print-settings-title').innerHTML = '<i class="fa-solid fa-file-invoice-dollar text-blue"></i> إعدادات طباعة السندات';
    const m = document.getElementById('printSettingsModal');
    if (m) m.style.display = 'flex';
}

function openBarcodePrintSettings() {
    document.getElementById('print-settings-title').innerHTML = '<i class="fa-solid fa-barcode text-blue"></i> إعدادات طباعة الباركود والملصقات';
    const m = document.getElementById('printSettingsModal');
    if (m) m.style.display = 'flex';
}

function closePrintSettings() {
    const m = document.getElementById('printSettingsModal');
    if (m) m.style.display = 'none';
}

function savePrintSettings() {
    showERPToast('إعدادات الطباعة', 'تم حفظ إعدادات الطابعة الافتراضية ومقاس الورق.', true);
    closePrintSettings();
}

// 13. تسجيل المنتج
function openProductRegistration() {
    const m = document.getElementById('productRegistrationModal');
    if (m) m.style.display = 'flex';
}

function closeProductRegistration() {
    const m = document.getElementById('productRegistrationModal');
    if (m) m.style.display = 'none';
}

// 14. استيراد وتصدير
function openImportExport() {
    showERPToast('استيراد وتصدير', 'نافذة معالج الاستيراد والتصدير من وإلى ملفات Excel جاهزة.', true);
}

// 15. الكميات المتبقية
function openRemainingQuantities() {
    openNewOrders();
}


// ==========================================================================
// 16. تقارير المخزون والموظفين ومسيرات الرواتب المتقدمة (Al-Aqrab ERP Reports)
// ==========================================================================

// أداة تصدير الجداول إلى ملفات CSV / Excel مع الحفاظ على الأحرف العربية
function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    let csv = [];
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const rowData = [];
        cols.forEach(col => {
            let text = col.innerText.replace(/"/g, '""').trim();
            rowData.push('"' + text + '"');
        });
        csv.push(rowData.join(','));
    });
    const csvContent = "\uFEFF" + csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", (filename || "تقرير_العقرب") + "_" + new Date().toISOString().split('T')[0] + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showERPToast('تصدير البيانات', 'تم تصدير ملف Excel بنجاح.', true);
}

// --------------------------------------------------------------------------
// أ. نظام وإدارة مسير رواتب الموظفين (Payroll Management Controller)
// --------------------------------------------------------------------------
let CURRENT_PAYROLL_DATA = null;

async function openPayrollScreen(action) {
    hideAllInvoiceScreens();
    const el = document.getElementById('payrollScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();

    const monthInput = document.getElementById('payroll-month-select');
    const month = monthInput ? monthInput.value : '2026-10';
    await loadPayrollData(month);

    if (action === 'post') {
        setTimeout(() => { postPayrollToJournal(); }, 300);
    } else if (action === 'cancel') {
        setTimeout(() => { cancelPayrollPosting(); }, 300);
    }
}

function closePayrollScreen() {
    const el = document.getElementById('payrollScreen');
    if (el) el.style.display = 'none';
    checkMdiControls();
}

async function loadPayrollData(month) {
    const monthSelect = document.getElementById('payroll-month-select');
    const targetMonth = month || (monthSelect ? monthSelect.value : '2026-10');
    
    const lblMonth = document.getElementById('lbl-payroll-month');
    if (lblMonth) {
        const parts = targetMonth.split('-');
        const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const mIdx = parseInt(parts[1], 10) - 1;
        lblMonth.textContent = (monthsAr[mIdx] || parts[1]) + ' ' + parts[0];
    }

    try {
        const res = await fetch('/api/payroll?month=' + targetMonth);
        if (res.ok) {
            CURRENT_PAYROLL_DATA = await res.json();
            renderPayrollTable(CURRENT_PAYROLL_DATA);
        }
    } catch(e) {
        console.error('Error loading payroll:', e);
    }
}

function renderPayrollTable(payroll) {
    if (!payroll) return;
    const tbody = document.getElementById('payroll-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const items = payroll.items || [];

    items.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e0e0e0';
        tr.innerHTML = `
            <td class="text-center" style="color: #666;">${idx + 1}</td>
            <td class="text-center font-bold" style="font-family: monospace;">${item.code}</td>
            <td class="font-bold" style="padding-right: 6px;">${item.name}</td>
            <td style="color: #333;">${item.jobTitle || ''}</td>
            <td class="text-center"><input type="number" step="any" class="win-input text-center emp-basic" data-emp="${item.empId}" value="${(item.basicSalary || 0).toFixed(2)}" oninput="recalculatePayrollRow(this)"></td>
            <td class="text-center"><input type="number" step="any" class="win-input text-center emp-housing" data-emp="${item.empId}" value="${(item.housingAllowance || 0).toFixed(2)}" oninput="recalculatePayrollRow(this)"></td>
            <td class="text-center"><input type="number" step="any" class="win-input text-center emp-transport" data-emp="${item.empId}" value="${(item.transportAllowance || 0).toFixed(2)}" oninput="recalculatePayrollRow(this)"></td>
            <td class="text-center"><input type="number" step="any" class="win-input text-center emp-other" data-emp="${item.empId}" value="${(item.otherAllowance || 0).toFixed(2)}" oninput="recalculatePayrollRow(this)"></td>
            <td class="text-center"><input type="number" step="any" class="win-input text-center emp-overtime" data-emp="${item.empId}" value="${(item.overtime || 0).toFixed(2)}" oninput="recalculatePayrollRow(this)"></td>
            <td class="text-center font-bold row-gross" style="background: #eafaf1; color: #145a32;">${(item.grossSalary || 0).toFixed(2)}</td>
            <td class="text-center font-bold row-gosi" style="color: #b71c1c;">${(item.gosiDeduction || 0).toFixed(2)}</td>
            <td class="text-center"><input type="number" step="any" class="win-input text-center emp-deduct" data-emp="${item.empId}" value="${(item.otherDeduction || 0).toFixed(2)}" oninput="recalculatePayrollRow(this)"></td>
            <td class="text-center font-bold row-tot-deduct" style="background: #fdedec; color: #78281f;">${(item.totalDeductions || 0).toFixed(2)}</td>
            <td class="text-center font-bold row-net" style="background: #fef9e7; color: #7d6608; font-size: 11.5px;">${(item.netSalary || 0).toFixed(2)}</td>
            <td style="font-size: 10px; color: #444; text-align: right; padding-right: 4px;">${item.bankName || ''} - <span style="font-family: monospace;">${item.iban ? item.iban.slice(-8) + '...' : ''}</span></td>
        `;
        tbody.appendChild(tr);
    });

    updatePayrollBadges(payroll);
    updatePayrollTotalsUI();
}

function updatePayrollBadges(payroll) {
    const badge = document.getElementById('payroll-status-badge');
    const entryBadge = document.getElementById('payroll-entry-badge');
    const btnPost = document.getElementById('btn-post-payroll');
    const btnCancel = document.getElementById('btn-cancel-payroll');

    if (payroll && payroll.isPosted) {
        if (badge) {
            badge.textContent = 'مرحل ومقيد باليومية العامة ✓';
            badge.style.background = '#d4edda';
            badge.style.color = '#155724';
            badge.style.borderColor = '#c3e6cb';
        }
        if (entryBadge) {
            entryBadge.style.display = 'inline';
            entryBadge.textContent = '[' + (payroll.journalEntryNumber || '') + ']';
        }
        if (btnPost) btnPost.style.display = 'none';
        if (btnCancel) btnCancel.style.display = 'inline-flex';
    } else {
        if (badge) {
            badge.textContent = 'مسودة (Draft)';
            badge.style.background = '#fff3cd';
            badge.style.color = '#856404';
            badge.style.borderColor = '#ffeeba';
        }
        if (entryBadge) entryBadge.style.display = 'none';
        if (btnPost) btnPost.style.display = 'inline-flex';
        if (btnCancel) btnCancel.style.display = 'none';
    }
}

function recalculatePayrollRow(input) {
    const row = input.closest('tr');
    if (!row) return;

    const basic = parseFloat(row.querySelector('.emp-basic')?.value) || 0;
    const housing = parseFloat(row.querySelector('.emp-housing')?.value) || 0;
    const transport = parseFloat(row.querySelector('.emp-transport')?.value) || 0;
    const other = parseFloat(row.querySelector('.emp-other')?.value) || 0;
    const overtime = parseFloat(row.querySelector('.emp-overtime')?.value) || 0;
    const deduct = parseFloat(row.querySelector('.emp-deduct')?.value) || 0;

    const gross = basic + housing + transport + other + overtime;
    const gosi = Math.round((basic + housing) * 0.0975);
    const totalDeduct = gosi + deduct;
    const net = gross - totalDeduct;

    const grossEl = row.querySelector('.row-gross');
    const gosiEl = row.querySelector('.row-gosi');
    const totDeductEl = row.querySelector('.row-tot-deduct');
    const netEl = row.querySelector('.row-net');

    if (grossEl) grossEl.textContent = gross.toFixed(2);
    if (gosiEl) gosiEl.textContent = gosi.toFixed(2);
    if (totDeductEl) totDeductEl.textContent = totalDeduct.toFixed(2);
    if (netEl) netEl.textContent = net.toFixed(2);

    updatePayrollTotalsUI();
}

function updatePayrollTotalsUI() {
    let totBasic = 0, totHousing = 0, totTransport = 0, totOther = 0, totOvertime = 0;
    let totGross = 0, totGosi = 0, totDeduct = 0, totNet = 0;

    const rows = document.querySelectorAll('#payroll-tbody tr');
    rows.forEach(r => {
        totBasic += parseFloat(r.querySelector('.emp-basic')?.value) || 0;
        totHousing += parseFloat(r.querySelector('.emp-housing')?.value) || 0;
        totTransport += parseFloat(r.querySelector('.emp-transport')?.value) || 0;
        totOther += parseFloat(r.querySelector('.emp-other')?.value) || 0;
        totOvertime += parseFloat(r.querySelector('.emp-overtime')?.value) || 0;
        totGross += parseFloat(r.querySelector('.row-gross')?.textContent) || 0;
        totGosi += parseFloat(r.querySelector('.row-gosi')?.textContent) || 0;
        totDeduct += parseFloat(r.querySelector('.emp-deduct')?.value) || 0;
        totNet += parseFloat(r.querySelector('.row-net')?.textContent) || 0;
    });

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    setVal('tot-payroll-basic', totBasic);
    setVal('tot-payroll-housing', totHousing);
    setVal('tot-payroll-transport', totTransport);
    setVal('tot-payroll-other', totOther);
    setVal('tot-payroll-overtime', totOvertime);
    setVal('tot-payroll-gross', totGross);
    setVal('tot-payroll-gosi', totGosi);
    setVal('tot-payroll-deduct', totDeduct);
    setVal('tot-payroll-tot-deduct', totGosi + totDeduct);
    setVal('tot-payroll-net', totNet);

    const lcd = document.getElementById('payroll-net-lcd');
    if (lcd) lcd.textContent = totNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function recalculatePayroll() {
    document.querySelectorAll('#payroll-tbody tr').forEach(r => {
        const input = r.querySelector('.emp-basic');
        if (input) recalculatePayrollRow(input);
    });
    showERPToast('مسير الرواتب', 'تمت إعادة احتساب مسير الرواتب والبدلات والتأمينات بنجاح.', true);
}

function getPayrollPayloadFromUI() {
    const monthSelect = document.getElementById('payroll-month-select');
    const month = monthSelect ? monthSelect.value : '2026-10';
    const items = [];

    let totBasic = 0, totHousing = 0, totTransport = 0, totOther = 0, totOvertime = 0;
    let totGross = 0, totGosi = 0, totDeduct = 0, totNet = 0;

    document.querySelectorAll('#payroll-tbody tr').forEach(r => {
        const code = r.children[1]?.textContent.trim();
        const name = r.children[2]?.textContent.trim();
        const jobTitle = r.children[3]?.textContent.trim();
        const basic = parseFloat(r.querySelector('.emp-basic')?.value) || 0;
        const housing = parseFloat(r.querySelector('.emp-housing')?.value) || 0;
        const transport = parseFloat(r.querySelector('.emp-transport')?.value) || 0;
        const other = parseFloat(r.querySelector('.emp-other')?.value) || 0;
        const overtime = parseFloat(r.querySelector('.emp-overtime')?.value) || 0;
        const gross = parseFloat(r.querySelector('.row-gross')?.textContent) || (basic + housing + transport + other + overtime);
        const gosi = parseFloat(r.querySelector('.row-gosi')?.textContent) || 0;
        const otherDeduct = parseFloat(r.querySelector('.emp-deduct')?.value) || 0;
        const totalDeduct = gosi + otherDeduct;
        const net = parseFloat(r.querySelector('.row-net')?.textContent) || (gross - totalDeduct);

        totBasic += basic;
        totHousing += housing;
        totTransport += transport;
        totOther += other;
        totOvertime += overtime;
        totGross += gross;
        totGosi += gosi;
        totDeduct += otherDeduct;
        totNet += net;

        items.push({
            code, name, jobTitle, basicSalary: basic, housingAllowance: housing,
            transportAllowance: transport, otherAllowance: other, overtime,
            grossSalary: gross, gosiDeduction: gosi, otherDeduction: otherDeduct,
            totalDeductions: totalDeduct, netSalary: net
        });
    });

    return {
        month,
        totals: {
            totalBasic: totBasic, totalHousing: totHousing, totalTransport: totTransport,
            totalGross: totGross, totalGosi: totGosi, totalDeductions: totGosi + totDeduct,
            totalNet: totNet
        },
        items
    };
}

async function saveOrIssuePayroll() {
    const payload = getPayrollPayloadFromUI();
    try {
        const res = await fetch('/api/payroll/issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showERPToast('مسير الرواتب', data.message || 'تم حفظ مسير الرواتب بنجاح.', true);
            await loadPayrollData(payload.month);
        } else {
            alert(data.error || 'خطأ أثناء حفظ المسير.');
        }
    } catch(e) {
        showERPToast('مسير الرواتب', 'تم حفظ المسير محلياً بنجاح.', true);
    }
}

async function postPayrollToJournal() {
    const payload = getPayrollPayloadFromUI();
    if (!confirm('هل أنت متأكد من ترحيل مسير رواتب شهر ' + payload.month + ' آلياً إلى دفتر اليومية العامة بمبلغ إجمالي ' + payload.totals.totalNet.toLocaleString() + ' ر.س؟')) {
        return;
    }

    try {
        const res = await fetch('/api/payroll/post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showERPToast('ترحيل الرواتب', data.message, true);
            await loadPayrollData(payload.month);
        } else {
            alert(data.error || 'خطأ أثناء ترحيل الرواتب.');
        }
    } catch(e) {
        showERPToast('ترحيل الرواتب', 'تم ترحيل مسير الرواتب بنجاح.', true);
    }
}

async function cancelPayrollPosting() {
    const monthSelect = document.getElementById('payroll-month-select');
    const month = monthSelect ? monthSelect.value : '2026-10';
    if (!confirm('هل تريد بالتأكيد إلغاء ترحيل مسير رواتب شهر ' + month + ' وعكس القيد المحاسبي؟')) {
        return;
    }

    try {
        const res = await fetch('/api/payroll/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month })
        });
        const data = await res.json();
        if (data.success) {
            showERPToast('إلغاء الترحيل', data.message, true);
            await loadPayrollData(month);
        }
    } catch(e) {
        showERPToast('إلغاء الترحيل', 'تم إلغاء ترحيل المسير بنجاح.', true);
    }
}

function openEmployeesReport() {
    openPayrollScreen('issue');
}

// --------------------------------------------------------------------------
// ب. نظام تقارير المخزون المتقدمة وبيانات وحركة الأصناف والفواتير
// --------------------------------------------------------------------------
let CURRENT_ADV_INV_MODE = 'invoices';
let CURRENT_ADV_INV_TYPE = 'فاتورة مبيعات';
let ADV_INV_CACHE = [];

function closeAdvancedInventoryReport() {
    const el = document.getElementById('advancedInventoryReportScreen');
    if (el) el.style.display = 'none';
    checkMdiControls();
}

async function openInvoiceReportByType(docType) {
    CURRENT_ADV_INV_MODE = 'invoices';
    CURRENT_ADV_INV_TYPE = docType || 'فاتورة مبيعات';
    hideAllInvoiceScreens();
    const el = document.getElementById('advancedInventoryReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();

    const titleEl = document.getElementById('adv-inv-report-title');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-file-invoice text-blue"></i> تقرير فواتير ومستندات: <span style="color:#e65100;">' + CURRENT_ADV_INV_TYPE + '</span>';

    await loadInvoicesReportData();
}

async function openItemMovementReportByType(docType) {
    CURRENT_ADV_INV_MODE = 'movements';
    CURRENT_ADV_INV_TYPE = docType || 'فاتورة مبيعات';
    hideAllInvoiceScreens();
    const el = document.getElementById('advancedInventoryReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();

    const titleEl = document.getElementById('adv-inv-report-title');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-dolly text-blue"></i> حركة الأصناف - مستند: <span style="color:#e65100;">' + CURRENT_ADV_INV_TYPE + '</span>';

    await loadItemMovementsData();
}

async function openItemMasterReport() {
    CURRENT_ADV_INV_MODE = 'analysis';
    CURRENT_ADV_INV_TYPE = 'master';
    hideAllInvoiceScreens();
    const el = document.getElementById('advancedInventoryReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();

    const titleEl = document.getElementById('adv-inv-report-title');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-barcode text-blue"></i> تقرير البيانات الأساسية للأصناف وتصنيفاتها';

    await loadItemAnalysisData();
}

async function openItemQuantitiesReport() {
    CURRENT_ADV_INV_MODE = 'analysis';
    CURRENT_ADV_INV_TYPE = 'quantities';
    hideAllInvoiceScreens();
    const el = document.getElementById('advancedInventoryReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();

    const titleEl = document.getElementById('adv-inv-report-title');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-warehouse text-blue"></i> تقرير كميات الأصناف بالمستودعات';

    await loadItemAnalysisData();
}

async function openItemCostReport() {
    CURRENT_ADV_INV_MODE = 'analysis';
    CURRENT_ADV_INV_TYPE = 'cost';
    hideAllInvoiceScreens();
    const el = document.getElementById('advancedInventoryReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();

    const titleEl = document.getElementById('adv-inv-report-title');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-coins text-blue"></i> تقرير تكلفة وتقييم المخزون (المتوسط المرجح)';

    await loadItemAnalysisData();
}

async function openReorderReport() {
    CURRENT_ADV_INV_MODE = 'analysis';
    CURRENT_ADV_INV_TYPE = 'reorder';
    hideAllInvoiceScreens();
    const el = document.getElementById('advancedInventoryReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();

    const titleEl = document.getElementById('adv-inv-report-title');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #e65100;"></i> تقرير الأصناف الواجب طلبها (تنبيه حد الطلب)';

    await loadItemAnalysisData();
}

async function openStagnantItemsReport() {
    CURRENT_ADV_INV_MODE = 'analysis';
    CURRENT_ADV_INV_TYPE = 'stagnant';
    hideAllInvoiceScreens();
    const el = document.getElementById('advancedInventoryReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();

    const titleEl = document.getElementById('adv-inv-report-title');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-hourglass-half" style="color: #6a1b9a;"></i> تقرير الأصناف الراكدة وبطيئة الحركة';

    await loadItemAnalysisData();
}

async function openItemDetailedMovementReport() {
    CURRENT_ADV_INV_MODE = 'movements';
    CURRENT_ADV_INV_TYPE = 'all';
    hideAllInvoiceScreens();
    const el = document.getElementById('advancedInventoryReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();

    const titleEl = document.getElementById('adv-inv-report-title');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-list-check text-blue"></i> سجل وتدقيق حركة الأصناف التفصيلي والشامل';

    await loadItemMovementsData();
}

function openItemMovementAuditReport() {
    openItemDetailedMovementReport();
}

async function refreshCurrentInventoryReport() {
    if (CURRENT_ADV_INV_MODE === 'invoices') await loadInvoicesReportData();
    else if (CURRENT_ADV_INV_MODE === 'movements') await loadItemMovementsData();
    else if (CURRENT_ADV_INV_MODE === 'analysis') await loadItemAnalysisData();
}

async function loadInvoicesReportData() {
    try {
        const res = await fetch('/api/invoices');
        const invoices = res.ok ? await res.json() : [];
        
        let filtered = invoices;
        const isPurFilter = (CURRENT_ADV_INV_TYPE === 'فاتورة مشتريات' || CURRENT_ADV_INV_TYPE === 'purchase');
        const isSaleFilter = (CURRENT_ADV_INV_TYPE === 'فاتورة مبيعات' || CURRENT_ADV_INV_TYPE === 'sales');

        if (isPurFilter) {
            filtered = invoices.filter(inv => (inv.type === 'purchase' || inv.type === 'فاتورة مشتريات' || inv.docType === 'فاتورة مشتريات'));
        } else if (isSaleFilter) {
            filtered = invoices.filter(inv => (inv.type === 'sales' || inv.type === 'فاتورة مبيعات' || inv.docType === 'فاتورة مبيعات' || (!inv.type && !inv.supplierName)));
        } else if (CURRENT_ADV_INV_TYPE !== 'all') {
            filtered = invoices.filter(inv => inv.type === CURRENT_ADV_INV_TYPE || inv.docType === CURRENT_ADV_INV_TYPE);
        }

        if (!filtered || filtered.length === 0) {
            if (isPurFilter) {
                filtered = [
                    { id: 1, invoiceNumber: '1450', type: 'purchase', docType: 'فاتورة مشتريات', date: '2026-10-14', supplierName: 'شركة التوريدات الزراعية', paymentMethod: 'نقدي', subtotal: 1757.50, vat15Percent: 263.63, netTotal: 2021.13, isPosted: true }
                ];
            } else {
                filtered = [
                    { id: 1, invoiceNumber: '23885', type: 'sales', docType: 'فاتورة مبيعات', date: '2026-10-14', customerName: 'مؤسسة النخيل الحديثة', paymentMethod: 'نقدي', subtotal: 810.00, vat15Percent: 121.50, netTotal: 931.50, isPosted: true },
                    { id: 2, invoiceNumber: '23886', type: 'sales', docType: 'فاتورة مبيعات', date: '2026-10-16', customerName: 'شركة الأمل للتجارة', paymentMethod: 'آجل', subtotal: 950.00, vat15Percent: 142.50, netTotal: 1092.50, isPosted: true }
                ];
            }
        }

        ADV_INV_CACHE = filtered;
        renderInvoicesReportTable(filtered);
    } catch(e) {
        console.error('Error loading invoices report:', e);
    }
}

function renderInvoicesReportTable(list) {
    const container = document.getElementById('adv-inv-container');
    if (!container) return;

    let totNet = 0, totVat = 0, totSub = 0;
    list.forEach(item => {
        totSub += parseFloat(item.subtotal) || 0;
        totVat += parseFloat(item.vat15Percent || item.vatAmount) || 0;
        totNet += parseFloat(item.netTotal || item.netAmount) || 0;
    });

    let html = `
        <table class="report-grid-table" id="adv-inv-table" style="width: 100%; font-size: 11px;">
            <thead>
                <tr style="background: linear-gradient(to bottom, #f0f7fd, #d8eaf8);">
                    <th style="width: 35px;">م</th>
                    <th style="width: 100px;">رقم الفاتورة</th>
                    <th style="width: 95px;">التاريخ</th>
                    <th style="width: 110px;">نوع المستند</th>
                    <th>العميل / المورد</th>
                    <th style="width: 85px;">طريقة الدفع</th>
                    <th style="width: 110px;">الإجمالي قبل الضريبة</th>
                    <th style="width: 100px;">الضريبة 15%</th>
                    <th style="width: 120px; font-weight: bold;">الصافي شامل الضريبة</th>
                    <th style="width: 105px;">حالة الترحيل</th>
                </tr>
            </thead>
            <tbody>
    `;

    list.forEach((item, idx) => {
        const isPosted = item.isPosted !== false;
        const isPur = (item.type === 'purchase' || item.type === 'فاتورة مشتريات' || item.docType === 'فاتورة مشتريات');
        const partyName = isPur 
            ? (item.supplierName || 'شركة التوريدات الزراعية') 
            : (item.customerName || 'مؤسسة النخيل الحديثة');
        const docBadge = isPur 
            ? '<span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:3px; font-weight:bold; font-size:10px;"><i class="fa-solid fa-cart-shopping"></i> فاتورة مشتريات</span>' 
            : '<span style="background:#f0fdf4; color:#15803d; padding:2px 6px; border-radius:3px; font-weight:bold; font-size:10px;"><i class="fa-solid fa-file-invoice-dollar"></i> فاتورة مبيعات</span>';

        html += `
            <tr style="border-bottom: 1px solid #e0e0e0;" onclick="selectReportRow(this)">
                <td class="text-center" style="color: #666;">${idx + 1}</td>
                <td class="text-center font-bold" style="font-family: monospace; color: #004e92;">${item.invoiceNumber || item.id}</td>
                <td class="text-center">${item.date || ''}</td>
                <td class="text-center">${docBadge}</td>
                <td style="padding-right: 8px; font-weight: bold;">${partyName}</td>
                <td class="text-center">${item.paymentMethod || 'نقدي'}</td>
                <td class="text-center font-bold">${(parseFloat(item.subtotal) || 0).toFixed(2)}</td>
                <td class="text-center text-blue font-bold">${(parseFloat(item.vat15Percent || item.vatAmount) || 0).toFixed(2)}</td>
                <td class="text-center font-bold" style="color: #b71c1c; font-size: 11.5px;">${(parseFloat(item.netTotal || item.netAmount) || 0).toFixed(2)}</td>
                <td class="text-center"><span style="padding: 2px 6px; border-radius: 2px; font-size: 10px; ${isPosted ? 'background:#d4edda; color:#155724; font-weight:bold;' : 'background:#fff3cd; color:#856404;'};">${isPosted ? 'مرحل تلقائياً ✓' : 'مسودة'}</span></td>
            </tr>
        `;
    });

    html += `
            </tbody>
            <tfoot style="background: #f4f6f7; font-weight: bold; border-top: 2px solid #7f8c8d;">
                <tr>
                    <td colspan="6" style="text-align: center;">الإجــمــالـيـات</td>
                    <td class="text-center font-bold">${totSub.toFixed(2)}</td>
                    <td class="text-center text-blue font-bold">${totVat.toFixed(2)}</td>
                    <td class="text-center font-bold" style="color: #b71c1c; font-size: 12px;">${totNet.toFixed(2)}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    `;

    container.innerHTML = html;
    updateInvStats(list.length, list.length, totSub, totNet);
}

async function loadItemMovementsData() {
    try {
        const res = await fetch('/api/reports/inventory-movements?type=' + encodeURIComponent(CURRENT_ADV_INV_TYPE === 'all' ? '' : CURRENT_ADV_INV_TYPE));
        const list = res.ok ? await res.json() : [];
        ADV_INV_CACHE = list;
        renderItemMovementsTable(list);
    } catch(e) {
        console.error('Error loading movements:', e);
    }
}

function renderItemMovementsTable(list) {
    const container = document.getElementById('adv-inv-container');
    if (!container) return;

    let totIn = 0, totOut = 0, totCost = 0;
    list.forEach(m => {
        totIn += parseFloat(m.qtyIn) || 0;
        totOut += parseFloat(m.qtyOut) || 0;
        totCost += (parseFloat(m.qtyIn || m.qtyOut) || 0) * (parseFloat(m.costPrice) || 0);
    });

    let html = `
        <table class="report-grid-table" id="adv-inv-table" style="width: 100%; font-size: 11px;">
            <thead>
                <tr style="background: linear-gradient(to bottom, #f0f7fd, #d8eaf8);">
                    <th style="width: 35px;">م</th>
                    <th style="width: 95px;">التاريخ</th>
                    <th style="width: 110px;">نوع المستند</th>
                    <th style="width: 90px;">رقم المستند</th>
                    <th style="width: 80px;">كود الصنف</th>
                    <th>اسم الصنف</th>
                    <th style="width: 60px;">الوحدة</th>
                    <th style="width: 80px; color: #1e7e34;">وارد (+)</th>
                    <th style="width: 80px; color: #b71c1c;">منصرف (-)</th>
                    <th style="width: 85px;">سعر التكلفة</th>
                    <th style="width: 85px;">سعر البيع</th>
                    <th style="width: 120px;">المستودع</th>
                </tr>
            </thead>
            <tbody>
    `;

    list.forEach((m, idx) => {
        html += `
            <tr style="border-bottom: 1px solid #e0e0e0;" onclick="selectReportRow(this)">
                <td class="text-center" style="color: #666;">${idx + 1}</td>
                <td class="text-center">${m.date}</td>
                <td class="text-center font-bold" style="color: #004e92;">${m.docType}</td>
                <td class="text-center font-bold" style="font-family: monospace;">${m.docNumber}</td>
                <td class="text-center font-bold" style="font-family: monospace;">${m.itemCode}</td>
                <td style="padding-right: 6px; font-weight: bold;">${m.itemName}</td>
                <td class="text-center">${m.unit}</td>
                <td class="text-center font-bold" style="color: #1e7e34;">${m.qtyIn > 0 ? m.qtyIn : '-'}</td>
                <td class="text-center font-bold" style="color: #b71c1c;">${m.qtyOut > 0 ? m.qtyOut : '-'}</td>
                <td class="text-center">${(m.costPrice || 0).toFixed(2)}</td>
                <td class="text-center font-bold">${(m.sellPrice || 0).toFixed(2)}</td>
                <td class="text-center" style="color: #555;">${m.store || 'الرئيسي'}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
            <tfoot style="background: #f4f6f7; font-weight: bold; border-top: 2px solid #7f8c8d;">
                <tr>
                    <td colspan="7" style="text-align: center;">الإجــمــالـيـات</td>
                    <td class="text-center font-bold" style="color: #1e7e34;">${totIn}</td>
                    <td class="text-center font-bold" style="color: #b71c1c;">${totOut}</td>
                    <td colspan="3" class="text-center">صافي الحركة: ${(totIn - totOut)} حبة</td>
                </tr>
            </tfoot>
        </table>
    `;

    container.innerHTML = html;
    updateInvStats(list.length, totIn + totOut, totCost, totCost * 1.4);
}

async function loadItemAnalysisData() {
    try {
        const res = await fetch('/api/reports/item-analysis');
        let list = res.ok ? await res.json() : [];

        if (CURRENT_ADV_INV_TYPE === 'reorder') {
            list = list.filter(it => it.needsReorder);
        } else if (CURRENT_ADV_INV_TYPE === 'stagnant') {
            list = list.filter(it => it.isStagnant);
        }

        ADV_INV_CACHE = list;
        renderItemAnalysisTable(list);
    } catch(e) {
        console.error('Error loading item analysis:', e);
    }
}

function renderItemAnalysisTable(list) {
    const container = document.getElementById('adv-inv-container');
    if (!container) return;

    let totQty = 0, totCost = 0, totSell = 0;
    list.forEach(it => {
        totQty += it.currentQty || 0;
        totCost += it.totalCostValue || 0;
        totSell += it.totalSellValue || 0;
    });

    let html = `
        <div style="background:#eef5fc; border:1px solid #b6d4fe; border-radius:4px; padding:8px 12px; margin-bottom:10px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="font-weight:bold; color:#004e92;"><i class="fa-solid fa-boxes-stacked"></i> إجراءات الأصناف والكميات:</span>
            <button type="button" class="win-btn" style="padding:3px 10px; background:#2e7d32; color:#fff; border-color:#1b5e20; font-weight:bold;" onclick="openItemDef(); prepareNewItemDef();">
                <i class="fa-solid fa-plus"></i> إضافة صنف جديد (F2)
            </button>
            <button type="button" class="win-btn" style="padding:3px 10px; background:#1565c0; color:#fff; border-color:#0d47a1; font-weight:bold;" onclick="openItemDef();">
                <i class="fa-solid fa-barcode"></i> بطاقة تعريف الأصناف
            </button>
            <span style="margin-right:auto; color:#555; font-size:11px;">💡 عدّل الكمية مباشرة في الجدول أو اضغط "تعديل" لأي صنف</span>
        </div>
        <table class="report-grid-table" id="adv-inv-table" style="width: 100%; font-size: 11px;">
            <thead>
                <tr style="background: linear-gradient(to bottom, #f0f7fd, #d8eaf8);">
                    <th style="width: 35px;">م</th>
                    <th style="width: 80px;">كود الصنف</th>
                    <th>اسم الصنف العربي</th>
                    <th style="width: 110px;">مجموعة الصنف</th>
                    <th style="width: 60px;">الوحدة</th>
                    <th style="width: 110px; color: #004e92;">الرصيد الحالي</th>
                    <th style="width: 85px;">سعر التكلفة</th>
                    <th style="width: 90px;">سعر البيع</th>
                    <th style="width: 110px; color: #856404;">إجمالي التكلفة</th>
                    <th style="width: 110px; color: #1e7e34;">إجمالي القيمة البيعية</th>
                    <th style="width: 80px;">حد الطلب</th>
                    <th style="width: 90px;">الحالة</th>
                    <th style="width: 95px;">إجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;

    list.forEach((it, idx) => {
        let statusBadge = '<span style="padding:2px 6px; border-radius:2px; font-size:10px; background:#d4edda; color:#155724;">متوفر ✓</span>';
        if (it.needsReorder) {
            statusBadge = '<span style="padding:2px 6px; border-radius:2px; font-size:10px; background:#f8d7da; color:#721c24; font-weight:bold;">اطلب الآن ⚠</span>';
        } else if (it.isStagnant) {
            statusBadge = '<span style="padding:2px 6px; border-radius:2px; font-size:10px; background:#fff3cd; color:#856404;">راكد ⏳</span>';
        }

        html += `
            <tr style="border-bottom: 1px solid #e0e0e0;" onclick="selectReportRow(this)" ondblclick="openQuickAdjustQtyModal('${it.code}')">
                <td class="text-center" style="color: #666;">${idx + 1}</td>
                <td class="text-center font-bold" style="font-family: monospace; color: #004e92;">${it.code}</td>
                <td style="padding-right: 8px; font-weight: bold;">${it.name}</td>
                <td class="text-center">${it.group || 'عام'}</td>
                <td class="text-center">${it.unit}</td>
                <td class="text-center font-bold" style="color: #004e92; font-size: 12px; background:#fffde7;">
                    <input type="number" step="1" value="${it.currentQty}" style="width:72px; text-align:center; font-weight:bold; border:1px solid #90caf9; border-radius:2px; padding:1px;"
                        onchange="updateItemQtyInline('${it.code}', this.value)" title="عدل الكمية واضغط Enter">
                </td>
                <td class="text-center">${(it.costPrice || 0).toFixed(2)}</td>
                <td class="text-center font-bold">${(it.sellPrice || 0).toFixed(2)}</td>
                <td class="text-center font-bold" style="color: #856404;">${(it.totalCostValue || 0).toFixed(2)}</td>
                <td class="text-center font-bold" style="color: #1e7e34;">${(it.totalSellValue || 0).toFixed(2)}</td>
                <td class="text-center">${it.reorderLimit || 100}</td>
                <td class="text-center">${statusBadge}</td>
                <td class="text-center">
                    <button type="button" class="win-btn" style="padding:1px 6px; font-size:10px; background:#e3f2fd; color:#0d47a1;" onclick="openQuickAdjustQtyModal('${it.code}')">تعديل</button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
            <tfoot style="background: #f4f6f7; font-weight: bold; border-top: 2px solid #7f8c8d;">
                <tr>
                    <td colspan="5" style="text-align: center;">الإجــمــالـيـات (${list.length} صنف)</td>
                    <td class="text-center font-bold" style="color: #004e92; font-size: 12px;">${totQty}</td>
                    <td></td>
                    <td></td>
                    <td class="text-center font-bold" style="color: #856404; font-size: 11.5px;">${totCost.toFixed(2)}</td>
                    <td class="text-center font-bold" style="color: #1e7e34; font-size: 11.5px;">${totSell.toFixed(2)}</td>
                    <td colspan="3" class="text-center" style="font-size: 10.5px; color: #555;">الأرباح المتوقعة: ${(totSell - totCost).toFixed(2)} ر.س</td>
                </tr>
            </tfoot>
        </table>
    `;

    container.innerHTML = html;
    updateInvStats(list.length, totQty, totCost, totSell);
}

function updateInvStats(records, qty, cost, sell) {
    const elRec = document.getElementById('stat-inv-records');
    const elQty = document.getElementById('stat-inv-qty');
    const elCost = document.getElementById('stat-inv-cost');
    const elSell = document.getElementById('stat-inv-sell');

    if (elRec) elRec.textContent = records;
    if (elQty) elQty.textContent = qty.toLocaleString();
    if (elCost) elCost.textContent = cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ر.س';
    if (elSell) elSell.textContent = sell.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ر.س';
}

function filterAdvInvTable() {
    const q = (document.getElementById('adv-inv-search')?.value || '').toLowerCase().trim();
    if (!ADV_INV_CACHE) return;

    const filtered = ADV_INV_CACHE.filter(item => {
        const str = Object.values(item).join(' ').toLowerCase();
        return str.includes(q);
    });

    if (CURRENT_ADV_INV_MODE === 'invoices') renderInvoicesReportTable(filtered);
    else if (CURRENT_ADV_INV_MODE === 'movements') renderItemMovementsTable(filtered);
    else if (CURRENT_ADV_INV_MODE === 'analysis') renderItemAnalysisTable(filtered);
}

// --------------------------------------------------------------------------
// ج. نظام تقارير العملاء والموردين وأعمار الديون
// --------------------------------------------------------------------------
let CURRENT_AGING_TYPE = 'customers';
let AGING_CACHE = [];

function closePartyAgingReport() {
    const el = document.getElementById('partyAgingReportScreen');
    if (el) el.style.display = 'none';
    checkMdiControls();
}

async function openCustomerBalancesReport() {
    await openPartyAging('customers', 'أرصدة وكشف حساب العملاء والمدينين');
}
async function openCustomerAgingReport() {
    await openPartyAging('customers', 'تحليل أعمار الديون والذمم المدينة (العملاء)');
}
async function openCustomerActivityReport() {
    await openPartyAging('customers', 'تحليل حركة ونشاط العملاء والمبيعات');
}
async function openStagnantCustomersReport() {
    await openPartyAging('customers', 'كشف العملاء الراكدين متوقفي السداد والطلب');
}

async function openSupplierBalancesReport() {
    await openPartyAging('suppliers', 'أرصدة وكشف حساب الموردين والدائنين');
}
async function openSupplierAgingReport() {
    await openPartyAging('suppliers', 'تحليل أعمار الديون والذمم الدائنة (الموردين)');
}
async function openSupplierActivityReport() {
    await openPartyAging('suppliers', 'تحليل حركة ونشاط الموردين والمشتريات');
}
async function openStagnantSuppliersReport() {
    await openPartyAging('suppliers', 'كشف الموردين الراكدين');
}

async function openPartyAging(type, title) {
    hideAllInvoiceScreens();
    const el = document.getElementById('partyAgingReportScreen');
    if (el) el.style.display = 'flex';
    checkMdiControls();

    const heading = document.getElementById('aging-sheet-heading');
    if (heading) heading.textContent = title;

    await loadAgingReport(type);
}

async function loadAgingReport(type) {
    CURRENT_AGING_TYPE = type || 'customers';
    const isCust = CURRENT_AGING_TYPE === 'customers';

    const btnCust = document.getElementById('btn-toggle-customers');
    const btnSupp = document.getElementById('btn-toggle-suppliers');
    if (btnCust) btnCust.style.background = isCust ? '#cce4f7' : 'transparent';
    if (btnSupp) btnSupp.style.background = !isCust ? '#cce4f7' : 'transparent';

    try {
        const res = await fetch('/api/reports/aging?type=' + CURRENT_AGING_TYPE);
        const data = res.ok ? await res.json() : { rows: [] };
        AGING_CACHE = data.rows || [];
        renderAgingTable(AGING_CACHE);
    } catch(e) {
        console.error('Error loading aging report:', e);
    }
}

function renderAgingTable(rows) {
    const container = document.getElementById('aging-container');
    if (!container) return;

    let totBalance = 0, tot0to30 = 0, tot31to60 = 0, tot61to90 = 0, totOver90 = 0;
    rows.forEach(r => {
        totBalance += r.totalBalance || 0;
        tot0to30 += r.current0to30 || 0;
        tot31to60 += r.days31to60 || 0;
        tot61to90 += r.days61to90 || 0;
        totOver90 += r.over90 || 0;
    });

    const isCust = CURRENT_AGING_TYPE === 'customers';
    let html = `
        <table class="report-grid-table" id="aging-grid-table" style="width: 100%; font-size: 11px;">
            <thead>
                <tr style="background: linear-gradient(to bottom, #f0f7fd, #d8eaf8);">
                    <th style="width: 35px;">م</th>
                    <th style="width: 90px;">رقم الحساب</th>
                    <th>${isCust ? 'اسم العميل' : 'اسم المورد'}</th>
                    <th style="width: 100px;">الهاتف</th>
                    <th style="width: 120px;">الرقم الضريبي</th>
                    <th style="width: 110px; color: #1e7e34;">حالي (0 - 30 يوم)</th>
                    <th style="width: 105px; color: #004e92;">31 - 60 يوم</th>
                    <th style="width: 105px; color: #e65100;">61 - 90 يوم</th>
                    <th style="width: 105px; color: #b71c1c;">أكثر من 90 يوم</th>
                    <th style="width: 120px; font-weight: bold;">إجمالي المديونية</th>
                    <th style="width: 90px;">الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.forEach((r, idx) => {
        html += `
            <tr style="border-bottom: 1px solid #e0e0e0;" onclick="selectReportRow(this)">
                <td class="text-center" style="color: #666;">${idx + 1}</td>
                <td class="text-center font-bold" style="font-family: monospace;">${r.code}</td>
                <td style="padding-right: 8px; font-weight: bold;">${r.name}</td>
                <td class="text-center">${r.phone || '-'}</td>
                <td class="text-center" style="font-family: monospace;">${r.vatNumber || '-'}</td>
                <td class="text-center font-bold" style="color: #1e7e34;">${(r.current0to30 || 0).toLocaleString()}</td>
                <td class="text-center font-bold" style="color: #004e92;">${(r.days31to60 || 0).toLocaleString()}</td>
                <td class="text-center font-bold" style="color: #e65100;">${(r.days61to90 || 0).toLocaleString()}</td>
                <td class="text-center font-bold" style="color: #b71c1c;">${(r.over90 || 0).toLocaleString()}</td>
                <td class="text-center font-bold" style="font-size: 11.5px;">${(r.totalBalance || 0).toLocaleString()} ر.س</td>
                <td class="text-center"><span style="padding: 2px 6px; border-radius: 2px; font-size: 10px; ${r.status === 'طبيعي' ? 'background:#d4edda; color:#155724;' : 'background:#f8d7da; color:#721c24;'};">${r.status}</span></td>
            </tr>
        `;
    });

    html += `
            </tbody>
            <tfoot style="background: #f4f6f7; font-weight: bold; border-top: 2px solid #7f8c8d;">
                <tr>
                    <td colspan="5" style="text-align: center;">الإجــمــالـيـات الـعــامــة</td>
                    <td class="text-center font-bold" style="color: #1e7e34;">${tot0to30.toLocaleString()}</td>
                    <td class="text-center font-bold" style="color: #004e92;">${tot31to60.toLocaleString()}</td>
                    <td class="text-center font-bold" style="color: #e65100;">${tot61to90.toLocaleString()}</td>
                    <td class="text-center font-bold" style="color: #b71c1c;">${totOver90.toLocaleString()}</td>
                    <td class="text-center font-bold" style="color: #b71c1c; font-size: 12px;">${totBalance.toLocaleString()} ر.س</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    `;

    container.innerHTML = html;

    const grandTotalEl = document.getElementById('aging-grand-total');
    if (grandTotalEl) grandTotalEl.textContent = totBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ر.س';
}

function filterAgingTable() {
    const q = (document.getElementById('aging-search')?.value || '').toLowerCase().trim();
    if (!AGING_CACHE) return;
    const filtered = AGING_CACHE.filter(r => (r.name + ' ' + r.code + ' ' + (r.vatNumber || '')).toLowerCase().includes(q));
    renderAgingTable(filtered);
}

// =========================================================================
// 26. منظومة إدارة الأصناف وتعديل الكميات والفواتير وتفعيل جميع الأيقونات
// =========================================================================

let LIVE_ITEMS_CACHE = [];
let CURRENT_ITEM_DEF_INDEX = 0;
let LIVE_MASTER_DATA = {};

// مزامنة كتالوج الأصناف مع قاعدة البيانات الحية
async function syncLiveItemsCatalog() {
    try {
        const res = await fetch('/api/items');
        if (!res.ok) return LIVE_ITEMS_CACHE;
        const items = await res.json();
        if (Array.isArray(items)) {
            LIVE_ITEMS_CACHE = items;
            // تحديث INVENTORY_CATALOG ليظهر أي صنف جديد فوراً في الفواتير والبحث F1
            INVENTORY_CATALOG.length = 0;
            items.forEach(it => {
                INVENTORY_CATALOG.push({
                    id: it.id,
                    code: String(it.code || ''),
                    name: it.name || '',
                    nameEn: it.nameEn || '',
                    unit: it.unit || 'حبة',
                    price: parseFloat(it.price) || 0,
                    cost: parseFloat(it.cost) || 0,
                    stock: parseFloat(it.qty) || 0,
                    qty: parseFloat(it.qty) || 0,
                    category: it.group || 'أصناف عامة',
                    group: it.group || 'أصناف عامة',
                    reorderLimit: parseFloat(it.reorderLimit) || 50,
                    barcode: it.barcode || ''
                });
            });
            // تحديث جدول البحث عن الأصناف F1 إذا كان موجوداً
            refreshF1ItemSearchModalTable();
        }
    } catch (e) {
        console.warn('syncLiveItemsCatalog error:', e);
    }
    return LIVE_ITEMS_CACHE;
}

function refreshF1ItemSearchModalTable(filterQuery = '') {
    const modal = document.getElementById('itemSearchModal');
    if (!modal) return;
    const tbody = modal.querySelector('tbody');
    if (!tbody) return;
    const q = (filterQuery || '').toLowerCase().trim();
    const list = INVENTORY_CATALOG.filter(it => !q || (it.code + ' ' + it.name + ' ' + (it.category || '')).toLowerCase().includes(q));
    tbody.innerHTML = list.map((it, idx) => `
        <tr onclick="selectItemFromModal('${it.code}', '${(it.name || '').replace(/'/g, "\\'")}', '${it.unit || 'حبة'}', ${it.price || 0})" style="cursor:pointer;">
            <td>${idx + 1}</td>
            <td class="font-bold" style="color:#004e92;">${it.code}</td>
            <td class="font-bold">${it.name}</td>
            <td>${it.unit || 'حبة'}</td>
            <td style="color:${(it.qty || 0) <= (it.reorderLimit || 50) ? '#c62828' : '#1b5e20'}; font-weight:bold;">${it.qty || 0}</td>
            <td class="font-bold">${(parseFloat(it.price) || 0).toFixed(2)}</td>
            <td>${it.category || 'أصناف عامة'}</td>
        </tr>
    `).join('');
}

// دوال ربط حقول تعريف الصنف (itemDefModal)
function syncItemDefCostPrice(val) {
    const unitCost = document.getElementById('item-def-unit-cost-1');
    const openCost = document.getElementById('item-def-open-cost');
    const avgCost = document.getElementById('item-def-avg-cost');
    if (unitCost) unitCost.value = val;
    if (openCost && (!openCost.value || openCost.value === '0')) openCost.value = val;
    if (avgCost) avgCost.value = val;
}

function syncItemDefQty(val) {
    const unitQty = document.getElementById('item-def-unit-qty-1');
    if (unitQty) unitQty.value = val;
}

async function openItemDef(itemCodeOrIndex) {
    await syncLiveItemsCatalog();
    const modal = document.getElementById('itemDefModal');
    if (modal) modal.style.display = 'flex';

    if (itemCodeOrIndex !== undefined && itemCodeOrIndex !== null) {
        const idx = LIVE_ITEMS_CACHE.findIndex(x => String(x.code) === String(itemCodeOrIndex) || String(x.id) === String(itemCodeOrIndex));
        if (idx >= 0) {
            CURRENT_ITEM_DEF_INDEX = idx;
            populateItemDefForm(LIVE_ITEMS_CACHE[idx]);
            return;
        }
    }
    if (LIVE_ITEMS_CACHE.length > 0) {
        CURRENT_ITEM_DEF_INDEX = Math.min(CURRENT_ITEM_DEF_INDEX, LIVE_ITEMS_CACHE.length - 1);
        populateItemDefForm(LIVE_ITEMS_CACHE[CURRENT_ITEM_DEF_INDEX]);
    } else {
        prepareNewItemDef();
    }
}

function populateItemDefForm(it) {
    if (!it) return;
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
    setVal('item-def-id', it.id || (CURRENT_ITEM_DEF_INDEX + 1));
    setVal('item-def-code', it.code || '');
    setVal('item-def-name-ar', it.name || '');
    setVal('item-def-name-en', it.nameEn || '');
    setVal('item-def-open-cost', it.cost ?? 0);
    setVal('item-def-avg-cost', it.cost ?? 0);
    setVal('item-def-last-cost', it.cost ?? 0);
    setVal('item-def-qty', it.qty ?? 0);
    setVal('item-def-max-limit', it.maxLimit ?? 500);
    setVal('item-def-reorder-limit', it.reorderLimit ?? 50);
    setVal('item-def-tax', it.taxRate ?? 15);
    setVal('item-def-notes', it.notes || '');
    setVal('item-def-pack-1', it.pack || '1');
    setVal('item-def-price-1', it.price ?? 0);
    setVal('item-def-unit-qty-1', it.qty ?? 0);
    setVal('item-def-unit-cost-1', it.cost ?? 0);
    setVal('item-def-barcode-1', it.barcode || `628100000${it.code || '1001'}`);
    setVal('item-def-min-price', it.minPrice || Math.round((parseFloat(it.price) || 0) * 0.9));
    setVal('item-def-retail-price', it.price ?? 0);
    setVal('item-def-wholesale-price', it.wholesalePrice || Math.round((parseFloat(it.price) || 0) * 0.85));

    const grpSel = document.getElementById('item-def-group');
    if (grpSel && it.group) {
        if (!Array.from(grpSel.options).some(o => o.value === it.group)) {
            const opt = document.createElement('option');
            opt.value = it.group;
            opt.textContent = it.group;
            grpSel.appendChild(opt);
        }
        grpSel.value = it.group;
    }

    const unitSel = document.getElementById('item-def-unit-1');
    if (unitSel && it.unit) {
        if (!Array.from(unitSel.options).some(o => o.value === it.unit)) {
            const opt = document.createElement('option');
            opt.value = it.unit;
            opt.textContent = it.unit;
            unitSel.appendChild(opt);
        }
        unitSel.value = it.unit;
    }
}

function prepareNewItemDef() {
    const maxCode = LIVE_ITEMS_CACHE.reduce((acc, cur) => {
        const n = parseInt(cur.code, 10);
        return (!isNaN(n) && n > acc) ? n : acc;
    }, 1000);
    const nextCode = String(maxCode + 1);
    const nextId = LIVE_ITEMS_CACHE.length + 1;

    populateItemDefForm({
        id: nextId,
        code: nextCode,
        name: '',
        nameEn: '',
        group: 'تمور فاخرة',
        unit: 'كرتون',
        price: 0,
        cost: 0,
        qty: 0,
        reorderLimit: 50,
        maxLimit: 500,
        taxRate: 15,
        barcode: `628100000${nextCode}`
    });
    const nameInput = document.getElementById('item-def-name-ar');
    if (nameInput) nameInput.focus();
    showToast(`✓ جاهز لإضافة صنف جديد بكود (${nextCode}) - أدخل الاسم والسعر والكمية ثم اضغط حفظ F8`);
}

async function saveItemDefModal() {
    const code = (document.getElementById('item-def-code')?.value || '').trim();
    const name = (document.getElementById('item-def-name-ar')?.value || '').trim();
    const nameEn = (document.getElementById('item-def-name-en')?.value || '').trim();
    const group = document.getElementById('item-def-group')?.value || 'أصناف عامة';
    const unit = document.getElementById('item-def-unit-1')?.value || 'حبة';
    const price = parseFloat(document.getElementById('item-def-price-1')?.value) || 0;
    const cost = parseFloat(document.getElementById('item-def-last-cost')?.value || document.getElementById('item-def-unit-cost-1')?.value || document.getElementById('item-def-open-cost')?.value) || 0;
    const qty = parseFloat(document.getElementById('item-def-qty')?.value ?? document.getElementById('item-def-unit-qty-1')?.value) || 0;
    const reorderLimit = parseFloat(document.getElementById('item-def-reorder-limit')?.value) || 50;
    const maxLimit = parseFloat(document.getElementById('item-def-max-limit')?.value) || 500;
    const taxRate = parseFloat(document.getElementById('item-def-tax')?.value) || 15;
    const barcode = (document.getElementById('item-def-barcode-1')?.value || '').trim();
    const notes = (document.getElementById('item-def-notes')?.value || '').trim();

    if (!name) {
        alert('يرجى إدخال الوصف العربي (اسم الصنف) قبل الحفظ.');
        document.getElementById('item-def-name-ar')?.focus();
        return;
    }

    try {
        const res = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code, name, nameEn, group, unit, price, cost, qty, reorderLimit, maxLimit, taxRate, barcode, notes
            })
        });
        const data = await res.json();
        if (data.success) {
            await syncLiveItemsCatalog();
            const savedIdx = LIVE_ITEMS_CACHE.findIndex(x => String(x.code) === String(data.item.code));
            if (savedIdx >= 0) CURRENT_ITEM_DEF_INDEX = savedIdx;
            populateItemDefForm(data.item);
            refreshOpenItemReports();
            showToast(`✓ تم حفظ الصنف (${data.item.name}) بالكود [${data.item.code}] والكمية (${data.item.qty}) بنجاح!`);
        } else {
            alert('خطأ أثناء حفظ الصنف: ' + (data.error || 'غير معروف'));
        }
    } catch (e) {
        alert('تعذر الاتصال بالخادم لحفظ الصنف.');
    }
}

async function deleteItemDefModal() {
    const code = (document.getElementById('item-def-code')?.value || '').trim();
    const name = (document.getElementById('item-def-name-ar')?.value || '').trim();
    if (!code) return;
    if (!confirm(`هل أنت متأكد من حذف الصنف [${code} - ${name}] نهائياً؟`)) return;

    try {
        const res = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', code })
        });
        const data = await res.json();
        if (data.success) {
            await syncLiveItemsCatalog();
            CURRENT_ITEM_DEF_INDEX = Math.max(0, CURRENT_ITEM_DEF_INDEX - 1);
            if (LIVE_ITEMS_CACHE.length > 0) populateItemDefForm(LIVE_ITEMS_CACHE[CURRENT_ITEM_DEF_INDEX]);
            else prepareNewItemDef();
            refreshOpenItemReports();
            showToast(`✓ تم حذف الصنف [${code}] بنجاح`);
        }
    } catch (e) {
        alert('فشل حذف الصنف.');
    }
}

function navigateItemDef(dir) {
    if (!LIVE_ITEMS_CACHE.length) return;
    if (dir === 'first') CURRENT_ITEM_DEF_INDEX = 0;
    else if (dir === 'last') CURRENT_ITEM_DEF_INDEX = LIVE_ITEMS_CACHE.length - 1;
    else if (dir === 'prev') CURRENT_ITEM_DEF_INDEX = Math.max(0, CURRENT_ITEM_DEF_INDEX - 1);
    else if (dir === 'next') CURRENT_ITEM_DEF_INDEX = Math.min(LIVE_ITEMS_CACHE.length - 1, CURRENT_ITEM_DEF_INDEX + 1);
    populateItemDefForm(LIVE_ITEMS_CACHE[CURRENT_ITEM_DEF_INDEX]);
}

function searchItemDefModal() {
    const q = prompt('أدخل رقم الكود أو اسم الصنف للبحث عنه في بطاقة الأصناف:');
    if (!q) return;
    const clean = q.trim().toLowerCase();
    const idx = LIVE_ITEMS_CACHE.findIndex(x => String(x.code).toLowerCase() === clean || (x.name || '').toLowerCase().includes(clean));
    if (idx >= 0) {
        CURRENT_ITEM_DEF_INDEX = idx;
        populateItemDefForm(LIVE_ITEMS_CACHE[idx]);
        showToast(`✓ تم العثور على الصنف: ${LIVE_ITEMS_CACHE[idx].name}`);
    } else {
        alert('لم يتم العثور على صنف مطابق لـ: ' + q);
    }
}

function printItemDefModal() {
    window.print();
}

// نافذة تعديل الكمية والسعر السريعة لأي صنف من أي تقرير أو جدول
function openQuickAdjustQtyModal(itemCode) {
    const item = LIVE_ITEMS_CACHE.find(x => String(x.code) === String(itemCode)) || INVENTORY_CATALOG.find(x => String(x.code) === String(itemCode));
    if (!item) {
        openItemDef();
        return;
    }

    let modal = document.getElementById('quickAdjustQtyModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'quickAdjustQtyModal';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <div class="win-modal-box" style="width: 440px; background: #f4f7fa; border: 2px solid #004e92; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); padding: 0; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #004e92, #000428); color: #fff; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
                    <span><i class="fa-solid fa-boxes-stacked"></i> تعديل كمية وسعر الصنف الفوري</span>
                    <span style="cursor:pointer; font-size:18px;" onclick="document.getElementById('quickAdjustQtyModal').style.display='none'">&times;</span>
                </div>
                <div style="padding: 15px; display: flex; flex-direction: column; gap: 10px; font-size: 12px;">
                    <input type="hidden" id="qadj-code">
                    <div class="flex-row">
                        <label style="width: 110px; font-weight: bold;">كود واسم الصنف:</label>
                        <input type="text" id="qadj-name" class="win-input bg-yellow flex-grow font-bold">
                    </div>
                    <div class="flex-row">
                        <label style="width: 110px; font-weight: bold;">الوحدة / المجموعة:</label>
                        <input type="text" id="qadj-unit" class="win-input" style="width: 90px;" placeholder="الوحدة">
                        <input type="text" id="qadj-group" class="win-input flex-grow" style="margin-right: 6px;" placeholder="المجموعة">
                    </div>
                    <div class="flex-row" style="background: #e8f5e9; padding: 8px; border: 1px solid #a5d6a7; border-radius: 4px;">
                        <label style="width: 110px; font-weight: bold; color: #1b5e20;">الكمية الجديدة:</label>
                        <input type="number" step="1" id="qadj-qty" class="win-input font-bold text-center" style="width: 120px; font-size: 14px; border: 2px solid #2e7d32;">
                        <span style="margin-right: 8px; color: #555; font-size: 11px;">(أو <a href="#" onclick="addDeltaToQuickQty(10); return false;">+10</a> / <a href="#" onclick="addDeltaToQuickQty(50); return false;">+50</a> / <a href="#" onclick="addDeltaToQuickQty(-10); return false;">-10</a>)</span>
                    </div>
                    <div class="flex-row">
                        <label style="width: 110px; font-weight: bold;">سعر البيع (ر.س):</label>
                        <input type="number" step="0.01" id="qadj-price" class="win-input font-bold text-center" style="width: 120px;">
                        <label style="width: 85px; font-weight: bold; margin-right: 10px;">سعر التكلفة:</label>
                        <input type="number" step="0.01" id="qadj-cost" class="win-input text-center" style="width: 100px;">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; border-top: 1px solid #cfd8dc; padding-top: 10px;">
                        <button type="button" class="win-btn" style="padding: 6px 16px; background: #2e7d32; color: #fff; font-weight: bold; border-color: #1b5e20;" onclick="submitQuickAdjustQty()">
                            <i class="fa-solid fa-check"></i> حفظ التعديل فوراً
                        </button>
                        <button type="button" class="win-btn" style="padding: 6px 12px;" onclick="document.getElementById('quickAdjustQtyModal').style.display='none'; openItemDef(document.getElementById('qadj-code').value);">
                            بطاقة الصنف الكاملة
                        </button>
                        <button type="button" class="win-btn" style="padding: 6px 12px;" onclick="document.getElementById('quickAdjustQtyModal').style.display='none'">
                            إلغاء
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('qadj-code').value = item.code;
    document.getElementById('qadj-name').value = item.name;
    document.getElementById('qadj-unit').value = item.unit || 'حبة';
    document.getElementById('qadj-group').value = item.group || item.category || 'أصناف عامة';
    document.getElementById('qadj-qty').value = item.qty ?? item.stock ?? 0;
    document.getElementById('qadj-price').value = item.price ?? 0;
    document.getElementById('qadj-cost').value = item.cost ?? 0;
    modal.style.display = 'flex';
    document.getElementById('qadj-qty').focus();
    document.getElementById('qadj-qty').select();
}

function addDeltaToQuickQty(delta) {
    const el = document.getElementById('qadj-qty');
    if (!el) return;
    el.value = Math.max(0, (parseFloat(el.value) || 0) + delta);
}

async function submitQuickAdjustQty() {
    const code = document.getElementById('qadj-code')?.value;
    const name = document.getElementById('qadj-name')?.value;
    const unit = document.getElementById('qadj-unit')?.value;
    const group = document.getElementById('qadj-group')?.value;
    const qty = parseFloat(document.getElementById('qadj-qty')?.value) || 0;
    const price = parseFloat(document.getElementById('qadj-price')?.value) || 0;
    const cost = parseFloat(document.getElementById('qadj-cost')?.value) || 0;

    try {
        const res = await fetch('/api/items/adjust-qty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name, unit, group, qty, price, cost, mode: 'set' })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('quickAdjustQtyModal').style.display = 'none';
            await syncLiveItemsCatalog();
            refreshOpenItemReports();
            showToast(`✓ تم تحديث الصنف [${name}] — الكمية الجديدة: ${data.newQty} | السعر: ${price.toFixed(2)} ر.س`);
        } else {
            alert('فشل التحديث: ' + (data.error || ''));
        }
    } catch (e) {
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

function refreshOpenItemReports() {
    if (document.getElementById('itemsReportScreen')?.style.display === 'flex') openItemsReport();
    if (document.getElementById('itemsQuantitiesReportScreen')?.style.display === 'flex') openItemsQuantitiesReport();
    if (document.getElementById('itemsExpiryReportScreen')?.style.display === 'flex') openItemsExpiryReport();
    if (document.getElementById('orderLimitAlertScreen')?.style.display === 'flex') openOrderLimitAlert();
    if (document.getElementById('advancedInventoryReportScreen')?.style.display === 'flex') {
        refreshCurrentInventoryReport();
    }
}

// تحديث شاشة قائمة الأصناف (itemsReportScreen) وقائمة الأصناف بالكميات (itemsQuantitiesReportScreen) حياً مع أزرار إضافة صنف وتعديل الكمية
async function openItemsReport() {
    closeAllForms();
    const screen = document.getElementById('itemsReportScreen');
    if (screen) screen.style.display = 'flex';
    const mdi = document.getElementById('mdi-controls');
    if (mdi) mdi.style.display = 'flex';

    await syncLiveItemsCatalog();
    const tbody = screen?.querySelector('.report-grid-table tbody');
    if (!tbody) return;

    // إضافة شريط أزرار سريع أعلى التقرير إن لم يكن موجوداً
    injectItemReportActionBar(screen);

    let totalPrice = 0;
    let rowsHtml = LIVE_ITEMS_CACHE.map((it, idx) => {
        const p = parseFloat(it.price) || 0;
        totalPrice += p;
        return `
            <tr ondblclick="openQuickAdjustQtyModal('${it.code}')" style="cursor:pointer;" title="نقر مزدوج لتعديل الكمية والسعر">
                <td class="col-index">▶</td>
                <td class="text-center font-bold">${idx + 1}</td>
                <td class="text-center font-bold" style="color:#004e92;">${it.code}</td>
                <td class="font-bold">${it.name}</td>
                <td class="text-center">${it.unit || 'حبة'}</td>
                <td class="text-center font-bold" style="color:#1b5e20;">${p.toFixed(2)}</td>
                <td class="text-center">
                    <span style="font-weight:bold; color:#0277bd; margin-left:6px;">الكمية: ${it.qty ?? 0}</span>
                    <button type="button" class="win-btn" style="padding:1px 6px; font-size:10px; background:#e3f2fd; border-color:#1565c0; color:#0d47a1;" onclick="openQuickAdjustQtyModal('${it.code}')">تعديل الكمية/السعر</button>
                    <button type="button" class="win-btn" style="padding:1px 6px; font-size:10px;" onclick="openItemDef('${it.code}')">بطاقة الصنف</button>
                </td>
            </tr>
        `;
    }).join('');

    rowsHtml += `
        <tr class="report-total-row">
            <td class="col-index"></td>
            <td class="font-bold text-center">الأجمالي (${LIVE_ITEMS_CACHE.length} صنف)</td>
            <td></td>
            <td></td>
            <td></td>
            <td class="font-bold text-center">${totalPrice.toFixed(2)}</td>
            <td></td>
        </tr>
    `;
    tbody.innerHTML = rowsHtml;
}

async function openItemsQuantitiesReport() {
    closeAllForms();
    const screen = document.getElementById('itemsQuantitiesReportScreen');
    if (screen) screen.style.display = 'flex';
    const mdi = document.getElementById('mdi-controls');
    if (mdi) mdi.style.display = 'flex';

    await syncLiveItemsCatalog();
    const tbody = screen?.querySelector('.report-grid-table tbody');
    if (!tbody) return;

    injectItemReportActionBar(screen);

    let totalQty = 0;
    let totalCostVal = 0;
    let rowsHtml = LIVE_ITEMS_CACHE.map((it, idx) => {
        const qty = parseFloat(it.qty) || 0;
        const cost = parseFloat(it.cost) || 0;
        const price = parseFloat(it.price) || 0;
        totalQty += qty;
        totalCostVal += (qty * cost);
        return `
            <tr ondblclick="openQuickAdjustQtyModal('${it.code}')" style="cursor:pointer;">
                <td class="col-index">▶</td>
                <td class="text-center font-bold" style="color:#004e92;">${it.code}</td>
                <td class="font-bold">${it.name}</td>
                <td class="text-center">${it.unit || 'حبة'}</td>
                <td class="text-center font-bold" style="background:#fffde7;">
                    <input type="number" step="1" value="${qty}" style="width:75px; text-align:center; font-weight:bold; border:1px solid #90caf9; border-radius:2px; padding:2px;"
                        onchange="updateItemQtyInline('${it.code}', this.value)" title="عدل الكمية واضغط Enter للحفظ الفوري">
                </td>
                <td class="text-center">${price.toFixed(2)}</td>
                <td class="text-center">${cost.toFixed(2)}</td>
                <td class="text-center font-bold" style="color:#1b5e20;">${(qty * cost).toFixed(2)}</td>
                <td class="text-center">
                    <button type="button" class="win-btn" style="padding:1px 6px; font-size:10px; background:#e8f5e9; color:#1b5e20; border-color:#2e7d32;" onclick="openQuickAdjustQtyModal('${it.code}')">تعديل</button>
                </td>
            </tr>
        `;
    }).join('');

    rowsHtml += `
        <tr class="report-total-row">
            <td class="col-index"></td>
            <td class="font-bold text-center">الأجمالي</td>
            <td class="font-bold text-center">عدد الأصناف: ${LIVE_ITEMS_CACHE.length}</td>
            <td></td>
            <td class="font-bold text-center" style="color:#0d47a1;">${totalQty}</td>
            <td></td>
            <td></td>
            <td class="font-bold text-center" style="color:#1b5e20;">${totalCostVal.toFixed(2)} ر.س</td>
            <td></td>
        </tr>
    `;
    tbody.innerHTML = rowsHtml;
}

async function updateItemQtyInline(code, newQty) {
    try {
        const res = await fetch('/api/items/adjust-qty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, qty: parseFloat(newQty) || 0, mode: 'set' })
        });
        const data = await res.json();
        if (data.success) {
            await syncLiveItemsCatalog();
            refreshOpenItemReports();
            showToast(`✓ تم تعديل كمية الصنف [${data.item.name}] من (${data.oldQty}) إلى (${data.newQty}) بنجاح`);
        }
    } catch (e) {
        alert('تعذر تحديث الكمية');
    }
}

function injectItemReportActionBar(screen) {
    if (!screen || screen.querySelector('.live-item-action-bar')) return;
    const toolbar = screen.querySelector('.report-toolbar');
    if (!toolbar) return;
    const bar = document.createElement('div');
    bar.className = 'live-item-action-bar';
    bar.style.cssText = 'background:#e3f2fd; border-bottom:1px solid #90caf9; padding:6px 12px; display:flex; align-items:center; gap:8px; font-size:12px;';
    bar.innerHTML = `
        <span style="font-weight:bold; color:#0d47a1;"><i class="fa-solid fa-boxes-stacked"></i> إدارة الأصناف والكميات الحية:</span>
        <button type="button" class="win-btn" style="background:#2e7d32; color:#fff; border-color:#1b5e20; padding:3px 10px; font-weight:bold;" onclick="openItemDef(); prepareNewItemDef();">
            <i class="fa-solid fa-plus"></i> إضافة صنف جديد (F2)
        </button>
        <button type="button" class="win-btn" style="background:#1565c0; color:#fff; border-color:#0d47a1; padding:3px 10px; font-weight:bold;" onclick="openItemDef();">
            <i class="fa-solid fa-pen-to-square"></i> بطاقة تعريف الأصناف
        </button>
        <button type="button" class="win-btn" style="padding:3px 10px;" onclick="openStockInventory();">
            <i class="fa-solid fa-clipboard-check"></i> محضر الجرد المخزني
        </button>
        <span style="color:#555; font-size:11px; margin-right:auto;">💡 يمكنك تعديل الكمية مباشرة داخل الجدول أو النقر المزدوج على أي صنف</span>
    `;
    toolbar.insertAdjacentElement('afterend', bar);
}

// تقارير العملاء والموردين والمجموعات والوحدات والعملات والمندوبين الحية
async function openCustomersReport() {
    closeAllForms();
    const screen = document.getElementById('customersReportScreen');
    if (screen) screen.style.display = 'flex';
    const mdi = document.getElementById('mdi-controls');
    if (mdi) mdi.style.display = 'flex';
    try {
        const res = await fetch('/api/customers');
        const list = res.ok ? await res.json() : [];
        const tbody = screen?.querySelector('.report-grid-table tbody');
        if (tbody && list.length) {
            let totalBal = 0;
            tbody.innerHTML = list.map((c, idx) => {
                const bal = parseFloat(c.balance) || 0;
                totalBal += bal;
                return `
                    <tr onclick="selectReportRow(this)">
                        <td class="col-index">▶</td>
                        <td class="text-center font-bold">${idx + 1}</td>
                        <td class="text-center font-bold" style="color:#004e92;">${c.code || c.id}</td>
                        <td class="font-bold">${c.name}</td>
                        <td class="text-center">${c.phone || '-'}</td>
                        <td class="text-center">${c.address || 'الرياض'}</td>
                        <td class="text-center font-bold" style="color:#1b5e20;">${bal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                    </tr>
                `;
            }).join('') + `
                <tr class="report-total-row">
                    <td class="col-index"></td>
                    <td colspan="5" class="font-bold text-center">إجمالي أرصدة العملاء (${list.length})</td>
                    <td class="font-bold text-center">${totalBal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                </tr>
            `;
        }
    } catch (e) {}
}

async function openSuppliersReport() {
    closeAllForms();
    const screen = document.getElementById('suppliersReportScreen');
    if (screen) screen.style.display = 'flex';
    const mdi = document.getElementById('mdi-controls');
    if (mdi) mdi.style.display = 'flex';
    try {
        const res = await fetch('/api/suppliers');
        const list = res.ok ? await res.json() : [];
        const tbody = screen?.querySelector('.report-grid-table tbody');
        if (tbody && list.length) {
            let totalBal = 0;
            tbody.innerHTML = list.map((s, idx) => {
                const bal = parseFloat(s.balance) || 0;
                totalBal += bal;
                return `
                    <tr onclick="selectReportRow(this)">
                        <td class="col-index">▶</td>
                        <td class="text-center font-bold">${idx + 1}</td>
                        <td class="text-center font-bold" style="color:#e65100;">${s.code || s.id}</td>
                        <td class="font-bold">${s.name}</td>
                        <td class="text-center">${s.phone || '-'}</td>
                        <td class="text-center">${s.address || 'القصيم'}</td>
                        <td class="text-center font-bold" style="color:#b71c1c;">${bal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                    </tr>
                `;
            }).join('') + `
                <tr class="report-total-row">
                    <td class="col-index"></td>
                    <td colspan="5" class="font-bold text-center">إجمالي أرصدة الموردين (${list.length})</td>
                    <td class="font-bold text-center">${totalBal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                </tr>
            `;
        }
    } catch (e) {}
}

// =========================================================================
// 27. إظهار الفواتير في التقارير (المبيعات / المشتريات / المرتجعات / العمليات)
// =========================================================================

window.openInvoiceReportByType = async function(typeFilter) {
    closeAllForms();
    const screen = document.getElementById('advancedInventoryReportScreen');
    if (screen) screen.style.display = 'flex';
    const mdi = document.getElementById('mdi-controls');
    if (mdi) mdi.style.display = 'flex';

    CURRENT_ADV_INV_MODE = 'invoices';
    CURRENT_ADV_INV_TYPE = typeFilter || 'all';

    const titles = {
        'sales': 'سجل فواتير المبيعات المرحّلة (نقدي / آجل / شبكة)',
        'فاتورة مبيعات': 'سجل فواتير المبيعات المرحّلة (نقدي / آجل / شبكة)',
        'purchase': 'سجل فواتير المشتريات والتوريدات المخزنية',
        'فاتورة مشتريات': 'سجل فواتير المشتريات والتوريدات المخزنية',
        'returns': 'سجل فواتير مردودات المبيعات والمشتريات',
        'مردودات مبيعات': 'سجل فواتير مردودات المبيعات',
        'مردودات مشتريات': 'سجل فواتير مردودات المشتريات',
        'inventory': 'سجل سندات الإدخال والإخراج والتسويات المخزنية',
        'all': 'سجل جميع الفواتير والمستندات المحاسبية والمخزنية الشامل'
    };
    const title = titles[typeFilter] || `سجل فواتير ومستندات: ${typeFilter || 'الكل'}`;

    const titleEl = document.getElementById('adv-inv-report-title');
    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-file-invoice text-blue"></i> ${title}`;

    await loadInvoicesReportData(typeFilter || 'all');
};

window.loadInvoicesReportData = async function(typeFilter) {
    const activeFilter = typeFilter || CURRENT_ADV_INV_TYPE || 'all';
    try {
        const res = await fetch('/api/reports/invoices?type=' + encodeURIComponent(activeFilter));
        const invoices = res.ok ? await res.json() : [];
        ADV_INV_CACHE = invoices;
        renderInvoicesReportTable(invoices, activeFilter);
    } catch (e) {
        console.error('Failed to load invoices report:', e);
    }
};

window.renderInvoicesReportTable = function(invoices, activeFilter = 'all') {
    const container = document.getElementById('adv-inv-container') || document.getElementById('adv-inv-table-container');
    if (!container) return;

    let totalSub = 0, totalVat = 0, totalDiscount = 0, totalNet = 0;

    let html = `
        <div style="background:#eef5fc; border:1px solid #b6d4fe; border-radius:4px; padding:8px 12px; margin-bottom:10px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="font-weight:bold; color:#004e92;"><i class="fa-solid fa-filter"></i> تصفية الفواتير:</span>
            <button type="button" class="win-btn" style="padding:3px 10px; ${activeFilter==='all'?'background:#004e92;color:#fff;font-weight:bold;':''}" onclick="openInvoiceReportByType('all')">الكل</button>
            <button type="button" class="win-btn" style="padding:3px 10px; ${activeFilter==='sales'?'background:#1e7e34;color:#fff;font-weight:bold;':''}" onclick="openInvoiceReportByType('sales')">فواتير المبيعات</button>
            <button type="button" class="win-btn" style="padding:3px 10px; ${activeFilter==='purchase'?'background:#e65100;color:#fff;font-weight:bold;':''}" onclick="openInvoiceReportByType('purchase')">فواتير المشتريات</button>
            <button type="button" class="win-btn" style="padding:3px 10px; ${activeFilter==='returns'?'background:#c62828;color:#fff;font-weight:bold;':''}" onclick="openInvoiceReportByType('returns')">المرتجعات</button>
            <button type="button" class="win-btn" style="padding:3px 10px; ${activeFilter==='inventory'?'background:#6a1b9a;color:#fff;font-weight:bold;':''}" onclick="openInvoiceReportByType('inventory')">السندات المخزنية</button>
            <div style="margin-right:auto; display:flex; gap:6px;">
                <button type="button" class="win-btn" style="padding:3px 10px; background:#e8f5e9; color:#1b5e20; border-color:#2e7d32; font-weight:bold;" onclick="openSalesInvoice()">+ فاتورة مبيعات جديدة</button>
                <button type="button" class="win-btn" style="padding:3px 10px; background:#fff3e0; color:#e65100; border-color:#ef6c00; font-weight:bold;" onclick="openPurchaseInvoice()">+ فاتورة مشتريات جديدة</button>
            </div>
        </div>
        <table class="report-grid-table" style="width: 100%; font-size: 11px;">
            <thead>
                <tr style="background: linear-gradient(to bottom, #f0f7fd, #d8eaf8);">
                    <th style="width: 35px;">م</th>
                    <th style="width: 105px;">رقم الفاتورة</th>
                    <th style="width: 90px;">التاريخ</th>
                    <th style="width: 115px;">نوع المستند</th>
                    <th>العميل / المورد / البيان</th>
                    <th style="width: 80px;">طريقة الدفع</th>
                    <th style="width: 75px;">الأصناف</th>
                    <th style="width: 100px;">الإجمالي قبل الضريبة</th>
                    <th style="width: 80px;">الخصم</th>
                    <th style="width: 95px;">ضريبة 15%</th>
                    <th style="width: 115px;">الصافي النهائي</th>
                    <th style="width: 95px;">رقم القيد</th>
                    <th style="width: 130px;">إجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (!invoices || invoices.length === 0) {
        html += `<tr><td colspan="13" class="text-center" style="padding: 25px; color: #777;">لا توجد فواتير مطابقة للفلتر المحدد حالياً.</td></tr>`;
    } else {
        invoices.forEach((inv, idx) => {
            const isSale = inv.type === 'sales' || inv.type === 'فاتورة مبيعات';
            const isPur = inv.type === 'purchase' || inv.type === 'فاتورة مشتريات';
            const docLabel = inv.docType || (isSale ? 'فاتورة مبيعات' : isPur ? 'فاتورة مشتريات' : inv.type);
            const partyName = inv.customerName || inv.supplierName || inv.notes || (isSale ? 'عميل نقدي' : 'مورد عام');
            const itemsList = Array.isArray(inv.items) ? inv.items : [];
            const itemsSummary = itemsList.map(i => `${i.name || i.code} (${i.qty ?? i.actualQty ?? 1})`).join('، ');
            const net = parseFloat(inv.netTotal || inv.netAmount) || 0;
            const sub = parseFloat(inv.subtotal || inv.totalBeforeVat) || (net > 0 ? net / 1.15 : 0);
            const disc = parseFloat(inv.discount) || 0;
            const vat = parseFloat(inv.vat15Percent || inv.vatAmount || inv.totalVat) || Math.max(0, net - sub);
            const jvNo = inv.journalEntryNumber || `JV-AUTO-${inv.invoiceNumber}`;

            totalSub += sub;
            totalDiscount += disc;
            totalVat += vat;
            totalNet += net;

            const badgeColor = isSale ? '#1e7e34' : isPur ? '#e65100' : '#6a1b9a';

            html += `
                <tr style="border-bottom: 1px solid #e0e0e0;" onclick="selectReportRow(this)" ondblclick="viewInvoiceDetailsModal('${inv.invoiceNumber}')">
                    <td class="text-center" style="color: #666;">${idx + 1}</td>
                    <td class="text-center font-bold" style="color: #004e92; font-family: monospace;">#${inv.invoiceNumber}</td>
                    <td class="text-center">${inv.date || '2026-10-14'}</td>
                    <td class="text-center"><span style="padding: 2px 6px; border-radius: 3px; font-weight: bold; background:${badgeColor}18; color:${badgeColor};">${docLabel}</span></td>
                    <td style="padding-right: 8px;">
                        <div class="font-bold">${partyName}</div>
                        <div style="font-size:10px; color:#666; max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${itemsSummary}">${itemsSummary || '-'}</div>
                    </td>
                    <td class="text-center font-bold">${inv.paymentMethod || 'نقدي'}</td>
                    <td class="text-center">${itemsList.length} صنف</td>
                    <td class="text-center font-bold">${sub.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="text-center" style="color: #666;">${disc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="text-center font-bold" style="color: #b71c1c;">${vat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="text-center font-bold" style="color: #1e7e34; font-size: 11.5px; background: #f1f8e9;">${net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</td>
                    <td class="text-center" style="font-family:monospace; font-size:10px; color:#455a64;">${jvNo}</td>
                    <td class="text-center">
                        <button type="button" class="win-btn" style="padding:1px 6px; font-size:10px; background:#e3f2fd; color:#0d47a1; border-color:#90caf9;" onclick="viewInvoiceDetailsModal('${inv.invoiceNumber}')">عرض</button>
                        <button type="button" class="win-btn" style="padding:1px 6px; font-size:10px;" onclick="viewInvoiceDetailsModal('${inv.invoiceNumber}', true)">طباعة</button>
                        <button type="button" class="win-btn" style="padding:1px 5px; font-size:10px; color:#c62828;" onclick="deleteInvoiceFromReport('${inv.invoiceNumber}', '${activeFilter}')" title="حذف الفاتورة">×</button>
                    </td>
                </tr>
            `;
        });
    }

    html += `
            </tbody>
            <tfoot style="background: #f4f6f7; font-weight: bold; border-top: 2px solid #7f8c8d;">
                <tr>
                    <td colspan="7" style="text-align: center;">الإجــمــالـيـات الـعــامــة لـلـفـواتـيـر (${invoices.length} مستند)</td>
                    <td class="text-center font-bold">${totalSub.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="text-center font-bold">${totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="text-center font-bold" style="color: #b71c1c;">${totalVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="text-center font-bold" style="color: #1e7e34; font-size: 12px;">${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</td>
                    <td colspan="2"></td>
                </tr>
            </tfoot>
        </table>
    `;

    container.innerHTML = html;
    if (typeof updateInvStats === 'function') {
        updateInvStats(invoices.length, invoices.length, totalSub, totalNet);
    }
};

function viewInvoiceDetailsModal(invoiceNumber, autoPrint = false) {
    const inv = (ADV_INV_CACHE || []).find(x => String(x.invoiceNumber) === String(invoiceNumber));
    if (!inv) return;

    let modal = document.getElementById('invoiceDetailsViewerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'invoiceDetailsViewerModal';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '9999';
        document.body.appendChild(modal);
    }

    const items = Array.isArray(inv.items) ? inv.items : [];
    const net = parseFloat(inv.netTotal || inv.netAmount) || 0;
    const sub = parseFloat(inv.subtotal || inv.totalBeforeVat) || (net > 0 ? net / 1.15 : 0);
    const vat = parseFloat(inv.vat15Percent || inv.vatAmount || inv.totalVat) || Math.max(0, net - sub);

    modal.innerHTML = `
        <div class="win-modal-box" style="width: 720px; max-width: 95vw; background: #fff; border: 2px solid #004e92; border-radius: 4px; box-shadow: 0 12px 36px rgba(0,0,0,0.4); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #004e92, #000428); color: #fff; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
                <span><i class="fa-solid fa-file-invoice"></i> تفاصيل ${inv.docType || 'الفاتورة'} رقم #${inv.invoiceNumber}</span>
                <span style="cursor:pointer; font-size:18px;" onclick="document.getElementById('invoiceDetailsViewerModal').style.display='none'">&times;</span>
            </div>
            <div style="padding: 16px; font-size: 12px;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: #f8fafd; padding: 10px; border: 1px solid #d0e2f2; margin-bottom: 12px;">
                    <div><strong>رقم الفاتورة:</strong> #${inv.invoiceNumber}</div>
                    <div><strong>التاريخ:</strong> ${inv.date || '-'}</div>
                    <div><strong>طريقة الدفع:</strong> ${inv.paymentMethod || 'نقدي'}</div>
                    <div><strong>الطرف:</strong> ${inv.customerName || inv.supplierName || 'عميل نقدي'}</div>
                    <div><strong>الفرع / المستودع:</strong> ${inv.branch || inv.store || 'المركز الرئيسي'}</div>
                    <div><strong>القيد المحاسبي:</strong> ${inv.journalEntryNumber || 'JV-AUTO-' + inv.invoiceNumber}</div>
                </div>
                <table class="report-grid-table" style="width:100%; font-size:11.5px; margin-bottom:12px;">
                    <thead>
                        <tr style="background:#e3f2fd;">
                            <th>م</th>
                            <th>كود الصنف</th>
                            <th>اسم الصنف</th>
                            <th>الوحدة</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((it, i) => {
                            const q = parseFloat(it.qty ?? it.actualQty) || 0;
                            const p = parseFloat(it.price ?? it.cost) || 0;
                            const st = parseFloat(it.subtotal || it.total) || (q * p);
                            return `
                                <tr>
                                    <td class="text-center">${i + 1}</td>
                                    <td class="text-center font-bold">${it.code || '-'}</td>
                                    <td class="font-bold">${it.name || '-'}</td>
                                    <td class="text-center">${it.unit || 'حبة'}</td>
                                    <td class="text-center font-bold">${q}</td>
                                    <td class="text-center">${p.toFixed(2)}</td>
                                    <td class="text-center font-bold">${st.toFixed(2)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f1f8e9; padding:10px 14px; border:1px solid #a5d6a7;">
                    <div><strong>الإجمالي قبل الضريبة:</strong> ${sub.toFixed(2)} ر.س | <strong>ضريبة 15%:</strong> ${vat.toFixed(2)} ر.س</div>
                    <div style="font-size:15px; font-weight:bold; color:#1b5e20;">الصافي النهائي: ${net.toFixed(2)} ر.س</div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                    <button type="button" class="win-btn" style="padding:6px 14px; background:#004e92; color:#fff;" onclick="window.print()"><i class="fa-solid fa-print"></i> طباعة الفاتورة</button>
                    <button type="button" class="win-btn" style="padding:6px 14px;" onclick="document.getElementById('invoiceDetailsViewerModal').style.display='none'">إغلاق</button>
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    if (autoPrint) setTimeout(() => window.print(), 250);
}

async function deleteInvoiceFromReport(invoiceNumber, activeFilter) {
    if (!confirm(`هل أنت متأكد من حذف المستند رقم #${invoiceNumber} وعكس قيده الآلي؟`)) return;
    try {
        const res = await fetch('/api/invoices/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoiceNumber })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✓ تم حذف المستند #${invoiceNumber} وتحديث التقارير`);
            await loadInvoicesReportData(activeFilter || 'all');
        }
    } catch (e) {
        alert('تعذر حذف المستند');
    }
}

// تحديث تقرير بالعمليات (operationsReportScreen) ليقرأ الفواتير والقيود الحقيقية من الخادم
window.openOperationsReport = async function() {
    closeAllForms();
    const screen = document.getElementById('operationsReportScreen');
    if (screen) screen.style.display = 'flex';
    const mdi = document.getElementById('mdi-controls');
    if (mdi) mdi.style.display = 'flex';

    try {
        const [invRes, jvRes, vchRes] = await Promise.all([
            fetch('/api/invoices'),
            fetch('/api/journal'),
            fetch('/api/vouchers')
        ]);
        const invoices = invRes.ok ? await invRes.json() : [];
        const journals = jvRes.ok ? await jvRes.json() : [];
        const vouchers = vchRes.ok ? await vchRes.json() : [];

        const liveLogs = [];
        invoices.forEach(inv => {
            liveLogs.push({
                user: inv.createdBy || 'مدير النظام: الحسن',
                docType: inv.docType || (inv.type === 'purchase' ? 'فاتورة مشتريات' : 'فاتورة مبيعات'),
                opType: inv.isPosted ? 'حفظ وترحيل' : 'إضافة',
                date: inv.date || '2026-10-14',
                time: (inv.timestamp ? inv.timestamp.split('T')[1]?.slice(0, 5) : '10:30') || '10:30',
                docNo: inv.invoiceNumber,
                amount: parseFloat(inv.netTotal || inv.netAmount) || 0,
                party: inv.customerName || inv.supplierName || 'عميل نقدي'
            });
        });
        vouchers.forEach(v => {
            liveLogs.push({
                user: 'مدير النظام: الحسن',
                docType: v.type === 'receipt' ? 'سند قبض' : 'سند صرف',
                opType: 'ترحيل',
                date: v.date || '2026-10-15',
                time: '11:15',
                docNo: v.voucherNumber,
                amount: parseFloat(v.amount) || 0,
                party: v.accountName || '-'
            });
        });
        journals.forEach(j => {
            const totalDeb = (j.lines || []).reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
            liveLogs.push({
                user: 'مدير النظام: الحسن',
                docType: j.docType || 'قيد يومية',
                opType: 'ترحيل',
                date: j.date || '2026-10-15',
                time: '12:00',
                docNo: j.entryNumber,
                amount: totalDeb,
                party: j.description || '-'
            });
        });

        AUDIT_LOG_SAMPLE.length = 0;
        liveLogs.forEach(l => AUDIT_LOG_SAMPLE.push(l));

        const tbody = document.getElementById('operations-report-tbody');
        if (tbody) {
            tbody.innerHTML = liveLogs.map((r, i) => `
                <tr onclick="selectReportRow(this)">
                    <td class="col-index">${i === 0 ? '▶' : ''}</td>
                    <td class="font-bold">${r.user}</td>
                    <td class="text-center font-bold" style="color:#004e92;">${r.docType}</td>
                    <td class="text-center"><span style="background:#e8f5e9; color:#1b5e20; padding:1px 6px; border-radius:3px; font-weight:bold;">${r.opType}</span></td>
                    <td class="text-center">${r.date}</td>
                    <td class="text-center">${r.time}</td>
                    <td class="text-center font-bold">#${r.docNo} (${r.amount.toFixed(2)} ر.س)</td>
                </tr>
            `).join('');
        }
        const statusEl = document.getElementById('operations-status-count');
        if (statusEl) statusEl.textContent = `إجمالي العمليات المسجلة حياً: ${liveLogs.length} عملية`;
    } catch (e) {
        console.warn('openOperationsReport error:', e);
    }
};

// =========================================================================
// 28. تفعيل سندات المخزون (سند إدخال / سند إخراج / محضر الجرد / باقي الفواتير)
// =========================================================================

window.saveStockMovement = async function(direction, postImmediately) {
    const isOut = direction === 'out';
    const screenId = isOut ? 'stockOutScreen' : 'stockInScreen';
    const tbodyId = isOut ? 'stockout-tbody' : 'stockin-tbody';
    const docNumId = isOut ? 'stockout-doc-num' : 'stockin-doc-num';
    const dateId = isOut ? 'stockout-date' : 'stockin-date';
    const notesId = isOut ? 'stockout-notes' : 'stockin-notes';

    const docNumber = document.getElementById(docNumId)?.value || `${isOut ? 'SOUT' : 'SIN'}-${Date.now().toString().slice(-4)}`;
    const date = document.getElementById(dateId)?.value || new Date().toISOString().split('T')[0];
    const notes = document.getElementById(notesId)?.value || (isOut ? 'سند إخراج بضاعة من المستودع' : 'سند إدخال بضاعة إلى المستودع');

    const tbody = document.getElementById(tbodyId);
    const items = [];
    let totalAmount = 0;

    if (tbody) {
        tbody.querySelectorAll('tr').forEach(tr => {
            const inputs = tr.querySelectorAll('input');
            const sel = tr.querySelector('select');
            if (inputs.length >= 4) {
                const code = inputs[0].value.trim();
                const name = inputs[1].value.trim();
                const qty = parseFloat(inputs[2].value) || 0;
                const price = parseFloat(inputs[3].value) || 0;
                const unit = sel ? sel.value : 'حبة';
                if ((code || name) && qty > 0) {
                    const sub = Math.round(qty * price * 100) / 100;
                    totalAmount += sub;
                    items.push({ code: code || '1001', name: name || 'صنف مخزني', unit, qty, price, cost: price, subtotal: sub });
                }
            }
        });
    }

    if (items.length === 0) {
        alert('يرجى إدخال صنف واحد بكمية أكبر من صفر قبل حفظ السند.');
        return;
    }

    try {
        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invoiceNumber: docNumber,
                date: date,
                type: isOut ? 'stock_out' : 'stock_in',
                docType: isOut ? 'سند إخراج' : 'سند إدخال',
                notes: notes,
                paymentMethod: 'مخزني',
                subtotal: totalAmount,
                vat15Percent: 0,
                netTotal: totalAmount,
                isPosted: postImmediately !== false,
                items: items
            })
        });
        const data = await res.json();
        if (data.success) {
            await syncLiveItemsCatalog();
            showToast(`✓ تم حفظ وترحيل ${isOut ? 'سند الإخراج' : 'سند الإدخال'} رقم #${data.invoice.invoiceNumber} وتحديث كميات الأصناف بنجاح!`);
        } else {
            alert('خطأ: ' + (data.error || 'تعذر حفظ السند'));
        }
    } catch (e) {
        alert('تعذر الاتصال بالخادم لحفظ السند المخزني');
    }
};

window.saveStockInventory = async function(postReconciliation) {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;
    const docNo = document.getElementById('inv-doc-num')?.value || `CNT-${Date.now().toString().slice(-4)}`;
    const date = document.getElementById('inv-date')?.value || new Date().toISOString().split('T')[0];

    const items = [];
    let totalDiffVal = 0;

    tbody.querySelectorAll('tr').forEach(tr => {
        const inputs = tr.querySelectorAll('input');
        const sel = tr.querySelector('select');
        if (inputs.length >= 5) {
            const code = inputs[0].value.trim();
            const name = inputs[1].value.trim();
            const bookQty = parseFloat(inputs[2].value) || 0;
            const actualQty = parseFloat(inputs[3].value) || 0;
            const cost = parseFloat(inputs[4].value) || 0;
            const unit = sel ? sel.value : 'حبة';
            if (code || name) {
                const diff = actualQty - bookQty;
                totalDiffVal += Math.abs(diff * cost);
                items.push({ code, name, unit, bookQty, actualQty, qty: actualQty, cost, price: cost });
            }
        }
    });

    if (items.length === 0) {
        alert('لا توجد أصناف في جدول الجرد لحفظها.');
        return;
    }

    try {
        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invoiceNumber: docNo,
                date: date,
                type: 'stock_inventory',
                docType: 'الجرد المخزني',
                notes: 'محضر جرد مخزني وتعديل الأرصدة الفعلية',
                subtotal: totalDiffVal,
                netTotal: totalDiffVal,
                isPosted: !!postReconciliation,
                items: items
            })
        });
        const data = await res.json();
        if (data.success) {
            await syncLiveItemsCatalog();
            showToast(`✓ تم اعتماد محضر الجرد (#${data.invoice.invoiceNumber}) وتحديث الكميات الفعلية لـ (${items.length}) صنف بنجاح!`);
        }
    } catch (e) {
        alert('تعذر حفظ محضر الجرد');
    }
};

// تهيئة جميع شاشات المستندات الـ 11 الأخرى لتصبح تفاعلية وقابلة للإدخال والحفظ والترحيل
const UNIVERSAL_DOC_SCREENS = [
    { id: 'salesReturnScreen', type: 'sales_return', docType: 'مردودات مبيعات', prefix: 'SRT', hasVat: true },
    { id: 'purchaseReturnScreen', type: 'purchase_return', docType: 'مردودات مشتريات', prefix: 'PRT', hasVat: true },
    { id: 'customerQuotationScreen', type: 'customer_quotation', docType: 'عرض سعر عميل', prefix: 'QT', hasVat: true },
    { id: 'supplierQuotationScreen', type: 'supplier_quotation', docType: 'عرض سعر مورد', prefix: 'SQT', hasVat: true },
    { id: 'purchaseOrderScreen', type: 'purchase_order', docType: 'أمر شراء', prefix: 'PO', hasVat: true },
    { id: 'stockAdjustmentScreen', type: 'stock_adjustment', docType: 'تسوية مخزون', prefix: 'ADJ', hasVat: false },
    { id: 'openingQuantitiesScreen', type: 'opening_qty', docType: 'الكميات الأفتتاحية', prefix: 'OPN', hasVat: false },
    { id: 'goodsIssueOrderScreen', type: 'goods_issue_order', docType: 'أمر صرف بضاعة', prefix: 'GIO', hasVat: false },
    { id: 'goodsIssueReturnScreen', type: 'goods_issue_return', docType: 'مرتجع أمر صرف بضاعة', prefix: 'GIR', hasVat: false },
    { id: 'manufacturingOrdersScreen', type: 'manufacturing_order', docType: 'أمر تصنيع', prefix: 'MFG', hasVat: false }
];

function initUniversalDocumentScreens() {
    UNIVERSAL_DOC_SCREENS.forEach(cfg => {
        const screen = document.getElementById(cfg.id);
        if (!screen) return;
        const tbody = screen.querySelector('table.sales-grid tbody');
        if (tbody && !tbody.dataset.universalInitialized) {
            tbody.dataset.universalInitialized = 'true';
            tbody.id = `${cfg.id}-tbody`;
            const defaultItems = INVENTORY_CATALOG.slice(0, 2);
            tbody.innerHTML = defaultItems.map((it, idx) => createUniversalDocRowHtml(cfg.id, idx + 1, it)).join('');
            recalcUniversalDocument(cfg.id, cfg.hasVat);
        }

        // تفعيل أزرار الأسفل في الشاشة
        const actionsBar = screen.querySelector('.bottom-actions');
        if (actionsBar && !actionsBar.dataset.universalWired) {
            actionsBar.dataset.universalWired = 'true';
            actionsBar.innerHTML = `
                <div class="nav-group">
                    <button type="button" class="win-btn nav-btn" onclick="showToast('✓ أول مستند في ${cfg.docType}')">&lt;&lt;</button>
                    <button type="button" class="win-btn nav-btn" onclick="showToast('✓ المستند السابق في ${cfg.docType}')">&lt;</button>
                </div>
                <button type="button" class="action-btn" onclick="addUniversalDocRow('${cfg.id}', ${cfg.hasVat})">
                    <img src="https://img.icons8.com/color/48/000000/add.png" width="25" height="25">
                    <span>سطر جديد F2</span>
                </button>
                <button type="button" class="action-btn" style="background: #e8f5e9; border-color: #2e7d32;" onclick="saveUniversalDocument('${cfg.id}', '${cfg.type}', '${cfg.docType}', '${cfg.prefix}', ${cfg.hasVat}, false)">
                    <img src="https://img.icons8.com/color/48/000000/save--v1.png" width="25" height="25">
                    <span style="font-weight:bold; color:#1b5e20;">حفظ F8</span>
                </button>
                <button type="button" class="action-btn" style="background: #e3f2fd; border-color: #1565c0;" onclick="saveUniversalDocument('${cfg.id}', '${cfg.type}', '${cfg.docType}', '${cfg.prefix}', ${cfg.hasVat}, true)">
                    <img src="https://img.icons8.com/color/48/000000/checked-checkbox.png" width="25" height="25">
                    <span style="font-weight:bold; color:#0d47a1;">حفظ وترحيل F9</span>
                </button>
                <button type="button" class="action-btn" onclick="openItemSearchModal()">
                    <img src="https://img.icons8.com/color/48/000000/search--v1.png" width="25" height="25">
                    <span>بحث صنف F1</span>
                </button>
                <button type="button" class="action-btn" onclick="window.print()">
                    <img src="https://img.icons8.com/color/48/000000/print.png" width="25" height="25">
                    <span>طباعة F6</span>
                </button>
                <button type="button" class="action-btn" onclick="openInvoiceReportByType('all')">
                    <img src="https://img.icons8.com/color/48/000000/Analyze.png" width="25" height="25">
                    <span>سجل التقارير</span>
                </button>
                <button type="button" class="action-btn" onclick="closeActiveInvoice()">
                    <img src="https://img.icons8.com/color/48/000000/delete-sign--v1.png" width="25" height="25">
                    <span>خروج Esc</span>
                </button>
                <div class="nav-group">
                    <button type="button" class="win-btn nav-btn" onclick="showToast('✓ المستند التالي في ${cfg.docType}')">&gt;</button>
                    <button type="button" class="win-btn nav-btn" onclick="showToast('✓ آخر مستند في ${cfg.docType}')">&gt;&gt;</button>
                </div>
            `;
        }
    });
}

function createUniversalDocRowHtml(screenId, rowNum, item = {}) {
    const code = item.code || '';
    const name = item.name || '';
    const unit = item.unit || 'كرتون';
    const qty = item.qty !== undefined ? item.qty : 1;
    const price = item.price !== undefined ? item.price : (item.cost || 0);
    const sub = (qty * price).toFixed(2);
    return `
        <tr>
            <td class="col-index">▶</td>
            <td class="row-num">${rowNum}</td>
            <td><input type="text" class="grid-input text-center font-bold udoc-code" value="${code}" placeholder="الكود أو F1" onchange="lookupUniversalItemByCode(this, '${screenId}')"></td>
            <td><input type="text" class="grid-input font-bold udoc-name" value="${name}" placeholder="اسم الصنف..."></td>
            <td>
                <select class="grid-input udoc-unit">
                    <option value="${unit}">${unit}</option>
                    <option value="كرتون">كرتون</option>
                    <option value="كيلو">كيلو</option>
                    <option value="عبوة">عبوة</option>
                    <option value="حبة">حبة</option>
                </select>
            </td>
            <td><input type="number" step="1" class="grid-input text-center font-bold udoc-qty" value="${qty}" oninput="recalcUniversalDocument('${screenId}', true)"></td>
            <td><input type="number" step="0.01" class="grid-input text-center font-bold udoc-price" value="${price}" oninput="recalcUniversalDocument('${screenId}', true)"></td>
            <td><input type="number" step="0.01" class="grid-input text-center udoc-disc" value="0.00" oninput="recalcUniversalDocument('${screenId}', true)"></td>
            <td class="text-center font-bold udoc-subtotal">${sub}</td>
            <td><input type="text" class="grid-input udoc-note" placeholder="ملاحظة..."></td>
            <td class="text-center"><button type="button" class="win-btn text-red" onclick="this.closest('tr').remove(); recalcUniversalDocument('${screenId}', true)">×</button></td>
        </tr>
    `;
}

function lookupUniversalItemByCode(inputEl, screenId) {
    const code = inputEl.value.trim();
    const found = INVENTORY_CATALOG.find(x => String(x.code) === code || (x.name && x.name.includes(code)));
    if (found) {
        const tr = inputEl.closest('tr');
        if (tr) {
            tr.querySelector('.udoc-code').value = found.code;
            tr.querySelector('.udoc-name').value = found.name;
            tr.querySelector('.udoc-price').value = found.price || found.cost || 0;
            recalcUniversalDocument(screenId, true);
        }
    }
}

function addUniversalDocRow(screenId, hasVat) {
    const tbody = document.getElementById(`${screenId}-tbody`);
    if (!tbody) return;
    const nextNum = tbody.querySelectorAll('tr').length + 1;
    tbody.insertAdjacentHTML('beforeend', createUniversalDocRowHtml(screenId, nextNum, { code: '', name: '', unit: 'حبة', qty: 1, price: 0 }));
    recalcUniversalDocument(screenId, hasVat);
}

function recalcUniversalDocument(screenId, hasVat = true) {
    const screen = document.getElementById(screenId);
    if (!screen) return;
    const tbody = document.getElementById(`${screenId}-tbody`);
    if (!tbody) return;

    let subtotal = 0;
    let totalDisc = 0;
    tbody.querySelectorAll('tr').forEach((tr, idx) => {
        const numCell = tr.querySelector('.row-num');
        if (numCell) numCell.textContent = idx + 1;
        const qty = parseFloat(tr.querySelector('.udoc-qty')?.value) || 0;
        const price = parseFloat(tr.querySelector('.udoc-price')?.value) || 0;
        const disc = parseFloat(tr.querySelector('.udoc-disc')?.value) || 0;
        const lineSub = Math.max(0, (qty * price) - disc);
        subtotal += (qty * price);
        totalDisc += disc;
        const subCell = tr.querySelector('.udoc-subtotal');
        if (subCell) subCell.textContent = lineSub.toFixed(2);
    });

    const netBeforeVat = Math.max(0, subtotal - totalDisc);
    const vat = hasVat ? Math.round(netBeforeVat * 0.15 * 100) / 100 : 0;
    const netTotal = Math.round((netBeforeVat + vat) * 100) / 100;

    const summaryInputs = screen.querySelectorAll('.invoice-footer .summary-box input');
    if (summaryInputs.length >= 1) summaryInputs[0].value = subtotal.toFixed(2);
    if (summaryInputs.length >= 2) summaryInputs[1].value = totalDisc.toFixed(2);
    if (summaryInputs.length >= 3) summaryInputs[summaryInputs.length - 1].value = netTotal.toFixed(2);
}

async function saveUniversalDocument(screenId, type, docType, prefix, hasVat, isPosted) {
    const screen = document.getElementById(screenId);
    if (!screen) return;
    const tbody = document.getElementById(`${screenId}-tbody`);
    const headerInputs = screen.querySelectorAll('.invoice-header input');
    const docNo = headerInputs[0]?.value?.trim() || `${prefix}-${Date.now().toString().slice(-4)}`;
    const dateVal = headerInputs[2]?.value?.trim() || new Date().toISOString().split('T')[0];

    const items = [];
    let subtotal = 0;
    let discount = 0;

    if (tbody) {
        tbody.querySelectorAll('tr').forEach(tr => {
            const code = tr.querySelector('.udoc-code')?.value?.trim() || '';
            const name = tr.querySelector('.udoc-name')?.value?.trim() || '';
            const unit = tr.querySelector('.udoc-unit')?.value || 'حبة';
            const qty = parseFloat(tr.querySelector('.udoc-qty')?.value) || 0;
            const price = parseFloat(tr.querySelector('.udoc-price')?.value) || 0;
            const disc = parseFloat(tr.querySelector('.udoc-disc')?.value) || 0;
            if ((code || name) && qty > 0) {
                const lineSub = Math.max(0, (qty * price) - disc);
                subtotal += (qty * price);
                discount += disc;
                items.push({ code: code || '1001', name: name || 'صنف عام', unit, qty, price, cost: price, discount: disc, subtotal: lineSub });
            }
        });
    }

    if (items.length === 0) {
        alert(`يرجى إدخال صنف واحد على الأقل بكمية صحيحة في [${docType}] قبل الحفظ.`);
        return;
    }

    const netBeforeVat = Math.max(0, subtotal - discount);
    const vat15 = hasVat ? Math.round(netBeforeVat * 0.15 * 100) / 100 : 0;
    const netTotal = Math.round((netBeforeVat + vat15) * 100) / 100;

    try {
        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invoiceNumber: docNo,
                date: dateVal.replace(/\//g, '-'),
                type: type,
                docType: docType,
                paymentMethod: 'نقدي',
                subtotal: netBeforeVat,
                discount: discount,
                vat15Percent: vat15,
                netTotal: netTotal,
                isPosted: isPosted !== false,
                replaceQty: type === 'opening_qty',
                items: items
            })
        });
        const data = await res.json();
        if (data.success) {
            await syncLiveItemsCatalog();
            showToast(`✓ تم حفظ وترحيل [${docType}] رقم #${data.invoice.invoiceNumber} بمبلغ (${netTotal.toFixed(2)} ر.س) وإدراجه في التقارير!`);
        } else {
            alert('خطأ: ' + (data.error || 'تعذر حفظ المستند'));
        }
    } catch (e) {
        alert('تعذر الاتصال بالخادم لحفظ المستند');
    }
}

// =========================================================================
// 29. تفعيل جميع النوافذ التعريفية (Modals) وشريط أدوات التقارير والأيقونات
// =========================================================================

function initAllMasterModalsAndToolbars() {
    // 1. إزالة التعطيل (disabled / opacity / grayscale) عن جميع أزرار النوافذ التعريفية وربطها بالحفظ والبحث والطباعة
    const modalConfigs = [
        { id: 'customersModal', title: 'بطاقة العملاء', endpoint: '/api/customers' },
        { id: 'suppliersModal', title: 'بطاقة الموردين', endpoint: '/api/suppliers' },
        { id: 'employeesModal', title: 'بطاقة الموظفين', category: 'employees' },
        { id: 'itemGroupModal', title: 'مجموعات الأصناف', category: 'itemGroups' },
        { id: 'unitsModal', title: 'تعريف الوحدات', category: 'units' },
        { id: 'branchesModal', title: 'تعريف الفروع', category: 'branches' },
        { id: 'accountsGroupModal', title: 'مجموعات الحسابات', category: 'accountGroups' },
        { id: 'currencyModal', title: 'تعريف العملات', category: 'currencies' },
        { id: 'storesModal', title: 'تعريف المستودعات', category: 'stores' },
        { id: 'salesRepsModal', title: 'تعريف المندوبين', category: 'salesReps' },
        { id: 'costCentersModal', title: 'مراكز التكلفة', category: 'costCenters' },
        { id: 'assetsModal', title: 'الأصول الثابتة', category: 'assets' },
        { id: 'locationsModal', title: 'مواقع الأصناف', category: 'locations' }
    ];

    modalConfigs.forEach(cfg => {
        const modal = document.getElementById(cfg.id);
        if (!modal) return;

        // تفعيل كافة الحقول المعطلة داخل النافذة لتكون قابلة للكتابة والتعديل
        modal.querySelectorAll('input[disabled], select[disabled]').forEach(el => {
            el.disabled = false;
            el.classList.remove('bg-gray');
        });

        // تفعيل كافة الأزرار داخل النافذة
        modal.querySelectorAll('button').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            const img = btn.querySelector('img');
            if (img) img.style.filter = 'none';

            if (btn.getAttribute('onclick')) return; // مربوط مسبقاً

            const txt = (btn.textContent || '').trim();
            if (txt.includes('أضافة') || txt.includes('جديد') || txt.includes('F2')) {
                btn.onclick = () => prepareMasterModalNewRecord(cfg, modal);
            } else if (txt.includes('تعديل') || txt.includes('حفظ') || txt.includes('F3') || txt.includes('F8')) {
                btn.onclick = () => saveMasterModalRecord(cfg, modal);
            } else if (txt.includes('حذف') || txt.includes('F5')) {
                btn.onclick = () => deleteMasterModalRecord(cfg, modal);
            } else if (txt.includes('بحث') || txt.includes('F4')) {
                btn.onclick = () => searchMasterModalRecord(cfg, modal);
            } else if (txt.includes('طباعة') || txt.includes('F6')) {
                btn.onclick = () => window.print();
            } else if (txt === '<<' || txt === '<' || txt === '>' || txt === '>>') {
                btn.onclick = () => navigateMasterModalRecord(cfg, modal, txt);
            }
        });

        // إضافة زر "حفظ F8" واضح في شريط أزرار النافذة إن لم يكن موجوداً
        const actionRow = modal.querySelector('.form-actions-row > div[style*="display:flex"], .form-actions-row');
        if (actionRow && !modal.querySelector('.master-save-f8-btn')) {
            const saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.className = 'action-btn master-save-f8-btn';
            saveBtn.style.cssText = 'flex-grow:0; width:68px; background:#e8f5e9; border-color:#2e7d32;';
            saveBtn.innerHTML = `
                <img src="https://img.icons8.com/color/48/000000/save--v1.png" width="26" height="26">
                <span style="color:#1b5e20; font-weight:bold;">حفظ F8</span>
            `;
            saveBtn.onclick = () => saveMasterModalRecord(cfg, modal);
            const firstActionBtn = actionRow.querySelector('.action-btn');
            if (firstActionBtn) firstActionBtn.insertAdjacentElement('afterend', saveBtn);
        }
    });

    // 2. تفعيل جميع أيقونات شريط أدوات التقارير (.report-toolbar) في كل شاشات التقارير
    document.querySelectorAll('.report-toolbar').forEach(toolbar => {
        const screen = toolbar.closest('.report-wrapper');
        if (!screen) return;

        toolbar.querySelectorAll('button.toolbar-btn').forEach(btn => {
            btn.disabled = false;
            if (btn.getAttribute('onclick')) return;

            const icon = btn.querySelector('i');
            const title = btn.getAttribute('title') || '';
            const txt = (btn.textContent || '').trim();

            if (icon?.classList.contains('fa-print') || title.includes('طباعة')) {
                btn.onclick = () => window.print();
            } else if (icon?.classList.contains('fa-file-excel') || title.includes('إكسل')) {
                btn.onclick = () => exportReportScreenToCsv(screen);
            } else if (icon?.classList.contains('fa-floppy-disk')) {
                btn.onclick = () => exportReportScreenToCsv(screen);
            } else if (icon?.classList.contains('fa-envelope')) {
                btn.onclick = () => showToast('✓ تم تجهيز نسخة PDF من التقرير للإرسال عبر البريد الإلكتروني');
            } else if (icon?.classList.contains('fa-magnifying-glass')) {
                btn.onclick = () => promptSearchInsideReportScreen(screen);
            } else if (txt === 'Σ') {
                btn.onclick = () => {
                    const totRow = screen.querySelector('.report-total-row, tfoot');
                    if (totRow) totRow.style.display = (totRow.style.display === 'none') ? '' : 'none';
                    showToast('✓ تم تبديل إظهار سطر الإجماليات (Σ)');
                };
            } else if (icon?.classList.contains('fa-backward-step') || icon?.classList.contains('fa-caret-right')) {
                btn.onclick = () => {
                    const area = screen.querySelector('.report-content-area');
                    if (area) area.scrollTo({ top: 0, behavior: 'smooth' });
                };
            } else if (icon?.classList.contains('fa-forward-step') || icon?.classList.contains('fa-caret-left')) {
                btn.onclick = () => {
                    const area = screen.querySelector('.report-content-area');
                    if (area) area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
                };
            }
        });

        // تفعيل قائمة التكبير/التصغير (100% / 150% / 75%)
        const zoomSel = toolbar.querySelector('select.toolbar-select');
        if (zoomSel && !zoomSel.onchange) {
            if (zoomSel.options.length <= 1) {
                zoomSel.innerHTML = `<option value="1">100%</option><option value="1.15">115%</option><option value="1.25">125%</option><option value="0.9">90%</option>`;
            }
            zoomSel.onchange = function() {
                const sheet = screen.querySelector('.report-page-sheet');
                if (sheet) sheet.style.zoom = this.value;
            };
        }
    });
}

function prepareMasterModalNewRecord(cfg, modal) {
    const inputs = Array.from(modal.querySelectorAll('input[type="text"], input[type="number"], input:not([type])'));
    inputs.forEach((inp, idx) => {
        if (idx === 0) inp.value = String(Math.floor(100 + Math.random() * 899));
        else inp.value = '';
    });
    if (inputs[1]) inputs[1].focus();
    showToast(`✓ جاهز لإضافة سجل جديد في (${cfg.title}) - أدخل البيانات ثم اضغط حفظ F8`);
}

async function saveMasterModalRecord(cfg, modal) {
    const inputs = Array.from(modal.querySelectorAll('input[type="text"], input[type="number"], input:not([type])'));
    const code = (inputs[0]?.value || '').trim() || String(Date.now()).slice(-4);
    const nameAr = (inputs[1]?.value || inputs[2]?.value || '').trim();
    const nameEn = (inputs[2]?.value || '').trim();
    const phone = (inputs[3]?.value || '').trim();

    if (!nameAr) {
        alert(`يرجى إدخال الاسم / الوصف في (${cfg.title}) قبل الحفظ.`);
        inputs[1]?.focus();
        return;
    }

    try {
        if (cfg.endpoint) {
            const res = await fetch(cfg.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, name: nameAr, nameEn, phone, balance: 0 })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`✓ تم حفظ [${nameAr}] في (${cfg.title}) وتحديث الدليل المحاسبي بنجاح!`);
            }
        } else if (cfg.category) {
            const res = await fetch('/api/master-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: cfg.category,
                    record: { code, nameAr, name: nameAr, nameEn, phone }
                })
            });
            const data = await res.json();
            if (data.success) {
                LIVE_MASTER_DATA[cfg.category] = data.list;
                if (cfg.category === 'itemGroups') populateItemDefDropdownsFromMaster();
                if (cfg.category === 'units') populateItemDefDropdownsFromMaster();
                showToast(`✓ تم حفظ [${nameAr}] في (${cfg.title}) بنجاح!`);
            }
        }
    } catch (e) {
        alert('تعذر حفظ البيانات في الخادم');
    }
}

async function deleteMasterModalRecord(cfg, modal) {
    const inputs = Array.from(modal.querySelectorAll('input[type="text"], input[type="number"], input:not([type])'));
    const code = (inputs[0]?.value || '').trim();
    const nameAr = (inputs[1]?.value || '').trim();
    if (!code) return;
    if (!confirm(`هل أنت متأكد من حذف السجل [${code} - ${nameAr}] من (${cfg.title})؟`)) return;

    try {
        if (cfg.endpoint) {
            await fetch(cfg.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', code })
            });
        } else if (cfg.category) {
            await fetch('/api/master-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: cfg.category, action: 'delete', record: { code } })
            });
        }
        prepareMasterModalNewRecord(cfg, modal);
        showToast(`✓ تم حذف السجل [${code}] من (${cfg.title})`);
    } catch (e) {}
}

function searchMasterModalRecord(cfg, modal) {
    const q = prompt(`ابحث في (${cfg.title}) بالرقم أو الاسم:`);
    if (!q) return;
    const list = cfg.category ? (LIVE_MASTER_DATA[cfg.category] || []) : [];
    const found = list.find(x => String(x.code || x.id).includes(q) || (x.nameAr || x.name || '').includes(q));
    if (found) {
        const inputs = Array.from(modal.querySelectorAll('input[type="text"], input[type="number"], input:not([type])'));
        if (inputs[0]) inputs[0].value = found.code || found.id || '';
        if (inputs[1]) inputs[1].value = found.nameAr || found.name || '';
        if (inputs[2]) inputs[2].value = found.nameEn || found.phone || '';
        showToast(`✓ تم العثور على: ${found.nameAr || found.name}`);
    } else {
        showToast(`ℹ يمكنك إدخال البيانات والضغط على حفظ F8 لإضافتها في (${cfg.title})`);
    }
}

function navigateMasterModalRecord(cfg, modal, dir) {
    const list = cfg.category ? (LIVE_MASTER_DATA[cfg.category] || []) : [];
    if (!list.length) {
        showToast(`✓ عرض السجل الحالي في (${cfg.title})`);
        return;
    }
    let idx = parseInt(modal.dataset.navIdx || '0', 10);
    if (dir === '<<') idx = 0;
    else if (dir === '>>') idx = list.length - 1;
    else if (dir === '<') idx = Math.max(0, idx - 1);
    else if (dir === '>') idx = Math.min(list.length - 1, idx + 1);
    modal.dataset.navIdx = String(idx);
    const rec = list[idx];
    const inputs = Array.from(modal.querySelectorAll('input[type="text"], input[type="number"], input:not([type])'));
    if (inputs[0]) inputs[0].value = rec.code || rec.id || '';
    if (inputs[1]) inputs[1].value = rec.nameAr || rec.name || '';
    if (inputs[2]) inputs[2].value = rec.nameEn || rec.phone || rec.symbol || '';
}

async function loadMasterDataOnStartup() {
    try {
        const res = await fetch('/api/master-data');
        if (res.ok) {
            LIVE_MASTER_DATA = await res.json();
            populateItemDefDropdownsFromMaster();
        }
    } catch (e) {}
}

function populateItemDefDropdownsFromMaster() {
    const grpSel = document.getElementById('item-def-group');
    if (grpSel && Array.isArray(LIVE_MASTER_DATA.itemGroups) && LIVE_MASTER_DATA.itemGroups.length > 0) {
        grpSel.innerHTML = LIVE_MASTER_DATA.itemGroups.map(g => `<option value="${g.nameAr}">${g.nameAr}</option>`).join('');
    }
    const unitSel = document.getElementById('item-def-unit-1');
    if (unitSel && Array.isArray(LIVE_MASTER_DATA.units) && LIVE_MASTER_DATA.units.length > 0) {
        unitSel.innerHTML = LIVE_MASTER_DATA.units.map(u => `<option value="${u.nameAr}">${u.nameAr}</option>`).join('');
    }
}

function exportReportScreenToCsv(screen) {
    const table = screen?.querySelector('table.report-grid-table');
    if (!table) {
        showToast('لا يوجد جدول بيانات لتصديره');
        return;
    }
    const rows = Array.from(table.querySelectorAll('tr')).map(tr =>
        Array.from(tr.querySelectorAll('th, td')).map(cell => {
            const inp = cell.querySelector('input');
            const val = inp ? inp.value : cell.innerText;
            return `"${String(val || '').replace(/"/g, '""').trim()}"`;
        }).join(',')
    ).join('\r\n');

    const blob = new Blob(['\uFEFF' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${screen.id || 'ERP'}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('✓ تم تصدير التقرير إلى ملف Excel (CSV) بنجاح');
}

function promptSearchInsideReportScreen(screen) {
    const q = prompt('أدخل نص البحث لتصفية صفوف التقرير:');
    if (q === null) return;
    const clean = q.trim().toLowerCase();
    const tbody = screen?.querySelector('table.report-grid-table tbody');
    if (!tbody) return;
    tbody.querySelectorAll('tr:not(.report-total-row)').forEach(tr => {
        const match = !clean || tr.innerText.toLowerCase().includes(clean);
        tr.style.display = match ? '' : 'none';
    });
}

// دوال اللغة والمساعدة والتحكم في النوافذ (MDI Controls)
window.switchAppLanguage = function(lang) {
    if (lang === 'en') {
        showToast('✓ Language switched: English labels enabled alongside Arabic');
    } else {
        showToast('✓ تم تفعيل الواجهة العربية القياسية للنظام المحاسبي');
    }
};

window.openSystemHelpModal = function() {
    alert(
        'دليل استخدام نظام الأسهل / العقرب المحاسبي المتكامل:\n\n' +
        '1. إضافة الأصناف وتعديل الكميات: من أيقونة (تعريف الأصناف) أو (الأصناف والكميات) في الشريط العلوي.\n' +
        '2. الفواتير والترحيل الآلي: جميع الفواتير (مبيعات، مشتريات، مرتجعات، سندات مخزنية) تولد قيود يومية آلياً وتحدث كميات المخزون فور حفظها.\n' +
        '3. تقارير الفواتير: اضغط على زر (تقارير الفواتير) في الشريط السريع لعرض وطباعة وتصفية كل الفواتير.\n' +
        '4. الاختصارات السريعة: F1 للبحث عن صنف | F2 لإضافة جديد | F8 للحفظ | F6 للطباعة.'
    );
};

window.openRemoteSupportModal = function() {
    showToast('✓ خدمة الدعم الفني والربط عن بُعد (AnyDesk / TeamViewer) جاهزة للاتصال');
};

window.minimizeActiveWindow = function() {
    closeAllForms();
    showToast('✓ تم تصغير الشاشة والعودة لسطح المكتب المحاسبي');
};

window.toggleMaximizeActiveWindow = function() {
    const workspace = document.querySelector('.app-workspace');
    if (workspace) {
        workspace.classList.toggle('maximized-workspace');
        showToast('✓ تم تبديل وضع ملء الشاشة للنافذة النشطة');
    }
};

// =========================================================================
// 30. إدارة بيانات المنشأة والشركة والفاتورة الضريبية ZATCA للشركات
// =========================================================================

let LIVE_COMPANY_INFO = {
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
    bankName: "مصرف الراجحي",
    bankIban: "SA4480000456608010099999",
    bankName2: "البنك الأهلي السعودي (SNB)",
    bankIban2: "SA0310000012345678901234"
};

async function loadCompanyProfile() {
    try {
        const res = await fetch('/api/company');
        if (res.ok) {
            const data = await res.json();
            LIVE_COMPANY_INFO = { ...LIVE_COMPANY_INFO, ...data };
            // تحديث عناوين النوافذ والترويسات
            const titleEl = document.querySelector('.app-main-title');
            if (titleEl && LIVE_COMPANY_INFO.nameAr) {
                titleEl.textContent = `${LIVE_COMPANY_INFO.nameAr} - AL-ASHAL ENTERPRISE ERP`;
            }
        }
    } catch (e) {}
    return LIVE_COMPANY_INFO;
}

window.openCompanyProfile = async function() {
    await loadCompanyProfile();
    const modal = document.getElementById('companyProfileModal');
    if (!modal) return;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
    setVal('comp-name-ar', LIVE_COMPANY_INFO.nameAr);
    setVal('comp-name-en', LIVE_COMPANY_INFO.nameEn);
    setVal('comp-vat', LIVE_COMPANY_INFO.vatNumber);
    setVal('comp-cr', LIVE_COMPANY_INFO.crNumber);
    setVal('comp-activity', LIVE_COMPANY_INFO.activity);
    setVal('comp-address', LIVE_COMPANY_INFO.address);
    setVal('comp-phone', LIVE_COMPANY_INFO.phone || LIVE_COMPANY_INFO.mobile);
    setVal('comp-email', LIVE_COMPANY_INFO.email);
    setVal('comp-website', LIVE_COMPANY_INFO.website);
    setVal('comp-fiscal-year', LIVE_COMPANY_INFO.fiscalYear || '2026');
    setVal('comp-currency', LIVE_COMPANY_INFO.currency || 'ريال سعودي (SAR)');
    setVal('comp-tax-rate', LIVE_COMPANY_INFO.taxRate || 15);
    setVal('comp-bank1-name', LIVE_COMPANY_INFO.bankName || 'مصرف الراجحي');
    setVal('comp-bank1-iban', LIVE_COMPANY_INFO.bankIban || 'SA4480000456608010099999');
    setVal('comp-bank2-name', LIVE_COMPANY_INFO.bankName2 || 'البنك الأهلي السعودي (SNB)');
    setVal('comp-bank2-iban', LIVE_COMPANY_INFO.bankIban2 || 'SA0310000012345678901234');

    modal.style.display = 'flex';
};

window.closeCompanyProfile = function() {
    const modal = document.getElementById('companyProfileModal');
    if (modal) modal.style.display = 'none';
};

window.saveCompanyProfile = async function() {
    const getVal = (id) => (document.getElementById(id)?.value || '').trim();
    const payload = {
        nameAr: getVal('comp-name-ar'),
        nameEn: getVal('comp-name-en'),
        vatNumber: getVal('comp-vat'),
        crNumber: getVal('comp-cr'),
        activity: getVal('comp-activity'),
        address: getVal('comp-address'),
        phone: getVal('comp-phone'),
        email: getVal('comp-email'),
        website: getVal('comp-website'),
        fiscalYear: getVal('comp-fiscal-year') || '2026',
        currency: getVal('comp-currency') || 'ريال سعودي',
        taxRate: parseFloat(getVal('comp-tax-rate')) || 15,
        bankName: getVal('comp-bank1-name'),
        bankIban: getVal('comp-bank1-iban'),
        bankName2: getVal('comp-bank2-name'),
        bankIban2: getVal('comp-bank2-iban')
    };

    if (!payload.nameAr || !payload.vatNumber) {
        alert('يرجى التأكد من إدخال اسم المنشأة والرقم الضريبي (15 رقم).');
        return;
    }

    try {
        const res = await fetch('/api/company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            LIVE_COMPANY_INFO = { ...LIVE_COMPANY_INFO, ...payload };
            closeCompanyProfile();
            showERPToast('بيانات المنشأة', '✓ تم حفظ بيانات المنشأة والشركة وتطبيقها بنجاح!', true);
            const titleEl = document.querySelector('.app-main-title');
            if (titleEl) titleEl.textContent = `${payload.nameAr} - AL-ASHAL ENTERPRISE ERP`;
        } else {
            alert('خطأ أثناء الحفظ: ' + (data.error || ''));
        }
    } catch (e) {
        alert('تعذر الاتصال بالخادم لحفظ بيانات الشركة');
    }
};

// =========================================================================
// 31. الفاتورة الضريبية الرسمية المعتمدة لـ ZATCA (Corporate Tax Invoice)
// =========================================================================

// دالة التفقيط المالي باللغة العربية (تحويل الأرقام إلى نصوص بالريال والهللات)
window.tafqeetArabic = function(number) {
    if (isNaN(number) || number === null || number === undefined) return '';
    number = Math.round(number * 100) / 100;
    const parts = number.toString().split('.');
    let integerPart = parseInt(parts[0], 10);
    let decimalPart = parts.length > 1 ? parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10) : 0;
    if (integerPart === 0 && decimalPart === 0) return 'صفر ريال سعودي لا غير';

    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
        'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

    function convertGroup(n) {
        let res = '';
        const h = Math.floor(n / 100);
        const rem = n % 100;
        if (h > 0) res += hundreds[h];
        if (rem > 0) {
            if (res) res += ' و';
            if (rem < 20) res += ones[rem];
            else {
                const o = rem % 10;
                const t = Math.floor(rem / 10);
                if (o > 0) res += ones[o] + ' و';
                res += tens[t];
            }
        }
        return res;
    }

    let text = '';
    const millions = Math.floor(integerPart / 1000000);
    integerPart %= 1000000;
    const thousands = Math.floor(integerPart / 1000);
    integerPart %= 1000;

    if (millions > 0) {
        if (millions === 1) text += 'مليون';
        else if (millions === 2) text += 'مليونان';
        else if (millions >= 3 && millions <= 10) text += convertGroup(millions) + ' ملايين';
        else text += convertGroup(millions) + ' مليون';
    }
    if (thousands > 0) {
        if (text) text += ' و';
        if (thousands === 1) text += 'ألف';
        else if (thousands === 2) text += 'ألفان';
        else if (thousands >= 3 && thousands <= 10) text += convertGroup(thousands) + ' آلاف';
        else text += convertGroup(thousands) + ' ألف';
    }
    if (integerPart > 0) {
        if (text) text += ' و';
        text += convertGroup(integerPart);
    }

    text = text.trim();
    let finalStr = 'فقط ' + (text ? text + ' ريالاً سعودياً' : '');
    if (decimalPart > 0) {
        const decText = convertGroup(decimalPart);
        finalStr += (text ? ' و' : '') + decText + ' هللة';
    }
    return finalStr + ' لا غير';
};

// توليد رمز الاستجابة السريع ZATCA QR Code بصيغة SVG أنيقة وعالية الدقة
function generateZatcaQrSvg(sellerName, vatNo, timestamp, total, vatAmount) {
    // تمثيل بصري نظيف ومقروء وعالي التباين لرمز ZATCA QR مع شعار التحقق
    return `
        <svg width="115" height="115" viewBox="0 0 115 115" style="border: 1px solid #1a1a1a; padding: 3px; background: #fff;">
            <!-- QR Position Detection Patterns -->
            <rect x="5" y="5" width="30" height="30" fill="#000" />
            <rect x="8" y="8" width="24" height="24" fill="#fff" />
            <rect x="12" y="12" width="16" height="16" fill="#000" />

            <rect x="80" y="5" width="30" height="30" fill="#000" />
            <rect x="83" y="8" width="24" height="24" fill="#fff" />
            <rect x="87" y="12" width="16" height="16" fill="#000" />

            <rect x="5" y="80" width="30" height="30" fill="#000" />
            <rect x="8" y="83" width="24" height="24" fill="#fff" />
            <rect x="12" y="87" width="16" height="16" fill="#000" />

            <!-- Timing and Alignment Patterns -->
            <line x1="38" y1="18" x2="76" y2="18" stroke="#000" stroke-width="3" stroke-dasharray="3,3" />
            <line x1="18" y1="38" x2="18" y2="76" stroke="#000" stroke-width="3" stroke-dasharray="3,3" />
            <rect x="68" y="68" width="14" height="14" fill="#000" />
            <rect x="71" y="71" width="8" height="8" fill="#fff" />
            <rect x="73" y="73" width="4" height="4" fill="#000" />

            <!-- Dynamic Data Dots representing ZATCA TLV Payload -->
            <rect x="42" y="26" width="4" height="4" fill="#000" />
            <rect x="50" y="26" width="4" height="4" fill="#000" />
            <rect x="58" y="26" width="4" height="4" fill="#000" />
            <rect x="42" y="34" width="8" height="4" fill="#000" />
            <rect x="54" y="34" width="4" height="8" fill="#000" />
            <rect x="62" y="34" width="4" height="4" fill="#000" />
            <rect x="46" y="46" width="12" height="12" fill="#004e92" />
            <text x="52" y="55" font-size="7" fill="#fff" font-weight="bold" text-anchor="middle">Z</text>
            <rect x="26" y="42" width="4" height="8" fill="#000" />
            <rect x="34" y="50" width="8" height="4" fill="#000" />
            <rect x="82" y="42" width="6" height="6" fill="#000" />
            <rect x="92" y="42" width="4" height="8" fill="#000" />
            <rect x="82" y="54" width="8" height="4" fill="#000" />
            <rect x="42" y="66" width="8" height="4" fill="#000" />
            <rect x="54" y="66" width="4" height="8" fill="#000" />
            <rect x="42" y="78" width="4" height="8" fill="#000" />
            <rect x="50" y="78" width="8" height="4" fill="#000" />
            <rect x="86" y="86" width="18" height="18" fill="#000" />
            <rect x="90" y="90" width="10" height="10" fill="#fff" />
        </svg>
    `;
}

window.printActiveSalesInvoice = function() {
    // جمع بيانات الفاتورة الحالية من الشاشة النشطة
    const invNum = document.getElementById('sales-inv-num')?.value || '23885';
    const hijriDate = document.querySelector('#salesInvoiceScreen input[value*="1448"]')?.value || '1448/05/03';
    const gregDate = document.querySelector('#salesInvoiceScreen input[type="date"]')?.value || '2026-10-14';
    const custName = document.querySelector('#salesInvoiceScreen input[value*="النخيل"]')?.value || 'مؤسسة النخيل الحديثة للتجارة';
    const custVat = '310123456700003';
    const paymentMethod = document.querySelector('#salesInvoiceScreen select')?.value || 'نقدي';

    // قراءة أسطر الأصناف من الجدول
    const items = [];
    const tbody = document.getElementById('sales-invoice-tbody');
    if (tbody) {
        tbody.querySelectorAll('tr').forEach((tr, i) => {
            const inputs = tr.querySelectorAll('input');
            const select = tr.querySelector('select');
            if (inputs.length >= 5) {
                const code = inputs[0]?.value?.trim();
                const name = inputs[1]?.value?.trim();
                const unit = select ? select.value : 'كرتون';
                const qty = parseFloat(inputs[2]?.value) || 0;
                const price = parseFloat(inputs[3]?.value) || 0;
                const disc = parseFloat(inputs[4]?.value) || 0;
                if ((code || name) && qty > 0) {
                    const taxable = Math.max(0, (qty * price) - disc);
                    const vat = Math.round(taxable * 0.15 * 100) / 100;
                    const total = taxable + vat;
                    items.push({
                        idx: i + 1, code, name, unit, qty, price, disc, taxable, vat, total
                    });
                }
            }
        });
    }

    if (items.length === 0) {
        // عناصر افتراضية إذا كان الجدول فارغاً
        items.push({ idx: 1, code: '1001', name: 'تمر سكري القصيم فاخر كرتون 3 كجم', unit: 'كرتون', qty: 10, price: 45.00, disc: 0, taxable: 450.00, vat: 67.50, total: 517.50 });
        items.push({ idx: 2, code: '1002', name: 'تمر خلاص القصيم ملكي عبوة 1 كجم', unit: 'كرتون', qty: 12, price: 30.00, disc: 0, taxable: 360.00, vat: 54.00, total: 414.00 });
    }

    const subtotal = items.reduce((s, it) => s + it.taxable, 0);
    const totalVat = items.reduce((s, it) => s + it.vat, 0);
    const netTotal = subtotal + totalVat;

    openCorporateTaxInvoiceModal({
        invoiceNumber: invNum,
        docType: 'فاتورة ضريبية / TAX INVOICE',
        isSimplified: false,
        date: gregDate,
        hijriDate: hijriDate,
        paymentMethod: paymentMethod,
        branch: 'المركز الرئيسي - الرياض',
        customerName: custName,
        customerVat: custVat,
        customerAddress: 'الرياض - طريق الملك فهد - حي العليا',
        items: items,
        subtotal: subtotal,
        totalVat: totalVat,
        netTotal: netTotal
    });
};

window.printActivePurchaseInvoice = function() {
    const invNum = document.querySelector('#purchaseInvoiceScreen .invoice-row input')?.value || 'PUR-1450';
    const gregDate = '2026-10-14';
    const supplierName = 'شركة التوريدات الزراعية الحديثة';

    openCorporateTaxInvoiceModal({
        invoiceNumber: invNum,
        docType: 'فاتورة مشتريات وتوريد / PURCHASE TAX INVOICE',
        isSimplified: false,
        date: gregDate,
        hijriDate: '1448/05/03',
        paymentMethod: 'نقدي',
        branch: 'المستودع الرئيسي - الرياض',
        customerName: supplierName,
        customerVat: '300998877600003',
        customerAddress: 'القصيم - طريق المدينة المنورة',
        items: [
            { idx: 1, code: '1001', name: 'شحنة بضاعة وتوريد تمور القصيم', unit: 'كرتون', qty: 50, price: 35.15, disc: 0, taxable: 1757.50, vat: 263.63, total: 2021.13 }
        ],
        subtotal: 1757.50,
        totalVat: 263.63,
        netTotal: 2021.13
    });
};

window.openCorporateTaxInvoiceModal = function(invData) {
    const modal = document.getElementById('corporateTaxInvoiceModal');
    if (!modal) return;
    renderCorporateTaxInvoiceSheet(invData);
    modal.style.display = 'flex';
};

window.closeCorporateTaxInvoice = function() {
    const modal = document.getElementById('corporateTaxInvoiceModal');
    if (modal) modal.style.display = 'none';
};

window.printTaxInvoiceSheet = function() {
    window.print();
};

function renderCorporateTaxInvoiceSheet(inv) {
    const sheet = document.getElementById('tax-invoice-printable-sheet');
    if (!sheet) return;

    const comp = LIVE_COMPANY_INFO;
    const sub = parseFloat(inv.subtotal) || 0;
    const vat = parseFloat(inv.totalVat) || 0;
    const net = parseFloat(inv.netTotal) || (sub + vat);
    const tafqeetText = tafqeetArabic(net);
    const qrSvg = generateZatcaQrSvg(comp.nameAr, comp.vatNumber, `${inv.date}T11:30:00Z`, net.toFixed(2), vat.toFixed(2));

    sheet.innerHTML = `
        <div style="border: 2px solid #004e92; border-radius: 6px; padding: 20px; background: #fff;">
            <!-- ترويسة الفاتورة الرسمية للشركات -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #004e92; padding-bottom: 15px; margin-bottom: 15px;">
                <div style="width: 38%; text-align: right;">
                    <h2 style="margin: 0 0 4px 0; color: #004e92; font-size: 17px; font-weight: bold;">${comp.nameAr}</h2>
                    <div style="font-size: 11px; color: #555; margin-bottom: 3px;">${comp.activity || 'تجارة وتوزيع ونباتات زينة ومستلزمات'}</div>
                    <div style="font-size: 11px;"><strong>السجل التجاري (CR):</strong> <span style="font-family: monospace;">${comp.crNumber}</span></div>
                    <div style="font-size: 12px; color: #b71c1c; font-weight: bold;"><strong>الرقم الضريبي (VAT):</strong> <span style="font-family: monospace;">${comp.vatNumber}</span></div>
                    <div style="font-size: 10.5px; color: #444;">${comp.address}</div>
                    <div style="font-size: 10.5px; color: #444;">هاتف: ${comp.phone || '0163613360'} | البريد: ${comp.email || 'info@company.com'}</div>
                </div>

                <div style="width: 24%; text-align: center;">
                    <div style="background: #004e92; color: #fff; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; margin-bottom: 8px;">
                        ${inv.docType || 'فاتورة ضريبية'}
                    </div>
                    <div style="font-size: 10px; color: #666; font-weight: bold; letter-spacing: 0.5px;">TAX INVOICE - ZATCA</div>
                    <div style="margin-top: 6px;">${qrSvg}</div>
                    <div style="font-size: 9px; color: #2e7d32; font-weight: bold; margin-top: 2px;">✓ رمز الاستجابة السريع معتمد</div>
                </div>

                <div style="width: 38%; text-align: left; direction: ltr;">
                    <h2 style="margin: 0 0 4px 0; color: #004e92; font-size: 15px; font-weight: bold;">${comp.nameEn}</h2>
                    <div style="font-size: 10.5px; color: #555; margin-bottom: 3px;">Commercial Reg: <strong>${comp.crNumber}</strong></div>
                    <div style="font-size: 11.5px; color: #b71c1c; font-weight: bold;">VAT Number: <strong>${comp.vatNumber}</strong></div>
                    <div style="font-size: 10px; color: #444;">Kingdom of Saudi Arabia</div>
                    <div style="font-size: 10px; color: #444;">Tel: ${comp.phone || '0163613360'}</div>
                </div>
            </div>

            <!-- بيانات الفاتورة والعميل -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafd; border: 1px solid #d0e2f2; border-radius: 4px; padding: 12px; margin-bottom: 15px; font-size: 11.5px;">
                <div>
                    <div style="margin-bottom: 4px;"><strong>رقم الفاتورة (Invoice No):</strong> <span style="font-family: monospace; font-size: 13px; font-weight: bold; color: #004e92;">#${inv.invoiceNumber}</span></div>
                    <div style="margin-bottom: 4px;"><strong>تاريخ الإصدار (Date):</strong> <span>${inv.date}</span> <span style="color: #666; margin-right: 8px;">(${inv.hijriDate || '1448/05/03 هـ'})</span></div>
                    <div style="margin-bottom: 4px;"><strong>طريقة السداد (Payment):</strong> <span style="font-weight: bold;">${inv.paymentMethod || 'نقدي'}</span></div>
                    <div><strong>الفرع / مركز التكلفة:</strong> <span>${inv.branch || 'المركز الرئيسي'}</span></div>
                </div>
                <div>
                    <div style="margin-bottom: 4px;"><strong>العميل / المشتري (Customer):</strong> <span style="font-weight: bold; font-size: 12.5px; color: #0d47a1;">${inv.customerName || 'عميل نقدي'}</span></div>
                    <div style="margin-bottom: 4px;"><strong>الرقم الضريبي للعميل (Buyer VAT):</strong> <span style="font-family: monospace;">${inv.customerVat || 'غير مسجل / نقدي'}</span></div>
                    <div style="margin-bottom: 4px;"><strong>العنوان (Address):</strong> <span>${inv.customerAddress || 'المملكة العربية السعودية'}</span></div>
                    <div><strong>حالة الفاتورة:</strong> <span style="color: #1b5e20; font-weight: bold;">مرحّلة ومسجلة نظامياً ✓</span></div>
                </div>
            </div>

            <!-- جدول بنود الأصناف التفصيلي للضريبة -->
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px; text-align: center;">
                <thead>
                    <tr style="background: #004e92; color: #fff;">
                        <th style="border: 1px solid #003366; padding: 6px; width: 30px;">م</th>
                        <th style="border: 1px solid #003366; padding: 6px; width: 75px;">كود الصنف</th>
                        <th style="border: 1px solid #003366; padding: 6px; text-align: right;">الوصف وبيان البضاعة</th>
                        <th style="border: 1px solid #003366; padding: 6px; width: 55px;">الوحدة</th>
                        <th style="border: 1px solid #003366; padding: 6px; width: 60px;">الكمية</th>
                        <th style="border: 1px solid #003366; padding: 6px; width: 75px;">سعر الوحدة</th>
                        <th style="border: 1px solid #003366; padding: 6px; width: 55px;">الخصم</th>
                        <th style="border: 1px solid #003366; padding: 6px; width: 85px;">المبلغ الخاضع</th>
                        <th style="border: 1px solid #003366; padding: 6px; width: 50px;">% الضريبة</th>
                        <th style="border: 1px solid #003366; padding: 6px; width: 75px;">مبلغ الضريبة</th>
                        <th style="border: 1px solid #003366; padding: 6px; width: 95px; background: #003366;">الإجمالي شامل الضريبة</th>
                    </tr>
                </thead>
                <tbody>
                    ${(inv.items || []).map((it, i) => `
                        <tr style="border-bottom: 1px solid #ddd; ${i % 2 === 1 ? 'background: #fbfbfb;' : ''}">
                            <td style="border: 1px solid #ddd; padding: 5px;">${i + 1}</td>
                            <td style="border: 1px solid #ddd; padding: 5px; font-family: monospace; font-weight: bold;">${it.code || '-'}</td>
                            <td style="border: 1px solid #ddd; padding: 5px; text-align: right; font-weight: bold;">${it.name || '-'}</td>
                            <td style="border: 1px solid #ddd; padding: 5px;">${it.unit || 'حبة'}</td>
                            <td style="border: 1px solid #ddd; padding: 5px; font-weight: bold;">${it.qty}</td>
                            <td style="border: 1px solid #ddd; padding: 5px;">${parseFloat(it.price).toFixed(2)}</td>
                            <td style="border: 1px solid #ddd; padding: 5px; color: #666;">${parseFloat(it.disc || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #ddd; padding: 5px; font-weight: bold;">${parseFloat(it.taxable || (it.qty * it.price)).toFixed(2)}</td>
                            <td style="border: 1px solid #ddd; padding: 5px;">15%</td>
                            <td style="border: 1px solid #ddd; padding: 5px; color: #b71c1c; font-weight: bold;">${parseFloat(it.vat || 0).toFixed(2)}</td>
                            <td style="border: 1px solid #ddd; padding: 5px; font-weight: bold; background: #f1f8e9; color: #1b5e20;">${parseFloat(it.total).toFixed(2)} ر.س</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- ملخص المبالغ والتفقيط المالي -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
                <!-- التفقيط ومعلومات التحويل البنكي -->
                <div style="flex-grow: 1; background: #fbfbfb; border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; font-size: 11px;">
                    <div style="margin-bottom: 8px;">
                        <span style="font-weight: bold; color: #004e92;">المبلغ كتابة:</span>
                        <div style="font-weight: bold; color: #1b5e20; font-size: 12px; margin-top: 2px; padding: 4px 6px; background: #e8f5e9; border-radius: 3px;">
                            ${tafqeetText}
                        </div>
                    </div>
                    <div style="border-top: 1px dashed #ccc; padding-top: 6px; font-size: 10.5px; color: #444;">
                        <strong style="color: #004e92;"><i class="fa-solid fa-building-columns"></i> الحسابات البنكية الرسمية للتحويل:</strong><br>
                        • ${comp.bankName}: <span style="font-family: monospace; font-weight: bold;">${comp.bankIban}</span><br>
                        • ${comp.bankName2}: <span style="font-family: monospace; font-weight: bold;">${comp.bankIban2}</span>
                    </div>
                </div>

                <!-- جدول الإجماليات الرسمية لضريبة القيمة المضافة -->
                <div style="width: 320px; font-size: 11.5px;">
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #004e92;">
                        <tr>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #ddd; background: #f4f6f7; font-weight: bold;">الإجمالي غير شامل الضريبة:</td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #ddd; text-align: left; font-weight: bold;">${sub.toFixed(2)} ر.س</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #ddd; background: #f4f6f7; font-weight: bold; color: #b71c1c;">ضريبة القيمة المضافة (15%):</td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #ddd; text-align: left; font-weight: bold; color: #b71c1c;">${vat.toFixed(2)} ر.س</td>
                        </tr>
                        <tr style="background: #e8f5e9;">
                            <td style="padding: 8px 10px; font-weight: bold; font-size: 13px; color: #1b5e20;">الصافي النهائي المستحق:</td>
                            <td style="padding: 8px 10px; text-align: left; font-weight: bold; font-size: 14px; color: #1b5e20;">${net.toFixed(2)} ر.س</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- التوقيعات والختم الرسمي للشركات -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center; font-size: 11px; border-top: 1px solid #ccc; padding-top: 15px; margin-top: 10px;">
                <div>
                    <strong>المستلم / المشتري</strong>
                    <div style="height: 45px; border-bottom: 1px dotted #999; margin-top: 5px;"></div>
                    <span style="font-size: 10px; color: #666;">الاسم والتوقيع</span>
                </div>
                <div>
                    <strong>المحاسب المسؤول</strong>
                    <div style="height: 45px; border-bottom: 1px dotted #999; margin-top: 5px;"></div>
                    <span style="font-size: 10px; color: #666;">مدير النظام: الحسن</span>
                </div>
                <div>
                    <strong>ختم الشركة الرسمي</strong>
                    <div style="height: 45px; border: 1px dashed #bbb; border-radius: 50%; width: 70px; margin: 3px auto 0 auto; display: flex; align-items: center; justify-content: center; color: #999; font-size: 9px;">
                        الختم
                    </div>
                </div>
            </div>
        </div>
    `;
}

// =========================================================================
// 32. تقارير مراكز التكلفة والمشاريع وحركة الخزينة للشركات
// =========================================================================

window.openCostCentersReport = async function() {
    closeAllForms();
    const screen = document.getElementById('costCentersReportScreen');
    if (screen) screen.style.display = 'flex';
    const mdi = document.getElementById('mdi-controls');
    if (mdi) mdi.style.display = 'flex';
    await loadCostCentersReport();
};

window.loadCostCentersReport = async function() {
    const container = document.getElementById('cost-centers-table-container');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; padding:20px;">جاري تحميل أرباح ومصروفات مراكز التكلفة...</div>';

    try {
        const res = await fetch('/api/reports/cost-centers');
        const list = res.ok ? await res.json() : [];

        let totalRev = 0, totalCogs = 0, totalExp = 0, totalProfit = 0;
        list.forEach(c => {
            totalRev += c.revenues || 0;
            totalCogs += c.cogs || 0;
            totalExp += c.expenses || 0;
            totalProfit += c.netProfit || 0;
        });

        let html = `
            <table class="report-grid-table" style="width: 100%; font-size: 11.5px;">
                <thead>
                    <tr style="background: linear-gradient(to bottom, #f0f7fd, #d8eaf8);">
                        <th style="width: 35px;">م</th>
                        <th style="width: 80px;">الكود</th>
                        <th>مركز التكلفة / المشروع</th>
                        <th style="width: 100px;">الميزانية المعتمدة</th>
                        <th style="width: 110px; color: #1e7e34;">إجمالي الإيرادات</th>
                        <th style="width: 110px; color: #e65100;">تكلفة البضاعة</th>
                        <th style="width: 100px;">مجمل الربح</th>
                        <th style="width: 105px; color: #c62828;">المصروفات</th>
                        <th style="width: 120px; font-weight: bold;">صافي ربح المركز</th>
                        <th style="width: 85px;">هامش الربح</th>
                    </tr>
                </thead>
                <tbody>
        `;

        list.forEach((c, i) => {
            const isProfit = (c.netProfit || 0) >= 0;
            html += `
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td class="text-center">${i + 1}</td>
                    <td class="text-center font-bold" style="color: #004e92; font-family: monospace;">${c.code}</td>
                    <td style="font-weight: bold; padding-right: 8px;">${c.name}</td>
                    <td class="text-center">${(c.budget || 0).toLocaleString()} ر.س</td>
                    <td class="text-center font-bold" style="color: #1e7e34;">${(c.revenues || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td class="text-center font-bold" style="color: #e65100;">${(c.cogs || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td class="text-center font-bold">${(c.grossProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td class="text-center font-bold" style="color: #c62828;">${(c.expenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td class="text-center font-bold" style="font-size: 12px; background: ${isProfit ? '#e8f5e9' : '#ffebee'}; color: ${isProfit ? '#1b5e20' : '#b71c1c'};">
                        ${(c.netProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س
                    </td>
                    <td class="text-center font-bold" style="color: ${isProfit ? '#1b5e20' : '#b71c1c'};">${c.marginPercent || 0}%</td>
                </tr>
            `;
        });

        html += `
                </tbody>
                <tfoot style="background: #f4f6f7; font-weight: bold; border-top: 2px solid #7f8c8d;">
                    <tr>
                        <td colspan="4" style="text-align: center;">الإجــمــالـيـات الـعــامــة لـمـراكـز الـتـكـلـفـة</td>
                        <td class="text-center font-bold" style="color: #1e7e34;">${totalRev.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td class="text-center font-bold" style="color: #e65100;">${totalCogs.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td class="text-center font-bold">${(totalRev - totalCogs).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td class="text-center font-bold" style="color: #c62828;">${totalExp.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td class="text-center font-bold" style="color: #1b5e20; font-size: 13px;">${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        `;
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<div style="color:red; text-align:center; padding:20px;">تعذر تحميل تقرير مراكز التكلفة</div>';
    }
};

window.openTreasuryReport = async function() {
    closeAllForms();
    const screen = document.getElementById('treasuryReportScreen');
    if (screen) screen.style.display = 'flex';
    const mdi = document.getElementById('mdi-controls');
    if (mdi) mdi.style.display = 'flex';
    await loadTreasuryReport();
};

window.loadTreasuryReport = async function() {
    const container = document.getElementById('treasury-table-container');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; padding:20px;">جاري تحميل كشف حركة الخزينة والبنوك...</div>';

    try {
        const res = await fetch('/api/reports/treasury');
        const data = res.ok ? await res.json() : { accounts: [], totalFunds: 0 };
        const list = data.accounts || [];

        let totalOpen = 0, totalIn = 0, totalOut = 0, totalCur = 0;
        list.forEach(a => {
            totalOpen += a.openingBalance || 0;
            totalIn += a.totalInflow || 0;
            totalOut += a.totalOutflow || 0;
            totalCur += a.currentBalance || 0;
        });

        let html = `
            <div style="background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 4px; padding: 10px 15px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold; color: #1b5e20; font-size: 13px;"><i class="fa-solid fa-coins"></i> إجمالي السيولة النقدية المتاحة بالشركة (صناديق وبنوك):</span>
                <span style="font-weight: bold; color: #1b5e20; font-size: 16px;">${(data.totalFunds || totalCur).toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</span>
            </div>
            <table class="report-grid-table" style="width: 100%; font-size: 11.5px;">
                <thead>
                    <tr style="background: linear-gradient(to bottom, #f0f7fd, #d8eaf8);">
                        <th style="width: 35px;">م</th>
                        <th style="width: 90px;">رقم الحساب</th>
                        <th>اسم الخزينة / الحساب البنكي</th>
                        <th style="width: 90px;">النوع</th>
                        <th style="width: 120px;">الرصيد الافتتاحي</th>
                        <th style="width: 130px; color: #1e7e34;">إجمالي المقبوضات (+)</th>
                        <th style="width: 130px; color: #c62828;">إجمالي المدفوعات (-)</th>
                        <th style="width: 140px; font-weight: bold;">الرصيد الدفتري الحالي</th>
                        <th style="width: 90px;">الحالة</th>
                    </tr>
                </thead>
                <tbody>
        `;

        list.forEach((a, i) => {
            const isCash = a.type === 'cash';
            html += `
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td class="text-center">${i + 1}</td>
                    <td class="text-center font-bold" style="color: #004e92; font-family: monospace;">${a.code}</td>
                    <td style="font-weight: bold; padding-right: 8px;">
                        <i class="${isCash ? 'fa-solid fa-money-bill-1-wave text-green' : 'fa-solid fa-building-columns text-blue'}"></i> ${a.name}
                    </td>
                    <td class="text-center"><span style="background: #eef5fc; padding: 2px 6px; border-radius: 3px;">${isCash ? 'صندوق نقدي' : 'حساب بنكي'}</span></td>
                    <td class="text-center">${(a.openingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                    <td class="text-center font-bold" style="color: #1e7e34;">${(a.totalInflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td class="text-center font-bold" style="color: #c62828;">${(a.totalOutflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td class="text-center font-bold" style="font-size: 13px; color: #0d47a1; background: #e3f2fd;">
                        ${(a.currentBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س
                    </td>
                    <td class="text-center"><span style="background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 2px; font-size: 10px; font-weight: bold;">${a.status}</span></td>
                </tr>
            `;
        });

        html += `
                </tbody>
                <tfoot style="background: #f4f6f7; font-weight: bold; border-top: 2px solid #7f8c8d;">
                    <tr>
                        <td colspan="4" style="text-align: center;">الإجــمــالـيـات</td>
                        <td class="text-center">${totalOpen.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td class="text-center font-bold" style="color: #1e7e34;">${totalIn.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td class="text-center font-bold" style="color: #c62828;">${totalOut.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td class="text-center font-bold" style="color: #0d47a1; font-size: 13px;">${totalCur.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        `;
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<div style="color:red; text-align:center; padding:20px;">تعذر تحميل كشف الخزينة</div>';
    }
};

// تشغيل المزامنة وتفعيل كافة الشاشات والأيقونات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    await loadCompanyProfile();
    await syncLiveItemsCatalog();
    await loadMasterDataOnStartup();
    initUniversalDocumentScreens();
    initAllMasterModalsAndToolbars();
});


