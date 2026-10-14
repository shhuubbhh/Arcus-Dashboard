import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Activity, X, ExternalLink, ChevronRight, Check } from 'lucide-react';
import { fetchLeaderboard, formatUSD, truncateAddress } from '../services/arcusApi';

export default function LeaderboardModal({ isOpen, onClose, onSelectAddress, currentAddress, baseUrl }) {
  const [sortBy, setSortBy] = useState('volume'); // 'volume' | 'pnl'
  const [windowTime, setWindowTime] = useState('30d'); // '30d' | '24h' | 'all'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    fetchLeaderboard(baseUrl, sortBy, windowTime, 20)
      .then(entries => {
        if (isMounted) {
          setLeaderboard(entries);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [isOpen, sortBy, windowTime, baseUrl]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container leaderboard-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="tier-icon-wrap trophy">
              <Trophy size={20} className="text-amber" />
            </div>
            <div>
              <h3 className="modal-title">Arcus Protocol Leaderboard</h3>
              <p className="modal-desc">Top perpetual traders by volume and net profit. Click any wallet to view their live dashboard.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Controls */}
        <div className="leaderboard-filter-bar">
          <div className="btn-toggle-group">
            <button
              className={`toggle-btn ${sortBy === 'volume' ? 'active' : ''}`}
              onClick={() => setSortBy('volume')}
            >
              <Activity size={13} />
              Rank by Volume
            </button>
            <button
              className={`toggle-btn ${sortBy === 'pnl' ? 'active' : ''}`}
              onClick={() => setSortBy('pnl')}
            >
              <TrendingUp size={13} />
              Rank by PnL
            </button>
          </div>

          <div className="btn-toggle-group timeframes">
            {['24h', '30d', 'all'].map(w => (
              <button
                key={w}
                className={`toggle-btn sm ${windowTime === w ? 'active' : ''}`}
                onClick={() => setWindowTime(w)}
              >
                {w.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="modal-table-wrap">
          {loading ? (
            <div className="modal-loading-state">
              <div className="spinner" />
              <span>Fetching top Arcus traders...</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="empty-table-state">
              <Trophy size={32} className="empty-icon text-muted" />
              <p>No leaderboard records found for this period.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Trader Address</th>
                  <th>Volume</th>
                  <th>Net PnL</th>
                  <th>Fees Paid</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => {
                  const rank = entry.rank || idx + 1;
                  const isCurrent = (entry.address || '').toLowerCase() === (currentAddress || '').toLowerCase();
                  const pnlNum = entry.formattedPnl || 0;

                  return (
                    <tr 
                      key={entry.address || idx} 
                      className={`table-row-hover ${isCurrent ? 'row-active-tier' : ''}`}
                      onClick={() => {
                        onSelectAddress(entry.address);
                        onClose();
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span className={`rank-pill rank-${rank <= 3 ? rank : 'other'}`}>
                          #{rank}
                        </span>
                      </td>
                      <td>
                        <div className="val-subval-cell">
                          <span className="font-mono font-bold">{truncateAddress(entry.address, 6, 6)}</span>
                          {isCurrent && <span className="text-cyan text-xs">Currently Viewing</span>}
                        </div>
                      </td>
                      <td>
                        <span className="font-mono font-bold">{formatUSD(entry.formattedVolume)}</span>
                      </td>
                      <td>
                        <span className={`font-mono font-bold ${pnlNum >= 0 ? 'text-green' : 'text-rose'}`}>
                          {pnlNum >= 0 ? '+' : ''}{formatUSD(pnlNum)}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-muted">{formatUSD(entry.formattedFees)}</span>
                      </td>
                      <td>
                        <button className="action-select-btn">
                          View Dashboard <ChevronRight size={13} />
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
    </div>
  );
}
