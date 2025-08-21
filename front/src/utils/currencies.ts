// Configuración de divisas soportadas
export const CURRENCIES = [
  {
    code: 'CLP',
    name: 'Peso Chileno',
    symbol: '$',
    locale: 'es-CL'
  },
  {
    code: 'USD',
    name: 'Dólar Estadounidense',
    symbol: '$',
    locale: 'en-US'
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    locale: 'es-ES'
  },
  {
    code: 'GBP',
    name: 'Libra Esterlina',
    symbol: '£',
    locale: 'en-GB'
  },
  {
    code: 'MXN',
    name: 'Peso Mexicano',
    symbol: '$',
    locale: 'es-MX'
  },
  {
    code: 'ARS',
    name: 'Peso Argentino',
    symbol: '$',
    locale: 'es-AR'
  },
  {
    code: 'BRL',
    name: 'Real Brasileño',
    symbol: 'R$',
    locale: 'pt-BR'
  },
  {
    code: 'COP',
    name: 'Peso Colombiano',
    symbol: '$',
    locale: 'es-CO'
  },
  {
    code: 'PEN',
    name: 'Sol Peruano',
    symbol: 'S/',
    locale: 'es-PE'
  }
];

export const DEFAULT_CURRENCY = 'CLP';

// Función para formatear montos según la divisa
export function formatCurrency(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  if (!currency) {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }

  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    return `${currency.symbol}${amount.toLocaleString()}`;
  }
}

// Función para obtener el símbolo de una divisa
export function getCurrencySymbol(currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : currencyCode;
}

// Función para validar código de divisa
export function isValidCurrency(currencyCode: string): boolean {
  return CURRENCIES.some(c => c.code === currencyCode);
}

// Función para obtener el nombre de una divisa
export function getCurrencyName(currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.name : currencyCode;
}
