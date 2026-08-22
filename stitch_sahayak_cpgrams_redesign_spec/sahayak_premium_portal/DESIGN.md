---
name: Sahayak Premium Portal
colors:
  surface: '#fcf8f9'
  surface-dim: '#dcd9da'
  surface-bright: '#fcf8f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f4'
  surface-container: '#f0edee'
  surface-container-high: '#eae7e8'
  surface-container-highest: '#e5e2e3'
  on-surface: '#1b1b1c'
  on-surface-variant: '#5a413d'
  inverse-surface: '#303031'
  inverse-on-surface: '#f3f0f1'
  outline: '#8e706c'
  outline-variant: '#e2bfb9'
  surface-tint: '#b22b1d'
  primary: '#570000'
  on-primary: '#ffffff'
  primary-container: '#800000'
  on-primary-container: '#ff8371'
  inverse-primary: '#ffb4a8'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffbf00'
  on-secondary-container: '#6d5000'
  tertiary: '#252728'
  on-tertiary: '#ffffff'
  tertiary-container: '#3b3d3d'
  on-tertiary-container: '#a6a7a8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#8f0f07'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#fbbc00'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fcf8f9'
  on-background: '#1b1b1c'
  surface-variant: '#e5e2e3'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 2rem
  gutter: 1.5rem
  panel-gap: 2rem
  touch-target: 44px
---

## Brand & Style
The design system for the Sahayak CPGRAMS portal is rooted in **Premium Glassmorphism**. It transforms a government service interface into a high-end, modern OS-like experience. The brand personality is authoritative yet approachable, utilizing "Glass-Mosaic" layers to represent transparency, clarity, and the multi-faceted nature of public assistance. 

The aesthetic focuses on depth and light. By utilizing high-refractive glass panels over organic, bleeding gradients, the UI achieves a sense of weightlessness and sophistication. This style moves away from the traditional "institutional" look toward a refined, digital-first environment that evokes trust through precision and modern craft.

## Colors
The palette is a sophisticated blend of heritage and action. 

- **Primary Maroon (#800000):** Used for critical status indicators, primary text contrast, and deep-layer accents. It provides the "institutional" anchor to the design.
- **Secondary Amber (#FFBF00):** Reserved for primary calls-to-action, high-priority notifications, and interactive highlights. It represents help, optimism, and warmth.
- **Glass Base:** Surfaces are not solid white; they are semi-transparent whites (`rgba(255, 255, 255, 0.15)` to `rgba(255, 255, 255, 0.40)`), allowing the background gradients to bleed through.
- **Background:** A soft, vibrant mesh gradient of Maroon and Amber sits behind all UI layers to provide the "light source" for the glass effects.

## Typography
The system relies on **Inter** for its neutral, high-legibility characteristics. To maintain a premium feel, the typography utilizes generous line heights and subtle letter spacing (tracking) to prevent the "cluttered" look often found in government portals.

Headlines should be set with tighter tracking to feel cohesive, while body text and labels use slightly increased tracking to ensure readability against complex glass backgrounds. Use "Primary Maroon" for main headings and "Neutral" (near-black) for body content to ensure WCAG accessibility over translucent surfaces.

## Layout & Spacing
The layout follows a **Fluid Grid** model with high-margin "Safe Zones." This creates the effect of panels floating in space rather than being tethered to the screen edges.

- **Desktop:** 12-column grid, 24px gutters, and 80px side margins. Panels should often span 4, 6, or 8 columns to maintain a spacious, centered aesthetic.
- **Mobile:** 4-column grid, 16px gutters, and 16px side margins. Stack glass panels vertically with 16px gaps.
- **Rhythm:** All spacing (padding/margins) must be multiples of 8px to maintain a strict mathematical harmony.

## Elevation & Depth
Depth in this design system is achieved through "Optical Stacking" rather than simple shadows:

1.  **Backdrop Blur:** Every surface must have a minimum of `20px` backdrop-filter blur.
2.  **Edge Definition:** A `0.5px` to `1px` solid white border at `20%` opacity mimics the bevel of a thin glass pane.
3.  **Inner Glow:** A subtle `inset 0 1px 0 rgba(255,255,255,0.4)` shadow on the top edge of panels provides a light-catching effect.
4.  **Drop Shadows:** Use very large, highly diffused shadows (`blur: 40px`, `opacity: 10%`) to lift panels off the vibrant background. Shadows should take on a slight tint of the background color (Maroon) rather than pure black.

## Shapes
The shape language is "Organic-Geometric." 

- **Primary Panels/Cards:** Use a `24px` (rounded-xl) corner radius to create a friendly, modern container.
- **Interactive Elements:** Buttons and input fields use a `12px` (rounded-lg) radius.
- **Form Factors:** Avoid sharp 90-degree angles entirely. Circles are used for status indicators and user avatars to contrast against the soft-rectangle panels.

## Components

### Buttons
- **Primary (Amber):** Solid `#FFBF00` with dark text. No transparency. Apply a soft amber outer glow on hover.
- **Secondary (Glass):** Semi-transparent white background (`20%`) with the 1px glass border. Maroon text.
- **Corner Radius:** 12px.

### Cards & Panels
- The core of the design. Must include `backdrop-filter: blur(24px)`, `background: rgba(255, 255, 255, 0.2)`, and the `1px` white border.
- **Padding:** 32px for desktop, 20px for mobile.

### Input Fields
- Glass-morphism applied to the field itself: `rgba(255, 255, 255, 0.1)` fill.
- **Focus State:** Border changes to `Primary Maroon` with a `4px` soft outer glow.

### Chips & Badges
- Used for status (e.g., "Pending", "Resolved"). 
- High-saturation backgrounds with 70% opacity to ensure the text remains legible while the color "pops" against the glass panel.

### Lists
- Each list item should be separated by a subtle `1px` white line at `10%` opacity. 
- Use "Hover" states that slightly increase the panel's white opacity to `30%` to signify interactivity.