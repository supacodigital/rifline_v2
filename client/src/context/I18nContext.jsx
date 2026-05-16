import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import fr from '../i18n/fr.json';
import en from '../i18n/en.json';

const TRANSLATIONS = { fr, en };
const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];
const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'USD', symbol: '$', label: 'USD' },
  { code: 'GBP', symbol: '£', label: 'GBP' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD' },
];
const DEFAULT_LANG = 'fr';
const DEFAULT_CURRENCY = 'EUR';
const RATES_KEY = 'rifline_fx_rates';
const RATES_TTL = 3600 * 1000; // 1h

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => localStorage.getItem('rifline_lang') || DEFAULT_LANG);
  const [currency, setCurrencyState] = useState(() => localStorage.getItem('rifline_currency') || DEFAULT_CURRENCY);
  const [rates, setRates] = useState({ EUR: 1, USD: 1.09, GBP: 0.86, CAD: 1.48 });

  useEffect(() => {
    const cached = localStorage.getItem(RATES_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < RATES_TTL) { setRates(data); return; }
    }
    fetch('https://api.exchangerate-api.com/v4/latest/EUR')
      .then((r) => r.json())
      .then((data) => {
        const r = { EUR: 1, USD: data.rates.USD, GBP: data.rates.GBP, CAD: data.rates.CAD };
        setRates(r);
        localStorage.setItem(RATES_KEY, JSON.stringify({ ts: Date.now(), data: r }));
      })
      .catch(() => {});
  }, []);

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem('rifline_lang', code);
  };

  const setCurrency = (code) => {
    setCurrencyState(code);
    localStorage.setItem('rifline_currency', code);
  };

  const t = useCallback((key, vars = {}) => {
    const keys = key.split('.');
    let val = TRANSLATIONS[lang];
    for (const k of keys) {
      val = val?.[k];
      if (val === undefined) break;
    }
    if (typeof val !== 'string') return key;
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{{${k}}}`, v), val);
  }, [lang]);

  const formatPrice = useCallback((amountEur) => {
    const amount = parseFloat(amountEur) * (rates[currency] || 1);
    const cur = CURRENCIES.find((c) => c.code === currency);
    try {
      return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${cur?.symbol || ''}${amount.toFixed(2)}`;
    }
  }, [currency, rates, lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, currency, setCurrency, t, formatPrice, LANGUAGES, CURRENCIES }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
};
