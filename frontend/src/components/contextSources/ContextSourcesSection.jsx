import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

// Components
import { SourceTypeSelector } from './SourceTypeSelector';
import { DocumentSourceUploader } from './DocumentSourceUploader';
import { UrlSourceForm } from './UrlSourceForm';
import { ManualSourceForm } from './ManualSourceForm';
import { NoteSourceForm } from './NoteSourceForm';
import { ContextSourcesList } from './ContextSourcesList';

// Hooks y API
import { useContextSources } from '../../hooks/useContextSources';
import { SOURCE_TYPES, SOURCE_TYPE_CONFIG } from '../../api/contextSources';

export const ContextSourcesSection = ({ clientId, clientName = 'Cliente' }) => {
  const [currentStep, setCurrentStep] = useState('list'); // 'list' | 'select-type' | 'add-source'
  const [selectedSourceType, setSelectedSourceType] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Hook principal
  const {
    sources,
    stats,
    isLoading,
    error,
    refetch,
    getSourcesCount,
    createDocument,
    createUrl,
    createManual,
    createNote,
    update,
    remove,
    download,
    isCreating,
    isUpdating,
    isDeleting,
    isDownloading,
  } = useContextSources(clientId);

  // Handlers para acciones
  const handleTypeSelect = (sourceType) => {
    setSelectedSourceType(sourceType);
    setCurrentStep('add-source');
  };

  const handleBackToList = () => {
    setCurrentStep('list');
    setSelectedSourceType(null);
  };

  const handleBackToTypeSelector = () => {
    setCurrentStep('select-type');
    setSelectedSourceType(null);
  };

  // Handlers para CRUD
  const handleCreateSource = async (sourceData) => {
    try {
      switch (selectedSourceType) {
        case SOURCE_TYPES.DOCUMENT:
          await createDocument(sourceData, sourceData.metadata || {});
          break;
        case SOURCE_TYPES.URL:
          await createUrl(sourceData);
          break;
        case SOURCE_TYPES.MANUAL:
          await createManual(sourceData);
          break;
        case SOURCE_TYPES.NOTE:
          await createNote(sourceData);
          break;
        default:
          throw new Error('Tipo de fuente no válido');
      }
      
      handleBackToList();
      toast.success('Fuente agregada exitosamente');
    } catch (error) {
      console.error('Error creating source:', error);
      throw error; // Re-lanzar para que el formulario lo maneje
    }
  };

  const handleEditSource = (source) => {
    // TODO: Implementar modal de edición
    toast.info('Función de edición próximamente');
  };

  const handleDeleteSource = async (source) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${source.title}"?`)) {
      try {
        await remove(source.id);
      } catch (error) {
        console.error('Error deleting source:', error);
      }
    }
  };

  const handleDownloadSource = async (source) => {
    try {
      await download(source);
    } catch (error) {
      console.error('Error downloading source:', error);
    }
  };

  const handleViewSource = (source) => {
    // TODO: Implementar modal de vista detallada
    toast.info('Vista detallada próximamente');
  };

  // Crear objeto de conteos por tipo
  const sourceCounts = Object.values(SOURCE_TYPES).reduce((acc, type) => {
    acc[type] = getSourcesCount(type);
    return acc;
  }, {});

  // Renderizar formulario según el tipo
  const renderSourceForm = () => {
    const commonProps = {
      onSubmit: handleCreateSource,
      disabled: isCreating
    };

    switch (selectedSourceType) {
      case SOURCE_TYPES.DOCUMENT:
        return (
          <DocumentSourceUploader 
            {...commonProps}
            onUpload={(file, metadata) => handleCreateSource({ file, metadata })}
          />
        );
      case SOURCE_TYPES.URL:
        return <UrlSourceForm {...commonProps} />;
      case SOURCE_TYPES.MANUAL:
        return <ManualSourceForm {...commonProps} />;
      case SOURCE_TYPES.NOTE:
        return <NoteSourceForm {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Breadcrumb navigation */}
          <div className="flex items-center space-x-2 text-sm">
            {currentStep === 'select-type' && (
              <>
                <button
                  onClick={handleBackToList}
                  className="flex items-center space-x-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Fuentes de contexto</span>
                </button>
                <span className="text-text-muted">/</span>
                <span className="text-text-primary">Seleccionar tipo</span>
              </>
            )}
            
            {currentStep === 'add-source' && (
              <>
                <button
                  onClick={handleBackToList}
                  className="flex items-center space-x-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Fuentes de contexto</span>
                </button>
                <span className="text-text-muted">/</span>
                <button
                  onClick={handleBackToTypeSelector}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  Seleccionar tipo
                </button>
                <span className="text-text-muted">/</span>
                <span className="text-text-primary">
                  {SOURCE_TYPE_CONFIG[selectedSourceType]?.name}
                </span>
              </>
            )}
            
            {currentStep === 'list' && (
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold text-text-primary">
                  📚 Fuentes de contexto
                </h2>
                {sources.length > 0 && (
                  <span className="text-sm text-text-muted">
                    para {clientName}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {currentStep === 'list' && (
            <>
              {/* Stats toggle */}
              {sources.length > 0 && (
                <motion.button
                  onClick={() => setShowStats(!showStats)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    showStats
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'bg-surface-soft text-text-muted hover:text-text-primary'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ChartBarIcon className="h-4 w-4" />
                  <span className="hidden sm:block">Estadísticas</span>
                </motion.button>
              )}

              {/* Add button */}
              <motion.button
                onClick={() => setCurrentStep('select-type')}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PlusIcon className="h-4 w-4" />
                <span>Agregar fuente</span>
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && currentStep === 'list' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-surface-soft border border-white/10 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              📊 Estadísticas de fuentes
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(SOURCE_TYPE_CONFIG).map(([type, config]) => {
                const count = sourceCounts[type] || 0;
                const colors = {
                  blue: 'text-blue-400 bg-blue-500/10',
                  green: 'text-green-400 bg-green-500/10',
                  orange: 'text-orange-400 bg-orange-500/10',
                  purple: 'text-purple-400 bg-purple-500/10',
                };
                
                return (
                  <div key={type} className={`p-4 rounded-lg ${colors[config.color]}`}>
                    <div className="text-2xl mb-2">{config.icon}</div>
                    <div className="text-2xl font-bold mb-1">{count}</div>
                    <div className="text-sm opacity-80">{config.name}</div>
                  </div>
                );
              })}
            </div>

            {/* Processing status stats */}
            {stats.processingStats && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-sm font-medium text-text-primary mb-3">Estado de procesamiento</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-green-400 text-xl font-bold">{stats.processingStats.ready || 0}</div>
                    <div className="text-xs text-text-muted">Listos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-orange-400 text-xl font-bold">{stats.processingStats.processing || 0}</div>
                    <div className="text-xs text-text-muted">Procesando</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 text-xl font-bold">{stats.processingStats.pending || 0}</div>
                    <div className="text-xs text-text-muted">Pendientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 text-xl font-bold">{stats.processingStats.error || 0}</div>
                    <div className="text-xs text-text-muted">Con error</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && currentStep === 'list' && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-text-muted">Cargando fuentes de contexto...</p>
        </div>
      )}

      {/* Error State */}
      {error && currentStep === 'list' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">Error: {error.message || String(error)}</p>
          <motion.button
            onClick={refetch}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Reintentar
          </motion.button>
        </div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {currentStep === 'list' && !isLoading && !error && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ContextSourcesList
              sources={sources}
              onEdit={handleEditSource}
              onDelete={handleDeleteSource}
              onDownload={handleDownloadSource}
              onView={handleViewSource}
              disabled={isUpdating || isDeleting || isDownloading}
            />
          </motion.div>
        )}

        {currentStep === 'select-type' && (
          <motion.div
            key="select-type"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-surface-soft border border-white/10 rounded-xl p-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                ¿Qué tipo de fuente deseas agregar?
              </h3>
              <p className="text-text-muted">
                Selecciona el tipo de contenido que quieres usar como contexto
              </p>
            </div>
            
            <SourceTypeSelector
              onTypeSelect={handleTypeSelect}
              sourceCounts={sourceCounts}
              disabled={isCreating}
            />
          </motion.div>
        )}

        {currentStep === 'add-source' && selectedSourceType && (
          <motion.div
            key="add-source"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-surface-soft border border-white/10 rounded-xl p-6"
          >
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{SOURCE_TYPE_CONFIG[selectedSourceType]?.icon}</span>
                <h3 className="text-xl font-semibold text-text-primary">
                  Agregar {SOURCE_TYPE_CONFIG[selectedSourceType]?.name}
                </h3>
              </div>
              <p className="text-text-muted">
                {SOURCE_TYPE_CONFIG[selectedSourceType]?.description}
              </p>
            </div>

            {renderSourceForm()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContextSourcesSection;