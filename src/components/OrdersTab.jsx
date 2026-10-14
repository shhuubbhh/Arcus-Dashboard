import React, { useState, useMemo } from 'react';
import { Clock, ArrowUpRight, ArrowDownRight, Search, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { formatUSD, formatNumber, formatTimestamp, formatRelativeTime, truncateAddress } from '../services/arcusApi';

export default function OrdersTab({ orders = [], openOrders = [] }) {
  const [activeSubTab, setActiveSubTab] = useState('open'); // 'open' | 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const combinedOrders = useMemo(() => {
    if (activeSubTab === 'open') {
      return openOrders;
    }
    return orders;
  }, [activeSubTab, openOrders, orders]);

  const filteredOrders = useMemo(() => {
    return combinedOrders.filter(o => {
      const market = (o.marketDisplayName || '').toUpperCase();
      const status = (o.status || 'OPEN').toUpperCase();
      const term = searchTerm.trim().toUpperCase();

      const matchesSearch = !term || market.includes(term) || (o.orderId || '').includes(term.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [combinedOrders, searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    const s = (status || 'OPEN').toUpperCase();
    if (s === 'FILLED') return <span className="status-badge filled"><CheckCircle2 size={12} /> FILLED</span>;
    if (s === 'OPEN') return <span className="status-badge open"><Clock size={12} /> OPEN</span>;
    if (s === 'CANCELED') return <span className="status-badge canceled"><XCircle size={12} /> CANCELED</span>;
    return <span className="status-badge rejected"><AlertCircle size={12} /> {s}</span>;
  };

  return (
    <div className="card table-card">
      <div className="table-header-toolbar">
        <div className="toolbar-left">
          <div className="btn-toggle-group">
            <button
              className={`toggle-btn ${activeSubTab === 'open' ? 'active' : ''}`}
              onClick={() => { setActiveSubTab('open'); setStatusFilter('ALL'); }}
            >
              Open Orders ({openOrders.length})
            </button>
            <button
              className={`toggle-btn ${activeSubTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveSubTab('history'); setStatusFilter('ALL'); }}
            >
              Order History ({orders.length})
            </button>
          </div>

          {activeSubTab === 'history' && (
            <div className="category-filter-tabs">
              {['ALL', 'FILLED', 'CANCELED', 'REJECTED'].map(st => (
                <button
                  key={st}
                  className={`filter-tab-btn ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-right">
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search symbol, order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        {filteredOrders.length === 0 ? (
          <div className="empty-table-state">
            <FileText size={36} className="empty-icon" />
            <h4>No {activeSubTab === 'open' ? 'open' : 'historical'} orders found</h4>
            <p>
              {activeSubTab === 'open' 
                ? 'This wallet currently has no resting limit or trigger orders on the orderbook.' 
                : 'No historical order records found matching the selected filters.'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Market</th>
                <th>Type</th>
                <th>Side</th>
                <th>Price</th>
                <th>Original Size</th>
                <th>Filled Size</th>
                <th>Remaining</th>
                <th>TIF</th>
                <th>Status</th>
                <th>Order ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord, idx) => {
                const isBuy = (ord.side || '').toUpperCase() === 'BUY';
                const originalSize = parseFloat(ord.originalSize || 0);
                const filledSize = parseFloat(ord.filledSize || 0);
                const remainingSize = parseFloat(ord.remainingSize || 0);
                const price = parseFloat(ord.price || 0);

                return (
                  <tr key={`${ord.orderId}_${idx}`} className="table-row-hover">
                    <td>
                      <div className="val-subval-cell">
                        <span className="font-mono">{formatTimestamp(ord.createdAt || ord.updatedAt)}</span>
                        <span className="sub-val">{formatRelativeTime(ord.createdAt || ord.updatedAt)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono font-bold">{ord.marketDisplayName}</span>
                    </td>
                    <td>
                      <span className="order-type-tag">{ord.type || 'LIMIT'}</span>
                    </td>
                    <td>
                      <span className={`side-badge ${isBuy ? 'long' : 'short'}`}>
                        {isBuy ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {ord.side}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono">{formatUSD(price, price < 1 ? 4 : 2)}</span>
                    </td>
                    <td>
                      <span className="font-mono">{formatNumber(originalSize, 4)}</span>
                    </td>
                    <td>
                      <span className="font-mono">{formatNumber(filledSize, 4)}</span>
                    </td>
                    <td>
                      <span className="font-mono">{formatNumber(remainingSize, 4)}</span>
                    </td>
                    <td>
                      <span className="tif-tag">{ord.timeInForce || 'GTT'}</span>
                    </td>
                    <td>
                      {getStatusBadge(ord.status)}
                    </td>
                    <td>
                      <span className="font-mono text-muted">{truncateAddress(ord.orderId, 4, 4)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
