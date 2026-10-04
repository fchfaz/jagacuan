import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format angka ke mata uang Rupiah Indonesia
 * Contoh: 15000 -> "Rp 15.000"
 */
export function formatRupiah(amount: number, withPrefix = true): string {
  // Pastikan integer
  const cleanNumber = Math.round(Number(amount) || 0);

  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(cleanNumber);

  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Parsing teks/input menjadi integer Rupiah murni
 * Menerima format "15.000", "15000", "Rp 15.000", dll.
 * Menghindari nilai float, negatif, dan membatasi nilai wajar max 1 triliun (1.000.000.000.000)
 */
export function parseRupiah(input: string | number): number {
  if (typeof input === 'number') {
    if (isNaN(input) || input < 0) return 0;
    return Math.min(Math.round(input), 1_000_000_000_000);
  }

  if (!input) return 0;

  // Hapus semua karakter non-angka
  const sanitized = input.replace(/[^0-9]/g, '');
  if (!sanitized) return 0;

  const parsed = parseInt(sanitized, 10);
  if (isNaN(parsed) || parsed < 0) return 0;

  // Batas atas wajar 1 Triliun Rupiah
  return Math.min(parsed, 1_000_000_000_000);
}

/**
 * Format label pengelompokan tanggal transaksi
 * Contoh: "Hari ini", "Kemarin", "Minggu, 4 Okt 2026"
 */
export function formatTransactionGroupDate(dateStr: string): string {
  try {
    const dateObj = typeof dateStr === 'string' && dateStr.includes('T')
      ? parseISO(dateStr)
      : new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));

    if (isToday(dateObj)) {
      return 'Hari ini';
    }
    if (isYesterday(dateObj)) {
      return 'Kemarin';
    }

    return format(dateObj, 'EEEE, d MMM yyyy', { locale: id });
  } catch {
    return dateStr;
  }
}

/**
 * Format nama bulan bahasa Indonesia
 * Contoh input: '2026-10' -> 'Oktober 2026'
 */
export function formatMonthYear(yearMonth: string): string {
  try {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return format(date, 'MMMM yyyy', { locale: id });
  } catch {
    return yearMonth;
  }
}

/**
 * Format tanggal standar Indonesia
 * Contoh: "04 Okt 2026"
 */
export function formatDateIndo(dateStr: string | Date, formatPattern = 'dd MMM yyyy'): string {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(d, formatPattern, { locale: id });
  } catch {
    return String(dateStr);
  }
}
