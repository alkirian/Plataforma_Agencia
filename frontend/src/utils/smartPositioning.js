/**
 * Sistema inteligente de posicionamiento para toasts
 * Se adapta automáticamente según el viewport y contexto
 */

export class SmartPositioning {
  constructor() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    this.isMobile = this.viewportWidth < 768;
    this.isTablet = this.viewportWidth >= 768 && this.viewportWidth < 1024;
    this.isDesktop = this.viewportWidth >= 1024;
    
    // Escuchar cambios de viewport
    this.setupViewportListener();
    
    // Detectar elementos que pueden interferir
    this.detectUIElements();
  }

  setupViewportListener() {
    window.addEventListener('resize', () => {
      this.viewportWidth = window.innerWidth;
      this.viewportHeight = window.innerHeight;
      this.isMobile = this.viewportWidth < 768;
      this.isTablet = this.viewportWidth >= 768 && this.viewportWidth < 1024;
      this.isDesktop = this.viewportWidth >= 1024;
      this.detectUIElements();
    });
  }

  detectUIElements() {
    // Detectar header height
    const header = document.querySelector('header') || document.querySelector('[data-header]');
    this.headerHeight = header ? header.offsetHeight : 64;

    // Detectar sidebar o navegación lateral
    const sidebar = document.querySelector('[data-sidebar]') || document.querySelector('aside');
    this.sidebarWidth = sidebar ? sidebar.offsetWidth : 0;

    // Detectar chat panel abierto
    const chatPanel = document.querySelector('[data-chat-open="true"]');
    this.chatPanelWidth = chatPanel ? chatPanel.offsetWidth : 0;

    // Detectar modal o overlay activo
    this.hasActiveModal = document.querySelector('[role="dialog"]') !== null;

    // Detectar keyboard en móvil (aproximación)
    this.keyboardVisible = this.isMobile && window.visualViewport && 
      window.visualViewport.height < window.innerHeight * 0.75;
  }

  /**
   * Calcular la mejor posición para un toast
   */
  getOptimalPosition(toastType = 'default', priority = 'normal') {
    this.detectUIElements(); // Refresh state

    // Factores para decidir posición
    const factors = {
      viewport: this.getViewportFactor(),
      ui: this.getUIInterferenceFactor(),
      content: this.getContentFactor(toastType),
      priority: this.getPriorityFactor(priority)
    };

    return this.calculatePosition(factors);
  }

  getViewportFactor() {
    if (this.isMobile) {
      return {
        preferredX: 'center',
        preferredY: this.keyboardVisible ? 'top' : 'bottom',
        allowFullWidth: true,
        margin: 16
      };
    }

    if (this.isTablet) {
      return {
        preferredX: 'right',
        preferredY: 'bottom',
        allowFullWidth: false,
        margin: 24
      };
    }

    // Desktop
    return {
      preferredX: 'right',
      preferredY: 'bottom',
      allowFullWidth: false,
      margin: 32
    };
  }

  getUIInterferenceFactor() {
    const interference = {
      top: this.headerHeight,
      right: this.chatPanelWidth,
      bottom: this.keyboardVisible ? window.innerHeight - window.visualViewport.height : 0,
      left: this.sidebarWidth
    };

    return {
      avoidTop: interference.top > 80,
      avoidRight: interference.right > 200,
      avoidBottom: interference.bottom > 100,
      avoidLeft: interference.left > 200,
      interference
    };
  }

  getContentFactor(toastType) {
    // Algunos tipos de toast necesitan más atención
    const attentionTypes = ['error', 'critical', 'actionable'];
    const needsAttention = attentionTypes.includes(toastType);

    return {
      needsAttention,
      preferCenter: needsAttention && this.isMobile,
      allowStack: !needsAttention
    };
  }

  getPriorityFactor(priority) {
    const isHighPriority = ['high', 'critical'].includes(priority);
    
    return {
      isHighPriority,
      forceFocus: priority === 'critical',
      allowBackground: priority === 'low'
    };
  }

  calculatePosition(factors) {
    const { viewport, ui, content, priority } = factors;
    
    // Posición base según viewport
    let position = {
      x: viewport.preferredX,
      y: viewport.preferredY
    };

    // Ajustar por interferencia de UI
    if (ui.avoidRight && position.x === 'right') {
      position.x = this.isMobile ? 'center' : 'left';
    }

    if (ui.avoidBottom && position.y === 'bottom') {
      position.y = 'top';
    }

    if (ui.avoidTop && position.y === 'top') {
      position.y = 'bottom';
    }

    // Ajustar por contenido crítico
    if (content.needsAttention || priority.forceFocus) {
      if (this.isMobile) {
        position = { x: 'center', y: 'center' };
      } else {
        position = { x: 'center', y: 'top' };
      }
    }

    // Calcular offset específico
    const offset = this.calculateOffset(position, factors);

    return {
      position: this.formatPosition(position),
      offset,
      style: this.getPositionStyle(position, offset, factors)
    };
  }

  calculateOffset(position, factors) {
    const { viewport, ui } = factors;
    
    const offset = {
      top: viewport.margin,
      right: viewport.margin,
      bottom: viewport.margin,
      left: viewport.margin
    };

    // Ajustar por interferencias
    if (position.y === 'top') {
      offset.top += ui.interference.top;
    }
    if (position.x === 'right') {
      offset.right += ui.interference.right;
    }
    if (position.y === 'bottom') {
      offset.bottom += ui.interference.bottom;
    }
    if (position.x === 'left') {
      offset.left += ui.interference.left;
    }

    return offset;
  }

  formatPosition(position) {
    const x = position.x;
    const y = position.y;

    // Mapear a formato de react-hot-toast
    const positionMap = {
      'top-left': 'top-left',
      'top-center': 'top-center',
      'top-right': 'top-right',
      'bottom-left': 'bottom-left',
      'bottom-center': 'bottom-center',
      'bottom-right': 'bottom-right'
    };

    const key = `${y}-${x}`;
    return positionMap[key] || 'bottom-right';
  }

  getPositionStyle(position, offset, factors) {
    const { viewport } = factors;
    
    const style = {};

    // Ancho responsivo
    if (this.isMobile && viewport.allowFullWidth) {
      style.width = `calc(100vw - ${offset.left + offset.right}px)`;
      style.maxWidth = '100%';
    } else {
      style.maxWidth = this.isMobile ? '320px' : '400px';
    }

    // Positioning específico
    if (position.x === 'center') {
      style.left = '50%';
      style.transform = 'translateX(-50%)';
    }

    if (position.y === 'center') {
      style.top = '50%';
      style.transform = style.transform 
        ? `${style.transform} translateY(-50%)`
        : 'translateY(-50%)';
    }

    // Z-index inteligente
    if (this.hasActiveModal) {
      style.zIndex = 1060; // Por encima del modal
    }

    return style;
  }

  /**
   * Configuración específica por categoría
   */
  getPositionForCategory(category, type = 'default', priority = 'normal') {
    const categoryConfigs = {
      auth: {
        preferredPosition: 'top-center',
        priority: 'high'
      },
      task: {
        preferredPosition: 'bottom-right',
        allowStack: true
      },
      ai: {
        preferredPosition: 'bottom-left',
        avoidChatPanel: true
      },
      reminder: {
        preferredPosition: 'top-right',
        priority: 'high',
        persistent: true
      },
      system: {
        preferredPosition: 'top-center',
        priority: 'critical'
      }
    };

    const config = categoryConfigs[category] || {};
    const effectivePriority = config.priority || priority;
    
    // Si tiene configuración específica, usarla
    if (config.preferredPosition && !this.hasConflicts(config)) {
      return {
        position: config.preferredPosition,
        style: this.getStyleForPosition(config.preferredPosition, config),
        offset: this.getOffsetForPosition(config.preferredPosition)
      };
    }

    // Sino, calcular dinámicamente
    return this.getOptimalPosition(type, effectivePriority);
  }

  hasConflicts(config) {
    // Verificar si la posición preferida tiene conflictos
    if (config.avoidChatPanel && this.chatPanelWidth > 200) {
      return config.preferredPosition.includes('right');
    }

    if (this.keyboardVisible && config.preferredPosition.includes('bottom')) {
      return true;
    }

    return false;
  }

  getStyleForPosition(position, config = {}) {
    const style = {};
    
    if (this.isMobile) {
      style.width = 'calc(100vw - 32px)';
      style.maxWidth = '100%';
    }

    if (config.persistent) {
      style.zIndex = 9999;
    }

    return style;
  }

  getOffsetForPosition(position) {
    const base = {
      top: 16,
      right: 16,
      bottom: 16,
      left: 16
    };

    // Ajustar según elementos de UI
    if (position.includes('top')) {
      base.top += this.headerHeight;
    }

    if (position.includes('right')) {
      base.right += this.chatPanelWidth;
    }

    if (position.includes('bottom') && this.keyboardVisible) {
      base.bottom += window.innerHeight - window.visualViewport.height;
    }

    return base;
  }

  /**
   * Métodos públicos para usar en toastManager
   */
  static getSmartPosition(options = {}) {
    const instance = new SmartPositioning();
    return instance.getPositionForCategory(
      options.category || 'default',
      options.type || 'default',
      options.priority || 'normal'
    );
  }

  static configure(toastOptions) {
    const smartPos = SmartPositioning.getSmartPosition(toastOptions);
    
    return {
      ...toastOptions,
      position: smartPos.position,
      style: {
        ...toastOptions.style,
        ...smartPos.style
      }
    };
  }
}

// Instance singleton para performance
let smartPositioning = null;

export const getSmartPositioning = () => {
  if (!smartPositioning) {
    smartPositioning = new SmartPositioning();
  }
  return smartPositioning;
};

// Helper function para usar en toastManager
export const configureSmartPosition = (options) => {
  return SmartPositioning.configure(options);
};