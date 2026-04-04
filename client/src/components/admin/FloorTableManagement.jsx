import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFloors } from '../../store/slices/floorsSlice';
import floorsApi from '../../api/floorsApi';
import tablesApi from '../../api/tablesApi';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Badge } from '../ui/Badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/Dialog';
import { cn } from '../../lib/utils';
import { getTableStatusColor } from '../../utils/orderHelpers';
import { Plus, Pencil, Trash2, Users, Armchair } from 'lucide-react';
import toast from 'react-hot-toast';

const FloorTableManagement = () => {
  const dispatch = useDispatch();
  const { list: floors, isLoading } = useSelector((state) => state.floors);
  const [floorDialog, setFloorDialog] = useState(false);
  const [tableDialog, setTableDialog] = useState(false);
  const [floorForm, setFloorForm] = useState({ name: '' });
  const [tableForm, setTableForm] = useState({ floor: '', tableNumber: '', seats: '4' });
  const [editFloorId, setEditFloorId] = useState(null);

  useEffect(() => { dispatch(fetchFloors()); }, [dispatch]);

  const handleCreateFloor = async () => {
    if (!floorForm.name) return toast.error('Floor name required');
    try {
      if (editFloorId) {
        await floorsApi.update(editFloorId, floorForm);
        toast.success('Floor updated');
      } else {
        await floorsApi.create(floorForm);
        toast.success('Floor created');
      }
      dispatch(fetchFloors());
      setFloorDialog(false);
    } catch (err) { toast.error('Failed'); }
  };

  const handleDeleteFloor = async (id) => {
    if (!window.confirm('Delete this floor and all its tables?')) return;
    try { await floorsApi.remove(id); dispatch(fetchFloors()); toast.success('Floor deleted'); }
    catch { toast.error('Failed'); }
  };

  const handleCreateTable = async () => {
    if (!tableForm.floor || !tableForm.tableNumber || !tableForm.seats) return toast.error('Fill all fields');
    try {
      await tablesApi.create({
        floor: tableForm.floor,
        tableNumber: parseInt(tableForm.tableNumber),
        seats: parseInt(tableForm.seats),
      });
      dispatch(fetchFloors());
      setTableDialog(false);
      toast.success('Table created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm('Delete this table?')) return;
    try { await tablesApi.remove(id); dispatch(fetchFloors()); toast.success('Table deleted'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Floors & Tables</h1>
        <div className="flex gap-2">
          <Button onClick={() => { setFloorForm({ name: '' }); setEditFloorId(null); setFloorDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Floor
          </Button>
          <Button variant="outline" onClick={() => { setTableForm({ floor: floors[0]?._id || '', tableNumber: '', seats: '4' }); setTableDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Table
          </Button>
        </div>
      </div>

      {floors.map((floor) => (
        <Card key={floor._id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Armchair className="h-5 w-5" />
                {floor.name}
                <Badge variant="secondary">{floor.tables?.length || 0} tables</Badge>
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setFloorForm({ name: floor.name }); setEditFloorId(floor._id); setFloorDialog(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteFloor(floor._id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {floor.tables?.map((table) => (
                <div
                  key={table._id}
                  className={cn(
                    'p-3 rounded-lg border-2 text-center relative group',
                    getTableStatusColor(table.status)
                  )}
                >
                  <div className="font-bold text-lg">{table.tableNumber}</div>
                  <div className="flex items-center justify-center gap-1 text-xs opacity-70">
                    <Users className="h-3 w-3" /> {table.seats}
                  </div>
                  <Badge variant={table.status === 'available' ? 'success' : 'warning'} className="text-[10px] mt-1">
                    {table.status}
                  </Badge>
                  <button
                    onClick={() => handleDeleteTable(table._id)}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Floor Dialog */}
      <Dialog open={floorDialog} onOpenChange={setFloorDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editFloorId ? 'Edit Floor' : 'New Floor'}</DialogTitle></DialogHeader>
          <div><Label>Floor Name</Label><Input value={floorForm.name} onChange={(e) => setFloorForm({ name: e.target.value })} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFloorDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateFloor}>{editFloorId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Dialog */}
      <Dialog open={tableDialog} onOpenChange={setTableDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Table</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Floor</Label>
              <select
                value={tableForm.floor}
                onChange={(e) => setTableForm({ ...tableForm, floor: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {floors.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </div>
            <div><Label>Table Number</Label><Input type="number" value={tableForm.tableNumber} onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })} /></div>
            <div><Label>Seats</Label><Input type="number" value={tableForm.seats} onChange={(e) => setTableForm({ ...tableForm, seats: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTable}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FloorTableManagement;
