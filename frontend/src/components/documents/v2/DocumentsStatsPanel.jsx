// DocumentsStatsPanel.jsx - Storage statistics panel for Documents Section
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DocumentsStatsPanel = ({ showStats, stats, isLoadingStats }) => {
  return (
    <AnimatePresence>
      {showStats && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className='bg-surface-soft border border-gray-200/10 rounded-xl p-4'
        >
          <h3 className='text-lg font-semibold text-text-primary mb-3'>Storage Statistics</h3>
          {isLoadingStats ? (
            <StatsLoadingSkeleton />
          ) : (
            <StatsGrid stats={stats} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const StatsLoadingSkeleton = () => (
  <div className='animate-pulse space-y-2'>
    <div className='h-4 bg-surface-muted rounded w-1/3' />
    <div className='h-4 bg-surface-muted rounded w-1/4' />
    <div className='h-4 bg-surface-muted rounded w-1/2' />
  </div>
)

const StatsGrid = ({ stats }) => (
  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
    <StatItem
      label='Total Documents'
      value={stats.totalDocuments || 0}
    />
    <StatItem
      label='Total Size'
      value={formatFileSize(stats.totalSize || 0)}
    />
    <StatItem
      label='Pinned'
      value={stats.pinnedCount || 0}
    />
    <StatItem
      label='Versions'
      value={stats.versionCount || 0}
    />
  </div>
)

const StatItem = ({ label, value }) => (
  <div>
    <p className='text-text-muted'>{label}</p>
    <p className='text-xl font-semibold text-text-primary'>
      {value}
    </p>
  </div>
)

// Utility function
const formatFileSize = bytes => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default DocumentsStatsPanel