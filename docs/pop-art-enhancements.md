# Pop-Art UI Enhancement Opportunities

Analysis of UI elements that could benefit from bold pop-art styling (thick borders, offset shadows, bright colors) to match the brand identity.

## Current Pop-Art Reference

The carousel arrows and hero scroll button already have the correct style:
- 3px thick primary border
- Offset drop shadow (`shadow-[4px_4px_0_0_theme(colors.primary)]`)
- Hover state fills with primary color
- Icon color inverts on hover

---

## High Priority (Customer-Facing)

### 1. Add to Cart Button
**File:** `src/components/shop/product-detail.tsx`

**Current:** Simple rounded button with solid fill
```
w-full py-4 bg-primary text-background rounded-full
```

**Proposed:** Bold bordered button with offset shadow
```
w-full py-4 bg-background border-[3px] border-primary text-primary
hover:bg-primary hover:text-background
shadow-[0_4px_0_0_theme(colors.primary)]
```

---

### 2. Filter Tabs
**File:** `src/components/shop/filter-tabs.tsx`

**Current:** Soft glassmorphic pills with inner shadow
```
rounded-full bg-muted p-1.5 shadow-inner
```

**Proposed:** Bold bordered tabs with hard shadows
- Active tab: thick border + offset shadow
- Inactive tabs: visible border, muted colors

---

### 3. Cart Icon & Badge
**File:** `src/components/layout/header.tsx`

**Current:** Minimal icon with small badge
```
p-2 rounded-full hover:bg-muted
```

**Proposed:**
- Bordered cart button with hover shadow
- Badge with thick border and slight offset shadow

---

### 4. Newsletter Input & Button
**File:** `src/components/landing/newsletter-form.tsx`

**Current:** Thin 1px border input, simple button
```
border border-border rounded-lg
```

**Proposed:**
- Input: 2-3px border, bold focus state with shadow
- Button: thick border + offset shadow matching Add to Cart

---

### 5. Checkout Button (Cart Panel)
**File:** `src/components/cart/cart-panel.tsx`

**Current:** Simple primary fill
```
w-full py-3 bg-primary text-background rounded-full
```

**Proposed:** Match Add to Cart button style with bold border + shadow

---

## Medium Priority

### 6. Product Badges
**File:** `src/components/shop/product-card.tsx`

**Current:** Subtle rounded badges
```
px-3 py-1 bg-background/90 text-xs rounded
```

**Proposed:**
- "Original" badge: thick primary border
- "Print" badge: thick secondary border
- Stock warning: bold border in warning color

---

### 7. Form Inputs (Checkout & Login)
**Files:** `src/app/[lang]/kasse/page.tsx`, `src/app/admin/login/page.tsx`

**Current:** 1px borders, subtle focus rings
```
border border-border rounded-lg focus:ring-2
```

**Proposed:**
- 2-3px borders
- Bold focus state with primary border
- Optional: slight shadow on focus

---

### 8. Cookie Consent Buttons
**File:** `src/components/gdpr/cookie-consent.tsx`

**Current:** Plain buttons
```
border border-border rounded-lg (decline)
bg-primary rounded-lg (accept)
```

**Proposed:** Both buttons with thick borders and offset shadows

---

### 9. Image Upload Zone (Admin)
**File:** `src/components/admin/image-upload.tsx`

**Current:** Thin dashed border
```
border-2 border-dashed
```

**Proposed:**
- 4px dashed border in primary color
- Bold hover state with shadow

---

## Lower Priority (Admin-Only)

### 10. Admin Sidebar Active State
**File:** `src/components/admin/admin-sidebar.tsx`

Active nav items could have bold left border or full border treatment.

### 11. Cart Quantity Buttons
**File:** `src/components/cart/cart-item.tsx`

Small +/- buttons could have visible borders.

### 12. Remove Buttons
Currently invisible until hover - could be always visible with subtle border.

---

## Implementation Notes

### Consistent Shadow Pattern
```css
/* Right shadow (carousel right arrow) */
shadow-[-4px_4px_0_0_theme(colors.primary)]

/* Left shadow (carousel left arrow) */
shadow-[4px_4px_0_0_theme(colors.primary)]

/* Bottom shadow (scroll button, CTA buttons) */
shadow-[0_4px_0_0_theme(colors.primary)]
```

### Hover Behavior
1. Background fills with primary
2. Text/icon inverts to background color
3. Shadow grows slightly (4px → 6px)
4. Optional: slight translate for "lift" effect

### Border Widths
- Primary buttons: 3px
- Form inputs: 2-3px
- Badges: 2px
- Large containers: 3-4px
