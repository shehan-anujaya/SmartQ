// Currency conversion rates (base: LKR)
export const EXCHANGE_RATES: Record<string, number> = {
  LKR: 1,
  USD: 0.0031, // 1 LKR = 0.0031 USD (approx 320 LKR = 1 USD)
  EUR: 0.0028, // 1 LKR = 0.0028 EUR
  GBP: 0.0024, // 1 LKR = 0.0024 GBP
  INR: 0.26,   // 1 LKR = 0.26 INR
  AUD: 0.0047, // 1 LKR = 0.0047 AUD
  CAD: 0.0042, // 1 LKR = 0.0042 CAD
  JPY: 0.45,   // 1 LKR = 0.45 JPY
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  LKR: 'Rs.',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
};

export const CURRENCY_NAMES: Record<string, string> = {
  LKR: 'Sri Lankan Rupee',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  INR: 'Indian Rupee',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  JPY: 'Japanese Yen',
};

/**
 * Convert price from LKR to target currency
 */
export const convertCurrency = (priceInLKR: number, targetCurrency: string): number => {
  const rate = EXCHANGE_RATES[targetCurrency] || 1;
  return priceInLKR * rate;
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (price: number, currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  
  // Round to 2 decimal places for most currencies, 0 for LKR and JPY
  const decimals = ['LKR', 'JPY'].includes(currency) ? 0 : 2;
  const formatted = price.toFixed(decimals);
  
  // Add thousand separators
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${symbol} ${parts.join('.')}`;
};

/**
 * Get selected currency from localStorage or default to LKR
 */
export const getSelectedCurrency = (): string => {
  return localStorage.getItem('selectedCurrency') || 'LKR';
};

/**
 * Save selected currency to localStorage
 */
export const setSelectedCurrency = (currency: string): void => {
  localStorage.setItem('selectedCurrency', currency);
};

/**
 * Convert and format price in one go
 */
export const displayPrice = (priceInLKR: number, targetCurrency?: string): string => {
  const currency = targetCurrency || getSelectedCurrency();
  const converted = convertCurrency(priceInLKR, currency);
  return formatPrice(converted, currency);
};
