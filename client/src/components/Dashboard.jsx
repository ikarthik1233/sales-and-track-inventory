import React, { useEffect, useState } from 'react';
import api from '../utils/api.js';
import { DollarSign, FileText, AlertTriangle, TrendingUp, RefreshCw, ChevronRight } from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/reports/summary');
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard metrics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw className="animate-spin" /> Loading stats...</div>;
  }

  if (error) {
    return <div className="card" style={{ color: 'var(--danger)', display: 'flex', gap: '10px' }}><AlertTriangle /> {error}</div>;
  }

  const { todaySales, todayTransactions, lowStockCount, lowStockProducts, trend } = data;

  const width = 500;
  const height = 180;
  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxVal = Math.max(...trend.map(t => t.totalSales), 50) * 1.15;

  const points = trend.map((day, index) => {
    const x = padding + (index / (trend.length - 1)) * chartWidth;
    const y = height - padding - (day.totalSales / maxVal) * chartHeight;
    return { x, y, ...day };
  });

  const linePath = points.reduce((path, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, '');

  const areaPoints = points.length > 0 
    ? `${points.map(p => `${p.x},${p.y}`).join(' ')} ${points[points.length - 1].x},${height - padding} ${points[0].x},${height - padding}`
    : '';

  return (
    <div>
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹</span>
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Today's Sales</span>
            <span className="kpi-value">₹{todaySales.toFixed(2)}</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
            <FileText size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Transactions</span>
            <span className="kpi-value">{todayTransactions}</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: lowStockCount > 0 ? 'var(--danger-light)' : 'var(--success-light)', color: lowStockCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Low Stock Alerts</span>
            <span className="kpi-value">{lowStockCount}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-charts-grid">
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--primary)" /> 7-Day Revenue Trend
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hover nodes for details</span>
          </div>

          <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: '200px' }}>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = padding + ratio * chartHeight;
                const value = maxVal * (1 - ratio);
                return (
                  <g key={index}>
                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" />
                    <text x={padding - 5} y={y + 4} textAnchor="end" fontSize="8" fill="var(--text-muted)">
                      ₹{Math.round(value)}
                    </text>
                  </g>
                );
              })}

              {areaPoints && <polygon points={areaPoints} fill="url(#chartGrad)" />}
              {linePath && <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

              {points.map((p, index) => (
                <circle
                  key={index}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint === index ? 6 : 4}
                  fill={hoveredPoint === index ? '#fff' : 'var(--primary)'}
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  style={{ cursor: 'pointer', transition: 'all 0.1s ease' }}
                  onMouseEnter={() => setHoveredPoint(index)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {points.map((p, index) => (
                <text key={index} x={p.x} y={height - padding + 15} textAnchor="middle" fontSize="8" fill="var(--text-muted)" fontWeight="500">
                  {p.label}
                </text>
              ))}
            </svg>

            {hoveredPoint !== null && (
              <div style={{
                position: 'absolute',
                top: `${points[hoveredPoint].y - 45}px`,
                left: `${(points[hoveredPoint].x / width) * 100}%`,
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--bg-sidebar)',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                boxShadow: 'var(--shadow-md)',
                pointerEvents: 'none',
                zIndex: 10,
                whiteSpace: 'nowrap'
              }}>
                <div>{points[hoveredPoint].date}</div>
                <div style={{ color: 'var(--primary)', marginTop: '2px' }}>
                  Sales: ₹{points[hoveredPoint].totalSales.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: lowStockCount > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
            <AlertTriangle size={20} /> Low Stock Warnings
          </h3>

          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '220px' }}>
            {lowStockProducts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '0.9rem' }}>
                All products have sufficient stock levels! 👍
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lowStockProducts.map(prod => (
                  <div key={prod._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    backgroundColor: 'var(--danger-light)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{prod.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Category: {prod.category} | Min Threshold: {prod.lowStockThreshold}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="badge badge-danger" style={{ fontSize: '0.8rem', padding: '6px 10px' }}>
                        Qty: {prod.stockQuantity}
                      </span>
                      <button 
                        onClick={() => setActiveTab('products')} 
                        className="btn btn-secondary btn-icon"
                        title="Update Stock"
                        style={{ padding: '6px', borderRadius: '50%' }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
