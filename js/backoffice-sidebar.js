/*
 * CHAIXI BAMEEKIAO — Back Office Sidebar
 * ------------------------------------------------------------
 * Single source of truth for Back Office navigation.
 *
 * UX:
 * - แสดงเฉพาะ "หัวข้อ" ของแต่ละหมวดเป็นค่าเริ่มต้น
 * - กดหัวข้อเพื่อเปิดเมนูในหมวดนั้น
 * - เปิดได้ทีละ 1 หมวด (Accordion)
 * - จำหมวดที่เปิดไว้ระหว่างเปลี่ยนหน้าใน session เดียวกัน
 *
 * To add / rename / reorder a menu:
 * edit NAV_SECTIONS below only.
 *
 * Pages with:
 *   <nav data-backoffice-nav></nav>
 * will receive the same sidebar automatically.
 */

const SIDEBAR_OPEN_KEY = 'chaixi_backoffice_open_nav_section'

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

function isCurrentPage(itemPath, projectRoot) {
    const current = normalizePath(window.location.pathname)
    const target = normalizePath(`${projectRoot}${itemPath}`)
    return current === target
}

function ensureSidebarStyles(projectRoot) {
    if (document.querySelector('link[data-chaixi-sidebar-css]')) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `${projectRoot}css/backoffice-sidebar.css?v=4.16.0`
    link.dataset.chaixiSidebarCss = 'true'
    document.head.appendChild(link)
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

function getStoredOpenSection() {
    try {
        return sessionStorage.getItem(SIDEBAR_OPEN_KEY)
    } catch (_) {
        return null
    }
}

function setStoredOpenSection(sectionKey) {
    try {
        if (sectionKey) {
            sessionStorage.setItem(SIDEBAR_OPEN_KEY, sectionKey)
        } else {
            sessionStorage.removeItem(SIDEBAR_OPEN_KEY)
        }
    } catch (_) {}
}

function setSectionOpen(sectionEl, open) {
    const button = sectionEl.querySelector('.nav-section-toggle')
    const items = sectionEl.querySelector('.nav-section-items')

    sectionEl.classList.toggle('is-open', open)
    button?.setAttribute('aria-expanded', open ? 'true' : 'false')

    if (items) {
        items.hidden = !open
    }
}

function closeAllSections(nav, exceptSection = null) {
    nav.querySelectorAll('.nav-section').forEach(sectionEl => {
        if (sectionEl !== exceptSection) {
            setSectionOpen(sectionEl, false)
        }
    })
}

function toggleSection(nav, sectionEl) {
    const willOpen = !sectionEl.classList.contains('is-open')

    closeAllSections(nav, sectionEl)
    setSectionOpen(sectionEl, willOpen)

    setStoredOpenSection(
        willOpen ? sectionEl.dataset.sectionKey : null
    )
}

function createSection(section, projectRoot, nav) {
    const sectionEl = document.createElement('div')
    sectionEl.className = 'nav-section'
    sectionEl.dataset.sectionKey = section.key

    const hasCurrentPage = section.items.some(item =>
        isCurrentPage(item.path, projectRoot)
    )

    if (hasCurrentPage) {
        sectionEl.classList.add('has-current-page')
    }

    const titleButton = document.createElement('button')
    titleButton.type = 'button'
    titleButton.className = 'nav-section-toggle'
    titleButton.setAttribute('aria-expanded', 'false')

    const titleLeft = document.createElement('span')
    titleLeft.className = 'nav-section-toggle-label'
    titleLeft.textContent = `${section.icon || '•'} ${section.title}`

    const chevron = document.createElement('span')
    chevron.className = 'nav-section-chevron'
    chevron.setAttribute('aria-hidden', 'true')
    chevron.textContent = '⌄'

    titleButton.append(titleLeft, chevron)

    const itemsEl = document.createElement('div')
    itemsEl.className = 'nav-section-items'
    itemsEl.hidden = true

    for (const item of section.items) {
        itemsEl.appendChild(createNavLink(item, projectRoot))
    }

    titleButton.addEventListener('click', () => {
        toggleSection(nav, sectionEl)
    })

    sectionEl.append(titleButton, itemsEl)

    return sectionEl
}

function restoreOpenSection(nav) {
    const storedKey = getStoredOpenSection()
    if (!storedKey) return

    const sectionEl = nav.querySelector(
        `.nav-section[data-section-key="${CSS.escape(storedKey)}"]`
    )

    if (sectionEl) {
        setSectionOpen(sectionEl, true)
    }
}

function renderBackofficeNav() {
    const nav = document.querySelector('[data-backoffice-nav]')
    if (!nav) return

    const projectRoot = getProjectRootPath()
    ensureSidebarStyles(projectRoot)

    const fragment = document.createDocumentFragment()

    for (const section of NAV_SECTIONS) {
        fragment.appendChild(createSection(section, projectRoot, nav))
    }

    nav.replaceChildren(fragment)

    // ค่าเริ่มต้น: ปิดทุกหมวด
    // ถ้าผู้ใช้เปิดหมวดไว้ก่อนเปลี่ยนหน้า จะคืนสถานะหมวดนั้นให้
    restoreOpenSection(nav)
}

renderBackofficeNav()
