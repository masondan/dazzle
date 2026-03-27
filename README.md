# 🌸 DazzleByDorah

A lightweight, mobile-first sales and inventory tracker for small business owners in Lagos.

Built for speed, simplicity, and offline-first reliability.

## Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Opens on `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## Architecture Overview

### Frontend
- **Framework**: SvelteKit 2 + Svelte 5 (runes-based reactivity)
- **Styling**: Tailwind CSS + custom brand colors
- **State**: Svelte `$state` runes (no Redux needed)
- **Persistence**: localStorage (offline-first)

### Backend
- **Database**: Google Sheets (free, familiar)
- **Backend**: Google Apps Script (free, no server)
- **Sync**: POST to GAS endpoint on "Save" clicks

### Design
- **Mobile-first**: 480px max-width (responsive on desktop)
- **Bottom navigation**: Three main tabs (Stock | Customers | Dashboard)
- **Brand color**: #AA0171 (Dazzle pink)

## Core Features

### Stock Tab 📦
- Add/edit/delete products
- Track cost vs. retail price
- Mark products as Dropship or Infinite stock
- Multi-select advertising channels (Jumia, Jiji, Instagram, WhatsApp)
- Each channel: date added + live status toggle
- Search and filter by supplier, price, top-selling
- Auto-syncs to Google Sheet

### Customers Tab 👥
- Create orders with customer name, phone, addresses
- Add items from inventory (with price haggling)
- Status funnel: Lead → Customer → Processing → Completed
- Notes for delivery instructions
- Auto-syncs to Google Sheet

### Dashboard Tab 📊
- Monthly revenue & profit tiles
- Filter orders by status
- View order details: items, total, notes
- Deep-dive: dispatch view with "copy for rider"
- Generate receipt as PNG for WhatsApp share

## Data Models

### Product
```javascript
{
  id: "DB-1001",
  name: "Premium Lipstick",
  supplier: "Supplier Name",
  wholesaleCost: 5000,
  retailPrice: 12000,
  stock: "Dropship" | "Infinite" | number,
  advertisedOn: [
    { channel: "Jumia", dateAdded: "26-03-2026", isLive: true }
  ],
  notes: "Bestseller",
  dateEntered: "26-03-2026"
}
```

### Order
```javascript
{
  id: "ORD-00001",
  date: "26-03-2026",
  customerName: "Tunde Adebayo",
  customerPhone: "+234 XXX XXX XXXX",
  addresses: [
    { type: "Home", address: "123 Lekki Road" }
  ],
  source: "WhatsApp",
  items: [
    { productId: "DB-1001", name: "Premium Lipstick", qty: 2, retailPrice: 12000, salePrice: 11000 }
  ],
  status: "processing", // lead | customer | processing | completed
  notes: "Delivery after 6 PM"
}
```

## Google Apps Script Setup

See `GAS_SETUP.md` for full instructions. Summary:

1. Create Google Sheet named "DazzleByDorah"
2. Create two sheets: "Inventory" and "Orders"
3. Deploy Google Apps Script with provided code
4. Copy deployment URL
5. Open dazzle app → Settings → paste GAS URL → Save

Done. All saves now sync to your Google Sheet.

## File Structure

```
dazzle/
├── src/
│   ├── main.js                       # Entry point
│   ├── app.css                       # Global styles
│   ├── app.html                      # HTML template
│   ├── routes/
│   │   └── +page.svelte              # Main app (3 tabs)
│   └── lib/
│       ├── components/
│       │   ├── StockTab.svelte       # Inventory tab
│       │   ├── CustomersTab.svelte   # Orders tab
│       │   ├── DashboardTab.svelte   # Dashboard tab
│       │   ├── ProductForm.svelte    # Add/edit product
│       │   └── ProductList.svelte    # Display products
│       ├── stores/
│       │   ├── inventory.js          # Product store + sync
│       │   ├── orders.js             # Order store + sync
│       │   └── suppliers.js          # Supplier list
│       └── utils/
│           ├── receipt.js            # Receipt generation
│           └── clipboard.js          # Clipboard copy
├── GAS_SETUP.md                      # Google Apps Script guide
├── AGENTS.md                         # Development guide
├── BUILD_STATUS.md                   # Build checklist
├── package.json                      # Dependencies
├── vite.config.js                    # Build config
├── tailwind.config.js                # Tailwind config
└── svelte.config.js                  # SvelteKit config
```

## Offline Support

All data is stored in `localStorage`, so the app works fully offline:
- Add products ✓
- Create orders ✓
- View dashboard ✓
- No sync needed until WiFi is available

When online and GAS URL is configured, every "Save" button syncs to Google Sheets.

## Mobile Keyboard Optimization

All phone number inputs use `type="tel"` for proper mobile dialpad.  
Quantity/price inputs use `type="number"` for numeric keyboard.

## Development Notes

- **No TypeScript** - Pure JavaScript + JSDoc for better agent/IDE support
- **No external form library** - Native Svelte bindings handle everything
- **No testing framework** - Focus on manual testing for MVP
- **No auth** - Single-user app (add auth later if needed)
- **No images** - Product photos deferred (easy to add with Cloudinary)

## Customization

### Brand Color
Edit `tailwind.config.js`:
```javascript
colors: {
  dazzle: '#AA0171',
  'dazzle-light': '#D946A6'
}
```

### Currency Symbol
Search/replace `₦` with your currency in components.

### Channel Names
Edit `ProductForm.svelte`:
```javascript
const channels = ['Jumia', 'Jiji', 'Instagram', 'WhatsApp'];
```

## Troubleshooting

### GAS URL not set
- Open browser DevTools → Console
- Paste: `localStorage.setItem('dazzle_gas_url', 'your-gas-url-here')`
- Refresh page

### Data not syncing
- Check GAS deployment URL in console
- Check Google Sheet permissions
- Check browser console for fetch errors

### Mobile layout broken
- Ensure viewport meta tag in `app.html`
- Test on actual mobile device (480px simulator)
- Check bottom nav doesn't overlap content

## Next Steps

1. Test locally with `npm run dev`
2. Deploy GAS backend (see `GAS_SETUP.md`)
3. Configure GAS URL in app settings (coming soon)
4. Test add product → check Google Sheet
5. Build out Order Form component
6. Deploy to Cloudflare Pages or Vercel

## Questions?

Refer to:
- `AGENTS.md` - Development guide
- `GAS_SETUP.md` - Backend setup
- `BUILD_STATUS.md` - What's done/pending
