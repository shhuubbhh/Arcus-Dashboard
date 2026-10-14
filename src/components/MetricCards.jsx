import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar
} from 'lucide-react';
import { formatUSD, formatPercent } from '../services/arcusApi';

export default function MetricCards({ data, timeframe = '30d', onTimeframeChange }) {
  if (!data) return null;

  const {
    equity = 0,
    netQuoteBalance = 0,
    freeCollateral = 0,
    totalUnrealizedPnl = 0,
    totalClosedPnl = 0,
    totalPositionNotional = 0,
    totalMarginUsed = 0,
    totalBorrowedCapital = 0,
    marginHealthRatio = 100,
    timeframeData = {},
    volumes = {},
    fees = {},
    feeTier = {}
  } = data;

  const activeTf = timeframeData[timeframe] || timeframeData['30d'] || {
    label: '30 Days',
    shortLabel: '30D',
    pnl: totalUnrealizedPnl + totalClosedPnl,
    pnlPct: 0,
    volume: volumes.v30d || 0,
    fees: fees.f30d || 0,
    equityStart: equity,
    equityEnd: equity
  };

  const isPnlUp = (activeTf.pnl ?? 0) >= 0;
  const isUnrealizedUp = totalUnrealizedPnl >= 0;
  const isClosedUp = totalClosedPnl >= 0;

  const currentTier = feeTier?.current || { level: 0, name: 'Base', maker_fee_ppm: 0, taker_fee_ppm: 225 };
  const makerBps = (currentTier.maker_fee_ppm / 100).toFixed(2);
  const takerBps = (currentTier.taker_fee_ppm / 100).toFixed(2);

  const equityDelta = (activeTf.equityEnd || equity) - (activeTf.equityStart || equity);
  const hasEquityHistory = Boolean(activeTf.equityStart && activeTf.equityStart > 0 && Math.abs(equityDelta) > 0.01);

  const timeframesList = [
    { key: '24h', label: '24 Hours', tag: '24H' },
    { key: '7d', label: '7 Days', tag: '7D' },
    { key: '30d', label: '30 Days', tag: '30D' },
    { key: 'all', label: 'All Time', tag: 'ALL' }
  ];

  return (
    <div className="metrics-wrapper">
      {/* Interactive Timeframe Customizer Bar */}
      <div className="timeframe-selector-banner">
        <div className="timeframe-banner-left">
          <Clock size={15} className="text-sand" />
          <span className="timeframe-banner-label">Analytics Timeline:</span>
          <span className="timeframe-active-badge font-mono">{activeTf.label} Active</span>
        </div>

        <div className="timeframe-switcher-pills">
          {timeframesList.map(tf => (
            <button
              key={tf.key}
              type="button"
              className={`tf-pill-btn ${timeframe === tf.key ? 'active' : ''}`}
              onClick={() => onTimeframeChange && onTimeframeChange(tf.key)}
            >
              <span className="tf-pill-tag">{tf.tag}</span>
              <span className="tf-pill-name">{tf.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5 Core KPI Metric Cards */}
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
              <span className="metric-label">{activeTf.shortLabel} Equity Change:</span>
              <span className={`metric-sub-val font-mono ${equityDelta >= 0 ? 'text-green' : 'text-rose'}`}>
                {hasEquityHistory 
                  ? `${equityDelta >= 0 ? '+' : ''}${formatUSD(equityDelta)} (${formatPercent(activeTf.pnlPct)})`
                  : formatUSD(netQuoteBalance)}
              </span>
            </div>
          </div>
          <div className="metric-footer">
            <span className="footer-label">Free Collateral:</span>
            <span className="footer-val font-mono">{formatUSD(freeCollateral)}</span>
          </div>
        </div>

        {/* 2. Windowed Return (PnL) */}
        <div className={`metric-card ${isPnlUp ? 'glow-green' : 'glow-rose'}`}>
          <div className="metric-header">
            <div className={`metric-icon-wrap ${isPnlUp ? 'green' : 'rose'}`}>
              {isPnlUp ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            </div>
            <span className="metric-tag">{activeTf.shortLabel} Return (PnL)</span>
          </div>
          <div className="metric-body">
            <div className={`metric-value ${isPnlUp ? 'text-green' : 'text-rose'}`}>
              {formatUSD(activeTf.pnl)}
            </div>
            <div className="metric-sub-row">
              <span className="metric-label">Unrealized PnL:</span>
              <span className={`metric-sub-val font-mono ${isUnrealizedUp ? 'text-green' : 'text-rose'}`}>
                {formatUSD(totalUnrealizedPnl)}
              </span>
            </div>
          </div>
          <div className="metric-footer">
            <span className="footer-label">Closed Trade PnL:</span>
            <span className={`footer-val font-mono ${isClosedUp ? 'text-green' : 'text-rose'}`}>
              {formatUSD(totalClosedPnl)}
            </span>
          </div>
        </div>

        {/* 3. Windowed Trading Volume */}
        <div className="metric-card glow-indigo">
          <div className="metric-header">
            <div className="metric-icon-wrap indigo">
              <Activity size={18} />
            </div>
            <span className="metric-tag">{activeTf.shortLabel} Trading Volume</span>
          </div>
          <div className="metric-body">
            <div className="metric-value font-mono">{formatUSD(activeTf.volume || 0)}</div>
            <div className="metric-sub-row">
              <span className="metric-label">
                {timeframe === '24h' ? '30D Volume:' : timeframe === '7d' ? '24H Volume:' : '24H Volume:'}
              </span>
              <span className="metric-sub-val font-mono">
                {formatUSD(timeframe === '24h' ? (volumes.v30d || 0) : (timeframeData['24h']?.volume || volumes.v24h || 0))}
              </span>
            </div>
          </div>
          <div className="metric-footer">
            <span className="footer-label">All-Time Lifetime Volume:</span>
            <span className="footer-val font-mono">{formatUSD(volumes.lifetime || 0)}</span>
          </div>
        </div>

        {/* 4. Windowed Trading Fees & Fee Tier */}
        <div className="metric-card glow-amber">
          <div className="metric-header">
            <div className="metric-icon-wrap amber">
              <Award size={18} />
            </div>
            <span className="metric-tag">{activeTf.shortLabel} Fees & Tier</span>
          </div>
          <div className="metric-body">
            <div className="metric-value font-mono">{formatUSD(activeTf.fees || 0)}</div>
            <div className="metric-sub-row">
              <span className="metric-label">All-Time Fees Paid:</span>
              <span className="metric-sub-val font-mono">{formatUSD(fees.lifetime || 0)}</span>
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
            <span className="footer-label">Open Position Notional:</span>
            <span className="footer-val font-mono">{formatUSD(totalPositionNotional)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
