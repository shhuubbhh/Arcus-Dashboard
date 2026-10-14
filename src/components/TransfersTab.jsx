import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Repeat, ExternalLink, ShieldCheck } from 'lucide-react';
import { formatUSD, formatTimestamp, formatRelativeTime, truncateAddress } from '../services/arcusApi';

export default function TransfersTab({ transfers = [] }) {
  return (
    <div className="card table-card">
      <div className="table-header-toolbar">
        <div className="toolbar-left">
          <div className="section-title-wrap">
            <h3 className="section-title">
              <ShieldCheck size={18} className="title-icon text-cyan" />
              Deposits, Withdrawals & Transfers
            </h3>
            <span className="count-badge">{transfers.length} Records</span>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        {transfers.length === 0 ? (
          <div className="empty-table-state">
            <ShieldCheck size={36} className="empty-icon text-cyan" />
            <h4>No transfer history found</h4>
            <p>No on-chain deposits or withdrawals have been recorded for this wallet address yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Asset</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Transaction Hash</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((tr, idx) => {
                const isDeposit = (tr.type || '').toUpperCase() === 'DEPOSIT';
                const isWithdrawal = (tr.type || '').toUpperCase() === 'WITHDRAWAL';
                const amountNum = parseFloat(tr.amount || 0);

                return (
                  <tr key={`${tr.id || tr.txHash || idx}`} className="table-row-hover">
                    <td>
                      <div className="val-subval-cell">
                        <span className="font-mono">{formatTimestamp(tr.timestamp || tr.createdAt)}</span>
                        <span className="sub-val">{formatRelativeTime(tr.timestamp || tr.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`side-badge ${isDeposit ? 'long' : 'short'}`}>
                        {isDeposit ? <ArrowDownLeft size={13} /> : isWithdrawal ? <ArrowUpRight size={13} /> : <Repeat size={13} />}
                        {tr.type || 'TRANSFER'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono font-bold">{tr.asset || 'USDG'}</span>
                    </td>
                    <td>
                      <span className={`font-mono font-bold ${isDeposit ? 'text-green' : 'text-rose'}`}>
                        {formatUSD(amountNum)}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge filled">
                        {tr.status || 'CONFIRMED'}
                      </span>
                    </td>
                    <td>
                      {tr.txHash ? (
                        <a 
                          href={`https://explorer.robinhood.com/tx/${tr.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="tx-hash-link font-mono"
                        >
                          <span>{truncateAddress(tr.txHash, 6, 4)}</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
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
