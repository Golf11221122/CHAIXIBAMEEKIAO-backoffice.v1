/*
 * CHAIXI BAMEEKIAO — Back Office Navigation
 * Phase: Category Sidebar + Top Sub Navigation
 *
 * UX:
 * - Sidebar shows ONLY main categories.
 * - Clicking a category goes to the first page in that category.
 * - The current category is highlighted.
 * - Sub-pages for the current category are shown in a compact top bar.
 * - One navigation source for the entire Back Office.
 */

const NAV_SECTIONS = [
    {
        key: 'overview',
        title: 'ภาพรวม',
        icon: '🏠',
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
        key: 'delivery-qr',
        title: 'Delivery & QR Order',
        icon: '🛵',
        items: [
            { key: 'delivery', label: '🛵 Delivery Center', path: 'finance/delivery.html' },
            { key: 'self-orders', label: '📱 QR Self Order', path: 'finance/self-orders.html' },
            { key: 'self-order-history', label: '🧾 QR Order History', path: 'finance/self-order-history.html' }
        ]
    },
    {
        key: 'finance',
        title: 'Finance',
        icon: '💰',
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
        key: 'stock-cost',
        title: 'Stock & Cost',
        icon: '📦',
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
        key: 'purchasing',
        title: 'Purchasing',
        icon: '🛒',
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

function itemHref(item, projectRoot) {
    return `${projectRoot}${item.path}`
}

function isCurrentPage(item, projectRoot) {
    return normalizePath(window.location.pathname) ===
        normalizePath(itemHref(item, projectRoot))
}

function findCurrentSection(projectRoot) {
    for (const section of NAV_SECTIONS) {
        if (section.items.some(item => isCurrentPage(item, projectRoot))) {
            return section
        }
    }

    return NAV_SECTIONS[0]
}

function ensureNavigationStyles(projectRoot) {
    if (document.querySelector('link[data-chaixi-sidebar-css]')) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `${projectRoot}css/backoffice-sidebar.css?v=4.17.0`
    link.dataset.chaixiSidebarCss = 'true'
    document.head.appendChild(link)
}

function renderSidebar(projectRoot, currentSection) {
    const nav = document.querySelector('[data-backoffice-nav]')
    if (!nav) return

    const fragment = document.createDocumentFragment()

    for (const section of NAV_SECTIONS) {
        const firstItem = section.items[0]
        const link = document.createElement('a')

        link.className = 'nav-category-link'
        link.dataset.sectionKey = section.key
        link.href = itemHref(firstItem, projectRoot)

        if (section.key === currentSection.key) {
            link.classList.add('active')
            link.setAttribute('aria-current', 'true')
        }

        const icon = document.createElement('span')
        icon.className = 'nav-category-icon'
        icon.textContent = section.icon

        const label = document.createElement('span')
        label.className = 'nav-category-label'
        label.textContent = section.title

        const arrow = document.createElement('span')
        arrow.className = 'nav-category-arrow'
        arrow.textContent = '›'
        arrow.setAttribute('aria-hidden', 'true')

        link.append(icon, label, arrow)
        fragment.appendChild(link)
    }

    nav.replaceChildren(fragment)
}

function renderTopSubNav(projectRoot, currentSection) {
    const content = document.querySelector('.content')
    if (!content) return

    document.querySelector('.backoffice-subnav')?.remove()

    const shell = document.createElement('section')
    shell.className = 'backoffice-subnav'
    shell.setAttribute('aria-label', `${currentSection.title} navigation`)

    const title = document.createElement('div')
    title.className = 'backoffice-subnav-title'

    const titleIcon = document.createElement('span')
    titleIcon.textContent = currentSection.icon

    const titleText = document.createElement('strong')
    titleText.textContent = currentSection.title

    title.append(titleIcon, titleText)

    const scroller = document.createElement('div')
    scroller.className = 'backoffice-subnav-scroll'

    for (const item of currentSection.items) {
        const link = document.createElement('a')
        link.className = 'backoffice-subnav-link'
        link.href = itemHref(item, projectRoot)
        link.textContent = item.label

        if (isCurrentPage(item, projectRoot)) {
            link.classList.add('active')
            link.setAttribute('aria-current', 'page')
        }

        scroller.appendChild(link)
    }

    shell.append(title, scroller)
    content.prepend(shell)

    requestAnimationFrame(() => {
        const active = shell.querySelector('.backoffice-subnav-link.active')
        active?.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'center'
        })
    })
}

function initBackofficeNavigation() {
    const nav = document.querySelector('[data-backoffice-nav]')
    if (!nav) return

    const projectRoot = getProjectRootPath()
    const currentSection = findCurrentSection(projectRoot)

    ensureNavigationStyles(projectRoot)
    renderSidebar(projectRoot, currentSection)
    renderTopSubNav(projectRoot, currentSection)
}

initBackofficeNavigation()
