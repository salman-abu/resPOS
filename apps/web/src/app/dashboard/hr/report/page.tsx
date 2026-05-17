'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { getAuthToken } from '@respos/utils';
import { useEffect } from 'react';

export default function StaffReportPage() {
  const [period, setPeriod] = useState('2026-05');
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payrollConfigs, setPayrollConfigs] = useState<
    Record<
      string,
      { type: 'hourly' | 'monthly'; rate: number; prorate: boolean }
    >
  >({});

  // Load payroll configs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('respos_payroll_configs');
    if (saved) {
      try {
        setPayrollConfigs(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/staff/report?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.error('Failed to fetch report', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const updateConfig = (
    userId: string,
    key: 'type' | 'rate' | 'prorate',
    value: any,
  ) => {
    const current = payrollConfigs[userId] || {
      type: 'hourly',
      rate: 0,
      prorate: false,
    };
    const updated = {
      ...payrollConfigs,
      [userId]: {
        ...current,
        [key]: value,
      },
    };
    setPayrollConfigs(updated);
    localStorage.setItem('respos_payroll_configs', JSON.stringify(updated));
  };

  // Helper to determine total days in the selected month
  const getDaysInMonth = (periodStr: string) => {
    const [year, month] = periodStr.split('-');
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };

  const handleExport = () => {
    const daysInMonth = getDaysInMonth(period);
    const csvHeader =
      'Name,Role,Present Days,Total Hours,Pay Type,Pay Rate (INR),Prorated,Estimated Salary (INR)\n';
    const csvRows = report
      .map((row) => {
        const config = payrollConfigs[row.userId] || {
          type: 'hourly',
          rate: 0,
          prorate: false,
        };
        let estSalary = 0;
        if (config.type === 'hourly') {
          estSalary = row.totalHours * config.rate;
        } else {
          estSalary = config.prorate
            ? (row.presentDays / daysInMonth) * config.rate
            : config.rate;
        }
        return `"${row.name}","${row.role}",${row.presentDays},${row.totalHours},"${config.type.toUpperCase()}",${config.rate},${config.type === 'monthly' ? config.prorate : 'N/A'},${estSalary.toFixed(2)}`;
      })
      .join('\n');

    const blob = new Blob([csvHeader + csvRows], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `calculated_payroll_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Staff Attendance & Payroll Report
          </h1>
          <p className="text-muted-foreground">
            Review hours worked, manage salaries (hourly/monthly), and export
            payroll spreadsheets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-05">May 2026</SelectItem>
              <SelectItem value="2026-04">April 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-brand-default text-brand-default hover:bg-brand-light"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timesheet Summary</CardTitle>
          <CardDescription>
            Consolidated clock-in/out data with custom payroll configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Days Present</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
                <TableHead className="text-center w-36">Pay Type</TableHead>
                <TableHead className="text-right w-36">Rate (₹)</TableHead>
                <TableHead className="text-center w-28">Prorate</TableHead>
                <TableHead className="text-right">Est. Salary (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Loading report...
                  </TableCell>
                </TableRow>
              ) : report.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No attendance records found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                report.map((row) => {
                  const config = payrollConfigs[row.userId] || {
                    type: 'hourly',
                    rate: 0,
                    prorate: false,
                  };
                  const daysInMonth = getDaysInMonth(period);

                  let estSalary = 0;
                  if (config.type === 'hourly') {
                    estSalary = row.totalHours * config.rate;
                  } else {
                    estSalary = config.prorate
                      ? (row.presentDays / daysInMonth) * config.rate
                      : config.rate;
                  }

                  return (
                    <TableRow key={row.userId}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold">
                          {row.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.presentDays}{' '}
                        <span className="text-[10px] text-muted-foreground">
                          / {daysInMonth}d
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.totalHours} hrs
                      </TableCell>
                      <TableCell className="text-center">
                        <select
                          value={config.type}
                          onChange={(e) =>
                            updateConfig(
                              row.userId,
                              'type',
                              e.target.value as any,
                            )
                          }
                          className="bg-slate-50 dark:bg-zinc-800 border border-border rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-default"
                        >
                          <option value="hourly">Hourly wage</option>
                          <option value="monthly">Monthly fixed</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-muted-foreground text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={config.rate || ''}
                            onChange={(e) =>
                              updateConfig(
                                row.userId,
                                'rate',
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder={
                              config.type === 'hourly' ? 'Rate/hr' : 'Salary/mo'
                            }
                            className="w-24 text-right bg-slate-50 dark:bg-zinc-800 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-default"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {config.type === 'monthly' ? (
                          <input
                            type="checkbox"
                            checked={config.prorate}
                            onChange={(e) =>
                              updateConfig(
                                row.userId,
                                'prorate',
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-brand-default focus:ring-brand-default"
                            title="Pro-rate by days present"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-500">
                        ₹
                        {estSalary.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
