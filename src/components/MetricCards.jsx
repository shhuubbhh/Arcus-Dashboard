import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  PieChart, 
  Layers, 
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatUSD, formatPercent } from '../services/arcusApi';

export default function MetricCards({ data }) {
  if (!data) return null;

  const {
    equity = 0,
    netQuoteBalance = 0,
    freeCollateral = 0,
    totalUnrealizedPnl = 0,
    totalClosedPnl = 0,
    totalPositionNotional = 0,
    totalMarginUsed = 0,
    marginHealthRatio = 100,
    volumes = {},
    fees = {},
    feeTier = {}
  } = data;

  const totalPnL = totalUnrealizedPnl + totalClosedPnl;
  const isTotalPnlUp = totalPnL >= 0;
  const isUnrealizedUp = totalUnrealizedPnl >= 0;
  const isClosedUp = totalClosedPnl >= 0;

  const currentTier = feeTier?.current || { level: 0, name: 'Base', maker_fee_ppm: 0, taker_fee_ppm: 225 };
  const makerBps = (currentTier.maker_fee_ppm / 100).toFixed(2);
  const takerBps = (currentTier.taker_fee_ppm / 100).toFixed(2);

  return (
    <div className="metrics-grid">
      {/* 1. Total Account Equity */}
      <div className="metric-card glow-cyan">
        <div className="metric-header">
          <div className="metric-icon-wrap cyan">
            <DollarSign size={18} />
          </div>
          <span className="metric-tag">Portfolio Value</span>
        </div>
        <div className="metric-body">
          <div className="metric-value">{formatUSD(equity)}</div>
          <div className="metric-sub-row">
            <span className="metric-label">Collateral (USDG):</span>
            <span className="metric-sub-val font-mono">{formatUSD(netQuoteBalance)}</span>
          </div>
        </div>
        <div className="metric-footer">
          <span className="footer-label">Free Collateral:</span>
          <span className="footer-val font-mono">{formatUSD(freeCollateral)}</span>
        </div>
      </div>

      {/* 2. Total Cumulative PnL */}
      <div className={`metric-card ${isTotalPnlUp ? 'glow-green' : 'glow-rose'}`}>
        <div className="metric-header">
          <div className={`metric-icon-wrap ${isTotalPnlUp ? 'green' : 'rose'}`}>
            {isTotalPnlUp ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
          </div>
          <span className="metric-tag">Total Return (PnL)</span>
        </div>
        <div className="metric-body">
          <div className={`metric-value ${isTotalPnlUp ? 'text-green' : 'text-rose'}`}>
            {formatUSD(totalPnL)}
          </div>
          <div className="metric-sub-row">
            <span className="metric-label">Unrealized:</span>
            <span className={`metric-sub-val font-mono ${isUnrealizedUp ? 'text-green' : 'text-rose'}`}>
              {formatUSD(totalUnrealizedPnl)}
            </span>
          </div>
        </div>
        <div className="metric-footer">
          <span className="footer-label">Realized (Closed):</span>
          <span className={`footer-val font-mono ${isClosedUp ? 'text-green' : 'text-rose'}`}>
            {formatUSD(totalClosedPnl)}
          </span>
        </div>
      </div>

      {/* 3. Trading Volume (Windowed) */}
      <div className="metric-card glow-indigo">
        <div className="metric-header">
          <div className="metric-icon-wrap indigo">
            <Activity size={18} />
          </div>
          <span className="metric-tag">30D Trading Volume</span>
        </div>
        <div className="metric-body">
          <div className="metric-value font-mono">{formatUSD(volumes.v30d || volumes.lifetime || 0)}</div>
          <div className="metric-sub-row">
            <span className="metric-label">24H Volume:</span>
            <span className="metric-sub-val font-mono">{formatUSD(volumes.v24h || 0)}</span>
          </div>
        </div>
        <div className="metric-footer">
          <span className="footer-label">All-Time Volume:</span>
          <span className="footer-val font-mono">{formatUSD(volumes.lifetime || 0)}</span>
        </div>
      </div>

      {/* 4. Total Trading Fees & Fee Tier */}
      <div className="metric-card glow-amber">
        <div className="metric-header">
          <div className="metric-icon-wrap amber">
            <Award size={18} />
          </div>
          <span className="metric-tag">Fees & Tier</span>
        </div>
        <div className="metric-body">
          <div className="metric-value font-mono">{formatUSD(fees.lifetime || 0)}</div>
          <div className="metric-sub-row">
            <span className="metric-label">30D Fees Paid:</span>
            <span className="metric-sub-val font-mono">{formatUSD(fees.f30d || 0)}</span>
          </div>
        </div>
        <div className="metric-footer">
          <div className="tier-badge-pill">
            <Zap size={11} className="tier-zap" />
            <span className="tier-title">{currentTier.name} (Lv {currentTier.level})</span>
            <span className="tier-rates">Maker {makerBps} bps / Taker {takerBps} bps</span>
          </div>
        </div>
      </div>

      {/* 5. Margin Utilization & Health Factor */}
      <div className="metric-card glow-purple">
        <div className="metric-header">
          <div className="metric-icon-wrap purple">
            <ShieldCheck size={18} />
          </div>
          <span className="metric-tag">Margin Health</span>
        </div>
        <div className="metric-body">
          <div className="metric-value font-mono">
            {formatPercent(marginHealthRatio)}
          </div>
          {/* Health Bar */}
          <div className="health-bar-track">
            <div 
              className={`health-bar-fill ${marginHealthRatio > 50 ? 'safe' : marginHealthRatio > 25 ? 'warning' : 'danger'}`}
              style={{ width: `${Math.min(100, Math.max(5, marginHealthRatio))}%` }}
            />
          </div>
          <div className="metric-sub-row" style={{ marginTop: '8px' }}>
            <span className="metric-label">Margin In Use:</span>
            <span className="metric-sub-val font-mono">{formatUSD(totalMarginUsed)}</span>
          </div>
        </div>
        <div className="metric-footer">
          <span className="footer-label">Open Notional:</span>
          <span className="footer-val font-mono">{formatUSD(totalPositionNotional)}</span>
        </div>
      </div>
    </div>
  );
}
