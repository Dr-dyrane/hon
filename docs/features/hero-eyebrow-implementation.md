# Hero Eyebrow Badge Implementation

## 🎯 Overview

Applied the hero section's exact eyebrow badge design pattern to all sections using the same `hero-eyebrow` CSS class and structure.

## ✅ Components Created

### **HeroEyebrow.tsx**
Reusable component that uses the exact same styling as the hero section:

```typescript
<HeroEyebrow 
  iconSrc="/images/icons/lightbulb.svg"
  iconAlt="Lightbulb"
  position="center"
  animated
>
  The System
</HeroEyebrow>
```

## 🎨 Design Pattern

### **Exact Hero Styling**
Uses the same CSS class and structure:

```css
.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--muted);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}
```

### **Icon Integration**
```typescript
<Image
  src={iconSrc}
  alt={iconAlt}
  width={14}
  height={14}
  className="mr-2 dark:invert"
/>
```

## 📝 Sections Updated

### ✅ **Completed Sections**
1. **HeroSection**: Original implementation (unchanged)
2. **SolutionSection**: "The System" with lightbulb icon
3. **BenefitsGrid**: "Capabilities" with sparkles icon  
4. **IngredientSection**: "Transparency" with leaf icon
5. **HowItWorks**: "The Ritual" with cog icon

### **Icon Mapping**
- **Solution**: `/images/icons/lightbulb.svg`
- **Benefits**: `/images/icons/sparkles.svg`
- **Ingredients**: `/images/icons/leaf.svg`
- **How It Works**: `/images/icons/cog.svg`

## 🔧 Implementation Details

### **Position Options**
- **`center`**: Centered alignment (default)
- **`left`**: Left-aligned on desktop, center on mobile
- **`right`**: Right-aligned on desktop, center on mobile

### **Animation Support**
- **Entrance**: Fade up with 0.6s duration and 0.2s delay
- **Optional**: Can disable with `animated={false}`

### **Responsive Behavior**
```typescript
// Desktop left alignment
"lg:justify-start justify-center"

// Mobile center alignment  
"justify-center"
```

## 🎯 Usage Pattern

### **Section Headers**
```typescript
<HeroEyebrow 
  iconSrc="/images/icons/[icon].svg"
  iconAlt="[Description]"
  position="center" // or "left"/"right"
  animated // optional animation
>
  Section Name
</HeroEyebrow>
```

### **Container Structure**
The eyebrow badge sits outside the main content container but within the section container, providing that beautiful spacing you wanted:

```html
<SectionContainer id="section-id">
  <div className="mb-12">
    <HeroEyebrow>Section Name</HeroEyebrow>
    <h2>Main Heading</h2>
  </div>
  {/* Section content */}
</SectionContainer>
```

## 🚀 Benefits

### **Design Consistency**
- **Exact Match**: Uses the same `hero-eyebrow` class
- **Borderless Design**: Clean, rounded pill container
- **Typography**: Same font weight, size, and spacing
- **Icon Integration**: Consistent 14px icons with proper spacing

### **Developer Experience**
- **Simple API**: Easy to implement across sections
- **Flexible**: Position and animation options
- **Type Safe**: Full TypeScript support

### **Visual Hierarchy**
- **Proper Spacing**: `mb-8` creates breathing room
- **Section Context**: Clear section identification
- **Brand Cohesion**: Consistent with hero section

## 📱 Mobile Considerations

- **Responsive Positioning**: Centered on mobile, flexible on desktop
- **Touch Friendly**: Proper tap targets
- **Performance**: Optimized image loading
- **Accessibility**: Proper alt text and semantic structure

## 🎨 Customization Options

### **Additional Styling**
```typescript
<HeroEyebrow 
  className="custom-class" // Additional CSS classes
  // ... other props
>
  Content
</HeroEyebrow>
```

### **Icon Variations**
- **Dark Mode**: `dark:invert` class handles icon inversion
- **Size**: Fixed 14px for consistency with hero
- **Format**: SVG format for crisp rendering

This creates a perfectly consistent eyebrow badge system that matches your hero section's exact design while providing flexibility for different sections and layouts.
