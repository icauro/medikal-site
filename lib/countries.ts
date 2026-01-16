export interface Country {
  name: string;
  code: string;
}

export const COUNTRIES: Country[] = [
  { name: 'Turkey', code: 'TR' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Germany', code: 'DE' },
  { name: 'United States', code: 'US' },
  { name: 'France', code: 'FR' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'Italy', code: 'IT' },
  { name: 'Spain', code: 'ES' },
  { name: 'Switzerland', code: 'CH' },
  { name: 'Austria', code: 'AT' },
  { name: 'Belgium', code: 'BE' },
  { name: 'Norway', code: 'NO' },
  { name: 'Sweden', code: 'SE' },
  { name: 'Denmark', code: 'DK' },
  { name: 'Finland', code: 'FI' },
  { name: 'Ireland', code: 'IE' },
  { name: 'Portugal', code: 'PT' },
  { name: 'Greece', code: 'GR' },
  { name: 'Poland', code: 'PL' },
  { name: 'Czech Republic', code: 'CZ' },
  { name: 'Hungary', code: 'HU' },
  { name: 'Romania', code: 'RO' },
  { name: 'Bulgaria', code: 'BG' },
  { name: 'Russia', code: 'RU' },
  { name: 'Ukraine', code: 'UA' },
  { name: 'United Arab Emirates', code: 'AE' },
  { name: 'Saudi Arabia', code: 'SA' },
  { name: 'Qatar', code: 'QA' },
  { name: 'Kuwait', code: 'KW' },
  { name: 'Israel', code: 'IL' },
  { name: 'Canada', code: 'CA' },
  { name: 'Australia', code: 'AU' },
  { name: 'New Zealand', code: 'NZ' },
  { name: 'China', code: 'CN' },
  { name: 'India', code: 'IN' },
  { name: 'Japan', code: 'JP' },
  { name: 'South Korea', code: 'KR' },
  { name: 'Singapore', code: 'SG' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Mexico', code: 'MX' },
  { name: 'Azerbaijan', code: 'AZ' },
  { name: 'Georgia', code: 'GE' },
  { name: 'Kazakhstan', code: 'KZ' },
  { name: 'Uzbekistan', code: 'UZ' }
];

export const getCountryName = (code: string): string => {
  return COUNTRIES.find(c => c.code === code)?.name || code;
};
