import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { Calendar, Download, Printer, RefreshCw, AlertTriangle, BarChart } from 'lucide-react';

export default function DailyReport() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/reports/daily?date=${date}`);
      setReportData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate daily report.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date) {
      fetchReport();
    }
  }, [date]);

  const exportToExcel = () => {
    if (!reportData) return;

    const { date, totalRevenue, transactionCount, originalTotalRevenue, itemsSold } = reportData;
    const avgTicket = transactionCount > 0 ? (totalRevenue / transactionCount) : 0;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `DAILY SALES & INVENTORY REPORT - ${date}\n\n`;
    csvContent += "REPORT SUMMARY METRICS\n";
    csvContent += `Total Revenue (Final Billed), INR ${totalRevenue.toFixed(2)}\n`;
    csvContent += `Total Transactions, ${transactionCount}\n`;
    csvContent += `Average Transaction Value, INR ${avgTicket.toFixed(2)}\n`;
    csvContent += `Original Calculated Total, INR ${originalTotalRevenue.toFixed(2)}\n`;
    csvContent += `Total Price Adjustments/Discounts, INR ${(originalTotalRevenue - totalRevenue).toFixed(2)}\n\n`;

    csvContent += "PRODUCT SALES BREAKDOWN\n";
    csvContent += "Product ID,Product Name,Unit Price (INR),Total Quantity Sold,Subtotal Revenue (INR)\n";

    if (itemsSold.length === 0) {
      csvContent += ",No items sold today,,,\n";
    } else {
      itemsSold.forEach(item => {
        csvContent += `"${item._id}","${item.name.replace(/"/g, '""')}",${item.price.toFixed(2)},${item.totalQuantity},${item.totalRevenue.toFixed(2)}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daily_report_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div>
      <div className="card no-print" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--text-muted)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Select Report Date:</span>
        </div>
        <input
          type="date"
          className="form-input"
          style={{ width: '180px' }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        
        <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
          <button 
            className="btn btn-secondary" 
            onClick={exportToExcel}
            disabled={loading || !reportData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={16} /> Export Excel (CSV)
          </button>
          <button 
            className="btn btn-primary" 
            onClick={exportToPDF}
            disabled={loading || !reportData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={16} /> Export PDF
          </button>
        </div>
      </div>

      {reportData && (
        <div className="print-header" style={{ borderBottom: '2px solid #000', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>DAILY SALES SUMMARY REPORT</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.9rem' }}>
            <span><strong>Date:</strong> {reportData.date}</span>
            <span><strong>Generated:</strong> {new Date().toLocaleString()}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw className="animate-spin" /> Fetching daily metrics...</div>
      ) : error ? (
        <div className="card" style={{ color: 'var(--danger)' }}>{error}</div>
      ) : reportData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="kpi-grid">
            <div className="card kpi-card">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <BarChart size={24} />
              </div>
              <div className="kpi-details">
                <span className="kpi-label">Total Revenue</span>
                <span className="kpi-value">₹{reportData.totalRevenue.toFixed(2)}</span>
              </div>
            </div>

            <div className="card kpi-card">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                <Calendar size={24} />
              </div>
              <div className="kpi-details">
                <span className="kpi-label">Transactions</span>
                <span className="kpi-value">{reportData.transactionCount}</span>
              </div>
            </div>

            <div className="card kpi-card">
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
                <Printer size={24} />
              </div>
              <div className="kpi-details">
                <span className="kpi-label">Avg. Purchase Size</span>
                <span className="kpi-value">
                  ₹{reportData.transactionCount > 0 ? (reportData.totalRevenue / reportData.transactionCount).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>

          {reportData.originalTotalRevenue !== reportData.totalRevenue && (
            <div className="card no-print" style={{
              backgroundColor: 'var(--warning-light)',
              borderColor: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px'
            }}>
              <AlertTriangle color="var(--warning)" size={24} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--warning)' }}>Manual Total Adjustments Recorded</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  Today's original item value calculated was <strong>₹{reportData.originalTotalRevenue.toFixed(2)}</strong>. 
                  Final billed totals equal <strong>₹{reportData.totalRevenue.toFixed(2)}</strong> (a net difference of <strong>₹{(reportData.originalTotalRevenue - reportData.totalRevenue).toFixed(2)}</strong> in discounts/overrides).
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Product Sales Breakdown
            </h3>
            
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Average Sale Unit Price</th>
                    <th>Total Qty Sold</th>
                    <th style={{ textAlign: 'right' }}>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.itemsSold.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No inventory sold on this day.
                      </td>
                    </tr>
                  ) : (
                    reportData.itemsSold.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>₹{item.price.toFixed(2)}</td>
                        <td>{item.totalQuantity} items</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                          ₹{item.totalRevenue.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
