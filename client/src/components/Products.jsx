import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { Plus, Edit2, Trash2, Search, Filter, RefreshCw, X, AlertCircle } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedProductId, setSelectedProductId] = useState(null);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [formError, setFormError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      setError('Failed to fetch products list.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedProductId(null);
    setName('');
    setCategory('');
    setPrice('');
    setStockQuantity('');
    setLowStockThreshold('10');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (prod) => {
    setModalMode('edit');
    setSelectedProductId(prod._id);
    setName(prod.name);
    setCategory(prod.category);
    setPrice(prod.price.toString());
    setStockQuantity(prod.stockQuantity.toString());
    setLowStockThreshold(prod.lowStockThreshold.toString());
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !category || !price || !stockQuantity) {
      setFormError('Please fill out all required fields.');
      return;
    }

    const payload = {
      name: name.trim(),
      category: category.trim(),
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity),
      lowStockThreshold: parseInt(lowStockThreshold || '10')
    };

    try {
      if (modalMode === 'add') {
        await api.post('/products', payload);
      } else {
        await api.put(`/products/${selectedProductId}`, payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving product details.');
    }
  };

  const handleDelete = async (id, prodName) => {
    if (window.confirm(`Are you sure you want to delete product: "${prodName}"?`)) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting product.');
      }
    }
  };

  const categories = [...new Set(products.map(p => p.category))].sort();

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Search products or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ position: 'relative', width: '180px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Filter size={16} />
            </span>
            <select
              className="form-input"
              style={{ paddingLeft: '36px', appearance: 'none', cursor: 'pointer' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw className="animate-spin" /> Loading inventory...</div>
      ) : error ? (
        <div className="card" style={{ color: 'var(--danger)' }}>{error}</div>
      ) : (
        <>
          {/* Desktop/Tablet Table view */}
          <div className="card product-desktop-view" style={{ padding: '0px' }}>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Stock Quantity</th>
                    <th>Low-Stock Alert Level</th>
                    <th className="no-print" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                        No products found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(prod => {
                      const isLowStock = prod.stockQuantity < prod.lowStockThreshold;
                      return (
                        <tr key={prod._id}>
                          <td style={{ fontWeight: 600 }}>{prod.name}</td>
                          <td>{prod.category}</td>
                          <td>₹{prod.price.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${isLowStock ? 'badge-danger' : 'badge-success'}`}>
                              {prod.stockQuantity} items
                            </span>
                          </td>
                          <td>Below {prod.lowStockThreshold} units</td>
                          <td className="no-print" style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                className="btn btn-secondary btn-icon"
                                onClick={() => openEditModal(prod)}
                                title="Edit Product"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="btn btn-danger btn-icon"
                                onClick={() => handleDelete(prod._id, prod.name)}
                                title="Delete Product"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card list view */}
          <div className="products-mobile-view">
            {filteredProducts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                No products found matching filters.
              </div>
            ) : (
              filteredProducts.map(prod => {
                const isLowStock = prod.stockQuantity < prod.lowStockThreshold;
                return (
                  <div key={prod._id} className="card product-mobile-card">
                    <div className="product-card-header">
                      <div className="product-card-title-block">
                        <h4 className="product-card-title">{prod.name}</h4>
                        <span className="badge badge-success product-card-category" style={{ marginTop: '4px' }}>
                          {prod.category}
                        </span>
                      </div>
                      <span className="product-card-price">₹{prod.price.toFixed(2)}</span>
                    </div>

                    <div className="product-card-details">
                      <div className="product-card-detail-row">
                        <span className="detail-label">Stock Quantity:</span>
                        <span className={`badge ${isLowStock ? 'badge-danger' : 'badge-success'}`}>
                          {prod.stockQuantity} items
                        </span>
                      </div>
                      <div className="product-card-detail-row">
                        <span className="detail-label">Alert Level:</span>
                        <span className="detail-value">Below {prod.lowStockThreshold} units</span>
                      </div>
                    </div>

                    <div className="product-card-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => openEditModal(prod)}
                        style={{ flex: 1 }}
                        title="Edit Product"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(prod._id, prod.name)}
                        style={{ flex: 1 }}
                        title="Delete Product"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {modalMode === 'add' ? 'Create New Product' : 'Modify Product'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                fontSize: '0.85rem',
                fontWeight: 500
              }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Arabica Blend (250g)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Grocery, Electronics"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="form-input"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="form-input"
                    placeholder="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Low-Stock Alert Level</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 10"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === 'add' ? 'Add Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}