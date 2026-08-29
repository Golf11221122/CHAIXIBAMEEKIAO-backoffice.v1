/* =========================================================
   CHAIXI BAMEEKIAO Back Office V3.23 — SAFE UI interaction layer
   Base: V3.22. Moves existing actions only; no business logic rewrite.
   ========================================================= */
(() => {
  'use strict'

  const $ = (sel, root=document) => root.querySelector(sel)
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)]

  const actionConfig = [
    { key:'share', ids:['shareBtn','globalShareBtn'], label:'แชร์', icon:'↥' },
    { key:'print', ids:['printBtn','globalPrintBtn'], label:'พิมพ์', icon:'🖨️' },
    { key:'refresh', ids:['refreshBtn'], label:'รีเฟรช', icon:'↻' }
  ]

  function isElementVisible(el){
    if(!(el instanceof HTMLElement)) return false
    return !el.hidden && getComputedStyle(el).display !== 'none'
  }

  function getTopActionHost(){
    const userBox = $('.topbar .user-box')
    if(!userBox) return null
    let host = $('#jk23TopActions', userBox)
    if(!host){
      host = document.createElement('div')
      host.id = 'jk23TopActions'
      host.className = 'jk23-top-actions no-print'
      host.setAttribute('aria-label','คำสั่งด่วน')
      const logout = $('#logoutBtn', userBox)
      userBox.insertBefore(host, logout || null)
    }
    return host
  }

  function findActionCandidates(ids){
    return ids.flatMap(id => $$('#' + CSS.escape(id)))
  }

  function normalizeTopActions(){
    const host = getTopActionHost()
    if(!host) return

    actionConfig.forEach(cfg => {
      const candidates = findActionCandidates(cfg.ids)
      if(!candidates.length) return

      // Prefer page-specific action over the auto global action.
      const preferred = candidates.find(el => el.id === cfg.ids[0]) || candidates[0]
      candidates.forEach(el => {
        if(el !== preferred){
          el.classList.add('jk23-duplicate-action')
          el.setAttribute('aria-hidden','true')
        }
      })

      if(preferred.parentElement !== host) host.appendChild(preferred)
      preferred.classList.add('jk23-top-action')
      preferred.classList.remove('primary-btn')
      preferred.classList.add('outline-btn')
      preferred.dataset.jk23Action = cfg.key
      preferred.setAttribute('aria-label',cfg.label)
      preferred.setAttribute('title',cfg.label)
      preferred.innerHTML = `<span aria-hidden="true">${cfg.icon}</span><span class="jk23-action-text">${cfg.label}</span>`
    })

    // Keep one deterministic order: Share → Print → Refresh.
    actionConfig.forEach(cfg => {
      const el = host.querySelector(`[data-jk23-action="${cfg.key}"]`)
      if(el) host.appendChild(el)
    })

    $$('#globalReportActions,.report-actions').forEach(box => {
      if(box === host) return
      const visibleChildren = [...box.children].filter(el => isElementVisible(el) && !el.classList.contains('jk23-duplicate-action'))
      if(!visibleChildren.length) box.classList.add('jk23-empty-report-actions')
    })
  }

  function isFromId(id=''){
    return /(^|[-_])(date)?from($|[-_])|datefrom|^from$|^start$|datestart|startdate/i.test(id)
  }
  function isToId(id=''){
    return /(^|[-_])(date)?to($|[-_])|dateto|^to$|^end$|dateend|enddate/i.test(id)
  }

  function findRangePairs(){
    const inputs = $$('input[type="date"][id]')
    const froms = inputs.filter(i => isFromId(i.id))
    const tos = inputs.filter(i => isToId(i.id))
    const pairs=[]
    const used=new Set()

    froms.forEach(from => {
      let best = tos.find(to => !used.has(to) && from.parentElement?.parentElement === to.parentElement?.parentElement)
      if(!best) best = tos.find(to => !used.has(to) && from.closest('section,form,.panel,.toolbar,.filters,.filter-bar') === to.closest('section,form,.panel,.toolbar,.filters,.filter-bar'))
      if(!best) best = tos.find(to => !used.has(to))
      if(best){ used.add(best); pairs.push([from,best]) }
    })
    return pairs
  }

  function commonContainer(a,b){
    const preferred = ['.toolbar','.filters','.filter-bar','.finance-summary-toolbar','.panel','form','section']
    for(const sel of preferred){
      const ca=a.closest(sel), cb=b.closest(sel)
      if(ca && ca===cb) return ca
    }
    return a.parentElement?.parentElement || a.parentElement
  }

  function formatBE(value){
    if(!value) return '--/--/----'
    const [y,m,d]=value.split('-').map(Number)
    if(!y||!m||!d) return value
    return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y+543}`
  }

  function emitDateChange(input, value){
    if(input.value === value) return
    input.value = value
    input.dispatchEvent(new Event('input',{bubbles:true}))
    input.dispatchEvent(new Event('change',{bubbles:true}))
  }

  function ensureDateDialog(){
    let dialog=$('#jk23DateDialog')
    if(dialog) return dialog
    dialog=document.createElement('div')
    dialog.id='jk23DateDialog'
    dialog.className='jk23-date-dialog'
    dialog.hidden=true
    dialog.innerHTML=`
      <div class="jk23-date-card" role="dialog" aria-modal="true" aria-labelledby="jk23DateTitle">
        <div class="jk23-date-step" id="jk23DateStep">1 / 2</div>
        <h3 class="jk23-date-title" id="jk23DateTitle">ตั้งแต่วันที่</h3>
        <p class="jk23-date-help" id="jk23DateHelp">เลือกวันเริ่มต้นของช่วงรายงาน</p>
        <input class="jk23-date-input" id="jk23DateInput" type="date" />
        <div class="jk23-date-error" id="jk23DateError" aria-live="polite"></div>
        <div class="jk23-date-actions">
          <button class="outline-btn" id="jk23DateCancel" type="button">ยกเลิก</button>
          <button class="primary-btn" id="jk23DateOk" type="button">ตกลง</button>
        </div>
      </div>`
    document.body.appendChild(dialog)
    return dialog
  }

  let activeRange=null
  let rangeStage='from'

  function openRangeDialog(range){
    activeRange={...range,pendingFrom:range.inputs[0].value}
    rangeStage='from'
    const dialog=ensureDateDialog()
    updateDialogStage()
    dialog.hidden=false
    document.body.style.overflow='hidden'
    setTimeout(() => {
      const input=$('#jk23DateInput')
      input?.focus()
      try{ input?.showPicker?.() }catch(_){ }
    },50)
  }

  function closeRangeDialog(){
    const dialog=ensureDateDialog()
    dialog.hidden=true
    activeRange=null
    document.body.style.overflow=''
  }

  function updateDialogStage(){
    if(!activeRange) return
    const [from,to]=activeRange.inputs
    const isFrom=rangeStage==='from'
    $('#jk23DateStep').textContent=isFrom?'1 / 2':'2 / 2'
    $('#jk23DateTitle').textContent=isFrom?'ตั้งแต่วันที่':'ถึงวันที่'
    $('#jk23DateHelp').textContent=isFrom?'เลือกวันเริ่มต้น แล้วกด “ตกลง”':'เลือกวันสิ้นสุด แล้วกด “ตกลง”'
    $('#jk23DateInput').value=isFrom?(activeRange.pendingFrom || from.value):to.value
    $('#jk23DateError').textContent=''
    $('#jk23DateOk').textContent=isFrom?'ตกลง →':'ตกลง'
  }

  function refreshRangeLabel(range){
    const [from,to]=range.inputs
    range.button.textContent=`${formatBE(from.value)} - ${formatBE(to.value)}`
  }

  function installRange(from,to,index){
    if(from.dataset.jk23RangeReady || to.dataset.jk23RangeReady) return
    const container=commonContainer(from,to)
    if(!container) return

    const fromShell=from.closest('label.field,label') || from
    const toShell=to.closest('label.field,label') || to
    fromShell.classList.add('jk23-range-original')
    toShell.classList.add('jk23-range-original')

    const control=document.createElement('div')
    control.className='jk23-range-control'
    control.dataset.jk23Range=String(index)
    const button=document.createElement('button')
    button.type='button'
    button.className='jk23-range-button'
    button.setAttribute('aria-label','เลือกช่วงวันที่')
    control.appendChild(button)

    const firstNode = fromShell instanceof HTMLElement ? fromShell : from
    container.insertBefore(control, firstNode)

    const range={inputs:[from,to],button,control}
    button.addEventListener('click',()=>openRangeDialog(range))
    ;[from,to].forEach(input=>input.addEventListener('change',()=>refreshRangeLabel(range)))
    refreshRangeLabel(range)
    from.dataset.jk23RangeReady='1'; to.dataset.jk23RangeReady='1'
  }

  function setupDateRanges(){
    findRangePairs().forEach(([from,to],i)=>installRange(from,to,i))
  }

  function setupDateDialogEvents(){
    const dialog=ensureDateDialog()
    $('#jk23DateCancel').addEventListener('click',closeRangeDialog)
    $('#jk23DateOk').addEventListener('click',()=>{
      if(!activeRange) return
      const picker=$('#jk23DateInput')
      const value=picker.value
      if(!value){ $('#jk23DateError').textContent='กรุณาเลือกวันที่'; return }
      const [from,to]=activeRange.inputs
      if(rangeStage==='from'){
        activeRange.pendingFrom=value
        rangeStage='to'
        updateDialogStage()
        setTimeout(()=>{ try{$('#jk23DateInput')?.showPicker?.()}catch(_){ } },80)
        return
      }
      const pendingFrom=activeRange.pendingFrom || from.value
      if(pendingFrom && value < pendingFrom){
        $('#jk23DateError').textContent='วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม'
        return
      }
      emitDateChange(from,pendingFrom)
      emitDateChange(to,value)
      refreshRangeLabel(activeRange)
      closeRangeDialog()
    })
    dialog.addEventListener('click',e=>{ if(e.target===dialog) closeRangeDialog() })
    document.addEventListener('keydown',e=>{ if(e.key==='Escape' && !dialog.hidden) closeRangeDialog() })
  }

  function setupDynamicActions(){
    let queued=false
    const run=()=>{ queued=false; normalizeTopActions() }
    const observer=new MutationObserver(()=>{
      if(queued) return
      queued=true
      requestAnimationFrame(run)
    })
    observer.observe(document.body,{childList:true,subtree:true})
  }

  function init(){
    normalizeTopActions()
    setupDateDialogEvents()
    setupDateRanges()
    setupDynamicActions()
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true})
  else init()
})()
