import { supabase } from './supabase.js'
import { requireBackoffice, setupShell, money, esc } from './auth.js'

const $ = id => document.getElementById(id)

const state = {
    ctx: null,
    branchId: null,
    platforms: [],
    orders: [],
    mappings: [],
    settlements: [],
    modifierMappings: [],
    modifierSourceRows: [],
    modifierChoices: new Map()
}

function localDate(value = new Date()) {
    const d = new Date(value)
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0')
    ].join('-')
}

function startOfMonth() {
    const d = new Date()
    d.setDate(1)
    return localDate(d)
}

function dateTime(value) {
    if (!value) return '-'
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(value))
}

function shortDate(value) {
    if (!value) return '-'
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'short'
    }).format(new Date(`${value}T00:00:00`))
}

function num(value) {
    const n = Number(value || 0)
    return Number.isFinite(n) ? n : 0
}

function setMessage(text = '', type = '') {
    const el = $('deliveryMessage')
    el.textContent = text
    el.className = `delivery-message ${type}`.trim()
}

function platformCode(row) {
    return row?.delivery_platforms?.code || ''
}

function platformName(row) {
    return row?.delivery_platforms?.name || '-'
}

function badge(text, tone = 'neutral') {
    return `<span class="delivery-status status-${tone}">${esc(text)}</span>`
}

function orderStatusBadge(status) {
    const map = {
        received: ['Received', 'info'],
        accepted: ['Accepted', 'info'],
        preparing: ['Preparing', 'warn'],
        ready: ['Ready', 'warn'],
        completed: ['Completed', 'ok'],
        cancelled: ['Cancelled', 'bad'],
        rejected: ['Rejected', 'bad']
    }
    const item = map[status] || [status || '-', 'neutral']
    return badge(item[0], item[1])
}

function settlementBadge(status) {
    const map = {
        matched: ['ตรง', 'ok'],
        paid: ['จ่ายแล้ว', 'ok'],
        pending: ['รอตรวจ', 'warn'],
        difference: ['มีส่วนต่าง', 'bad'],
        cancelled: ['ยกเลิก', 'neutral']
    }
    const item = map[status] || [status || '-', 'neutral']
    return badge(item[0], item[1])
}

function syncBadge(status) {
    const map = {
        synced: ['Synced', 'ok'],
        pending: ['Pending', 'warn'],
        error: ['Error', 'bad'],
        disabled: ['Disabled', 'neutral']
    }
    const item = map[status] || [status || '-', 'neutral']
    return badge(item[0], item[1])
}

function activateTabs() {
    document.querySelectorAll('.delivery-tab').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.delivery-tab')
                .forEach(x => x.classList.remove('active'))

            document.querySelectorAll('.delivery-pane')
                .forEach(x => x.classList.remove('active'))

            button.classList.add('active')
            $(button.dataset.tab)?.classList.add('active')
        })
    })
}

async function loadPlatforms() {
    const { data, error } = await supabase
        .from('delivery_platforms')
        .select('id,code,name,is_active')
        .eq('is_active', true)
        .order('name')

    if (error) throw error
    state.platforms = data || []
}

function getPlatformId(code) {
    if (!code) return null
    return state.platforms.find(x => x.code === code)?.id || null
}

async function loadOrders() {
    setMessage('กำลังโหลด Delivery Orders...')

    let query = supabase
        .from('delivery_orders')
        .select(`
            id,
            branch_id,
            platform_id,
            external_order_id,
            external_display_id,
            sale_id,
            restaurant_order_id,
            order_status,
            payment_status,
            customer_name,
            customer_note,
            subtotal,
            merchant_discount,
            platform_discount,
            service_fee,
            commission_fee,
            other_fee,
            gross_sales,
            expected_settlement,
            ordered_at,
            created_at,
            delivery_platforms (
                id,
                code,
                name
            )
        `)
        .eq('branch_id', state.branchId)
        .order('ordered_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500)

    const from = $('dateFrom').value
    const to = $('dateTo').value
    const platform = $('platformFilter').value
    const status = $('orderStatusFilter').value

    if (from) {
        query = query.gte('ordered_at', `${from}T00:00:00`)
    }

    if (to) {
        query = query.lte('ordered_at', `${to}T23:59:59.999`)
    }

    const platformId = getPlatformId(platform)
    if (platformId) {
        query = query.eq('platform_id', platformId)
    }

    if (status) {
        query = query.eq('order_status', status)
    }

    const { data, error } = await query

    if (error) {
        setMessage(error.message, 'bad')
        throw error
    }

    state.orders = data || []
    renderOrders()
    updateKpis()
    setMessage(`โหลด ${state.orders.length.toLocaleString('th-TH')} ออเดอร์แล้ว`, 'ok')
}

function renderOrders() {
    const rows = state.orders.map(order => {
        let posStatus = badge('ยังไม่เข้า POS', 'neutral')

        if (order.sale_id) {
            posStatus = badge('บันทึกขายแล้ว', 'ok')
        } else if (order.restaurant_order_id) {
            posStatus = badge('เข้าครัวแล้ว', 'info')
        }

        const blocked =
            ['cancelled', 'rejected'].includes(order.order_status)

        let actionHtml = ''

        if (order.sale_id) {
            actionHtml = badge('เสร็จแล้ว', 'ok')
        } else if (order.restaurant_order_id) {
            actionHtml = `
                <button
                    class="delivery-action primary finalize-delivery-btn"
                    data-id="${esc(order.id)}"
                    data-label="${esc(order.external_display_id || order.external_order_id)}"
                >
                    บันทึกขาย / ตัด Stock
                </button>
            `
        } else if (blocked) {
            actionHtml = badge('ส่งไม่ได้', 'bad')
        } else {
            actionHtml = `
                <button
                    class="delivery-action primary dispatch-delivery-btn"
                    data-id="${esc(order.id)}"
                    data-label="${esc(order.external_display_id || order.external_order_id)}"
                >
                    ส่งเข้าครัว
                </button>
            `
        }

        const detail = [
            order.customer_name ? `ลูกค้า: ${esc(order.customer_name)}` : '',
            order.customer_note ? `หมายเหตุ: ${esc(order.customer_note)}` : '',
            order.restaurant_order_id
                ? `Restaurant Order: ${esc(order.restaurant_order_id)}`
                : '',
            `Gross: ${money(order.gross_sales)}`,
            `Fee: ${money(num(order.service_fee) + num(order.other_fee))}`
        ].filter(Boolean).join('<br>')

        return `
            <tr>
                <td>${dateTime(order.ordered_at || order.created_at)}</td>
                <td>${esc(platformName(order))}</td>
                <td>
                    <strong>${esc(order.external_display_id || order.external_order_id)}</strong>
                    <br><small>${esc(order.external_order_id)}</small>
                </td>
                <td>${orderStatusBadge(order.order_status)}</td>
                <td class="num">${money(order.subtotal)}</td>
                <td class="num">${money(order.merchant_discount)}</td>
                <td class="num">${money(order.platform_discount)}</td>
                <td class="num">${money(order.commission_fee)}</td>
                <td class="num"><strong>${money(order.expected_settlement)}</strong></td>
                <td>${posStatus}</td>
                <td>${actionHtml}</td>
                <td class="delivery-detail">${detail}</td>
            </tr>
        `
    }).join('')

    $('orderRows').innerHTML = rows ||
        '<tr><td colspan="12">ไม่พบ Delivery Order ในช่วงที่เลือก</td></tr>'

    document.querySelectorAll('.dispatch-delivery-btn').forEach(button => {
        button.addEventListener('click', () => {
            dispatchDeliveryOrder(
                button.dataset.id,
                button.dataset.label,
                button
            )
        })
    })

    document.querySelectorAll('.finalize-delivery-btn').forEach(button => {
        button.addEventListener('click', () => {
            finalizeDeliverySale(
                button.dataset.id,
                button.dataset.label,
                button
            )
        })
    })
}

async function getCurrentShiftForDelivery() {
    const { data, error } = await supabase.rpc('get_current_shift')

    if (error) throw error

    const shift =
        Array.isArray(data)
            ? (data[0] || null)
            : (data || null)

    if (!shift?.id) {
        throw new Error('ยังไม่มีกะเปิดอยู่ กรุณาเปิดกะใน POS ก่อน')
    }

    if (
        shift.branch_id &&
        state.branchId &&
        shift.branch_id !== state.branchId
    ) {
        throw new Error('กะที่เปิดอยู่เป็นคนละสาขา')
    }

    return shift
}

async function dispatchDeliveryOrder(id, label, button) {
    if (!id || !button) return

    const confirmed = window.confirm(
        `ส่ง ${label || 'Delivery Order'} เข้าครัวตอนนี้?\n\n` +
        'ขั้นนี้จะสร้าง Restaurant Order และรายการ Kitchen เท่านั้น\n' +
        'ยังไม่สร้าง Sale และยังไม่ตัด Stock'
    )

    if (!confirmed) return

    const oldText = button.textContent
    button.disabled = true
    button.textContent = 'กำลังส่ง...'
    setMessage('กำลังตรวจสอบกะและส่ง Delivery เข้าครัว...')

    try {
        const shift = await getCurrentShiftForDelivery()

        const { data, error } = await supabase.rpc(
            'backoffice_delivery_dispatch_to_kitchen_v1',
            {
                p_delivery_order_id: id,
                p_shift_id: shift.id
            }
        )

        if (error) throw error

        const result =
            Array.isArray(data)
                ? (data[0] || {})
                : (data || {})

        if (!result?.ok) {
            throw new Error(result?.message || 'ส่ง Delivery เข้าครัวไม่สำเร็จ')
        }

        setMessage(
            result.already_dispatched
                ? 'ออเดอร์นี้ถูกส่งเข้าครัวไปแล้ว — ระบบไม่สร้างซ้ำ'
                : `ส่ง ${label || 'Delivery Order'} เข้าครัวแล้ว`,
            'ok'
        )

        await loadOrders()

    } catch (error) {
        console.error('Dispatch delivery error:', error)

        let message =
            error?.message ||
            'ส่ง Delivery เข้าครัวไม่สำเร็จ'

        const map = {
            DELIVERY_ORDER_NOT_FOUND: 'ไม่พบ Delivery Order',
            DELIVERY_ORDER_CANCELLED: 'ออเดอร์ถูกยกเลิก/ปฏิเสธแล้ว จึงส่งเข้าครัวไม่ได้',
            DELIVERY_ORDER_ALREADY_SOLD: 'ออเดอร์นี้มี Sale อยู่แล้ว',
            DELIVERY_ORDER_HAS_NO_ITEMS: 'ออเดอร์นี้ไม่มีรายการสินค้า',
            DELIVERY_ITEM_UNMAPPED: 'มีเมนูที่ยังไม่ได้ Mapping กับสินค้าใน POS',
            DELIVERY_MODIFIER_MAPPING_NOT_READY: 'ออเดอร์มี Modifier จาก Delivery ที่ยังไม่ได้ Mapping',
            SHIFT_REQUIRED: 'ยังไม่มีกะเปิดอยู่ กรุณาเปิดกะใน POS ก่อน',
            SHIFT_BRANCH_MISMATCH: 'กะที่เลือกเป็นคนละสาขา'
        }

        for (const [code, text] of Object.entries(map)) {
            if (message.includes(code)) {
                message = text
                break
            }
        }

        setMessage(message, 'bad')
        button.disabled = false
        button.textContent = oldText
    }
}


async function finalizeDeliverySale(id, label, button) {
    if (!id || !button) return

    const confirmed = window.confirm(
        `บันทึกขายและตัด Stock สำหรับ ${label || 'Delivery Order'} ?\n\n` +
        'ระบบจะตรวจว่ารายการในครัวเสิร์ฟครบแล้ว\n' +
        'จากนั้นจะสร้าง Sale ด้วยราคา Delivery จริงและตัด Stock ตาม BOM + กฎ Takeaway'
    )

    if (!confirmed) return

    const oldText = button.textContent
    button.disabled = true
    button.textContent = 'กำลังบันทึก...'
    setMessage('กำลังตรวจ Kitchen, สร้าง Sale และตัด Stock...')

    try {
        const shift = await getCurrentShiftForDelivery()

        const { data, error } = await supabase.rpc(
            'backoffice_delivery_finalize_sale_v1',
            {
                p_delivery_order_id: id,
                p_shift_id: shift.id
            }
        )

        if (error) throw error

        const result =
            Array.isArray(data)
                ? (data[0] || {})
                : (data || {})

        if (!result?.ok) {
            throw new Error(
                result?.message || 'บันทึก Delivery Sale ไม่สำเร็จ'
            )
        }

        setMessage(
            result.already_finalized
                ? 'ออเดอร์นี้บันทึก Sale ไปแล้ว — ระบบไม่ตัด Stock ซ้ำ'
                : `สำเร็จ ${result.invoice_no || ''} • Sale ${money(result.total)} • ตัด Stock แล้ว`,
            'ok'
        )

        await loadOrders()
        await loadReconciliation()

    } catch (error) {
        console.error('Finalize delivery sale error:', error)

        let message =
            error?.message ||
            'บันทึก Delivery Sale ไม่สำเร็จ'

        const map = {
            DELIVERY_ORDER_NOT_FOUND:
                'ไม่พบ Delivery Order',
            DELIVERY_NOT_DISPATCHED_TO_KITCHEN:
                'ออเดอร์นี้ยังไม่ได้ส่งเข้าครัว',
            DELIVERY_KITCHEN_NOT_SERVED:
                'ครัวยังทำ/เสิร์ฟรายการไม่ครบ กรุณาให้ครัวกดเสิร์ฟครบก่อน',
            DELIVERY_KITCHEN_ITEM_CANCELLED:
                'มีรายการในครัวถูกยกเลิก ต้องตรวจออเดอร์ก่อนบันทึกขาย',
            DELIVERY_ITEM_UNMAPPED:
                'มีเมนู Delivery ที่ยังไม่ได้ Mapping กับสินค้าใน POS',
            DELIVERY_MODIFIER_MAPPING_NOT_READY:
                'มี Modifier จาก Delivery ที่ยังไม่ได้ Mapping',
            DELIVERY_TOTAL_MISMATCH:
                'ยอด Delivery ไม่ตรงกับผลรวมรายการ กรุณาตรวจสอบก่อน',
            PRODUCT_RECIPE_NOT_FOUND:
                'มีสินค้าที่ยังไม่มี Recipe / BOM',
            INSUFFICIENT_INGREDIENT_STOCK:
                'Stock วัตถุดิบไม่พอ',
            EXTRA_STOCK_INSUFFICIENT:
                'Stock สำหรับกฎ Takeaway / Modifier ไม่พอ',
            SHIFT_REQUIRED:
                'ยังไม่มีกะเปิดอยู่ กรุณาเปิดกะใน POS ก่อน',
            SHIFT_BRANCH_MISMATCH:
                'กะที่เปิดอยู่เป็นคนละสาขา',
            INVALID_DELIVERY_PAYMENT_METHOD:
                'ฐานข้อมูลยังไม่รองรับ payment_method = delivery'
        }

        for (const [code, text] of Object.entries(map)) {
            if (message.includes(code)) {
                message = text
                break
            }
        }

        setMessage(message, 'bad')
        button.disabled = false
        button.textContent = oldText
    }
}


function deliveryModifierKey(modifier) {
    if (!modifier || typeof modifier !== 'object') return ''

    const raw =
        modifier.id ??
        modifier.external_id ??
        modifier.option_id ??
        modifier.sku ??
        modifier.code ??
        modifier.name ??
        ''

    return String(raw).trim().toLowerCase()
}

function deliveryModifierName(modifier) {
    if (!modifier || typeof modifier !== 'object') return '-'

    return String(
        modifier.name ??
        modifier.option_name ??
        modifier.label ??
        modifier.id ??
        '-'
    )
}

function deliveryModifierPrice(modifier) {
    if (!modifier || typeof modifier !== 'object') return 0

    const n = Number(
        modifier.price ??
        modifier.price_adjustment ??
        modifier.amount ??
        0
    )

    return Number.isFinite(n) ? n : 0
}

async function loadProductModifierChoices(productIds) {
    const ids = [...new Set((productIds || []).filter(Boolean))]

    state.modifierChoices = new Map()

    if (!ids.length) return

    const { data: links, error: linkError } = await supabase
        .from('product_modifier_groups')
        .select('product_id,modifier_group_id,display_order')
        .in('product_id', ids)
        .order('display_order', { ascending: true })

    if (linkError) throw linkError

    const groupIds = [
        ...new Set((links || []).map(x => x.modifier_group_id).filter(Boolean))
    ]

    if (!groupIds.length) return

    const [{ data: groups, error: groupError }, { data: options, error: optionError }] =
        await Promise.all([
            supabase
                .from('modifier_groups')
                .select('id,name,branch_id,is_active,display_order')
                .in('id', groupIds)
                .eq('branch_id', state.branchId)
                .eq('is_active', true),

            supabase
                .from('modifier_options')
                .select('id,modifier_group_id,name,price_adjustment,is_active,display_order')
                .in('modifier_group_id', groupIds)
                .eq('is_active', true)
        ])

    if (groupError) throw groupError
    if (optionError) throw optionError

    const groupMap = new Map((groups || []).map(g => [g.id, g]))
    const linksByProduct = new Map()

    for (const link of links || []) {
        if (!linksByProduct.has(link.product_id)) {
            linksByProduct.set(link.product_id, [])
        }
        linksByProduct.get(link.product_id).push(link)
    }

    for (const productId of ids) {
        const choices = []

        for (const link of linksByProduct.get(productId) || []) {
            const group = groupMap.get(link.modifier_group_id)
            if (!group) continue

            const groupOptions = (options || [])
                .filter(o => o.modifier_group_id === group.id)
                .sort((a, b) =>
                    Number(a.display_order || 0) - Number(b.display_order || 0)
                )

            for (const option of groupOptions) {
                choices.push({
                    group_id: group.id,
                    group_name: group.name,
                    option_id: option.id,
                    option_name: option.name,
                    price_adjustment: num(option.price_adjustment)
                })
            }
        }

        state.modifierChoices.set(productId, choices)
    }
}

async function loadModifierMappings() {
    setMessage('กำลังโหลด Modifier Mapping...')

    const platformCodeFilter = $('modifierPlatformFilter')?.value || ''
    const platformIdFilter = getPlatformId(platformCodeFilter)

    let itemQuery = supabase
        .from('delivery_order_items')
        .select(`
            id,
            delivery_order_id,
            platform_id,
            product_id,
            product_name,
            modifiers,
            created_at,
            delivery_platforms (
                id,
                code,
                name
            )
        `)
        .eq('branch_id', state.branchId)
        .order('created_at', { ascending: false })
        .limit(500)

    if (platformIdFilter) {
        itemQuery = itemQuery.eq('platform_id', platformIdFilter)
    }

    const [{ data: items, error: itemsError }, { data: mappings, error: mappingError }] =
        await Promise.all([
            itemQuery,
            supabase
                .from('delivery_modifier_mappings')
                .select(`
                    id,
                    branch_id,
                    platform_id,
                    product_id,
                    external_modifier_key,
                    external_modifier_name,
                    modifier_group_id,
                    modifier_option_id,
                    is_active,
                    delivery_platforms (
                        id,
                        code,
                        name
                    ),
                    modifier_groups (
                        id,
                        name
                    ),
                    modifier_options (
                        id,
                        name,
                        price_adjustment
                    )
                `)
                .eq('branch_id', state.branchId)
                .eq('is_active', true)
        ])

    if (itemsError) throw itemsError
    if (mappingError) throw mappingError

    state.modifierMappings = mappings || []

    const seen = new Set()
    const rows = []

    for (const item of items || []) {
        const rawModifiers =
            Array.isArray(item.modifiers)
                ? item.modifiers
                : []

        for (const modifier of rawModifiers) {
            const key = deliveryModifierKey(modifier)
            if (!key) continue

            const compound =
                `${item.platform_id}|${item.product_id}|${key}`

            if (seen.has(compound)) continue
            seen.add(compound)

            rows.push({
                platform_id: item.platform_id,
                platform_name: item.delivery_platforms?.name || '-',
                product_id: item.product_id,
                product_name: item.product_name || '-',
                external_modifier_key: key,
                external_modifier_name: deliveryModifierName(modifier),
                external_price: deliveryModifierPrice(modifier)
            })
        }
    }

    state.modifierSourceRows = rows

    await loadProductModifierChoices(
        rows.map(x => x.product_id)
    )

    renderModifierMappings()
    setMessage(
        `โหลด ${rows.length.toLocaleString('th-TH')} Modifier จาก Delivery แล้ว`,
        'ok'
    )
}

function renderModifierMappings() {
    const mappingMap = new Map(
        (state.modifierMappings || []).map(m => [
            `${m.platform_id}|${m.product_id}|${String(m.external_modifier_key || '').toLowerCase()}`,
            m
        ])
    )

    const rows = (state.modifierSourceRows || []).map((row, index) => {
        const compound =
            `${row.platform_id}|${row.product_id}|${row.external_modifier_key}`

        const current = mappingMap.get(compound)
        const choices = state.modifierChoices.get(row.product_id) || []

        const selectedValue = current
            ? `${current.modifier_group_id}|${current.modifier_option_id}`
            : ''

        const optionsHtml = [
            '<option value="">-- เลือก Modifier ใน POS --</option>',
            ...choices.map(choice => {
                const value = `${choice.group_id}|${choice.option_id}`
                const selected = value === selectedValue ? 'selected' : ''
                const priceText =
                    choice.price_adjustment === 0
                        ? ''
                        : ` (${choice.price_adjustment > 0 ? '+' : ''}${money(choice.price_adjustment)})`

                return `
                    <option value="${esc(value)}" ${selected}>
                        ${esc(choice.group_name)} → ${esc(choice.option_name)}${esc(priceText)}
                    </option>
                `
            })
        ].join('')

        const status = current
            ? badge('Mapped', 'ok')
            : badge('ยังไม่ Mapping', 'warn')

        return `
            <tr
                data-modifier-row="${index}"
                data-platform-id="${esc(row.platform_id)}"
                data-product-id="${esc(row.product_id)}"
                data-key="${esc(row.external_modifier_key)}"
                data-name="${esc(row.external_modifier_name)}"
            >
                <td>${esc(row.platform_name)}</td>
                <td>
                    <strong>${esc(row.product_name)}</strong>
                    <br><small>${esc(row.product_id)}</small>
                </td>
                <td>
                    <strong>${esc(row.external_modifier_name)}</strong>
                    <br><small>key: ${esc(row.external_modifier_key)}</small>
                </td>
                <td class="num">${money(row.external_price)}</td>
                <td>
                    <select class="delivery-edit modifier-pos-select">
                        ${optionsHtml}
                    </select>
                    ${
                        choices.length
                            ? ''
                            : '<br><small>สินค้านี้ยังไม่มี Modifier ใน POS</small>'
                    }
                </td>
                <td>${status}</td>
                <td>
                    <button
                        class="delivery-action save-modifier-mapping-btn"
                        data-index="${index}"
                        ${choices.length ? '' : 'disabled'}
                    >
                        บันทึก
                    </button>
                </td>
            </tr>
        `
    }).join('')

    $('modifierMappingRows').innerHTML =
        rows ||
        '<tr><td colspan="7">ยังไม่พบ Modifier จาก Delivery</td></tr>'

    document
        .querySelectorAll('.save-modifier-mapping-btn')
        .forEach(button => {
            button.addEventListener('click', () => {
                saveModifierMapping(Number(button.dataset.index))
            })
        })
}

async function saveModifierMapping(index) {
    const rowData = state.modifierSourceRows[index]
    const tr = document.querySelector(
        `tr[data-modifier-row="${CSS.escape(String(index))}"]`
    )

    if (!rowData || !tr) return

    const select = tr.querySelector('.modifier-pos-select')
    const value = select?.value || ''

    if (!value || !value.includes('|')) {
        setMessage('กรุณาเลือก Modifier ใน POS ก่อน', 'bad')
        return
    }

    const [groupId, optionId] = value.split('|')

    const { error } = await supabase
        .from('delivery_modifier_mappings')
        .upsert(
            {
                branch_id: state.branchId,
                platform_id: rowData.platform_id,
                product_id: rowData.product_id,
                external_modifier_key: rowData.external_modifier_key,
                external_modifier_name: rowData.external_modifier_name,
                modifier_group_id: groupId,
                modifier_option_id: optionId,
                is_active: true
            },
            {
                onConflict:
                    'branch_id,platform_id,product_id,external_modifier_key'
            }
        )

    if (error) {
        setMessage(error.message, 'bad')
        return
    }

    setMessage(
        `บันทึก Modifier Mapping: ${rowData.external_modifier_name} แล้ว`,
        'ok'
    )

    await loadModifierMappings()
}

async function loadMappings() {
    setMessage('กำลังโหลด Menu Mapping...')

    let query = supabase
        .from('delivery_menu_mappings')
        .select(`
            id,
            branch_id,
            platform_id,
            product_id,
            external_item_id,
            external_item_name,
            external_price,
            is_available,
            sync_status,
            last_synced_at,
            last_error,
            products (
                id,
                name,
                price,
                is_active
            ),
            delivery_platforms (
                id,
                code,
                name
            )
        `)
        .eq('branch_id', state.branchId)
        .order('created_at', { ascending: true })

    const platform = $('mappingPlatformFilter').value
    const platformId = getPlatformId(platform)

    if (platformId) {
        query = query.eq('platform_id', platformId)
    }

    const { data, error } = await query

    if (error) {
        setMessage(error.message, 'bad')
        throw error
    }

    state.mappings = data || []
    renderMappings()
    setMessage(`โหลด ${state.mappings.length.toLocaleString('th-TH')} Mapping แล้ว`, 'ok')
}

function renderMappings() {
    const rows = state.mappings.map(item => {
        const product = item.products || {}
        const checked = item.is_available ? 'checked' : ''

        return `
            <tr data-mapping-id="${esc(item.id)}">
                <td>${esc(platformName(item))}</td>
                <td>
                    <strong>${esc(product.name || item.external_item_name || '-')}</strong>
                    <br><small>${esc(item.product_id)}</small>
                </td>
                <td class="num">${money(product.price)}</td>
                <td>
                    <input
                        class="delivery-edit"
                        data-field="external_item_id"
                        value="${esc(item.external_item_id || '')}"
                        autocomplete="off"
                    />
                </td>
                <td class="num">
                    <input
                        class="delivery-edit"
                        data-field="external_price"
                        inputmode="decimal"
                        type="number"
                        min="0"
                        step="0.01"
                        value="${esc(item.external_price ?? product.price ?? 0)}"
                    />
                </td>
                <td>
                    <label>
                        <input
                            data-field="is_available"
                            type="checkbox"
                            ${checked}
                        />
                        เปิดขาย
                    </label>
                </td>
                <td>
                    ${syncBadge(item.sync_status)}
                    ${item.last_error ? `<br><small>${esc(item.last_error)}</small>` : ''}
                </td>
                <td>
                    <button
                        class="delivery-action save-mapping-btn"
                        data-id="${esc(item.id)}"
                    >
                        บันทึก
                    </button>
                </td>
            </tr>
        `
    }).join('')

    $('mappingRows').innerHTML = rows ||
        '<tr><td colspan="8">ยังไม่มี Menu Mapping</td></tr>'

    document.querySelectorAll('.save-mapping-btn').forEach(button => {
        button.addEventListener('click', () => saveMapping(button.dataset.id))
    })
}

async function saveMapping(id) {
    const row = document.querySelector(`tr[data-mapping-id="${CSS.escape(id)}"]`)
    if (!row) return

    const externalItemId =
        row.querySelector('[data-field="external_item_id"]').value.trim()

    const priceValue =
        Number(row.querySelector('[data-field="external_price"]').value)

    const isAvailable =
        row.querySelector('[data-field="is_available"]').checked

    if (!externalItemId) {
        setMessage('External Item ID ห้ามว่าง', 'bad')
        return
    }

    if (!Number.isFinite(priceValue) || priceValue < 0) {
        setMessage('ราคา Delivery ไม่ถูกต้อง', 'bad')
        return
    }

    setMessage('กำลังบันทึก Mapping...')

    const { error } = await supabase
        .from('delivery_menu_mappings')
        .update({
            external_item_id: externalItemId,
            external_price: priceValue,
            is_available: isAvailable,
            sync_status: 'pending',
            last_error: null
        })
        .eq('id', id)
        .eq('branch_id', state.branchId)

    if (error) {
        setMessage(error.message, 'bad')
        return
    }

    setMessage('บันทึก Menu Mapping แล้ว', 'ok')
    await loadMappings()
}

async function loadReconciliation() {
    setMessage('กำลังโหลด Reconciliation...')

    let query = supabase
        .from('delivery_settlements')
        .select(`
            id,
            branch_id,
            platform_id,
            external_settlement_id,
            period_from,
            period_to,
            gross_sales,
            merchant_discount,
            platform_discount,
            commission_fee,
            service_fee,
            other_fee,
            refund_amount,
            adjustment_amount,
            expected_amount,
            actual_amount,
            difference,
            payout_date,
            bank_reference,
            status,
            created_at,
            delivery_platforms (
                id,
                code,
                name
            )
        `)
        .eq('branch_id', state.branchId)
        .order('period_to', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(300)

    const platform = $('reconPlatformFilter').value
    const platformId = getPlatformId(platform)

    if (platformId) {
        query = query.eq('platform_id', platformId)
    }

    const { data, error } = await query

    if (error) {
        setMessage(error.message, 'bad')
        throw error
    }

    state.settlements = data || []
    renderReconciliation()
    updateKpis()
    setMessage(`โหลด ${state.settlements.length.toLocaleString('th-TH')} Settlement แล้ว`, 'ok')
}

function renderReconciliation() {
    const rows = state.settlements.map(item => {
        const diff = num(item.difference)
        const diffClass = Math.abs(diff) < 0.005
            ? 'status-ok'
            : 'status-bad'

        return `
            <tr>
                <td>${esc(platformName(item))}</td>
                <td>${shortDate(item.period_from)} → ${shortDate(item.period_to)}</td>
                <td class="num">${money(item.gross_sales)}</td>
                <td class="num">${money(item.merchant_discount)}</td>
                <td class="num">${money(item.commission_fee)}</td>
                <td class="num">${money(num(item.service_fee) + num(item.other_fee))}</td>
                <td class="num"><strong>${money(item.expected_amount)}</strong></td>
                <td class="num">${item.actual_amount == null ? '-' : money(item.actual_amount)}</td>
                <td class="num">
                    <span class="delivery-status ${diffClass}">
                        ${money(diff)}
                    </span>
                </td>
                <td>${settlementBadge(item.status)}</td>
                <td>
                    ${esc(item.bank_reference || '-')}
                    <br><small>${esc(item.external_settlement_id || '-')}</small>
                </td>
            </tr>
        `
    }).join('')

    $('reconRows').innerHTML = rows ||
        '<tr><td colspan="11">ยังไม่มี Settlement</td></tr>'
}

function updateKpis() {
    const orderCount = state.orders.length

    const gross = state.orders.reduce(
        (sum, item) => sum + num(item.gross_sales),
        0
    )

    const expected = state.orders.reduce(
        (sum, item) => sum + num(item.expected_settlement),
        0
    )

    const difference = state.settlements.reduce(
        (sum, item) => sum + num(item.difference),
        0
    )

    $('kpiOrders').textContent = orderCount.toLocaleString('th-TH')
    $('kpiOrdersSub').textContent = `${orderCount.toLocaleString('th-TH')} ออเดอร์`
    $('kpiGross').textContent = money(gross)
    $('kpiExpected').textContent = money(expected)
    $('kpiDifference').textContent = money(difference)
    $('kpiDifferenceSub').textContent =
        Math.abs(difference) < 0.005 ? 'ตรง' : 'มีส่วนต่าง'
}

function setDefaultDates() {
    $('dateFrom').value = startOfMonth()
    $('dateTo').value = localDate()
}

function bindEvents() {
    activateTabs()

    $('loadOrdersBtn').addEventListener('click', loadOrders)
    $('loadMappingsBtn').addEventListener('click', loadMappings)
    $('loadModifierMappingsBtn').addEventListener('click', loadModifierMappings)
    $('loadReconBtn').addEventListener('click', loadReconciliation)

    $('todayBtn').addEventListener('click', async () => {
        const today = localDate()
        $('dateFrom').value = today
        $('dateTo').value = today
        await loadOrders()
    })

    $('platformFilter').addEventListener('change', loadOrders)
    $('orderStatusFilter').addEventListener('change', loadOrders)
    $('mappingPlatformFilter').addEventListener('change', loadMappings)
    $('modifierPlatformFilter').addEventListener('change', loadModifierMappings)
    $('reconPlatformFilter').addEventListener('change', loadReconciliation)
}

async function init() {
    try {
        const ctx = await requireBackoffice()
        if (!ctx) return

        state.ctx = ctx
        state.branchId =
            ctx.profile?.branch_id ||
            ctx.branch?.id ||
            null

        if (!state.branchId) {
            throw new Error('ไม่พบ branch_id ของผู้ใช้งาน')
        }

        setupShell(ctx, 'delivery')
        setDefaultDates()
        bindEvents()

        await loadPlatforms()

        await Promise.all([
            loadOrders(),
            loadMappings(),
            loadModifierMappings(),
            loadReconciliation()
        ])

        setMessage('Delivery Center พร้อมใช้งาน', 'ok')

    } catch (error) {
        console.error('Delivery Center init error:', error)
        setMessage(
            error?.message || 'เปิด Delivery Center ไม่สำเร็จ',
            'bad'
        )
    }
}

init()
