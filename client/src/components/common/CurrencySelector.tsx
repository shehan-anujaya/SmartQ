import React, { useState, useEffect } from 'react';
import { FiDollarSign } from 'react-icons/fi';
import { CURRENCY_NAMES, CURRENCY_SYMBOLS, getSelectedCurrency, setSelectedCurrency } from '../../utils/currency';

interface CurrencySelectorProps {
  onCurrencyChange?: (currency: string) => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ onCurrencyChange }) => {
  const [selectedCurrency, setSelected] = useState(getSelectedCurrency());
  const [isOpen, setIsOpen] = useState(false);

  const currencies = Object.keys(CURRENCY_NAMES);

  const handleCurrencyChange = (currency: string) => {
    setSelected(currency);
    setSelectedCurrency(currency);
    setIsOpen(false);
    
    // Notify parent component
    if (onCurrencyChange) {
      onCurrencyChange(currency);
    }
    
    // Reload page to update all prices
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        title="Select Currency"
      >
        <FiDollarSign className="w-4 h-4" />
        <span>{CURRENCY_SYMBOLS[selectedCurrency]} {selectedCurrency}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Select Currency
              </div>
              <div className="space-y-1">
                {currencies.map((currency) => (
                  <button
                    key={currency}
                    onClick={() => handleCurrencyChange(currency)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      selectedCurrency === currency
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {CURRENCY_SYMBOLS[currency]} {currency}
                      </span>
                      <span className="text-xs text-gray-500">
                        {CURRENCY_NAMES[currency]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySelector;
