import React, { useState, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Activity, BarChart2 } from 'lucide-react';
import { formatUSD, formatPercent, formatTimestamp } from '../services/arcusApi';

export default function PortfolioChart({ portfolio, currentEquity, totalUnrealizedPnl }) {
  const [metricMode, setMetricMode] = useState('equity'); // 'equity' | 'pnl'
  const [timeframe, setTimeframe] = useState('month'); // 'day' | 'week' | 'month' | 'all'
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  // Map timeframe to Arcus portfolio tuple key
  const targetKey = useMemo(() => {
    switch (timeframe) {
      case 'day': return 'totalDay';
      case 'week': return 'totalWeek';
      case 'month': return 'totalMonth';
      case 'all': return 'totalAll';
      default: return 'totalMonth';
    }
  }, [timeframe]);

  // Extract raw series from portfolio.data
  const seriesData = useMemo(() => {
    if (!portfolio || !Array.isArray(portfolio.data)) return [];
    
    const entry = portfolio.data.find(item => item && item[0] === targetKey);
    if (!entry || !entry[1]) {
      // Fallback: search perp variant
      const perpKey = targetKey.replace('total', 'perp');
      const perpEntry = portfolio.data.find(item => item && item[0] === perpKey);
      if (perpEntry && perpEntry[1]) {
        return metricMode === 'equity' 
          ? (perpEntry[1].accountEquityHistory || [])
          : (perpEntry[1].pnlHistory || []);
      }
      return [];
    }

    const payload = entry[1];
    const points = metricMode === 'equity' 
      ? (payload.accountEquityHistory || [])
      : (payload.pnlHistory || []);

    return points.map(([ts, val]) => ({
      timestamp: Number(ts),
      value: parseFloat(val || 0)
    })).filter(p => !isNaN(p.value));
  }, [portfolio, targetKey, metricMode]);

  // Generate synthetic curve if account is live but history rollup hasn't processed yet
  const chartPoints = useMemo(() => {
    if (seriesData.length > 0) return seriesData;

    // Fallback single or 2-point reference
    const now = Date.now() * 1000;
    const baseVal = metricMode === 'equity' ? (currentEquity || 0) : (totalUnrealizedPnl || 0);
    return [
      { timestamp: now - 86400 * 1000000, value: baseVal },
      { timestamp: now, value: baseVal }
    ];
  }, [seriesData, metricMode, currentEquity, totalUnrealizedPnl]);

  // Compute domain bounds
  const stats = useMemo(() => {
    if (!chartPoints || chartPoints.length === 0) {
      return { min: 0, max: 0, first: 0, last: 0, change: 0, changePct: 0, isPositive: true };
    }
    const values = chartPoints.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const first = chartPoints[0]?.value ?? 0;
    const last = chartPoints[chartPoints.length - 1]?.value ?? 0;
    const change = last - first;
    const changePct = first !== 0 ? (change / Math.abs(first)) * 100 : (change > 0 ? 100 : 0);
    const isPositive = change >= 0;

    return { min, max, first, last, change, changePct, isPositive };
  }, [chartPoints]);

  // Chart dimensions & SVG path calculation
  const chartWidth = 900;
  const chartHeight = 280;
  const paddingX = 20;
  const paddingY = 25;

  const { pathD, areaD, coordinates } = useMemo(() => {
    if (chartPoints.length < 2) {
      return { pathD: '', areaD: '', coordinates: [] };
    }

    const rangeY = (stats.max - stats.min) || 1;
    const innerWidth = chartWidth - paddingX * 2;
    const innerHeight = chartHeight - paddingY * 2;

    const coords = chartPoints.map((p, idx) => {
      const x = paddingX + (idx / (chartPoints.length - 1)) * innerWidth;
      const normalizedY = (p.value - stats.min) / rangeY;
      const y = chartHeight - paddingY - (normalizedY * innerHeight);
      return { x, y, point: p };
    });

    // Create smooth bezier path
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const mx = (curr.x + next.x) / 2;
      d += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
    }

    const area = `${d} L ${coords[coords.length - 1].x} ${chartHeight} L ${coords[0].x} ${chartHeight} Z`;

    return { pathD: d, areaD: area, coordinates: coords };
  }, [chartPoints, stats]);

  // Active hover point
  const activeHover = hoverIndex !== null && coordinates[hoverIndex] ? coordinates[hoverIndex] : null;

  const handleMouseMove = (e) => {
    if (!containerRef.current || coordinates.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = (clientX / rect.width) * chartWidth;

    // Find nearest point index
    let closestIdx = 0;
    let minDistance = Infinity;
    coordinates.forEach((coord, idx) => {
      const dist = Math.abs(coord.x - relativeX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const isUp = metricMode === 'pnl' ? stats.last >= 0 : stats.isPositive;
  const strokeColor = isUp ? '#a2ee3a' : '#f43f5e';
  const gradientId = `chartGrad_${metricMode}_${timeframe}`;

  return (
    <div className="card portfolio-chart-card">
      {/* Header controls */}
      <div className="chart-header">
        <div className="chart-title-area">
          <div className="chart-title-row">
            <span className="metric-badge">
              <Activity size={14} className="pulse-icon" />
              {metricMode === 'equity' ? 'Total Account Equity' : 'Realized & Cumulative PnL'}
            </span>
            <span className="resolution-badge">
              {timeframe === 'day' || timeframe === 'week' ? '1h Candlestick Bins' : '1d Daily Rollup'}
            </span>
          </div>

          <div className="chart-stats-headline">
            <div className="chart-main-val">
              {activeHover ? formatUSD(activeHover.point.value) : formatUSD(stats.last)}
            </div>
            <div className={`chart-diff-badge ${isUp ? 'positive' : 'negative'}`}>
              {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{formatUSD(activeHover ? (activeHover.point.value - stats.first) : stats.change)}</span>
              <span className="pct">({formatPercent(activeHover && stats.first !== 0 ? ((activeHover.point.value - stats.first) / Math.abs(stats.first)) * 100 : stats.changePct)})</span>
            </div>
            {activeHover && (
              <span className="hover-time-tag">
                {formatTimestamp(activeHover.point.timestamp)}
              </span>
            )}
          </div>
        </div>

        {/* Action Toggles */}
        <div className="chart-controls">
          <div className="btn-toggle-group">
            <button
              className={`toggle-btn ${metricMode === 'equity' ? 'active' : ''}`}
              onClick={() => setMetricMode('equity')}
            >
              <DollarSign size={13} />
              Equity Curve
            </button>
            <button
              className={`toggle-btn ${metricMode === 'pnl' ? 'active' : ''}`}
              onClick={() => setMetricMode('pnl')}
            >
              <TrendingUp size={13} />
              PnL Curve
            </button>
          </div>

          <div className="btn-toggle-group timeframes">
            {[
              { id: 'day', label: '24H' },
              { id: 'week', label: '7D' },
              { id: 'month', label: '30D' },
              { id: 'all', label: 'ALL' }
            ].map(tf => (
              <button
                key={tf.id}
                className={`toggle-btn sm ${timeframe === tf.id ? 'active' : ''}`}
                onClick={() => setTimeframe(tf.id)}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div 
        className="chart-viewport" 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="chart-svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
              <stop offset="50%" stopColor={strokeColor} stopOpacity="0.10" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Gridlines */}
          <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

          {/* Area under curve */}
          {areaD && (
            <path d={areaD} fill={`url(#${gradientId})`} />
          )}

          {/* Glowing Stroke line */}
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke={strokeColor} 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              filter="url(#glow)"
            />
          )}

          {/* Hover Crosshair & Dot */}
          {activeHover && (
            <g className="hover-group">
              <line 
                x1={activeHover.x} 
                y1={paddingY} 
                x2={activeHover.x} 
                y2={chartHeight - paddingY} 
                stroke="rgba(255, 255, 255, 0.25)" 
                strokeWidth="1.5" 
                strokeDasharray="3 3"
              />
              <circle 
                cx={activeHover.x} 
                cy={activeHover.y} 
                r="6" 
                fill="#0f140d" 
                stroke={strokeColor} 
                strokeWidth="3"
              />
              <circle 
                cx={activeHover.x} 
                cy={activeHover.y} 
                r="10" 
                fill={strokeColor} 
                opacity="0.3"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activeHover && (
          <div 
            className="chart-tooltip"
            style={{
              left: `${(activeHover.x / chartWidth) * 100}%`,
              top: `${Math.max(10, (activeHover.y / chartHeight) * 100 - 15)}%`
            }}
          >
            <div className="tooltip-val">{formatUSD(activeHover.point.value)}</div>
            <div className="tooltip-date">{formatTimestamp(activeHover.point.timestamp)}</div>
          </div>
        )}
      </div>

      {/* Mini Stats Footer */}
      <div className="chart-footer-stats">
        <div className="stat-pill">
          <span className="label">Period Low</span>
          <span className="val">{formatUSD(stats.min)}</span>
        </div>
        <div className="stat-pill">
          <span className="label">Period High</span>
          <span className="val">{formatUSD(stats.max)}</span>
        </div>
        <div className="stat-pill">
          <span className="label">Baseline</span>
          <span className="val">{formatUSD(stats.first)}</span>
        </div>
        <div className="stat-pill">
          <span className="label">Data Points</span>
          <span className="val">{chartPoints.length}</span>
        </div>
      </div>
    </div>
  );
}
