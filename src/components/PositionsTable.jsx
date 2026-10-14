import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Layers, 
  DollarSign, 
  Percent, 
  Scale, 
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import { formatUSD, formatPercent, formatNumber } from '../services/arcusApi';

export default function PositionsTable({ positions = [], marketsMap = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('notional'); // 'notional' | 'pnl' | 'roi' | 'market'

  const filteredPositions = useMemo(() => {
    return positions.filter(pos => {
      const marketName = (pos.marketDisplayName || '').toUpperCase();
      const marketInfo = marketsMap[pos.marketDisplayName] || marketsMap[pos.marketId] || {};
      const category = (marketInfo.category || 'CRYPTO').toUpperCase();

      const matchesSearch = marketName.includes(searchTerm.toUpperCase());
      const matchesCategory = categoryFilter === 'ALL' || category === categoryFilter;

      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      const notionalA = Math.abs(parseFloat(a.positionValueNotional || (parseFloat(a.size || 0) * parseFloat(a.markPx || 0))));
      const notionalB = Math.abs(parseFloat(b.positionValueNotional || (parseFloat(b.size || 0) * parseFloat(b.markPx || 0))));
      const pnlA = parseFloat(a.unrealizedPnl || 0);
      const pnlB = parseFloat(b.unrealizedPnl || 0);

      const marginA = parseFloat(a.marginUsed || 1);
      const marginB = parseFloat(b.marginUsed || 1);
      const roiA = marginA > 0 ? (pnlA / marginA) * 100 : 0;
      const roiB = marginB > 0 ? (pnlB / marginB) * 100 : 0;

      if (sortBy === 'notional') return notionalB - notionalA;
      if (sortBy === 'pnl') return pnlB - pnlA;
      if (sortBy === 'roi') return roiB - roiA;
      if (sortBy === 'market') return (a.marketDisplayName || '').localeCompare(b.marketDisplayName || '');
      return 0;
    });
  }, [positions, marketsMap, searchTerm, categoryFilter, sortBy]);

  return (
    <div className="card table-card">
      <div className="table-header-toolbar">
        <div className="toolbar-left">
          <div className="section-title-wrap">
            <h3 className="section-title">
              <Layers size={18} className="title-icon" />
              Open Perpetual Positions
            </h3>
            <span className="count-badge">{positions.length} Active</span>
          </div>

          {/* Category tabs */}
          <div className="category-filter-tabs">
            {['ALL', 'CRYPTO', 'EQUITIES', 'COMMODITIES', 'INDICES'].map(cat => (
              <button
                key={cat}
                className={`filter-tab-btn ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-right">
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search symbol (e.g. BTC, NVDA)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="select-wrap">
            <SlidersHorizontal size={13} className="select-icon" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="table-sort-select"
            >
              <option value="notional">Sort: Size / Notional</option>
              <option value="pnl">Sort: Unrealized PnL</option>
              <option value="roi">Sort: ROI %</option>
              <option value="market">Sort: Market Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="table-responsive">
        {filteredPositions.length === 0 ? (
          <div className="empty-table-state">
            <Layers size={36} className="empty-icon" />
            <h4>No active positions found</h4>
            <p>This wallet does not currently hold any open perpetual positions matching your criteria.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Side</th>
                <th>Size / Notional</th>
                <th>Entry Price</th>
                <th>Mark Price</th>
                <th>Leverage / Margin</th>
                <th>Unrealized PnL (ROI)</th>
                <th>Cumulative Funding</th>
              </tr>
            </thead>
            <tbody>
              {filteredPositions.map((pos, idx) => {
                const isLong = (pos.side || '').toUpperCase() === 'LONG';
                const marketInfo = marketsMap[pos.marketDisplayName] || marketsMap[pos.marketId] || {};
                const markPx = parseFloat(pos.markPx || marketInfo.markPrice || pos.averageEntryPrice || 0);
                const entryPx = parseFloat(pos.averageEntryPrice || 0);
                const sizeNum = Math.abs(parseFloat(pos.size || 0));
                const notional = Math.abs(parseFloat(pos.positionValueNotional || (sizeNum * markPx)));
                const uPnl = parseFloat(pos.unrealizedPnl || 0);
                const marginUsed = parseFloat(pos.marginUsed || 0);
                const roi = marginUsed > 0 ? (uPnl / marginUsed) * 100 : 0;
                const isPnlUp = uPnl >= 0;
                const cumFunding = parseFloat(pos.cumulativeFunding?.sinceOpen || pos.cumulativeFunding?.allTime || 0);

                return (
                  <tr key={`${pos.marketDisplayName}_${idx}`} className="table-row-hover">
                    {/* Market & Category */}
                    <td>
                      <div className="market-cell">
                        <span className="market-symbol font-mono">{pos.marketDisplayName}</span>
                        <span className="market-cat-tag">{marketInfo.category || 'PERP'}</span>
                      </div>
                    </td>

                    {/* Side */}
                    <td>
                      <span className={`side-badge ${isLong ? 'long' : 'short'}`}>
                        {isLong ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {isLong ? 'LONG' : 'SHORT'}
                      </span>
                    </td>

                    {/* Size & Notional */}
                    <td>
                      <div className="val-subval-cell">
                        <span className="primary-val font-mono">{formatNumber(sizeNum, 4)}</span>
                        <span className="sub-val font-mono">{formatUSD(notional)}</span>
                      </div>
                    </td>

                    {/* Entry Price */}
                    <td>
                      <span className="font-mono">{formatUSD(entryPx, entryPx < 1 ? 4 : 2)}</span>
                    </td>

                    {/* Mark Price */}
                    <td>
                      <span className="font-mono">{formatUSD(markPx, markPx < 1 ? 4 : 2)}</span>
                    </td>

                    {/* Leverage & Margin */}
                    <td>
                      <div className="val-subval-cell">
                        <span className="leverage-tag font-mono">{pos.leverage || '40'}x {pos.marginMode || 'CROSS'}</span>
                        <span className="sub-val font-mono">Used: {formatUSD(marginUsed)}</span>
                      </div>
                    </td>

                    {/* Unrealized PnL (ROI) */}
                    <td>
                      <div className="val-subval-cell">
                        <span className={`primary-val font-mono ${isPnlUp ? 'text-green' : 'text-rose'}`}>
                          {formatUSD(uPnl)}
                        </span>
                        <span className={`sub-val font-mono ${isPnlUp ? 'text-green' : 'text-rose'}`}>
                          {formatPercent(roi)} ROI
                        </span>
                      </div>
                    </td>

                    {/* Cumulative Funding */}
                    <td>
                      <span className={`font-mono ${cumFunding > 0 ? 'text-green' : cumFunding < 0 ? 'text-rose' : ''}`}>
                        {formatUSD(cumFunding, 4)}
                      </span>
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
