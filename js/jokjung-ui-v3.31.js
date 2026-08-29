/* =========================================================
   CHAIXI BAMEEKIAO BACK OFFICE V3.21 — STORE OPERATIONS UX
   Visual / interaction feedback only. Does not change business logic.
   ========================================================= */
(() => {
  'use strict'

  const CLICKABLE = 'button:not([disabled]),a.quick-link,a.nav-link,[role="button"]:not([aria-disabled="true"])'
  let toastTimer = 0

  function nowTime(){ return new Intl.DateTimeFormat('th-TH',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date()) }
  function dateText(){ return new Intl.DateTimeFormat('th-TH',{weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(new Date()) }

  function cleanLabel(el){
    const source = el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || 'คำสั่ง'
    return String(source).replace(/\s+/g,' ').replace(/[☰×✕＋+↻←→📤🖨️🔒✅✨💸↩️📊🧾📈📅💵🏦🧪🛠🔄📦🗂️🗑️🍳🏭🧮🚚🛒]/g,'').trim().slice(0,52) || 'คำสั่ง'
  }

  function ensureToast(){
    let el=document.getElementById('jkStoreToast')
    if(el) return el
    el=document.createElement('div'); el.id='jkStoreToast'; el.setAttribute('role','status'); el.setAttribute('aria-live','polite')
    el.innerHTML='<div class="jk-toast-icon">✓</div><div><div class="jk-toast-title">รับคำสั่งแล้ว</div><div class="jk-toast-sub">ระบบกำลังดำเนินการ</div></div><div class="jk-toast-time"></div>'
    document.body.appendChild(el); return el
  }

  function toast(type,title,sub,duration=1700){
    const el=ensureToast(); el.className=type||''
    el.querySelector('.jk-toast-icon').textContent=type==='error'?'!':type==='warning'?'!':'✓'
    el.querySelector('.jk-toast-title').textContent=title
    el.querySelector('.jk-toast-sub').textContent=sub||''
    el.querySelector('.jk-toast-time').textContent=nowTime()
    clearTimeout(toastTimer); el.classList.add('show'); toastTimer=setTimeout(()=>el.classList.remove('show'),duration)
  }

  function quiet(el){ return el.matches('.menu-btn,.close-btn,.icon-btn,.tab,.nav-link') || /cancel|close/i.test(el.id||'') }

  function setupOpsBar(){
    const main=document.querySelector('.content'); if(!main || document.querySelector('.jk-opsbar')) return
    const bar=document.createElement('div'); bar.className='jk-opsbar'; bar.setAttribute('aria-label','สถานะระบบ')
    bar.innerHTML=`<span class="jk-ops-chip"><span class="jk-status-dot" id="jkNetDot"></span><strong id="jkNetText">ออนไลน์</strong></span><span class="jk-ops-chip">วันที่ <strong id="jkDateText"></strong></span><span class="jk-ops-chip">เวลา <strong id="jkClock"></strong></span><span class="jk-ops-spacer"></span><span class="jk-ops-chip">CHAIXI BAMEEKIAO Back Office</span>`
    main.prepend(bar)
    const tick=()=>{ const c=document.getElementById('jkClock'),d=document.getElementById('jkDateText'); if(c)c.textContent=nowTime(); if(d)d.textContent=dateText() }
    tick(); setInterval(tick,1000)
    updateNet(); addEventListener('online',updateNet); addEventListener('offline',updateNet)
  }
  function updateNet(){
    const dot=document.getElementById('jkNetDot'),txt=document.getElementById('jkNetText'); if(!dot||!txt)return
    const ok=navigator.onLine; dot.classList.toggle('offline',!ok); txt.textContent=ok?'ออนไลน์':'ออฟไลน์'
  }

  function markDisabled(){
    document.querySelectorAll('button:disabled').forEach(b=>{b.setAttribute('aria-disabled','true');if(!b.title)b.title='ยังไม่พร้อมใช้งานในสถานะปัจจุบัน'})
  }

  function setupButtonFeedback(){
    document.addEventListener('pointerdown',e=>{ const el=e.target.closest?.(CLICKABLE); if(!el)return; el.classList.add('jk-pressed'); setTimeout(()=>el.classList.remove('jk-pressed'),150) },{passive:true})
    document.addEventListener('click',e=>{
      const el=e.target.closest?.(CLICKABLE); if(!el)return
      el.classList.remove('jk-action-pulse'); void el.offsetWidth; el.classList.add('jk-action-pulse'); setTimeout(()=>el.classList.remove('jk-action-pulse'),360)
      if(el.tagName==='BUTTON') el.dataset.jkLastClick=String(Date.now())
      if(!quiet(el)) toast('success',`รับคำสั่ง: ${cleanLabel(el)}`,'กดปุ่มแล้ว • รอผลการทำงาน')
    },true)
  }

  function setupBusyObserver(){
    const obs=new MutationObserver(ms=>{
      for(const m of ms){
        if(m.type==='attributes' && m.target instanceof HTMLButtonElement){
          const b=m.target
          if(b.disabled && b.dataset.jkLastClick && Date.now()-Number(b.dataset.jkLastClick)<3000) b.setAttribute('aria-busy','true')
          if(!b.disabled){ b.removeAttribute('aria-busy'); delete b.dataset.jkLastClick }
        }
      }
      markDisabled()
    })
    obs.observe(document.body,{subtree:true,attributes:true,attributeFilter:['disabled']})
  }

  function setupMessageObserver(){
    const targets=[...document.querySelectorAll('.message,[id*="message" i],[id*="error" i],[id*="status" i]')]
    const seen=new WeakMap()
    const inspect=el=>{
      const t=(el.textContent||'').trim(); if(!t || seen.get(el)===t) return; seen.set(el,t)
      if(/error|failed|ผิดพลาด|ไม่สำเร็จ|ไม่ได้|ล้มเหลว/i.test(t)) toast('error','ดำเนินการไม่สำเร็จ',t.slice(0,90),2600)
      else if(/success|สำเร็จ|บันทึกแล้ว|เรียบร้อย|ผ่าน/i.test(t)) toast('success','ดำเนินการสำเร็จ',t.slice(0,90),2200)
      else if(/เตือน|warning|กรุณา|ต้อง/i.test(t)) toast('warning','ตรวจสอบข้อมูล',t.slice(0,90),2300)
    }
    const mo=new MutationObserver(ms=>ms.forEach(m=>inspect(m.target.nodeType===1?m.target:m.target.parentElement)))
    targets.forEach(el=>mo.observe(el,{childList:true,subtree:true,characterData:true}))
  }

  function setupSidebar(){
    const sidebar=document.getElementById('sidebar'), btn=document.getElementById('menuBtn'); if(!sidebar)return
    let scrim=document.querySelector('.jk-sidebar-scrim'); if(!scrim){scrim=document.createElement('div');scrim.className='jk-sidebar-scrim';document.body.appendChild(scrim)}
    const sync=()=>{const open=sidebar.classList.contains('open');document.body.classList.toggle('sidebar-open',open);scrim.style.display=open&&innerWidth<=900?'block':''}
    btn?.addEventListener('click',()=>setTimeout(sync,0)); scrim.addEventListener('click',()=>{sidebar.classList.remove('open');sync()})
    addEventListener('resize',sync)
  }

  function normalizeButtons(){
    document.querySelectorAll('button:not([type])').forEach(b=>{ if(!b.closest('form')) b.type='button' })
    document.querySelectorAll('button').forEach(b=>{ if(!b.getAttribute('aria-label') && !(b.textContent||'').trim()) b.setAttribute('aria-label','ปุ่มคำสั่ง') })
  }

  function init(){ ensureToast();setupOpsBar();normalizeButtons();markDisabled();setupButtonFeedback();setupBusyObserver();setupMessageObserver();setupSidebar() }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})()

;
/* CHAIXI BAMEEKIAO Back Office V3.22 — Command Center interaction layer */
(() => {
  'use strict'

  const parseNum = (el) => {
    if (!el) return 0
    const n = Number(String(el.textContent || '').replace(/[^0-9.-]/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  function setupNavProgress() {
    const bar = document.createElement('div')
    bar.id = 'jkNavProgress'
    document.body.appendChild(bar)
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]')
      if (!a || a.target === '_blank' || a.getAttribute('href')?.startsWith('#')) return
      bar.classList.remove('done')
      void bar.offsetWidth
      bar.classList.add('active')
    }, true)
    window.addEventListener('pageshow', () => { bar.classList.remove('active'); bar.classList.add('done'); setTimeout(() => bar.classList.remove('done'), 450) })
  }

  function confirmTap(el) {
    if (!(el instanceof HTMLButtonElement)) return
    if (el.disabled || el.matches('.menu-btn,.close-btn,.icon-btn')) return
    el.querySelector('.jk-confirm-mark')?.remove()
    const mark = document.createElement('span')
    mark.className = 'jk-confirm-mark'
    mark.textContent = '✓'
    mark.setAttribute('aria-hidden','true')
    el.appendChild(mark)
    setTimeout(() => mark.remove(), 900)
    try { navigator.vibrate?.(10) } catch (_) {}
  }

  function setupConfirmMarks() {
    document.addEventListener('click', (e) => confirmTap(e.target.closest('button')), true)
  }

  function syncDashboardStatus() {
    const alerts = document.getElementById('alerts')
    const po = document.getElementById('openPo')
    const pendingText = document.getElementById('pendingCount')
    const alertOut = document.getElementById('jkAlertSummary')
    const poOut = document.getElementById('jkPoSummary')
    const countOut = document.getElementById('jkCountSummary')
    if (!alertOut || !poOut || !countOut) return

    const render = () => {
      const a = parseNum(alerts)
      const p = parseNum(po)
      const c = parseNum(pendingText)
      alertOut.textContent = a > 0 ? `${a} รายการต้องตรวจ` : 'ปกติ'
      poOut.textContent = p > 0 ? `${p} PO ยังเปิด` : 'ไม่มี PO ค้าง'
      countOut.textContent = c > 0 ? `${c} งานค้าง` : 'ไม่มีงานค้าง'
      const setState = (el, n) => {
        const card = el.closest('.jk-attention-card')
        card.classList.remove('is-ok','is-warning','is-danger')
        card.classList.add(n <= 0 ? 'is-ok' : n >= 5 ? 'is-danger' : 'is-warning')
      }
      setState(alertOut,a); setState(poOut,p); setState(countOut,c)
    }
    render()
    const observer = new MutationObserver(render)
    ;[alerts, po, pendingText].filter(Boolean).forEach(el => observer.observe(el,{childList:true,subtree:true,characterData:true}))
  }

  function init() {
    setupNavProgress()
    setupConfirmMarks()
    syncDashboardStatus()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true})
  else init()
})()

;
/* =========================================================
   CHAIXI BAMEEKIAO Back Office V3.23 — Operational UX Consistency
   Visual / interaction feedback only; business logic untouched.
   ========================================================= */
(() => {
  'use strict'

  const state = { dirty:false, pending:new WeakMap(), lastFeedback:'' }
  const ACTION = 'button:not([disabled]),[role="button"]:not([aria-disabled="true"])'

  const tnow = () => new Intl.DateTimeFormat('th-TH',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date())
  const clean = (s) => String(s || '').replace(/\s+/g,' ').trim()
  const labelOf = (el) => clean(el?.getAttribute?.('aria-label') || el?.getAttribute?.('title') || el?.textContent || 'คำสั่ง').slice(0,60)

  function feedbackRoot(){
    let root = document.getElementById('jk23Feedback')
    if(!root){ root=document.createElement('div'); root.id='jk23Feedback'; root.setAttribute('aria-live','polite'); root.setAttribute('aria-atomic','false'); document.body.appendChild(root) }
    return root
  }

  function notify(type='success', title='รับคำสั่งแล้ว', sub='', ttl=2200){
    const signature=`${type}|${title}|${sub}`
    if(state.lastFeedback===signature) return
    state.lastFeedback=signature; setTimeout(()=>{ if(state.lastFeedback===signature) state.lastFeedback='' },500)
    const n=document.createElement('div'); n.className=`jk23-note ${type}`; n.setAttribute('role',type==='error'?'alert':'status')
    const icon=type==='error'?'!':type==='warning'?'!':'✓'
    n.innerHTML=`<div class="jk23-note-icon">${icon}</div><div><div class="jk23-note-title"></div><div class="jk23-note-sub"></div></div><div class="jk23-note-time"></div>`
    n.querySelector('.jk23-note-title').textContent=title
    n.querySelector('.jk23-note-sub').textContent=sub
    n.querySelector('.jk23-note-time').textContent=tnow()
    feedbackRoot().appendChild(n)
    setTimeout(()=>{ n.style.opacity='0';n.style.transform='translateY(6px)';setTimeout(()=>n.remove(),180) },ttl)
  }

  function setupContextBar(){
    const content=document.querySelector('main.content,.content'); if(!content || content.querySelector('.jk23-contextbar')) return
    const title=clean(document.querySelector('.topbar h1,h1')?.textContent || document.title.split('|')[0] || 'Back Office')
    const bar=document.createElement('div'); bar.className='jk23-contextbar'
    bar.innerHTML='<span class="jk23-page"></span><span class="jk23-divider"></span><span class="jk23-dirty-badge">ยังไม่บันทึก</span><span class="jk23-spacer"></span><span class="jk23-sync">พร้อมใช้งาน • <span class="jk23-sync-time"></span></span>'
    bar.querySelector('.jk23-page').textContent=title
    content.prepend(bar)
    const sync=()=>{ document.body.classList.toggle('jk23-offline',!navigator.onLine); const el=bar.querySelector('.jk23-sync-time'); if(el) el.textContent=tnow() }
    sync(); addEventListener('online',sync); addEventListener('offline',sync); setInterval(sync,30000)
  }

  function setDirty(value){ state.dirty=!!value; document.body.classList.toggle('jk23-dirty',state.dirty) }
  function setupDirtyState(){
    document.addEventListener('input',e=>{ if(e.target.matches?.('input,textarea,select') && !e.target.matches('[type="search"]')) setDirty(true) },true)
    document.addEventListener('change',e=>{ if(e.target.matches?.('input,textarea,select')) setDirty(true) },true)
    document.addEventListener('submit',()=>setDirty(false),true)
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('button'); if(!b) return
      const l=labelOf(b)
      if(/บันทึก|save|สร้าง|เพิ่ม|ยืนยัน|submit|อัปเดต|update/i.test(l)) setTimeout(()=>setDirty(false),250)
    },true)
  }

  function setupActionFeedback(){
    document.addEventListener('pointerdown',e=>{
      const el=e.target.closest?.(ACTION); if(!el) return
      el.classList.add('jk23-tapped'); setTimeout(()=>el.classList.remove('jk23-tapped'),150)
      try{ navigator.vibrate?.(8) }catch(_){ }
    },{passive:true,capture:true})

    document.addEventListener('click',e=>{
      const b=e.target.closest?.('button'); if(!b || b.disabled) return
      const label=labelOf(b)
      if(b.matches('.menu-btn,.close-btn,.icon-btn') || /ออกจากระบบ|logout/i.test(label)) return

      b.classList.add('jk23-working'); b.setAttribute('aria-busy','true')
      clearTimeout(state.pending.get(b))
      const timer=setTimeout(()=>{ b.classList.remove('jk23-working'); b.removeAttribute('aria-busy') },1800)
      state.pending.set(b,timer)
      notify('success',`รับคำสั่ง: ${label}`,'ระบบรับการแตะแล้ว กำลังดำเนินการ',1500)
    },true)
  }

  function finishButton(type){
    const candidates=[...document.querySelectorAll('button[aria-busy="true"]')]
    const b=candidates.at(-1); if(!b) return
    clearTimeout(state.pending.get(b)); b.classList.remove('jk23-working'); b.removeAttribute('aria-busy')
    const cls=type==='error'?'jk23-error':'jk23-complete'; b.classList.add(cls); setTimeout(()=>b.classList.remove(cls),900)
  }

  function classify(text){
    if(/error|failed|ผิดพลาด|ล้มเหลว|ไม่สำเร็จ|ไม่สามารถ|denied/i.test(text)) return 'error'
    if(/warning|เตือน|กรุณา|ต้องตรวจ|ไม่ครบ/i.test(text)) return 'warning'
    if(/success|สำเร็จ|เรียบร้อย|บันทึกแล้ว|สร้างแล้ว|อัปเดตแล้ว|ผ่าน/i.test(text)) return 'success'
    return ''
  }

  function setupResultObserver(){
    const seen=new WeakMap()
    const inspect=(el)=>{
      if(!(el instanceof Element)) return
      if(el.closest('#jk23Feedback,#jkStoreToast')) return
      const text=clean(el.textContent); if(!text || text.length>240 || seen.get(el)===text) return
      const type=classify(text); if(!type) return
      seen.set(el,text); finishButton(type)
      notify(type,type==='error'?'ดำเนินการไม่สำเร็จ':type==='warning'?'กรุณาตรวจสอบ':'ดำเนินการสำเร็จ',text.slice(0,120),type==='error'?3200:2400)
    }
    const selector='.message,.alert,.notice,.toast,[id*="message" i],[id*="error" i],[id*="status" i],[class*="message" i],[class*="alert" i]'
    document.querySelectorAll(selector).forEach(inspect)
    new MutationObserver(ms=>{
      for(const m of ms){
        const el=m.target.nodeType===1?m.target:m.target.parentElement
        const target=el?.matches?.(selector)?el:el?.closest?.(selector)
        if(target) inspect(target)
      }
    }).observe(document.body,{subtree:true,childList:true,characterData:true})
  }

  function setupDisabledHints(){
    const apply=()=>document.querySelectorAll('button:disabled').forEach(b=>{
      b.setAttribute('aria-disabled','true'); if(!b.title) b.title='ปุ่มนี้ยังใช้ไม่ได้ในสถานะปัจจุบัน'
    })
    apply(); new MutationObserver(apply).observe(document.body,{subtree:true,attributes:true,attributeFilter:['disabled']})
  }

  function setupForms(){
    document.querySelectorAll('form').forEach(f=>f.setAttribute('novalidate',''))
    document.addEventListener('submit',e=>{
      const f=e.target; if(!(f instanceof HTMLFormElement)) return
      const invalid=[...f.querySelectorAll(':invalid')]
      if(invalid.length){ e.preventDefault(); invalid[0].focus(); notify('warning','ข้อมูลยังไม่ครบ',`กรุณาตรวจสอบ ${invalid.length} ช่องที่จำเป็น`,2600) }
    },true)
  }

  function init(){ feedbackRoot();setupContextBar();setupDirtyState();setupActionFeedback();setupResultObserver();setupDisabledHints();setupForms() }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init()
})()

;
(function(){
  const state = {
    head: null,
    title: null,
    wrap: null,
    placeholder: null,
    sentinel: null,
    dock: null,
    inner: null,
    fixed: false,
    ticking: false,
    observer: null,
    mo: null,
    thresholdTop: 74
  };

  function ensureDock(){
    let dock = document.getElementById('jk27Dock');
    if(!dock){
      dock = document.createElement('div');
      dock.id = 'jk27Dock';
      dock.className = 'no-print';
      dock.innerHTML = '<div id="jk27DockInner"></div>';
      document.body.appendChild(dock);
    }
    state.dock = dock;
    state.inner = dock.querySelector('#jk27DockInner');
  }

  function isValidNode(node){
    return node instanceof HTMLElement;
  }

  function collectLateNodes(){
    if(!state.head || !state.wrap) return;
    Array.from(state.head.children).forEach((node) => {
      if(!isValidNode(node)) return;
      if(node === state.title || node === state.wrap || node === state.placeholder || node === state.sentinel) return;
      state.wrap.appendChild(node);
    });
  }

  function build(){
    const head = document.querySelector('.page-head');
    if(!head || head.dataset.jk27Ready === '1') return false;
    const children = Array.from(head.children).filter(isValidNode);
    if(children.length < 2) return false;

    const title = children[0];
    title.classList.add('jk27-title-block');

    const sentinel = document.createElement('div');
    sentinel.className = 'jk27-sentinel';

    const placeholder = document.createElement('div');
    placeholder.className = 'jk27-placeholder no-print';

    const wrap = document.createElement('div');
    wrap.className = 'jk27-action-wrap no-print';

    children.slice(1).forEach((node) => wrap.appendChild(node));

    head.appendChild(sentinel);
    head.appendChild(placeholder);
    head.appendChild(wrap);
    head.classList.add('jk27-ready');
    head.dataset.jk27Ready = '1';

    state.head = head;
    state.title = title;
    state.wrap = wrap;
    state.placeholder = placeholder;
    state.sentinel = sentinel;

    ensureDock();
    return true;
  }

  function measurePlaceholder(){
    if(!state.wrap || !state.placeholder) return;
    const h = Math.max(1, Math.ceil(state.wrap.getBoundingClientRect().height));
    state.placeholder.style.height = h + 'px';
  }

  function setFixed(on){
    if(!state.wrap || !state.head || !state.placeholder || !state.inner) return;
    if(state.fixed === on) return;
    state.fixed = on;
    if(on){
      measurePlaceholder();
      state.placeholder.classList.add('jk27-active');
      state.inner.appendChild(state.wrap);
      state.dock.classList.add('jk27-show');
      state.wrap.setAttribute('data-jk27-fixed','1');
    }else{
      state.head.appendChild(state.wrap);
      state.placeholder.classList.remove('jk27-active');
      state.placeholder.style.height = '';
      state.dock.classList.remove('jk27-show');
      state.wrap.removeAttribute('data-jk27-fixed');
    }
  }

  function update(){
    state.ticking = false;
    if(!state.sentinel) return;
    collectLateNodes();
    const rect = state.sentinel.getBoundingClientRect();
    const shouldFix = rect.top < state.thresholdTop;
    if(shouldFix && !state.fixed) setFixed(true);
    else if(!shouldFix && state.fixed) setFixed(false);
    if(state.fixed) measurePlaceholder();
  }

  function requestUpdate(){
    if(state.ticking) return;
    state.ticking = true;
    requestAnimationFrame(update);
  }

  function initObserver(){
    if(!('IntersectionObserver' in window) || !state.sentinel) return;
    if(state.observer) state.observer.disconnect();
    state.observer = new IntersectionObserver(() => requestUpdate(), {
      root: null,
      threshold: [0, 1],
      rootMargin: '-' + state.thresholdTop + 'px 0px 0px 0px'
    });
    state.observer.observe(state.sentinel);
  }

  function initMutationObserver(){
    if(!state.head) return;
    if(state.mo) state.mo.disconnect();
    state.mo = new MutationObserver(() => {
      collectLateNodes();
      requestUpdate();
    });
    state.mo.observe(state.head, { childList: true, subtree: false });
  }

  function init(){
    if(!build()) return;
    collectLateNodes();
    initObserver();
    initMutationObserver();
    requestUpdate();

    window.addEventListener('scroll', requestUpdate, { passive:true });
    window.addEventListener('resize', requestUpdate, { passive:true });
    window.addEventListener('orientationchange', requestUpdate, { passive:true });

    setTimeout(() => { collectLateNodes(); requestUpdate(); }, 120);
    setTimeout(() => { collectLateNodes(); requestUpdate(); }, 600);
    setTimeout(() => { collectLateNodes(); requestUpdate(); }, 1400);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

;
(function(){
  const STORAGE_KEY = 'jk_theme_mode';
  const DARK = 'dark';
  const LIGHT = 'light';

  function applyTheme(mode){
    const root = document.documentElement;
    if(mode === DARK) root.setAttribute('data-jk-theme', DARK);
    else root.removeAttribute('data-jk-theme');
    updateButton(mode);
  }

  function currentTheme(){
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved === DARK || saved === LIGHT) return saved;
    return LIGHT;
  }

  function nextTheme(mode){
    return mode === DARK ? LIGHT : DARK;
  }

  function buttonLabel(mode){
    return mode === DARK ? '☀️ โหมดสว่าง' : '🌙 โหมดมืด';
  }

  function updateButton(mode){
    const btn = document.getElementById('jk28ThemeToggle');
    if(!btn) return;
    btn.setAttribute('data-theme-mode', mode);
    btn.innerHTML = '<span class="jk28-theme-dot"></span><span>' + buttonLabel(mode) + '</span>';
    btn.setAttribute('aria-label', buttonLabel(mode));
    btn.setAttribute('title', buttonLabel(mode));
  }

  function onToggle(){
    const mode = currentTheme();
    const changed = nextTheme(mode);
    localStorage.setItem(STORAGE_KEY, changed);
    applyTheme(changed);
  }

  function ensureButton(){
    if(document.getElementById('jk28ThemeToggle')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'jk28ThemeToggle';
    button.className = 'outline-btn no-print';
    button.addEventListener('click', onToggle);

    const userBox = document.querySelector('.topbar .user-box');
    if(userBox){
      userBox.insertBefore(button, userBox.firstChild);
    } else {
      const topbar = document.querySelector('.topbar');
      if(topbar) topbar.appendChild(button);
    }
    updateButton(currentTheme());
  }

  function init(){
    ensureButton();
    applyTheme(currentTheme());
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

;
(function(){
  const path = location.pathname.replace(/\\/g,'/');
  const here = path.split('/').pop() || '';
  const inFinance = path.includes('/finance/');
  const inStock = path.includes('/stock/');
  const inPurchasing = path.includes('/purchasing/');
  const depth = inFinance || inStock || inPurchasing ? '../' : './';

  const links = {
    dashboard: depth + 'dashboard.html',
    finance: depth + 'finance/financial-summary.html',
    stock: depth + 'stock/ingredients.html',
    purchasing: depth + 'purchasing/purchase-orders.html',
    daily: depth + 'finance/daily-closing.html',
    eod: depth + 'finance/end-of-day.html',
    sales: depth + 'finance/sales-history.html',
    recon: depth + 'finance/reconciliation.html',
    pnl: depth + 'finance/pnl.html',
    expenses: depth + 'finance/expenses.html',
    count: depth + 'stock/count.html',
    movements: depth + 'stock/movements.html',
    reports: depth + 'stock/reports.html',
    cost: depth + 'stock/cost-control.html',
    suppliers: depth + 'purchasing/suppliers.html',
    docs: depth + 'purchasing/purchase-documents.html',
    returns: depth + 'purchasing/purchase-returns.html',
    employees: depth + 'employees.html'
  };

  function activeKey(){
    if(here === 'dashboard.html') return 'dashboard';
    if(inFinance) return 'finance';
    if(inStock) return 'stock';
    if(inPurchasing) return 'purchasing';
    return 'more';
  }

  function makeItem({key,href,icon,label}){
    const a = document.createElement(href ? 'a' : 'button');
    if(href) a.href = href; else a.type='button';
    a.className = 'jk30-bottom-item' + (activeKey()===key ? ' active' : '');
    a.dataset.key = key;
    a.innerHTML = `<span class="jk30-icon">${icon}</span><span class="jk30-label">${label}</span>`;
    return a;
  }

  function buildSheet(){
    const backdrop=document.createElement('div');
    backdrop.className='jk30-more-backdrop';
    backdrop.id='jk30MoreBackdrop';

    const sheet=document.createElement('section');
    sheet.className='jk30-more-sheet';
    sheet.id='jk30MoreSheet';
    sheet.setAttribute('aria-hidden','true');
    sheet.innerHTML=`
      <div class="jk30-sheet-head"><strong>เมนูเพิ่มเติม</strong><button class="jk30-sheet-close" type="button" aria-label="ปิด">×</button></div>
      <div class="jk30-sheet-section">งานประจำวัน</div>
      <div class="jk30-sheet-grid">
        <a class="jk30-sheet-link" href="${links.daily}">🌙 Daily Closing</a>
        <a class="jk30-sheet-link" href="${links.eod}">🔐 End of Day</a>
        <a class="jk30-sheet-link" href="${links.sales}">🧾 Sales History</a>
        <a class="jk30-sheet-link" href="${links.recon}">💳 Reconciliation</a>
      </div>
      <div class="jk30-sheet-section">การเงิน</div>
      <div class="jk30-sheet-grid">
        <a class="jk30-sheet-link" href="${links.pnl}">📈 P&amp;L</a>
        <a class="jk30-sheet-link" href="${links.expenses}">🧾 ค่าใช้จ่าย</a>
      </div>
      <div class="jk30-sheet-section">Stock</div>
      <div class="jk30-sheet-grid">
        <a class="jk30-sheet-link" href="${links.count}">🧮 Stock Count</a>
        <a class="jk30-sheet-link" href="${links.movements}">🔄 Movement</a>
        <a class="jk30-sheet-link" href="${links.reports}">📊 Report</a>
        <a class="jk30-sheet-link" href="${links.cost}">💰 Cost Control</a>
      </div>
      <div class="jk30-sheet-section">จัดซื้อ / ระบบ</div>
      <div class="jk30-sheet-grid">
        <a class="jk30-sheet-link" href="${links.suppliers}">🚚 Supplier</a>
        <a class="jk30-sheet-link" href="${links.docs}">🧾 Purchase Docs</a>
        <a class="jk30-sheet-link" href="${links.returns}">↩️ Returns</a>
        <a class="jk30-sheet-link" href="${links.employees}">👥 พนักงาน</a>
      </div>`;
    document.body.append(backdrop,sheet);
    const close=()=>{sheet.classList.remove('open');backdrop.classList.remove('open');sheet.setAttribute('aria-hidden','true');};
    const open=()=>{sheet.classList.add('open');backdrop.classList.add('open');sheet.setAttribute('aria-hidden','false');};
    backdrop.addEventListener('click',close);
    sheet.querySelector('.jk30-sheet-close').addEventListener('click',close);
    return {open,close};
  }

  function standardizeTabs(){
    document.querySelectorAll('.tabs').forEach(tabs=>{
      const count=tabs.querySelectorAll(':scope > .tab').length;
      if(count>=2 && count<=4) tabs.classList.add('jk30-segmented');
    });
  }

  function init(){
    if(!document.querySelector('.topbar') || document.body.dataset.jk30Nav==='1') return;
    document.body.dataset.jk30Nav='1';
    document.body.classList.add('jk30-has-bottom-nav');
    standardizeTabs();
    const sheet=buildSheet();
    const nav=document.createElement('nav');
    nav.className='jk30-bottom-nav no-print';
    nav.setAttribute('aria-label','เมนูหลักมือถือ');
    nav.append(
      makeItem({key:'dashboard',href:links.dashboard,icon:'⌂',label:'หน้าหลัก'}),
      makeItem({key:'finance',href:links.finance,icon:'฿',label:'การเงิน'}),
      makeItem({key:'stock',href:links.stock,icon:'▦',label:'Stock'}),
      makeItem({key:'purchasing',href:links.purchasing,icon:'🛒',label:'จัดซื้อ'}),
      makeItem({key:'more',href:null,icon:'•••',label:'เพิ่มเติม'})
    );
    const more=nav.querySelector('[data-key="more"]');
    more.addEventListener('click',sheet.open);
    document.body.appendChild(nav);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();

/* =========================================================
   V3.31 Layout Manager
   ========================================================= */
(function(){
  'use strict';

  const state={mo:null,ticking:false};

  function shortLabel(el){
    if(!(el instanceof HTMLElement)) return;
    if(el.dataset.jk31Shortened==='1') return;
    const raw=(el.textContent||'').replace(/\s+/g,' ').trim();
    const map=[
      [/จัดการหมวด/i,'🗂 หมวด'],
      [/Production\s*\/\s*Prep/i,'🏭 Prep'],
      [/Production/i,'🏭 Prep'],
      [/เพิ่มวัตถุดิบ/i,'＋ เพิ่ม'],
      [/สร้าง\s*PO/i,'＋ PO'],
      [/ดูรายงาน/i,'รายงาน'],
      [/ดูข้อมูล/i,'ข้อมูล'],
      [/ตรวจสอบ/i,'ตรวจ'],
      [/รีเฟรช/i,'↻'],
      [/พิมพ์/i,'🖨 พิมพ์'],
      [/แชร์/i,'↥ แชร์'],
      [/ปิดวัน/i,'🔒 ปิด'],
      [/เดือนนี้/i,'เดือน'],
      [/วันนี้/i,'วันนี้'],
      [/7\s*วัน/i,'7 วัน']
    ];
    for(const [re,label] of map){
      if(re.test(raw) && (el.matches('button,a') || el.classList.contains('primary-btn') || el.classList.contains('outline-btn'))){
        el.dataset.jk31FullLabel=raw;
        el.textContent=label;
        el.title=raw;
        el.setAttribute('aria-label',raw);
        break;
      }
    }
    el.dataset.jk31Shortened='1';
  }

  function compactActionLabels(){
    document.querySelectorAll('.jk27-action-wrap button,.jk27-action-wrap a').forEach(shortLabel);
  }

  function integrateStatusIntoTopbar(){
    const topbar=document.querySelector('.topbar');
    if(!topbar) return;

    let host=topbar.querySelector('.jk31-top-status');
    if(!host){
      host=document.createElement('div');
      host.className='jk31-top-status no-print';
      host.setAttribute('aria-label','สถานะระบบ');
      const userBox=topbar.querySelector('.user-box');
      if(userBox) topbar.insertBefore(host,userBox);
      else topbar.appendChild(host);
    }

    const ops=document.querySelector('.jk-opsbar');
    if(ops){
      [...ops.querySelectorAll('.jk-ops-chip')].forEach(chip=>{
        const text=(chip.textContent||'').replace(/\s+/g,' ').trim();
        if(/CHAIXI BAMEEKIAO Back Office/i.test(text)) return;
        host.appendChild(chip);
      });
      ops.remove();
    }

    // Context bar duplicates the page name already shown in the top bar.
    // Keep only one locked header, as requested.
    document.querySelectorAll('.jk23-contextbar').forEach(bar=>bar.remove());

    document.getElementById('jk31StatusDock')?.remove();
    document.body.classList.remove('jk31-status-floating','jk31-scrolled');
    document.body.classList.add('jk31-status-in-topbar');
  }

  function enhanceTables(){
    const path=location.pathname.toLowerCase();
    if(path.endsWith('/stock/ingredients.html') || path.endsWith('stock/ingredients.html')){
      document.body.classList.add('jk31-ingredients');
    }
    document.querySelectorAll('#table .table-wrap').forEach(w=>{
      w.classList.add('jk31-data-grid');
      w.setAttribute('tabindex','0');
      w.setAttribute('aria-label','ตารางข้อมูล เลื่อนขึ้นลงและซ้ายขวาได้');
    });
  }

  function updateScrollState(){
    state.ticking=false;
    // Top bar remains locked; no floating opacity state is needed.
  }
  function requestScrollUpdate(){
    if(state.ticking)return;
    state.ticking=true;
    requestAnimationFrame(updateScrollState);
  }

  function pass(){
    compactActionLabels();
    integrateStatusIntoTopbar();
    enhanceTables();
  }

  function init(){
    pass();
    setTimeout(pass,80);
    setTimeout(pass,300);
    setTimeout(pass,900);
    setTimeout(pass,1800);

    state.mo=new MutationObserver(()=>{
      clearTimeout(state._mt);
      state._mt=setTimeout(pass,30);
    });
    state.mo.observe(document.body,{childList:true,subtree:true});

    window.addEventListener('scroll',requestScrollUpdate,{passive:true});
    updateScrollState();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
