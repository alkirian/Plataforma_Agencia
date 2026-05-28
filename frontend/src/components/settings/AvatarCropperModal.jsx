import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const AvatarCropperModal = ({ onClose, rawImageSrc, onCropSave, t }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDims, setImageDims] = useState({
    width: 256,
    height: 256,
    naturalWidth: 0,
    naturalHeight: 0,
  });

  const cropperImgRef = useRef(null);
  const cropperContainerRef = useRef(null);

  // Cargar e inicializar dimensiones de imagen de forma ultra-segura al cambiar rawImageSrc
  useEffect(() => {
    if (!rawImageSrc) return;

    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (!naturalWidth || !naturalHeight) {
        setImageDims({
          width: 256,
          height: 256,
          naturalWidth: 256,
          naturalHeight: 256,
        });
        setOffset({ x: 0, y: 0 });
        setZoom(1);
        return;
      }

      const viewportSize = 256;
      let initWidth = viewportSize;
      let initHeight = viewportSize;

      if (naturalWidth > naturalHeight) {
        // Landscape: ajustar altura, escalar ancho
        initHeight = viewportSize;
        initWidth = (naturalWidth / naturalHeight) * viewportSize;
      } else {
        // Portrait o Cuadrado: ajustar ancho, escalar altura
        initWidth = viewportSize;
        initHeight = (naturalHeight / naturalWidth) * viewportSize;
      }

      setImageDims({
        width: initWidth,
        height: initHeight,
        naturalWidth,
        naturalHeight,
      });

      // Centrar perfectamente en el visor
      setOffset({
        x: (viewportSize - initWidth) / 2,
        y: (viewportSize - initHeight) / 2,
      });
      setZoom(1);
    };

    img.onerror = () => {
      console.error('Error al precargar la imagen seleccionada');
      setImageDims({
        width: 256,
        height: 256,
        naturalWidth: 256,
        naturalHeight: 256,
      });
      setOffset({ x: 0, y: 0 });
      setZoom(1);
    };

    img.src = rawImageSrc;
  }, [rawImageSrc]);

  // Dragging Mouse / Touch events en el viewport
  const handleMouseDown = e => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleTouchStart = e => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - offset.x,
      y: touch.clientY - offset.y,
    });
  };

  // Efectos para registrar eventos globales en window al arrastrar
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = e => {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, dragStart]);

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowTouchMove = e => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    };

    const handleWindowTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [isDragging, dragStart]);

  // Recorte y Compresión con HTML5 Canvas
  const handleCropSaveInternal = () => {
    const imgEl = cropperImgRef.current;
    if (!imgEl) return;

    const viewportSize = 256;

    // Factor de escala entre visual en zoom=1 y original
    const scaleFactor = imageDims.naturalWidth / imageDims.width;

    // Calcular las dimensiones visuales reales con zoom
    const visualWidth = imageDims.width * zoom;
    const visualHeight = imageDims.height * zoom;

    // Obtener la posición visual de la esquina superior izquierda
    const visualLeft = imageDims.width / 2 + offset.x - visualWidth / 2;
    const visualTop = imageDims.height / 2 + offset.y - visualHeight / 2;

    // Mapear los límites del visor de 256x256 al espacio original de la imagen
    const cropX = (-visualLeft / zoom) * scaleFactor;
    const cropY = (-visualTop / zoom) * scaleFactor;
    const cropW = (viewportSize / zoom) * scaleFactor;
    const cropH = (viewportSize / zoom) * scaleFactor;

    // Crear canvas para el redimensionamiento y compresión
    const canvas = document.createElement('canvas');
    canvas.width = viewportSize;
    canvas.height = viewportSize;
    const ctx = canvas.getContext('2d');

    // Fondo blanco por defecto
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, viewportSize, viewportSize);

    // Suavizado premium
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    try {
      ctx.drawImage(imgEl, cropX, cropY, cropW, cropH, 0, 0, viewportSize, viewportSize);

      // Comprimir a JPEG con calidad 0.8 (resultando en ~15-25KB)
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      onCropSave(compressedBase64);
    } catch (err) {
      console.error('Error al recortar el avatar:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-4'
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className='bg-surface border border-border-strong rounded-3xl p-6 max-w-sm w-full flex flex-col items-center shadow-2xl space-y-6'
      >
        <div className='w-full text-center'>
          <h3 className='text-base font-bold text-text-primary tracking-tight'>
            {t.cropperTitle}
          </h3>
        </div>

        {/* Crop Circular Viewport */}
        <div
          ref={cropperContainerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className='w-64 h-64 rounded-full overflow-hidden relative border-2 border-border-strong bg-black/30 cursor-grab active:cursor-grabbing select-none'
        >
          <img
            ref={cropperImgRef}
            src={rawImageSrc}
            alt='Crop Preview'
            draggable={false}
            className='absolute select-none pointer-events-none origin-center'
            style={{
              width: `${imageDims.width}px`,
              height: `${imageDims.height}px`,
              left: 0,
              top: 0,
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              maxWidth: 'none',
              maxHeight: 'none',
            }}
          />
        </div>

        {/* Slider de Zoom */}
        <div className='w-full space-y-2'>
          <div className='flex justify-between text-xs font-semibold text-text-muted'>
            <span>{t.cropperZoom}</span>
            <span>{zoom.toFixed(2)}x</span>
          </div>
          <input
            type='range'
            min='1'
            max='3'
            step='0.02'
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            style={{ accentColor: 'var(--color-accent-lavender, #4F46E5)' }}
            className='w-full h-1 bg-surface-soft rounded-lg appearance-none cursor-pointer'
          />
        </div>

        {/* Botones de acción */}
        <div className='flex gap-3 w-full'>
          <button
            type='button'
            onClick={onClose}
            className='flex-1 px-4 py-2.5 text-xs font-bold rounded-xl border border-border-subtle hover:bg-surface-soft text-text-muted hover:text-text-primary transition duration-150'
          >
            {t.cropperCancel}
          </button>
          <button
            type='button'
            onClick={handleCropSaveInternal}
            className='flex-1 px-4 py-2.5 text-xs font-bold rounded-xl bg-accent-lavender text-white hover:bg-opacity-90 shadow-md transition duration-150'
          >
            {t.cropperSave}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
