import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchFloors, selectFloor } from '../../store/slices/floorsSlice';
import { setActiveTable, setActiveCustomer, clearLineItems } from '../../store/slices/cartSlice';
import { fetchCurrentSession, openSession } from '../../store/slices/sessionSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import PosStopSessionButton from './PosStopSessionButton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { getTableStatusColor } from '../../utils/orderHelpers';
import { Clock, Download, ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';
import GenerateQRButton from '../selforder/GenerateQRButton';

function formatSessionSince(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

const FloorPlan = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: floors, selectedFloor, isLoading } = useSelector((state) => state.floors);
  const { current: session } = useSelector((state) => state.session);
  const [sessionDetailsExpanded, setSessionDetailsExpanded] = useState(true);

  useEffect(() => {
    dispatch(fetchFloors());
    dispatch(fetchCurrentSession());
  }, [dispatch]);

  const sinceLabel = useMemo(() => formatSessionSince(session?.openedAt), [session?.openedAt]);

  const handleTableClick = (table) => {
    if (!session) {
      toast.error('Please open a session first');
      return;
    }
    dispatch(setActiveTable(table));
    if (table.status === 'occupied' && table.currentOrder) {
      dispatch(setActiveCustomer(null));
      dispatch(clearLineItems());
      navigate(`/pos/order/${table._id}`, { state: { fromOccupiedTable: true } });
      return;
    }
    dispatch(setActiveCustomer(null));
    dispatch(clearLineItems());
    navigate(`/pos/order/${table._id}`);
  };

  const handleOpenSession = async () => {
    try {
      await dispatch(openSession({ openingBalance: 0 })).unwrap();
      toast.success('Session opened!');
    } catch (err) {
      toast.error(err || 'Failed to open session');
    }
  };

  const tableCardClass = (status) => {
    if (status === 'occupied') {
      return cn(
        'border-2 border-orange-400 bg-gradient-to-b from-orange-50/95 to-amber-50/40 text-orange-950',
        'shadow-md hover:shadow-lg hover:scale-[1.02]'
      );
    }
    if (status === 'available') {
      return cn(
        'border-2 border-emerald-400/95 bg-gradient-to-b from-emerald-50/90 to-white text-emerald-950',
        'shadow-md hover:shadow-lg hover:scale-[1.02]'
      );
    }
    return cn('border-2 shadow-md', getTableStatusColor(status));
  };

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 max-w-7xl mx-auto">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 pb-6">
      {!session && (
        <div className="mx-4 mt-5 max-w-7xl xl:mx-auto rounded-2xl border border-amber-200/80 bg-amber-50/50 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="h-4 w-4 text-amber-700 shrink-0" />
            <span className="text-sm font-medium text-amber-950">
              No active session. Open one to start taking orders.
            </span>
          </div>
          <Button size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleOpenSession}>
            Open Session
          </Button>
        </div>
      )}

      {session && (
        <div className="mx-4 mt-5 max-w-7xl xl:mx-auto rounded-2xl border border-emerald-200/70 bg-white px-4 py-3.5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200/80">
                <Download className="h-3.5 w-3.5" aria-hidden />
                Till open
              </span>
              {sessionDetailsExpanded && sinceLabel && (
                <span>
                  Since <span className="text-slate-800 font-medium">{sinceLabel}</span>
                </span>
              )}
              {sessionDetailsExpanded && (
                <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white border-0 text-[10px] uppercase tracking-wide">
                  Active
                </Badge>
              )}
              <span>
                Session sales{' '}
                <strong className="text-slate-900 tabular-nums">
                  {formatCurrency(session.totalSales ?? 0)}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                onClick={() => setSessionDetailsExpanded((v) => !v)}
              >
                <ArrowLeftRight className="h-4 w-4" />
                Toggle
              </Button>
              <PosStopSessionButton variant="outline" size="sm" label="Stop session" className="bg-white border-slate-200" />
            </div>
          </div>
        </div>
      )}

      <Tabs
        value={selectedFloor || floors[0]?._id}
        onValueChange={(val) => dispatch(selectFloor(val))}
        className="flex-1 flex flex-col min-h-0 mt-5"
      >
        <div className="px-4 max-w-7xl w-full xl:mx-auto">
          <TabsList className="h-auto w-full justify-start gap-2 bg-transparent p-0 flex-wrap">
            {floors.map((floor) => (
              <TabsTrigger
                key={floor._id}
                value={floor._id}
                className={cn(
                  'group rounded-xl border-2 border-transparent px-5 py-2.5 text-sm font-semibold transition-all',
                  'data-[state=inactive]:bg-slate-100/80 data-[state=inactive]:text-slate-500',
                  'data-[state=active]:border-emerald-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md'
                )}
              >
                {floor.name}
                <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-200/80 px-1.5 text-[11px] font-bold text-slate-600 group-data-[state=active]:bg-emerald-100 group-data-[state=active]:text-emerald-800">
                  {floor.tables?.length || 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <p className="mt-3 text-sm text-slate-500">
            Choose a floor and table to start or continue an order.
          </p>
        </div>

        {floors.map((floor) => (
          <TabsContent key={floor._id} value={floor._id} className="flex-1 px-4 pt-6 mt-0 outline-none max-w-7xl w-full xl:mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {floor.tables?.map((table) => (
                <Card
                  key={table._id}
                  onClick={() => handleTableClick(table)}
                  className={cn(
                    'relative cursor-pointer rounded-2xl transition-all duration-200 group overflow-hidden',
                    tableCardClass(table.status)
                  )}
                >
                  <div className="p-4 text-center">
                    <div
                      className={cn(
                        'text-3xl font-bold mb-1 tabular-nums',
                        table.status === 'occupied' && 'text-orange-700',
                        table.status === 'available' && 'text-emerald-800'
                      )}
                    >
                      {table.tableNumber}
                    </div>
                    <p
                      className={cn(
                        'text-xs italic mb-3',
                        table.status === 'occupied' ? 'text-orange-700/85' : 'text-emerald-700/85'
                      )}
                    >
                      Seats: {table.seats}
                    </p>
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm',
                        table.status === 'occupied' && 'bg-orange-500 text-white',
                        table.status === 'available' && 'bg-emerald-600 text-white',
                        table.status !== 'occupied' && table.status !== 'available' && 'bg-red-600 text-white'
                      )}
                    >
                      {table.status}
                    </span>
                    {table.status === 'occupied' && table.currentOrder && (
                      <p className="text-[11px] mt-2 font-mono text-slate-600/90 truncate px-1">
                        {table.currentOrder.orderNumber}
                      </p>
                    )}
                    {session && (
                      <div className="mt-3 flex justify-center" onClick={(e) => e.stopPropagation()}>
                        <GenerateQRButton
                          tableId={table._id}
                          tableNumber={table.tableNumber}
                          className="bg-white border-slate-200 text-slate-800 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FloorPlan;
