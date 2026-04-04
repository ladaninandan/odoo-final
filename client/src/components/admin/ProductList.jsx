import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories, createProduct, updateProduct, deleteProduct } from '../../store/slices/productsSlice';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '../ui/Select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/Dialog';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../ui/Table';
import { formatCurrency } from '../../utils/formatCurrency';
import { Plus, Pencil, Trash2, Package, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const emptyForm = { name: '', category: '', price: '', description: '', taxRate: 5, sendToKitchen: true, isActive: true };

const ProductList = () => {
  const dispatch = useDispatch();
  const { list: products, categories, isLoading } = useSelector((state) => state.products);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setImageFile(null); setDialogOpen(true); };
  const openEdit = (product) => {
    setForm({
      name: product.name, category: product.category?._id || '', price: product.price,
      description: product.description, taxRate: product.taxRate, sendToKitchen: product.sendToKitchen, isActive: product.isActive,
    });
    setEditId(product._id); setImageFile(null); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.price) return toast.error('Fill required fields');
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append('image', imageFile);

    try {
      if (editId) {
        await dispatch(updateProduct({ id: editId, formData: fd })).unwrap();
        toast.success('Product updated!');
      } else {
        await dispatch(createProduct(fd)).unwrap();
        toast.success('Product created!');
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err || 'Failed');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await dispatch(deleteProduct(id)).unwrap();
      toast.success('Product deleted');
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} total products</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Tax</TableHead>
              <TableHead>Kitchen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p._id}>
                <TableCell>
                  {p.image ? (
                    <img src={`${API_URL}${p.image}`} alt={p.name} className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <Badge style={{ backgroundColor: p.category?.color + '20', color: p.category?.color }}>
                    {p.category?.icon} {p.category?.name}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(p.price)}</TableCell>
                <TableCell>{p.taxRate}%</TableCell>
                <TableCell><Badge variant={p.sendToKitchen ? 'success' : 'secondary'}>{p.sendToKitchen ? 'Yes' : 'No'}</Badge></TableCell>
                <TableCell><Badge variant={p.isActive ? 'default' : 'destructive'}>{p.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p._id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!products.length && (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No products yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Product' : 'New Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => (<SelectItem key={c._id} value={c._id}>{c.icon} {c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Tax %</Label><Input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div><Label>Image</Label><Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductList;
