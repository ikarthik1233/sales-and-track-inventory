import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { Search, Calendar, Filter, Eye, Trash2, RefreshCw, X, AlertTriangle, Printer, RotateCcw } from 'lucide-react';

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]); // for dropdown filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productIdFilter, setProductIdFilter] = useState('');

  // Receipt Modal State
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchSalesAndProducts = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query string
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

  return (
    <div>
      <div className="no-print">
        {/* Query Filters */}
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

      {/* Main Table */}
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
                  <th>Transaction ID</th>
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
                        <td style={{ fontWeight: 500 }}>{new Date(sale.date).toLocaleString()}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sale._id}</td>
                        <td>
                          <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
      </div>

      {/* Sale Detail Modal Overlay */}
      {showModal && selectedSale && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ padding: '32px', maxWidth: '440px', fontFamily: 'var(--font-family)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            
            {/* Header: Close Button and Title */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Receipt Preview</span>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={20} />
              </button>
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
                <span style={{ fontWeight: 700 }}>{selectedSale.customerName || "-"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
                <span style={{ fontWeight: 500 }}>{new Date(selectedSale.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Invoice ID:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 500 }}>{selectedSale._id}</span>
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
                  {selectedSale.items.map((item, idx) => (
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
                <span style={{ textAlign: 'right', fontWeight: 500 }}>₹{selectedSale.calculatedTotal.toFixed(2)}</span>
              </div>

              {selectedSale.finalTotal !== selectedSale.calculatedTotal && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', fontWeight: 600, padding: '2px 0' }}>
                  <span>Price Override Discount:</span>
                  <span style={{ textAlign: 'right' }}>-₹{(selectedSale.calculatedTotal - selectedSale.finalTotal).toFixed(2)}</span>
                </div>
              )}

              <div style={{ borderTop: '2px double var(--border-color)', margin: '10px 0 8px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.35rem', fontWeight: 800 }}>
                <span style={{ color: 'var(--text-main)', letterSpacing: '0.25px' }}>FINAL TOTAL:</span>
                <span style={{ color: selectedSale.finalTotal !== selectedSale.calculatedTotal ? 'var(--warning)' : 'var(--primary)', textAlign: 'right' }}>
                  ₹{selectedSale.finalTotal.toFixed(2)}
                </span>
              </div>
              <div style={{ borderTop: '2px double var(--border-color)', marginTop: '8px' }}></div>
            </div>

            {/* Actions Footer */}
            <div className="no-print" style={{ display: 'flex', gap: '12px' }}>
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
