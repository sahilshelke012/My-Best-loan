import React from 'react';

export default function ComparisonPanel({
  currentInputs,
  currentSummary,
  baselineSummary,
  scenarioA,
  scenarioB,
  onSaveScenario,
  currency,
  currencySymbols
}) {

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency === 'INR' ? 'INR' : currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getDiffClass = (val) => {
    if (val < 0) return 'diff-negative'; // scenario B is cheaper
    if (val > 0) return 'diff-positive'; // scenario B is more expensive
    return 'diff-neutral';
  };

  const formatDiff = (val, isTime = false) => {
    if (val === 0) return 'No Difference';
    const absVal = Math.abs(val);
    const direction = val < 0 ? 'Saved' : 'More';
    
    if (isTime) {
      return `${absVal.toFixed(1)} periods ${val < 0 ? 'earlier' : 'longer'}`;
    }
    return `${direction} ${formatCurrency(absVal)}`;
  };

  return (
    <div className="comparison-panel">
      
      {/* 1. AUTO PREPAYMENT ADVANTAGE SECTION */}
      <h3 className="panel-title">Prepayment Advantage Analysis</h3>
      <p className="panel-description">
        See how much time and money you save under your current loan parameters by adding extra payments.
      </p>

      {baselineSummary && currentSummary && (
        <div className="auto-compare-grid">
          <div className="compare-card">
            <h4>Without Prepayments</h4>
            <div className="compare-stat">
              <span className="compare-label">Periodic Payment:</span>
              <span className="compare-val">{formatCurrency(baselineSummary.periodicPayment)}</span>
            </div>
            <div className="compare-stat">
              <span className="compare-label">Total Interest Paid:</span>
              <span className="compare-val text-red">{formatCurrency(baselineSummary.totalInterest)}</span>
            </div>
            <div className="compare-stat">
              <span className="compare-label">Total Cost:</span>
              <span className="compare-val">{formatCurrency(baselineSummary.totalPaid)}</span>
            </div>
            <div className="compare-stat">
              <span className="compare-label">Actual Loan Term:</span>
              <span className="compare-val">{baselineSummary.originalTermPeriods} {baselineSummary.periodUnitPlural}</span>
            </div>
          </div>

          <div className="compare-card highlight-card">
            <div className="compare-badge-glow" />
            <h4>With Prepayments</h4>
            <div className="compare-stat">
              <span className="compare-label">Base + Extra:</span>
              <span className="compare-val">{formatCurrency(currentSummary.periodicPayment)} + {formatCurrency(currentSummary.extraPayment)}</span>
            </div>
            <div className="compare-stat">
              <span className="compare-label">Total Interest Paid:</span>
              <span className="compare-val text-green">{formatCurrency(currentSummary.totalInterest)}</span>
            </div>
            <div className="compare-stat">
              <span className="compare-label">Total Cost:</span>
              <span className="compare-val">{formatCurrency(currentSummary.totalPaid)}</span>
            </div>
            <div className="compare-stat">
              <span className="compare-label">Actual Loan Term:</span>
              <span className="compare-val text-purple">{currentSummary.actualTermPeriods} {currentSummary.periodUnitPlural}</span>
            </div>
          </div>

          <div className="compare-delta-card">
            <h4>Net Savings</h4>
            <div className="delta-value-box">
              <span className="delta-label">Interest Saved</span>
              <span className="delta-amount text-green">
                {formatCurrency(currentSummary.totalInterestSaved)}
              </span>
            </div>
            <div className="delta-value-box">
              <span className="delta-label">Time Saved</span>
              <span className="delta-amount text-purple">
                {currentSummary.paymentsSaved} {currentSummary.paymentsSaved === 1 ? currentSummary.periodUnitSingle : currentSummary.periodUnitPlural}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="divider-glow" />

      {/* 2. CUSTOM SCENARIO COMPARATOR (A vs B) */}
      <div className="comparison-header-split">
        <h3 className="panel-title">Custom Scenario Comparator</h3>
        <div className="scenario-save-actions">
          <button onClick={() => onSaveScenario('A')} className="scenario-save-btn save-a">
            Save Current as Scenario A
          </button>
          <button onClick={() => onSaveScenario('B')} className="scenario-save-btn save-b">
            Save Current as Scenario B
          </button>
        </div>
      </div>
      <p className="panel-description">
        Modify your parameters (e.g., test a different interest rate or duration), then save to compare Scenario A vs. Scenario B.
      </p>

      <div className="scenarios-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Factor</th>
              <th className="scenario-col-a">Scenario A</th>
              <th className="scenario-col-b">Scenario B</th>
              <th>Delta (B vs A)</th>
            </tr>
          </thead>
          <tbody>
            {scenarioA && scenarioB ? (
              <>
                <tr>
                  <td className="factor-name">Loan Amount</td>
                  <td>{formatCurrency(scenarioA.inputs.loanAmount)}</td>
                  <td>{formatCurrency(scenarioB.inputs.loanAmount)}</td>
                  <td className={getDiffClass(scenarioB.inputs.loanAmount - scenarioA.inputs.loanAmount)}>
                    {formatDiff(scenarioB.inputs.loanAmount - scenarioA.inputs.loanAmount)}
                  </td>
                </tr>
                <tr>
                  <td className="factor-name">Interest Rate</td>
                  <td>{scenarioA.inputs.interestRate.toFixed(2)}%</td>
                  <td>{scenarioB.inputs.interestRate.toFixed(2)}%</td>
                  <td className={getDiffClass(scenarioB.inputs.interestRate - scenarioA.inputs.interestRate)}>
                    {scenarioB.inputs.interestRate > scenarioA.inputs.interestRate ? '+' : ''}
                    {(scenarioB.inputs.interestRate - scenarioA.inputs.interestRate).toFixed(2)}%
                  </td>
                </tr>
                <tr>
                  <td className="factor-name">Term</td>
                  <td>{scenarioA.inputs.term} {scenarioA.inputs.termType}</td>
                  <td>{scenarioB.inputs.term} {scenarioB.inputs.termType}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td className="factor-name">Frequency</td>
                  <td>{scenarioA.inputs.frequency}</td>
                  <td>{scenarioB.inputs.frequency}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td className="factor-name">Monthly Extra Prepay</td>
                  <td>{formatCurrency(scenarioA.inputs.extraPayment)}</td>
                  <td>{formatCurrency(scenarioB.inputs.extraPayment)}</td>
                  <td className={getDiffClass(scenarioB.inputs.extraPayment - scenarioA.inputs.extraPayment)}>
                    {formatDiff(scenarioB.inputs.extraPayment - scenarioA.inputs.extraPayment)}
                  </td>
                </tr>
                <tr className="divider-row"><td colSpan="4"></td></tr>
                <tr className="table-highlight-row">
                  <td className="factor-name">Scheduled Payment</td>
                  <td>{formatCurrency(scenarioA.summary.periodicPayment)}</td>
                  <td>{formatCurrency(scenarioB.summary.periodicPayment)}</td>
                  <td className={getDiffClass(scenarioB.summary.periodicPayment - scenarioA.summary.periodicPayment)}>
                    {formatDiff(scenarioB.summary.periodicPayment - scenarioA.summary.periodicPayment)}
                  </td>
                </tr>
                <tr>
                  <td className="factor-name">Total Interest Paid</td>
                  <td className="text-red">{formatCurrency(scenarioA.summary.totalInterest)}</td>
                  <td className="text-red">{formatCurrency(scenarioB.summary.totalInterest)}</td>
                  <td className={getDiffClass(scenarioB.summary.totalInterest - scenarioA.summary.totalInterest)}>
                    {formatDiff(scenarioB.summary.totalInterest - scenarioA.summary.totalInterest)}
                  </td>
                </tr>
                <tr>
                  <td className="factor-name">Total Paid Overall</td>
                  <td>{formatCurrency(scenarioA.summary.totalPaid)}</td>
                  <td>{formatCurrency(scenarioB.summary.totalPaid)}</td>
                  <td className={getDiffClass(scenarioB.summary.totalPaid - scenarioA.summary.totalPaid)}>
                    {formatDiff(scenarioB.summary.totalPaid - scenarioA.summary.totalPaid)}
                  </td>
                </tr>
                <tr>
                  <td className="factor-name">Actual Term</td>
                  <td>{scenarioA.summary.actualTermPeriods} {scenarioA.summary.periodUnitPlural}</td>
                  <td>{scenarioB.summary.actualTermPeriods} {scenarioB.summary.periodUnitPlural}</td>
                  <td className={getDiffClass(scenarioB.summary.actualTermPeriods - scenarioA.summary.actualTermPeriods)}>
                    {formatDiff(scenarioB.summary.actualTermPeriods - scenarioA.summary.actualTermPeriods, true)}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan="4" className="comparison-placeholder-cell">
                  <div className="placeholder-content">
                    <p>💾 Capture scenarios to run a side-by-side comparison matrix.</p>
                    <div className="placeholder-buttons">
                      {!scenarioA && (
                        <button onClick={() => onSaveScenario('A')} className="scenario-save-btn save-a">
                          Save active parameters as Scenario A
                        </button>
                      )}
                      {!scenarioB && (
                        <button onClick={() => onSaveScenario('B')} className="scenario-save-btn save-b">
                          Save active parameters as Scenario B
                        </button>
                      )}
                    </div>
                    {scenarioA && <p className="status-indicator">✅ Scenario A is saved. Capture Scenario B to view side-by-side delta.</p>}
                    {scenarioB && <p className="status-indicator">✅ Scenario B is saved. Capture Scenario A to view side-by-side delta.</p>}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
