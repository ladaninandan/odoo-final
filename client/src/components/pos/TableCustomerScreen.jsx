import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTable, setActiveCustomer } from '../../store/slices/cartSlice';
import customersApi from '../../api/customersApi';
import tablesApi from '../../api/tablesApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { UserPlus, Search, ArrowRight, Loader2 } from 'lucide-react';
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

const TableCustomerScreen = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeTable } = useSelector((s) => s.cart);
  const { current: session } = useSelector((s) => s.session);

  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [tableLabel, setTableLabel] = useState('');

  useEffect(() => {
    if (!session) {
      toast.error('Open a session first');
      navigate('/pos/floor');
    }
  }, [session, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await tablesApi.getAll({});
        const t = data.find((x) => String(x._id) === String(tableId));
        if (t) {
          dispatch(setActiveTable(t));
          setTableLabel(`Table ${t.tableNumber}`);
        } else {
          toast.error('Table not found');
          navigate('/pos/floor');
        }
      } catch {
        navigate('/pos/floor');
      }
    };
    load();
  }, [dispatch, tableId, navigate]);

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
    const t = setTimeout(() => runSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, runSearch]);

  const goToOrder = (customer) => {
    dispatch(setActiveCustomer(customer));
    navigate(`/pos/order/${tableId}`);
  };

  const handleCreateAndContinue = async () => {
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
      toast.success('Customer saved');
      goToOrder(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Who is dining?</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {tableLabel || 'Table'} — search an existing customer or add a new one before taking the order.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" /> Find customer
          </CardTitle>
          <CardDescription>Search by name, mobile, email, city, or address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
            <ul className="border rounded-lg divide-y max-h-56 overflow-auto">
              {results.map((c) => (
                <li key={c._id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/80 flex items-center justify-between gap-2"
                    onClick={() => goToOrder(c)}
                  >
                    <div>
                      <p className="font-medium">{c.name}</p>
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
            <p className="text-sm text-muted-foreground">No matches — add details below.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> New customer
          </CardTitle>
          <CardDescription>Required to start the order. Creates a record you can reuse next time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-2xl">
          <div className="grid gap-2">
            <Label htmlFor="c-name">Name *</Label>
            <Input
              id="c-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="c-mobile">Mobile</Label>
              <Input
                id="c-mobile"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="+91 …"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-email">Email</Label>
              <Input
                id="c-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-phone">Phone (landline)</Label>
            <Input
              id="c-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-address">Address</Label>
            <Textarea
              id="c-address"
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Street, building, etc."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="c-city">City</Label>
              <Input id="c-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-state">State / Province</Label>
              <Input id="c-state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-country">Country</Label>
            <Input id="c-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-notes">Notes</Label>
            <Input
              id="c-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Allergies, occasion, etc."
            />
          </div>
          <Button className="w-full gap-2" size="lg" onClick={handleCreateAndContinue} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Save &amp; continue to menu
          </Button>
        </CardContent>
      </Card>

      {activeTable && (
        <div className="mt-4 flex justify-center">
          <Badge variant="outline">Table {activeTable.tableNumber}</Badge>
        </div>
      )}
    </div>
  );
};

export default TableCustomerScreen;
