# Google Apps Script Setup for DazzleByDorah

## Overview
This document explains how to create a Google Apps Script that acts as a backend for syncing inventory and orders to Google Sheets.

## Step 1: Create a New Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new spreadsheet, name it `DazzleByDorah`
3. Create two sheets:
   - Sheet 1: `Inventory`
   - Sheet 2: `Orders`

## Step 2: Set Up Sheet Headers

### Inventory Sheet Headers (Row 1):
```
ID | Name | Supplier | Wholesale Cost | Retail Price | Stock | Advertised On | Notes | Date Entered
```

### Orders Sheet Headers (Row 1):
```
Order ID | Date | Customer Name | Phone | Address | Source | Items JSON | Total (₦) | Profit (₦) | Status | Notes
```

## Step 3: Create Google Apps Script

1. Open your Google Sheet
2. Click **Extensions → Apps Script**
3. Delete the default code and paste the template below:

```javascript
// Configuration
const INVENTORY_SHEET = 'Inventory';
const ORDERS_SHEET = 'Orders';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.type === 'inventory') {
      syncInventory(ss, payload.data);
    } else if (payload.type === 'orders') {
      syncOrders(ss, payload.data);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function syncInventory(ss, products) {
  const sheet = ss.getSheetByName(INVENTORY_SHEET);
  
  products.forEach(product => {
    const existingRow = findRowById(sheet, product.id, 1);
    
    if (existingRow) {
      // Update existing product
      const row = existingRow;
      sheet.getRange(row, 2, 1, 8).setValues([[
        product.name,
        product.supplier,
        product.wholesaleCost,
        product.retailPrice,
        product.stock,
        product.advertisedOn.map(a => `${a.channel} (${a.dateAdded})`).join('; '),
        product.notes,
        product.dateEntered
      ]]);
    } else {
      // Add new product
      sheet.appendRow([
        product.id,
        product.name,
        product.supplier,
        product.wholesaleCost,
        product.retailPrice,
        product.stock,
        product.advertisedOn.map(a => `${a.channel} (${a.dateAdded})`).join('; '),
        product.notes,
        product.dateEntered
      ]);
    }
  });
}

function syncOrders(ss, orders) {
  const sheet = ss.getSheetByName(ORDERS_SHEET);
  
  orders.forEach(order => {
    const existingRow = findRowById(sheet, order.id, 1);
    
    if (existingRow) {
      // Update existing order (mainly status)
      const row = existingRow;
      sheet.getRange(row, 11).setValue(order.status);
    } else {
      // Add new order
      const addressStr = order.addresses
        .map(a => `${a.type}: ${a.address}`)
        .join(' | ');
      
      sheet.appendRow([
        order.id,
        order.date,
        order.customerName,
        order.customerPhone,
        addressStr,
        order.source,
        JSON.stringify(order.items),
        0, // Total (can be calculated in Sheet)
        0, // Profit (can be calculated in Sheet)
        order.status,
        order.notes
      ]);
    }
  });
}

function findRowById(sheet, id, colIndex) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex - 1] === id) {
      return i + 1; // Sheet row numbers are 1-indexed
    }
  }
  return null;
}

function doGet() {
  return ContentService.createTextOutput('Dazzle Backend - POST endpoint active');
}
```

## Step 4: Deploy the Script

1. Click **Deploy → New deployment**
2. Select type: **Web app**
3. Execute as: **Your email**
4. Who has access: **Anyone**
5. Click **Deploy** and copy the deployment URL

## Step 5: Configure the Web App with the GAS URL

1. Open DazzleByDorah web app
2. Go to settings/config (we'll add this)
3. Paste the GAS deployment URL
4. Save to `localStorage` as `dazzle_gas_url`

Now all data will sync to your Google Sheet on save.

## Testing

1. Add a product in the web app
2. Check that it appears in the Inventory sheet
3. Check browser console for any errors
4. Sync works via `fetch()` POST requests

## Notes

- Sync happens on "Save" button clicks
- Data is stored in `localStorage` for offline use
- Failed syncs don't block local saving
- You can view all raw data in the Google Sheet
