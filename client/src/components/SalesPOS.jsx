import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { Search, Filter, ShoppingCart, Trash2, Plus, Minus, Check, RefreshCw, Printer, AlertTriangle } from 'lucide-react';

export default function SalesPOS() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Category Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Cart State
  const [cart, setCart] = useState([]); // Array of { product, quantity }
  const [finalTotalInput, setFinalTotalInput] = useState('');
  const [isTotalEdited, setIsTotalEdited] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Checkout Success State
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [customerName, setCustomerName] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      setError('Failed to fetch POS catalog.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Sync final total whenever cart updates (if not manually overridden)
  const calculatedTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  useEffect(() => {
    if (!isTotalEdited) {
      setFinalTotalInput(calculatedTotal > 0 ? calculatedTotal.toFixed(2) : '');
    }
  }, [cart, calculatedTotal, isTotalEdited]);

  const addToCart = (product) => {
    if (product.stockQuantity < 1) return;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          alert(`Cannot add more. Only ${product.stockQuantity} items in stock.`);
          return prevCart;
        }
        return prevCart.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, amount) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product._id === productId) {
          const newQty = item.quantity + amount;
          if (newQty < 1) return item;
          if (newQty > item.product.stockQuantity) {
            alert(`Cannot exceed available stock of ${item.product.stockQuantity} items.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product._id !== productId));
  };

  const handleTotalChange = (e) => {
    setFinalTotalInput(e.target.value);
    setIsTotalEdited(true);
  };

  const resetTotalOverride = () => {
    setFinalTotalInput(calculatedTotal.toFixed(2));
    setIsTotalEdited(false);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutError('');

    if (cart.length === 0) {
      setCheckoutError('Your cart is empty.');
      return;
    }

    const finalTotalValue = parseFloat(finalTotalInput);
    if (isNaN(finalTotalValue) || finalTotalValue < 0) {
      setCheckoutError('Please enter a valid final total price (cannot be negative).');
      return;
    }

    setCheckoutLoading(true);

    const payload = {
      items: cart.map(item => ({
        productId: item.product._id,
        quantity: item.quantity
      })),
      finalTotal: finalTotalValue,
      customerName: customerName.trim()
    };

    try {
      console.log('Sending checkout payload:', payload);
      const response = await api.post('/sales', payload);
      setCompletedSale(response.data);
      setShowReceipt(true);

      // Clear Cart & resets
      setCart([]);
      setCustomerName('');
      setIsTotalEdited(false);
      setFinalTotalInput('');

      // Refresh inventory levels in POS
      fetchProducts();
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Error occurred during checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Filter Catalog
  const categories = [...new Set(products.map(p => p.category))].sort();

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw className="animate-spin" /> Loading catalog...</div>
      ) : error ? (
        <div className="card" style={{ color: 'var(--danger)' }}>{error}</div>
      ) : (
        <div className="pos-layout no-print">
          {/* Left Panel: Catalog Selector */}
          <div className="pos-catalog">
            <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-input"
                style={{ width: '160px', cursor: 'pointer' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="pos-grid">
              {filteredProducts.map(prod => {
                const isOutOfStock = prod.stockQuantity < 1;
                const isLowStock = prod.stockQuantity < prod.lowStockThreshold;
                const quantityInCart = cart.find(item => item.product._id === prod._id)?.quantity || 0;

                return (
                  <div
                    key={prod._id}
                    className={`product-item-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                    onClick={() => !isOutOfStock && addToCart(prod)}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                        {prod.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {prod.category}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>
                        ₹{prod.price.toFixed(2)}
                      </span>

                      {isOutOfStock ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`badge ${isLowStock ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                            Qty: {prod.stockQuantity - quantityInCart}
                          </span>
                          {quantityInCart > 0 && (
                            <span style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 'bold'
                            }}>
                              {quantityInCart}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Checkout Cart */}
          <div className="card pos-cart">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <ShoppingCart size={20} color="var(--primary)" /> Shopping Cart
            </h3>

            <div className="form-group" style={{ margin: '12px 0 0 0' }}>
              <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.85rem' }}>Customer Name (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter customer name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={checkoutLoading}
              />
            </div>

            {checkoutError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                marginTop: '12px',
                fontSize: '0.85rem',
                fontWeight: 500
              }}>
                <AlertTriangle size={16} />
                <span>{checkoutError}</span>
              </div>
            )}

            <div className="cart-items">
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <ShoppingCart size={48} strokeWidth={1} />
                  <span>Cart is empty. Click products on the left to add items.</span>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product._id} className="cart-item">
                    <div style={{ flex: 1, marginRight: '12px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ₹{item.product.price.toFixed(2)} each
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="quantity-controls">
                        <button className="qty-btn" onClick={() => updateQuantity(item.product._id, -1)}><Minus size={12} /></button>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', width: '16px', textAlign: 'center' }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.product._id, 1)}><Plus size={12} /></button>
                      </div>

                      <span style={{ fontWeight: 700, fontSize: '0.9rem', width: '60px', textAlign: 'right' }}>
                        ₹{(item.product.price * item.quantity).toFixed(2)}
                      </span>

                      <button
                        className="btn btn-secondary btn-icon"
                        onClick={() => removeFromCart(item.product._id)}
                        style={{ color: 'var(--danger)', padding: '6px', borderRadius: '50%' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total Panel and checkout form */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Calculated Total:</span>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>₹{calculatedTotal.toFixed(2)}</span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Final Total Override (₹) *</label>
                  {isTotalEdited && (
                    <button
                      type="button"
                      onClick={resetTotalOverride}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Reset to Auto
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: isTotalEdited ? 'var(--warning)' : 'var(--text-main)',
                    borderColor: isTotalEdited ? 'var(--warning)' : 'var(--border-color)',
                    textAlign: 'right'
                  }}
                  value={finalTotalInput}
                  onChange={handleTotalChange}
                  disabled={cart.length === 0 || checkoutLoading}
                  placeholder="0.00"
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)' }}
                disabled={cart.length === 0 || checkoutLoading}
                onClick={handleCheckout}
              >
                {checkoutLoading ? 'Processing Checkout...' : 'Record Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS Checkout Success Modal / Receipt view */}
      {showReceipt && completedSale && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ padding: '32px', maxWidth: '440px', fontFamily: 'var(--font-family)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>

            {/* Check success icon */}
            <div className="no-print" style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Check size={24} />
              </div>
            </div>

            {/* Header: Business Name & Subtitle */}
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '0.5px', color: 'var(--text-main)', textTransform: 'uppercase' }}>Invoice</h2>
              <div style={{ borderTop: '2px double var(--border-color)', margin: '14px 0 0 0' }}></div>
            </div>

            {/* Customer & Date Info Section */}
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
                <span style={{ fontWeight: 700 }}>{completedSale.customerName || "-"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
                <span style={{ fontWeight: 500 }}>{new Date(completedSale.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Invoice ID:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 500 }}>{completedSale._id}</span>
              </div>
              <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: '14px' }}></div>
            </div>

            {/* Itemized Table Section */}
            <div style={{ marginBottom: '16px' }}>
              <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                    <th style={{ textAlign: 'left', paddingBottom: '8px' }}>Item</th>
                    <th style={{ textAlign: 'center', paddingBottom: '8px', width: '40px' }}>Qty</th>
                    <th style={{ textAlign: 'right', paddingBottom: '8px', width: '80px' }}>Price</th>
                    <th style={{ textAlign: 'right', paddingBottom: '8px', width: '90px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSale.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td style={{ paddingTop: '8px', paddingBottom: '8px', textAlign: 'left', fontWeight: 500 }}>{item.name}</td>
                      <td style={{ paddingTop: '8px', paddingBottom: '8px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ paddingTop: '8px', paddingBottom: '8px', textAlign: 'right' }}>₹{item.price.toFixed(2)}</td>
                      <td style={{ paddingTop: '8px', paddingBottom: '8px', textAlign: 'right', fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: '10px' }}></div>
            </div>

            {/* Totals Section */}
            <div style={{ fontSize: '0.925rem', lineHeight: '1.7', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Calculated Total:</span>
                <span style={{ textAlign: 'right', fontWeight: 500 }}>₹{completedSale.calculatedTotal.toFixed(2)}</span>
              </div>

              {completedSale.finalTotal !== completedSale.calculatedTotal && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', fontWeight: 600, padding: '2px 0' }}>
                  <span>Price Override Discount:</span>
                  <span style={{ textAlign: 'right' }}>-₹{(completedSale.calculatedTotal - completedSale.finalTotal).toFixed(2)}</span>
                </div>
              )}

              <div style={{ borderTop: '2px double var(--border-color)', margin: '10px 0 8px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.35rem', fontWeight: 800 }}>
                <span style={{ color: 'var(--text-main)', letterSpacing: '0.25px' }}>FINAL TOTAL:</span>
                <span style={{ color: completedSale.finalTotal !== completedSale.calculatedTotal ? 'var(--warning)' : 'var(--primary)', textAlign: 'right' }}>
                  ₹{completedSale.finalTotal.toFixed(2)}
                </span>
              </div>
              <div style={{ borderTop: '2px double var(--border-color)', marginTop: '8px' }}></div>
            </div>

            {/* Actions Footer */}
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Printer size={16} /> Print
              </button>
              <button className="btn btn-primary" onClick={() => setShowReceipt(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
