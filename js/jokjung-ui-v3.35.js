/* CHAIXI BAMEEKIAO Back Office V3.35 — unified component cleanup (mobile + desktop) */
(() => {
  'use strict';

  const q = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => [...r.querySelectorAll(s)];
  const visible = el => el instanceof HTMLElement && !el.hidden && el.style.display !== 'none' && !el.classList.contains('hidden') && !el.closest('[hidden],.hidden');
  const labelOf = el => ((el?.dataset?.jk31FullLabel || el?.dataset?.jk32SourceLabel || el?.getAttribute?.('aria-label') || el?.title || el?.textContent || '') + '').replace(/\s+/g,' ').trim();

  function roleOf(el){
    const s = `${el?.id||''} ${el?.className||''} ${labelOf(el)}`.toLowerCase();
    if(/แชร์|share/.test(s)) return 'share';
    if(/พิมพ์|print/.test(s)) return 'print';
    if(/refreshbtn|รีเฟรช|refresh/.test(s)) return 'refresh';
    if(/(^|\s|[-_])(add|new|create)(btn)?(\s|$|[-_])|เพิ่ม|สร้าง|เริ่มนับ/.test(s)) return 'add';
    return 'action';
  }

  function uniq(arr){
    const seen = new Set();
    return arr.filter(el => {
      if(!(el instanceof HTMLElement) || seen.has(el)) return false;
      seen.add(el); return true;
    });
  }

  function topbar(){ return q('.topbar'); }

  function prepareTopbar(){
    const bar = topbar();
    if(!bar) return null;
    bar.classList.add('jk35-unified-topbar');

    const left = q(':scope > .topbar-left', bar);
    if(left){
      left.classList.add('jk35-title-row');
      let printHost = q(':scope > .jk35-print-host', left);
      if(!printHost){
        printHost = document.createElement('div');
        printHost.className = 'jk35-print-host no-print';
        left.appendChild(printHost);
      }
    }

    const user = q(':scope > .user-box', bar);
    if(user) user.classList.add('jk35-user-row');
    const status = q(':scope > .jk31-top-status', bar);
    if(status) status.classList.add('jk35-status-row');
    return bar;
  }

  function preferred(candidates, type){
    const scored = candidates.map((el, index) => {
      const id = (el.id || '').toLowerCase();
      let score = 0;
      if(type === 'share'){
        if(id === 'globalsharebtn') score += 50;
        if(/sharebtn/.test(id)) score += 20;
      }else if(type === 'print'){
        if(id !== 'globalprintbtn' && /print/.test(id)) score += 50; // preserve page-specific print behavior
        if(id === 'globalprintbtn') score += 10;
        if(el.onclick) score += 8;
      }
      if(el.closest('.topbar')) score += 4;
      return {el, score, index};
    });
    scored.sort((a,b) => b.score - a.score || a.index - b.index);
    return scored[0]?.el || null;
  }

  function makeIconOnly(el, type){
    const label = labelOf(el) || (type === 'share' ? 'แชร์' : 'พิมพ์');
    const cls = type === 'share' ? 'jk35-floating-share' : 'jk35-top-print';
    const glyph = type === 'share' ? '↥' : '🖨';
    el.classList.remove('primary-btn','outline-btn','small-btn','jk33-icon-action','jk33-segment-item');
    el.classList.add(cls,'no-print');
    if(el.dataset.jk35Icon !== type){
      el.innerHTML = `<span class="jk35-action-icon" aria-hidden="true">${glyph}</span>`;
      el.dataset.jk35Icon = type;
    }
    if(el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label);
    if(el.title !== label) el.title = label;
    if(el.style.display === 'none') el.style.display = '';
    return el;
  }


  function ensureUniversalShare(){
    let btn=q('#jk35UniversalShare');
    if(btn) return btn;
    btn=document.createElement('button');
    btn.type='button';
    btn.id='jk35UniversalShare';
    btn.setAttribute('aria-label','แชร์');
    btn.title='แชร์';
    btn.addEventListener('click', async () => {
      const title=q('.page-head h2')?.textContent?.trim() || q('.topbar h1')?.textContent?.trim() || document.title;
      const url=location.href;
      try{
        if(navigator.share){ await navigator.share({title,text:title,url}); return; }
        if(navigator.clipboard?.writeText){ await navigator.clipboard.writeText(`${title}\n${url}`); return; }
        window.prompt('Copy link',url);
      }catch(err){ if(err?.name!=='AbortError') console.error('Share error',err); }
    });
    document.body.appendChild(btn);
    return btn;
  }

  function dedupeSharePrint(){
    const bar = prepareTopbar();
    if(!bar) return;

    const all = uniq(qa('button,a').filter(el => !el.closest('.modal,dialog') && (roleOf(el)==='share' || roleOf(el)==='print')));
    const shares = all.filter(el => roleOf(el)==='share');
    const prints = all.filter(el => roleOf(el)==='print');
    if(!shares.length) shares.push(ensureUniversalShare());

    const share = preferred(shares, 'share');
    if(share){
      makeIconOnly(share, 'share');
      if(share.parentElement !== document.body) document.body.appendChild(share);
      share.dataset.jk35Owner = 'share';
    }
    shares.filter(el => el !== share).forEach(el => { el.style.display='none'; el.dataset.jk35Duplicate='1'; });

    const print = preferred(prints, 'print');
    const host = q('.jk35-print-host', bar);
    if(print && host){
      makeIconOnly(print, 'print');
      if(print.parentElement !== host) host.appendChild(print);
      print.dataset.jk35Owner = 'print';
    }
    prints.filter(el => el !== print).forEach(el => { el.style.display='none'; el.dataset.jk35Duplicate='1'; });

    document.body.classList.toggle('jk35-has-share', !!share);
  }

  function normalizeFab(el){
    const label = labelOf(el) || 'เพิ่ม';
    el.classList.remove('primary-btn','outline-btn','small-btn','jk33-primary-fab','jk33-fab-add');
    el.classList.add('jk35-primary-fab','no-print');
    if(el.dataset.jk35Fab !== '1'){
      el.innerHTML = '<span class="jk35-fab-plus" aria-hidden="true">+</span>';
      el.dataset.jk35Fab='1';
    }
    if(el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label);
    if(el.title !== label) el.title = label;
    if(el.style.display === 'none') el.style.display='';
    if(el.parentElement !== document.body) document.body.appendChild(el);
    document.body.classList.add('jk35-has-add');
  }

  function normalizeRefresh(el){
    const label = labelOf(el) || 'รีเฟรช';
    el.classList.remove('primary-btn','outline-btn','small-btn','jk32-fab-refresh','jk33-refresh-fab');
    el.classList.add('jk35-refresh-fab','no-print');
    if(el.dataset.jk35Refresh !== '1'){
      el.innerHTML = '<span class="jk35-action-icon" aria-hidden="true">↻</span>';
      el.dataset.jk35Refresh='1';
    }
    if(el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label);
    if(el.title !== label) el.title=label;
    if(el.style.display === 'none') el.style.display='';
    if(el.parentElement !== document.body) document.body.appendChild(el);
  }

  function normalizeGlobalFabs(){
    const buttons = uniq(qa('button,a').filter(el => !el.closest('.modal,dialog')));

    const adds = buttons.filter(el => roleOf(el)==='add' && visible(el));
    const existingFab = q('.jk35-primary-fab');
    let add = existingFab || adds.sort((a,b) => {
      const score = el => {
        let n=0; const id=(el.id||'').toLowerCase(), s=labelOf(el);
        if(/^(add|new|create)btn$/.test(id)) n+=20;
        if(el.classList.contains('primary-btn')) n+=8;
        if(/เพิ่ม|เริ่มนับ/.test(s)) n+=5;
        return n;
      };
      return score(b)-score(a);
    })[0];
    if(add) normalizeFab(add);
    uniq(qa('.jk35-primary-fab,.jk33-primary-fab,.jk33-fab-add').filter(el=>el!==add)).forEach(el=>el.remove());
    if(!add) document.body.classList.remove('jk35-has-add');

    const refreshes = buttons.filter(el => roleOf(el)==='refresh' && visible(el));
    const existingRefresh = q('.jk35-refresh-fab');
    const refresh = existingRefresh || refreshes[0];
    if(refresh) normalizeRefresh(refresh);
    uniq(qa('.jk35-refresh-fab,.jk33-refresh-fab,.jk32-fab-refresh').filter(el=>el!==refresh)).forEach(el=>el.style.display='none');
  }

  function normalizePageHeads(){
    qa('.page-head').forEach(head => {
      head.classList.add('jk35-page-head');
      // Report actions are owned by topbar/floating share. Never show them here.
      qa('.report-actions,.auto-report-actions,.jk33-tools,.jk33-title-tools', head).forEach(box => {
        const keep = qa('button,a,input,select,textarea', box).filter(el => {
          const r=roleOf(el); return visible(el) && r!=='share' && r!=='print';
        });
        if(!keep.length) box.style.display='none';
      });

      const remaining = uniq(qa('button,a',head).filter(el => visible(el) && !el.closest('.tabs,.quick-range,.jk314-range-actions')))
        .filter(el => !['share','print','refresh','add'].includes(roleOf(el)));
      if(!remaining.length) return;

      let box = q(':scope > .jk35-page-actions', head);
      if(!box){
        box=document.createElement('div'); box.className='jk35-page-actions no-print'; head.appendChild(box);
      }
      remaining.forEach(el => {
        const label = labelOf(el); if(!label) return;
        el.classList.remove('primary-btn','outline-btn','small-btn');
        el.textContent=label.replace(/^\s*[+＋]\s*/,'');
        if(el.parentElement !== box) box.appendChild(el);
      });
      box.classList.toggle('jk35-pair', [...box.children].filter(visible).length===2);
    });
  }

  function wrapDateRange(box){
    if(!(box instanceof HTMLElement) || box.dataset.jk35Date==='1') return;
    const inputs=qa('input[type=date]',box).filter(visible).slice(0,2);
    if(inputs.length<2) return;
    const [from,to]=inputs;
    const field=(input,label) => {
      let f=input.closest('label.field,.jk35-date-field,.jk33-date-field');
      if(!f || !box.contains(f)){
        f=document.createElement('label'); f.className='jk35-date-field';
        const s=document.createElement('span'); s.textContent=label; f.append(s,input);
      }else{
        f.classList.add('jk35-date-field');
        let s=q(':scope > span',f); if(!s){s=document.createElement('span');f.prepend(s)}
        s.textContent=label;
      }
      return f;
    };
    const ff=field(from,'ตั้งแต่'), tf=field(to,'ถึง');
    const range=document.createElement('div'); range.className='jk35-date-range';
    const sep=document.createElement('span'); sep.className='jk35-date-sep'; sep.textContent='ถึง';
    const anchor=ff.parentElement===box?ff:(from.parentElement||from);
    box.insertBefore(range,anchor); range.append(ff,sep,tf);
    box.dataset.jk35Date='1';
  }

  function normalizeFilters(){
    qa('.toolbar,.filters,.finance-summary-toolbar,.waste-toolbar,.filter-bar,.filter-panel').forEach(box => {
      wrapDateRange(box);
      box.classList.add('jk35-filter-shell');
      qa('label',box).forEach(label => {
        if(label.querySelector('input[type=checkbox]')) label.classList.add('jk35-check-label');
      });
    });
  }

  function fixTables(){
    qa('table').forEach(t => {
      const p=t.parentElement; if(!p) return;
      if(!p.classList.contains('table-wrap')&&!p.classList.contains('table-scroll')&&!p.classList.contains('jk31-table-shell')){
        const shell=document.createElement('div'); shell.className='jk31-table-shell'; p.insertBefore(shell,t); shell.appendChild(t);
      }
    });
  }

  function cleanLegacy(){
    q('#jkNavProgress')?.remove();
    q('#jk27Dock')?.remove();
    qa('.jk27-placeholder').forEach(el=>el.remove());
    qa('.jk27-action-wrap,.report-actions,.auto-report-actions').forEach(box => {
      const live=qa('button,a,input,select,textarea',box).filter(visible).filter(el=>!['share','print'].includes(roleOf(el)));
      if(!live.length) box.style.display='none';
    });
  }

  function run(){
    prepareTopbar();
    cleanLegacy();
    dedupeSharePrint();
    normalizePageHeads();
    normalizeGlobalFabs();
    normalizeFilters();
    fixTables();
    dedupeSharePrint(); // report toolbar can be installed after first pass
  }

  let timer=0;
  function schedule(){ clearTimeout(timer); timer=setTimeout(run,35); }
  function init(){
    run();
    setTimeout(run,120); setTimeout(run,500); setTimeout(run,1200); setTimeout(run,2200);
    const mo=new MutationObserver(schedule); mo.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(run,100),{passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
