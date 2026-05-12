'use client';
import { useRef } from 'react';
import { Printer } from 'lucide-react';

interface InvoiceItem {
  name: string;
  variant?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  tax_slab: string;
}
interface Payment {
  method: string;
  amount: number;
  upi_ref?: string;
}
interface Props {
  invoice: {
    invoice_number: string;
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    service_charge: number;
    discount: number;
    total: number;
    printed_at: string;
    payments: Payment[];
  };
  order: {
    order_type: string;
    pax_count?: number;
    table_number?: string;
    items: InvoiceItem[];
  };
  tenant: { name: string; address?: string; gstin?: string };
  onClose?: () => void;
}

const fmt = (p: number) => (p / 100).toFixed(2);
const METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  UPI: 'UPI',
  WALLET: 'Wallet',
  COMPLIMENTARY: 'Comp',
};

export default function ThermalBill({
  invoice,
  order,
  tenant,
  onClose,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank', 'width=380,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Courier Prime',Courier,monospace; font-size:12px; width:80mm; margin:0 auto; padding:8px 4px 24px; color:#111; background:#fff; }
        .center { text-align:center; }
        .bold { font-weight:700; }
        .divider { border:none; border-top:1px dashed #555; margin:6px 0; }
        .row { display:flex; justify-content:space-between; margin:2px 0; }
        .item-row { display:grid; grid-template-columns:1fr auto auto; gap:4px; margin:2px 0; }
        .right { text-align:right; }
        .total-row { font-size:14px; font-weight:700; }
        .payment-row { display:flex; justify-content:space-between; }
        @media print { body { width:80mm; } }
      </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  const date = new Date(invoice.printed_at).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative max-w-sm w-full rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}
        >
          <span
            className="font-bold text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            🧾 Bill Preview
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: '#6366f1', color: '#fff' }}
            >
              <Printer size={14} /> Print
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Thermal Preview */}
        <div className="p-4 max-h-[75vh] overflow-y-auto">
          <div
            ref={printRef}
            style={{
              fontFamily: "'Courier Prime', Courier, monospace",
              fontSize: 12,
              width: '100%',
              maxWidth: 300,
              margin: '0 auto',
              color: '#111',
              lineHeight: 1.5,
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{tenant.name}</div>
              {tenant.address && (
                <div style={{ fontSize: 10 }}>{tenant.address}</div>
              )}
              {tenant.gstin && (
                <div style={{ fontSize: 10 }}>GSTIN: {tenant.gstin}</div>
              )}
            </div>

            <hr
              style={{
                border: 'none',
                borderTop: '1px dashed #555',
                margin: '6px 0',
              }}
            />

            {/* Invoice Meta */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
              }}
            >
              <span>{invoice.invoice_number}</span>
              <span>{date}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                marginTop: 2,
              }}
            >
              <span>Type: {order.order_type.replace('_', ' ')}</span>
              {order.table_number && <span>Table: {order.table_number}</span>}
            </div>
            {order.pax_count && (
              <div style={{ fontSize: 11 }}>Covers: {order.pax_count}</div>
            )}

            <hr
              style={{
                border: 'none',
                borderTop: '1px dashed #555',
                margin: '6px 0',
              }}
            />

            {/* Items Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 4,
                fontWeight: 700,
                fontSize: 11,
              }}
            >
              <span>Item</span>
              <span>Qty</span>
              <span style={{ textAlign: 'right' }}>Amt</span>
            </div>
            <hr
              style={{
                border: 'none',
                borderTop: '1px dashed #555',
                margin: '4px 0',
              }}
            />

            {/* Items */}
            {order.items.map((item, i) => (
              <div key={i} style={{ marginBottom: 3 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: 4,
                    fontSize: 11,
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                    {item.variant ? ` (${item.variant})` : ''}
                  </span>
                  <span>{item.quantity}</span>
                  <span style={{ textAlign: 'right' }}>
                    {fmt(item.line_total)}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#555', paddingLeft: 2 }}>
                  @ ₹{fmt(item.unit_price)} | {item.tax_slab.replace('_', ' ')}
                </div>
              </div>
            ))}

            <hr
              style={{
                border: 'none',
                borderTop: '1px dashed #555',
                margin: '6px 0',
              }}
            />

            {/* Totals */}
            {[
              { label: 'Subtotal', val: fmt(invoice.subtotal) },
              ...(invoice.cgst
                ? [{ label: 'CGST', val: fmt(invoice.cgst) }]
                : []),
              ...(invoice.sgst
                ? [{ label: 'SGST', val: fmt(invoice.sgst) }]
                : []),
              ...(invoice.igst
                ? [{ label: 'IGST', val: fmt(invoice.igst) }]
                : []),
              ...(invoice.service_charge
                ? [
                    {
                      label: 'Service Charge',
                      val: fmt(invoice.service_charge),
                    },
                  ]
                : []),
              ...(invoice.discount
                ? [{ label: 'Discount', val: `- ${fmt(invoice.discount)}` }]
                : []),
            ].map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  marginBottom: 1,
                }}
              >
                <span>{r.label}</span>
                <span>₹{r.val}</span>
              </div>
            ))}

            <hr
              style={{
                border: 'none',
                borderTop: '1px dashed #555',
                margin: '4px 0',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              <span>TOTAL</span>
              <span>₹{fmt(invoice.total)}</span>
            </div>

            {/* Payments */}
            {invoice.payments.length > 0 && (
              <>
                <hr
                  style={{
                    border: 'none',
                    borderTop: '1px dashed #555',
                    margin: '6px 0',
                  }}
                />
                <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 3 }}>
                  PAYMENT
                </div>
                {invoice.payments.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                    }}
                  >
                    <span>
                      {METHOD_LABEL[p.method] ?? p.method}
                      {p.upi_ref ? ` (${p.upi_ref})` : ''}
                    </span>
                    <span>₹{fmt(p.amount)}</span>
                  </div>
                ))}
              </>
            )}

            <hr
              style={{
                border: 'none',
                borderTop: '1px dashed #555',
                margin: '8px 0',
              }}
            />
            <div style={{ textAlign: 'center', fontSize: 10, color: '#555' }}>
              Thank you! Visit Again ✨<br />
              Powered by NextGen RPOS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
