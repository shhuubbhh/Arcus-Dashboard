import React from 'react';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { formatUSD, formatPercent } from '../services/arcusApi';

export default function MarketTicker({ markets = [] }) {
  if (!markets || markets.length === 0) return null;

  // Filter for top prominent markets
  const topSymbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'NVDA-USD', 'TSLA-USD', 'SPY-USD', 'QQQ-USD', 'GLD-USD'];
  const featured = markets
    .filter(m => topSymbols.includes(m.marketDisplayName))
    .sort((a, b) => topSymbols.indexOf(a.marketDisplayName) - topSymbols.indexOf(b.marketDisplayName));

  const displayList = featured.length > 0 ? featured : markets.slice(0, 8);

  return (
    <div className="market-ticker-bar">
      <div className="ticker-label">
        <Activity size={13} className="pulse-icon text-cyan" />
        <span>ARCUS LIVE MARKETS</span>
      </div>
      <div className="ticker-track">
        {displayList.map((m) => {
          const markPrice = parseFloat(m.markPrice || m.oraclePrice || 0);
          const change24h = parseFloat(m.priceChange24h || 0) * 100;
          const isUp = change24h >= 0;
          const fundingRate = parseFloat(m.fundingRate || 0) * 100;

          return (
            <div key={m.marketDisplayName} className="ticker-item">
              <span className="ticker-sym font-mono">{m.marketDisplayName}</span>
              <span className="ticker-px font-mono">{formatUSD(markPrice, markPrice < 1 ? 4 : 2)}</span>
              <span className={`ticker-change font-mono ${isUp ? 'text-green' : 'text-rose'}`}>
                {isUp ? '+' : ''}{change24h.toFixed(2)}%
              </span>
              <span className="ticker-funding font-mono">
                <Zap size={10} className="inline-icon text-amber" />
                {(fundingRate).toFixed(4)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
