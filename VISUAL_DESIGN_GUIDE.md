# 🎨 Visual Design Guide - LVJST Form

## Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  FORM CONTAINER (max-width: 700px)                  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  FORM HEADER                                 │   │
│  │  [Logo] LVJST Members Registration           │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  FILL FORM NOW CARD (Pink Border Left)      │   │
│  │  ✨ Fill Form Now! ✨                        │   │
│  │  • 🏛️ TIRTH RAKSHA & JIRNODHAAR            │   │
│  │  • 📚 SHRUTODDHAAR                          │   │
│  │  • 🌟 RUSHABHAYAN                           │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  INITIATIVES CARD (Blue Border Left)         │   │
│  │  LVJST Initiatives Impact                    │   │
│  │                                              │   │
│  │  [Counter Card]                              │   │
│  │  999+                                        │   │
│  │  TEMPLES SURVEYED                            │   │
│  │  Target: 15,000 temples in 5 years           │   │
│  │                                              │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │  IMAGE CAROUSEL (NEW!)                 │  │   │
│  │  │  ❮  [IMAGE 1/20]  ❯                   │  │   │
│  │  │  • • • • • • • •  (Dot indicators)   │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  │                                              │   │
│  │  🙏 Guided by 🙏                            │   │
│  │  Acharya & Jinendra blessings                │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  EVENT CARD (Orange Border Left)             │   │
│  │  📌 UPCOMING EVENT                           │   │
│  │                                              │   │
│  │  ए शासन तेरे लिये                            │   │
│  │  (Devanagari Title - Italic, Large)          │   │
│  │                                              │   │
│  │  🙏 Serving Religion Through Humanity        │   │
│  │  & Seva 🙏                                   │   │
│  │                                              │   │
│  │  Grand Meet with Gurubhagwant                │   │
│  │  📅 18th January | 📍 Mumbai                 │   │
│  │  ─────────────────────                       │   │
│  │                                              │   │
│  │  🙏 Pranam | Jay Jinendra 🙏                │   │
│  │  [Event description text...]                 │   │
│  │                                              │   │
│  │  🔹 Mukhya Karya:                            │   │
│  │  • Tirthodhar & Shrutodhar                   │   │
│  │  • Shraman Seva                              │   │
│  │  • [More initiatives...]                     │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  VOLUNTEER FORM                              │   │
│  │  [Form fields...]                            │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  SUCCESS MODAL (On Submit)                   │   │
│  │  ✓ Thank You!                                │   │
│  │  [Actions: Share, Save, Instagram]          │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
└─────────────────────────────────────────────────────┘
│  FOOTER                                             │
└─────────────────────────────────────────────────────┘
```

---

## Carousel Detail

### Desktop View (1200px+)
```
┌────────────────────────────────────────────────────┐
│  📸 Our Work Gallery                               │
├────────────────────────────────────────────────────┤
│                                                    │
│  ❮     [Image 1 - 300x200px]     ❯               │
│        Auto-rotating every 5 sec                  │
│                                                    │
│     • (1) • • • • • • (20 dots)                    │
│                                                    │
│  Blue Gradient Buttons (#2563eb → #1e40af)       │
│  Dot Indicators: Active = highlighted             │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Mobile View (< 768px)
```
┌──────────────────────────┐
│  📸 Our Work Gallery     │
├──────────────────────────┤
│                          │
│  ❮ [Image] ❯           │
│  220px height            │
│                          │
│   • • • • (Smaller)     │
│                          │
└──────────────────────────┘
```

---

## Color Palette

### Event Card Theme (Orange)
```
Background Gradient:    #fef3c7 → #ffffff (Light orange to white)
Border Color:           #d97706 (Orange)
Text Primary:           #92400e (Dark brown/orange)
Text Secondary:         #b45309 (Medium orange)
Badge Background:       #dc2626 → #f87171 (Red gradient)
Badge Shadow:           rgba(220, 38, 38, 0.15)
```

### Initiatives Card Theme (Blue)
```
Background Gradient:    #f0f8ff → #f5fbff (Light blue to very light blue)
Border Color:           #2563eb (Blue)
Border-Left Color:      #1e40af (Dark blue)
Counter Color:          #2563eb (Blue)
Text Primary:           #1e40af (Dark blue)
Counter Card BG:        #dbeafe → #eff6ff (Light blue gradient)
```

### Fill Form Card Theme (Pink)
```
Background Gradient:    #fff5f8 → #fffbfe (Pink to almost white)
Border Color:           #ff69b4 (Hot pink)
Border-Left Color:      #ff1493 (Deep pink)
Text Primary:           #c41e3a (Dark pink/crimson)
List Item BG:           rgba(255, 20, 147, 0.04)
```

### Carousel Theme (Blue)
```
Button Background:      #2563eb → #1e40af (Blue gradient)
Button Hover:           #1e40af → #1e3a8a (Darker blue)
Button Shadow:          rgba(37, 99, 235, 0.25)
Dot Active:             #2563eb → #1e40af (Blue gradient)
Dot Inactive:           rgba(37, 99, 235, 0.3)
Container Border:       rgba(37, 99, 235, 0.1)
```

---

## Typography Hierarchy

```
1. Event Main Title (h2.event-title-main)
   Size: 2.8rem
   Weight: 800 (Bold)
   Style: Italic
   Color: #92400e
   Letter-spacing: 0.5px
   Font: Poppins
   Example: "ए शासन तेरे लिये"

2. Subtitle (p.event-subtitle-text)
   Size: 0.95rem
   Weight: 600 (Semi-bold)
   Color: #b45309
   Letter-spacing: 0.3px

3. Event Subheader (p.event-subheader)
   Size: 1.3rem
   Weight: 700 (Bold)
   Color: #92400e
   Example: "Grand Meet with Gurubhagwant"

4. Gallery Title (h4.gallery-title)
   Size: 1.2rem
   Weight: 700 (Bold)
   Color: #1e40af
   Letter-spacing: 0.5px
   Example: "📸 Our Work Gallery"

5. Card Titles
   Size: 1.2-1.5rem
   Weight: 700 (Bold)
   Color: Varies by card theme

6. Body Text (p, li, labels)
   Size: 0.95-1rem
   Weight: 400-600
   Color: #333 to #666
```

---

## Shadow System

### Subtle Shadows (Modern Professional Look)
```
Small/Button Shadows:   0 2px 6px rgba(0, 0, 0, 0.08)
Card Shadows:           0 4px 12px rgba(0, 0, 0, 0.08)
Badge Shadows:          0 2px 6px rgba(COLOR, 0.15)
Button Hover Shadow:    0 4px 12px rgba(37, 99, 235, 0.35)
Input Focus:            0 0 0 3px rgba(37, 99, 235, 0.1)

OLD STYLE (Removed):    0 16px 40px rgba(..., 0.15) ❌
                        Too much spread/glow
```

---

## Spacing System

### Padding
```
Form Container:         40px (desktop), 20px (mobile)
Card Content:           28px (initiatives), 28px (event), 24px (fill-form)
Button/Input:           12-15px (vertical), 12-20px (horizontal)
Gallery Section:        32px margin-top, 24px padding-top
```

### Gaps & Margins
```
Between cards:          20px top and bottom margin
Between items:          8-12px gap
Section dividers:       2px height with gradient
Label to input:         8px margin-bottom
```

---

## Animation Timing

```
Carousel Slide:         transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1)
Auto-rotate:            5000ms interval
Button Hover:           transition: 0.3s ease
Image Zoom:             transition: 0.3s ease
Label Hover:            transition: 0.12s ease

Scale Effects:
- Button hover:         scale(1.1)
- Button normal:        scale(1)
- Transform Y:          -2px on hover
```

---

## Responsive Breakpoints

```
DESKTOP (1200px+)
├─ Form width: 700px (max-width)
├─ Carousel height: 300px
├─ Button size: 44px
├─ Typography: Normal size
└─ Gap between items: 12px

TABLET (768px - 1199px)
├─ Form width: Auto with padding
├─ Carousel height: 280px
├─ Button size: 40px
├─ Typography: Normal to reduced
└─ Gap between items: 10px

MOBILE (< 768px)
├─ Form width: 100% - 20px margin
├─ Carousel height: 220px
├─ Button size: 36px
├─ Typography: Reduced for readability
├─ Padding: Reduced (20px → 12px)
├─ Gap between items: 8px
└─ Modal: Full width with margin
```

---

## Interactive States

### Button States
```
DEFAULT:
- Background: Gradient (blue)
- Shadow: 0 2px 6px rgba(37, 99, 235, 0.25)
- Cursor: pointer
- Transform: none

HOVER:
- Background: Darker gradient
- Shadow: 0 4px 12px rgba(37, 99, 235, 0.35)
- Transform: scale(1.1) translateY(-50%)
- Transition: 0.3s ease

ACTIVE:
- Transform: scale(0.95)
- Shadow: 0 2px 4px
```

### Carousel Dot States
```
INACTIVE:
- Background: rgba(37, 99, 235, 0.3)
- Width: 10px
- Height: 10px
- Border-radius: 50%

ACTIVE:
- Background: Linear gradient
- Width: 28px
- Height: 10px
- Border-radius: 5px
- Shadow: 0 2px 6px rgba(37, 99, 235, 0.3)
```

---

## Accessibility Features

✓ Semantic HTML (h2, h3, h4 for titles)
✓ Alt text on all images
✓ Keyboard navigation (arrow keys for carousel)
✓ Color contrast (WCAG AA compliant)
✓ Focus states on interactive elements
✓ Proper label associations
✓ ARIA descriptions ready for enhancement

---

## Mobile-First Design Approach

```
Base Styles (Mobile - < 600px)
↓
Tablet Adjustments (600px - 768px)
↓
Medium Screen (768px - 1200px)
↓
Desktop (1200px+)
```

All CSS follows mobile-first approach with media queries for larger screens.

