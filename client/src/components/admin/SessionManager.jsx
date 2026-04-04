import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentSession, openSession, closeSession } from '../../store/slices/sessionSlice';
import sessionsApi from '../../api/sessionsApi';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../ui/Table';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  PlayCircle, StopCircle, Clock, DollarSign, ShoppingBag, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SessionManager = () => {
  const dispatch = useDispatch();
  const { current, isLoading } = useSelector((state) => state.session);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [closingBalance, setClosingBalance] = useState('');
  const [allSessions, setAllSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    dispatch(fetchCurrentSession());
    loadAllSessions();
  }, [dispatch]);

  const loadAllSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data } = await sessionsApi.getAll();
      setAllSessions(data);
    } catch {}
    setLoadingSessions(false);
  };

  const handleOpen = async () => {
    try {
      await dispatch(openSession({ openingBalance: parseFloat(openingBalance) || 0 })).unwrap();
      toast.success('Session opened!');
      loadAllSessions();
    } catch (err) {
      toast.error(err || 'Failed to open session');
    }
  };

  const handleClose = async () => {
    try {
      await dispatch(closeSession({
        id: current._id,
        closingBalance: parseFloat(closingBalance) || 0,
      })).unwrap();
      toast.success('Session closed!');
      loadAllSessions();
    } catch (err) {
      toast.error(err || 'Failed to close session');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Session Management</h1>

      {/* Current Session */}
      {current ? (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                  Active Session
                </CardTitle>
                <CardDescription>
                  Opened by {current.openedBy?.first_name} at {new Date(current.openedAt).toLocaleTimeString()}
                </CardDescription>
              </div>
              <Badge variant="success">Open</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-background rounded-lg">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Opening Balance</p>
                <p className="font-bold">{formatCurrency(current.openingBalance)}</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="font-bold text-primary">{formatCurrency(current.totalSales)}</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-bold">
                  {Math.round((Date.now() - new Date(current.openedAt).getTime()) / 3600000)}h
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="closingBalance">Closing Cash Balance</Label>
                <Input
                  id="closingBalance"
                  type="number"
                  placeholder="Count your cash"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                />
              </div>
              <Button variant="destructive" onClick={handleClose} className="gap-2">
                <StopCircle className="h-4 w-4" />
                Close Session
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Session</CardTitle>
            <CardDescription>Open a session to start taking orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="openingBalance">Opening Cash Balance</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  placeholder="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                />
              </div>
              <Button onClick={handleOpen} className="gap-2" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <PlayCircle className="h-4 w-4" />
                Open Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opened By</TableHead>
                <TableHead>Opened At</TableHead>
                <TableHead>Closed At</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Closing</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSessions.map((s) => (
                <TableRow key={s._id}>
                  <TableCell>{s.openedBy?.first_name} {s.openedBy?.last_name}</TableCell>
                  <TableCell>{new Date(s.openedAt).toLocaleString()}</TableCell>
                  <TableCell>{s.closedAt ? new Date(s.closedAt).toLocaleString() : '-'}</TableCell>
                  <TableCell>{formatCurrency(s.openingBalance)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(s.totalSales)}</TableCell>
                  <TableCell>{s.closingBalance !== null ? formatCurrency(s.closingBalance) : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'open' ? 'success' : 'secondary'}>{s.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!allSessions.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No sessions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionManager;
