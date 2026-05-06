export const isNonEmptyString = (value: unknown, maxLen = 255): boolean => {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return v.length > 0 && v.length <= maxLen;
};

export const validateMaxLength = (value: unknown, maxLen: number): boolean => {
  if (typeof value !== 'string') return false;
  return value.trim().length <= maxLen;
};

export const isNumeric = (value: unknown): boolean => {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'string') return false;
  const normalized = value.replace(/\s+/g, '').replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(normalized);
};

export const sanitizeNumericInput = (value: string): string => {
  return value.replace(/[^0-9.,\-]/g, '').replace(',', '.');
};

export const isDateNotPast = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date >= today;
};

export const isEndDateAfterStart = (startStr: string, endStr: string): boolean => {
  if (!startStr || !endStr) return false;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return end >= start;
};
