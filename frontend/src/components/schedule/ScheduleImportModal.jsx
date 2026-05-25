import React, { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const normalizeHeader = value =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const detectSeparator = line => {
  if (!line) return ',';
  if (line.includes('\t')) return '\t';
  if (line.includes(';')) return ';';
  if (line.includes('|')) return '|';
  return ',';
};

const toStatus = value => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'pendiente';
  const allowed = new Set(['pendiente', 'en-diseno', 'en diseno', 'en diseno', 'en-progreso', 'aprobado', 'publicado', 'cancelado']);
  if (!allowed.has(raw)) return 'pendiente';
  return raw.replace(/\s+/g, '-').replace('en-diseno', 'en-diseño');
};

const toChannel = value => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw.includes('insta') || raw === 'ig') return 'IG';
  if (raw.includes('tiktok') || raw === 'tt') return 'TikTok';
  if (raw.includes('facebook') || raw === 'fb') return 'FB';
  if (raw.includes('linkedin') || raw === 'li') return 'LinkedIn';
  if (raw.includes('whatsapp') || raw === 'wa') return 'WhatsApp';
  return 'IG';
};

const parseDate = (dateValue, timeValue) => {
  const dateText = String(dateValue || '').trim();
  const timeText = String(timeValue || '09:00').trim() || '09:00';
  if (!dateText) return null;

  const combined = dateText.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}:\d{2}))?$/);
  if (combined) {
    const dd = combined[1].padStart(2, '0');
    const mm = combined[2].padStart(2, '0');
    const yyyy = combined[3];
    const hhmm = combined[4] || timeText;
    return new Date(`${yyyy}-${mm}-${dd}T${hhmm}:00`);
  }

  const isoDate = dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}:\d{2}))?$/);
  if (isoDate) {
    const yyyy = isoDate[1];
    const mm = isoDate[2].padStart(2, '0');
    const dd = isoDate[3].padStart(2, '0');
    const hhmm = isoDate[4] || timeText;
    return new Date(`${yyyy}-${mm}-${dd}T${hhmm}:00`);
  }

  const iso = new Date(`${dateText}T${timeText}:00`);
  if (Number.isNaN(iso.getTime())) return null;
  return iso;
};

const parseCsv = content => {
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];
  const separator = detectSeparator(lines[0]);
  const headers = lines[0].split(separator).map(normalizeHeader);

  const findIndex = names => headers.findIndex(h => names.includes(h));
  const idxFecha = findIndex(['fecha', 'date', 'dia']);
  const idxHora = findIndex(['hora', 'time']);
  const idxTitulo = findIndex(['titulo', 'title', 'idea']);
  const idxCopy = findIndex(['copy', 'descripcion', 'description', 'texto']);
  const idxMedia = findIndex(['media', 'archivo', 'asset', 'formato']);
  const idxCanal = findIndex(['canal', 'channel', 'red']);
  const idxFormato = findIndex(['formato', 'format', 'tipo']);
  const idxEstado = findIndex(['estado', 'status']);

  return lines.slice(1).map((line, rowIndex) => {
    const cols = line.split(separator).map(c => c.trim());
    const scheduledDate = parseDate(cols[idxFecha], idxHora >= 0 ? cols[idxHora] : '09:00');
    if (!scheduledDate) return null;

    const formatValue = idxFormato >= 0 ? cols[idxFormato] : (idxMedia >= 0 ? cols[idxMedia] : '');
    const copyValue = idxCopy >= 0 ? cols[idxCopy] : '';
    const mediaValue = idxMedia >= 0 ? cols[idxMedia] : '';
    const explicitTitle = idxTitulo >= 0 ? cols[idxTitulo] : '';
    const inferredTitle = explicitTitle || mediaValue || (copyValue ? copyValue.slice(0, 60) : '');
    if (!inferredTitle) return null;

    return {
      row: rowIndex + 2,
      title: inferredTitle,
      copy: copyValue,
      status: toStatus(idxEstado >= 0 ? cols[idxEstado] : 'pendiente'),
      channel: toChannel(idxCanal >= 0 ? cols[idxCanal] : 'IG'),
      scheduled_at: scheduledDate.toISOString(),
      description: formatValue ? `Media: ${formatValue}` : null,
      format: formatValue || '',
    };
  }).filter(Boolean);
};

const parseTableRows = rows => {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(normalizeHeader);
  const findIndex = names => headers.findIndex(h => names.includes(h));

  const idxFecha = findIndex(['fecha', 'date', 'dia']);
  const idxHora = findIndex(['hora', 'time']);
  const idxCopy = findIndex(['copy', 'descripcion', 'description', 'texto']);
  const idxMedia = findIndex(['media', 'archivo', 'asset', 'formato']);
  const idxEstado = findIndex(['estado', 'status']);
  const idxCanal = findIndex(['canal', 'channel', 'red']);
  const idxTitulo = findIndex(['titulo', 'title', 'idea']);

  if (idxFecha < 0) return [];

  return rows.slice(1).map((parts, index) => {
    const scheduledDate = parseDate(parts[idxFecha], idxHora >= 0 ? parts[idxHora] : '09:00');
    if (!scheduledDate) return null;

    const copyValue = idxCopy >= 0 ? parts[idxCopy] : '';
    const mediaValue = idxMedia >= 0 ? parts[idxMedia] : '';
    const titleValue = idxTitulo >= 0 ? parts[idxTitulo] : '';
    const inferredTitle = titleValue || mediaValue || (copyValue ? copyValue.slice(0, 60) : '');
    if (!inferredTitle) return null;

    return {
      row: index + 2,
      title: inferredTitle,
      copy: copyValue,
      channel: toChannel(idxCanal >= 0 ? parts[idxCanal] : 'IG'),
      status: toStatus(idxEstado >= 0 ? parts[idxEstado] : 'pendiente'),
      description: mediaValue ? `Media: ${mediaValue}` : null,
      scheduled_at: scheduledDate.toISOString(),
      format: mediaValue || '',
    };
  }).filter(Boolean);
};

const parseTxt = content => {
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const separator = detectSeparator(lines[0]);
  const headers = lines[0].split(separator).map(normalizeHeader);
  const findIndex = names => headers.findIndex(h => names.includes(h));

  const idxFecha = findIndex(['fecha', 'date', 'dia']);
  const idxHora = findIndex(['hora', 'time']);
  const idxCopy = findIndex(['copy', 'descripcion', 'description', 'texto']);
  const idxMedia = findIndex(['media', 'archivo', 'asset', 'formato']);
  const idxEstado = findIndex(['estado', 'status']);
  const idxCanal = findIndex(['canal', 'channel', 'red']);
  const idxTitulo = findIndex(['titulo', 'title', 'idea']);

  if (idxFecha < 0) return [];

  return lines.slice(1).map((line, index) => {
    const parts = line.split(separator).map(part => part.trim());
    const scheduledDate = parseDate(parts[idxFecha], idxHora >= 0 ? parts[idxHora] : '09:00');
    if (!scheduledDate) return null;

    const copyValue = idxCopy >= 0 ? parts[idxCopy] : '';
    const mediaValue = idxMedia >= 0 ? parts[idxMedia] : '';
    const titleValue = idxTitulo >= 0 ? parts[idxTitulo] : '';
    const inferredTitle = titleValue || mediaValue || (copyValue ? copyValue.slice(0, 60) : '');
    if (!inferredTitle) return null;

    return {
      row: index + 2,
      title: inferredTitle,
      copy: copyValue,
      channel: toChannel(idxCanal >= 0 ? parts[idxCanal] : 'IG'),
      status: toStatus(idxEstado >= 0 ? parts[idxEstado] : 'pendiente'),
      description: mediaValue ? `Media: ${mediaValue}` : null,
      scheduled_at: scheduledDate.toISOString(),
      format: mediaValue || '',
    };
  }).filter(Boolean);
};

const parseDocx = async file => {
  const mammoth = await import('mammoth/mammoth.browser');
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlResult.value || '', 'text/html');
  const tableRows = Array.from(doc.querySelectorAll('tr')).map(row =>
    Array.from(row.querySelectorAll('th,td')).map(cell => cell.textContent.trim())
  ).filter(row => row.some(Boolean));

  const parsedFromTable = parseTableRows(tableRows);
  if (parsedFromTable.length) return { rows: parsedFromTable, debug: { mode: 'docx-table', tableRows } };

  const textResult = await mammoth.extractRawText({ arrayBuffer });
  const text = textResult.value || '';
  const parsedFromText = parseTxt(text);
  return { rows: parsedFromText, debug: { mode: 'docx-text', sample: text.slice(0, 800), lines: text.split(/\r?\n/).slice(0, 8) } };
};

export const ScheduleImportModal = ({ isOpen, onClose, onImport }) => {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFile = async file => {
    try {
      const ext = file.name.toLowerCase();
      let parsed = [];
      if (ext.endsWith('.csv')) {
        const text = await file.text();
        parsed = parseCsv(text);
        setDebugInfo({ mode: 'csv', sample: text.slice(0, 800), lines: text.split(/\r?\n/).slice(0, 8) });
      } else if (ext.endsWith('.docx')) {
        const result = await parseDocx(file);
        parsed = result.rows;
        setDebugInfo(result.debug);
      } else {
        const text = await file.text();
        parsed = parseTxt(text);
        setDebugInfo({ mode: 'text', sample: text.slice(0, 800), lines: text.split(/\r?\n/).slice(0, 8) });
      }
      if (!parsed.length) {
        toast.error('No se encontraron filas validas para importar.');
        setRows([]);
        setFileName(file.name);
        return;
      }
      setRows(parsed);
      setFileName(file.name);
      toast.success(`${parsed.length} filas listas para importar.`);
    } catch (error) {
      toast.error('No se pudo leer el archivo.');
      setRows([]);
      setFileName(file.name || '');
    }
  };

  const canImport = rows.length > 0 && !isImporting;

  const summary = useMemo(() => {
    const byChannel = {};
    rows.forEach(r => {
      byChannel[r.channel] = (byChannel[r.channel] || 0) + 1;
    });
    return byChannel;
  }, [rows]);

  const runImport = async () => {
    if (!canImport) return;
    setIsImporting(true);
    try {
      await onImport(rows);
      toast.success('Importacion completada.');
      setRows([]);
      setFileName('');
      onClose();
    } catch (_error) {
      toast.error('Falló la importacion.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child as={Fragment} enter='ease-out duration-200' enterFrom='opacity-0' enterTo='opacity-100' leave='ease-in duration-150' leaveFrom='opacity-100' leaveTo='opacity-0'>
          <div className='fixed inset-0 bg-black/70' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child as={Fragment} enter='ease-out duration-200' enterFrom='opacity-0 scale-95' enterTo='opacity-100 scale-100' leave='ease-in duration-150' leaveFrom='opacity-100 scale-100' leaveTo='opacity-0 scale-95'>
              <Dialog.Panel className='w-full max-w-4xl rounded-xl border border-[color:var(--color-border-subtle)] bg-surface-strong p-5 shadow-2xl'>
                <div className='flex items-center justify-between'>
                  <Dialog.Title className='text-xl font-semibold text-text-primary'>Importar cronograma</Dialog.Title>
                  <button onClick={onClose} className='rounded-md px-2 py-1 text-sm text-text-muted hover:bg-white/5 hover:text-text-primary'>Cerrar</button>
                </div>

                <div className='mt-4 rounded-lg border border-dashed border-[color:var(--color-border-subtle)] bg-surface-soft p-4'>
                  <label className='block cursor-pointer text-sm text-text-primary'>
                    <span className='inline-flex rounded-md border border-[color:var(--color-border-subtle)] px-3 py-2 hover:bg-white/5'>Seleccionar .csv o .txt</span>
                    <input
                      type='file'
                      accept='.csv,.txt,.docx'
                      className='hidden'
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                      }}
                    />
                  </label>
                  <p className='mt-2 text-xs text-text-muted'>
                    Formato recomendado CSV: `Fecha,Copy,Media,Estado` (hora/canal opcionales). TXT o DOCX: `fecha|hora|copy|media|canal|estado`.
                  </p>
                  {fileName && <p className='mt-2 text-xs text-text-muted'>Archivo: {fileName}</p>}
                </div>

                {debugInfo && rows.length === 0 && (
                  <div className='mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-100'>
                    <p className='font-semibold'>Diagnostico de lectura</p>
                    <p className='mt-1'>Modo: {debugInfo.mode}</p>
                    {debugInfo.tableRows && (
                      <pre className='mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/20 p-2'>
                        {JSON.stringify(debugInfo.tableRows.slice(0, 6), null, 2)}
                      </pre>
                    )}
                    {debugInfo.lines && (
                      <pre className='mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/20 p-2'>
                        {debugInfo.lines.join('\n')}
                      </pre>
                    )}
                    {debugInfo.sample && !debugInfo.lines && (
                      <pre className='mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/20 p-2'>
                        {debugInfo.sample}
                      </pre>
                    )}
                  </div>
                )}

                {rows.length > 0 && (
                  <div className='mt-4'>
                    <div className='mb-2 text-sm text-text-muted'>
                      {rows.length} filas detectadas. {Object.entries(summary).map(([channel, count]) => `${channel}: ${count}`).join(' · ')}
                    </div>
                    <div className='max-h-72 overflow-auto rounded-lg border border-[color:var(--color-border-subtle)]'>
                      <table className='w-full text-left text-xs'>
                        <thead className='bg-surface-soft text-text-muted'>
                          <tr>
                            <th className='px-3 py-2'>Fecha</th>
                            <th className='px-3 py-2'>Titulo</th>
                            <th className='px-3 py-2'>Canal</th>
                            <th className='px-3 py-2'>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, 40).map(row => (
                            <motion.tr key={`${row.row}-${row.title}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='border-t border-[color:var(--color-border-subtle)] text-text-primary'>
                              <td className='px-3 py-2'>{new Date(row.scheduled_at).toLocaleString('es-ES')}</td>
                              <td className='px-3 py-2'>{row.title}</td>
                              <td className='px-3 py-2'>{row.channel}</td>
                              <td className='px-3 py-2'>{row.status}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className='mt-5 flex justify-end gap-2 border-t border-[color:var(--color-border-subtle)] pt-4'>
                  <button onClick={onClose} className='rounded-md border border-[color:var(--color-border-subtle)] px-4 py-2 text-sm text-text-muted hover:text-text-primary'>Cancelar</button>
                  <button onClick={runImport} disabled={!canImport} className='btn-cyber rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60'>
                    {isImporting ? 'Importando...' : 'Importar al calendario'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
