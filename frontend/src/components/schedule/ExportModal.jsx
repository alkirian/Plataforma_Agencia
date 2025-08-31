import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  Download,
  X,
  FileText,
  CalendarDays,
  Code,
  BarChart2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToCSV, exportToICS, exportToJSON, getExportSummary } from '../../utils/calendarExport';

export const ExportModal = ({ 
  isOpen, 
  onClose, 
  events = [], 
  clientName = '',
  dateRange = null 
}) => {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    {
      id: 'csv',
      name: 'CSV (Excel)',
      description: 'Perfecto para análisis en Excel o Google Sheets',
      icon: FileText,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/30'
    },
    {
      id: 'ics',
      name: 'iCal (ICS)',
      description: 'Importar a Google Calendar, Outlook, Apple Calendar',
      icon: CalendarDays,
      color: 'text-text-muted',
      bgColor: 'bg-gray-500/10 border-gray-500/30'
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'Para integraciones técnicas y backup completo',
      icon: Code,
      color: 'text-text-primary',
      bgColor: 'bg-gray-600/10 border-gray-600/30'
    }
  ];

  const exportSummary = getExportSummary(events);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // UX delay
      
      switch (selectedFormat) {
        case 'csv':
          exportToCSV(events, clientName);
          break;
        case 'ics':
          exportToICS(events, clientName);
          break;
        case 'json':
          exportToJSON(events, clientName);
          break;
        default:
          throw new Error('Formato no soportado');
      }
      
      onClose();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error exporting calendar:', error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl 
                                        bg-surface-strong border border-[color:var(--color-border-subtle)] 
                                        p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Download className="h-6 w-6 text-primary-400" />
                    <Dialog.Title className="text-xl font-semibold text-text-primary">
                      Exportar Calendario
                    </Dialog.Title>
                  </div>
                  
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="rounded-full p-2 text-text-muted hover:text-text-primary hover:bg-surface-soft 
                               transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Resumen de eventos */}
                <div className="mb-6 p-4 bg-surface-soft rounded-lg border border-[color:var(--color-border-subtle)]">
                  <div className="flex items-center space-x-2 mb-3">
                    <BarChart2 className="h-5 w-5 text-text-muted" />
                    <h3 className="text-sm font-medium text-text-primary">Resumen de exportación</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-muted">Total de eventos:</span>
                      <span className="ml-2 text-text-primary font-medium">{exportSummary.total}</span>
                    </div>
                    
                    {clientName && (
                      <div>
                        <span className="text-text-muted">Cliente:</span>
                        <span className="ml-2 text-text-primary font-medium">{clientName}</span>
                      </div>
                    )}
                    
                    {exportSummary.dateRange && (
                      <div className="col-span-2">
                        <span className="text-text-muted">Período:</span>
                        <span className="ml-2 text-text-primary font-medium">
                          {exportSummary.dateRange.from} - {exportSummary.dateRange.to}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Estados */}
                  {Object.keys(exportSummary.byStatus).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[color:var(--color-border-subtle)]">
                      <span className="text-xs text-text-muted uppercase tracking-wide">Por estado:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(exportSummary.byStatus).map(([status, count]) => (
                          <span 
                            key={status}
                            className="px-2 py-1 bg-white/10 rounded text-xs text-text-primary"
                          >
                            {status}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selección de formato */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-text-primary mb-3">Seleccionar formato:</h3>
                  <div className="space-y-3">
                    {exportFormats.map((format) => {
                      const Icon = format.icon;
                      const isSelected = selectedFormat === format.id;
                      
                      return (
                        <motion.div
                          key={format.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-lg border transition-all cursor-pointer ${
                            isSelected 
                              ? format.bgColor
                              : 'border-[color:var(--color-border-subtle)] hover:border-white/20 bg-surface-soft'
                          }`}
                          onClick={() => setSelectedFormat(format.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <Icon className={`h-6 w-6 mt-0.5 ${
                              isSelected ? format.color : 'text-text-muted'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className={`font-medium ${
                                  isSelected ? 'text-text-primary' : 'text-text-primary'
                                }`}>
                                  {format.name}
                                </h4>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 bg-primary-500 rounded-full"
                                  />
                                )}
                              </div>
                              <p className="text-sm text-text-muted mt-1">
                                {format.description}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex items-center justify-end space-x-3">
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-text-muted hover:text-text-primary transition-colors"
                    disabled={isExporting}
                  >
                    Cancelar
                  </motion.button>
                  
                  <motion.button
                    onClick={handleExport}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isExporting || events.length === 0}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 
                               text-text-primary rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {isExporting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span>Exportando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Exportar</span>
                      </>
                    )}
                  </motion.button>
                </div>

                {events.length === 0 && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-400">
                      No hay eventos para exportar en el período seleccionado.
                    </p>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
