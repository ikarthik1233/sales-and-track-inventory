import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { Calendar, Filter, Eye, RefreshCw, X, Printer, RotateCcw, User } from 'lucide-react';

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productIdFilter, setProductIdFilter] = useState('');

  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchSalesAndProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (productIdFilter) params.productId = productIdFilter;

      const [salesRes, productsRes] = await Promise.all([
        api.get('/sales', { params }),
        api.get('/products')
      ]);

      setSales(salesRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      setError('Failed to fetch sales history logs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesAndProducts();
  }, [startDate, endDate, productIdFilter]);

  const handleRefund = async (saleId) => {
    if (window.confirm('Are you sure you want to refund this sale? This will DELETE the transaction and RESTORE all item stock quantities.')) {
      try {
        await api.post(`/sales/${saleId}/refund`);
        setShowModal(false);
        fetchSalesAndProducts();
      } catch (err) {
        alert(err.response?.data?.message || 'Error executing refund.');
      }
    }
  };

  const openSaleDetails = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  const formatReceiptDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const optionsDate = { day: 'numeric', month: 'short', year: 'numeric' };
    const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
    
    const dStr = date.toLocaleDateString('en-US', optionsDate);
    const tStr = date.toLocaleTimeString('en-US', optionsTime);
    
    const parts = dStr.replace(',', '').split(' ');
    if (parts.length === 3) {
      return `${parts[1]} ${parts[0]} ${parts[2]}, ${tStr}`;
    }
    return `${dStr}, ${tStr}`;
  };

  return (
    <div>
      <div className="card" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Date Range:</span>
        </div>

        <input
          type="date"
          className="form-input"
          style={{ width: '160px' }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <span style={{ color: 'var(--text-muted)' }}>to</span>
        <input
          type="date"
          className="form-input"
          style={{ width: '160px' }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            className="form-input"
            style={{ width: '220px', cursor: 'pointer' }}
            value={productIdFilter}
            onChange={(e) => setProductIdFilter(e.target.value)}
          >
            <option value="">All Products</option>
            {products.map(prod => (
              <option key={prod._id} value={prod._id}>{prod.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw className="animate-spin" /> Loading transactions...</div>
      ) : error ? (
        <div className="card" style={{ color: 'var(--danger)' }}>{error}</div>
      ) : (
        <div className="card" style={{ padding: '0px' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Products Sold</th>
                  <th>Calculated Total</th>
                  <th>Final Total</th>
                  <th style={{ textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                      No sales history records found matching filters.
                    </td>
                  </tr>
                ) : (
                  sales.map(sale => {
                    const hasOverride = sale.finalTotal !== sale.calculatedTotal;
                    return (
                      <tr key={sale._id}>
                        <td style={{ fontWeight: 500 }}>{formatReceiptDate(sale.date)}</td>
                        <td style={{ fontWeight: 600 }}>{sale.customerName || 'Walk-in Customer'}</td>
                        <td>
                          <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sale.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                          </div>
                        </td>
                        <td>₹{sale.calculatedTotal.toFixed(2)}</td>
                        <td>
                          <span style={{ 
                            fontWeight: 700, 
                            color: hasOverride ? 'var(--warning)' : 'inherit',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            ₹{sale.finalTotal.toFixed(2)}
                            {hasOverride && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(Adjusted)</span>}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => openSaleDetails(sale)}
                            title="View Receipt Details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && selectedSale && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ padding: '28px', maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Sale Receipt Details</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {selectedSale._id}</span>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customer Name:</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <User size={16} color="var(--primary)" />
                {selectedSale.customerName || 'Walk-in Customer'}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Transaction Date:</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {formatReceiptDate(selectedSale.date)}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Products Purchased:</span>
              {selectedSale.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '6px' }}>
                      (x{item.quantity} at ₹{item.price.toFixed(2)}/ea)
                    </span>
                  </div>
                  <span style={{ fontWeight: 700 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Original Calculated Total:</span>
                <span>₹{selectedSale.calculatedTotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <span>Final Billed Total:</span>
                <span style={{ color: selectedSale.finalTotal !== selectedSale.calculatedTotal ? 'var(--warning)' : 'inherit' }}>
                  ₹{selectedSale.finalTotal.toFixed(2)}
                </span>
              </div>

              {selectedSale.finalTotal !== selectedSale.calculatedTotal && (
                <div style={{
                  backgroundColor: 'var(--warning-light)',
                  color: 'var(--warning)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '4px'
                }}>
                  <span>Adjustment Discount:</span>
                  <span>-₹{(selectedSale.calculatedTotal - selectedSale.finalTotal).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-danger" 
                onClick={() => handleRefund(selectedSale._id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: 'auto' }}
              >
                <RotateCcw size={16} /> Refund Sale
              </button>
              
              <button 
                className="btn btn-secondary" 
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={16} /> Print
              </button>

              <button className="btn btn-primary" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
