/* CHAIXI BAMEEKIAO Back Office V3.33 — stable DOM normalizer, mobile only */
(() => {
  'use strict';
  const MOBILE = 760;
  const q = (s,r=document) => r.querySelector(s);
  const qa = (s,r=document) => [...r.querySelectorAll(s)];
  const mobile = () => window.innerWidth <= MOBILE;
  const visible = el => el instanceof HTMLElement && !el.hidden && !el.classList.contains('hidden') && !el.closest('[hidden],.hidden');
  const labelOf = el => ((el?.dataset?.jk31FullLabel || el?.dataset?.jk32SourceLabel || el?.getAttribute?.('aria-label') || el?.title || el?.textContent || '')+'').replace(/\s+/g,' ').trim();
  const roleOf = el => {
    const s = `${el?.id||''} ${el?.className||''} ${labelOf(el)}`.toLowerCase();
    if(/แชร์|share/.test(s)) return 'share';
    if(/พิมพ์|print/.test(s)) return 'print';
    if(/refreshbtn|รีเฟรช|refresh/.test(s)) return 'refresh';
    if(/(^|\s|[-_])(add|new|create)(btn)?(\s|$|[-_])|เพิ่ม|สร้าง|เริ่มนับ/.test(s)) return 'add';
    return 'action';
  };

  function icon(role){
    return role==='share' ? '↥' : role==='print' ? '🖨' : role==='refresh' ? '↻' : '+';
  }

  function titleBlock(head){
    let block = q(':scope > .jk33-title-block',head);
    if(block) return block;
    const old = q(':scope > .jk27-title-block',head) || q(':scope > div:first-child',head);
    if(!old) return null;
    old.classList.add('jk33-title-block');
    return old;
  }

  function ensureTools(head,block){
    let tools = q(':scope > .jk33-tools',head);
    if(!tools){
      tools=document.createElement('div');
      tools.className='jk33-tools no-print';
      head.appendChild(tools);
    }
    return tools;
  }

  function ensureActions(head){
    let box=q(':scope > .jk33-page-actions',head);
    if(!box){
      box=document.createElement('div');
      box.className='jk33-page-actions no-print';
      head.appendChild(box);
    }
    return box;
  }

  function normalizeIconButton(el,role){
    const label=labelOf(el) || (role==='share'?'แชร์':'พิมพ์');
    el.classList.add('jk33-icon-action');
    el.classList.remove('primary-btn','outline-btn','small-btn','jk33-segment-item','jk33-fab-add');
    el.innerHTML=`<span class="jk33-icon" aria-hidden="true">${icon(role)}</span>`;
    el.setAttribute('aria-label',label);
    el.title=label;
  }

  function normalizeFab(el){
    const label=labelOf(el)||'เพิ่ม';
    el.className = [...el.classList].filter(c=>!['jk33-fab-add','jk32-fab-refresh','jk33-segment-item'].includes(c)).join(' ');
    el.classList.add('jk33-primary-fab','no-print');
    el.innerHTML='<span class="jk33-fab-plus" aria-hidden="true">+</span>';
    el.setAttribute('aria-label',label);
    el.title=label;
    if(el.parentElement!==document.body) document.body.appendChild(el);
    document.body.classList.add('jk33-has-add');
    el.dataset.jk33Done='fab';
  }

  function normalizeRefresh(el){
    const label=labelOf(el)||'รีเฟรช';
    el.classList.remove('jk32-fab-refresh','jk33-segment-item','primary-btn','outline-btn','small-btn');
    el.classList.add('jk33-refresh-fab','no-print');
    el.innerHTML='<span class="jk33-icon" aria-hidden="true">↻</span>';
    el.setAttribute('aria-label',label);
    el.title=label;
    if(el.parentElement!==document.body) document.body.appendChild(el);
    el.dataset.jk33Done='refresh';
  }

  function uniqueButtons(elements){
    const seen=new Set();
    return elements.filter(el=>{
      if(!(el instanceof HTMLElement) || seen.has(el)) return false;
      seen.add(el); return true;
    });
  }



  function ensureTopbarTools(){
    const topbar=q('.topbar');
    if(!topbar) return null;
    let tools=q(':scope > .jk33-top-actions',topbar);
    if(!tools){
      tools=document.createElement('div');
      tools.className='jk33-top-actions no-print';
      tools.setAttribute('aria-label','เครื่องมือหน้า');
      const user=q(':scope > .user-box',topbar);
      if(user) topbar.insertBefore(tools,user);
      else topbar.appendChild(tools);
    }
    return tools;
  }

  function moveGlobalSharePrintToTopbar(){
    const tools=ensureTopbarTools();
    if(!tools) return;
    const buttons=uniqueButtons(qa('button,a').filter(el=>{
      if(!visible(el) || el.closest('.modal,dialog')) return false;
      const role=roleOf(el);
      return role==='share' || role==='print';
    }));
    buttons.forEach(el=>{
      const role=roleOf(el);
      normalizeIconButton(el,role);
      if(el.parentElement!==tools) tools.appendChild(el);
      el.dataset.jk33Done='top-tool';
    });
    tools.style.display=buttons.length?'flex':'none';
  }

  function normalizePageHead(head){
    if(!(head instanceof HTMLElement)) return;
    head.classList.add('jk33-head');
    const block=titleBlock(head);
    if(!block) return;

    const candidates=uniqueButtons([
      ...qa('button,a',head),
      ...qa('.report-actions button,.report-actions a,.auto-report-actions button,.auto-report-actions a',head)
    ]).filter(visible).filter(el=>!el.closest('.tabs,.quick-range'));

    const actions=ensureActions(head);

    // Share / Print are owned by the real topbar in V3.34.
    // Never place them inside page-head.

    // one primary add/create per page only
    const addCandidates=candidates.filter(el=>roleOf(el)==='add' && !el.closest('.modal'));
    if(addCandidates.length){
      const score=el=>{
        let n=0; const s=labelOf(el);
        if(/^(add|new|create)btn$/i.test(el.id||'')) n+=10;
        if(el.classList.contains('primary-btn')) n+=4;
        if(/เพิ่ม|เริ่มนับ/.test(s)) n+=4;
        return n;
      };
      addCandidates.sort((a,b)=>score(b)-score(a));
      normalizeFab(addCandidates[0]);
    }

    // remaining header actions become compact pills / 2-up row
    candidates.filter(el=>roleOf(el)==='action' && !el.closest('.modal')).forEach(el=>{
      const label=labelOf(el);
      if(!label) return;
      el.classList.remove('primary-btn','outline-btn','small-btn','jk33-segment-item');
      el.textContent=label.replace(/^\s*[+＋]\s*/,'');
      el.title=label;
      if(el.parentElement!==actions) actions.appendChild(el);
      el.dataset.jk33Done='action';
    });
    const act=[...actions.children].filter(visible);
    actions.classList.toggle('jk33-pair',act.length===2);
    if(act.length===0) actions.remove();

    // remove legacy empty wrappers/spacers
    qa('.jk27-action-wrap,.action-row,.report-actions,.auto-report-actions',head).forEach(w=>{
      if(!qa('button,a,input,select,textarea',w).some(visible)) w.remove();
    });
    qa('.jk33-title-tools,.jk33-segment-scroll',head).forEach(old=>{
      if(old!==actions && !qa('button,a,input,select,textarea',old).some(visible)) old.remove();
    });
  }

  function wrapDateRange(box){
    if(!(box instanceof HTMLElement) || box.dataset.jk33Date==='1') return;
    let inputs=qa('input[type="date"]',box).filter(visible);
    if(inputs.length<2) return;
    inputs=inputs.slice(0,2);
    const [from,to]=inputs;
    const fieldFor=(input,text)=>{
      let f=input.closest('label.field,.jk33-date-field');
      if(!f || !box.contains(f)){
        f=document.createElement('label'); f.className='jk33-date-field';
        const sp=document.createElement('span'); sp.textContent=text; f.appendChild(sp); f.appendChild(input);
      } else {
        f.classList.add('jk33-date-field');
        let sp=q(':scope > span',f); if(!sp){sp=document.createElement('span');f.prepend(sp)}
        sp.textContent=text;
      }
      return f;
    };
    const ff=fieldFor(from,'ตั้งแต่'), tf=fieldFor(to,'ถึง');
    const range=document.createElement('div'); range.className='jk33-date-range';
    const between=document.createElement('div'); between.className='jk33-date-between'; between.textContent='ถึง';
    const anchor=ff.parentElement===box?ff:(from.parentElement||from);
    box.insertBefore(range,anchor);
    range.append(ff,between,tf);
    box.dataset.jk33Date='1';
  }

  function normalizeFilters(){
    const boxes=qa('.toolbar,.filters,.finance-summary-toolbar,.waste-toolbar,.filter-bar,.filter-panel');
    boxes.forEach(box=>{
      wrapDateRange(box);
      // group remaining non-range form controls in a compact 2-column grid, but keep shortcut rows intact
      if(q(':scope > .jk33-remaining-filter-grid',box)) return;
      const direct=[...box.children].filter(el=>el instanceof HTMLElement && visible(el) && !el.classList.contains('jk33-date-range') && !el.classList.contains('quick-range') && !el.classList.contains('jk314-range-actions') && !el.classList.contains('tabs'));
      const move=direct.filter(el=>{
        if(el.matches('button') && roleOf(el)==='refresh') return false;
        return el.matches('label.field,input,select,textarea,button,label');
      });
      if(move.length>=2){
        const grid=document.createElement('div'); grid.className='jk33-remaining-filter-grid';
        move.forEach(el=>{
          if(el.matches('label') && el.querySelector('input[type=checkbox]')) el.classList.add('jk33-wide');
          grid.appendChild(el);
        });
        box.appendChild(grid);
      }
    });
  }

  function normalizeRefreshButtons(){
    const refs=uniqueButtons(qa('button,a').filter(el=>visible(el)&&roleOf(el)==='refresh'&&!el.closest('.modal')));
    if(!refs.length) return;
    refs.forEach((el,i)=>{
      if(i===0){ if(el.dataset.jk33Done!=='refresh') normalizeRefresh(el); }
      else if(el!==refs[0]) el.style.display='none';
    });
  }

  function fixFabs(){
    const fabs=uniqueButtons(qa('.jk33-primary-fab,.jk33-fab-add').filter(visible));
    if(fabs.length){
      if(fabs[0].dataset.jk33Done!=='fab') normalizeFab(fabs[0]);
      fabs.slice(1).forEach(el=>el.remove());
    } else document.body.classList.remove('jk33-has-add');
  }

  function fixTables(){
    qa('table').forEach(t=>{
      let parent=t.parentElement;
      if(!parent) return;
      if(!parent.classList.contains('table-wrap')&&!parent.classList.contains('table-scroll')&&!parent.classList.contains('jk31-table-shell')){
        const shell=document.createElement('div'); shell.className='jk31-table-shell';
        parent.insertBefore(shell,t); shell.appendChild(t);
      }
    });
  }

  function cleanLegacy(){
    q('#jkNavProgress')?.remove();
    q('#jk27Dock')?.remove();
    qa('.jk27-placeholder').forEach(el=>el.remove());
    qa('.jk32-collapse-empty,.jk315-empty-actions').forEach(el=>{
      if(!qa('button,a,input,select,textarea',el).some(visible)) el.remove();
    });
  }

  function run(){
    if(!mobile()) return;
    cleanLegacy();
    moveGlobalSharePrintToTopbar();
    qa('.page-head').forEach(normalizePageHead);
    moveGlobalSharePrintToTopbar();
    normalizeFilters();
    normalizeRefreshButtons();
    fixFabs();
    fixTables();
  }

  let timer=0;
  function schedule(){clearTimeout(timer);timer=setTimeout(run,30)}
  function init(){
    run();
    setTimeout(run,120);setTimeout(run,500);setTimeout(run,1200);
    const mo=new MutationObserver(schedule);mo.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(run,120),{passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
