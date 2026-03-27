// Configuration
const INVENTORY_SHEET = 'Inventory';
const ORDERS_SHEET = 'Orders';

function doPost(e) {
  try {
    // Accept data from either form submission (e.parameter.payload)
    // or raw POST body (e.postData.contents)
    var contents;
    if (e.parameter && e.parameter.payload) {
      contents = e.parameter.payload;
      Logger.log('Received via form parameter');
    } else if (e.postData && e.postData.contents) {
      contents = e.postData.contents;
      Logger.log('Received via postData');
    } else {
      throw new Error('No payload received');
    }

    Logger.log('Payload length: ' + contents.length);
    var payload = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    Logger.log('Parsed payload type: ' + payload.type + ', data length: ' + payload.data.length);

    if (payload.type === 'inventory') {
      syncInventory(ss, payload.data);
    } else if (payload.type === 'orders') {
      syncOrders(ss, payload.data);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('ERROR in doPost: ' + error.message + '\nStack: ' + error.stack);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function syncInventory(ss, products) {
  var sheet = ss.getSheetByName(INVENTORY_SHEET);
  if (!sheet) {
    Logger.log('ERROR: Sheet "' + INVENTORY_SHEET + '" not found');
    throw new Error('Sheet "' + INVENTORY_SHEET + '" not found');
  }

  products.forEach(function(product) {
    var existingRow = findRowById(sheet, product.id, 1);

    var advertisedStr = '';
    if (product.advertisedOn && product.advertisedOn.length > 0) {
      advertisedStr = product.advertisedOn.map(function(a) {
        return a.channel + ' (' + a.dateAdded + ')';
      }).join('; ');
    }

    var rowData = [
      product.id,
      product.dateEntered || '',
      product.name || '',
      product.supplier || '',
      product.wholesaleCost || 0,
      product.retailPrice || 0,
      product.stock || '',
      advertisedStr,
      product.notes || ''
    ];

    if (existingRow) {
      // Update existing product (all columns)
      sheet.getRange(existingRow, 1, 1, 9).setValues([rowData]);
      Logger.log('Updated product: ' + product.id);
    } else {
      // Add new product
      sheet.appendRow(rowData);
      Logger.log('Added product: ' + product.id);
    }
  });
}

function syncOrders(ss, orders) {
  var sheet = ss.getSheetByName(ORDERS_SHEET);
  if (!sheet) {
    Logger.log('ERROR: Sheet "' + ORDERS_SHEET + '" not found');
    throw new Error('Sheet "' + ORDERS_SHEET + '" not found');
  }

  orders.forEach(function(order) {
    var existingRow = findRowById(sheet, order.id, 1);

    if (existingRow) {
      // Update existing order - update status (column 10) and notes (column 11)
      sheet.getRange(existingRow, 10).setValue(order.status || '');
      sheet.getRange(existingRow, 11).setValue(order.notes || '');
      Logger.log('Updated order status: ' + order.id + ' -> ' + order.status);
    } else {
      var addressStr = '';
      if (order.addresses && order.addresses.length > 0) {
        addressStr = order.addresses.map(function(a) {
          return a.type + ': ' + a.address;
        }).join(' | ');
      }

      var itemsJson = JSON.stringify(order.items || []);

      // Calculate total and profit
      var total = 0;
      if (order.items) {
        order.items.forEach(function(item) {
          total += (item.salePrice || 0) * (item.qty || 0);
        });
      }

      sheet.appendRow([
        order.id,
        order.date || '',
        order.customerName || '',
        order.customerPhone || '',
        addressStr,
        order.source || '',
        itemsJson,
        total,
        0,
        order.status || 'lead',
        order.notes || ''
      ]);
      Logger.log('Added order: ' + order.id);
    }
  });
}

function findRowById(sheet, id, colIndex) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIndex - 1]) === String(id)) {
      return i + 1;
    }
  }
  return null;
}

function doGet() {
  return ContentService.createTextOutput('Dazzle Backend - POST endpoint active');
}

// Test function - run this manually from Apps Script editor to verify sheet access
function testSync() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('Spreadsheet: ' + ss.getName());
  
  var invSheet = ss.getSheetByName(INVENTORY_SHEET);
  Logger.log('Inventory sheet: ' + (invSheet ? 'FOUND' : 'NOT FOUND'));
  
  var ordSheet = ss.getSheetByName(ORDERS_SHEET);
  Logger.log('Orders sheet: ' + (ordSheet ? 'FOUND' : 'NOT FOUND'));

  // Test with a sample product
  syncInventory(ss, [{
    id: 'DB-TEST',
    dateEntered: '26/03/2026',
    name: 'Test Product',
    supplier: 'Test Supplier',
    wholesaleCost: 1000,
    retailPrice: 2000,
    stock: 'Dropship',
    advertisedOn: [{ channel: 'Jumia', dateAdded: '26/03/2026' }],
    notes: 'Test from GAS editor'
  }]);

  Logger.log('Test sync completed - check Inventory sheet for DB-TEST row');
}
