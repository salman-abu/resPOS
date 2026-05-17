'use client';

import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';

export default function VendorAgingPage() {
  const [aging, setAging] = useState<any>(null);

  useEffect(() => {
    const fetchAging = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/finance/vendor-aging`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAging(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAging();
  }, []);

  const handleMarkPaid = (poId: string) => {
    console.log('Marking PO as paid', poId);
    setAging((prev: any) => ({
      ...prev,
      vendors: prev.vendors.filter((v: any) => v.poId !== poId),
    }));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Vendor Aging Report
        </h1>
        <p className="text-muted-foreground">
          Track unpaid purchase orders and cash outflows.
        </p>
      </div>

      {aging && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-green-500/20">
            <CardHeader className="pb-2">
              <CardDescription>0 - 30 Days (Current)</CardDescription>
              <CardTitle className="text-2xl text-green-400">
                ₹{aging['0-30'].toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-amber-500/20">
            <CardHeader className="pb-2">
              <CardDescription>30 - 60 Days (Due)</CardDescription>
              <CardTitle className="text-2xl text-amber-400">
                ₹{aging['30-60'].toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-red-500/20">
            <CardHeader className="pb-2">
              <CardDescription>60+ Days (Overdue)</CardDescription>
              <CardTitle className="text-2xl text-red-400">
                ₹{aging['60+'].toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Outstanding Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>PO Ref</TableHead>
                <TableHead>Days Old</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aging?.vendors.map((vendor: any) => (
                <TableRow key={vendor.poId}>
                  <TableCell className="font-medium">
                    {vendor.vendorName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {vendor.poId}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        vendor.daysOld > 60
                          ? 'bg-red-500/10 text-red-400'
                          : vendor.daysOld > 30
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-green-500/10 text-green-400'
                      }`}
                    >
                      {vendor.daysOld} Days
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ₹{vendor.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkPaid(vendor.poId)}
                    >
                      <Check className="h-4 w-4 mr-1" /> Mark Paid
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
