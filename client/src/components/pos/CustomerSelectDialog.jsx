import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveCustomer } from '../../store/slices/cartSlice';
import customersApi from '../../api/customersApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../ui/Dialog';
import { Search, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
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

/**
 * Search / create customer without leaving the order screen.
 */
const CustomerSelectDialog = ({ open, onOpenChange, tableLabel }) => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setResults([]);
      setForm(emptyForm);
    }
  }, [open]);

  const runSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await customersApi.getAll({ q: q.trim(), limit: 20 });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => runSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, runSearch, open]);

  const pickCustomer = (customer) => {
    dispatch(setActiveCustomer(customer));
    toast.success(`Customer: ${customer.name}`);
    onOpenChange(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const { data } = await customersApi.create({
        name: form.name.trim(),
        phone: form.phone.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        notes: form.notes.trim(),
      });
      pickCustomer(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Who is dining?</DialogTitle>
          <DialogDescription>
            {tableLabel || 'Table'} — search or add a customer for this order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" /> Find customer
              </CardTitle>
              <CardDescription className="text-xs">Name, mobile, email, city, or address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {searching && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                </p>
              )}
              {results.length > 0 && (
                <ul className="border rounded-lg divide-y max-h-48 overflow-auto">
                  {results.map((c) => (
                    <li key={c._id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-muted/80 flex items-center justify-between gap-2"
                        onClick={() => pickCustomer(c)}
                      >
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[c.mobile || c.phone, c.email, c.city].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {search.trim().length >= 1 && !searching && results.length === 0 && (
                <p className="text-xs text-muted-foreground">No matches — add below.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> New customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid gap-1.5">
                <Label htmlFor="cd-name">Name *</Label>
                <Input
                  id="cd-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="cd-mobile">Mobile</Label>
                  <Input id="cd-mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="cd-email">Email</Label>
                  <Input id="cd-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cd-phone">Phone</Label>
                <Input id="cd-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cd-address">Address</Label>
                <Textarea id="cd-address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="cd-city">City</Label>
                  <Input id="cd-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="cd-state">State</Label>
                  <Input id="cd-state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cd-country">Country</Label>
                <Input id="cd-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cd-notes">Notes</Label>
                <Input id="cd-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <Button className="w-full gap-2" type="button" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Save &amp; use for this order
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerSelectDialog;
