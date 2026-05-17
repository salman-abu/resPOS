/**
 * Unit tests for the pure GST calculation engine.
 * All monetary values are in integers (paise).
 */

import { getTaxRate, calculateGST, calculateCartGST } from './gst';

describe('GST Engine — getTaxRate', () => {
  it('should return correct rates for all standard slabs', () => {
    expect(getTaxRate('EXEMPT')).toBe(0);
    expect(getTaxRate('GST_5')).toBe(5);
    expect(getTaxRate('GST_12')).toBe(12);
    expect(getTaxRate('GST_18')).toBe(18);
    expect(getTaxRate('GST_28')).toBe(28);
  });

  it('should return 0 for unknown slabs', () => {
    expect(getTaxRate('UNKNOWN')).toBe(0);
    expect(getTaxRate('')).toBe(0);
  });
});

describe('GST Engine — calculateGST (Intra-state CGST+SGST)', () => {
  it('should split 5% GST into 2.5% CGST + 2.5% SGST for ₹100 (10000 paise)', () => {
    const result = calculateGST(10000, 'GST_5', { is_igst: false });
    expect(result.cgst).toBe(250); // 2.5% of 10000 = 250
    expect(result.sgst).toBe(250);
    expect(result.igst).toBe(0);
    expect(result.total_tax).toBe(500); // 5% of 10000 = 500
    expect(result.grand_total).toBe(10500);
  });

  it('should split 18% GST into 9% CGST + 9% SGST for ₹200 (20000 paise)', () => {
    const result = calculateGST(20000, 'GST_18', { is_igst: false });
    expect(result.cgst).toBe(1800); // 9% of 20000 = 1800
    expect(result.sgst).toBe(1800);
    expect(result.igst).toBe(0);
    expect(result.total_tax).toBe(3600); // 18% of 20000 = 3600
    expect(result.grand_total).toBe(23600);
  });

  it('should handle odd paise rounding for 5% of ₹101 (10100 paise)', () => {
    // 5% of 10100 = 505 → split as 252 + 253
    const result = calculateGST(10100, 'GST_5', { is_igst: false });
    expect(result.cgst + result.sgst).toBe(505);
    expect(Math.abs(result.cgst - result.sgst)).toBeLessThanOrEqual(1);
    expect(result.grand_total).toBe(10100 + 505);
  });

  it('should return zero tax for EXEMPT items', () => {
    const result = calculateGST(50000, 'EXEMPT', { is_igst: false });
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.igst).toBe(0);
    expect(result.total_tax).toBe(0);
    expect(result.grand_total).toBe(50000);
  });
});

describe('GST Engine — calculateGST (Inter-state IGST)', () => {
  it('should apply full IGST for inter-state 5% on ₹500 (50000 paise)', () => {
    const result = calculateGST(50000, 'GST_5', { is_igst: true });
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.igst).toBe(2500); // 5% of 50000 = 2500
    expect(result.total_tax).toBe(2500);
    expect(result.grand_total).toBe(52500);
  });

  it('should apply full IGST for inter-state 18% on ₹1000 (100000 paise)', () => {
    const result = calculateGST(100000, 'GST_18', { is_igst: true });
    expect(result.igst).toBe(18000); // 18% of 100000 = 18000
    expect(result.grand_total).toBe(118000);
  });

  it('should apply 0 IGST for EXEMPT inter-state items', () => {
    const result = calculateGST(30000, 'EXEMPT', { is_igst: true });
    expect(result.igst).toBe(0);
    expect(result.grand_total).toBe(30000);
  });
});

describe('GST Engine — calculateCartGST (Multi-slab cart)', () => {
  it('should correctly calculate mixed-tax-slab intra-state cart', () => {
    const items = [
      { unit_price: 10000, addons_total: 0, quantity: 2, tax_slab: 'GST_5' }, // ₹200 × 5% = ₹10
      {
        unit_price: 50000,
        addons_total: 5000,
        quantity: 1,
        tax_slab: 'GST_18',
      }, // ₹550 × 18% = ₹99
      { unit_price: 30000, addons_total: 0, quantity: 1, tax_slab: 'EXEMPT' }, // ₹300 × 0% = ₹0
    ];

    const result = calculateCartGST(items, { is_igst: false });

    // Line 1: base = 20000, tax = 1000 (5%), cgst=500, sgst=500
    // Line 2: base = 55000, tax = 9900 (18%), cgst=4950, sgst=4950
    // Line 3: base = 30000, tax = 0
    // Total cgst = 5450, sgst = 5450
    expect(result.cgst).toBe(5450);
    expect(result.sgst).toBe(5450);
    expect(result.igst).toBe(0);
    expect(result.total_tax).toBe(10900);
    expect(result.grand_total).toBe(105000 + 10900); // 105000 subtotal + 10900 tax = 115900
  });

  it('should correctly calculate mixed-tax-slab inter-state cart (IGST)', () => {
    const items = [
      { unit_price: 20000, addons_total: 0, quantity: 1, tax_slab: 'GST_12' },
      { unit_price: 40000, addons_total: 2000, quantity: 2, tax_slab: 'GST_5' },
    ];

    const result = calculateCartGST(items, { is_igst: true });

    // Line 1: base = 20000, tax = 2400 (12% IGST)
    // Line 2: base = 84000, tax = 4200 (5% IGST)
    // Total IGST = 6600
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.igst).toBe(6600);
    expect(result.total_tax).toBe(6600);
    expect(result.grand_total).toBe(104000 + 6600); // 104000 + 6600 = 110600
  });

  it('should handle empty cart gracefully', () => {
    const result = calculateCartGST([], { is_igst: false });
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.igst).toBe(0);
    expect(result.total_tax).toBe(0);
    expect(result.grand_total).toBe(0);
  });

  it('should handle 28% luxury tax slab correctly', () => {
    const items = [
      { unit_price: 100000, addons_total: 0, quantity: 1, tax_slab: 'GST_28' },
    ];

    const result = calculateCartGST(items, { is_igst: false });

    // 28% of 100000 = 28000 → split as 14000 + 14000
    expect(result.cgst).toBe(14000);
    expect(result.sgst).toBe(14000);
    expect(result.grand_total).toBe(128000);
  });

  it('should handle 12% tax slab correctly', () => {
    const items = [
      { unit_price: 25000, addons_total: 0, quantity: 1, tax_slab: 'GST_12' },
    ];

    const result = calculateCartGST(items, { is_igst: false });

    // 12% of 25000 = 3000 → split as 1500 + 1500
    expect(result.cgst).toBe(1500);
    expect(result.sgst).toBe(1500);
    expect(result.grand_total).toBe(28000);
  });
});

describe('GST Engine — edge cases', () => {
  it('should handle fractional paise correctly with rounding', () => {
    // ₹1.01 = 101 paise → 5% = 5.05 paise → round to 5
    const result = calculateGST(101, 'GST_5', { is_igst: false });
    expect(result.cgst + result.sgst).toBe(5);
    expect(result.grand_total).toBe(106);
  });

  it('should handle very large amounts without overflow', () => {
    const largeAmount = 100000000; // ₹1,00,00,000 in paise
    const result = calculateGST(largeAmount, 'GST_18', { is_igst: false });
    expect(result.cgst).toBe(9000000); // 9% of 1 crore
    expect(result.sgst).toBe(9000000);
    expect(result.grand_total).toBe(118000000);
  });
});
