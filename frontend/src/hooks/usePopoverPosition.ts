import { useState, useEffect, useCallback } from 'react'

/**
 * Click coordinates interface
 */
interface ClickCoordinates {
  x: number
  y: number
}

/**
 * Popover dimensions interface
 */
interface PopoverDimensions {
  width: number
  height: number
}

/**
 * Position interface
 */
interface Position {
  x: number
  y: number
}

/**
 * Return type for usePopoverPosition hook
 */
interface UsePopoverPositionReturn {
  position: Position
  isVisible: boolean
}

/**
 * Debug information interface
 */
interface PopoverDebugInfo {
  clickCoords: ClickCoordinates
  viewport: { width: number; height: number }
  popoverDimensions: PopoverDimensions
  spaces: { above: number; below: number }
  fitsBelow: boolean
  fitsAbove: boolean
  strategy: 'below' | 'above' | 'aligned' | 'best-fit'
  calculatedPosition: Position
}

/**
 * Cell bounds interface for exact positioning
 */
interface CellBounds {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
  x: number
  y: number
}

/**
 * Hook para calcular la posición óptima del popover
 * Evita que se salga del viewport y ajusta automáticamente
 *
 * Key improvements:
 * - Full TypeScript support with comprehensive interfaces
 * - Enhanced type safety for coordinates and dimensions
 * - Better performance with optimized position calculations
 * - Improved debugging capabilities with structured info
 * - Memory optimization for resize event handlers
 * - Support for exact cell positioning with cellBounds
 *
 * @param clickCoords - Coordenadas del click
 * @param popoverDimensions - Dimensiones del popover
 * @param cellBounds - Límites exactos de la celda clickeada (opcional)
 */
export const usePopoverPosition = (
  clickCoords: ClickCoordinates | null | undefined,
  popoverDimensions: PopoverDimensions = { width: 320, height: 420 },
  cellBounds: CellBounds | null | undefined = null
): UsePopoverPositionReturn => {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState<boolean>(false)

  const calculatePosition = useCallback((): Position => {
    // If we have cellBounds, use them for exact positioning
    if (cellBounds) {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      }

      const { width: popoverWidth, height: popoverHeight } = popoverDimensions
      const margin = 16
      const gap = 4 // Small gap between cell and popover

      let x: number
      let y: number

      // Try positions in priority order
      const positions = [
        // Right of cell
        {
          x: cellBounds.right + gap,
          y: cellBounds.top,
          fits: () => cellBounds.right + gap + popoverWidth + margin <= viewport.width,
        },
        // Left of cell
        {
          x: cellBounds.left - popoverWidth - gap,
          y: cellBounds.top,
          fits: () => cellBounds.left - popoverWidth - gap >= margin,
        },
        // Below cell
        {
          x: cellBounds.left,
          y: cellBounds.bottom + gap,
          fits: () => cellBounds.bottom + gap + popoverHeight + margin <= viewport.height,
        },
        // Above cell
        {
          x: cellBounds.left,
          y: cellBounds.top - popoverHeight - gap,
          fits: () => cellBounds.top - popoverHeight - gap >= margin,
        },
        // Aligned with cell top, overlapping if necessary
        {
          x: Math.max(margin, Math.min(cellBounds.left, viewport.width - popoverWidth - margin)),
          y: cellBounds.top,
          fits: () => true,
        },
      ]

      // Find first position that fits
      const bestPosition = positions.find(pos => pos.fits()) || positions[positions.length - 1]
      x = bestPosition.x
      y = bestPosition.y

      // Ensure bounds
      x = Math.max(margin, Math.min(x, viewport.width - popoverWidth - margin))
      y = Math.max(margin, Math.min(y, viewport.height - popoverHeight - margin))

      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 CellBounds Positioning:', {
          cellBounds,
          calculatedPosition: { x, y },
          popoverDimensions,
          viewport,
        })
      }

      return { x, y }
    }

    // Fallback to click coordinates if no cellBounds
    if (!clickCoords) return { x: 0, y: 0 }

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    const { x: clickX, y: clickY } = clickCoords
    const { width: popoverWidth, height: popoverHeight } = popoverDimensions

    // Enhanced margin and positioning settings
    const margin = 16
    const preferredOffset = 0 // Direct positioning next to cell (no offset)
    const cellPadding = 2 // Small padding to account for cell borders

    // ========== IMPROVED HORIZONTAL POSITIONING ==========
    let x: number
    let horizontalStrategy: 'right' | 'left' | 'centered' = 'right'

    // Calculate available spaces
    const spaceRight = viewport.width - clickX - margin
    const spaceLeft = clickX - margin

    // Position directly adjacent to the clicked cell
    if (spaceRight >= popoverWidth) {
      // Position to the right of click point (directly adjacent)
      x = clickX + cellPadding
      horizontalStrategy = 'right'
    } else if (spaceLeft >= popoverWidth) {
      // Position to the left of click point (directly adjacent)
      x = clickX - popoverWidth - cellPadding
      horizontalStrategy = 'left'
    } else {
      // Not enough space on either side - overlap the cell if necessary
      if (spaceRight > spaceLeft) {
        // More space on right, align with click point
        x = Math.min(clickX, viewport.width - popoverWidth - margin)
        horizontalStrategy = 'right'
      } else {
        // More space on left, align end with click point
        x = Math.max(margin, clickX - popoverWidth)
        horizontalStrategy = 'left'
      }
    }

    // Ensure horizontal bounds
    x = Math.max(margin, Math.min(x, viewport.width - popoverWidth - margin))

    // ========== IMPROVED VERTICAL POSITIONING ==========
    const spaceBelow = viewport.height - clickY - margin
    const spaceAbove = clickY - margin

    let y: number
    let verticalStrategy: 'below' | 'above' | 'aligned' | 'best-fit' = 'aligned'

    // Try to align top of popover with clicked cell
    const alignedY = clickY - 20 // Slight offset to align with cell top
    const wouldFitAligned =
      alignedY >= margin && alignedY + popoverHeight <= viewport.height - margin

    if (wouldFitAligned) {
      // Align with the clicked cell vertically
      y = alignedY
      verticalStrategy = 'aligned'
    } else if (spaceBelow >= popoverHeight) {
      // Fits below - position directly below cell
      y = clickY + cellPadding
      verticalStrategy = 'below'
    } else if (spaceAbove >= popoverHeight) {
      // Fits above - position directly above cell
      y = clickY - popoverHeight - cellPadding
      verticalStrategy = 'above'
    } else {
      // Use best-fit strategy - position with maximum visibility
      if (spaceAbove > spaceBelow) {
        y = Math.max(margin, clickY - popoverHeight + 40) // Keep some connection to click point
      } else {
        y = Math.min(viewport.height - popoverHeight - margin, clickY - 40)
      }
      verticalStrategy = 'best-fit'
    }

    // Final bounds checking
    y = Math.max(margin, Math.min(y, viewport.height - popoverHeight - margin))

    // Enhanced debug information
    if (process.env.NODE_ENV === 'development') {
      const debugInfo = {
        clickCoords: { x: clickX, y: clickY },
        viewport: { width: viewport.width, height: viewport.height },
        popoverDimensions,
        spaces: {
          above: spaceAbove,
          below: spaceBelow,
          left: spaceLeft,
          right: spaceRight,
        },
        strategies: {
          horizontal: horizontalStrategy,
          vertical: verticalStrategy,
        },
        fitsBelow: spaceBelow >= popoverHeight,
        fitsAbove: spaceAbove >= popoverHeight,
        calculatedPosition: { x, y },
        offsets: {
          horizontal:
            horizontalStrategy === 'centered'
              ? 0
              : horizontalStrategy === 'right'
                ? cellPadding
                : -cellPadding,
          vertical:
            verticalStrategy === 'aligned'
              ? -20
              : verticalStrategy === 'below'
                ? cellPadding
                : -cellPadding,
        },
      }
      console.log('🎯 Enhanced PopoverPosition Debug:', debugInfo)
    }

    return { x, y }
  }, [clickCoords, cellBounds, popoverDimensions.width, popoverDimensions.height])

  // Recalcular posición cuando cambian las coordenadas o cellBounds
  useEffect(() => {
    if (clickCoords || cellBounds) {
      const newPosition = calculatePosition()
      setPosition(newPosition)
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [clickCoords, cellBounds, calculatePosition])

  // Recalcular en resize
  useEffect(() => {
    const handleResize = (): void => {
      if (clickCoords || cellBounds) {
        const newPosition = calculatePosition()
        setPosition(newPosition)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [calculatePosition, clickCoords, cellBounds])

  return {
    position,
    isVisible,
  }
}
