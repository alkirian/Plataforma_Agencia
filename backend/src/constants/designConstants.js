// Banco de imágenes premium de stock simuladas según industria del cliente para demostración ultra-realista
export const SIMULATED_STOCK_IMAGES = {
  cosmetics: [
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1200&auto=format&fit=crop'
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1200&auto=format&fit=crop'
  ],
  tech: [
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop'
  ],
  coffee: [
    'https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=1200&auto=format&fit=crop'
  ],
  fashion: [
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop'
  ],
  default: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop', // Abstract premium 3D
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop', // Luxury interior
    'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=1200&auto=format&fit=crop'  // Studio lighting concept
  ]
};

// Banco de extrapolaciones de formato simuladas (expandidas) correspondientes a las imágenes anteriores
export const SIMULATED_OUTPAINT_MAP = {
  // Cosmetics
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1200&auto=format&fit=crop': {
    '1:1': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1200&auto=format&fit=crop',
    '9:16': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1080&auto=format&fit=crop',
    '16:9': 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=1600&auto=format&fit=crop'
  },
  'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1200&auto=format&fit=crop': {
    '1:1': 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1200&auto=format&fit=crop',
    '9:16': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1080&auto=format&fit=crop',
    '16:9': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1600&auto=format&fit=crop'
  },
  // Default/Abstract premium matching styles
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop': {
    '1:1': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    '9:16': 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1080&auto=format&fit=crop',
    '16:9': 'https://images.unsplash.com/photo-1618005198143-d366800e48de?q=80&w=1600&auto=format&fit=crop'
  }
};
