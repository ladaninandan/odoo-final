import React, { useEffect } from 'react';
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
import { Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import GenerateQRButton from '../selforder/GenerateQRButton';

const FloorPlan = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: floors, selectedFloor, isLoading } = useSelector((state) => state.floors);
  const { current: session } = useSelector((state) => state.session);

  useEffect(() => {
    dispatch(fetchFloors());
    dispatch(fetchCurrentSession());
  }, [dispatch]);

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
    navigate(`/pos/table/${table._id}/customer`);
  };

  const handleOpenSession = async () => {
    try {
      await dispatch(openSession({ openingBalance: 0 })).unwrap();
      toast.success('Session opened!');
    } catch (err) {
      toast.error(err || 'Failed to open session');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Session guard */}
      {!session && (
        <div className="bg-warning/10 border-b border-warning/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">No active session. Open one to start taking orders.</span>
          </div>
          <Button size="sm" variant="warning" onClick={handleOpenSession}>
            Open Session
          </Button>
        </div>
      )}

      {session && (
        <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="success" className="text-xs">
              Till open
            </Badge>
            <span className="text-muted-foreground">
              Sales this session:{' '}
              <span className="font-semibold text-foreground">{formatCurrency(session.totalSales ?? 0)}</span>
            </span>
          </div>
          <PosStopSessionButton variant="outline" size="sm" label="Stop session" />
        </div>
      )}

      <Tabs
        value={selectedFloor || floors[0]?._id}
        onValueChange={(val) => dispatch(selectFloor(val))}
        className="flex-1 flex flex-col"
      >
        <div className="border-b px-4">
          <TabsList className="bg-transparent h-12 gap-1">
            {floors.map((floor) => (
              <TabsTrigger
                key={floor._id}
                value={floor._id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-4"
              >
                {floor.name}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {floor.tables?.length || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {floors.map((floor) => (
          <TabsContent key={floor._id} value={floor._id} className="flex-1 p-6 mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {floor.tables?.map((table) => (
                <Card
                  key={table._id}
                  onClick={() => handleTableClick(table)}
                  className={cn(
                    'relative cursor-pointer border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg group',
                    getTableStatusColor(table.status)
                  )}
                >
                  <div className="p-4 text-center">
                    <div className="text-2xl font-bold mb-1">
                      {table.tableNumber}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs opacity-70 mb-2">
                      <Users className="h-3 w-3" />
                      {table.seats}
                    </div>
                    <Badge
                      variant={
                        table.status === 'available' ? 'success' :
                        table.status === 'occupied' ? 'warning' : 'destructive'
                      }
                      className="text-[10px]"
                    >
                      {table.status}
                    </Badge>
                    {table.status === 'occupied' && table.currentOrder && (
                      <p className="text-[10px] mt-1 opacity-60 truncate">
                        {table.currentOrder.orderNumber}
                      </p>
                    )}
                    {session && (
                      <div
                        className="mt-2 flex justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GenerateQRButton tableId={table._id} tableNumber={table.tableNumber} />
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
