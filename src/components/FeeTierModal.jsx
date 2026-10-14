import React from 'react';
import { Award, Zap, Check, X, Shield, ChevronRight } from 'lucide-react';
import { formatUSD, formatNumber } from '../services/arcusApi';

export default function FeeTierModal({ isOpen, onClose, currentTier = {}, feeTiers = [], userVolume30d = 0 }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="tier-icon-wrap">
              <Award size={20} className="text-amber" />
            </div>
            <div>
              <h3 className="modal-title">Arcus Fee Tier Schedule</h3>
              <p className="modal-desc">Volume-based maker and taker fee tiers calculated over a rolling 30-day window.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Current User Tier Highlight */}
        <div className="user-tier-summary-box">
          <div className="tier-left">
            <span className="summary-lbl">Your Current Tier</span>
            <div className="summary-tier-name">
              <Zap size={16} className="text-amber" />
              <span>{currentTier.name || 'Base'} (Level {currentTier.level ?? 0})</span>
            </div>
          </div>
          <div className="tier-right">
            <div className="rate-item">
              <span className="lbl">Maker Fee:</span>
              <span className="val font-mono">{(currentTier.maker_fee_ppm / 100).toFixed(2)} bps</span>
            </div>
            <div className="rate-item">
              <span className="lbl">Taker Fee:</span>
              <span className="val font-mono">{(currentTier.taker_fee_ppm / 100).toFixed(2)} bps</span>
            </div>
            <div className="rate-item">
              <span className="lbl">30D Volume:</span>
              <span className="val font-mono">{formatUSD(userVolume30d)}</span>
            </div>
          </div>
        </div>

        {/* Tier Table */}
        <div className="modal-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>30D Volume Threshold</th>
                <th>Maker Fee</th>
                <th>Taker Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {feeTiers.map(t => {
                const isCurrent = t.level === currentTier.level;
                const makerBps = (t.maker_fee_ppm / 100).toFixed(2);
                const takerBps = (t.taker_fee_ppm / 100).toFixed(2);
                const threshold = t.volume_threshold ? (t.volume_threshold / 1e9) : 0;

                return (
                  <tr key={t.level} className={isCurrent ? 'row-active-tier' : ''}>
                    <td>
                      <div className="tier-name-cell">
                        <span className="font-bold">{t.name}</span>
                        <span className="tier-level-sub">Level {t.level}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono">{threshold === 0 ? '$0' : formatUSD(threshold)}</span>
                    </td>
                    <td>
                      <span className={`font-mono ${t.maker_fee_ppm < 0 ? 'text-green font-bold' : ''}`}>
                        {makerBps} bps {t.maker_fee_ppm < 0 ? '(Rebate)' : ''}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono">{takerBps} bps</span>
                    </td>
                    <td>
                      {isCurrent ? (
                        <span className="current-tier-pill">
                          <Check size={11} /> Current
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <p className="footer-notice">
            * Maker fee rebates (negative fees) are paid directly to your balance on fill execution.
          </p>
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
