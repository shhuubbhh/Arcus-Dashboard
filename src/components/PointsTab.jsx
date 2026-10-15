import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trophy, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Key, 
  HelpCircle, 
  ChevronRight, 
  ExternalLink,
  Layers,
  Activity,
  Award,
  Zap,
  RotateCw
} from 'lucide-react';
import { formatUSD, formatPoints, formatNumber, truncateAddress } from '../services/arcusApi';

export default function PointsTab({ data, onPrivyTokenUpdate }) {
  const points = data?.points || {};
  const volumes = data?.volumes || {};
  const fees = data?.fees || {};
  const meta = points?.meta || {};
  const history = points?.history || [];

  const [privyTokenInput, setPrivyTokenInput] = useState(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('arcus_privy_token') : '') || '';
  });
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [tokenSuccess, setTokenSuccess] = useState(false);

  // Live countdown to next drop
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetMs = new Date(points.nextDropAt || '2026-10-21T19:00:00.000Z').getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, targetMs - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [points.nextDropAt]);

  const handleSavePrivyToken = (e) => {
    e.preventDefault();
    setSavingToken(true);
    const clean = privyTokenInput.trim();
    if (clean) {
      localStorage.setItem('arcus_privy_token', clean);
    } else {
      localStorage.removeItem('arcus_privy_token');
    }
    setTokenSuccess(true);
    setTimeout(() => {
      setTokenSuccess(false);
      setSavingToken(false);
      if (onPrivyTokenUpdate) onPrivyTokenUpdate(clean);
    }, 600);
  };

  const handleClearPrivyToken = () => {
    setPrivyTokenInput('');
    localStorage.removeItem('arcus_privy_token');
    if (onPrivyTokenUpdate) onPrivyTokenUpdate('');
  };

  const poolWeekly = points.poolWeekly || 250000;
  const poolSharePct = poolWeekly > 0 ? ((points.weeklyPoints || 0) / poolWeekly) * 100 : 0;
  const currentTier = points.tier || 'Bronze';

  return (
    <div className="points-tab-container">
      {/* 1. Header Banner & Live Drop Countdown */}
      <div className="points-hero-card">
        <div className="points-hero-left">
          <div className="points-status-badge">
            <span className="live-pulsing-dot" />
            <span className="points-season-name">{points.season || 'Season 1'} Active</span>
            <span className="points-pool-tag">250,000 pts / week</span>
          </div>
          <h2 className="points-hero-title font-serif">
            Arcus Weekly Points & Rewards Ledger
          </h2>
          <p className="points-hero-desc">
            Points are automatically distributed every <strong>Wednesday at 19:00 UTC (3:00 PM ET)</strong> to active perpetual traders, market makers, and liquidity providers on Robinhood Chain.
          </p>

          <div className="points-meta-tags-row">
            <span className="meta-tag-item">
              <Activity size={13} className="text-lime" />
              <span>{formatNumber(meta?.season_addresses || 14429, 0)} Active Season Traders</span>
            </span>
            <span className="meta-tag-item">
              <Trophy size={13} className="text-amber" />
              <span>{formatNumber(meta?.season_total_points || 500000, 0)} Total Season Points Distributed</span>
            </span>
            <span className="meta-tag-item">
              <ShieldCheck size={13} className="text-cyan" />
              <span>{points.isVerified ? 'Privy Verified Account' : 'Empirical Calibrated Model'}</span>
            </span>
          </div>
        </div>

        {/* Next Drop Countdown Clock */}
        <div className="points-countdown-box">
          <div className="countdown-header">
            <Clock size={14} className="text-lime" />
            <span>Next Distribution Drop In:</span>
          </div>
          <div className="countdown-timer-grid font-mono">
            <div className="timer-unit">
              <span className="unit-value">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="unit-label">DAYS</span>
            </div>
            <span className="timer-colon">:</span>
            <div className="timer-unit">
              <span className="unit-value">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="unit-label">HRS</span>
            </div>
            <span className="timer-colon">:</span>
            <div className="timer-unit">
              <span className="unit-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="unit-label">MIN</span>
            </div>
            <span className="timer-colon">:</span>
            <div className="timer-unit">
              <span className="unit-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="unit-label">SEC</span>
            </div>
          </div>
          <div className="countdown-footer text-muted text-xs">
            Scheduled: Wednesday Oct 21 • 19:00 UTC
          </div>
        </div>
      </div>

      {/* 2. Wallet Season Standing 4 KPI Cards */}
      <div className="points-kpi-grid">
        <div className="points-kpi-card highlight-lime">
          <div className="kpi-icon-wrap lime">
            <Sparkles size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Weekly Points (Current Week)</span>
            <div className="kpi-val font-mono text-lime">
              {formatPoints(points.weeklyPoints || 0)}
            </div>
            <span className="kpi-sub font-mono">
              From {formatUSD(volumes.v7d || 0)} 7D Volume & {formatUSD(fees.f7d || 0)} fees
            </span>
          </div>
        </div>

        <div className="points-kpi-card">
          <div className="kpi-icon-wrap amber">
            <Award size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Season 1 Reward Tier</span>
            <div className="kpi-val">
              <span className={`tier-badge-large tier-${currentTier.toLowerCase()}`}>
                {currentTier} Tier
              </span>
            </div>
            <span className="kpi-sub">
              {currentTier === 'Diamond' ? 'VIP Whale Status • Max Multiplier' : 'Volume-weighted rewards bracket'}
            </span>
          </div>
        </div>

        <div className="points-kpi-card">
          <div className="kpi-icon-wrap cyan">
            <Trophy size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Season 1 Total Points</span>
            <div className="kpi-val font-mono">
              {formatPoints(points.seasonTotalPoints || 0)}
            </div>
            <span className="kpi-sub">
              Accumulated across Weeks 1 & 2
            </span>
          </div>
        </div>

        <div className="points-kpi-card">
          <div className="kpi-icon-wrap purple">
            <Zap size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Est. Weekly Pool Share</span>
            <div className="kpi-val font-mono">
              {poolSharePct > 0 ? `${poolSharePct.toFixed(2)}%` : '0.00%'}
            </div>
            <span className="kpi-sub">
              Of 250,000 weekly platform emission
            </span>
          </div>
        </div>
      </div>

      {/* 3. Weekly Drops Ledger Table */}
      <div className="points-table-section">
        <div className="section-title-row">
          <div>
            <h3 className="section-title">Weekly Points Distribution History</h3>
            <p className="section-subtitle">
              Breakdown of individual 7-day drops, trading volume snapshot, and reward delivery status.
            </p>
          </div>
        </div>

        <div className="table-responsive-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Drop / Cycle</th>
                <th>Snapshot Window</th>
                <th>7D Trading Volume</th>
                <th>7D Fees Paid</th>
                <th>Reward Tier</th>
                <th>Weekly Points</th>
                <th>Distribution Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((drop, idx) => (
                <tr key={drop.weekNumber || idx} className={drop.isUpcoming ? 'row-active-accruing' : ''}>
                  <td>
                    <div className="val-subval-cell">
                      <span className="font-bold">{drop.label}</span>
                      <span className="text-xs text-muted">Season 1</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-muted">{drop.dateRange}</span>
                  </td>
                  <td>
                    <span className="font-mono font-bold">{formatUSD(drop.volume)}</span>
                  </td>
                  <td>
                    <span className="font-mono text-muted">{formatUSD(drop.fees)}</span>
                  </td>
                  <td>
                    <span className={`tier-badge-xs tier-${(drop.tier || 'Bronze').toLowerCase()}`}>
                      {drop.tier}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono font-bold text-lime">
                      {formatPoints(drop.points)}
                    </span>
                  </td>
                  <td>
                    {drop.isUpcoming ? (
                      <span className="status-pill status-accruing">
                        <span className="pulse-dot-lime" />
                        Accruing (Drops Oct 21)
                      </span>
                    ) : (
                      <span className="status-pill status-completed">
                        <CheckCircle2 size={12} className="text-green" />
                        Distributed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Optional Privy Token Authenticator */}
      <div className="privy-auth-card">
        <div className="privy-auth-header" onClick={() => setShowTokenInput(!showTokenInput)}>
          <div className="privy-title-group">
            <Key size={16} className="text-sand" />
            <div>
              <span className="privy-card-title">Direct Arcus Backend Sync (Privy Token)</span>
              <p className="privy-card-desc">
                Arcus points API requires a Privy Identity Token to view private server allocations. You can paste your token to verify against <code>points-api.arcus.xyz/v1/points/{'{address}'}</code>.
              </p>
            </div>
          </div>
          <button type="button" className="btn-toggle-token-panel">
            {showTokenInput ? 'Hide Form' : 'Configure Token'}
          </button>
        </div>

        {showTokenInput && (
          <form className="privy-token-form" onSubmit={handleSavePrivyToken}>
            <div className="token-input-row">
              <input 
                type="password"
                className="privy-token-input font-mono"
                placeholder="Paste your privy-id-token from your Arcus session..."
                value={privyTokenInput}
                onChange={(e) => setPrivyTokenInput(e.target.value)}
              />
              <button type="submit" className="btn-save-token" disabled={savingToken}>
                {savingToken ? <RotateCw size={13} className="spin" /> : null}
                <span>{tokenSuccess ? 'Saved & Synced!' : 'Verify Token'}</span>
              </button>
              {privyTokenInput && (
                <button type="button" className="btn-clear-token" onClick={handleClearPrivyToken}>
                  Clear
                </button>
              )}
            </div>
            <div className="token-tip-text">
              <HelpCircle size={12} />
              <span>
                Tip: Your token remains saved locally in your browser session only. If left empty, the dashboard defaults to non-custodial volume-weighted regression matching the official 250,000 weekly pool.
              </span>
            </div>
          </form>
        )}
      </div>

      {/* 5. Program Rules and Information Cards */}
      <div className="points-rules-grid">
        <div className="rule-card">
          <div className="rule-card-header">
            <Calendar size={16} className="text-lime" />
            <h4>Fixed 250,000 Points Weekly Pool</h4>
          </div>
          <p>
            Weekly distributions are fixed and non-inflationary. The 250,000 pool does not expand with protocol growth, maximizing the relative rewards value for early high-volume traders.
          </p>
        </div>

        <div className="rule-card">
          <div className="rule-card-header">
            <Zap size={16} className="text-sand" />
            <h4>Multipliers & Tokenized Stock Perps</h4>
          </div>
          <p>
            Trades in tokenized equity perpetuals, orders placed outside regular US market hours (24/7 equities), and providing maker liquidity receive enhanced reward weighting.
          </p>
        </div>

        <div className="rule-card">
          <div className="rule-card-header">
            <ShieldCheck size={16} className="text-cyan" />
            <h4>Season 0 to Season 1 Roadmap</h4>
          </div>
          <p>
            Season 0 concluded on September 30, 2026. Season 1 is actively distributing weekly points through H1 2027 in anticipation of Arcus governance decentralization.
          </p>
        </div>
      </div>
    </div>
  );
}
