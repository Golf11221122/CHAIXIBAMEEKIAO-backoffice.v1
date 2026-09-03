
import { supabase } from './supabase.js'

const $ = id => document.getElementById(id)
const state = { session:null, profile:null, branch:null, orders:[], filtered:[] }

const el = {
  branchText:$('branchText'), userName:$('userName'), roleBadge:$('roleBadge'),
  logoutBtn:$('logoutBtn'), menuBtn:$('menuBtn'), refreshBtn:$('refreshBtn'),
  dateFrom:$('dateFrom'), dateTo:$('dateTo'), statusFilter:$('statusFilter'),
  searchInput:$('searchInput'), applyBtn:$('applyBtn'),
  paidAmount:$('paidAmount'), paidOrders:$('paidOrders'),
  completedSales:$('completedSales'), completedOrders:$('completedOrders'),
  avgTicket:$('avgTicket'), avgReady:$('avgReady'), avgPickup:$('avgPickup'),
  blockedOrders:$('blockedOrders'), resultCount:$('resultCount'),
  loadingState:$('loadingState'), emptyState:$('emptyState'), tableWrap:$('tableWrap'),
  orderTableBody:$('orderTableBody'), pageMessage:$('pageMessage'),
  detailModal:$('detailModal'), detailTitle:$('detailTitle'),
  detailBody:$('detailBody'), closeDetailBtn:$('closeDetailBtn')
}

const esc = v => String(v ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;')

const money = v => new Intl.NumberFormat('th-TH',{
  style:'currency',currency:'THB',minimumFractionDigits:2
}).format(Number(v||0))

function fmtDateTime(v){
  if(!v) return '-'
  return new Date(v).toLocaleString('th-TH',{
    day:'2-digit',month:'2-digit',year:'2-digit',
    hour:'2-digit',minute:'2-digit'
  })
}

function fmtMin(v){
  if(v===null || v===undefined || v==='') return '-'
  return `${Number(v).toLocaleString('th-TH',{maximumFractionDigits:1})} นาที`
}

function msg(text='',type='error'){
  el.pageMessage.textContent=text
  el.pageMessage.dataset.type=type
}

function localDateValue(date){
  const y=date.getFullYear()
  const m=String(date.getMonth()+1).padStart(2,'0')
  const d=String(date.getDate()).padStart(2,'0')
  return `${y}-${m}-${d}`
}

async function requireAuth(){
  const {data:{session},error}=await supabase.auth.getSession()
  if(error) throw error
  if(!session){
    location.replace('../index.html')
    return false
  }
  state.session=session

  const {data:profile,error:pe}=await supabase
    .from('profiles')
    .select('id,full_name,role,branch_id,is_active')
    .eq('id',session.user.id)
    .maybeSingle()

  if(pe) throw pe
  if(!profile?.branch_id) throw new Error('PROFILE_NOT_FOUND')

  const role=String(profile.role||'').toLowerCase()
  if(!['admin','manager'].includes(role)){
    alert('หน้านี้สำหรับ Admin / Manager')
    location.replace('../dashboard.html')
    return false
  }

  state.profile=profile
  el.userName.textContent=profile.full_name || session.user.email || '-'
  el.roleBadge.textContent=role.toUpperCase()

  const {data:branch,error:be}=await supabase
    .from('branches').select('id,name').eq('id',profile.branch_id).maybeSingle()
  if(be) throw be
  state.branch=branch
  el.branchText.textContent=branch ? `สาขา: ${branch.name}` : 'สาขา'
  return true
}

function badge(text,kind='neutral'){
  return `<span class="so-badge ${kind}">${esc(text)}</span>`
}

function statusText(s){
  const map={
    draft:'Draft',payment_pending:'รอชำระ',payment_verifying:'กำลังตรวจสลิป',
    paid:'ชำระแล้ว',dispatched:'เข้าครัว',ready_for_pickup:'พร้อมรับ',
    picked_up:'รับแล้ว',completed:'เสร็จสมบูรณ์',
    cancelled:'ยกเลิก',expired:'หมดเวลา'
  }
  return map[s] || s || '-'
}

function statusKind(s){
  if(['completed','picked_up','ready_for_pickup'].includes(s)) return 'ok'
  if(['cancelled','expired'].includes(s)) return 'bad'
  return 'warn'
}

function renderSummary(s={}){
  el.paidAmount.textContent=money(s.paid_amount)
  el.paidOrders.textContent=`${Number(s.paid_orders||0).toLocaleString('th-TH')} ออเดอร์`
  el.completedSales.textContent=money(s.completed_sales)
  el.completedOrders.textContent=`${Number(s.completed_orders||0).toLocaleString('th-TH')} ออเดอร์`
  el.avgTicket.textContent=money(s.avg_ticket)
  el.avgReady.textContent=fmtMin(s.avg_ready_minutes)
  el.avgPickup.textContent=fmtMin(s.avg_pickup_minutes)
  el.blockedOrders.textContent=Number(s.blocked_orders||0).toLocaleString('th-TH')
}

function applyClientFilters(){
  const q=el.searchInput.value.trim().toLowerCase()
  const st=el.statusFilter.value

  state.filtered=state.orders.filter(o=>{
    if(st && o.status!==st) return false
    if(!q) return true
    return [
      o.order_no,o.queue_no,o.pickup_code,o.invoice_no,o.customer_name
    ].some(v=>String(v??'').toLowerCase().includes(q))
  })
  renderTable()
}

function renderTable(){
  const rows=state.filtered
  el.resultCount.textContent=`${rows.length.toLocaleString('th-TH')} รายการ`
  el.loadingState.classList.add('hidden')
  el.emptyState.classList.toggle('hidden',rows.length>0)
  el.tableWrap.classList.toggle('hidden',rows.length===0)

  el.orderTableBody.innerHTML=rows.map(o=>{
    const blocked=o.sale_stock_status==='blocked' || o.kitchen_dispatch_status==='blocked'
    const saleKind=blocked?'bad':(o.sale_id?'ok':'warn')
    const saleText=blocked?'ต้องตรวจสอบ':(o.sale_id?o.invoice_no||'บันทึกขายแล้ว':'ยังไม่บันทึกขาย')

    return `<tr>
      <td><strong>${esc(fmtDateTime(o.created_at))}</strong></td>
      <td>
        <strong>${esc(o.order_no)}</strong>
        <div class="sub">คิว ${esc(o.queue_no??'-')} • รับ ${esc(o.pickup_code??'-')}</div>
        <div class="sub">${Number(o.item_count||0)} รายการ / ${Number(o.total_qty||0)} ชิ้น</div>
      </td>
      <td><strong>${money(o.total)}</strong></td>
      <td>${badge(o.payment_status==='paid'?'Paid':o.payment_status,o.payment_status==='paid'?'ok':'warn')}</td>
      <td>
        ${badge(statusText(o.status),statusKind(o.status))}
        <div class="sub">${esc(o.kitchen_dispatch_status||'-')}</div>
      </td>
      <td>
        ${badge(saleText,saleKind)}
        <div class="sub">Stock: ${esc(o.sale_stock_status||'-')}</div>
      </td>
      <td>
        <div>พร้อม: ${esc(fmtMin(o.ready_minutes))}</div>
        <div class="sub">รับ: ${esc(fmtMin(o.pickup_minutes))}</div>
      </td>
      <td><button class="detail-btn" data-id="${esc(o.id)}">ดู</button></td>
    </tr>`
  }).join('')
}

async function loadDashboard(){
  msg('')
  el.loadingState.classList.remove('hidden')
  el.emptyState.classList.add('hidden')
  el.tableWrap.classList.add('hidden')

  const {data,error}=await supabase.rpc('backoffice_self_order_dashboard_v1',{
    p_date_from:el.dateFrom.value,
    p_date_to:el.dateTo.value
  })
  if(error) throw error

  state.orders=Array.isArray(data?.orders)?data.orders:[]
  renderSummary(data?.summary||{})
  applyClientFilters()
}

function modifierText(modifiers){
  if(!Array.isArray(modifiers) || !modifiers.length) return ''
  return modifiers.map(m=>m?.name||m?.label||m?.option_name||'').filter(Boolean).join(', ')
}

async function openDetail(id){
  el.detailModal.classList.remove('hidden')
  el.detailTitle.textContent='กำลังโหลด...'
  el.detailBody.innerHTML='<div class="empty-state">กำลังโหลด...</div>'

  const {data,error}=await supabase.rpc('backoffice_self_order_detail_v1',{
    p_self_order_id:id
  })
  if(error){
    el.detailBody.innerHTML=`<div class="detail-error">${esc(error.message)}</div>`
    return
  }

  const o=data.order||{}
  const items=Array.isArray(data.items)?data.items:[]
  const events=Array.isArray(data.events)?data.events:[]

  el.detailTitle.textContent=`${o.order_no||'-'} • คิว ${o.queue_no??'-'}`

  el.detailBody.innerHTML=`
    <section class="detail-summary">
      <div><span>ยอด</span><strong>${money(o.total)}</strong></div>
      <div><span>รหัสรับ</span><strong>${esc(o.pickup_code||'-')}</strong></div>
      <div><span>สถานะ</span><strong>${esc(statusText(o.status))}</strong></div>
      <div><span>Invoice</span><strong>${esc(o.invoice_no||'-')}</strong></div>
    </section>

    <h4>เวลา</h4>
    <div class="timeline-grid">
      <div><span>สร้าง</span><strong>${esc(fmtDateTime(o.created_at))}</strong></div>
      <div><span>Paid</span><strong>${esc(fmtDateTime(o.paid_at))}</strong></div>
      <div><span>เข้าครัว</span><strong>${esc(fmtDateTime(o.dispatched_at))}</strong></div>
      <div><span>พร้อมรับ</span><strong>${esc(fmtDateTime(o.ready_at))}</strong></div>
      <div><span>รับอาหาร</span><strong>${esc(fmtDateTime(o.picked_up_at))}</strong></div>
      <div><span>เสร็จ</span><strong>${esc(fmtDateTime(o.completed_at))}</strong></div>
    </div>

    <h4>รายการอาหาร</h4>
    <div class="detail-items">
      ${items.map(i=>`
        <div class="detail-item">
          <div><strong>${esc(i.product_name)}</strong>
            ${modifierText(i.modifiers)?`<small>${esc(modifierText(i.modifiers))}</small>`:''}
            ${i.item_note?`<small>หมายเหตุ: ${esc(i.item_note)}</small>`:''}
          </div>
          <div class="right">x${esc(i.quantity)}<strong>${money(i.line_total)}</strong></div>
        </div>
      `).join('') || '<div class="empty-state">ไม่มีรายการ</div>'}
    </div>

    <h4>System Events</h4>
    <div class="event-list">
      ${events.map(e=>`
        <div class="event-row">
          <div><strong>${esc(e.event_type)}</strong><small>${esc(e.message||'')}</small></div>
          <span>${esc(fmtDateTime(e.created_at))}</span>
        </div>
      `).join('') || '<div class="empty-state">ไม่มี Event</div>'}
    </div>

    ${(o.kitchen_dispatch_error||o.sale_stock_error)?`
      <div class="detail-error">
        ${o.kitchen_dispatch_error?`Kitchen: ${esc(o.kitchen_dispatch_error)}<br>`:''}
        ${o.sale_stock_error?`Sale/Stock: ${esc(o.sale_stock_error)}`:''}
      </div>`:''}
  `
}

function closeDetail(){ el.detailModal.classList.add('hidden') }

async function init(){
  try{
    const ok=await requireAuth()
    if(!ok) return

    const today=new Date()
    el.dateFrom.value=localDateValue(today)
    el.dateTo.value=localDateValue(today)

    await loadDashboard()
  }catch(error){
    console.error(error)
    msg(error.message||'โหลดข้อมูลไม่สำเร็จ')
    el.loadingState.classList.add('hidden')
  }
}

el.applyBtn.addEventListener('click',()=>loadDashboard().catch(e=>msg(e.message)))
el.refreshBtn.addEventListener('click',()=>loadDashboard().catch(e=>msg(e.message)))
el.statusFilter.addEventListener('change',applyClientFilters)
el.searchInput.addEventListener('input',applyClientFilters)
el.orderTableBody.addEventListener('click',e=>{
  const b=e.target.closest('[data-id]')
  if(b) openDetail(b.dataset.id)
})
el.closeDetailBtn.addEventListener('click',closeDetail)
el.detailModal.addEventListener('click',e=>{ if(e.target===el.detailModal) closeDetail() })
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeDetail() })
el.menuBtn.addEventListener('click',()=>document.body.classList.toggle('sidebar-open'))
el.logoutBtn.addEventListener('click',async()=>{
  await supabase.auth.signOut()
  location.replace('../index.html')
})

init()
