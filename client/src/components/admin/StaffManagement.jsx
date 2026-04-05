import React, { useEffect, useMemo, useState } from 'react';
import usersApi from '../../api/usersApi';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../ui/Table';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '../ui/Select';
import { cn } from '../../lib/utils';
import {
  Loader2,
  Users,
  RefreshCw,
  Shield,
  UserCheck,
  UserX,
  Archive,
  Search,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

function initials(first, last, email) {
  const a = (first || '').trim().charAt(0);
  const b = (last || '').trim().charAt(0);
  if (a || b) return `${a}${b}`.toUpperCase();
  return (email || '?').slice(0, 2).toUpperCase();
}

const StaffManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await usersApi.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to load staff';
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (id, body) => {
    setUpdatingId(id);
    try {
      await usersApi.update(id, body);
      toast.success('Saved');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
    setUpdatingId(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, query]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === 'active').length;
    const byRole = { admin: 0, cashier: 0, kitchen: 0 };
    users.forEach((u) => {
      if (byRole[u.role] !== undefined) byRole[u.role] += 1;
    });
    return { total: users.length, active, byRole };
  }, [users]);

  const statCards = [
    {
      title: 'Team size',
      value: stats.total,
      sub: 'Accounts',
      icon: Users,
      className: 'border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card dark:from-primary/15',
    },
    {
      title: 'Active',
      value: stats.active,
      sub: 'Can sign in',
      icon: UserCheck,
      className: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-card dark:from-emerald-500/15',
    },
    {
      title: 'Roles',
      value: `${stats.byRole.admin}/${stats.byRole.cashier}/${stats.byRole.kitchen}`,
      sub: 'Admin / Cashier / Kitchen',
      icon: Shield,
      className: 'border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-card to-card dark:from-violet-500/15',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff & roles</h1>
              <p className="text-sm text-muted-foreground">
                Assign roles and account status. Changes apply on the user&apos;s next request.
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} className="gap-2 shrink-0">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={() => load()}>
            Retry
          </Button>
        </div>
      )}

      {/* KPI skeleton */}
      {loading && !users.length && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {/* KPI cards */}
      {!loading || users.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {statCards.map((s) => (
            <Card key={s.title} className={cn('overflow-hidden border shadow-sm', s.className)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{s.title}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                  </div>
                  <div className="rounded-lg bg-background/60 p-2.5 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Table card */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-lg">Team members</CardTitle>
              <CardDescription>
                {loading && !users.length
                  ? 'Loading directory…'
                  : `${filtered.length} shown${query.trim() ? ` of ${users.length}` : ''}`}
              </CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search name or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                aria-label="Search staff"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && !users.length ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="min-w-[200px]">Member</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="min-w-[160px]">Role</TableHead>
                    <TableHead className="min-w-[160px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => {
                    const busy = updatingId === u._id;
                    return (
                      <TableRow key={u._id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
                              aria-hidden
                            >
                              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : initials(u.first_name, u.last_name, u.email)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}
                              </p>
                              <p className="text-xs text-muted-foreground md:hidden truncate">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[240px]">
                          <span className="truncate block">{u.email}</span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(role) => patch(u._id, { role })}
                            disabled={busy}
                          >
                            <SelectTrigger className="w-[min(100%,11rem)] h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="cashier">Cashier</SelectItem>
                              <SelectItem value="kitchen">Kitchen</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.status}
                            onValueChange={(status) => patch(u._id, { status })}
                            disabled={busy}
                          >
                            <SelectTrigger className="w-[min(100%,10rem)] h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!filtered.length && !loading && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          {users.length ? (
                            <>
                              <UserX className="h-10 w-10 opacity-40" />
                              <p>No matches for &quot;{query.trim()}&quot;</p>
                              <Button variant="link" className="text-primary h-auto p-0" onClick={() => setQuery('')}>
                                Clear search
                              </Button>
                            </>
                          ) : (
                            <>
                              <Archive className="h-10 w-10 opacity-40" />
                              <p>No team members yet.</p>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffManagement;
