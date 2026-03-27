// Configuration
const INVENTORY_SHEET = 'Inventory';
const ORDERS_SHEET = 'Orders';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    Logger.log('Payload type: ' + payload.type);
    Logger.log('Data: ' + JSON.stringify(payload.data));

    if (payload.type === 'inventory') {
      syncInventory(ss, payload.data);
    } else if (payload.type === 'orders') {
      syncOrders(ss, payload.data);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function syncInventory(ss, products) {
  const sheet = ss.getSheetByName(INVENTORY_SHEET);
  if (!sheet) {
    throw new Error('Sheet "' + INVENTORY_SHEET + '" not found');
  }
  
  products.forEach(product => {
    try {
      const existingRow = findRowById(sheet, product.id, 1);
      
      const advertisedStr = product.advertisedOn && product.advertisedOn.length > 0
        ? product.advertisedOn.map(a => (a.channel || '') + ' (' + (a.dateAdded || '') + ')').join('; ')
        : '';
      
      if (existingRow) {
        // Update existing product
        sheet.getRange(existingRow, 2, 1, 8).setValues([[
          product.dateEntered || '',
          product.name || '',
          product.supplier || '',
          product.wholesaleCost || 0,
          product.retailPrice || 0,
          product.stock || '',
          advertisedStr,
          product.notes || ''
        ]]);
      } else {
        // Add new product
        sheet.appendRow([
          product.id || '',
          product.dateEntered || '',
          product.name || '',
          product.supplier || '',
          product.wholesaleCost || 0,
          product.retailPrice || 0,
          product.stock || '',
          advertisedStr,
          product.notes || ''
        ]);
      }
    } catch (err) {
      Logger.log('Error syncing product ' + product.id + ': ' + err.toString());
    }
  });
}

function syncOrders(ss, orders) {
  const sheet = ss.getSheetByName(ORDERS_SHEET);
  if (!sheet) {
    throw new Error('Sheet "' + ORDERS_SHEET + '" not found');
  }
  
  orders.forEach(order => {
    try {
      const existingRow = findRowById(sheet, order.id, 1);
      
      const addressStr = order.addresses && order.addresses.length > 0
        ? order.addresses.map(a => (a.type || '') + ': ' + (a.address || '')).join(' | ')
        : '';
      
      if (existingRow) {
        // Update existing order - status is column 10
        sheet.getRange(existingRow, 10).setValue(order.status || 'lead');
      } else {
        // Add new order
        sheet.appendRow([
          order.id || '',
          order.date || '',
          order.customerName || '',
          order.customerPhone || '',
          addressStr,
          order.source || '',
          JSON.stringify(order.items || []),
          0,
          0,
          order.status || 'lead',
          order.notes || ''
        ]);
      }
    } catch (err) {
      Logger.log('Error syncing order ' + order.id + ': ' + err.toString());
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
