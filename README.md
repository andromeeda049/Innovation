# การเชื่อมต่อศูนย์โภชนาการอัจฉริยะกับ Google Sheets (เวอร์ชันสมบูรณ์)

คู่มือนี้จะแนะนำวิธีการใช้ Google Sheets เป็นฐานข้อมูลส่วนตัวสำหรับแอปพลิเคชัน เพื่อบันทึกและซิงค์ข้อมูลสุขภาพทั้งหมดของคุณ (ข้อมูลส่วนตัว, ประวัติ BMI, TDEE, อาหาร, และแผนโภชนาการ)

## ขั้นตอนการตั้งค่า

โปรดทำตามขั้นตอนต่อไปนี้อย่างละเอียด:

### ขั้นตอนที่ 1: ปรับโครงสร้าง Google Sheet

1.  ไปที่ [sheets.new](https://sheets.new) เพื่อสร้าง Google Sheet ใหม่ และตั้งชื่อไฟล์ตามที่คุณต้องการ
2.  ลบชีตเริ่มต้น (`Sheet1`) หรือเปลี่ยนชื่อเป็น `Profile`
3.  **สร้างชีตย่อย (Tabs)** ที่ด้านล่างและตั้งชื่อให้ตรงตามนี้ **(สำคัญมาก: ชื่อต้องตรงทุกตัวอักษร)**
4.  ในแต่ละชีต ให้ตั้งชื่อคอลัมน์ในแถวแรก (Row 1) ให้ตรงตามนี้ทุกประการ:

    *   **ชีตที่ 1: `Profile`**
        *   `A1`: `timestamp`
        *   `B1`: `username`
        *   `C1`: `displayName`
        *   `D1`: `profilePicture`
        *   `E1`: `gender`
        *   `F1`: `age`
        *   `G1`: `weight`
        *   `H1`: `height`
        *   `I1`: `waist`
        *   `J1`: `hip`
        *   `K1`: `activityLevel`

    *   **ชีตที่ 2: `BMIHistory`**
        *   `A1`: `timestamp`
        *   `B1`: `username`
        *   `C1`: `displayName`
        *   `D1`: `profilePicture`
        *   `E1`: `bmi`
        *   `F1`: `category`

    *   **ชีตที่ 3: `TDEEHistory`**
        *   `A1`: `timestamp`
        *   `B1`: `username`
        *   `C1`: `displayName`
        *   `D1`: `profilePicture`
        *   `E1`: `tdee`
        *   `F1`: `bmr`

    *   **ชีตที่ 4: `FoodHistory`**
        *   `A1`: `timestamp`
        *   `B1`: `username`
        *   `C1`: `displayName`
        *   `D1`: `profilePicture`
        *   `E1`: `description`
        *   `F1`: `calories`
        *   `G1`: `analysis_json`

    *   **ชีตที่ 5: `PlannerHistory`**
        *   `A1`: `timestamp`
        *   `B1`: `username`
        *   `C1`: `displayName`
        *   `D1`: `profilePicture`
        *   `E1`: `cuisine`
        *   `F1`: `diet`
        *   `G1`: `tdee_goal`
        *   `H1`: `plan_json`

### ขั้นตอนที่ 2: เปิด Apps Script Editor

1.  ใน Google Sheet ของคุณ ไปที่เมนู `ส่วนขยาย (Extensions)` > `Apps Script`

### ขั้นตอนที่ 3: เพิ่มโค้ดสคริปต์ (เวอร์ชันใหม่)

1.  ลบโค้ดที่มีอยู่ทั้งหมดในไฟล์ `Code.gs`
2.  คัดลอกโค้ด **ทั้งหมด** ด้านล่างนี้ไปวางแทนที่:

```javascript
// --- START OF Code.gs ---

const SHEET_NAMES = {
  PROFILE: "Profile",
  BMI: "BMIHistory",
  TDEE: "TDEEHistory",
  FOOD: "FoodHistory",
  PLANNER: "PlannerHistory"
};

function doGet(e) {
  try {
    const username = e.parameter.username;
    if (!username) {
      throw new Error("Username parameter is required.");
    }

    const profile = getLatestProfileForUser(username);
    const bmiHistory = getAllHistoryForUser(SHEET_NAMES.BMI, username);
    const tdeeHistory = getAllHistoryForUser(SHEET_NAMES.TDEE, username);
    const foodHistory = getAllHistoryForUser(SHEET_NAMES.FOOD, username);
    const plannerHistory = getAllHistoryForUser(SHEET_NAMES.PLANNER, username);

    const allData = {
      profile: profile,
      bmiHistory: bmiHistory,
      tdeeHistory: tdeeHistory,
      foodHistory: foodHistory,
      plannerHistory: plannerHistory
    };

    return ContentService.createTextOutput(JSON.stringify(allData))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return createErrorResponse(error);
  }
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, type, payload, user } = request;
    
    if (!user || !user.username) {
        throw new Error("User information is missing.");
    }

    switch (action) {
      case 'save':
        return handleSave(type, payload, user);
      case 'clear':
        return handleClear(type, user);
      default:
        throw new Error("Invalid action specified.");
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}

// --- Handler Functions ---

function handleSave(type, payload, user) {
  if (!payload) throw new Error("Payload is missing for save action.");

  const sheetNameMap = {
    profile: SHEET_NAMES.PROFILE,
    bmiHistory: SHEET_NAMES.BMI,
    tdeeHistory: SHEET_NAMES.TDEE,
    foodHistory: SHEET_NAMES.FOOD,
    plannerHistory: SHEET_NAMES.PLANNER
  };
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetNameMap[type]);
  if (!sheet) throw new Error(`Sheet not found for type: ${type}`);
  
  let newRow;

  switch (type) {
    case 'profile':
      newRow = [ 
        new Date(), user.username, user.displayName, user.profilePicture, 
        payload.gender, payload.age, payload.weight, payload.height, payload.waist, payload.hip, payload.activityLevel 
      ];
      break;
    case 'bmiHistory':
      const lastBmi = payload[0];
      if (!lastBmi) return createSuccessResponse({ status: "No new BMI data to save."});
      newRow = [ 
        new Date(), user.username, user.displayName, user.profilePicture,
        lastBmi.value, lastBmi.category 
      ];
      break;
    case 'tdeeHistory':
      const lastTdee = payload[0];
      if (!lastTdee) return createSuccessResponse({ status: "No new TDEE data to save."});
      newRow = [ 
        new Date(), user.username, user.displayName, user.profilePicture,
        lastTdee.value, lastTdee.bmr 
      ];
      break;
    case 'foodHistory':
      const lastFood = payload[0];
      if (!lastFood) return createSuccessResponse({ status: "No new Food data to save."});
      newRow = [ 
        new Date(), user.username, user.displayName, user.profilePicture,
        lastFood.analysis.description, lastFood.analysis.calories, JSON.stringify(lastFood.analysis) 
      ];
      break;
    case 'plannerHistory':
       const lastPlan = payload[0];
       if (!lastPlan) return createSuccessResponse({ status: "No new Planner data to save."});
       newRow = [ 
         new Date(), user.username, user.displayName, user.profilePicture,
         lastPlan.cuisine, lastPlan.diet, lastPlan.tdee, JSON.stringify(lastPlan.plan) 
       ];
       break;
    default:
      throw new Error(`Unknown data type for save: ${type}`);
  }
  
  sheet.appendRow(newRow);
  
  return createSuccessResponse({ status: `${type} saved successfully.` });
}


function handleClear(type, user) {
  const sheetNameMap = {
    bmiHistory: SHEET_NAMES.BMI,
    tdeeHistory: SHEET_NAMES.TDEE,
    foodHistory: SHEET_NAMES.FOOD,
  };
  const sheetName = sheetNameMap[type];
  if (!sheetName) throw new Error(`Unknown data type for clear: ${type}`);
  
  clearSheetForUser(sheetName, user.username);
  return createSuccessResponse({ status: `${type} cleared successfully.` });
}


// --- Data Fetching Functions ---

function getLatestProfileForUser(username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
  if (!sheet || sheet.getLastRow() < 2) return null;

  const allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const userData = allData.filter(row => row[1] === username); 
  if (userData.length === 0) return null;

  const lastEntry = userData[userData.length - 1];
  
  // Columns: A=ts, B=user, C=disp, D=pic, E=gender, F=age...
  return {
    gender: lastEntry[4], age: lastEntry[5], weight: lastEntry[6], height: lastEntry[7],
    waist: lastEntry[8], hip: lastEntry[9], activityLevel: lastEntry[10]
  };
}

function getAllHistoryForUser(sheetName, username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  
  const allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const userData = allData.filter(row => row[1] === username);

  try {
    if (sheetName === SHEET_NAMES.BMI) {
      // A=ts, B=user, C=disp, D=pic, E=bmi, F=cat
      return userData.map(row => ({ date: row[0], value: row[4], category: row[5] }));
    }
    if (sheetName === SHEET_NAMES.TDEE) {
      // A=ts, B=user, C=disp, D=pic, E=tdee, F=bmr
      return userData.map(row => ({ date: row[0], value: row[4], bmr: row[5] }));
    }
    if (sheetName === SHEET_NAMES.FOOD) {
      // A=ts, B=user, C=disp, D=pic, E=desc, F=cal, G=json
      return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), analysis: JSON.parse(row[6]) }));
    }
    if (sheetName === SHEET_NAMES.PLANNER) {
      // A=ts, B=user, C=disp, D=pic, E=cui, F=diet, G=tdee, H=json
       return userData.map(row => ({ date: row[0], id: new Date(row[0]).toISOString(), cuisine: row[4], diet: row[5], tdee: row[6], plan: JSON.parse(row[7]) }));
    }
  } catch(e) {
    Logger.log("Error parsing history data for user " + username + " in sheet: " + sheetName + ". Error: " + e.message);
    return [];
  }
  return [];
}

// --- Utility Functions ---

function clearSheetForUser(sheetName, username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return;
  
  const data = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const rowsToDelete = [];
  // username is in column B, which is index 1 of the inner array
  for (let i = data.length - 1; i >= 1; i--) { // Iterate backwards when deleting
    if (data[i][1] === username) {
      rowsToDelete.push(i + 1);
    }
  }
  
  rowsToDelete.forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
  });
}

function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(error) {
  Logger.log(error); // Log the actual error for debugging
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- END OF Code.gs ---
```

3.  กดที่ไอคอนรูปแผ่นดิสก์ (💾) เพื่อ **บันทึกโปรเจกต์**

### ขั้นตอนที่ 4: ทำให้สคริปต์ใช้งานได้อีกครั้ง (สำคัญมาก!)

เนื่องจากเราได้เปลี่ยนแปลงโค้ดและโครงสร้างข้อมูลครั้งใหญ่ คุณจำเป็นต้อง **Deploy ใหม่** เพื่อให้การเปลี่ยนแปลงมีผล

1.  ที่มุมบนขวาของหน้าจอ กดปุ่มสีน้ำเงิน `ทำให้ใช้งานได้ (Deploy)` > `จัดการการทำให้ใช้งานได้ (Manage deployments)`
2.  เลือก Deployment ที่มีอยู่ของคุณ แล้วกดที่ไอคอนดินสอ (✏️) เพื่อแก้ไข
3.  ในช่อง "เวอร์ชัน" เลือก **`เวอร์ชันใหม่ (New version)`**
4.  กดปุ่ม `ทำให้ใช้งานได้ (Deploy)`

### ขั้นตอนที่ 5: ใช้งาน Web App URL

1.  **URL ของเว็บแอป** ของคุณจะยังคงเป็นอันเดิม ไม่จำเป็นต้องคัดลอกไปใส่ในแอปใหม่อีก
2.  กลับไปที่แอปพลิเคชัน **"ศูนย์โภชนาการอัจฉริยะ"** และรีเฟรชหน้าจอ

**เรียบร้อย!** ตอนนี้แอปพลิเคชันของคุณได้เชื่อมต่อกับ Google Sheets เวอร์ชันสมบูรณ์แล้ว ข้อมูลทั้งหมดของคุณจะถูกซิงค์โดยอัตโนมัติ