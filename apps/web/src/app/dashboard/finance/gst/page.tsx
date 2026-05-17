'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';

import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

export default function GstDashboardPage() {
  const [period, setPeriod] = useState('2026-05');
  const [loading, setLoading] = useState(false);
  const [gstr1Data, setGstr1Data] = useState<any>(null);
  const [gstr3bData, setGstr3bData] = useState<any>(null);

  useEffect(() => {
    const fetchGst = async () => {
      try {
        const token = getAuthToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [r1, r3b] = await Promise.all([
          fetch(`${API_BASE}/gst/gstr1?period=${period}`, { headers }),
          fetch(`${API_BASE}/gst/gstr3b?period=${period}`, { headers }),
        ]);

        if (r1.ok) setGstr1Data(await r1.json());
        if (r3b.ok) setGstr3bData(await r3b.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchGst();
  }, [period]);

  const gstr1Summary = {
    b2b: 0,
    b2c: gstr1Data?.b2c?.[0]?.txval || 0,
    cdnr: 0,
    totalTax:
      (gstr1Data?.b2c?.[0]?.camt || 0) + (gstr1Data?.b2c?.[0]?.samt || 0),
  };

  const gstr3bSummary = {
    taxable: gstr3bData?.outward_supplies?.taxable_value || 0,
    totalTax:
      (gstr3bData?.outward_supplies?.central_tax || 0) +
      (gstr3bData?.outward_supplies?.state_tax || 0),
  };

  const handleDownload = (
    type: 'json' | 'excel',
    returnType: 'GSTR-1' | 'GSTR-3B',
  ) => {
    if (type !== 'json') {
      alert('Excel export coming soon!');
      return;
    }

    const dataStr = JSON.stringify(
      returnType === 'GSTR-1' ? gstr1Data : gstr3bData,
      null,
      2,
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${returnType}_${period}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            GST Compliance Suite
          </h1>
          <p className="text-muted-foreground">
            Manage and export your monthly GSTR returns.
          </p>
        </div>
        <div className="w-48">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-05">May 2026</SelectItem>
              <SelectItem value="2026-04">April 2026</SelectItem>
              <SelectItem value="2026-03">March 2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* GSTR-1 Card */}
        <Card>
          <CardHeader>
            <CardTitle>GSTR-1 (Outward Supplies)</CardTitle>
            <CardDescription>B2B, B2C, and Credit/Debit Notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">
                    Taxable Value (₹)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>B2C (Small)</TableCell>
                  <TableCell className="text-right">
                    {gstr1Summary.b2c.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>B2B (Registered)</TableCell>
                  <TableCell className="text-right">
                    {gstr1Summary.b2b.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>CDNR</TableCell>
                  <TableCell className="text-right">
                    {gstr1Summary.cdnr.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow className="font-bold">
                  <TableCell>Total Tax</TableCell>
                  <TableCell className="text-right text-primary">
                    {gstr1Summary.totalTax.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload('json', 'GSTR-1')}
                disabled={loading}
              >
                <FileJson className="mr-2 h-4 w-4" /> NIC JSON
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload('excel', 'GSTR-1')}
                disabled={loading}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GSTR-3B Card */}
        <Card>
          <CardHeader>
            <CardTitle>GSTR-3B (Summary)</CardTitle>
            <CardDescription>ITC and Tax Liability summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>3.1 Outward Taxable</TableCell>
                  <TableCell className="text-right">
                    {gstr3bSummary.taxable.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>4. Eligible ITC</TableCell>
                  <TableCell className="text-right">0.00</TableCell>
                </TableRow>
                <TableRow className="font-bold">
                  <TableCell>6.1 Net Tax Payable</TableCell>
                  <TableCell className="text-right text-primary">
                    {gstr3bSummary.totalTax.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload('json', 'GSTR-3B')}
                disabled={loading}
              >
                <FileJson className="mr-2 h-4 w-4" /> NIC JSON
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload('excel', 'GSTR-3B')}
                disabled={loading}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TCS Reconciliation */}
      <Card>
        <CardHeader>
          <CardTitle>TCS Reconciliation</CardTitle>
          <CardDescription>
            Compare Aggregator payouts against System Orders for Section 52
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aggregator</TableHead>
                <TableHead className="text-right">System Sales (₹)</TableHead>
                <TableHead className="text-right">Reported Sales (₹)</TableHead>
                <TableHead className="text-right">
                  1% TCS Deducted (₹)
                </TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Zomato</TableCell>
                <TableCell className="text-right">5,200.00</TableCell>
                <TableCell className="text-right">5,200.00</TableCell>
                <TableCell className="text-right">52.00</TableCell>
                <TableCell className="text-right text-green-500 font-medium">
                  Reconciled
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Swiggy</TableCell>
                <TableCell className="text-right">3,100.00</TableCell>
                <TableCell className="text-right">2,950.00</TableCell>
                <TableCell className="text-right">29.50</TableCell>
                <TableCell className="text-right text-amber-500 font-medium">
                  Mismatch (₹150)
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
