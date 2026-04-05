import React, { useEffect, useState, useMemo } from 'react';
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/Table';
import { formatCurrency } from '../../utils/formatCurrency';
import { cn } from '../../lib/utils';
import {
  PlayCircle,
  StopCircle,
  Clock,
  Loader2,
  History,
  User,
  CalendarClock,
  Wallet,
  TrendingUp,
  Lock,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

function formatDurationSince(date) {
  const ms = Date.now() - new Date(date).getTime();
  if (ms < 0) return '—';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function initialsFromUser(u) {
  if (!u) return '?';
  const a = (u.first_name || '').trim();
  const b = (u.last_name || '').trim();
  if (a && b) return `${a[0]}${b[0]}`.toUpperCase();
  if (a) return a.slice(0, 2).toUpperCase();
  return '?';
}

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
      setAllSessions(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Could not load session history');
      setAllSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleOpen = async () => {
    try {
      await dispatch(openSession({ openingBalance: parseFloat(openingBalance) || 0 })).unwrap();
      toast.success('Session opened!');
      setOpeningBalance('0');
      loadAllSessions();
    } catch (err) {
      toast.error(err || 'Failed to open session');
    }
  };

  const handleClose = async () => {
    if (!current?._id) return;
    try {
      await dispatch(
        closeSession({
          id: current._id,
          closingBalance: parseFloat(closingBalance) || 0,
        })
      ).unwrap();
      toast.success('Session closed!');
      setClosingBalance('');
      loadAllSessions();
    } catch (err) {
      toast.error(err || 'Failed to close session');
    }
  };

  const sortedSessions = useMemo(() => {
    return [...allSessions].sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));
  }, [allSessions]);

  return (
    <div className="w-full min-w-0 space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Till sessions</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Open and close cash sessions for the POS. History shows every till run with opening float, sales, and close count.
          </p>
        </div>
      </div>

      {/* Current / open session */}
      {current ? (
        <Card className="overflow-hidden border-primary/25 shadow-lg bg-gradient-to-br from-primary/[0.07] via-card to-muted/20">
          <CardHeader className="border-b border-border/60 bg-card/50 pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20">
                  <Sparkles className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-xl">Active till session</CardTitle>
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-0 gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      Open
                    </Badge>
                  </div>
                  <CardDescription className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {current.openedBy?.first_name} {current.openedBy?.last_name || ''}
                    </span>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Since {new Date(current.openedAt).toLocaleString()}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border/80 bg-background/80 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">
                  <Wallet className="h-4 w-4" />
                  Opening float
                </div>
                <p className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(current.openingBalance)}</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 shadow-sm">
                <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wide mb-2">
                  <TrendingUp className="h-4 w-4" />
                  Sales (session)
                </div>
                <p className="text-2xl font-bold tabular-nums text-primary">{formatCurrency(current.totalSales ?? 0)}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background/80 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">
                  <Clock className="h-4 w-4" />
                  Running time
                </div>
                <p className="text-2xl font-bold tabular-nums">{formatDurationSince(current.openedAt)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3 max-w-3xl">
              <Label htmlFor="closingBalance" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Closing cash count
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Input
                  id="closingBalance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  className="h-11 rounded-xl min-w-0 flex-1 sm:max-w-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  className="gap-2 rounded-xl h-11 w-full sm:w-auto shrink-0 px-6"
                  onClick={handleClose}
                >
                  <StopCircle className="h-5 w-5" />
                  Close session
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Count the drawer and enter the total before closing.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-dashed border-2 border-primary/25 bg-gradient-to-br from-muted/40 to-card shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Lock className="h-8 w-8" />
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-xl font-bold">No till session open</h2>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Cashiers need an active session to take orders. Enter the opening cash in the drawer, then open the session.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end lg:shrink-0 w-full lg:w-auto lg:max-w-md">
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <Label htmlFor="openingBalance">Opening cash (float)</Label>
                  <Input
                    id="openingBalance"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <Button
                  type="button"
                  size="lg"
                  className="gap-2 rounded-xl h-11 px-8 shrink-0 w-full sm:w-auto"
                  onClick={handleOpen}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
                  Open session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History — full bleed */}
      <div className="">
        <Card className="overflow-hidden rounded-none border-x-0 border-border/80 shadow-md sm:rounded-lg sm:border-x">
          <CardHeader className="border-b border-border/60 bg-gradient-to-br from-muted/40 via-card to-card px-4 py-4 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <History className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Session history</CardTitle>
                <CardDescription>
                  {loadingSessions ? 'Loading…' : `${sortedSessions.length} record${sortedSessions.length === 1 ? '' : 's'}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-4 sm:pl-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Opened by
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[160px]">
                      Opened
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[160px]">
                      Closed
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Opening
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sales
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Closing
                    </TableHead>
                    <TableHead className="pr-4 sm:pr-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[100px]">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSessions ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40">
                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span className="text-sm">Loading history…</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedSessions.map((s) => (
                      <TableRow
                        key={s._id}
                        className={cn(
                          'border-border/60 hover:bg-primary/[0.03] transition-colors',
                          s.status === 'open' && 'bg-emerald-500/[0.04]'
                        )}
                      >
                        <TableCell className="pl-4 sm:pl-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary text-xs font-bold">
                              {initialsFromUser(s.openedBy)}
                            </div>
                            <span className="font-medium text-sm">
                              {[s.openedBy?.first_name, s.openedBy?.last_name].filter(Boolean).join(' ') || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular-nums py-4">
                          {new Date(s.openedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular-nums py-4">
                          {s.closedAt ? new Date(s.closedAt).toLocaleString() : '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums py-4">{formatCurrency(s.openingBalance)}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-primary py-4">
                          {formatCurrency(s.totalSales ?? 0)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums py-4">
                          {s.closingBalance != null ? formatCurrency(s.closingBalance) : '—'}
                        </TableCell>
                        <TableCell className="pr-4 sm:pr-5 py-4">
                          <Badge
                            variant={s.status === 'open' ? 'default' : 'secondary'}
                            className={cn(
                              s.status === 'open' && 'bg-emerald-600 hover:bg-emerald-600 text-white border-0'
                            )}
                          >
                            {s.status === 'open' ? 'Open' : 'Closed'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {!loadingSessions && !sortedSessions.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground">
                          <History className="h-10 w-10 opacity-30" />
                          <p className="font-medium text-foreground">No sessions yet</p>
                          <p className="text-sm">Open a till session above to see it listed here.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SessionManager;
