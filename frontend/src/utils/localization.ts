import i18n from 'i18next';

/**
 * Converts a number to localized digits if the current language is Arabic.
 */
export const formatNumber = (num: number | string): string => {
  const str = String(num);
  if (i18n.language.startsWith('ar')) {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[0-9]/g, (w) => arabicDigits[+w]);
  }
  return str;
};

/**
 * Formats a Hijri year with its localized AH/BH suffix.
 */
export const formatHijriYear = (year: number, t: any): string => {
  if (year === 0) return '?';
  const localizedYear = formatNumber(Math.abs(year));
  const suffix = year < 0 ? t('bh') : t('ah');
  return i18n.dir() === 'rtl' ? `${localizedYear} ${suffix}` : `${localizedYear} ${suffix}`;
};

/**
 * Formats a CE year with its localized suffix.
 */
export const formatCEYear = (year: number, t: any): string => {
  const localizedYear = formatNumber(year);
  const suffix = t('ce');
  return `${localizedYear} ${suffix}`;
};
