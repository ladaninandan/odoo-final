import React, { useEffect, useState } from 'react';
import customersApi from '../../api/customersApi';
import useAuth from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/Table';
import { ScrollReveal } from '../ui/ScrollReveal';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Users,
  Phone,
  Mail,
  MapPin,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '',
  phone: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  state: '',
  country: '',
  notes: '',
};

function initialsFromName(name) {
  if (!name || !String(name).trim()) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatLocation(c) {
  const bits = [c.city, c.state, c.country].filter(Boolean);
  return bits.length ? bits.join(', ') : '—';
}

const CustomerList = () => {
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await customersApi.getAll({ q: q.trim() || undefined, limit: 200 });
      setList(data);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (c) => {
    setForm({
      name: c.name || '',
      phone: c.phone || '',
      mobile: c.mobile || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      country: c.country || '',
      notes: c.notes || '',
    });
    setEditId(c._id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editId) {
        await customersApi.update(editId, form);
        toast.success('Customer updated');
      } else {
        await customersApi.create(form);
        toast.success('Customer created');
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer? This cannot be undone.')) return;
    try {
      await customersApi.remove(id);
      toast.success('Customer deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 px-4 sm:px-6 lg:px-8 pb-8 pt-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Customers</h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Search and maintain customer records used at the POS and in reports.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="gap-2 rounded-xl shadow-md shrink-0 w-full sm:w-auto"
          onClick={openCreate}
        >
          <Plus className="h-5 w-5" />
          Add customer
        </Button>
      </div>

      <ScrollReveal>
      <Card className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-md">
        <CardHeader className="border-b border-border/60 bg-gradient-to-br from-muted/50 via-card to-card px-5 py-5 sm:px-6 space-y-4">
          <div>
            <CardTitle className="text-lg">Directory</CardTitle>
            <CardDescription className="mt-0.5">
              {loading ? 'Loading…' : `${list.length} customer${list.length === 1 ? '' : 's'} in the list`}
            </CardDescription>
          </div>
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-10 pr-10 h-11 rounded-xl border-border/80 bg-background shadow-sm"
              placeholder="Search by name, phone, email, city…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search customers"
            />
            {q ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setQ('')}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto overscroll-x-contain">
            <Table className="min-w-[760px] w-full">
              <TableHeader>
                <TableRow className="border-b border-border/80 bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[76px] pl-5 sm:pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    &nbsp;
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[220px] px-4">
                    Customer
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[180px] px-4">
                    Contact
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[200px] px-4">
                    Location
                  </TableHead>
                  <TableHead className="text-right pr-5 sm:pr-6 w-[128px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm">Loading customers…</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((c) => (
                    <TableRow
                      key={c._id}
                      className="group border-border/60 hover:bg-primary/[0.04] transition-colors"
                    >
                      <TableCell className="pl-5 sm:pl-6 py-4 align-middle">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold',
                            'bg-primary/12 text-primary ring-2 ring-primary/10'
                          )}
                        >
                          {initialsFromName(c.name)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 align-middle">
                        <p className="font-semibold text-foreground leading-tight">{c.name}</p>
                        {c.email ? (
                          <p className="text-xs text-muted-foreground truncate max-w-[220px] mt-1 flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0 opacity-60" />
                            {c.email}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/70 mt-1">No email</p>
                        )}
                        <p className="md:hidden text-xs text-muted-foreground mt-1.5 flex items-start gap-1 max-w-[240px]">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />
                          <span className="line-clamp-2">{formatLocation(c)}</span>
                        </p>
                      </TableCell>
                      <TableCell className="py-4 px-4 align-middle">
                        {(c.mobile || c.phone) ? (
                          <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {c.mobile || c.phone}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-4 px-4 align-middle">
                        <span className="inline-flex items-start gap-1.5 text-sm text-muted-foreground max-w-[220px]">
                          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-70" />
                          <span className="line-clamp-2">{formatLocation(c)}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-5 sm:pr-6 py-4 align-middle">
                        <div className="inline-flex items-center gap-0.5 justify-end opacity-80 group-hover:opacity-100">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={() => openEdit(c)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(c._id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!loading && !list.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-56 text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-3 px-4 py-6">
                        <div className="rounded-full bg-muted p-4 text-muted-foreground">
                          <Users className="h-10 w-10 opacity-50" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {q.trim() ? 'No customers match your search' : 'No customers yet'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                            {q.trim()
                              ? 'Try a different keyword or clear the search.'
                              : 'Add your first customer to use them on the POS.'}
                          </p>
                        </div>
                        {!q.trim() && (
                          <Button type="button" className="gap-2 rounded-xl mt-2" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            Add customer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </ScrollReveal>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[min(92vh,760px)] overflow-y-auto sm:max-w-lg p-0 gap-0 sm:rounded-2xl border-border/80 shadow-2xl">
          <DialogHeader className="border-b border-border/80 bg-muted/30 px-6 py-5 text-left space-y-1">
            <DialogTitle className="text-xl">
              {editId ? 'Edit customer' : 'New customer'}
            </DialogTitle>
            <DialogDescription>
              Details are used when attaching a customer to POS orders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="cust-name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Full name *
              </Label>
              <Input
                id="cust-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11 rounded-xl"
                placeholder="Customer name"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cust-mobile">Mobile</Label>
                <Input
                  id="cust-mobile"
                  inputMode="tel"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="rounded-xl"
                  placeholder="Primary mobile"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-email">Email</Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl"
                  placeholder="name@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone">Phone (landline)</Label>
              <Input
                id="cust-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-address">Address</Label>
              <Textarea
                id="cust-address"
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="rounded-xl resize-none"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cust-city">City</Label>
                <Input id="cust-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-state">State / Province</Label>
                <Input id="cust-state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-country">Country</Label>
              <Input id="cust-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-notes">Notes</Label>
              <Input
                id="cust-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="rounded-xl"
                placeholder="Allergies, preferences…"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-border/80 bg-muted/20 px-6 py-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl gap-2 min-w-[100px]" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerList;
