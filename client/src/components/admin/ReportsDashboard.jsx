import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSalesReport, setFilters } from '../../store/slices/reportsSlice';
import reportsApi from '../../api/reportsApi';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '../ui/Select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../ui/Table';
import { formatCurrency } from '../../utils/formatCurrency';
import { getStatusLabel, getStatusVariant } from '../../utils/orderHelpers';
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ReportsDashboard = () => {
  const dispatch = useDispatch();
  const { salesData, filters } = useSelector((state) => state.reports);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    dispatch(fetchSalesReport(filters));
  }, [dispatch, filters]);

  const handlePeriodChange = (period) => {
    dispatch(setFilters({ period }));
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const fetcher = type === 'pdf' ? reportsApi.exportPDF : reportsApi.exportXLS;
      const response = await fetcher(filters);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} exported!`);
    } catch {
      toast.error(`Failed to export ${type.toUpperCase()}`);
    }
    setExporting(null);
  };

  const summary = salesData?.summary;
  const orders = salesData?.orders || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('pdf')} disabled={!!exporting} className="gap-2">
            {exporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('xls')} disabled={!!exporting} className="gap-2">
            {exporting === 'xls' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filters.period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(summary.totalSales)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{summary.totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.averageOrderValue)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader><CardTitle>Orders ({orders.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell className="font-medium">{o.orderNumber}</TableCell>
                  <TableCell>{o.table?.tableNumber || '-'}</TableCell>
                  <TableCell>{o.items?.length || 0}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(o.total)}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(o.status)}>{getStatusLabel(o.status)}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{o.source}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!orders.length && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders found for this period</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsDashboard;
