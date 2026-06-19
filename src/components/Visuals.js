import React, { useState, useRef } from 'react';

export default function Visuals({ payments, currency, currencySymbols, originalPayments }) {
  const [activeTab, setActiveTab] = useState('payoff'); // 'payoff' | 'yearly'
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });
  const svgRef = useRef(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency === 'INR' ? 'INR' : currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Group payments by year for the stacked bar chart
  const getYearlyData = (paymentsList) => {
    if (!paymentsList || paymentsList.length === 0) return [];
    
    const yearlyMap = {};
    paymentsList.forEach((p) => {
      const date = new Date(p.date);
      const year = date.getFullYear();
      if (!yearlyMap[year]) {
        yearlyMap[year] = { year, principal: 0, interest: 0, extra: 0, total: 0 };
      }
      yearlyMap[year].principal += p.principal;
      yearlyMap[year].interest += p.interest;
      yearlyMap[year].extra += p.extraPayment || 0;
      yearlyMap[year].total += p.principal + p.interest + (p.extraPayment || 0);
    });

    return Object.values(yearlyMap).sort((a, b) => a.year - b.year);
  };

  const yearlyData = getYearlyData(payments);

  // Constants for chart drawing
  const svgWidth = 600;
  const svgHeight = 250;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // 1. Calculations for Balance Payoff Line/Area Chart
  const getPayoffPoints = (dataList) => {
    if (!dataList || dataList.length === 0) return [];
    const points = [];
    const n = dataList.length;
    
    // Always include start point (payment 0)
    const initialBalance = dataList[0].balance + dataList[0].principal + (dataList[0].extraPayment || 0);
    points.push({ index: 0, balance: initialBalance, dateLabel: 'Start', principalPaid: 0, interestPaid: 0 });

    // Sample down if there are many payments to keep SVG rendering performant
    const step = Math.max(1, Math.ceil(n / 40));
    for (let i = 0; i < n; i += step) {
      points.push({
        index: i + 1,
        balance: dataList[i].balance,
        dateLabel: dataList[i].dateLabel,
        principalPaid: dataList[i].totalPrincipalPaid,
        interestPaid: dataList[i].totalInterestPaid,
      });
    }

    // Always include final payment if not already there
    if ((n - 1) % step !== 0) {
      points.push({
        index: n,
        balance: dataList[n - 1].balance,
        dateLabel: dataList[n - 1].dateLabel,
        principalPaid: dataList[n - 1].totalPrincipalPaid,
        interestPaid: dataList[n - 1].totalInterestPaid,
      });
    }
    return points;
  };

  const currentPoints = getPayoffPoints(payments);
  const baselinePoints = originalPayments ? getPayoffPoints(originalPayments) : [];

  // Find max value and term counts to scale
  const maxBalance = Math.max(
    currentPoints[0]?.balance || 0,
    baselinePoints[0]?.balance || 0,
    1000
  );
  const maxTerm = Math.max(payments.length, originalPayments ? originalPayments.length : 0);

  // Helper to map (index, balance) -> (x, y) coordinates
  const getCoords = (index, balance) => {
    const x = paddingLeft + (index / maxTerm) * chartWidth;
    const y = paddingTop + chartHeight - (balance / maxBalance) * chartHeight;
    return { x, y };
  };

  // Build SVG Path strings
  const buildPath = (points, isArea = false) => {
    if (points.length === 0) return '';
    let d = '';
    
    points.forEach((pt, i) => {
      const { x, y } = getCoords(pt.index, pt.balance);
      if (i === 0) {
        d += `M ${x} ${y}`;
      } else {
        d += ` L ${x} ${y}`;
      }
    });

    if (isArea) {
      const firstPt = getCoords(points[0].index, 0);
      const lastPt = getCoords(points[points.length - 1].index, 0);
      d += ` L ${lastPt.x} ${lastPt.y} L ${firstPt.x} ${firstPt.y} Z`;
    }
    return d;
  };

  const currentAreaPath = buildPath(currentPoints, true);
  const currentLinePath = buildPath(currentPoints, false);
  
  const baselineAreaPath = originalPayments ? buildPath(baselinePoints, true) : '';
  const baselineLinePath = originalPayments ? buildPath(baselinePoints, false) : '';

  // Handle payoff chart mouse movements for custom tooltip
  const handleMouseMovePayoff = (e) => {
    if (!svgRef.current || currentPoints.length === 0) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Convert mouseX to payment index
    const relativeX = mouseX - paddingLeft;
    if (relativeX < 0 || relativeX > chartWidth) {
      setTooltip({ show: false, x: 0, y: 0, data: null });
      return;
    }

    const hoveredIndexRatio = relativeX / chartWidth;
    const hoveredPaymentIndex = hoveredIndexRatio * maxTerm;

    // Find the closest point in current points
    let closestPt = currentPoints[0];
    let minDiff = Math.abs(currentPoints[0].index - hoveredPaymentIndex);
    
    currentPoints.forEach((pt) => {
      const diff = Math.abs(pt.index - hoveredPaymentIndex);
      if (diff < minDiff) {
        minDiff = diff;
        closestPt = pt;
      }
    });

    // Check if there is an original baseline point at a similar index
    let baselinePt = null;
    if (originalPayments && baselinePoints.length > 0) {
      let bMinDiff = Math.abs(baselinePoints[0].index - hoveredPaymentIndex);
      baselinePt = baselinePoints[0];
      baselinePoints.forEach((pt) => {
        const diff = Math.abs(pt.index - hoveredPaymentIndex);
        if (diff < bMinDiff) {
          bMinDiff = diff;
          baselinePt = pt;
        }
      });
    }

    const { x, y } = getCoords(closestPt.index, closestPt.balance);

    setTooltip({
      show: true,
      x: x + rect.left - window.scrollX,
      y: y + rect.top - window.scrollY - 100,
      data: {
        type: 'payoff',
        dateLabel: closestPt.dateLabel,
        index: closestPt.index,
        balance: closestPt.balance,
        baselineBalance: baselinePt ? baselinePt.balance : null,
        principalPaid: closestPt.principalPaid,
        interestPaid: closestPt.interestPaid,
      }
    });
  };

  // 2. Stacked Bar Chart calculations (Yearly data)
  const maxYearlyTotal = Math.max(...yearlyData.map(d => d.total), 1000);
  const barSpacing = chartWidth / yearlyData.length;
  const barWidth = Math.max(8, barSpacing * 0.5);

  const handleMouseMoveBar = (e, data, x, y) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    setTooltip({
      show: true,
      x: x + rect.left - window.scrollX,
      y: y + rect.top - window.scrollY - 110,
      data: {
        type: 'yearly',
        year: data.year,
        principal: data.principal,
        interest: data.interest,
        extra: data.extra,
        total: data.total,
      }
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, data: null });
  };

  return (
    <div className="visuals-panel">
      <div className="panel-header-tabs">
        <h3 className="panel-title">Visual Analytics</h3>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'payoff' ? 'active' : ''}`}
            onClick={() => setActiveTab('payoff')}
          >
            Balance Curve
          </button>
          <button 
            className={`tab-btn ${activeTab === 'yearly' ? 'active' : ''}`}
            onClick={() => setActiveTab('yearly')}
          >
            Yearly breakdown
          </button>
        </div>
      </div>

      <div className="chart-container" onMouseLeave={handleMouseLeave}>
        {activeTab === 'payoff' ? (
          /* BALANCE PAYOFF CHART */
          <svg 
            ref={svgRef} 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
            className="svg-chart"
            onMouseMove={handleMouseMovePayoff}
          >
            <defs>
              <linearGradient id="currentAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="baselineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--text-muted)" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="var(--text-muted)" stopOpacity="0"/>
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = paddingTop + ratio * chartHeight;
              const val = maxBalance * (1 - ratio);
              return (
                <g key={idx}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={svgWidth - paddingRight} 
                    y2={y} 
                    className="chart-grid-line" 
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={y + 4} 
                    className="chart-y-text"
                  >
                    {formatCurrency(val).replace(/\.00$/, '')}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Labels (Timeline) */}
            {currentPoints.filter((_, idx) => idx % Math.max(1, Math.floor(currentPoints.length / 5)) === 0).map((pt, idx) => {
              const { x } = getCoords(pt.index, pt.balance);
              return (
                <g key={idx}>
                  <text 
                    x={x} 
                    y={svgHeight - paddingBottom + 18} 
                    className="chart-x-text"
                  >
                    {pt.dateLabel === 'Start' ? 'Start' : pt.dateLabel}
                  </text>
                  <line 
                    x1={x} 
                    y1={svgHeight - paddingBottom} 
                    x2={x} 
                    y2={svgHeight - paddingBottom + 4} 
                    className="chart-tick-line"
                  />
                </g>
              );
            })}

            {/* Baseline scenario path (if comparison is available) */}
            {originalPayments && baselineLinePath && (
              <>
                <path d={baselineAreaPath} fill="url(#baselineAreaGrad)" />
                <path d={baselineLinePath} className="baseline-line-path" />
              </>
            )}

            {/* Current scenario path */}
            {currentLinePath && (
              <>
                <path d={currentAreaPath} fill="url(#currentAreaGrad)" />
                <path d={currentLinePath} className="current-line-path" />
              </>
            )}

            {/* Legend */}
            <g transform={`translate(${paddingLeft + 10}, ${paddingTop + 10})`} className="chart-legend">
              <rect x="0" y="0" width="8" height="8" fill="var(--primary)" rx="2" />
              <text x="14" y="8" className="legend-text">Active Loan</text>
              {originalPayments && (
                <>
                  <rect x="110" y="0" width="8" height="8" fill="var(--text-muted)" rx="2" />
                  <text x="124" y="8" className="legend-text">Original (No Prepayments)</text>
                </>
              )}
            </g>
          </svg>
        ) : (
          /* YEARLY PRINCIPAL VS INTEREST STACKED BAR CHART */
          <svg 
            ref={svgRef} 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
            className="svg-chart"
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = paddingTop + ratio * chartHeight;
              const val = maxYearlyTotal * (1 - ratio);
              return (
                <g key={idx}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={svgWidth - paddingRight} 
                    y2={y} 
                    className="chart-grid-line" 
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={y + 4} 
                    className="chart-y-text"
                  >
                    {formatCurrency(val).replace(/\.00$/, '')}
                  </text>
                </g>
              );
            })}

            {/* Draw Stacked Bars */}
            {yearlyData.map((data, idx) => {
              const xCenter = paddingLeft + idx * barSpacing + barSpacing / 2;
              
              // Heights
              const interestHeight = (data.interest / maxYearlyTotal) * chartHeight;
              const principalHeight = (data.principal / maxYearlyTotal) * chartHeight;
              const extraHeight = (data.extra / maxYearlyTotal) * chartHeight;

              // Top Y coordinates
              const yInterest = paddingTop + chartHeight - interestHeight;
              const yPrincipal = yInterest - principalHeight;
              const yExtra = yPrincipal - extraHeight;

              return (
                <g 
                  key={data.year}
                  onMouseMove={(e) => handleMouseMoveBar(e, data, xCenter, yExtra)}
                  onMouseLeave={handleMouseLeave}
                  className="chart-bar-group"
                >
                  {/* Interest portion */}
                  {interestHeight > 0 && (
                    <rect
                      x={xCenter - barWidth / 2}
                      y={yInterest}
                      width={barWidth}
                      height={interestHeight}
                      fill="var(--danger)"
                      opacity="0.85"
                      rx={!data.principal && !data.extra ? 2 : 0}
                    />
                  )}

                  {/* Principal portion */}
                  {principalHeight > 0 && (
                    <rect
                      x={xCenter - barWidth / 2}
                      y={yPrincipal}
                      width={barWidth}
                      height={principalHeight}
                      fill="var(--info)"
                      opacity="0.85"
                      rx={!data.extra ? 2 : 0}
                    />
                  )}

                  {/* Extra prepayment portion */}
                  {extraHeight > 0 && (
                    <rect
                      x={xCenter - barWidth / 2}
                      y={yExtra}
                      width={barWidth}
                      height={extraHeight}
                      fill="var(--success)"
                      opacity="0.95"
                      rx={2}
                    />
                  )}

                  {/* Year text */}
                  {idx % Math.max(1, Math.ceil(yearlyData.length / 8)) === 0 && (
                    <text
                      x={xCenter}
                      y={svgHeight - paddingBottom + 18}
                      className="chart-x-text text-anchor-middle"
                    >
                      {data.year}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Legend for Stacked Bars */}
            <g transform={`translate(${paddingLeft + 10}, ${paddingTop + 10})`} className="chart-legend">
              <rect x="0" y="0" width="8" height="8" fill="var(--danger)" rx="2" />
              <text x="14" y="8" className="legend-text">Interest</text>
              
              <rect x="90" y="0" width="8" height="8" fill="var(--info)" rx="2" />
              <text x="104" y="8" className="legend-text">Principal</text>
              
              {yearlyData.some(d => d.extra > 0) && (
                <>
                  <rect x="180" y="0" width="8" height="8" fill="var(--success)" rx="2" />
                  <text x="194" y="8" className="legend-text">Extra Prepay</text>
                </>
              )}
            </g>
          </svg>
        )}
      </div>

      {/* RENDER TOOLTIP (Portal styled element) */}
      {tooltip.show && tooltip.data && (
        <div 
          className="chart-tooltip" 
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.data.type === 'payoff' ? (
            <>
              <div className="tooltip-title">{tooltip.data.dateLabel} (Pmt #{tooltip.data.index})</div>
              <div className="tooltip-row">
                <span className="tooltip-color-dot active-dot" />
                <span>Balance:</span>
                <strong>{formatCurrency(tooltip.data.balance)}</strong>
              </div>
              {tooltip.data.baselineBalance !== null && (
                <div className="tooltip-row">
                  <span className="tooltip-color-dot baseline-dot" />
                  <span>Orig Balance:</span>
                  <strong>{formatCurrency(tooltip.data.baselineBalance)}</strong>
                </div>
              )}
              <div className="tooltip-divider" />
              <div className="tooltip-row secondary-text">
                <span>Principal Paid:</span>
                <span>{formatCurrency(tooltip.data.principalPaid)}</span>
              </div>
              <div className="tooltip-row secondary-text">
                <span>Interest Paid:</span>
                <span>{formatCurrency(tooltip.data.interestPaid)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="tooltip-title">Year {tooltip.data.year}</div>
              <div className="tooltip-row">
                <span className="tooltip-color-dot interest-dot" />
                <span>Interest Paid:</span>
                <strong>{formatCurrency(tooltip.data.interest)}</strong>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-color-dot principal-dot" />
                <span>Principal Paid:</span>
                <strong>{formatCurrency(tooltip.data.principal)}</strong>
              </div>
              {tooltip.data.extra > 0 && (
                <div className="tooltip-row">
                  <span className="tooltip-color-dot extra-dot" />
                  <span>Extra Prepay:</span>
                  <strong className="text-green">{formatCurrency(tooltip.data.extra)}</strong>
                </div>
              )}
              <div className="tooltip-divider" />
              <div className="tooltip-row">
                <span>Total Paid:</span>
                <strong>{formatCurrency(tooltip.data.total)}</strong>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
