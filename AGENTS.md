# DazzleByDorah - Agents Guide

## Commands
- **Dev server**: `npm run dev` (Vite dev server on port 5173)
- **Build**: `npm run build` (production build to `dist/`)
- **Preview**: `npm run preview` (preview production build)
- **Check**: `npm run check` (Svelte type checking)
- **No tests configured**: This project has no test suite

## Architecture
- **Stack**: SvelteKit 2 + Svelte 5 + Vite 5, JavaScript (no TypeScript)
- **Adapter**: @sveltejs/adapter-static (SPA mode with fallback)
- **Structure**: Mobile-first web app (480px constraint on desktop) with three tabs
  - **Stock**: Inventory management
  - **Customers**: Orders and customer management
  - **Dashboard**: Revenue/profit metrics and order funnel view
  
## File Structure
```
src/
├── main.js                           # Entry point
├── app.html                          # HTML template
├── app.css                           # Global styles (Tailwind)
├── routes/
│   └── +page.svelte                  # Main app with tab navigation
├── lib/
│   ├── components/
│   │   ├── StockTab.svelte           # Inventory tab
│   │   ├── CustomersTab.svelte       # Orders tab
│   │   ├── DashboardTab.svelte       # Dashboard tab
│   │   ├── ProductForm.svelte        # Add/edit product form
│   │   └── ProductList.svelte        # Display products
│   ├── stores/
│   │   ├── inventory.js              # Product store (with runes)
│   │   ├── orders.js                 # Order store (with runes)
│   │   └── suppliers.js              # Supplier list store
│   └── utils/
│       ├── receipt.js                # Receipt generation (html2canvas)
│       └── clipboard.js              # Clipboard utilities
```

## Data Stores (Svelte $state Runes)

### Inventory Store
- `products[]` - Array of product objects
- **Methods**: `addProduct()`, `updateProduct()`, `deleteProduct()`, `save()`, `syncToSheet()`
- **Persistence**: localStorage + Google Sheets via GAS

### Orders Store
- `orders[]` - Array of order objects
- **Methods**: `addOrder()`, `updateOrder()`, `updateOrderStatus()`, `getOrderById()`, `filterByStatus()`, `calculateOrderTotal()`, `calculateOrderProfit()`, `save()`, `syncToSheet()`
- **Persistence**: localStorage + Google Sheets via GAS

### Suppliers Store
- `suppliers[]` - Simple array of supplier names
- **Methods**: `addSupplier()`, `deleteSupplier()`, `save()`

## Backend: Google Apps Script (GAS)

**Setup Guide**: See `GAS_SETUP.md` for full instructions

**URL**: Set via `localStorage.setItem('dazzle_gas_url', '<deployment-url>')`

**Sync Strategy**: On save (user clicks "Save Product" or "Save Order")
- POST to GAS endpoint with `{type: 'inventory' | 'orders', data: [...]}`
- GAS appends new rows or updates existing rows by ID
- Two sheets: Inventory + Orders

## Key Features

### Stock Tab
- Add products with: name, supplier, cost, retail price, stock type
- Multi-select "Advertised On" (Jumia, Jiji, Instagram, WhatsApp) with date/status
- Search & filter by supplier, top-selling, price
- Display products in cards with live/pending status for each channel

### Customers Tab
- Create orders with customer name, phone, address, source
- Add items from inventory (auto-lookup by product name)
- Status funnel: Lead → Customer → Processing → Completed
- Edit price for haggling/discounts

### Dashboard
- Monthly revenue & profit tiles (calculated from orders)
- Filter orders by status
- View order cards with items, total, notes
- Deep-dive: Dispatch view (copy for rider), status slider, receipt generation

## Design System
- **Brand Color**: #AA0171 (Dazzle pink)
- **Light Accent**: #D946A6
- **CSS**: Tailwind + custom properties in app.css
- **Mobile First**: Constrained to 480px max-width
- **Bottom Navigation**: Three main tabs

## Offline & Sync
- All data stored in localStorage for offline use
- Syncs to Google Sheets on "Save" button clicks
- Failed syncs don't block local saving
- Full transparency: all data visible in Google Sheets

## Notes
- No TypeScript (JavaScript/JSDoc)
- No external form library (native Svelte bindings)
- Receipt generation via `html2canvas` + Web Share API
- Clipboard copy for rider info
- Phone numbers: use `type="tel"` for mobile keyboard
