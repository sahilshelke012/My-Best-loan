import React, { useState } from 'react';

export default function AmortizationSchedule({
  payments,
  currency,
  currencySymbols,
  customExtraPayments,
  onUpdateCustomExtraPayment,
  frequencyLabel
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const rowsPerPage = 24; // 2 years of monthly payments

  const symbol = currencySymbols[currency] || currency;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency === 'INR' ? 'INR' : currency,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Filter payments based on search term (e.g., year like "2026", "Jan", or month index)
  const filteredPayments = payments.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.dateLabel.toLowerCase().includes(term) ||
      p.paymentNumber.toString().includes(term)
    );
  });

  // Pagination calculations
  const totalRows = filteredPayments.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  
  const displayedPayments = showAll 
    ? filteredPayments 
    : filteredPayments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Export to CSV utility
  const exportToCSV = () => {
    const headers = [
      'Payment #',
      'Date',
      'Beginning Balance',
      'Scheduled Payment',
      'Extra Prepayment',
      'Principal Component',
      'Interest Component',
      'Total Payment',
      'Ending Balance'
    ];

    const rows = payments.map((p) => [
      p.paymentNumber,
      p.dateLabel,
      p.beginningBalance.toFixed(2),
      p.periodicPayment.toFixed(2),
      (p.extraPayment || 0).toFixed(2),
      p.principal.toFixed(2),
      p.interest.toFixed(2),
      (p.principal + p.interest + (p.extraPayment || 0)).toFixed(2),
      p.balance.toFixed(2)
    ]);

    const csvContent = 
      'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Amortization_Schedule_${frequencyLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="amortization-panel">
      <div className="panel-header-controls">
        <h3 className="panel-title">Detailed Amortization Schedule</h3>
        
        <div className="schedule-actions">
          <input
            type="text"
            placeholder="Search date or payment #..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="schedule-search-input"
          />
          
          <button onClick={exportToCSV} className="action-btn csv-btn" title="Export Schedule to Excel/CSV">
            📥 CSV Export
          </button>
          
          <button 
            onClick={() => setShowAll(!showAll)} 
            className={`action-btn toggle-rows-btn ${showAll ? 'active' : ''}`}
          >
            {showAll ? 'Paginated View' : 'Show All Rows'}
          </button>
        </div>
      </div>

      <div className="schedule-tips">
        💡 <span className="text-secondary">Tip: Type a custom amount in the <strong>Extra Prepay</strong> input field of any month to see how early prepayments dynamically reduce interest and shorten the loan timeline!</span>
      </div>

      <div className="table-responsive-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Pmt #</th>
              <th>Date</th>
              <th>Beginning Bal</th>
              <th>Base Payment</th>
              <th>Extra Prepay</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Total Paid</th>
              <th>Ending Balance</th>
            </tr>
          </thead>
          <tbody>
            {displayedPayments.length > 0 ? (
              displayedPayments.map((p) => {
                const isCustom = customExtraPayments.hasOwnProperty(p.paymentNumber);
                const customVal = isCustom ? customExtraPayments[p.paymentNumber] : '';

                return (
                  <tr key={p.paymentNumber} className={isCustom ? 'custom-row-prepay' : ''}>
                    <td className="center-cell">{p.paymentNumber}</td>
                    <td className="bold-cell">{p.dateLabel}</td>
                    <td>{formatCurrency(p.beginningBalance)}</td>
                    <td>{formatCurrency(p.periodicPayment)}</td>
                    <td className="extra-pay-cell">
                      <div className="inline-prepay-input">
                        <span className="input-currency-tag">{symbol}</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={customVal}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                            onUpdateCustomExtraPayment(p.paymentNumber, val);
                          }}
                          className={`inline-table-input ${isCustom ? 'active-input' : ''}`}
                          min="0"
                        />
                      </div>
                    </td>
                    <td className="text-blue">{formatCurrency(p.principal)}</td>
                    <td className="text-red">{formatCurrency(p.interest)}</td>
                    <td className="bold-cell">
                      {formatCurrency(p.principal + p.interest + (p.extraPayment || 0))}
                    </td>
                    <td className="bold-cell text-green">{formatCurrency(p.balance)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="no-results-cell">
                  No matching payments found. Try a different search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!showAll && totalPages > 1 && (
        <div className="pagination-wrapper">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pager-btn"
          >
            ◀ Prev
          </button>
          
          <div className="pager-pages">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Sliding window page range
              let pageNum = i + 1;
              if (currentPage > 3 && totalPages > 5) {
                pageNum = currentPage - 3 + i;
                if (pageNum + (4 - i) > totalPages) {
                  pageNum = totalPages - 4 + i;
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`pager-page-num ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="badge-btn pager-btn"
          >
            Next ▶
          </button>
          
          <span className="page-summary">
            Page {currentPage} of {totalPages} ({totalRows} payments total)
          </span>
        </div>
      )}
    </div>
  );
}
