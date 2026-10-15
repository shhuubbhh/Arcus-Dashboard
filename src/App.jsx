import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Wallet, 
  RotateCw, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  Trophy, 
  Award, 
  Layers, 
  History, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Activity, 
  AlertCircle,
  TrendingUp,
  Sparkles,
  ClipboardPaste,
  X,
  ArrowRight
} from 'lucide-react';

import { 
  NETWORKS, 
  FEATURED_WALLETS, 
  fetchCompleteWalletDashboard, 
  fetchLiveMarkets, 
  isValidAddress, 
  truncateAddress,
  formatPoints 
} from './services/arcusApi';

import MetricCards from './components/MetricCards';
import PortfolioChart from './components/PortfolioChart';
import PositionsTable from './components/PositionsTable';
import TradesTable from './components/TradesTable';
import OrdersTab from './components/OrdersTab';
import FundingTab from './components/FundingTab';
import TransfersTab from './components/TransfersTab';
import PointsTab from './components/PointsTab';
import MarketTicker from './components/MarketTicker';
import FeeTierModal from './components/FeeTierModal';
import LeaderboardModal from './components/LeaderboardModal';
import ArcusLogo, { ArcusMark } from './components/ArcusLogo';

export default function App() {
  // Network selection
  const [networkKey, setNetworkKey] = useState('mainnet');
  const network = NETWORKS[networkKey];

  // Address input and active address state
  // Default is completely empty unless ?address=0x... is explicitly in URL
  const [inputAddress, setInputAddress] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAddr = params.get('address');
    if (urlAddr && isValidAddress(urlAddr)) return urlAddr;
    return '';
  });

  const [activeAddress, setActiveAddress] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAddr = params.get('address');
    if (urlAddr && isValidAddress(urlAddr)) return urlAddr;
    return ''; // Default to no wallet loaded
  });

  // Dashboard dataset & loading states
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAddr = params.get('address');
    return Boolean(urlAddr && isValidAddress(urlAddr));
  });
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Live markets list
  const [liveMarkets, setLiveMarkets] = useState([]);

  // Active tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Selected Analytics Timeframe ('24h' | '7d' | '30d' | 'all')
  const [timeframe, setTimeframe] = useState('30d');

  // Modals
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);

  // Copy status
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  // Sync address to input field when activeAddress changes
  useEffect(() => {
    if (activeAddress) {
      setInputAddress(activeAddress);
    }
  }, [activeAddress]);

  // Sync browser URL query parameter: remove ?address if empty, set ?address if valid
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeAddress) {
      url.searchParams.set('address', activeAddress);
      window.history.replaceState({}, '', url.toString());
    } else {
      url.searchParams.delete('address');
      const cleanUrl = url.searchParams.toString() 
        ? `${url.pathname}?${url.searchParams.toString()}` 
        : url.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [activeAddress]);

  // Load Markets for Ticker
  useEffect(() => {
    fetchLiveMarkets(network.restUrl).then(mkts => {
      setLiveMarkets(mkts);
    });
  }, [network.restUrl]);

  // Reference to existing data for background refresh preservation
  const dashboardDataRef = useRef(dashboardData);
  dashboardDataRef.current = dashboardData;

  // Main data loader function
  const loadDashboard = useCallback(async (addrToLoad, showLoading = true) => {
    if (!addrToLoad || !isValidAddress(addrToLoad)) {
      setError('Please provide a valid 42-character Ethereum or Robinhood Chain EVM address (e.g. 0x...)');
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const existing = dashboardDataRef.current;
      const data = await fetchCompleteWalletDashboard(addrToLoad, network.restUrl, existing);
      setDashboardData(data);
      setLastRefreshed(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      // Only show blocking error if we don't have any cached data yet
      if (!dashboardDataRef.current) {
        if (err.status === 403) {
          setError(`Address ${truncateAddress(addrToLoad)} has not been registered on Arcus or access is restricted. Try selecting one of the featured active traders.`);
        } else {
          setError(err.message || 'Error communicating with Arcus API. Please check your network or try again.');
        }
      }
      setLoading(false);
    }
  }, [network.restUrl]);

  // Trigger load on address or network change
  useEffect(() => {
    if (activeAddress) {
      loadDashboard(activeAddress, true);
    } else {
      setDashboardData(null);
      setLoading(false);
      setError(null);
    }
  }, [activeAddress, networkKey, loadDashboard]);

  // Auto-refresh interval (every 45s) only when active address exists
  useEffect(() => {
    if (!autoRefresh || !activeAddress) return;
    const interval = setInterval(() => {
      loadDashboard(activeAddress, false);
    }, 45000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeAddress, loadDashboard]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const clean = inputAddress.trim();
    if (!clean) {
      setActiveAddress('');
      setError('Please paste or type an Ethereum or Robinhood Chain EVM address (0x...)');
      return;
    }
    if (!isValidAddress(clean)) {
      setError('Invalid wallet address format. Must be a 42-character hex address starting with 0x.');
      return;
    }
    setError(null);
    if (clean.toLowerCase() !== activeAddress.toLowerCase()) {
      setDashboardData(null);
      setLoading(true);
    }
    setActiveAddress(clean);
  };

  // Handle Clipboard Paste
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const clean = text.trim();
        setInputAddress(clean);
        if (isValidAddress(clean)) {
          setError(null);
          if (clean.toLowerCase() !== activeAddress.toLowerCase()) {
            setDashboardData(null);
            setLoading(true);
          }
          setActiveAddress(clean);
        }
      }
    } catch (err) {
      console.warn('Clipboard paste error:', err);
    }
  };

  // Handle Clear / Reset to default landing page
  const handleClear = () => {
    setInputAddress('');
    setActiveAddress('');
    setDashboardData(null);
    setError(null);
  };

  // Handle Copy Address
  const handleCopyAddress = () => {
    if (!activeAddress) return;
    navigator.clipboard.writeText(activeAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  // Handle Share Link
  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="app-container">
      {/* Top Protocol Header Bar */}
      <header className="navbar">
        <div className="nav-content">
          <div className="brand-group" onClick={handleClear} style={{ cursor: 'pointer' }} title="Reset to Home">
            <ArcusLogo markSize={32} wordmarkHeight={25} color="#E8DDBE" />
            <div className="brand-badge-col">
              <span className="brand-tag">PERP DEX</span>
              <span className="brand-sub">Non-Custodial Analytics & Trader Dashboard</span>
            </div>
          </div>

          <div className="nav-actions">
            {/* Engine status indicator */}
            <div className="status-indicator">
              <span className="pulse-dot" />
              <span className="status-text">Engine Online (Robinhood Chain)</span>
            </div>

            {/* Network switch */}
            <div className="network-pill-select">
              <button 
                className={`net-btn ${networkKey === 'mainnet' ? 'active' : ''}`}
                onClick={() => setNetworkKey('mainnet')}
              >
                Mainnet
              </button>
              <button 
                className={`net-btn ${networkKey === 'testnet' ? 'active' : ''}`}
                onClick={() => setNetworkKey('testnet')}
              >
                Testnet
              </button>
            </div>

            {/* Modals trigger buttons */}
            <button 
              className="nav-btn-glass"
              onClick={() => setLeaderboardModalOpen(true)}
              title="View Leaderboard"
            >
              <Trophy size={14} className="text-amber" />
              <span>Leaderboard</span>
            </button>

            <button 
              className="nav-btn-glass"
              onClick={() => setFeeModalOpen(true)}
              title="View Fee Schedule"
            >
              <Award size={14} className="text-amber" />
              <span>Fee Tiers</span>
            </button>

            {/* Auto refresh toggle */}
            <button 
              className={`nav-btn-icon ${autoRefresh ? 'active-pulse' : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Auto-refresh active (15s)' : 'Auto-refresh paused'}
            >
              <RotateCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Live Market Ticker */}
      <MarketTicker markets={liveMarkets} />

      <main className="main-content">
        {/* Wallet Address Input Bar & Quick Switcher */}
        <section className="search-section">
          <form className="search-card" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <Wallet size={18} className="search-field-icon" />
              <input
                type="text"
                className="wallet-input font-mono"
                placeholder="Paste any Ethereum / Robinhood Chain EVM address (0x...)"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                spellCheck="false"
              />
              {inputAddress && (
                <button
                  type="button"
                  className="clear-input-icon-btn"
                  onClick={handleClear}
                  title="Clear input"
                >
                  <X size={14} />
                </button>
              )}
              <button 
                type="button" 
                className="paste-action-btn"
                onClick={handlePaste}
                title="Paste from clipboard"
              >
                <ClipboardPaste size={14} />
                <span>Paste</span>
              </button>
            </div>

            <button type="submit" className="btn-search-submit">
              <Search size={15} />
              <span>Analyze Wallet</span>
            </button>
          </form>

          {/* Quick-select Featured Whales from Live Leaderboard */}
          <div className="featured-wallets-bar">
            <span className="featured-lbl">
              <Sparkles size={12} className="text-cyan" />
              Explore Top Traders:
            </span>
            <div className="featured-pills-list">
              {FEATURED_WALLETS.map(fw => {
                const isSelected = activeAddress && activeAddress.toLowerCase() === fw.address.toLowerCase();
                return (
                  <button
                    key={fw.address}
                    className={`featured-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setInputAddress(fw.address);
                      setActiveAddress(fw.address);
                    }}
                  >
                    <span className="pill-name">{fw.label}</span>
                    <span className="pill-badge">{fw.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* DEFAULT LANDING: When no wallet address is selected */}
        {!activeAddress && (
          <section className="welcome-hero-container">
            <div className="welcome-hero-card">
              <div className="welcome-hero-top">
                <div className="welcome-badge">
                  <Sparkles size={13} className="text-lime" />
                  <span>Robinhood Chain Perpetual DEX Analytics</span>
                </div>
                <h1 className="welcome-title font-serif">
                  Inspect Any <span className="highlight-sand">Arcus Perpetual</span> Portfolio
                </h1>
                <p className="welcome-desc">
                  Paste your EVM wallet address above to instantly inspect open perpetual positions,
                  equity curves, historical PnL, execution fills, and funding cashflows directly from the live Arcus API.
                </p>
              </div>

              {/* Feature Value Props Grid */}
              <div className="welcome-features-grid">
                <div className="welcome-feat-item">
                  <div className="feat-icon-box">
                    <Layers size={22} className="text-lime" />
                  </div>
                  <h4>Open Positions & Risk</h4>
                  <p>Real-time mark prices, leverage, notional size, and liquidation proximity across all perpetual markets.</p>
                </div>

                <div className="welcome-feat-item">
                  <div className="feat-icon-box">
                    <TrendingUp size={22} className="text-sand" />
                  </div>
                  <h4>Interactive PnL Curves</h4>
                  <p>Toggle between portfolio equity ($) and cumulative PnL ($) across 24H, 7D, 30D, and All-Time with hover crosshairs.</p>
                </div>

                <div className="welcome-feat-item">
                  <div className="feat-icon-box">
                    <History size={22} className="text-lime" />
                  </div>
                  <h4>Trade Fills & Tax CSV</h4>
                  <p>Every trade execution decoded with maker/taker liquidity status, fees, closed PnL, and 1-click CSV export.</p>
                </div>

                <div className="welcome-feat-item">
                  <div className="feat-icon-box">
                    <Zap size={22} className="text-sand" />
                  </div>
                  <h4>Funding & Collateral</h4>
                  <p>Historical hourly funding rate cashflows, deposits, withdrawals, and margin health safety gauge.</p>
                </div>
              </div>

              {/* Demo Trader Cards */}
              <div className="welcome-demo-box">
                <div className="demo-box-header">
                  <div className="demo-title-group">
                    <Trophy size={16} className="text-sand" />
                    <span className="demo-box-title">Or test with top protocol traders:</span>
                  </div>
                  <button 
                    type="button" 
                    className="btn-view-leaderboard"
                    onClick={() => setLeaderboardModalOpen(true)}
                  >
                    <span>View Full Leaderboard →</span>
                  </button>
                </div>

                <div className="demo-cards-row">
                  {FEATURED_WALLETS.map(fw => (
                    <div 
                      key={fw.address} 
                      className="demo-trader-card"
                      onClick={() => {
                        setInputAddress(fw.address);
                        setActiveAddress(fw.address);
                      }}
                    >
                      <div className="demo-trader-top">
                        <span className="demo-trader-label">{fw.label}</span>
                        <span className="demo-trader-badge">{fw.badge}</span>
                      </div>
                      <span className="demo-trader-addr font-mono">{truncateAddress(fw.address)}</span>
                      <div className="demo-trader-action">
                        <span>Inspect Wallet</span>
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Non-custodial Trust Notice */}
              <div className="welcome-trust-note">
                <ShieldCheck size={14} className="text-lime" />
                <span>100% Non-Custodial & Read-Only — No wallet connection, signature approvals, or private keys required.</span>
              </div>
            </div>
          </section>
        )}

        {/* ACTIVE WALLET VIEW: Rendered once an address is entered */}
        {activeAddress && (
          <>
            {/* Current Active Wallet Meta Header */}
            <section className="active-wallet-card">
              <div className="wallet-avatar-col">
                <div className="wallet-identicon" title="Arcus Account">
                  <ArcusMark size={26} color="#0F140D" />
                </div>
                <div className="wallet-meta-text">
                  <div className="wallet-address-row">
                    <span className="full-address font-mono">{activeAddress}</span>
                    <button 
                      className="icon-chip-btn" 
                      onClick={handleCopyAddress}
                      title="Copy Wallet Address"
                    >
                      {copiedAddr ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                      <span>{copiedAddr ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button 
                      className="icon-chip-btn" 
                      onClick={handleShareLink}
                      title="Share Dashboard Link"
                    >
                      {copiedShare ? <Check size={13} className="text-green" /> : <Share2 size={13} />}
                      <span>{copiedShare ? 'Link Copied' : 'Share'}</span>
                    </button>
                    <button 
                      className="icon-chip-btn text-muted hover-sand"
                      onClick={handleClear}
                      title="Clear and return to home"
                    >
                      <X size={13} />
                      <span>Clear</span>
                    </button>
                    <a 
                      href={`https://explorer.robinhood.com/address/${activeAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="icon-chip-btn"
                      title="View on Robinhood Chain Explorer"
                    >
                      <ExternalLink size={13} />
                      <span>Explorer</span>
                    </a>
                  </div>
                  <div className="wallet-sub-badges">
                    <span className="subaccount-tag">Account Index: {dashboardData?.accountIndex ?? 0}</span>
                    <span className="tier-pill-gold">
                      <Award size={12} />
                      {dashboardData?.feeTier?.current?.name || 'Base'} Tier (Lv {dashboardData?.feeTier?.current?.level ?? 0})
                    </span>
                    <button 
                      type="button"
                      className="points-pill-lime"
                      onClick={() => setActiveTab('points')}
                      title="View Arcus Weekly Points & Rewards Breakdown"
                    >
                      <Sparkles size={12} className="text-lime" />
                      <span>{formatPoints(dashboardData?.points?.weeklyPoints || 0)} / wk</span>
                      <span className="points-tier-tag">({dashboardData?.points?.tier || 'Bronze'})</span>
                    </button>
                    {lastRefreshed && (
                      <span className="refresh-time-tag">
                        Synced {lastRefreshed.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="wallet-cta-col">
                <button 
                  className="refresh-btn-main"
                  onClick={() => loadDashboard(activeAddress, true)}
                  disabled={loading}
                >
                  <RotateCw size={14} className={loading ? 'spin' : ''} />
                  <span>{loading ? 'Fetching API...' : 'Refresh Data'}</span>
                </button>
              </div>
            </section>

            {/* Error notification banner if any */}
            {error && (
              <div className="error-banner">
                <AlertCircle size={18} className="error-icon" />
                <div className="error-msg">
                  <strong>Account Notice:</strong> {error}
                </div>
                <button 
                  className="btn-retry-demo"
                  onClick={() => {
                    const demo = FEATURED_WALLETS[0].address;
                    setInputAddress(demo);
                    setActiveAddress(demo);
                  }}
                >
                  Switch to #1 Whale Demo
                </button>
              </div>
            )}

            {/* Loading state skeleton/spinner */}
            {loading && !dashboardData && (
              <div className="loading-state-card">
                <RotateCw size={36} className="spin text-sand" />
                <div className="loading-state-title">Connecting to Arcus DEX API...</div>
                <div className="loading-state-desc font-mono">
                  Loading account balances, positions, executions, and return history for {truncateAddress(activeAddress)}
                </div>
              </div>
            )}

            {/* Core KPI Metric Cards */}
            {dashboardData && (
              <MetricCards 
                data={dashboardData} 
                timeframe={timeframe} 
                onTimeframeChange={setTimeframe} 
                onSelectPointsTab={() => setActiveTab('points')}
              />
            )}

            {/* Main Tabs Navigation */}
            {dashboardData && (
              <>
                <div className="tabs-nav-bar">
                  <button 
                    className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <Activity size={15} />
                    <span>Portfolio & PnL</span>
                  </button>

                  <button 
                    className={`tab-item ${activeTab === 'positions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('positions')}
                  >
                    <Layers size={15} />
                    <span>Open Positions</span>
                    {dashboardData?.positions?.length > 0 && (
                      <span className="tab-counter">{dashboardData.positions.length}</span>
                    )}
                  </button>

                  <button 
                    className={`tab-item ${activeTab === 'trades' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trades')}
                  >
                    <History size={15} />
                    <span>Trade Fills</span>
                    {dashboardData?.fills?.length > 0 && (
                      <span className="tab-counter">{dashboardData.fills.length}</span>
                    )}
                  </button>

                  <button 
                    className={`tab-item ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                  >
                    <Clock size={15} />
                    <span>Orders</span>
                    {dashboardData?.openOrders?.length > 0 && (
                      <span className="tab-counter">{dashboardData.openOrders.length}</span>
                    )}
                  </button>

                  <button 
                    className={`tab-item ${activeTab === 'funding' ? 'active' : ''}`}
                    onClick={() => setActiveTab('funding')}
                  >
                    <Zap size={15} />
                    <span>Funding History</span>
                  </button>

                  <button 
                    className={`tab-item ${activeTab === 'points' ? 'active' : ''}`}
                    onClick={() => setActiveTab('points')}
                  >
                    <Sparkles size={15} className="text-lime" />
                    <span>Arcus Points</span>
                    <span className="tab-counter points-counter">
                      {formatPoints(dashboardData?.points?.weeklyPoints || 0)}
                    </span>
                  </button>

                  <button 
                    className={`tab-item ${activeTab === 'transfers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transfers')}
                  >
                    <ShieldCheck size={15} />
                    <span>Transfers & Deposits</span>
                  </button>
                </div>

                {/* Tab Content Views */}
                <div className="tab-content-area">
                  {activeTab === 'overview' && (
                    <div className="overview-stack">
                      {/* Portfolio Interactive Chart */}
                      <PortfolioChart 
                        portfolio={dashboardData?.portfolio}
                        currentEquity={dashboardData?.equity}
                        totalUnrealizedPnl={dashboardData?.totalUnrealizedPnl}
                        timeframe={timeframe}
                        onTimeframeChange={setTimeframe}
                      />

                      {/* Arcus Weekly Points Overview Spotlight */}
                      <div className="points-spotlight-bar" onClick={() => setActiveTab('points')}>
                        <div className="spotlight-left">
                          <div className="spotlight-icon-wrap">
                            <Sparkles size={18} className="text-lime" />
                          </div>
                          <div className="spotlight-text">
                            <span className="spotlight-title">
                              Arcus Season 1 Weekly Reward: <strong>{formatPoints(dashboardData?.points?.weeklyPoints || 0)}</strong>
                            </span>
                            <span className="spotlight-sub">
                              Reward Tier: <span className={`tier-badge-xs tier-${(dashboardData?.points?.tier || 'Bronze').toLowerCase()}`}>{dashboardData?.points?.tier || 'Bronze'}</span> • 250,000 pts pool drops every Wednesday at 19:00 UTC
                            </span>
                          </div>
                        </div>
                        <button type="button" className="spotlight-cta">
                          <span>View Full Points Ledger →</span>
                        </button>
                      </div>

                      {/* Positions Preview */}
                      <div className="overview-section-header">
                        <h3>Active Positions Overview</h3>
                        <button className="link-action-btn" onClick={() => setActiveTab('positions')}>
                          View all ({dashboardData?.positions?.length || 0}) →
                        </button>
                      </div>
                      <PositionsTable 
                        positions={dashboardData?.positions || []}
                        marketsMap={dashboardData?.marketsMap || {}}
                      />

                      {/* Recent Fills Preview */}
                      <div className="overview-section-header" style={{ marginTop: '24px' }}>
                        <h3>Recent Executions</h3>
                        <button className="link-action-btn" onClick={() => setActiveTab('trades')}>
                          View all fills ({dashboardData?.fills?.length || 0}) →
                        </button>
                      </div>
                      <TradesTable 
                        fills={dashboardData?.fills?.slice(0, 10) || []}
                        fillsStats={dashboardData?.fillsStats}
                      />
                    </div>
                  )}

                  {activeTab === 'points' && (
                    <PointsTab 
                      data={dashboardData}
                      onPrivyTokenUpdate={() => {
                        loadDashboard(activeAddress, false);
                      }}
                    />
                  )}

                  {activeTab === 'positions' && (
                    <PositionsTable 
                      positions={dashboardData?.positions || []}
                      marketsMap={dashboardData?.marketsMap || {}}
                    />
                  )}

                  {activeTab === 'trades' && (
                    <TradesTable 
                      fills={dashboardData?.fills || []}
                      fillsStats={dashboardData?.fillsStats}
                    />
                  )}

                  {activeTab === 'orders' && (
                    <OrdersTab 
                      orders={dashboardData?.orders || []}
                      openOrders={dashboardData?.openOrders || []}
                    />
                  )}

                  {activeTab === 'funding' && (
                    <FundingTab 
                      funding={dashboardData?.funding || []}
                    />
                  )}

                  {activeTab === 'transfers' && (
                    <TransfersTab 
                      transfers={dashboardData?.transfers || []}
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer-bar">
        <div className="footer-content">
          <div className="footer-left">
            <ArcusLogo markSize={20} wordmarkHeight={16} color="#E8DDBE" />
            <span className="footer-text">
              Decentralized perpetual futures & stock tokens on Robinhood Chain, co-incubated with dYdX Labs.
            </span>
          </div>
          <div className="footer-right">
            <a href="https://docs.arcus.xyz" target="_blank" rel="noreferrer" className="footer-link">
              API Documentation <ExternalLink size={11} />
            </a>
            <a href="https://arcus.xyz" target="_blank" rel="noreferrer" className="footer-link">
              Arcus Exchange <ExternalLink size={11} />
            </a>
            <span className="footer-version">v1.0.0 Mainnet</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <FeeTierModal 
        isOpen={feeModalOpen}
        onClose={() => setFeeModalOpen(false)}
        currentTier={dashboardData?.feeTier?.current}
        feeTiers={dashboardData?.feeTiers || []}
        userVolume30d={dashboardData?.volumes?.v30d || 0}
      />

      <LeaderboardModal 
        isOpen={leaderboardModalOpen}
        onClose={() => setLeaderboardModalOpen(false)}
        onSelectAddress={(addr) => {
          setInputAddress(addr);
          setActiveAddress(addr);
        }}
        currentAddress={activeAddress}
        baseUrl={network.restUrl}
      />
    </div>
  );
}
