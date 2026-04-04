import React, { useEffect, useState } from 'react';
import customersApi from '../../api/customersApi';
import useAuth from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/Dialog';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../ui/Table';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
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
    if (!window.confirm('Delete this customer?')) return;
    try {
      await customersApi.remove(id);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customer records for POS and reporting</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Add customer
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search name, mobile, email, city…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : (
              list.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm">{c.mobile || c.phone || '—'}</TableCell>
                  <TableCell className="text-sm max-w-[140px] truncate">{c.email || '—'}</TableCell>
                  <TableCell className="text-sm">{c.city || '—'}</TableCell>
                  <TableCell className="text-sm">{c.state || '—'}</TableCell>
                  <TableCell className="text-sm">{c.country || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && !list.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No customers yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit customer' : 'New customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Mobile</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Primary mobile" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>Phone (landline)</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Address</Label><Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>State / Province</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            </div>
            <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerList;
