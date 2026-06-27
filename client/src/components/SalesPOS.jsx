import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { Search, ShoppingCart, Trash2, Plus, Minus, Check, RefreshCw, Printer, AlertTriangle, User } from 'lucide-react';

export default function SalesPOS() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Customer Name state (optional)
  const [customerName, setCustomerName] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  const [finalTotalInput, setFinalTotalInput] = useState('');
  const [isTotalEdited, setIsTotalEdited] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

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
      customerName: customerName.trim(),
      items: cart.map(item => ({
        productId: item.product._id,
        quantity: item.quantity
      })),
      finalTotal: finalTotalValue
    };

    try {
      const response = await api.post('/sales', payload);
      setCompletedSale(response.data);
      setShowReceipt(true);
      
      setCart([]);
      setCustomerName('');
      setIsTotalEdited(false);
      setFinalTotalInput('');
      
      fetchProducts();
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Error occurred during checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Helper date formatter: e.g. "26 Jun 2026, 1:25 PM"
  const formatReceiptDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const optionsDate = { day: 'numeric', month: 'short', year: 'numeric' };
    const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
    
    // Formatting cleanly using standard JavaScript Date formatter
    const dStr = date.toLocaleDateString('en-US', optionsDate); // "Jun 26, 2026"
    const tStr = date.toLocaleTimeString('en-US', optionsTime); // "1:25 PM"
    
    // Convert "Jun 26, 2026" to "26 Jun 2026"
    const parts = dStr.replace(',', '').split(' ');
    if (parts.length === 3) {
      return `${parts[1]} ${parts[0]} ${parts[2]}, ${tStr}`;
    }
    return `${dStr}, ${tStr}`;
  };

  const categories = [...new Set(products.map(p => p.category))].sort();
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Customer Name input at top of POS */}
      <div className="card" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <User size={18} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Customer (Optional):</span>
        </div>
        <input
          type="text"
          className="form-input"
          style={{ flex: 1, minWidth: '220px', maxWidth: '400px' }}
          placeholder="Enter customer name (defaults to Walk-in Customer)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw className="animate-spin" /> Loading catalog...</div>
      ) : error ? (
        <div className="card" style={{ color: 'var(--danger)' }}>{error}</div>
      ) : (
        <div className="pos-layout">
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

          <div className="card pos-cart">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <ShoppingCart size={20} color="var(--primary)" /> Shopping Cart
            </h3>

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
                  <span>Cart is empty. Select products.</span>
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

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifycontent: 'space-between', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {/* POS Checkout Success Modal / Receipt View */}
      {showReceipt && completedSale && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ padding: '28px', maxWidth: '420px', border: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '16px' }}>
              <div className="no-print" style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <Check size={28} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>BUSINESS INVOICE</h2>
              
              {/* Customer Name Display */}
              <div style={{ marginTop: '8px', padding: '6px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 600 }}>
                Customer: {completedSale.customerName || 'Walk-in Customer'}
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                <strong>Invoice ID:</strong> {completedSale._id}<br />
                <strong>Date & Time:</strong> {formatReceiptDate(completedSale.date)}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '16px' }}>
              {completedSale.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>{item.name} (x{item.quantity})</span>
                  <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Calculated Total:</span>
                <span>₹{completedSale.calculatedTotal.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span>Final Billed:</span>
                <span style={{ color: completedSale.finalTotal !== completedSale.calculatedTotal ? 'var(--warning)' : 'inherit' }}>
                  ₹{completedSale.finalTotal.toFixed(2)}
                </span>
              </div>

              {completedSale.finalTotal !== completedSale.calculatedTotal && (
                <div style={{
                  textAlign: 'right',
                  fontSize: '0.75rem',
                  color: 'var(--warning)',
                  fontWeight: 600
                }}>
                  Adjusted Discount: -₹{(completedSale.calculatedTotal - completedSale.finalTotal).toFixed(2)}
                </div>
              )}
            </div>

            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Printer size={16} /> Print Receipt
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
