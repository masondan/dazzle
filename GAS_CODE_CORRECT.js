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
        product.dateEntered,
        product.name,
        product.supplier,
        product.wholesaleCost,
        product.retailPrice,
        product.stock,
        product.advertisedOn.map(a => a.channel + ' (' + a.dateAdded + ')').join('; '),
        product.notes
      ]]);
    } else {
      // Add new product
      sheet.appendRow([
        product.id,
        product.dateEntered,
        product.name,
        product.supplier,
        product.wholesaleCost,
        product.retailPrice,
        product.stock,
        product.advertisedOn.map(a => a.channel + ' (' + a.dateAdded + ')').join('; '),
        product.notes
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
      sheet.getRange(row, 10).setValue(order.status);
    } else {
      // Add new order
      const addressStr = order.addresses
        .map(a => a.type + ': ' + a.address)
        .join(' | ');
      
      sheet.appendRow([
        order.id,
        order.date,
        order.customerName,
        order.customerPhone,
        addressStr,
        order.source,
        JSON.stringify(order.items),
        0,
        0,
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
      return i + 1;
    }
  }
  return null;
}

function doGet() {
  return ContentService.createTextOutput('Dazzle Backend - POST endpoint active');
}
