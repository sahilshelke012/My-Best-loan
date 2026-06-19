import React from 'react';

export default function CalculatorInputs({ inputs, setInputs, currency, currencySymbols }) {
  const handleChange = (key, value) => {
    setInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const symbol = currencySymbols[currency] || currency;

  // Formatting helpers for slider labels
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency === 'INR' ? 'INR' : currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="calculator-inputs-panel">
      <h2 className="panel-title">Loan Parameters</h2>
      
      {/* Loan Amount */}
      <div className="input-group">
        <div className="input-header">
          <label htmlFor="loanAmount">Loan Amount</label>
          <span className="input-value-badge">{formatCurrency(inputs.loanAmount)}</span>
        </div>
        <div className="input-with-symbol">
          <span className="currency-symbol-addon">{symbol}</span>
          <input
            id="loanAmount"
            type="number"
            value={inputs.loanAmount}
            onChange={(e) => handleChange('loanAmount', Math.max(0, parseFloat(e.target.value) || 0))}
            className="styled-numeric-input"
            min="1000"
            max="100000000"
          />
        </div>
        <input
          type="range"
          min="50000"
          max="50000000"
          step="50000"
          value={inputs.loanAmount}
          onChange={(e) => handleChange('loanAmount', parseFloat(e.target.value))}
          className="styled-slider"
        />
        <div className="slider-labels">
          <span>{symbol}50K</span>
          <span>{symbol}25M</span>
          <span>{symbol}50M</span>
        </div>
      </div>

      {/* Interest Rate */}
      <div className="input-group">
        <div className="input-header">
          <label htmlFor="interestRate">Interest Rate (Annual %)</label>
          <span className="input-value-badge">{inputs.interestRate.toFixed(2)}%</span>
        </div>
        <div className="input-with-symbol">
          <input
            id="interestRate"
            type="number"
            step="0.05"
            value={inputs.interestRate}
            onChange={(e) => handleChange('interestRate', Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
            className="styled-numeric-input"
            min="0.1"
            max="100"
          />
          <span className="currency-symbol-addon">%</span>
        </div>
        <input
          type="range"
          min="1"
          max="25"
          step="0.05"
          value={inputs.interestRate}
          onChange={(e) => handleChange('interestRate', parseFloat(e.target.value))}
          className="styled-slider interest-slider"
        />
        <div className="slider-labels">
          <span>1%</span>
          <span>13%</span>
          <span>25%</span>
        </div>
      </div>

      {/* Loan Term */}
      <div className="input-row-split">
        <div className="input-group flex-2">
          <div className="input-header">
            <label htmlFor="term">Loan Term</label>
            <span className="input-value-badge">
              {inputs.term} {inputs.termType === 'years' ? (inputs.term === 1 ? 'Year' : 'Years') : (inputs.term === 1 ? 'Month' : 'Months')}
            </span>
          </div>
          <input
            id="term"
            type="number"
            value={inputs.term}
            onChange={(e) => handleChange('term', Math.max(1, parseInt(e.target.value) || 1))}
            className="styled-numeric-input"
            min="1"
            max={inputs.termType === 'years' ? 50 : 600}
          />
        </div>
        
        <div className="input-group flex-1">
          <label htmlFor="termType">Unit</label>
          <select
            id="termType"
            value={inputs.termType}
            onChange={(e) => {
              const newType = e.target.value;
              let newVal = inputs.term;
              if (newType === 'years' && inputs.termType === 'months') {
                newVal = Math.max(1, Math.round(inputs.term / 12));
              } else if (newType === 'months' && inputs.termType === 'years') {
                newVal = inputs.term * 12;
              }
              setInputs(prev => ({ ...prev, termType: newType, term: newVal }));
            }}
            className="styled-select"
          >
            <option value="years">Years</option>
            <option value="months">Months</option>
          </select>
        </div>
      </div>

      {/* Term Slider */}
      <div className="input-group margin-top-neg">
        <input
          type="range"
          min="1"
          max={inputs.termType === 'years' ? 40 : 480}
          step="1"
          value={inputs.term}
          onChange={(e) => handleChange('term', parseInt(e.target.value))}
          className="styled-slider term-slider"
        />
        <div className="slider-labels">
          <span>1 {inputs.termType === 'years' ? 'Yr' : 'Mo'}</span>
          <span>{inputs.termType === 'years' ? '20 Yrs' : '240 Mos'}</span>
          <span>{inputs.termType === 'years' ? '40 Yrs' : '480 Mos'}</span>
        </div>
      </div>

      {/* Payment Frequency */}
      <div className="input-group">
        <label htmlFor="frequency">Payment Frequency</label>
        <select
          id="frequency"
          value={inputs.frequency}
          onChange={(e) => handleChange('frequency', e.target.value)}
          className="styled-select"
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annually">Annually</option>
        </select>
      </div>

      {/* Start Date */}
      <div className="input-group">
        <label htmlFor="startDate">Start Date</label>
        <input
          id="startDate"
          type="month"
          value={inputs.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          className="styled-date-input"
        />
      </div>

      <div className="divider-glow" />

      {/* Prepayment Simulator Section */}
      <h3 className="section-subtitle">Prepayment Simulator</h3>
      <div className="input-group">
        <div className="input-header">
          <label htmlFor="extraPayment">Extra Monthly Payment</label>
          <span className="input-value-badge extra-badge">{formatCurrency(inputs.extraPayment)}</span>
        </div>
        <div className="input-with-symbol">
          <span className="currency-symbol-addon">{symbol}</span>
          <input
            id="extraPayment"
            type="number"
            value={inputs.extraPayment}
            onChange={(e) => handleChange('extraPayment', Math.max(0, parseFloat(e.target.value) || 0))}
            className="styled-numeric-input extra-input"
            min="0"
          />
        </div>
        <input
          type="range"
          min="0"
          max={Math.min(inputs.loanAmount * 0.05, 100000)}
          step="500"
          value={inputs.extraPayment}
          onChange={(e) => handleChange('extraPayment', parseFloat(e.target.value))}
          className="styled-slider extra-slider"
        />
        <div className="slider-labels">
          <span>{symbol}0</span>
          <span>{formatCurrency(Math.min(inputs.loanAmount * 0.05, 100000) / 2)}</span>
          <span>{formatCurrency(Math.min(inputs.loanAmount * 0.05, 100000))}</span>
        </div>
      </div>
    </div>
  );
}
