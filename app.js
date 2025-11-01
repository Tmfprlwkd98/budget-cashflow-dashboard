// ====== State & Persistence ======
const LS_KEY = 'bd_transactions_v1';
const LS_CFG = 'bd_config_v1';

let cfg = loadCfg() || { currency: 'KRW', categories: ['급여','외주','식비','카페','주거','교통','쇼핑','구독','의료','교육'] };
let tx = load() || [];

function save(){ localStorage.setItem(LS_KEY, JSON.stringify(tx)); }
function load(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||'[]');}catch{return[]} }
function saveCfg(){ localStorage.setItem(LS_CFG, JSON.stringify(cfg)); }
function loadCfg(){ try{ return JSON.parse(localStorage.getItem(LS_CFG)||'null'); }catch{return null} }

// ====== Utils ======
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const fmt = new Intl.NumberFormat('ko-KR', { style:'currency', currency: cfg.currency || 'KRW', maximumFractionDigits:0 });
function ymd(date){ return date.toISOString().slice(0,10); }
function monthKey(date){ return date.toISOString().slice(0,7); } // yyyy-mm
function parseAmount(v){ const n = Number(v); if(Number.isNaN(n)) return 0; return n }
function uid(){ return Math.random().toString(36).slice(2,10) }
    
// ====== Elements ======
const el = {
  sumIncome: $('#sumIncome'), sumExpense: $('#sumExpense'), netCash: $('#netCash'),
  countIncome: $('#countIncome'), countExpense: $('#countExpense'), savingRate: $('#savingRate'),
  txTbody: $('#txTbody'), txDate: $('#txDate'), txDesc: $('#txDesc'), txCategory: $('#txCategory'), txType: $('#txType'), txAmount: $('#txAmount'),
  btnAdd: $('#btnAdd'), txCount: $('#txCount'), monthPicker: $('#monthPicker'), btnThisMonth: $('#btnThisMonth'),
  currencyCode: $('#currencyCode'), categorySeed: $('#categorySeed'), btnApplySettings: $('#btnApplySettings'),
  btnExport: $('#btnExport'), importFile: $('#importFile'), btnReset: $('#btnReset'),
  btnPrevMonth: $('#btnPrevMonth'), btnNextMonth: $('#btnNextMonth'), currentMonthLabel: $('#currentMonthLabel')
}

// ====== Init options ======
function refreshCategoryOptions(){
  el.txCategory.innerHTML = '';
  cfg.categories.forEach(c => {
    const opt = document.createElement('option'); opt.value = c; opt.textContent = c; el.txCategory.appendChild(opt);
  })
}

function setDefaults(){
  el.currencyCode.value = cfg.currency;
  el.categorySeed.value = cfg.categories.join(', ');
  refreshCategoryOptions();
  el.txDate.value = ymd(new Date());
}

// ====== Month filter ======
let currentMonth = monthKey(new Date());
el.monthPicker.value = currentMonth;
function setMonth(key){ currentMonth = key; el.monthPicker.value = key; el.currentMonthLabel.textContent = key; render(); }

// Prev/Next month helpers
function shiftMonth(delta){
  const [y,m] = currentMonth.split('-').map(Number);
  const dt = new Date(y, m-1+delta, 1);
  setMonth(monthKey(dt));
}

// ====== CRUD ======
function addTx(){
  const item = {
    id: uid(),
    date: el.txDate.value || ymd(new Date()),
    desc: el.txDesc.value?.trim() || '',
    category: el.txCategory.value,
    type: el.txType.value, // income | expense
    amount: parseAmount(el.txAmount.value)
  };
  if(!item.amount){ alert('금액을 입력하세요'); return }
  tx.push(item); save();
  el.txDesc.value = ''; el.txAmount.value = '';
  render();
}

function removeTx(id){
  tx = tx.filter(t => t.id !== id); save(); render();
}

// ====== Query by month ======
function listByMonth(key){ return tx.filter(t => (t.date||'').startsWith(key)); }

// ====== Render ======
let pieChart, lineChart;
function render(){
  const _fmt = new Intl.NumberFormat('ko-KR', { style:'currency', currency: cfg.currency || 'KRW', maximumFractionDigits:0 });
  const rows = listByMonth(currentMonth).sort((a,b)=> a.date.localeCompare(b.date));
  el.txTbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${r.desc || '-'}</td>
      <td><span class="tag">${r.category}</span></td>
      <td class="${r.type==='income'?'income':'expense'}">${r.type==='income'?'수입':'지출'}</td>
      <td class="right">${_fmt.format(r.amount)}</td>
      <td><button class="btn" data-del="${r.id}">삭제</button></td>
    `;
    el.txTbody.appendChild(tr);
  });
  $$('button[data-del]').forEach(b => b.onclick = e => removeTx(b.dataset.del));

  el.txCount.textContent = `${rows.length}건`;

  const income = rows.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
  const expense = rows.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
  const net = income - expense;
  el.sumIncome.textContent = _fmt.format(income);
  el.sumExpense.textContent = _fmt.format(expense);
  el.netCash.textContent = _fmt.format(net);
  el.countIncome.textContent = `${rows.filter(r=>r.type==='income').length}건`;
  el.countExpense.textContent = `${rows.filter(r=>r.type==='expense').length}건`;
  el.savingRate.textContent = income>0 ? `저축률 ${( (net/income)*100 ).toFixed(1)}%` : '저축률 —';

  const byCat = {};
  rows.filter(r=>r.type==='expense').forEach(r=>{ byCat[r.category]=(byCat[r.category]||0)+r.amount; });
  const pieData = { labels:Object.keys(byCat), datasets:[{ data:Object.values(byCat) }] };

  const days = Array.from(new Set(rows.map(r=>r.date))).sort();
  const netByDay = days.map(d=>{
    const ins = rows.filter(r=>r.date===d && r.type==='income').reduce((s,r)=>s+r.amount,0);
    const outs = rows.filter(r=>r.date===d && r.type==='expense').reduce((s,r)=>s+r.amount,0);
    return { d, v: ins - outs };
  });
  const lineData = { labels: netByDay.map(x=>x.d.slice(5)), datasets:[{ label:'순현금흐름', data: netByDay.map(x=>x.v), tension:.3 }] };

  if(pieChart) pieChart.destroy();
  if(lineChart) lineChart.destroy();
  const pieCtx = document.getElementById('pieCategory');
  const lineCtx = document.getElementById('lineNet');
  pieChart = new Chart(pieCtx, { type:'pie', data: pieData, options:{ plugins:{ legend:{ position:'bottom' }}}});
  lineChart = new Chart(lineCtx, { type:'line', data: lineData, options:{ plugins:{ legend:{ display:false }}, scales:{ y:{ beginAtZero:true }}}});
}

// ====== Settings ======
function applySettings(){
  const code = (el.currencyCode.value || 'KRW').toUpperCase().slice(0,3);
  const cats = (el.categorySeed.value||'').split(',').map(s=>s.trim()).filter(Boolean);
  cfg.currency = code;
  if(cats.length) cfg.categories = cats;
  saveCfg(); refreshCategoryOptions(); render();
}

// ====== CSV ======
function toCSV(){
  const header = ['id','date','desc','category','type','amount'];
  const lines = [header.join(',')];
  tx.forEach(r => {
    const row = header.map(k => {
      const val = (r[k] ?? '').toString();
      return /[",\n]/.test(val) ? '"'+val.replace(/"/g,'""')+'"' : val;
    });
    lines.push(row.join(','));
  });
  return lines.join('\n');
}

function downloadFile(name, text){
  const blob = new Blob([text], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split(',').map(s=>s.trim());
  const idx = (k)=> header.indexOf(k);
  const out = [];
  for(const line of lines){
    let cur = ''; const row=[]; let inQ=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch==='"'){ if(inQ && line[i+1]==='"'){ row.push(cur+'"'); cur=''; i++; } else { inQ=!inQ; }
      } else if(ch===',' && !inQ){ row.push(cur); cur=''; } else { cur+=ch; }
    }
    row.push(cur);
    const rec = {
      id: row[idx('id')] || uid(),
      date: row[idx('date')] || ymd(new Date()),
      desc: row[idx('desc')] || '',
      category: row[idx('category')] || cfg.categories[0] || '기타',
      type: (row[idx('type')]||'expense').trim()==='income'?'income':'expense',
      amount: parseAmount(row[idx('amount')])
    };
    out.push(rec);
  }
  return out;
}

// ====== Bindings ======
el.btnAdd.onclick = addTx;
el.btnApplySettings.onclick = applySettings;
el.btnExport.onclick = ()=> downloadFile('budget-export.csv', toCSV());
el.importFile.onchange = async (e)=>{
  const file = e.target.files?.[0]; if(!file) return;
  const text = await file.text();
  const data = parseCSV(text);
  tx = tx.concat(data); save(); render(); e.target.value='';
};
el.btnReset.onclick = ()=>{ if(confirm('정말 초기화할까요? 저장된 데이터가 모두 삭제됩니다.')){ tx=[]; save(); render(); } };
el.monthPicker.onchange = e => setMonth(e.target.value);
el.btnThisMonth.onclick = ()=> setMonth(monthKey(new Date()));
el.btnPrevMonth.onclick = ()=> shiftMonth(-1);
el.btnNextMonth.onclick = ()=> shiftMonth(+1);

// ====== Boot ======
setDefaults();
setMonth(currentMonth);
render();
