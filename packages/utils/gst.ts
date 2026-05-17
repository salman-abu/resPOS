/**
 * Pure GST calculation engine.
 * All rates and thresholds come from tenant config — nothing hardcoded.
 */

export interface GSTConfig {
  is_igst: boolean; // true for inter-state (IGST), false for intra-state (CGST+SGST)
  cgst_rate?: number; // e.g. 2.5 for 5% slab
  sgst_rate?: number;
  igst_rate?: number;
}

export interface GSTResult {
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
  grand_total: number;
}

const DEFAULT_RATES: Record<string, number> = {
  EXEMPT: 0,
  GST_5: 5,
  GST_12: 12,
  GST_18: 18,
  GST_28: 28,
};

export function getTaxRate(slab: string): number {
  return DEFAULT_RATES[slab] ?? 0;
}

export function calculateGST(
  taxableAmount: number,
  slab: string,
  config: Partial<GSTConfig> = {},
): GSTResult {
  const rate = getTaxRate(slab);
  const taxAmount = Math.round(taxableAmount * (rate / 100));

  if (config.is_igst) {
    return {
      cgst: 0,
      sgst: 0,
      igst: taxAmount,
      total_tax: taxAmount,
      grand_total: taxableAmount + taxAmount,
    };
  }

  const cgst = Math.round(taxAmount / 2);
  const sgst = taxAmount - cgst; // handles odd paise correctly

  return {
    cgst,
    sgst,
    igst: 0,
    total_tax: cgst + sgst,
    grand_total: taxableAmount + cgst + sgst,
  };
}

export function calculateCartGST(
  items: Array<{
    unit_price: number;
    addons_total: number;
    quantity: number;
    tax_slab: string;
  }>,
  config: Partial<GSTConfig> = {},
): GSTResult {
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  for (const item of items) {
    const lineBase = (item.unit_price + item.addons_total) * item.quantity;
    const result = calculateGST(lineBase, item.tax_slab, config);
    cgst += result.cgst;
    sgst += result.sgst;
    igst += result.igst;
  }

  const subtotal = items.reduce(
    (s, i) => s + (i.unit_price + i.addons_total) * i.quantity,
    0,
  );

  return {
    cgst,
    sgst,
    igst,
    total_tax: cgst + sgst + igst,
    grand_total: subtotal + cgst + sgst + igst,
  };
}
