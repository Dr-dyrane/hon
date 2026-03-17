# Apple HIG Integration Standards

This project follows Apple's Human Interface Guidelines (HIG) integrated with the Alexander UI Canon.

## 1. Typography Standards
- **Font Family**: Primary: SF Pro (`font-headline`, `font-sans`).
- **Dynamic Tracking**:
  - `tracking-display` (`-0.03em`) for items > 28pt.
  - `tracking-headline` (`-0.015em`) for labels and secondary headers.
  - `tracking-tightest` (`-0.04em`) for small metadata.
- **Weights**: Use `font-semibold` (600) for primary UI labels. Reserve `bold` (700) only for high-impact display headers.
- **Leading**: Use `leading-tight` (1.1) for headlines and `leading-normal` (1.3) with `tracking-body` for paragraphs.

## 2. Material System
Use the following semantic classes for all elevations:
- `.glass-morphism`: Ultra Thin (`blur(20px) saturate(180%)`) - Use for Navbars and high-level overlays.
- `.card-premium`: Thin (`blur(14px) saturate(140%)`) - Standard for all content cards.
- `.button-secondary`: Regular (`blur(10px) saturate(120%)`) - Used for secondary interactive elements.

## 3. Design Hierarchy
- **Rule #4**: One Screen, One Action. Minimize secondary actions to reduce cognitive load.
- **Rules of Motion**: Use `ease-premium` (Apple-spec cubic-bezier) for all transitions. No bouncing; only smooth slides, fades, and morphs.
