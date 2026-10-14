import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Copy, 
  Check, 
  FileSpreadsheet,
  PieChart
} from 'lucide-react';
import { formatUSD, formatPercent, formatNumber, formatTimestamp, formatRelativeTime, truncateAddress } from '../services/arcusApi';

export default function TradesTable({ fills = [], fillsStats = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sideFilter, setSideFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  const filteredFills = useMemo(() => {
    return fills.filter(fill => {
      const market = (fill.marketDisplayName || '').toUpperCase();
      const tradeId = (fill.tradeId || '').toLowerCase();
      const orderId = (fill.orderId || '').toLowerCase();
      const term = searchTerm.trim().toUpperCase();

      const matchesSearch = !term || market.includes(term) || tradeId.includes(term.toLowerCase()) || orderId.includes(term.toLowerCase());
      const matchesSide = sideFilter === 'ALL' || (fill.side || '').toUpperCase() === sideFilter;
      const matchesRole = roleFilter === 'ALL' || (fill.role || '').toUpperCase() === roleFilter;

      return matchesSearch && matchesSide && matchesRole;
    });
  }, [fills, searchTerm, sideFilter, roleFilter]);

  // Copy helper
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // CSV Export helper
  const handleExportCSV = () => {
    if (fills.length === 0) return;
    const headers = ['Trade ID', 'Order ID', 'Market', 'Side', 'Role', 'Price', 'Size', 'Notional ($)', 'Fee ($)', 'Closed PnL ($)', 'Position Effect', 'Timestamp'];
    const rows = fills.map(f => [
      f.tradeId,
      f.orderId,
      f.marketDisplayName,
      f.side,
      f.role,
      f.price,
      f.size,
      (parseFloat(f.size || 0) * parseFloat(f.price || 0)).toFixed(2),
      f.fee,
      f.closedPnl,
      f.positionEffect || '',
      new Date(Math.floor(Number(f.createdAt) / 1000)).toISOString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `arcus_trades_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalClosedPnl = useMemo(() => {
    return filteredFills.reduce((acc, f) => acc + parseFloat(f.closedPnl || 0), 0);
  }, [filteredFills]);

  const totalFeesInBatch = useMemo(() => {
    return filteredFills.reduce((acc, f) => acc + parseFloat(f.fee || 0), 0);
  }, [filteredFills]);

  const totalVolInBatch = useMemo(() => {
    return filteredFills.reduce((acc, f) => acc + (parseFloat(f.size || 0) * parseFloat(f.price || 0)), 0);
  }, [filteredFills]);

  return (
    <div className="card table-card">
      <div className="table-header-toolbar">
        <div className="toolbar-left">
          <div className="section-title-wrap">
            <h3 className="section-title">
              <History size={18} className="title-icon" />
              Executions & Trade Fills
            </h3>
            <span className="count-badge">{filteredFills.length} Fills</span>
          </div>

          <div className="trades-summary-mini">
            <div className="mini-stat">
              <span className="lbl">Batch Volume:</span>
              <span className="val font-mono">{formatUSD(totalVolInBatch)}</span>
            </div>
            <div className="mini-stat">
              <span className="lbl">Batch Realized PnL:</span>
              <span className={`val font-mono ${totalClosedPnl >= 0 ? 'text-green' : 'text-rose'}`}>
                {formatUSD(totalClosedPnl)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="lbl">Fees Paid:</span>
              <span className="val font-mono">{formatUSD(totalFeesInBatch)}</span>
            </div>
          </div>
        </div>

        <div className="toolbar-right">
          {/* Side filter */}
          <div className="btn-toggle-group sm">
            {['ALL', 'BUY', 'SELL'].map(s => (
              <button
                key={s}
                className={`toggle-btn sm ${sideFilter === s ? 'active' : ''}`}
                onClick={() => setSideFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Role filter */}
          <div className="btn-toggle-group sm">
            {['ALL', 'MAKER', 'TAKER'].map(r => (
              <button
                key={r}
                className={`toggle-btn sm ${roleFilter === r ? 'active' : ''}`}
                onClick={() => setRoleFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search market, trade ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* CSV Export Button */}
          <button 
            className="action-btn-outline" 
            onClick={handleExportCSV} 
            title="Export Trades to CSV"
            disabled={fills.length === 0}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        {filteredFills.length === 0 ? (
          <div className="empty-table-state">
            <History size={36} className="empty-icon" />
            <h4>No trade fills found</h4>
            <p>No trade executions match the current filters or this address has not traded yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Market</th>
                <th>Side</th>
                <th>Role</th>
                <th>Price</th>
                <th>Size</th>
                <th>Notional</th>
                <th>Fee Paid</th>
                <th>Closed PnL</th>
                <th>Effect</th>
                <th>Trade ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredFills.map((fill, idx) => {
                const isBuy = (fill.side || '').toUpperCase() === 'BUY';
                const isMaker = (fill.role || '').toUpperCase() === 'MAKER';
                const closedPnlNum = parseFloat(fill.closedPnl || 0);
                const feeNum = parseFloat(fill.fee || 0);
                const priceNum = parseFloat(fill.price || 0);
                const sizeNum = parseFloat(fill.size || 0);
                const notional = priceNum * sizeNum;

                return (
                  <tr key={`${fill.tradeId}_${idx}`} className="table-row-hover">
                    {/* Timestamp */}
                    <td>
                      <div className="val-subval-cell">
                        <span className="font-mono">{formatTimestamp(fill.createdAt)}</span>
                        <span className="sub-val">{formatRelativeTime(fill.createdAt)}</span>
                      </div>
                    </td>

                    {/* Market */}
                    <td>
                      <span className="font-mono font-bold">{fill.marketDisplayName}</span>
                    </td>

                    {/* Side */}
                    <td>
                      <span className={`side-badge ${isBuy ? 'long' : 'short'}`}>
                        {isBuy ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {fill.side}
                      </span>
                    </td>

                    {/* Role */}
                    <td>
                      <span className={`role-badge ${isMaker ? 'maker' : 'taker'}`}>
                        {fill.role}
                      </span>
                    </td>

                    {/* Price */}
                    <td>
                      <span className="font-mono">{formatUSD(priceNum, priceNum < 1 ? 4 : 2)}</span>
                    </td>

                    {/* Size */}
                    <td>
                      <span className="font-mono">{formatNumber(sizeNum, 4)}</span>
                    </td>

                    {/* Notional */}
                    <td>
                      <span className="font-mono font-bold">{formatUSD(notional)}</span>
                    </td>

                    {/* Fee Paid */}
                    <td>
                      <span className={`font-mono ${feeNum > 0 ? 'text-amber' : 'text-muted'}`}>
                        {formatUSD(feeNum, 4)}
                      </span>
                    </td>

                    {/* Closed PnL */}
                    <td>
                      <span className={`font-mono font-bold ${closedPnlNum > 0 ? 'text-green' : closedPnlNum < 0 ? 'text-rose' : 'text-muted'}`}>
                        {closedPnlNum !== 0 ? formatUSD(closedPnlNum) : '—'}
                      </span>
                    </td>

                    {/* Position Effect */}
                    <td>
                      <span className="effect-tag font-mono">
                        {fill.positionEffect ? fill.positionEffect.replace(/_/g, ' ') : 'TRADE'}
                      </span>
                    </td>

                    {/* Trade ID with Copy */}
                    <td>
                      <button 
                        className="copy-chip-btn"
                        onClick={() => handleCopy(fill.tradeId, fill.tradeId)}
                        title="Copy Trade ID"
                      >
                        <span className="font-mono">{truncateAddress(fill.tradeId, 4, 3)}</span>
                        {copiedId === fill.tradeId ? <Check size={11} className="text-green" /> : <Copy size={11} />}
                      </button>
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
