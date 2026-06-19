import React, { useState, useMemo, useEffect } from 'react';
import CalculatorInputs from './components/CalculatorInputs';
import StatsDashboard from './components/StatsDashboard';
import Visuals from './components/Visuals';
import AmortizationSchedule from './components/AmortizationSchedule';
import ComparisonPanel from './components/ComparisonPanel';
import './App.css';
import logo from './logo.svg';

const CURRENCY_SYMBOLS = {
  INR: '₹',
};

const FREQUENCY_MULTIPLIERS = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  annually: 1,
};

const FREQUENCY_LABELS = {
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
};

const UNIT_LABELS = {
  weekly: { single: 'week', plural: 'weeks' },
  biweekly: { single: 'period', plural: 'periods' },
  monthly: { single: 'month', plural: 'months' },
  quarterly: { single: 'quarter', plural: 'quarters' },
  annually: { single: 'year', plural: 'years' },
};

// Amortization calculation engine
const calculateAmortization = (
  loanAmount,
  interestRate,
  term,
  termType,
  frequency,
  extraMonthlyPayment = 0,
  customExtraPayments = {},
  startDateStr
) => {
  const annualRate = interestRate / 100;
  const fMultiplier = FREQUENCY_MULTIPLIERS[frequency] || 12;
  const r = annualRate / fMultiplier;

  // Calculate total periods
  const years = termType === 'years' ? term : term / 12;
  const totalPeriods = Math.round(years * fMultiplier);

  // Periodic base payment calculation
  let periodicPayment = 0;
  if (r === 0) {
    periodicPayment = loanAmount / totalPeriods;
  } else {
    periodicPayment = (loanAmount * r * Math.pow(1 + r, totalPeriods)) / (Math.pow(1 + r, totalPeriods) - 1);
  }

  const payments = [];
  let balance = loanAmount;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  
  const baseDate = new Date(startDateStr + '-01');

  for (let j = 1; j <= totalPeriods; j++) {
    if (balance <= 0.005) break;

    const beginningBalance = balance;
    const interest = balance * r;
    let principal = periodicPayment - interest;

    // Retrieve extra prepayment (monthly base extra + custom lump sums)
    const baseExtra = extraMonthlyPayment;
    const customExtra = customExtraPayments[j] || 0;
    const totalExtra = baseExtra + customExtra;

    let actualPrincipal = principal;
    let actualExtra = 0;

    // Handle final payoff bounds
    if (principal + totalExtra >= balance) {
      actualPrincipal = Math.min(principal, balance);
      actualExtra = Math.max(0, balance - actualPrincipal);
      balance = 0;
    } else {
      actualPrincipal = principal;
      actualExtra = totalExtra;
      balance = balance - actualPrincipal - actualExtra;
    }

    totalInterestPaid += interest;
    totalPrincipalPaid += actualPrincipal + actualExtra;

    // Calculate dates
    const currentPeriodDate = new Date(baseDate);
    switch (frequency) {
      case 'weekly':
        currentPeriodDate.setDate(baseDate.getDate() + (j - 1) * 7);
        break;
      case 'biweekly':
        currentPeriodDate.setDate(baseDate.getDate() + (j - 1) * 14);
        break;
      case 'quarterly':
        currentPeriodDate.setMonth(baseDate.getMonth() + (j - 1) * 3);
        break;
      case 'annually':
        currentPeriodDate.setFullYear(baseDate.getFullYear() + (j - 1));
        break;
      case 'monthly':
      default:
        currentPeriodDate.setMonth(baseDate.getMonth() + (j - 1));
        break;
    }

    const options = { year: 'numeric', month: 'short' };
    if (frequency === 'weekly' || frequency === 'biweekly') {
      options.day = 'numeric';
    }
    const dateLabel = currentPeriodDate.toLocaleDateString('en-US', options);

    payments.push({
      paymentNumber: j,
      date: currentPeriodDate,
      dateLabel,
      beginningBalance,
      periodicPayment,
      interest,
      principal: actualPrincipal,
      extraPayment: actualExtra,
      balance,
      totalInterestPaid,
      totalPrincipalPaid,
    });
  }

  // Find payoff date
  const lastPayment = payments[payments.length - 1];
  const payoffDate = lastPayment ? lastPayment.dateLabel : 'N/A';

  return {
    payments,
    summary: {
      principal: loanAmount,
      periodicPayment,
      extraPayment: extraMonthlyPayment,
      totalInterest: totalInterestPaid,
      totalPaid: totalPrincipalPaid + totalInterestPaid,
      payoffDate,
      originalTermPeriods: totalPeriods,
      actualTermPeriods: payments.length,
      paymentsSaved: totalPeriods - payments.length,
      frequencyLabel: FREQUENCY_LABELS[frequency],
      periodUnitSingle: UNIT_LABELS[frequency].single,
      periodUnitPlural: UNIT_LABELS[frequency].plural,
    },
  };
};

export default function App() {
  const [theme, setTheme] = useState('light');
  const [currency, setCurrency] = useState('INR');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'schedule' | 'compare'

  // Input states initialized to match prompt defaults where possible
  const [inputs, setInputs] = useState({
    loanAmount: 10000000.00, // ₹10,000,000
    interestRate: 10.00,     // 10%
    term: 180,               // 180 payments
    termType: 'months',
    frequency: 'monthly',
    extraPayment: 0,
    startDate: new Date().toISOString().substring(0, 7), // "YYYY-MM"
  });

  // Keep track of inline cell-edited extra prepayments
  const [customExtraPayments, setCustomExtraPayments] = useState({});

  // Saved scenarios for side-by-side comparison
  const [scenarioA, setScenarioA] = useState(null);
  const [scenarioB, setScenarioB] = useState(null);

  // Re-sync local theme changes with HTML document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
  }, [theme]);

  // Reset custom extra payments when core dimensions change (to prevent applying them to bad indices)
  useEffect(() => {
    setCustomExtraPayments({});
  }, [inputs.loanAmount, inputs.term, inputs.termType, inputs.frequency]);

  // Run calculation engines
  const activeAmortization = useMemo(() => {
    return calculateAmortization(
      inputs.loanAmount,
      inputs.interestRate,
      inputs.term,
      inputs.termType,
      inputs.frequency,
      inputs.extraPayment,
      customExtraPayments,
      inputs.startDate
    );
  }, [inputs, customExtraPayments]);

  const baselineAmortization = useMemo(() => {
    // Computes baseline (no prepayments) to display net metrics saved
    return calculateAmortization(
      inputs.loanAmount,
      inputs.interestRate,
      inputs.term,
      inputs.termType,
      inputs.frequency,
      0,
      {},
      inputs.startDate
    );
  }, [inputs.loanAmount, inputs.interestRate, inputs.term, inputs.termType, inputs.frequency, inputs.startDate]);

  // Merge savings calculations
  const dashboardSummary = useMemo(() => {
    const act = activeAmortization.summary;
    const base = baselineAmortization.summary;
    const interestSaved = Math.max(0, base.totalInterest - act.totalInterest);
    const termSaved = Math.max(0, base.actualTermPeriods - act.actualTermPeriods);

    return {
      ...act,
      totalInterestSaved: interestSaved,
      paymentsSaved: termSaved,
    };
  }, [activeAmortization, baselineAmortization]);

  const handleUpdateCustomExtraPayment = (paymentNumber, amount) => {
    setCustomExtraPayments((prev) => {
      const next = { ...prev };
      if (amount === 0 || amount === '') {
        delete next[paymentNumber];
      } else {
        next[paymentNumber] = amount;
      }
      return next;
    });
  };

  const handleSaveScenario = (slot) => {
    const snapshot = {
      inputs: { ...inputs },
      summary: { ...dashboardSummary },
    };
    if (slot === 'A') {
      setScenarioA(snapshot);
    } else {
      setScenarioB(snapshot);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={`app-canvas ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      <div className="bg-glow" />
      
      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo-container">
            <h1>
              <img src={logo} className="brand-logo-img-wide" alt="My Best Loan" />
            </h1>
            <p className="brand-tagline">Advanced Financial Forecaster & Prepayment Simulator</p>
          </div>
        </div>

        <div className="header-controls">
          {/* Dark/Light Toggle */}
          <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Appearance">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" className="theme-svg-icon sun-icon">
                <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="theme-svg-icon moon-icon">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE GRID */}
      <main className="app-workspace">
        {/* Left Hand side inputs sidebar */}
        <aside className="workspace-sidebar">
          <CalculatorInputs
            inputs={inputs}
            setInputs={setInputs}
            currency={currency}
            currencySymbols={CURRENCY_SYMBOLS}
          />
        </aside>

        {/* Right Hand side detailed workspace panels */}
        <section className="workspace-panels">
          
          {/* Tabs Navigation */}
          <nav className="panel-navigation-tabs">
            <button
              className={`panel-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📈 Dashboard & Analytics
            </button>
            <button
              className={`panel-tab ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              📅 Schedule Table
            </button>
            <button
              className={`panel-tab ${activeTab === 'compare' ? 'active' : ''}`}
              onClick={() => setActiveTab('compare')}
            >
              ⚖️ Compare Scenarios
            </button>
          </nav>

          {/* Active Tab Panel Rendering */}
          <div className="active-panel-container">
            {activeTab === 'dashboard' && (
              <div className="tab-fade-in">
                <StatsDashboard
                  summary={dashboardSummary}
                  originalSummary={baselineAmortization.summary}
                  currency={currency}
                  currencySymbols={CURRENCY_SYMBOLS}
                />
                <Visuals
                  payments={activeAmortization.payments}
                  originalPayments={inputs.extraPayment > 0 || Object.keys(customExtraPayments).length > 0 ? baselineAmortization.payments : null}
                  currency={currency}
                  currencySymbols={CURRENCY_SYMBOLS}
                />
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="tab-fade-in">
                <AmortizationSchedule
                  payments={activeAmortization.payments}
                  currency={currency}
                  currencySymbols={CURRENCY_SYMBOLS}
                  customExtraPayments={customExtraPayments}
                  onUpdateCustomExtraPayment={handleUpdateCustomExtraPayment}
                  frequencyLabel={FREQUENCY_LABELS[inputs.frequency]}
                />
              </div>
            )}

            {activeTab === 'compare' && (
              <div className="tab-fade-in">
                <ComparisonPanel
                  currentInputs={inputs}
                  currentSummary={dashboardSummary}
                  baselineSummary={baselineAmortization.summary}
                  scenarioA={scenarioA}
                  scenarioB={scenarioB}
                  onSaveScenario={handleSaveScenario}
                  currency={currency}
                  currencySymbols={CURRENCY_SYMBOLS}
                />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* FOOTER SECTION */}
      <footer className="app-footer">
        <p>-Powered by MY BEST LOAN</p>
      </footer>
    </div>
  );
}
