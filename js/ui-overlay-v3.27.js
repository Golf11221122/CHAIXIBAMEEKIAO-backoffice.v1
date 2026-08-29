(function(){
'use strict';

function visible(el){
  if(!el || !el.isConnected) return false;
  if(el.hidden) return false;
  const s=getComputedStyle(el);
  return s.display!=='none' && s.visibility!=='hidden' && s.opacity!=='0' && el.getClientRects().length>0;
}

function popupOpen(){
  const selectors=[
    '.modal:not(.hidden)',
    'dialog[open]',
    '[role="dialog"][aria-modal="true"]',
    '.jk23-date-dialog:not([hidden])',
    '.jk26-more-sheet.open',
    '.drawer.open:not(.sidebar)',
    '.offcanvas.open',
    '.sheet.open:not(.jk26-more-sheet)'
  ];
  return selectors.some(sel=>Array.from(document.querySelectorAll(sel)).some(visible));
}

function init(){
  const sidebar=document.getElementById('sidebar')||document.querySelector('.sidebar');
  const menuBtn=document.getElementById('menuBtn');

  /* Guarantee one scrim even on pages where an older UI script did not create it. */
  let scrim=document.querySelector('.jk-sidebar-scrim');
  if(!scrim){
    scrim=document.createElement('div');
    scrim.className='jk-sidebar-scrim no-print';
    scrim.setAttribute('aria-hidden','true');
    document.body.appendChild(scrim);
  }

  const syncSidebar=()=>{
    const open=!!(sidebar&&sidebar.classList.contains('open'));
    document.body.classList.toggle('sidebar-open',open);
    scrim.setAttribute('aria-hidden',open?'false':'true');
  };

  const syncPopup=()=>{
    const open=popupOpen();
    document.body.classList.toggle('jk27-popup-open',open);
    /* V3.26 bottom nav listens to DOM mutations; this explicit class makes the state immediate. */
    document.querySelector('.jk26-bottom-nav')?.classList.toggle('is-hidden',open||document.body.classList.contains('sidebar-open'));
  };

  const sync=()=>{syncSidebar();syncPopup();};

  menuBtn?.addEventListener('click',()=>requestAnimationFrame(sync));
  scrim.addEventListener('click',()=>{
    sidebar?.classList.remove('open');
    document.body.classList.remove('sidebar-open');
    sync();
  });
  document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',()=>requestAnimationFrame(sync)));

  const observer=new MutationObserver(()=>requestAnimationFrame(sync));
  observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style','hidden','open','aria-hidden','aria-modal']});
  window.addEventListener('resize',sync,{passive:true});
  window.addEventListener('pageshow',sync,{passive:true});
  sync();
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
