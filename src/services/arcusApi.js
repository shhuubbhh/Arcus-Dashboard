/**
 * Arcus Perpetual DEX API Client
 * Official REST endpoints: https://api.arcus.xyz (Mainnet), https://api.testnet.arcus.xyz (Testnet)
 */

export const NETWORKS = {
  mainnet: {
    name: 'Robinhood Chain (Mainnet)',
    restUrl: 'https://api.arcus.xyz',
    wsUrl: 'wss://api.arcus.xyz/v1/ws',
    badge: 'Mainnet'
  },
  testnet: {
    name: 'Arcus Testnet',
    restUrl: 'https://api.testnet.arcus.xyz',
    wsUrl: 'wss://api.testnet.arcus.xyz/v1/ws',
    badge: 'Testnet'
  }
};

// Featured active traders from live Arcus Leaderboard for quick testing
export const FEATURED_WALLETS = [
  {
    address: '0xd993dcb195be82e2357a7b4222cfc9d89d89e6c4',
    label: '#1 Whale Trader',
    badge: '$1.8B+ Vol',
    category: 'Institutional'
  },
  {
    address: '0x00cb7b8d4b50061677c170b8c69a7ea2eb25aad1',
    label: '#2 Top Volume',
    badge: '$1.3B+ Vol',
    category: 'High-Freq'
  },
  {
    address: '0x8880c996750f93e4acc7769a203ec9f8ed8e9275',
    label: '#3 Alpha Trader',
    badge: '$988M+ Vol',
    category: 'VIP Tier'
  },
  {
    address: '0x0ad1763dddd2aa9284b3828c19eed0a1960f362b',
    label: 'Top PnL Leader',
    badge: '+$131k PnL',
    category: 'Profitable'
  },
  {
    address: '0xd868110d17c01577457bdeddd1e37198f05fdc5f',
    label: 'Active Market Maker',
    badge: 'Grid Bot',
    category: 'Maker'
  }
];

const QUANTUM_SCALE = 1e9; // Arcus volume and fee quantums: 1e9 = $1.00 USD

export function quantumToUsd(value) {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return 0;
  return num / QUANTUM_SCALE;
}

export function formatUSD(value, decimals = 2, prefix = '$') {
  if (value === null || value === undefined || value === '') return '$0.00';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '$0.00';
  
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1e9) {
    return `${sign}${prefix}${(abs / 1e9).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
  }
  if (abs >= 1e6) {
    return `${sign}${prefix}${(abs / 1e6).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
  }
  if (abs >= 1e3 && abs < 1e4) {
    return `${sign}${prefix}${abs.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  if (abs >= 1e4) {
    return `${sign}${prefix}${(abs / 1e3).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}K`;
  }
  return `${sign}${prefix}${abs.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function formatNumber(value, decimals = 4) {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || value === '') return '0.00%';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '0.00%';
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}

export function formatTimestamp(timestampUs) {
  if (!timestampUs) return '-';
  // Arcus timestamps can be microseconds (16 digits) or milliseconds (13 digits)
  const ms = String(timestampUs).length >= 16 ? Math.floor(Number(timestampUs) / 1000) : Number(timestampUs);
  const date = new Date(ms);
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function formatRelativeTime(timestampUs) {
  if (!timestampUs) return '-';
  const ms = String(timestampUs).length >= 16 ? Math.floor(Number(timestampUs) / 1000) : Number(timestampUs);
  const now = Date.now();
  const diffSec = Math.floor((now - ms) / 1000);
  
  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export function truncateAddress(address, start = 6, end = 4) {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function isValidAddress(address) {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

// Low-level fetch wrapper with error handling
async function apiGet(baseUrl, path, params = {}) {
  const url = new URL(baseUrl + path);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.set(key, val);
    }
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError;
    try {
      parsedError = JSON.parse(errorText);
    } catch {
      parsedError = { error: errorText || `HTTP ${response.status} ${response.statusText}` };
    }
    const err = new Error(parsedError.error || `HTTP error ${response.status}`);
    err.status = response.status;
    err.data = parsedError;
    throw err;
  }

  return response.json();
}

/**
 * Fetch all data for an address in parallel with resilient error isolation
 */
export async function fetchCompleteWalletDashboard(address, baseUrl = NETWORKS.mainnet.restUrl) {
  const cleanAddr = address.trim().toLowerCase();

  // Primary requests run concurrently
  const [
    accountRes,
    positionsRes,
    statsRes,
    portfolioRes,
    fillsRes,
    ordersRes,
    openOrdersRes,
    fundingRes,
    transfersRes,
    marketsRes,
    feeTiersRes
  ] = await Promise.allSettled([
    apiGet(baseUrl, '/v1/account', { address: cleanAddr }),
    apiGet(baseUrl, '/v1/positions', { address: cleanAddr }),
    apiGet(baseUrl, '/v1/account/stats', { address: cleanAddr, windows: '24h,7d,30d' }),
    apiGet(baseUrl, '/v1/portfolio', { address: cleanAddr }),
    apiGet(baseUrl, '/v1/fills', { address: cleanAddr, limit: 100 }),
    apiGet(baseUrl, '/v1/orders', { address: cleanAddr, limit: 50 }),
    apiGet(baseUrl, '/v1/openOrders', { address: cleanAddr }),
    apiGet(baseUrl, '/v1/funding', { address: cleanAddr, limit: 50 }),
    apiGet(baseUrl, '/v1/accountTransferUpdates', { address: cleanAddr, limit: 50 }),
    apiGet(baseUrl, '/v1/markets'),
    apiGet(baseUrl, '/v1/feetiers')
  ]);

  const account = accountRes.status === 'fulfilled' ? accountRes.value : null;
  const positionsData = positionsRes.status === 'fulfilled' ? positionsRes.value : null;
  const stats = statsRes.status === 'fulfilled' ? statsRes.value : null;
  const portfolio = portfolioRes.status === 'fulfilled' ? portfolioRes.value : null;
  const fills = fillsRes.status === 'fulfilled' ? fillsRes.value?.fills || [] : [];
  const orders = ordersRes.status === 'fulfilled' ? ordersRes.value?.orders || [] : [];
  const openOrders = openOrdersRes.status === 'fulfilled' ? openOrdersRes.value?.orders || [] : [];
  const funding = fundingRes.status === 'fulfilled' ? fundingRes.value?.fundingPayments || [] : [];
  const transfers = transfersRes.status === 'fulfilled' ? transfersRes.value?.accountTransferUpdates || [] : [];
  const marketsList = marketsRes.status === 'fulfilled' ? marketsRes.value?.markets || [] : [];
  const feeTiers = feeTiersRes.status === 'fulfilled' ? feeTiersRes.value?.tiers || [] : [];

  // Create quick lookup maps
  const marketsMap = {};
  marketsList.forEach(m => {
    marketsMap[m.marketDisplayName] = m;
    marketsMap[m.marketId] = m;
  });

  // Extract and standardize positions list
  let positionsList = [];
  if (positionsData?.positions && typeof positionsData.positions === 'object') {
    positionsList = Object.values(positionsData.positions);
  } else if (account?.positions && typeof account.positions === 'object') {
    positionsList = Object.values(account.positions);
  }

  // Calculate aggregated stats from positions and fills
  let totalUnrealizedPnl = 0;
  let totalPositionNotional = 0;
  let totalMarginUsed = 0;
  let totalBorrowedCapital = 0;

  positionsList.forEach(pos => {
    const uPnl = parseFloat(pos.unrealizedPnl || 0);
    const notional = Math.abs(parseFloat(pos.positionValueNotional || (parseFloat(pos.size || 0) * parseFloat(pos.markPx || pos.averageEntryPrice || 0))));
    const margin = parseFloat(pos.marginUsed || 0);
    const borrowed = parseFloat(pos.borrowedCapital || 0);

    totalUnrealizedPnl += uPnl;
    totalPositionNotional += notional;
    totalMarginUsed += margin;
    totalBorrowedCapital += borrowed;
  });

  // Aggregate fill trade metrics
  let totalClosedPnl = 0;
  let totalFillsFee = 0;
  let totalFillsVolume = 0;
  let makerFillsCount = 0;
  let takerFillsCount = 0;

  fills.forEach(fill => {
    const pnl = parseFloat(fill.closedPnl || 0);
    const fee = parseFloat(fill.fee || 0);
    const vol = parseFloat(fill.size || 0) * parseFloat(fill.price || 0);

    totalClosedPnl += pnl;
    totalFillsFee += fee;
    totalFillsVolume += vol;

    if (fill.role === 'MAKER') makerFillsCount++;
    else takerFillsCount++;
  });

  // Parse volume and fee metrics from stats endpoint (converting quote quantums)
  const windowed = stats?.windowedStats || {};
  const volume24h = windowed['24h'] ? quantumToUsd(windowed['24h'].volume) : 0;
  const volume7d = windowed['7d'] ? quantumToUsd(windowed['7d'].volume) : 0;
  const volume30d = windowed['30d'] ? quantumToUsd(windowed['30d'].volume) : quantumToUsd(stats?.rollingVolume);
  const lifetimeVolume = stats?.lifetimeVolume ? quantumToUsd(stats.lifetimeVolume) : (portfolio?.lifetimeVolume ? parseFloat(portfolio.lifetimeVolume) : totalFillsVolume);

  const fees24h = windowed['24h'] ? quantumToUsd(windowed['24h'].feesPaid) : 0;
  const fees7d = windowed['7d'] ? quantumToUsd(windowed['7d'].feesPaid) : 0;
  const fees30d = windowed['30d'] ? quantumToUsd(windowed['30d'].feesPaid) : quantumToUsd(stats?.rollingFeesPaid);
  const lifetimeFees = stats?.lifetimeFeesPaid ? quantumToUsd(stats.lifetimeFeesPaid) : totalFillsFee;

  // Account balances
  const netQuoteBalance = parseFloat(account?.netQuoteBalance || 0);
  const equity = parseFloat(account?.equity || (netQuoteBalance + totalUnrealizedPnl));
  const freeCollateral = parseFloat(account?.freeCollateral || Math.max(0, equity - totalMarginUsed));
  const netDeposits = parseFloat(account?.netDeposits || 0);

  // Fee tier info
  const tierLevel = stats?.tradingFeeTier?.level ?? 0;
  const currentTierObj = feeTiers.find(t => t.level === tierLevel) || {
    level: tierLevel,
    name: tierLevel === 0 ? 'Base' : `Tier ${tierLevel}`,
    maker_fee_ppm: stats?.tradingFeeTier?.makerFeePpm ?? 0,
    taker_fee_ppm: stats?.tradingFeeTier?.takerFeePpm ?? 225,
    volume_threshold: 0
  };

  const nextTierObj = feeTiers.find(t => t.level === tierLevel + 1) || null;

  // Funding metrics
  let totalFundingPayment = 0;
  funding.forEach(f => {
    totalFundingPayment += parseFloat(f.payment || 0);
  });

  return {
    address: cleanAddr,
    accountIndex: account?.accountIndex ?? 0,
    timestamp: Date.now(),
    account,
    equity,
    netQuoteBalance,
    freeCollateral,
    netDeposits,
    totalUnrealizedPnl,
    totalClosedPnl,
    totalPositionNotional,
    totalMarginUsed,
    totalBorrowedCapital,
    marginHealthRatio: equity > 0 ? ((freeCollateral / equity) * 100) : 100,
    volumes: {
      v24h: volume24h,
      v7d: volume7d,
      v30d: volume30d,
      lifetime: lifetimeVolume
    },
    fees: {
      f24h: fees24h,
      f7d: fees7d,
      f30d: fees30d,
      lifetime: lifetimeFees
    },
    feeTier: {
      current: currentTierObj,
      next: nextTierObj,
      raw: stats?.tradingFeeTier
    },
    positions: positionsList,
    fills,
    fillsStats: {
      totalCount: fills.length,
      makerCount: makerFillsCount,
      takerCount: takerFillsCount,
      closedPnl: totalClosedPnl,
      recentFees: totalFillsFee
    },
    orders,
    openOrders,
    funding,
    totalFundingPayment,
    transfers,
    portfolio,
    marketsMap,
    allMarkets: marketsList,
    feeTiers
  };
}

/**
 * Fetch leaderboard for discovery and top whales
 */
export async function fetchLeaderboard(baseUrl = NETWORKS.mainnet.restUrl, sortBy = 'volume', window = '30d', limit = 20) {
  try {
    const data = await apiGet(baseUrl, '/v1/leaderboard', { sortBy, window, limit });
    return (data.entries || []).map(entry => ({
      ...entry,
      formattedVolume: quantumToUsd(entry.volume),
      formattedFees: quantumToUsd(entry.feesPaid),
      formattedPnl: quantumToUsd(entry.pnl)
    }));
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return [];
  }
}

/**
 * Fetch live markets overview
 */
export async function fetchLiveMarkets(baseUrl = NETWORKS.mainnet.restUrl) {
  try {
    const data = await apiGet(baseUrl, '/v1/markets');
    return data.markets || [];
  } catch (err) {
    console.error('Error fetching markets:', err);
    return [];
  }
}
