# 3D Viewer WebGL Context Loss Bug

## 🐛 Bug Description

**Issue:** Multiple 3D viewers on the same page were not rendering correctly. Only one 3D viewer appeared to be active at a time, while others remained hidden unless a product toggle forced a re-render. When scrolling between sections, the active 3D viewer would "steal" the WebGL context from other sections.

**Symptoms:**
- Only one 3D model visible at a time across hero/solution/shop sections
- `THREE.WebGLRenderer: Context Lost.` errors in console
- Sections showing fallback images instead of 3D models
- "Hero stole the 3D" - wrong section becoming active after scroll

## 🔍 Root Cause Analysis

### Primary Issues Identified:

1. **Multiple Intersection Observer Instances**
   - Each section component (`HeroSection`, `SolutionSection`, `ProductSelector`) was creating its own `useScrollAware3D` hook
   - This resulted in 3+ Intersection Observers running simultaneously
   - Multiple observers caused race conditions and resource conflicts

2. **WebGL Context Contention**
   - All 3D viewers were creating Canvas elements immediately on mount
   - Multiple WebGL contexts competed for browser resources
   - Context switching caused `WebGLRenderer: Context Lost.` errors

3. **Improper Resource Management**
   - No cleanup when sections became inactive
   - Canvas elements persisted even when not visible
   - Memory leaks and resource waste

## 🛠️ Solution Implementation

### Phase 1: Centralize Intersection Observer

**Problem:** Multiple Intersection Observers causing conflicts
**Solution:** Implement singleton pattern with global observer

```typescript
// Global singleton to prevent multiple Intersection Observer instances
let globalObserver: IntersectionObserver | null = null;
let globalCallbacks: Array<(activeSection: string | null) => void> = [];

export function useScrollAware3D({ sectionIds, threshold = 0.15 }: ScrollAware3DOptions) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    // Add this component's callback to the global list
    globalCallbacks.push(setActiveSection);
    
    // If observer already exists, just use it
    if (globalObserver) {
      return;
    }

    // Create the singleton observer
    const observer = new IntersectionObserver(/* ... */);
    globalObserver = observer;
    
    // Cleanup only when no more subscribers
    return () => {
      globalCallbacks = globalCallbacks.filter(cb => cb !== setActiveSection);
      if (globalCallbacks.length === 0 && globalObserver) {
        globalObserver.disconnect();
        globalObserver = null;
      }
    };
  }, [sectionIds, threshold]);
}
```

### Phase 2: Conditional Canvas Rendering

**Problem:** All 3D viewers creating Canvas elements immediately
**Solution:** Only render Canvas when section is active

```typescript
// Only render Canvas when section is active to prevent WebGL context conflicts
{scrollActive && (
  <Canvas
    key={instanceKey} // Unique key prevents Three.js context conflicts
    /* ... */
  >
    {/* 3D content */}
  </Canvas>
)}
```

### Phase 3: Proper State Management

**Problem:** No cleanup when sections become inactive
**Solution:** Implement proper state transitions with delays

```typescript
useEffect(() => {
  if (scrollActive) {
    // Small delay to prevent WebGL context conflicts during transitions
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 150);
    return () => clearTimeout(timer);
  } else {
    // Clean up when section becomes inactive
    setIsReady(false);
  }
}, [scrollActive, sectionId]);
```

### Phase 4: Architecture Refactoring

**Problem:** Client-side hooks running on server
**Solution:** Separate client wrapper component

```typescript
// src/components/HomeClient.tsx
"use client";

export function HomeClient() {
  const { activeSection, isScrollingIntoSection, isScrollingOutOfSection } = useScrollAware3D({
    sectionIds: ["hero", "solution", "shop"],
  });

  return (
    <main>
      <HeroSection 
        activeSection={activeSection}
        isScrollingIntoSection={isScrollingIntoSection}
        isScrollingOutOfSection={isScrollingOutOfSection}
      />
      {/* ... other sections */}
    </main>
  );
}

// src/app/page.tsx
import { HomeClient } from "@/components/HomeClient";

export default function Home() {
  return <HomeClient />;
}
```

## 📊 Results

### Before Fix:
```
🔍 [ScrollAware] Setting up Intersection Observer for sections: (3) ['hero', 'solution', 'shop']
🔍 [ScrollAware] Setting up Intersection Observer for sections: (3) ['hero', 'solution', 'shop']  
🔍 [ScrollAware] Setting up Intersection Observer for sections: (3) ['hero', 'solution', 'shop']
🎨 [hero] Canvas created for model: /models/products/protein_chocolate.glb
🎨 [solution] Canvas created for model: /models/products/protein_chocolate.glb
🎨 [shop] Canvas created for model: /models/products/protein_chocolate.glb
THREE.WebGLRenderer: Context Lost.
```

### After Fix:
```
🔍 [ScrollAware] Creating global Intersection Observer for sections: (3) ['hero', 'solution', 'shop']  // ONLY ONCE!
🎯 [ScrollAware] Setting active section to: hero
🎨 [hero] Canvas created for model: /models/products/protein_chocolate.glb  // ONLY HERO
🎯 [ScrollAware] Setting active section to: solution
🎨 [solution] Canvas created for model: /models/products/protein_chocolate.glb  // ONLY SOLUTION
🎯 [ScrollAware] Setting active section to: shop
🎨 [shop] Canvas created for model: /models/products/protein_chocolate.glb  // ONLY SHOP
```

## ✅ Verification Checklist

- [x] Only one Intersection Observer instance created
- [x] Only active section renders 3D Canvas
- [x] No WebGL context loss errors
- [x] Smooth transitions between sections
- [x] Proper cleanup on section deactivation
- [x] Server-side rendering compatibility
- [x] Performance optimization with conditional rendering

## 🎯 Key Takeaways

1. **Resource Management:** Always clean up WebGL contexts when not in use
2. **Singleton Pattern:** Use global instances for shared resources like Intersection Observer
3. **Conditional Rendering:** Only render expensive components when needed
4. **State Synchronization:** Properly manage component lifecycle during transitions
5. **Architecture Separation:** Separate client-side logic from server components

## 🔧 Files Modified

- `src/hooks/useScrollAware3D.ts` - Implemented singleton pattern
- `src/components/3d/Product3DViewer.tsx` - Added conditional Canvas rendering
- `src/components/HomeClient.tsx` - Created client wrapper component
- `src/app/page.tsx` - Simplified to server component
- `src/components/sections/HeroSection.tsx` - Updated to accept scroll props
- `src/components/sections/SolutionSection.tsx` - Updated to accept scroll props
- `src/components/sections/ProductSelector.tsx` - Updated to accept scroll props

## 🚀 Performance Improvements

- **Reduced Memory Usage:** Only one Canvas active at a time
- **Eliminated Race Conditions:** Single source of truth for scroll state
- **Smoother Transitions:** Proper cleanup and initialization timing
- **Better Resource Management:** Automatic cleanup when sections become inactive
