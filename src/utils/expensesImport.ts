import * as XLSX from 'xlsx';

export interface ParsedExpenseRow {
  index: number;
  id?: string;
  originalDateRaw: any;
  date: Date;
  dateIso: string;
  formattedDate: string;
  concepto: string;
  cantidad: number;
  state?: string;
  notes?: string;
  isValid: boolean;
  errors: string[];
}

export interface ImportPreviewResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  totalAmount: number;
  startDate: string | null;
  endDate: string | null;
  rows: ParsedExpenseRow[];
  fileName: string;
  detectedHeaders: {
    idCol?: string;
    createdCol?: string;
    conceptoCol?: string;
    cantidadCol?: string;
    stateCol?: string;
  };
}

/**
 * Normalizes string for flexible header matching (lowercase, removes accents and special chars)
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Robust date parser supporting Excel serial numbers, ISO strings, DD/MM/YYYY, etc.
 */
export function parseExpenseDate(value: any): { date: Date | null; iso: string; isValid: boolean } {
  if (value === undefined || value === null || value === '') {
    return { date: null, iso: '', isValid: false };
  }

  // 1. If it's already a Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    return { date: value, iso: value.toISOString(), isValid: true };
  }

  // 2. If it's an Excel numeric serial date (e.g. 45550 or 45550.54)
  if (typeof value === 'number' && !isNaN(value) && value > 1000 && value < 100000) {
    // Excel base date offset (25569 is days between 1900-01-01 and 1970-01-01)
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const date = new Date(ms);
    if (!isNaN(date.getTime())) {
      return { date, iso: date.toISOString(), isValid: true };
    }
  }

  const str = String(value).trim();
  if (!str) return { date: null, iso: '', isValid: false };

  // 3. Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY with optional HH:mm:ss
  // e.g. "20/09/2026 14:30:00" or "20/09/2026" or "5/9/2026"
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 12; // default midday to avoid timezone shifts
    const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;

    // Check if month and day might be inverted (if day > 12, it's definitely day/month)
    if (month > 12 && day <= 12) {
      // Swapped
      const temp = day;
      day = month;
      month = temp;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day, hours, minutes, seconds);
      if (!isNaN(date.getTime())) {
        return { date, iso: date.toISOString(), isValid: true };
      }
    }
  }

  // 4. Match YYYY-MM-DD or YYYY/MM/DD with optional time
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    const hours = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 12;
    const minutes = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
    const seconds = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day, hours, minutes, seconds);
      if (!isNaN(date.getTime())) {
        return { date, iso: date.toISOString(), isValid: true };
      }
    }
  }

  // 5. Standard JavaScript Date.parse fallback
  const parsedTimestamp = Date.parse(str);
  if (!isNaN(parsedTimestamp)) {
    const date = new Date(parsedTimestamp);
    return { date, iso: date.toISOString(), isValid: true };
  }

  return { date: null, iso: '', isValid: false };
}

/**
 * Robust amount parser for currency strings ($1,250.50, 1500,50, 250, etc.)
 */
export function parseExpenseAmount(value: any): { amount: number; isValid: boolean } {
  if (value === undefined || value === null || value === '') {
    return { amount: 0, isValid: false };
  }

  if (typeof value === 'number' && !isNaN(value)) {
    return { amount: Number(value.toFixed(2)), isValid: value >= 0 };
  }

  let cleanStr = String(value).trim();
  // Remove currency signs, letters, and non-numeric except decimal separators
  cleanStr = cleanStr.replace(/[$€£MXNUSD\s]/gi, '');

  if (!cleanStr) return { amount: 0, isValid: false };

  // Handle formats:
  // "1,250.50" (comma thousand, dot decimal)
  // "1.250,50" (dot thousand, comma decimal)
  // "150,50" (comma decimal)
  // "150.50" (dot decimal)
  if (cleanStr.includes(',') && cleanStr.includes('.')) {
    if (cleanStr.lastIndexOf('.') > cleanStr.lastIndexOf(',')) {
      // 1,250.50
      cleanStr = cleanStr.replace(/,/g, '');
    } else {
      // 1.250,50
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    }
  } else if (cleanStr.includes(',')) {
    // If only comma, check if it's decimal (e.g. 150,50 or 12,5) or thousand (e.g. 1,000)
    const parts = cleanStr.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      cleanStr = cleanStr.replace(',', '.');
    } else {
      cleanStr = cleanStr.replace(/,/g, '');
    }
  }

  const num = parseFloat(cleanStr);
  if (isNaN(num) || num < 0) {
    return { amount: 0, isValid: false };
  }

  return { amount: Number(num.toFixed(2)), isValid: true };
}

/**
 * Parses a raw CSV string (supporting comma, semicolon, tab delimiters)
 */
export function parseCSVText(csvText: string): Record<string, any>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Detect delimiter from header line
  const headerLine = lines[0];
  let delimiter = ',';
  if (headerLine.includes('\t')) {
    delimiter = '\t';
  } else if (headerLine.includes(';') && !headerLine.includes(',')) {
    delimiter = ';';
  } else if ((headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length) {
    delimiter = ';';
  }

  // Parse header
  const headers = splitCSVLine(headerLine, delimiter).map(h => h.trim());

  const records: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line, delimiter);
    const row: Record<string, any> = {};
    headers.forEach((header, colIdx) => {
      row[header] = values[colIdx] !== undefined ? values[colIdx].trim() : '';
    });
    records.push(row);
  }

  return records;
}

function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Main parser function: processes an ArrayBuffer or File (CSV or Excel) and extracts
 * rows mapped to id, created (date), state, concepto, cantidad.
 */
export async function parseExpensesFile(
  file: File | { name: string; buffer: ArrayBuffer }
): Promise<ImportPreviewResult> {
  const fileName = file.name;
  const isCSV = fileName.toLowerCase().endsWith('.csv') || fileName.toLowerCase().endsWith('.tsv') || fileName.toLowerCase().endsWith('.txt');

  let rawRecords: Record<string, any>[] = [];

  try {
    if (isCSV && 'text' in file && typeof file.text === 'function') {
      // If it's a browser File with .text()
      const text = await file.text();
      rawRecords = parseCSVText(text);
      if (rawRecords.length === 0) {
        // Fallback to XLSX engine
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rawRecords = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
      }
    } else {
      // Use XLSX engine for .xlsx, .xls or binary CSV
      let arrayBuffer: ArrayBuffer;
      if ('arrayBuffer' in file && typeof file.arrayBuffer === 'function') {
        arrayBuffer = await file.arrayBuffer();
      } else {
        arrayBuffer = (file as any).buffer;
      }

      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rawRecords = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    }
  } catch (err) {
    console.error('Error parsing file:', err);
    throw new Error('No se pudo leer el archivo. Asegúrate de que sea un archivo Excel (.xlsx, .xls) o CSV válido.');
  }

  if (rawRecords.length === 0) {
    throw new Error('El archivo está vacío o no contiene filas con datos legibles.');
  }

  // Detect column mapping based on first row keys
  const firstRow = rawRecords[0];
  const keys = Object.keys(firstRow);

  let idCol: string | undefined;
  let createdCol: string | undefined;
  let conceptoCol: string | undefined;
  let cantidadCol: string | undefined;
  let stateCol: string | undefined;

  for (const key of keys) {
    const norm = normalizeHeader(key);

    // Exact matches requested by user: id, created, state, concepto, cantidad
    if (!idCol && (norm === 'id' || norm === 'folio' || norm === 'identificador')) {
      idCol = key;
    } else if (!createdCol && (norm === 'created' || norm === 'fecha' || norm === 'date' || norm === 'createdat' || norm === 'fechacreacion')) {
      createdCol = key;
    } else if (!conceptoCol && (norm === 'concepto' || norm === 'concept' || norm === 'descripcion' || norm === 'detalle' || norm === 'nombre')) {
      conceptoCol = key;
    } else if (!cantidadCol && (norm === 'cantidad' || norm === 'monto' || norm === 'importe' || norm === 'amount' || norm === 'total' || norm === 'precio')) {
      cantidadCol = key;
    } else if (!stateCol && (norm === 'state' || norm === 'estado' || norm === 'status' || norm === 'estatus')) {
      stateCol = key;
    }
  }

  // Secondary looser match if any primary wasn't found
  if (!createdCol) {
    createdCol = keys.find(k => {
      const n = normalizeHeader(k);
      return n.includes('creat') || n.includes('fech') || n.includes('date') || n.includes('dia') || n.includes('time');
    });
  }
  if (!conceptoCol) {
    conceptoCol = keys.find(k => {
      const n = normalizeHeader(k);
      return n.includes('concep') || n.includes('desc') || n.includes('detall') || n.includes('item') || n.includes('gasto');
    });
  }
  if (!cantidadCol) {
    cantidadCol = keys.find(k => {
      const n = normalizeHeader(k);
      return n.includes('cant') || n.includes('mont') || n.includes('imp') || n.includes('cost') || n.includes('prec') || n.includes('total');
    });
  }

  const rows: ParsedExpenseRow[] = [];
  let totalAmount = 0;
  let validCount = 0;
  let invalidCount = 0;

  const validDates: number[] = [];

  rawRecords.forEach((record, index) => {
    const errors: string[] = [];

    // Extract raw values
    const rawId = idCol ? record[idCol] : record['id'];
    const rawCreated = createdCol ? record[createdCol] : (record['created'] || record['fecha'] || record['date']);
    const rawConcepto = conceptoCol ? record[conceptoCol] : (record['concepto'] || record['descripcion']);
    const rawCantidad = cantidadCol ? record[cantidadCol] : (record['cantidad'] || record['monto'] || record['importe']);
    const rawState = stateCol ? record[stateCol] : (record['state'] || record['estado']);

    // Parse Concepto
    const cleanConcepto = String(rawConcepto || '').trim();
    if (!cleanConcepto) {
      errors.push('Falta el concepto o descripción del gasto');
    }

    // Parse Cantidad
    const parsedAmount = parseExpenseAmount(rawCantidad);
    if (!parsedAmount.isValid || parsedAmount.amount <= 0) {
      errors.push(`Monto inválido (${rawCantidad || 'vacío'})`);
    }

    // Parse Created / Fecha
    const parsedDate = parseExpenseDate(rawCreated);
    if (!parsedDate.isValid || !parsedDate.date) {
      errors.push(`Fecha inválida (${rawCreated || 'vacía'})`);
    }

    const isValid = errors.length === 0;

    let dateObj: Date;
    let dateIso = '';
    let formattedDate = 'Fecha desconocida';

    if (isValid && parsedDate.date) {
      dateObj = parsedDate.date;
      dateIso = parsedDate.iso;
      validDates.push(dateObj.getTime());
      validCount++;
      totalAmount += parsedAmount.amount;

      formattedDate = dateObj.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      dateObj = new Date();
      dateIso = dateObj.toISOString();
      invalidCount++;
      formattedDate = rawCreated ? String(rawCreated) : 'Sin fecha';
    }

    // Build notes from state
    let notes = '';
    if (rawState && String(rawState).trim().length > 0) {
      notes = `Estado: ${String(rawState).trim()}`;
    }

    rows.push({
      index: index + 1,
      id: rawId ? String(rawId).trim() : undefined,
      originalDateRaw: rawCreated,
      date: dateObj,
      dateIso,
      formattedDate,
      concepto: cleanConcepto || '(Sin concepto)',
      cantidad: parsedAmount.amount,
      state: rawState ? String(rawState).trim() : undefined,
      notes: notes || undefined,
      isValid,
      errors
    });
  });

  // Calculate start and end dates from valid rows
  let startDate: string | null = null;
  let endDate: string | null = null;
  if (validDates.length > 0) {
    validDates.sort((a, b) => a - b);
    const minD = new Date(validDates[0]);
    const maxD = new Date(validDates[validDates.length - 1]);
    startDate = minD.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    endDate = maxD.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return {
    totalRows: rawRecords.length,
    validCount,
    invalidCount,
    totalAmount: Number(totalAmount.toFixed(2)),
    startDate,
    endDate,
    rows,
    fileName,
    detectedHeaders: {
      idCol,
      createdCol,
      conceptoCol,
      cantidadCol,
      stateCol
    }
  };
}
