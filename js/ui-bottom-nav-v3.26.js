(function(){
'use strict';
const path=location.pathname.replace(/\\/g,'/');
const here=path.split('/').pop()||'';
const inFinance=path.includes('/finance/');
const inStock=path.includes('/stock/');
const inPurchasing=path.includes('/purchasing/');
const depth=(inFinance||inStock||inPurchasing)?'../':'./';
const links={dashboard:depth+'dashboard.html',finance:depth+'finance/financial-summary.html',stock:depth+'stock/ingredients.html',purchasing:depth+'purchasing/purchase-orders.html',daily:depth+'finance/daily-closing.html',eod:depth+'finance/end-of-day.html',sales:depth+'finance/sales-history.html',recon:depth+'finance/reconciliation.html',pnl:depth+'finance/pnl.html',expenses:depth+'finance/expenses.html',readiness:depth+'finance/cost-quality.html',costFix:depth+'finance/cost-fix.html',count:depth+'stock/count.html',movements:depth+'stock/movements.html',waste:depth+'stock/waste-loss.html',recipes:depth+'stock/recipes.html',production:depth+'stock/production.html',reports:depth+'stock/reports.html',cost:depth+'stock/cost-control.html',suppliers:depth+'purchasing/suppliers.html',docs:depth+'purchasing/purchase-documents.html',returns:depth+'purchasing/purchase-returns.html',employees:depth+'employees.html'};
function activeKey(){if(here==='dashboard.html')return'dashboard';if(inFinance)return'finance';if(inStock)return'stock';if(inPurchasing)return'purchasing';return'more'}
function icon(name){
 const c='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
 const x={
  home:`<svg ${c}><path d="M3 10.8 12 3.8l9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/></svg>`,
  finance:`<svg ${c}><rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M15.5 9h5.5v6h-5.5a3 3 0 1 1 0-6Z"/><path d="M7 9.5h4.5"/></svg>`,
  stock:`<svg ${c}><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 12 8 4 8-4"/><path d="m4 17 8 4 8-4"/></svg>`,
  cart:`<svg ${c}><path d="M3 4h2l1.8 9.1a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L20 7H6"/><circle cx="9" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/></svg>`,
  more:`<svg ${c}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>`
 };return x[name]||x.more;
}
function item(key,href,iconName,label){
 const el=document.createElement(href?'a':'button'); if(href)el.href=href;else el.type='button';
 el.className='jk26-bottom-item'+(activeKey()===key?' active':'');el.dataset.key=key;el.setAttribute('aria-label',label);
 if(activeKey()===key)el.setAttribute('aria-current','page');
 el.innerHTML=`<span class="jk26-active-line"></span><span class="jk26-bottom-icon">${icon(iconName)}</span><span class="jk26-bottom-label">${label}</span>`;
 return el;
}
function isVisible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'&&el.getClientRects().length>0}
function blockingOverlayOpen(){
 if(document.body.classList.contains('sidebar-open')) return true;
 const sb=document.getElementById('sidebar')||document.querySelector('.sidebar'); if(sb&&sb.classList.contains('open')) return true;
 const selectors=['.modal:not(.hidden)','dialog[open]','[role="dialog"]','.drawer.open','.offcanvas.open','.sheet.open','.jk26-more-sheet.open'];
 return selectors.some(sel=>Array.from(document.querySelectorAll(sel)).some(isVisible));
}
function buildMore(onState){
 const backdrop=document.createElement('div');backdrop.className='jk26-more-backdrop no-print';
 const sheet=document.createElement('section');sheet.className='jk26-more-sheet no-print';sheet.setAttribute('aria-hidden','true');sheet.setAttribute('aria-label','เมนูเพิ่มเติม');
 sheet.innerHTML=`<div class="jk26-sheet-grabber"></div><div class="jk26-sheet-head"><strong>เมนูเพิ่มเติม</strong><button class="jk26-sheet-close" type="button" aria-label="ปิดเมนู">×</button></div><div class="jk26-sheet-section">งานประจำวัน</div><div class="jk26-sheet-grid"><a class="jk26-sheet-link" href="${links.daily}">🌙 Daily Closing</a><a class="jk26-sheet-link" href="${links.eod}">🔐 End of Day</a><a class="jk26-sheet-link" href="${links.sales}">🧾 ประวัติยอดขาย</a><a class="jk26-sheet-link" href="${links.recon}">💳 กระทบยอด</a></div><div class="jk26-sheet-section">การเงิน</div><div class="jk26-sheet-grid"><a class="jk26-sheet-link" href="${links.pnl}">📈 P&amp;L</a><a class="jk26-sheet-link" href="${links.expenses}">🧾 ค่าใช้จ่าย</a><a class="jk26-sheet-link" href="${links.readiness}">✅ Cost Quality</a><a class="jk26-sheet-link" href="${links.costFix}">🛠️ Cost Fix</a></div><div class="jk26-sheet-section">Stock &amp; Cost</div><div class="jk26-sheet-grid"><a class="jk26-sheet-link" href="${links.count}">🧮 Stock Count</a><a class="jk26-sheet-link" href="${links.movements}">🔄 Stock Movement</a><a class="jk26-sheet-link" href="${links.waste}">🗑️ Waste / Loss</a><a class="jk26-sheet-link" href="${links.recipes}">🍳 Recipe / BOM</a><a class="jk26-sheet-link" href="${links.production}">🏭 Production</a><a class="jk26-sheet-link" href="${links.reports}">📊 Stock Report</a><a class="jk26-sheet-link" href="${links.cost}">💰 Cost Control</a></div><div class="jk26-sheet-section">จัดซื้อ / ระบบ</div><div class="jk26-sheet-grid"><a class="jk26-sheet-link" href="${links.suppliers}">🚚 Supplier</a><a class="jk26-sheet-link" href="${links.docs}">🧾 Purchase Documents</a><a class="jk26-sheet-link" href="${links.returns}">↩️ Purchase Returns</a><a class="jk26-sheet-link" href="${links.employees}">👥 พนักงาน</a></div>`;
 document.body.append(backdrop,sheet);
 const close=()=>{backdrop.classList.remove('open');sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true');document.documentElement.style.overflow='';onState&&onState()};
 const open=()=>{backdrop.classList.add('open');sheet.classList.add('open');sheet.setAttribute('aria-hidden','false');document.documentElement.style.overflow='hidden';onState&&onState()};
 backdrop.addEventListener('click',close);sheet.querySelector('.jk26-sheet-close').addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 return{open,close};
}
function init(){
 if(!document.querySelector('.topbar')||document.querySelector('.jk26-bottom-nav'))return;
 document.body.classList.add('jk26-has-bottom-nav');
 const nav=document.createElement('nav');nav.className='jk26-bottom-nav no-print is-hidden';nav.setAttribute('aria-label','เมนูหลัก');
 let hasScrolled=false,lastY=window.scrollY||0,raf=0;
 const sync=()=>{
   raf=0;const y=window.scrollY||document.documentElement.scrollTop||0;
   if(y<50)hasScrolled=false;
   else if(y>lastY+2)hasScrolled=true;
   const blocked=blockingOverlayOpen();
   nav.classList.toggle('is-hidden',!hasScrolled||blocked);
   document.body.classList.toggle('jk26-nav-visible',hasScrolled&&!blocked);
   lastY=y;
 };
 const queue=()=>{if(!raf)raf=requestAnimationFrame(sync)};
 const more=buildMore(queue);
 nav.append(item('dashboard',links.dashboard,'home','หน้าหลัก'),item('finance',links.finance,'finance','การเงิน'),item('stock',links.stock,'stock','Stock'),item('purchasing',links.purchasing,'cart','จัดซื้อ'),item('more',null,'more','เพิ่มเติม'));
 nav.querySelector('[data-key="more"]').addEventListener('click',()=>{nav.classList.add('is-hidden');more.open()});
 nav.querySelectorAll('a.jk26-bottom-item').forEach(a=>a.addEventListener('click',()=>nav.classList.add('is-hidden')));
 document.body.appendChild(nav);
 window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue,{passive:true});
 document.getElementById('menuBtn')?.addEventListener('click',()=>setTimeout(queue,20));
 const observer=new MutationObserver(queue);observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','open','style','aria-hidden']});
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
