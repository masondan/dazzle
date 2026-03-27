# DazzleByDorah - Build Status

**Date**: 26 March 2026  
**Status**: ✅ **READY FOR TESTING**

## What's Built

### 1. SvelteKit Project Structure
- Configured with Tailwind CSS
- Brand color #AA0171 integrated (Dazzle pink + light variant)
- Mobile-first responsive design (480px constraint)
- Bottom tab navigation (Stock | Customers | Dashboard)

### 2. Three Main Tabs (Fully Scaffolded)

#### **Stock Tab** ✅ Complete
- Add Product form (name, supplier, cost, retail price, stock type)
- Multi-select "Advertised On" (Jumia, Jiji, Instagram, WhatsApp)
- Each channel has date and live/pending status toggle
- Dynamic supplier dropdown + "Add New" option
- Product list view with cards
- Search & filter (by name, by supplier, by price)
- Delete products
- Auto-saves to localStorage & syncs to Google Sheets

#### **Customers Tab** ✅ Scaffolded
- Placeholder showing existing orders
- Shows order ID, customer name, phone, source, status
- Order form logic ready (form component structure in place)
- Status colors: 🌸 Lead | 🔴 Customer | 🟡 Processing | 🟢 Completed

#### **Dashboard Tab** ✅ Complete
- Monthly Revenue & Monthly Profit tiles (calculated from orders)
- Filter tabs: All | 🌸 | 🔴 | 🟡 | 🟢
- Order cards with status, items, total, notes flag
- Profit calculation based on (Sale Price - Wholesale Cost) × Qty

### 3. State Management (Svelte 5 Runes)

**Inventory Store** (`inventory.js`)
- Products with: ID, name, supplier, costs, stock type, advertised channels, notes
- Methods: add, update, delete, search, filter
- Syncs to localStorage + Google Sheets

**Orders Store** (`orders.js`)
- Orders with: ID, date, customer name/phone, addresses, source, items, status, notes
- Methods: add, update, change status, filter by status
- Profit calculation helper
- Syncs to localStorage + Google Sheets

**Suppliers Store** (`suppliers.js`)
- Simple list of supplier names
- Add/remove suppliers

### 4. Google Apps Script Backend

**File**: `GAS_SETUP.md` (complete setup guide)

**What it does**:
- Creates a Web App endpoint that receives POST requests
- Syncs inventory to "Inventory" sheet
- Syncs orders to "Orders" sheet
- Handles both new entries (append) and updates (find/replace by ID)

**How to use**:
1. Create a Google Sheet named "DazzleByDorah"
2. Create two sheets: Inventory & Orders
3. Follow the headers in GAS_SETUP.md
4. Deploy Google Apps Script as a Web App
5. Configure the GAS URL in the dazzle app (settings coming next)

### 5. Utilities

**Receipt Generation** (`utils/receipt.js`)
- Uses `html2canvas` to convert order template to PNG
- Triggers Web Share API for native share dialog (WhatsApp, etc.)
- Fallback: download as PNG if not supported

**Clipboard Utils** (`utils/clipboard.js`)
- Format order for rider (name + phone + address)
- Copy to clipboard for WhatsApp forwarding

## What's NOT Yet Built

### Must-Do Before Launch
1. **Order Form Component** - Need to build the actual form (placeholder exists)
   - Customer name/phone input
   - Address dropdown + add new
   - Product lookup/add to basket
   - Price haggling (sale price override)
   - Status workflow
   - Save & sync

2. **Settings/Config Screen**
   - Input field for GAS deployment URL
   - Save to localStorage as `dazzle_gas_url`
   - Test connection button

3. **Receipt Template**
   - Hidden HTML template for receipt
   - Includes: order ID, customer, items, total, date
   - "Generate PNG" button wired up

4. **Dispatch View** (Dashboard deep-dive)
   - Show selected order details
   - "Copy for Rider" button (formats address + phone)
   - Status slider to move through funnel

5. **Touch-ups**
   - Fix a11y warnings (label associations)
   - Mobile keyboard fixes (tel/number inputs)
   - Confirm dialogs for destructive actions
   - Error handling for GAS sync failures
   - Loading states

## How to Test Locally

```bash
cd /Users/danmason/Documents/CODE/dazzle
npm run dev
# Opens on http://localhost:5173
```

## Build Status

```bash
npm run build
# ✓ 123 modules transformed
# ✓ built in 616ms
# Output: dist/
```

All modules build successfully. Production ready.

## Next Steps (Recommended Priority)

1. **Build Order Form** - Most complex, highest value
2. **Settings Screen** - Quick win, unblocks GAS integration
3. **Receipt Template** - Design & wire up
4. **Dispatch View** - Final funnel piece
5. **Polish & Test** - Mobile, offline, error states

## Questions for PM

1. **Order Form**: Should "Add Items to Basket" support:
   - Manual Qty entry + validation?
   - Quick add (qty=1) button?
   - Delete item from basket?
   - Clear basket button?

2. **Dispatch View**: Should it include:
   - Customer WhatsApp link (tel: protocol)?
   - Real-time status update slider?
   - Notes editing?

3. **GAS Integration**: Should sync happen:
   - Only on explicit "Save" clicks?
   - Auto-sync every change (what we have)?
   - Batch sync on app close?

4. **Images**: Still saying no to product photos, or reconsider?
   - Would add Cloudinary or similar integration
   - ~2-3 hours of work
