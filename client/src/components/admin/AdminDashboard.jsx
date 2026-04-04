import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboard } from '../../store/slices/reportsSlice';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  DollarSign, ShoppingBag, TrendingUp, Award, ArrowRight,
} from 'lucide-react';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dashboard, isLoading } = useSelector((state) => state.reports);

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  const stats = [
    { label: 'Total Sales', value: formatCurrency(dashboard?.totalSales), icon: DollarSign, color: 'text-green-600 bg-green-500/10' },
    { label: 'Total Orders', value: dashboard?.totalOrders || 0, icon: ShoppingBag, color: 'text-blue-600 bg-blue-500/10' },
    { label: "Today's Sales", value: formatCurrency(dashboard?.todaySales), icon: TrendingUp, color: 'text-purple-600 bg-purple-500/10' },
    { label: 'Avg Order Value', value: formatCurrency(dashboard?.averageOrderValue), icon: Award, color: 'text-orange-600 bg-orange-500/10' },
  ];

  if (isLoading && !dashboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={() => navigate('/pos/floor')} className="gap-2">
          Go to POS <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Orders</CardTitle>
          <CardDescription>{dashboard?.todayOrders || 0} orders placed today</CardDescription>
        </CardHeader>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboard?.topProducts?.map((p, idx) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6">{idx + 1}</span>
                  <span className="font-medium">{p.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{p.totalQty} sold</span>
                  <span className="font-medium">{formatCurrency(p.totalRevenue)}</span>
                </div>
              </div>
            ))}
            {!dashboard?.topProducts?.length && (
              <p className="text-center text-muted-foreground py-4">No data yet. Start taking orders!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
