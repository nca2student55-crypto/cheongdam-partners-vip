// Google Apps Script - 청담파트너VIP REST API
// 이 코드를 Google Sheets의 Apps Script에 붙여넣으세요

const SPREADSHEET_ID = '1Cxl0RoxhJ4aWEy4w-OZCZyUP6ldEX7-XqOgKGNLY0wI';

// 시트 이름
const SHEETS = {
  CUSTOMERS: 'Customers',
  POINT_HISTORY: 'PointHistory',
  NOTIFICATIONS: 'Notifications'
};

// CORS 헤더 설정
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET 요청 처리
function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;

    switch (action) {
      case 'getCustomers':
        result = getCustomers();
        break;
      case 'getPointHistory':
        result = getPointHistory(e.parameter.customerId);
        break;
      case 'getNotifications':
        result = getNotifications(e.parameter.customerId);
        break;
      case 'getAllData':
        result = getAllData();
        break;
      default:
        result = { error: 'Invalid action' };
    }

    return createResponse({ success: true, data: result });
  } catch (error) {
    return createResponse({ success: false, error: error.message });
  }
}

// POST 요청 처리
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    let result;

    switch (action) {
      case 'addCustomer':
        result = addCustomer(payload.data);
        break;
      case 'updateCustomer':
        result = updateCustomer(payload.data);
        break;
      case 'deleteCustomer':
        result = deleteCustomer(payload.id);
        break;
      case 'addPointHistory':
        result = addPointHistory(payload.data);
        break;
      case 'addNotification':
        result = addNotification(payload.data);
        break;
      case 'updateNotification':
        result = updateNotification(payload.data);
        break;
      case 'addPoints':
        result = addPoints(payload.customerIds, payload.amount);
        break;
      default:
        result = { error: 'Invalid action' };
    }

    return createResponse({ success: true, data: result });
  } catch (error) {
    return createResponse({ success: false, error: error.message });
  }
}

// ===== Customers =====

function getCustomers() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.CUSTOMERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  return data.slice(1).filter(row => row[0]).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      if (header === 'isIndividual' || header === 'isRead') {
        obj[header] = row[i] === true || row[i] === 'TRUE' || row[i] === 'true';
      } else if (header === 'totalPoints') {
        obj[header] = Number(row[i]) || 0;
      } else {
        obj[header] = row[i];
      }
    });
    return obj;
  });
}

function addCustomer(customer) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.CUSTOMERS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const row = headers.map(header => {
    if (header === 'isIndividual') {
      return customer[header] ? 'TRUE' : 'FALSE';
    }
    return customer[header] || '';
  });

  sheet.appendRow(row);
  return customer;
}

function updateCustomer(customer) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.CUSTOMERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === customer.id) {
      const row = headers.map(header => {
        if (header === 'isIndividual') {
          return customer[header] ? 'TRUE' : 'FALSE';
        }
        return customer[header] !== undefined ? customer[header] : '';
      });
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return customer;
    }
  }

  throw new Error('Customer not found');
}

function deleteCustomer(id) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.CUSTOMERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      sheet.deleteRow(i + 1);
      return { deleted: id };
    }
  }

  throw new Error('Customer not found');
}

// ===== Point History =====

function getPointHistory(customerId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.POINT_HISTORY);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const customerIdIndex = headers.indexOf('customerId');

  return data.slice(1).filter(row => {
    if (!row[0]) return false;
    return !customerId || row[customerIdIndex] === customerId;
  }).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      if (header === 'isRead') {
        obj[header] = row[i] === true || row[i] === 'TRUE' || row[i] === 'true';
      } else if (header === 'points') {
        obj[header] = Number(row[i]) || 0;
      } else {
        obj[header] = row[i];
      }
    });
    return obj;
  });
}

function addPointHistory(history) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.POINT_HISTORY);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const row = headers.map(header => {
    if (header === 'isRead') {
      return history[header] ? 'TRUE' : 'FALSE';
    }
    return history[header] || '';
  });

  sheet.appendRow(row);
  return history;
}

// ===== Notifications =====

function getNotifications(customerId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.NOTIFICATIONS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const customerIdIndex = headers.indexOf('customerId');

  return data.slice(1).filter(row => {
    if (!row[0]) return false;
    return !customerId || row[customerIdIndex] === customerId;
  }).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      if (header === 'isRead') {
        obj[header] = row[i] === true || row[i] === 'TRUE' || row[i] === 'true';
      } else {
        obj[header] = row[i];
      }
    });
    return obj;
  });
}

function addNotification(notification) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.NOTIFICATIONS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const row = headers.map(header => {
    if (header === 'isRead') {
      return notification[header] ? 'TRUE' : 'FALSE';
    }
    return notification[header] || '';
  });

  sheet.appendRow(row);
  return notification;
}

function updateNotification(notification) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.NOTIFICATIONS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === notification.id) {
      const row = headers.map(header => {
        if (header === 'isRead') {
          return notification[header] ? 'TRUE' : 'FALSE';
        }
        return notification[header] !== undefined ? notification[header] : '';
      });
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return notification;
    }
  }

  throw new Error('Notification not found');
}

// ===== Combined Operations =====

function getAllData() {
  return {
    customers: getCustomers(),
    pointHistory: getPointHistory(),
    notifications: getNotifications()
  };
}

function addPoints(customerIds, amount) {
  const now = new Date().toISOString();
  const results = {
    customers: [],
    pointHistory: [],
    notifications: []
  };

  // Get current customers
  const customers = getCustomers();

  customerIds.forEach(customerId => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      // Update customer points
      customer.totalPoints = (customer.totalPoints || 0) + amount;
      updateCustomer(customer);
      results.customers.push(customer);

      // Add point history
      const historyId = 'PH_' + Math.random().toString(36).substr(2, 9);
      const history = {
        id: historyId,
        customerId: customerId,
        points: amount,
        createdAt: now,
        isRead: false,
        message: ''
      };
      addPointHistory(history);
      results.pointHistory.push(history);

      // Add notification
      const notificationId = 'NT_' + Math.random().toString(36).substr(2, 9);
      const notification = {
        id: notificationId,
        customerId: customerId,
        title: '포인트 적립',
        content: amount + ' 포인트가 적립되었습니다.',
        createdAt: now,
        isRead: false
      };
      addNotification(notification);
      results.notifications.push(notification);
    }
  });

  return results;
}
