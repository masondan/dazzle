# DazzleByDorah — Agents Guide

Sales & inventory tracker for a Lagos-based dropshipping business. Single-user PWA deployed on Cloudflare Pages.

## Commands
- `npm run dev` — Vite dev server (port 5173)
- `npm run build` — Production build to `build/`
- `npm run preview` — Preview production build
- `npm run check` — Svelte type checking
- No test suite configured

## Stack
- **SvelteKit 2** + **Svelte 5** (runes) + **Vite 5**, JavaScript only (no TypeScript)
- **Adapter**: `@sveltejs/adapter-static` — SPA mode (`fallback: 'index.html'`, `ssr: false`, `prerender: true`)
- **Styling**: Tailwind 3 + CSS custom properties in `app.css`
- **Backend**: Supabase (env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- **Persistence**: localStorage (offline-first) + Supabase upsert on save
- **Hosting**: Cloudflare Pages — `dazzlebydorah.pages.dev`, build output `build/`
- **Repo**: `github.com/masondan/dazzle` (main branch)

## File Structure
```
src/
├── app.html                              # HTML shell (meta tags, OG, favicons, manifest link)
├── app.css                               # Global styles, CSS vars, Inter font-face
├── routes/
│   ├── +layout.js                        # ssr=false, prerender=true
│   ├── +layout.svelte                    # Imports app.css
│   └── +page.svelte                      # Tab router (default: dashboard), bottom nav
├── lib/
│   ├── components/
│   │   ├── DashboardTab.svelte           # Money/activity/costs/suppliers accordion sections
│   │   ├── StockTab.svelte               # Product list, search, filters
│   │   ├── CustomersTab.svelte           # Order list, status pills, order detail expand
│   │   ├── ProductForm.svelte            # Add/edit product modal
│   │   ├── ProductList.svelte            # Product card grid
│   │   ├── OrderForm.svelte              # Add/edit order modal
│   │   ├── CostForm.svelte               # Add/edit cost entry
│   │   ├── SupplierForm.svelte           # Add/edit supplier
│   │   └── ReceiptTemplate.svelte        # Receipt layout for html2canvas capture
│   ├── stores/                           # All use $state runes, localStorage + Supabase sync
│   │   ├── inventory.svelte.js           # Products (id: P-XXXXX)
│   │   ├── orders.svelte.js              # Orders (id: ORD-XXXXX), status funnel
│   │   ├── costs.svelte.js               # Business costs (id: C-XXXXX)
│   │   └── suppliers.svelte.js           # Supplier contacts (id: S-XXXXX)
│   └── utils/
│       ├── supabase.js                   # Supabase client init
│       ├── receipt.js                    # html2canvas receipt generation + Web Share API
│       ├── clipboard.js                  # Clipboard copy for rider dispatch info
│       └── gas-sync.js                   # Legacy Google Apps Script sync (unused)
static/
├── manifest.webmanifest                  # PWA manifest
├── apple-touch-icon.png                  # 180×180
├── favicon-16.png / favicon-32.png       # PNG favicons
├── fonts/Inter-VariableFont_opsz,wght.ttf
├── icons/                               # SVG UI icons (icon-*.svg)
└── logos/
    ├── logo-dazzle-logotype.png          # Header logotype (brand wordmark)
    ├── logo-dazzle-trs.png              # Transparent watermark (used on dashboard)
    ├── logo-dazzle-og.png               # OG image 1200×630
    ├── logo-dazzle-maskable.png         # Maskable PWA icon 1024×1024
    ├── logo-dazzle-gen.png              # General icon 512×512
    ├── logo-dazzle-192.png              # Manifest icon 192×192
    ├── logo-dazzle-touch.png            # Apple touch source 512×512
    └── logo-dazzle-favicon.ico          # ICO favicon
```

## Design System
- **Brand pink**: `var(--dazzle)` = `#AA0171`
- **Light accent**: `var(--dazzle-light)` = `#D946A6`
- **Body text**: `var(--text-body)` = `#333`
- **Helper text**: `var(--text-helper)` = `#777`
- **Font**: Inter variable, `var(--font-body)` = 16px, `var(--font-helper)` = 14px
- **Layout**: Max-width 480px centered, bottom nav (56px fixed), `accent-color: #AA0171`
- **Currency**: Nigerian Naira (₦), always formatted with `.toLocaleString()`

## Store Pattern
All four stores follow the same pattern:
1. **`$state([])`** reactive array
2. **Load** from `localStorage` on module init (with migration/validation)
3. **`save()`** writes to localStorage using `untrack()`
4. **`sync()`** upserts all rows to Supabase
5. **`deleteFromRemote(id)`** deletes single row from Supabase
6. Exported as singleton: `export const xStore = createXStore()`

Supabase tables: `inventory`, `orders`, `costs`, `suppliers` — all use `id` as primary key with upsert on conflict.

## App Tabs
| Tab | Default | Component | Key features |
|-----|---------|-----------|-------------|
| Dashboard | ✅ Landing | `DashboardTab.svelte` | Date-range filter (7d/30d/custom), collapsible sections: Money, Activity, Cost tracker, Supplier contacts |
| Stock | — | `StockTab.svelte` | Product CRUD, search, supplier/price filters, advertised-on channels with live/pending status |
| Customers | — | `CustomersTab.svelte` | Order CRUD, status funnel (Lead → Customer → Processing → Completed), receipt generation, dispatch clipboard copy |

## Order Status Funnel
`lead` → `customer` → `processing` → `completed`

## Conventions
- JavaScript only — no TypeScript, use JSDoc `@typedef` for type hints
- Svelte 5 runes (`$state`, `$derived`, `$derived.by`, `$effect`)
- Native Svelte bindings, no form libraries
- Component-scoped `<style>` blocks (not global), Tailwind for utilities
- Date format in stores: `YYYY-MM-DD` (ISO) or `DD/MM/YYYY` (legacy, both handled by `parseDate()`)
- Phone numbers: `type="tel"` for mobile keyboard
- `noindex, nofollow` — this is a private business tool, not for search engines
