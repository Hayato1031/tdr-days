// Revolutionary Typography System
// Next-generation type design for digital experiences

export const typography = {
  // Font Families - Cutting-edge type combinations
  fontFamily: {
    // Primary Font Stacks
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(', '),
    
    // Display Fonts - For headlines and impact
    display: [
      'Clash Display',
      'Space Grotesk',
      'Inter',
      '-apple-system',
      'sans-serif',
    ].join(', '),
    
    // Mono Fonts - For code and technical content
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'SF Mono',
      'Monaco',
      'Consolas',
      'Liberation Mono',
      'Courier New',
      'monospace',
    ].join(', '),
    
    // Experimental Fonts
    experimental: [
      'Satoshi',
      'General Sans',
      'Inter',
      'sans-serif',
    ].join(', '),
  },
  
  // Font Sizes - Fluid Typography Scale
  fontSize: {
    // Base sizes
    '2xs': '0.625rem',    // 10px
    xs: '0.75rem',        // 12px
    sm: '0.875rem',       // 14px
    base: '1rem',         // 16px
    lg: '1.125rem',       // 18px
    xl: '1.25rem',        // 20px
    '2xl': '1.5rem',      // 24px
    '3xl': '1.875rem',    // 30px
    '4xl': '2.25rem',     // 36px
    '5xl': '3rem',        // 48px
    '6xl': '3.75rem',     // 60px
    '7xl': '4.5rem',      // 72px
    '8xl': '6rem',        // 96px
    '9xl': '8rem',        // 128px
    
    // Fluid sizes using clamp()
    fluid: {
      xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
      sm: 'clamp(0.875rem, 0.825rem + 0.25vw, 1rem)',
      base: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
      lg: 'clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)',
      xl: 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
      '2xl': 'clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)',
      '3xl': 'clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)',
      '4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
      '5xl': 'clamp(3rem, 2.4rem + 3vw, 4.5rem)',
      '6xl': 'clamp(3.75rem, 2.75rem + 5vw, 6rem)',
      '7xl': 'clamp(4.5rem, 3rem + 7.5vw, 8rem)',
    },
  },
  
  // Line Heights - Optimized for readability
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '1.75',
    extra: '2',
    
    // Specific use cases
    body: '1.625',
    heading: '1.2',
    display: '1.1',
    code: '1.5',
  },
  
  // Font Weights - Full spectrum
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
    
    // Semantic weights
    body: 400,
    heading: 700,
    display: 800,
    emphasis: 600,
  },
  
  // Letter Spacing - Precision tracking
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    
    // Specific use cases
    heading: '-0.025em',
    display: '-0.03em',
    body: '0',
    caps: '0.1em',
  },
  
  // Text Styles - Pre-composed combinations
  textStyles: {
    // Display Styles - Maximum impact
    displayXL: {
      fontFamily: 'display',
      fontSize: 'clamp(4.5rem, 3rem + 7.5vw, 8rem)',
      fontWeight: 800,
      lineHeight: '1.1',
      letterSpacing: '-0.03em',
    },
    displayLarge: {
      fontFamily: 'display',
      fontSize: 'clamp(3rem, 2.4rem + 3vw, 4.5rem)',
      fontWeight: 800,
      lineHeight: '1.1',
      letterSpacing: '-0.03em',
    },
    displayMedium: {
      fontFamily: 'display',
      fontSize: 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
      fontWeight: 700,
      lineHeight: '1.2',
      letterSpacing: '-0.025em',
    },
    displaySmall: {
      fontFamily: 'display',
      fontSize: 'clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)',
      fontWeight: 700,
      lineHeight: '1.2',
      letterSpacing: '-0.025em',
    },
    
    // Heading Styles
    h1: {
      fontFamily: 'sans',
      fontSize: 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
      fontWeight: 700,
      lineHeight: '1.2',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: 'sans',
      fontSize: 'clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)',
      fontWeight: 600,
      lineHeight: '1.25',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontFamily: 'sans',
      fontSize: 'clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)',
      fontWeight: 600,
      lineHeight: '1.375',
      letterSpacing: '-0.025em',
    },
    h4: {
      fontFamily: 'sans',
      fontSize: 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
      fontWeight: 600,
      lineHeight: '1.375',
      letterSpacing: '0',
    },
    h5: {
      fontFamily: 'sans',
      fontSize: 'clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)',
      fontWeight: 600,
      lineHeight: '1.5',
      letterSpacing: '0',
    },
    h6: {
      fontFamily: 'sans',
      fontSize: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
      fontWeight: 600,
      lineHeight: '1.5',
      letterSpacing: '0',
    },
    
    // Body Styles
    bodyLarge: {
      fontFamily: 'sans',
      fontSize: 'clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)',
      fontWeight: 400,
      lineHeight: '1.625',
      letterSpacing: '0',
    },
    bodyMedium: {
      fontFamily: 'sans',
      fontSize: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
      fontWeight: 400,
      lineHeight: '1.625',
      letterSpacing: '0',
    },
    bodySmall: {
      fontFamily: 'sans',
      fontSize: 'clamp(0.875rem, 0.825rem + 0.25vw, 1rem)',
      fontWeight: 400,
      lineHeight: '1.5',
      letterSpacing: '0',
    },
    
    // Special Styles
    label: {
      fontFamily: 'sans',
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: '1.5',
      letterSpacing: '0.025em',
      textTransform: 'uppercase' as const,
    },
    caption: {
      fontFamily: 'sans',
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: '1.5',
      letterSpacing: '0',
    },
    overline: {
      fontFamily: 'sans',
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: '1.5',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },
    code: {
      fontFamily: 'mono',
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.5',
      letterSpacing: '0',
    },
    
    // Experimental Styles
    glitch: {
      fontFamily: 'experimental',
      fontSize: 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
      fontWeight: 900,
      lineHeight: '1.1',
      letterSpacing: '-0.05em',
      textTransform: 'uppercase' as const,
    },
    neon: {
      fontFamily: 'display',
      fontSize: 'clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)',
      fontWeight: 700,
      lineHeight: '1.2',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
  },
  
  // Text Decoration Styles
  textDecoration: {
    underline: {
      textDecoration: 'underline',
      textUnderlineOffset: '0.2em',
      textDecorationThickness: '0.1em',
    },
    strikethrough: {
      textDecoration: 'line-through',
      textDecorationThickness: '0.1em',
    },
    wavy: {
      textDecoration: 'underline wavy',
      textUnderlineOffset: '0.3em',
    },
  },
  
  // Text Effects
  textEffects: {
    // Gradient Text
    gradient: {
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
    },
    
    // Text Shadow Effects
    shadow: {
      subtle: '0 1px 2px rgba(0, 0, 0, 0.1)',
      medium: '0 2px 4px rgba(0, 0, 0, 0.2)',
      strong: '0 4px 8px rgba(0, 0, 0, 0.3)',
      glow: '0 0 20px rgba(168, 85, 247, 0.5)',
      neon: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
    },
    
    // Text Stroke
    stroke: {
      thin: '-webkit-text-stroke: 1px currentColor',
      medium: '-webkit-text-stroke: 2px currentColor',
      thick: '-webkit-text-stroke: 3px currentColor',
    },
  },
} as const;

// Type exports
export type Typography = typeof typography;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type TextStyle = keyof typeof typography.textStyles;