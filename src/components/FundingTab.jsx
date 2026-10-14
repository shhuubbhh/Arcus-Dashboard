import React, { useMemo } from 'react';
import { DollarSign, Zap, TrendingUp, TrendingDown, Clock, Search } from 'lucide-react';
import { formatUSD, formatTimestamp, formatRelativeTime, formatNumber, formatPercent } from '../services/arcusApi';

export default function FundingTab({ funding = [] }) {
  const totalFunding = useMemo(() => {
    return funding.reduce((acc, f) => acc + parseFloat(f.payment || 0), 0);
  }, [funding]);

  return (
    <div className="card table-card">
      <div className="table-header-toolbar">
        <div className="toolbar-left">
          <div className="section-title-wrap">
            <h3 className="section-title">
              <Zap size={18} className="title-icon text-amber" />
              Funding Payment Cashflows
            </h3>
            <span className="count-badge">{funding.length} Payments</span>
          </div>

          <div className="trades-summary-mini">
            <div className="mini-stat">
              <span className="lbl">Net Funding Cashflow:</span>
              <span className={`val font-mono ${totalFunding >= 0 ? 'text-green' : 'text-rose'}`}>
                {formatUSD(totalFunding, 4)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="lbl">Cadence:</span>
              <span className="val font-mono">Hourly (1h)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        {funding.length === 0 ? (
          <div className="empty-table-state">
            <Zap size={36} className="empty-icon text-amber" />
            <h4>No funding payment records</h4>
            <p>This address has no recorded funding payments in the selected window.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Market</th>
                <th>Position Size</th>
                <th>Funding Rate</th>
                <th>Payment Amount (USD)</th>
                <th>Flow Direction</th>
              </tr>
            </thead>
            <tbody>
              {funding.map((f, idx) => {
                const paymentNum = parseFloat(f.payment || 0);
                const rateNum = parseFloat(f.fundingRate || 0);
                const sizeNum = parseFloat(f.size || 0);
                const isReceived = paymentNum >= 0;

                return (
                  <tr key={`${f.time}_${idx}`} className="table-row-hover">
                    <td>
                      <div className="val-subval-cell">
                        <span className="font-mono">{formatTimestamp(f.time)}</span>
                        <span className="sub-val">{formatRelativeTime(f.time)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono font-bold">{f.marketDisplayName}</span>
                    </td>
                    <td>
                      <span className="font-mono">{formatNumber(sizeNum, 4)}</span>
                    </td>
                    <td>
                      <span className="font-mono">{formatPercent(rateNum * 100, 4)}</span>
                    </td>
                    <td>
                      <span className={`font-mono font-bold ${isReceived ? 'text-green' : 'text-rose'}`}>
                        {formatUSD(paymentNum, 4)}
                      </span>
                    </td>
                    <td>
                      <span className={`flow-badge ${isReceived ? 'received' : 'paid'}`}>
                        {isReceived ? 'Received (Credit)' : 'Paid (Debit)'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
