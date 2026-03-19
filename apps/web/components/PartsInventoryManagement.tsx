'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, AlertCircle, Package, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Part {
  id: number;
  hub_id: number;
  part_name: string;
  part_code: string;
  category: string;
  quantity_in_stock: number;
  minimum_stock_level: number;
  maximum_stock_level: number;
  unit_cost: number;
  supplier: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function PartsInventoryManagement({ hubId }: { hubId: number }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isHubManager = user?.role === 'hub_manager';

  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    partName: '',
    partCode: '',
    category: 'General',
    quantityInStock: 0,
    minimumStockLevel: 5,
    maximumStockLevel: 100,
    unitCost: 0,
    supplier: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchParts();
  }, [hubId]);

  const fetchParts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/parts-inventory?action=by-hub&hubId=${hubId}`);
      if (response.ok) {
        const data = await response.json();
        setParts(data);
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/parts-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hubId,
          ...formData,
        }),
      });

      if (response.ok) {
        alert('Part added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchParts();
      } else {
        const error = await response.json();
        alert(`Failed to add part: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding part:', error);
      alert('Error adding part');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/parts-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: selectedPart.id,
          quantityInStock: formData.quantityInStock,
          unitCost: formData.unitCost,
          supplier: formData.supplier,
        }),
      });

      if (response.ok) {
        alert('Part updated successfully!');
        setShowEditModal(false);
        setSelectedPart(null);
        resetForm();
        fetchParts();
      } else {
        const error = await response.json();
        alert(`Failed to update part: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating part:', error);
      alert('Error updating part');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePart = async (partId: number) => {
    if (!confirm('Are you sure you want to delete this part?')) return;

    try {
      const response = await fetch(`/api/parts-inventory?id=${partId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Part deleted successfully!');
        fetchParts();
      } else {
        const error = await response.json();
        alert(`Failed to delete part: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting part:', error);
      alert('Error deleting part');
    }
  };

  const handleOpenEditModal = (part: Part) => {
    setSelectedPart(part);
    setFormData({
      partName: part.part_name,
      partCode: part.part_code,
      category: part.category,
      quantityInStock: part.quantity_in_stock,
      minimumStockLevel: part.minimum_stock_level,
      maximumStockLevel: part.maximum_stock_level,
      unitCost: part.unit_cost,
      supplier: part.supplier,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      partName: '',
      partCode: '',
      category: 'General',
      quantityInStock: 0,
      minimumStockLevel: 5,
      maximumStockLevel: 100,
      unitCost: 0,
      supplier: '',
    });
  };

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.part_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || part.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || part.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(parts.map((p) => p.category)));
  const statuses = Array.from(new Set(parts.map((p) => p.status)));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-700';
      case 'Low Stock':
        return 'bg-amber-100 text-amber-700';
      case 'Out of Stock':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const totalValue = filteredParts.reduce((sum, part) => {
    return sum + part.unit_cost * part.quantity_in_stock;
  }, 0);

  const lowStockCount = filteredParts.filter((p) => p.status === 'Low Stock').length;
  const outOfStockCount = filteredParts.filter((p) => p.status === 'Out of Stock').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Parts Inventory Management</h2>
          <p className="text-sm text-slate-600 mt-1">
            {isAdmin ? 'Manage parts stock and pricing for your hub' : 'Add and manage parts stock for your hub'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isHubManager && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-200">
              <Lock size={14} />
              <span>Edit restricted to Admin</span>
            </div>
          )}
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus size={20} />
            Add Part
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 font-medium">Total Parts</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{filteredParts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 font-medium">Total Inventory Value</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-700 font-medium">Low Stock</p>
          <p className="text-3xl font-bold text-amber-700 mt-2">{lowStockCount}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-xs text-red-700 font-medium">Out of Stock</p>
          <p className="text-3xl font-bold text-red-700 mt-2">{outOfStockCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Search Parts</label>
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading inventory...</p>
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">
              {parts.length === 0 ? 'No parts in inventory yet' : 'No parts match your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Part Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Unit Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Stock Value</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part) => (
                  <tr key={part.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{part.part_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-slate-600">{part.part_code || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{part.category}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {part.quantity_in_stock}
                      </div>
                      <p className="text-xs text-slate-500">
                        Min: {part.minimum_stock_level} | Max: {part.maximum_stock_level}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">₹{part.unit_cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        ₹{(part.unit_cost * part.quantity_in_stock).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(part.status)}`}>
                        {part.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{part.supplier || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {isAdmin ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(part)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit part"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePart(part.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete part"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Lock size={12} />
                            No edit access
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Part Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Add New Part</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddPart} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Part Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.partName}
                    onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Part Code</label>
                  <input
                    type="text"
                    value={formData.partCode}
                    onChange={(e) => setFormData({ ...formData, partCode: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option>General</option>
                    <option>Battery</option>
                    <option>Brakes</option>
                    <option>Engine Parts</option>
                    <option>Suspension</option>
                    <option>Electrical</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Unit Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Initial Quantity</label>
                  <input
                    type="number"
                    value={formData.quantityInStock}
                    onChange={(e) => setFormData({ ...formData, quantityInStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Min Stock Level</label>
                  <input
                    type="number"
                    value={formData.minimumStockLevel}
                    onChange={(e) => setFormData({ ...formData, minimumStockLevel: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Max Stock Level</label>
                  <input
                    type="number"
                    value={formData.maximumStockLevel}
                    onChange={(e) => setFormData({ ...formData, maximumStockLevel: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Part'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Part Modal */}
      {showEditModal && selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Edit Part: {selectedPart.part_name}</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPart(null);
                  resetForm();
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleEditPart} className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  Edit quantity and pricing for this part
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantity in Stock</label>
                  <input
                    type="number"
                    value={formData.quantityInStock}
                    onChange={(e) => setFormData({ ...formData, quantityInStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600">Total Stock Value</p>
                <p className="text-2xl font-bold text-slate-900">
                  ₹{(formData.unitCost * formData.quantityInStock).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Part'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPart(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
