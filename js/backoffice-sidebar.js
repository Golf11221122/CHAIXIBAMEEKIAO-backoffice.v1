/*
 * CHAIXI BAMEEKIAO — Back Office Sidebar
 * ------------------------------------------------------------
 * Single source of truth for the Back Office navigation.
 *
 * To add / rename / reorder a menu in the future:
 * edit NAV_SECTIONS below only.
 *
 * Pages with:
 *   <nav data-backoffice-nav></nav>
 * will receive the same sidebar automatically.
 */

const NAV_SECTIONS = [
    {
        title: 'ภาพรวม',
        items: [
            { key: 'dashboard', label: '📊 Dashboard', path: 'dashboard.html' },
            { key: 'financial-summary', label: '🧭 Financial Summary', path: 'finance/financial-summary.html' },
            { key: 'kpi-targets', label: '🎯 KPI & Targets', path: 'finance/kpi-targets.html' },
            { key: 'daily-closing', label: '🌙 Daily Closing', path: 'finance/daily-closing.html' },
            { key: 'end-of-day', label: '🔐 End of Day', path: 'finance/end-of-day.html' },
            { key: 'sales-history', label: '🧾 ประวัติยอดขาย', path: 'finance/sales-history.html' }
        ]
    },
    {
        title: 'Delivery & QR Order',
        items: [
            { key: 'delivery', label: '🛵 Delivery Center', path: 'finance/delivery.html' },
            { key: 'self-orders', label: '📱 QR Self Order', path: 'finance/self-orders.html' },
            { key: 'self-order-history', label: '🧾 QR Order History', path: 'finance/self-order-history.html' }
        ]
    },
    {
        title: 'Finance',
        items: [
            { key: 'expenses', label: '🧾 ค่าใช้จ่าย', path: 'finance/expenses.html' },
            { key: 'pnl', label: '📈 P&L', path: 'finance/pnl.html' },
            { key: 'accounts-payable', label: '💸 Accounts Payable', path: 'finance/accounts-payable.html' },
            { key: 'payment-forecast', label: '📅 Payment Forecast', path: 'finance/payment-forecast.html' },
            { key: 'cash-flow', label: '💵 Cash Flow', path: 'finance/cash-flow.html' },
            { key: 'reconciliation', label: '💳 กระทบยอดการขาย', path: 'finance/reconciliation.html' },
            { key: 'bank-cash-reconciliation', label: '🏦 Bank / Cash Reconciliation', path: 'finance/bank-cash-reconciliation.html' },
            { key: 'cost-quality', label: '🧪 Cost Data Quality', path: 'finance/cost-quality.html' },
            { key: 'cost-fix', label: '🛠 Cost Fix Center', path: 'finance/cost-fix.html' },
            { key: 'bulk-cost-sync', label: '🔄 Bulk Cost Sync', path: 'finance/bulk-cost-sync.html' }
        ]
    },
    {
        title: 'Stock & Cost',
        items: [
            { key: 'ingredients', label: '📦 วัตถุดิบ / Stock', path: 'stock/ingredients.html' },
            { key: 'ingredient-categories', label: '🗂️ หมวดวัตถุดิบ', path: 'stock/categories.html' },
            { key: 'movements', label: '🔄 Stock Movement', path: 'stock/movements.html' },
            { key: 'waste-loss', label: '🗑️ Waste / Loss', path: 'stock/waste-loss.html' },
            { key: 'recipes', label: '🍳 Recipe / BOM', path: 'stock/recipes.html' },
            { key: 'production', label: '🏭 Production / Prep', path: 'stock/production.html' },
            { key: 'count', label: '🧮 Stock Count', path: 'stock/count.html' },
            { key: 'closing', label: '🔒 ปิดรอบ Stock', path: 'stock/closing.html' },
            { key: 'reports', label: '📈 Stock Report', path: 'stock/reports.html' },
            { key: 'cost-control', label: '💰 Cost Control', path: 'stock/cost-control.html' }
        ]
    },
    {
        title: 'Purchasing',
        items: [
            { key: 'suppliers', label: '🚚 Supplier', path: 'purchasing/suppliers.html' },
            { key: 'purchase-orders', label: '🛒 Purchase Orders', path: 'purchasing/purchase-orders.html' },
            { key: 'purchase-documents', label: '🧾 Purchase Documents', path: 'purchasing/purchase-documents.html' },
            { key: 'purchase-returns', label: '↩️ Purchase Returns', path: 'purchasing/purchase-returns.html' }
        ]
    }
]

function getProjectRootPath() {
    const pathname = window.location.pathname
    const nestedMarkers = ['/finance/', '/stock/', '/purchasing/']

    for (const marker of nestedMarkers) {
        const index = pathname.indexOf(marker)
        if (index >= 0) {
            return pathname.slice(0, index + 1)
        }
    }

    return pathname.slice(0, pathname.lastIndexOf('/') + 1)
}

function normalizePath(pathname) {
    return decodeURIComponent(pathname)
        .replace(/\/+/g, '/')
        .replace(/\/index\.html$/i, '/')
}

function isCurrentPage(itemPath, projectRoot) {
    const current = normalizePath(window.location.pathname)
    const target = normalizePath(`${projectRoot}${itemPath}`)
    return current === target
}

function createNavLink(item, projectRoot) {
    const link = document.createElement('a')
    link.className = 'nav-link'
    link.dataset.nav = item.key
    link.href = `${projectRoot}${item.path}`
    link.textContent = item.label

    if (isCurrentPage(item.path, projectRoot)) {
        link.classList.add('active')
        link.setAttribute('aria-current', 'page')
    }

    return link
}

function renderBackofficeNav() {
    const nav = document.querySelector('[data-backoffice-nav]')
    if (!nav) return

    const projectRoot = getProjectRootPath()
    const fragment = document.createDocumentFragment()

    for (const section of NAV_SECTIONS) {
        const sectionEl = document.createElement('div')
        sectionEl.className = 'nav-section'

        const titleEl = document.createElement('div')
        titleEl.className = 'nav-title'
        titleEl.textContent = section.title
        sectionEl.appendChild(titleEl)

        for (const item of section.items) {
            sectionEl.appendChild(createNavLink(item, projectRoot))
        }

        fragment.appendChild(sectionEl)
    }

    nav.replaceChildren(fragment)
}

renderBackofficeNav()
