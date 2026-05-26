import React, { useState } from 'react';

/**
 * Componente interactivo y visual para gestionar arreglos de strings como etiquetas/tags.
 * @param {object} props
 * @param {Array<string>} props.tags - El arreglo de etiquetas activas.
 * @param {function} props.onChange - Callback ejecutado al añadir o remover etiquetas.
 * @param {string} props.placeholder - Texto de placeholder del input.
 */
export const TagInput = ({ tags = [], onChange, placeholder = 'Añadir elemento...' }) => {
  const [inputValue, setInputValue] = useState('');

  const activeTags = Array.isArray(tags) ? tags : [];

  const handleKeyDown = e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); // Evitar envío accidental de formularios padres
      const trimmed = inputValue.trim().replace(/,/g, '');
      if (trimmed && !activeTags.includes(trimmed)) {
        const newTags = [...activeTags, trimmed];
        onChange(newTags);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && activeTags.length > 0) {
      // Eliminar el último elemento si presiona Backspace en un campo vacío
      const newTags = activeTags.slice(0, -1);
      onChange(newTags);
    }
  };

  const handleRemoveTag = tagToRemove => {
    const newTags = activeTags.filter(tag => tag !== tagToRemove);
    onChange(newTags);
  };

  return (
    <div className='w-full rounded-lg border border-[#2B282F] bg-[#161517] p-2 focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-white/5 transition-all space-y-2'>
      {/* Listado de Tags / Chips */}
      {activeTags.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {activeTags.map((tag, idx) => (
            <div
              key={`${tag}-${idx}`}
              className='inline-flex items-center gap-1 rounded bg-[#222024] border border-[#2B282F] px-2 py-0.5 text-xs font-semibold text-white transition-all hover:border-gray-500'
            >
              <span>{tag}</span>
              <button
                type='button'
                onClick={() => handleRemoveTag(tag)}
                className='ml-1 text-gray-400 hover:text-red-400 transition-colors focus:outline-none'
              >
                <svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input de entrada */}
      <input
        type='text'
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className='w-full bg-transparent px-1 py-1 text-sm text-white placeholder-gray-600 focus:outline-none'
      />
    </div>
  );
};
