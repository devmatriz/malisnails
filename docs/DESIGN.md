# Design System: MALIS NAILST Admin System

## 1. Visual Theme & Atmosphere

A polished salon operations system with a calm editorial surface and dense administrative clarity. The admin area feels like a private back office for a premium beauty studio: quiet, structured, fast to scan, and deliberately restrained. Density is daily-app balanced, variance is asymmetric but controlled, and motion is subtle enough for repeated work.

## 2. Color Palette & Roles

- **Porcelain Canvas** (#F7F4EF) - Main app background.
- **Studio Surface** (#FFFFFF) - Tables, panels, forms, and repeated cards.
- **Charcoal Ink** (#181716) - Primary text and sidebar surface.
- **Soft Graphite** (#6F6A63) - Secondary copy, labels, helper text.
- **Hairline Taupe** (#DDD4C8) - Borders, dividers, input edges.
- **Malis Gold** (#B68A47) - Single accent for CTAs, active states, focus rings, and chart highlights.
- **Mist Green** (#DCE8DE) - Low-saturation success state only.
- **Rose Wash** (#F2DEDD) - Low-saturation alert state only.

## 3. Typography Rules

- **Display:** Outfit - confident, rounded, track-normal, hierarchy by weight and spacing.
- **Body:** Outfit - relaxed line-height, practical labels, compact tables.
- **Mono:** JetBrains Mono - all metric numbers, dates, prices, and dense IDs.
- **Banned:** Inter, generic serif fonts, pure black, neon glows, and oversized marketing typography inside admin views.

## 4. Component Stylings

- **Buttons:** 44px minimum height, tactile active transform, no outer glow. Primary buttons use Malis Gold with Charcoal Ink text.
- **Cards:** 8px radius, 1px border, subtle background contrast. Use only for metrics, repeated records, or focused forms.
- **Tables:** Dense, zebra-free, clear row dividers, mono for numeric columns, status pills with muted fills.
- **Inputs:** Label above input, helper/error below when needed, Malis Gold focus ring.
- **Charts:** Lightweight SVG or canvas with minimal axis text and a single accent highlight.

## 5. Layout Principles

Grid-first responsive layout. Admin screens use a fixed sidebar on desktop and tab navigation on mobile. Public and booking screens switch to wider editorial layouts with image-led sections, while admin screens stay operational and compact.

## 6. Motion & Interaction

Use transform and opacity only. Navigation changes fade and slide subtly. Buttons depress by 1px on active. Metric cards and chart traces use short staggered reveals.

## 7. Anti-Patterns

No emojis, no Inter, no pure black, no neon shadows, no generic 3-column feature rows, no overlapping text, no rounded pill overload, no fake perfect metrics, no filler slogans, and no broken image URLs.
