'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/ui/StatCard';
import {
  IndianRupee, ShoppingBag, TrendingUp, Clock,
  Printer, CalendarDays, BarChart3, ArrowLeft,
  CreditCard, Banknote, Smartphone, FileText,
} from 'lucide-react';

// ─── Types & mock data ────────────────────────────────────────────────────────
type Range = 'today' | 'week' | 'month';

const RANGE_DATA: Record<Range, {
  revenue: number; orders: number; avg_check: number; table_turn: number;
  rev_trend: number; ord_trend: number;
  daily_rev: number[]; daily_ord: number[]; labels: string[];
  payment: { cash: number; upi: number; card: number };
  top: { name: string; qty: number; revenue: number; trend: number }[];
  gst: { taxable: number; cgst: number; sgst: number; total: number };
}> = {
  today: {
    revenue:124500, orders:87, avg_check:28000, table_turn:48,
    rev_trend:12, ord_trend:8,
    daily_rev:[8200,14500,22000,31000,24000,12000,13000],
    daily_ord:[4,8,13,18,14,7,8],
    labels:['9a','10a','11a','12p','1p','2p','3p'],
    payment:{ cash:62000, upi:42000, card:20500 },
    top:[
      {name:'Butter Chicken',  qty:34, revenue:129200, trend:18},
      {name:'Garlic Naan',     qty:28, revenue:14000,  trend:5},
      {name:'Paneer Biryani',  qty:22, revenue:79200,  trend:41},
      {name:'Masala Chai',     qty:19, revenue:7600,   trend:-3},
      {name:'Dal Makhani',     qty:14, revenue:33600,  trend:-8},
    ],
    gst:{ taxable:118571, cgst:2964, sgst:2964, total:124500 },
  },
  week: {
    revenue:748000, orders:521, avg_check:27200, table_turn:46,
    rev_trend:9, ord_trend:6,
    daily_rev:[98000,115000,124500,108000,132000,87000,83500],
    daily_ord:[68,79,87,74,92,61,60],
    labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    payment:{ cash:374000, upi:249000, card:125000 },
    top:[
      {name:'Butter Chicken',  qty:198, revenue:752400, trend:14},
      {name:'Chicken Biryani', qty:165, revenue:693000, trend:22},
      {name:'Paneer Biryani',  qty:143, revenue:514800, trend:31},
      {name:'Garlic Naan',     qty:301, revenue:150500, trend:3},
      {name:'Dal Makhani',     qty:98,  revenue:235200, trend:-5},
    ],
    gst:{ taxable:711430, cgst:17786, sgst:17786, total:748000 },
  },
  month: {
    revenue:3240000, orders:2210, avg_check:26500, table_turn:47,
    rev_trend:15, ord_trend:11,
    daily_rev:[95000,110000,118000,130000,142000,108000,95000,120000,135000,145000,112000,98000,85000,124500],
    daily_ord:[62,74,80,88,96,73,64,81,91,98,76,66,57,87],
    labels:['1','3','5','7','9','11','13','15','17','19','21','23','25','27'],
    payment:{ cash:1620000, upi:1080000, card:540000 },
    top:[
      {name:'Butter Chicken',  qty:842, revenue:3199600, trend:18},
      {name:'Chicken Biryani', qty:721, revenue:3028200, trend:25},
      {name:'Paneer Biryani',  qty:614, revenue:2210400, trend:33},
      {name:'Garlic Naan',     qty:1284,revenue:642000,  trend:4},
      {name:'Dal Makhani',     qty:412, revenue:988800,  trend:-2},
    ],
    gst:{ taxable:3085714, cgst:77143, sgst:77143, total:3240000 },
  },
};

function fmt(p: number) {
  const r = p/100;
  return r>=100000 ? `₹${(r/100000).toFixed(1)}L` : r>=1000 ? `₹${(r/1000).toFixed(1)}K` : `₹${r.toFixed(0)}`;
}

// ─── SVG Line Chart ──────────────────────────────────────────────────────────
function LineChart({ data, labels, color='#3B82F6' }: { data:number[]; labels:string[]; color?:string }) {
  const W=560, H=120, PAD=20;
  const max=Math.max(...data,1), min=0;
  const pts = data.map((v,i)=>`${PAD+(i/(data.length-1))*(W-2*PAD)},${H-PAD-((v-min)/(max-min))*(H-2*PAD)}`).join(' ');
  const area = `${PAD},${H-PAD} ${pts} ${PAD+(data.length-1)/(data.length-1)*(W-2*PAD)},${H-PAD}`;
  return (
    <svg viewBox={`0 0 ${W} ${H+20}`} className="w-full h-auto">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#lg)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((v,i)=>{
        const x=PAD+(i/(data.length-1))*(W-2*PAD), y=H-PAD-((v-min)/(max-min))*(H-2*PAD);
        return (<g key={i}><circle cx={x} cy={y} r="3.5" fill={color}/><text x={x} y={H+14} textAnchor="middle" fontSize="9" fill="#94A3B8">{labels[i]}</text></g>);
      })}
    </svg>
  );
}

// ─── SVG Bar Chart ───────────────────────────────────────────────────────────
function BarChart({ data, labels, color='#8B5CF6' }: { data:number[]; labels:string[]; color?:string }) {
  const W=560, H=100, PAD=12;
  const max=Math.max(...data,1);
  const bw=(W-2*PAD)/(data.length*1.5)-2;
  return (
    <svg viewBox={`0 0 ${W} ${H+20}`} className="w-full h-auto">
      {data.map((v,i)=>{
        const bh=((v/max)*(H-PAD));
        const x=PAD+i*((W-2*PAD)/data.length)+(((W-2*PAD)/data.length)-bw)/2;
        return (
          <g key={i}>
            <rect x={x} y={H-PAD-bh} width={bw} height={bh} rx="3" fill={color} fillOpacity="0.85"/>
            <text x={x+bw/2} y={H+14} textAnchor="middle" fontSize="9" fill="#94A3B8">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function Donut({ cash, upi, card }: { cash:number; upi:number; card:number }) {
  const total=cash+upi+card;
  const r=42, cx=60, cy=60, stroke=14;
  const c=2*Math.PI*r;
  const segs=[
    {val:cash,  color:'#10B981', label:'Cash'},
    {val:upi,   color:'#8B5CF6', label:'UPI'},
    {val:card,  color:'#3B82F6', label:'Card'},
  ];
  let offset=0;
  const arcs=segs.map(s=>{
    const dash=(s.val/total)*c;
    const el=<circle key={s.label} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
      strokeDasharray={`${dash} ${c-dash}`} strokeDashoffset={-offset} transform={`rotate(-90 ${cx} ${cy})`}/>;
    offset+=dash; return el;
  });
  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke}/>
        {arcs}
      </svg>
      <div className="space-y-2">
        {segs.map(s=>(
          <div key={s.label} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full flex-shrink-0" style={{background:s.color}}/>
            <span className="text-content-secondary text-xs">{s.label}</span>
            <span className="text-content-primary text-xs font-bold ml-auto">{Math.round((s.val/total)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Z-Report ────────────────────────────────────────────────────────────────
function ZReport({ d }: { d: typeof RANGE_DATA.today }) {
  const now = new Date();
  const ref = `ZREP-${now.toISOString().slice(0,10).replace(/-/g,'')}-001`;

  const print = () => {
    const w = window.open('', '_blank', 'width=400,height=700');
    if (!w) return;
    w.document.write(`<html><head><title>${ref}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:8px}.c{text-align:center}.b{font-weight:bold}.ln{border-top:1px dashed #000;margin:6px 0}.row{display:flex;justify-content:space-between;padding:2px 0}.big{font-size:16px;font-weight:bold}</style>
    </head><body>
    <div class="c b" style="font-size:16px">Z-REPORT</div>
    <div class="c">Spice Garden · GST:29ABCDE1234F1Z5</div>
    <div class="c">${now.toLocaleString('en-IN')}</div>
    <div class="ln"></div>
    <div class="row"><span>Ref</span><span class="b">${ref}</span></div>
    <div class="row"><span>Orders</span><span>${d.orders}</span></div>
    <div class="ln"></div>
    <div class="row"><span>Taxable</span><span>${fmt(d.gst.taxable)}</span></div>
    <div class="row"><span>CGST (2.5%)</span><span>${fmt(d.gst.cgst)}</span></div>
    <div class="row"><span>SGST (2.5%)</span><span>${fmt(d.gst.sgst)}</span></div>
    <div class="ln"></div>
    <div class="row big"><span>TOTAL</span><span>${fmt(d.gst.total)}</span></div>
    <div class="ln"></div>
    <div class="row"><span>Cash</span><span>${fmt(d.payment.cash)}</span></div>
    <div class="row"><span>UPI</span><span>${fmt(d.payment.upi)}</span></div>
    <div class="row"><span>Card</span><span>${fmt(d.payment.card)}</span></div>
    <div class="ln"></div>
    <div class="c">*** END OF Z-REPORT ***</div>
    </body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="card p-6 max-w-lg mx-auto font-mono text-sm">
      <div className="text-center mb-4">
        <p className="text-content-primary font-black text-lg">Z-REPORT</p>
        <p className="text-content-muted text-xs">Spice Garden · GST: 29ABCDE1234F1Z5</p>
        <p className="text-content-muted text-xs">{now.toLocaleString('en-IN')}</p>
      </div>
      <div className="border-t border-dashed border-border-strong my-3"/>
      <div className="flex justify-between"><span className="text-content-muted">Report Ref</span><span className="font-bold text-content-primary">{ref}</span></div>
      <div className="flex justify-between"><span className="text-content-muted">Total Orders</span><span className="font-bold text-content-primary">{d.orders}</span></div>
      <div className="border-t border-dashed border-border-strong my-3"/>
      <p className="text-content-secondary font-bold text-xs uppercase tracking-wider mb-2">GST Breakdown</p>
      <div className="flex justify-between text-content-secondary"><span>Taxable Sales</span><span>{fmt(d.gst.taxable)}</span></div>
      <div className="flex justify-between text-content-muted text-xs"><span>CGST @ 2.5%</span><span>{fmt(d.gst.cgst)}</span></div>
      <div className="flex justify-between text-content-muted text-xs"><span>SGST @ 2.5%</span><span>{fmt(d.gst.sgst)}</span></div>
      <div className="border-t border-dashed border-border-strong my-3"/>
      <div className="flex justify-between text-xl font-black text-content-primary"><span>TOTAL</span><span className="text-brand-700">{fmt(d.gst.total)}</span></div>
      <div className="border-t border-dashed border-border-strong my-3"/>
      <p className="text-content-secondary font-bold text-xs uppercase tracking-wider mb-2">Payment Breakdown</p>
      <div className="flex justify-between text-content-secondary items-center"><span className="flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5"/>Cash</span><span className="font-bold">{fmt(d.payment.cash)}</span></div>
      <div className="flex justify-between text-content-secondary items-center"><span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5"/>UPI</span><span className="font-bold">{fmt(d.payment.upi)}</span></div>
      <div className="flex justify-between text-content-secondary items-center"><span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5"/>Card</span><span className="font-bold">{fmt(d.payment.card)}</span></div>
      <div className="border-t border-dashed border-border-strong my-3"/>
      <div className="text-center text-content-muted text-xs">*** END OF Z-REPORT ***</div>
      <button onClick={print} className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-3 border border-border hover:bg-surface-4 text-content-secondary text-sm font-semibold transition-colors">
        <Printer className="h-4 w-4"/> Print Z-Report
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'zreport' | 'items';

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('today');
  const [tab, setTab]     = useState<Tab>('overview');
  const d = RANGE_DATA[range];

  const RANGES: { key:Range; label:string }[] = [
    {key:'today',label:'Today'},{key:'week',label:'This Week'},{key:'month',label:'This Month'},
  ];
  const TABS: { key:Tab; label:string; icon:React.ReactNode }[] = [
    {key:'overview', label:'Overview',  icon:<BarChart3 className="h-3.5 w-3.5"/>},
    {key:'zreport',  label:'Z-Report',  icon:<FileText className="h-3.5 w-3.5"/>},
    {key:'items',    label:'Top Items', icon:<TrendingUp className="h-3.5 w-3.5"/>},
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-border px-6 py-3.5 flex items-center gap-4 shadow-sm">
        <a href="/dashboard" className="flex items-center gap-2 text-content-secondary hover:text-content-primary transition-colors">
          <ArrowLeft className="h-4 w-4"/><span className="text-sm font-medium hidden sm:block">Dashboard</span>
        </a>
        <div className="h-4 w-px bg-border"/>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-violet-600 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-white"/>
          </div>
          <div>
            <h1 className="text-content-primary font-black text-sm">Analytics & Reports</h1>
            <p className="text-content-muted text-xs flex items-center gap-1"><CalendarDays className="h-3 w-3"/> {new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>
          </div>
        </div>
        {/* Range selector */}
        <div className="ml-auto flex items-center gap-1.5 bg-surface-3 p-1 rounded-xl border border-border">
          {RANGES.map(r=>(
            <button key={r.key} onClick={()=>setRange(r.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', range===r.key ? 'bg-white text-content-primary shadow-sm border border-border' : 'text-content-muted hover:text-content-secondary')}>
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Tab nav */}
        <div className="flex items-center gap-1">
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border',
                tab===t.key ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-white text-content-secondary border-border hover:bg-surface-3')}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ───────────────────────────────────────────────────── */}
        {tab==='overview' && (
          <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Revenue" value={fmt(d.revenue)} trend={d.rev_trend} trendLabel="vs prev" icon={<IndianRupee className="h-4 w-4"/>} accentColor="blue"/>
              <StatCard label="Orders"  value={d.orders}       trend={d.ord_trend} trendLabel="vs prev" icon={<ShoppingBag className="h-4 w-4"/>} accentColor="green"/>
              <StatCard label="Avg Check" value={fmt(d.avg_check)} icon={<TrendingUp className="h-4 w-4"/>} accentColor="violet"/>
              <StatCard label="Table Turn" value={String(d.table_turn)} suffix=" min" icon={<Clock className="h-4 w-4"/>} accentColor={d.table_turn>45?'amber':'green'}/>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card p-5">
                <p className="text-content-primary font-bold text-sm mb-4 flex items-center gap-2"><IndianRupee className="h-4 w-4 text-blue-500"/>Revenue Trend</p>
                <LineChart data={d.daily_rev} labels={d.labels} color="#3B82F6"/>
              </div>
              <div className="card p-5">
                <p className="text-content-primary font-bold text-sm mb-4 flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-violet-500"/>Orders</p>
                <BarChart data={d.daily_ord} labels={d.labels} color="#8B5CF6"/>
              </div>
            </div>

            {/* Payment mix */}
            <div className="card p-5">
              <p className="text-content-primary font-bold text-sm mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-emerald-500"/>Payment Mix</p>
              <div className="flex flex-wrap gap-8 items-center">
                <Donut cash={d.payment.cash} upi={d.payment.upi} card={d.payment.card}/>
                <div className="flex gap-4 flex-wrap">
                  {[{l:'Cash',v:d.payment.cash,c:'bg-emerald-100 text-emerald-700'},{l:'UPI',v:d.payment.upi,c:'bg-violet-100 text-violet-700'},{l:'Card',v:d.payment.card,c:'bg-blue-100 text-blue-700'}].map(p=>(
                    <div key={p.l} className={cn('px-4 py-3 rounded-xl border text-center min-w-[100px]', p.c)}>
                      <p className="text-xs font-semibold opacity-70">{p.l}</p>
                      <p className="text-lg font-black">{fmt(p.v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Z-Report ───────────────────────────────────────────────────── */}
        {tab==='zreport' && <ZReport d={d}/>}

        {/* ── Top Items ──────────────────────────────────────────────────── */}
        {tab==='items' && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <p className="text-content-primary font-bold">Top Performing Items</p>
              <span className="text-content-muted text-xs">{range==='today'?'Today':range==='week'?'This Week':'This Month'}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-border">
                <tr>{['#','Item','Qty','Revenue','Trend'].map(h=>(
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-content-muted uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.top.map((item,i)=>(
                  <tr key={item.name} className="hover:bg-surface-2 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={cn('h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold',
                        i===0?'bg-amber-100 text-amber-700':i===1?'bg-slate-100 text-slate-600':i===2?'bg-orange-100 text-orange-600':'bg-surface-3 text-content-muted'
                      )}>{i+1}</span>
                    </td>
                    <td className="px-5 py-3.5 text-content-primary font-semibold">{item.name}</td>
                    <td className="px-5 py-3.5 text-content-secondary">{item.qty}</td>
                    <td className="px-5 py-3.5 text-content-primary font-bold">{fmt(item.revenue)}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn('flex items-center gap-1 text-xs font-bold', item.trend>0?'text-emerald-600':'text-red-500')}>
                        {item.trend>0?<TrendingUp className="h-3.5 w-3.5"/>:<TrendingUp className="h-3.5 w-3.5 rotate-180"/>}
                        {Math.abs(item.trend)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
