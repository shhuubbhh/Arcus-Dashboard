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
  Sliders,
  Sparkles,
  ClipboardPaste,
  Globe
} from 'lucide-react';

import { 
  NETWORKS, 
  FEATURED_WALLETS, 
  fetchCompleteWalletDashboard, 
  fetchLiveMarkets, 
  isValidAddress, 
  truncateAddress, 
  formatUSD 
} from './services/arcusApi';

import MetricCards from './components/MetricCards';
import PortfolioChart from './components/PortfolioChart';
import PositionsTable from './components/PositionsTable';
import TradesTable from './components/TradesTable';
import OrdersTab from './components/OrdersTab';
import FundingTab from './components/FundingTab';
import TransfersTab from './components/TransfersTab';
import MarketTicker from './components/MarketTicker';
import FeeTierModal from './components/FeeTierModal';
import LeaderboardModal from './components/LeaderboardModal';
import ArcusLogo, { ArcusMark } from './components/ArcusLogo';

export default function App() {
  // Network selection
  const [networkKey, setNetworkKey] = useState('mainnet');
  const network = NETWORKS[networkKey];

  // Address input and active address state
  const [inputAddress, setInputAddress] = useState('');
  const [activeAddress, setActiveAddress] = useState(() => {
    // Check URL parameters for ?address=0x...
    const params = new URLSearchParams(window.location.search);
    const urlAddr = params.get('address');
    if (urlAddr && isValidAddress(urlAddr)) return urlAddr;
    return FEATURED_WALLETS[0].address; // Default to #1 Whale
  });

  // Dashboard dataset & loading states
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Live markets list
  const [liveMarkets, setLiveMarkets] = useState([]);

  // Active tab state
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'positions' | 'trades' | 'orders' | 'funding' | 'transfers'

  // Modals
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);

  // Copy status
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  // Sync address to input field on initial mount
  useEffect(() => {
    setInputAddress(activeAddress);
  }, [activeAddress]);

  // Sync browser URL query parameter
  useEffect(() => {
    if (activeAddress) {
      const url = new URL(window.location);
      url.searchParams.set('address', activeAddress);
      window.history.replaceState({}, '', url);
    }
  }, [activeAddress]);

  // Load Markets for Ticker
  useEffect(() => {
    fetchLiveMarkets(network.restUrl).then(mkts => {
      setLiveMarkets(mkts);
    });
  }, [network.restUrl]);

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
      const data = await fetchCompleteWalletDashboard(addrToLoad, network.restUrl);
      setDashboardData(data);
      setLastRefreshed(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      // Determine user-friendly error message
      if (err.status === 403) {
        setError(`Address ${truncateAddress(addrToLoad)} has not been registered on Arcus or access is restricted. Try selecting one of the featured active traders above.`);
      } else {
        setError(err.message || 'Error communicating with Arcus API. Please check your network or try again.');
      }
      setLoading(false);
    }
  }, [network.restUrl]);

  // Trigger load on address or network change
  useEffect(() => {
    loadDashboard(activeAddress, true);
  }, [activeAddress, networkKey, loadDashboard]);

  // Auto-refresh interval (every 15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadDashboard(activeAddress, false);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeAddress, loadDashboard]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const clean = inputAddress.trim();
    if (!isValidAddress(clean)) {
      setError('Invalid wallet address format. Must be a 42-character hex address starting with 0x.');
      return;
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
          setActiveAddress(clean);
        }
      }
    } catch (err) {
      console.warn('Clipboard paste error:', err);
    }
  };

  // Handle Copy Address
  const handleCopyAddress = () => {
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
          <div className="brand-group">
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
                const isSelected = activeAddress.toLowerCase() === fw.address.toLowerCase();
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

        {/* Core KPI Metric Cards */}
        {dashboardData && (
          <MetricCards data={dashboardData} />
        )}

        {/* Main Tabs Navigation */}
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
              />

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
