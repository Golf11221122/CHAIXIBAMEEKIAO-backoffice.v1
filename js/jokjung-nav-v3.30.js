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
