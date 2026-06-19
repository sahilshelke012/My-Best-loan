import React from 'react';

export default function StatsDashboard({ 
  summary, 
  originalSummary, 
  currency, 
  currencySymbols 
}) {

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency === 'INR' ? 'INR' : currency,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const hasExtra = summary.totalInterestSaved > 0 || summary.paymentsSaved > 0;

  // Percentage of principal vs interest
  const totalCost = summary.totalPaid;
  const principalPercentage = totalCost > 0 ? (summary.principal / totalCost) * 100 : 0;
  const interestPercentage = totalCost > 0 ? (summary.totalInterest / totalCost) * 100 : 0;

  return (
    <div className="stats-dashboard">
      <div className="stats-grid">
        
        {/* Monthly Payment Card */}
        <div className="stat-card payment-card">
          <div className="stat-glow-effect" />
          <span className="stat-label">Scheduled Payment ({summary.frequencyLabel})</span>
          <h3 className="stat-value">{formatCurrency(summary.periodicPayment)}</h3>
          {hasExtra && (
            <div className="stat-subtext">
              <span>+ {formatCurrency(summary.extraPayment)} extra = </span>
              <strong className="text-highlight">{formatCurrency(summary.periodicPayment + summary.extraPayment)}</strong>
            </div>
          )}
        </div>

        {/* Total Interest Card */}
        <div className="stat-card interest-card">
          <div className="stat-glow-effect" />
          <span className="stat-label">Total Interest</span>
          <h3 className="stat-value">{formatCurrency(summary.totalInterest)}</h3>
          {hasExtra && originalSummary && (
            <div className="stat-subtext text-green">
              Saved: <strong>{formatCurrency(summary.totalInterestSaved)}</strong>
            </div>
          )}
        </div>

        {/* Total Cost Card */}
        <div className="stat-card cost-card">
          <div className="stat-glow-effect" />
          <span className="stat-label">Total Paid (Principal + Interest)</span>
          <h3 className="stat-value">{formatCurrency(summary.totalPaid)}</h3>
          <div className="stat-bar-ratio">
            <div className="stat-ratio-track">
              <div 
                className="stat-ratio-fill principal-fill" 
                style={{ width: `${principalPercentage}%` }}
                title={`Principal: ${principalPercentage.toFixed(1)}%`}
              />
              <div 
                className="stat-ratio-fill interest-fill" 
                style={{ width: `${interestPercentage}%` }}
                title={`Interest: ${interestPercentage.toFixed(1)}%`}
              />
            </div>
            <div className="stat-ratio-labels">
              <span className="ratio-label-dot principal-dot">Principal: {principalPercentage.toFixed(1)}%</span>
              <span className="ratio-label-dot interest-dot">Interest: {interestPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Payoff Date Card */}
        <div className="stat-card date-card">
          <div className="stat-glow-effect" />
          <span className="stat-label">Payoff Date</span>
          <h3 className="stat-value">{summary.payoffDate || 'N/A'}</h3>
          {hasExtra && (
            <div className="stat-subtext text-purple">
              Paid off <strong>{summary.paymentsSaved} {summary.paymentsSaved === 1 ? summary.periodUnitSingle : summary.periodUnitPlural} earlier</strong>
            </div>
          )}
        </div>

      </div>

      {/* Savings Summary Banner (Only if Prepayments Exist) */}
      {hasExtra && (
        <div className="savings-banner animated-slide-in">
          <div className="savings-banner-glow" />
          <div className="savings-banner-icon">🚀</div>
          <div className="savings-banner-content">
            <h4>Prepayment Benefits Active!</h4>
            <p>
              By adding extra payments, you will pay off the loan in{' '}
              <span className="bold-highlight">{summary.actualTermPeriods} {summary.actualTermPeriods === 1 ? summary.periodUnitSingle : summary.periodUnitPlural}</span> instead of{' '}
              <span className="original-term-strike">{summary.originalTermPeriods} {summary.originalTermPeriods === 1 ? summary.periodUnitSingle : summary.periodUnitPlural}</span>.{' '}
              You save a total of <span className="bold-highlight">{formatCurrency(summary.totalInterestSaved)}</span> in interest charges!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
