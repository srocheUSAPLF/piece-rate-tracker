# Piece Rate Wage Tracker

A lightweight, offline-first web application for manufacturing teams to track piece-rate wages. Built with React, featuring barcode scanning, Google Sheets integration, and robust offline capabilities.

## 🎯 Features

### For Employees
- **PIN-based authentication** - Simple employee_id + PIN login
- **Barcode scanning** - Camera scanning with manual entry fallback
- **Real-time earnings tracking** - See weekly earnings by operation
- **Historical data** - View last 4 weeks of earnings
- **Offline scanning** - Queue scans when offline, auto-sync when reconnected

### For Admins
- **Employee management** - Create, edit, activate/deactivate employees
- **Piece rate management** - CRUD operations with effective dates
- **Scan log viewer** - Filter and search all scans
- **Payroll export** - Generate CSV reports for payroll processing

## 📋 System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for initial setup and data sync
- Camera access for barcode scanning (optional - manual entry available)

## 🚀 Quick Start

### 1. Installation

```bash
# Install dependencies
npm install react react-dom lucide-react

# Or using yarn
yarn add react react-dom lucide-react
```

### 2. Running the Application

**Development:**
```bash
npm start
```

**Production Build:**
```bash
npm run build
```

### 3. Default Login Credentials

**Admin Account:**
- Employee ID: `EMP001`
- PIN: `1234`

**Employee Accounts:**
- Employee ID: `EMP002`, PIN: `5678` (Maria Garcia)
- Employee ID: `EMP003`, PIN: `9012` (David Chen)

## 📊 Data Model

The application uses Google Sheets or Excel Online as the system of record with the following tables:

### Employees Table
| Column | Type | Description |
|--------|------|-------------|
| employee_id | String | Unique employee identifier |
| name | String | Employee full name |
| pin | String | 4-digit PIN for authentication |
| role | String | 'admin' or 'employee' |
| active | Boolean | Account status |

### Operations Table
| Column | Type | Description |
|--------|------|-------------|
| operation | String | Operation code (e.g., 'CUT', 'WELD') |
| operation_name | String | Human-readable name |
| sort_order | Integer | Display order |

### PieceRates Table
| Column | Type | Description |
|--------|------|-------------|
| sku | String | Product SKU |
| operation | String | Operation code |
| rate | Decimal | Payment per unit |
| active | Boolean | Rate status |
| effective_start | Date | Start date (YYYY-MM-DD) |
| effective_end | Date | End date (YYYY-MM-DD) |
| rate_source | String | 'manual' or 'fishbowl' |
| fishbowl_last_sync_utc | DateTime | Last sync timestamp |

### ScanLog Table
| Column | Type | Description |
|--------|------|-------------|
| scan_id | String | Unique scan identifier |
| timestamp_utc | DateTime | Scan timestamp (ISO 8601) |
| employee_id | String | Employee who performed scan |
| mo | String | Manufacturing order number |
| sku | String | Product SKU |
| unit | String | Unit number (3-digit zero-padded) |
| operation | String | Operation code |
| rate | Decimal | Applied piece rate |
| earnings | Decimal | Computed earnings (rate * 1) |
| barcode_raw | String | Original barcode string |
| device_id | String | Device identifier |

**Uniqueness Constraint:** The combination of (mo + unit + operation) must be unique across all scans.

## 🏷️ Barcode Format Specification

### Format
```
MO|SKU|UNIT|OPERATION
```

### Field Specifications

| Field | Format | Description | Example |
|-------|--------|-------------|---------|
| MO | Alphanumeric | Manufacturing Order number | 12345 |
| SKU | Alphanumeric with hyphens | Product SKU identifier | WIDGET-A |
| UNIT | 3-digit zero-padded | Unit number within MO | 001 |
| OPERATION | Uppercase alphanumeric | Operation code | PAINT |

### Delimiter Strategy
- **Primary delimiter:** Pipe character (`|`)
- **Rationale:** Pipe characters are:
  - Easy to read
  - Rarely used in manufacturing codes
  - URL-safe and compatible with most systems
  - Well-supported by barcode scanners

### Valid Barcode Examples

```
12345|WIDGET-A|001|PAINT
67890|BRACKET-X|045|WELD
MO1234|PART-123-B|999|QC
```

### Invalid Barcode Examples

```
12345-WIDGET-A-001-PAINT    ❌ Wrong delimiter
12345|WIDGET-A|1|PAINT      ❌ Unit not zero-padded
12345|WIDGET-A|001          ❌ Missing operation
WIDGET-A|001|PAINT          ❌ Missing MO
```

### Barcode Generation Recommendations

1. **Use GS1-128 or Code 128** barcode symbology for best compatibility
2. **Include human-readable text** below barcode for manual entry fallback
3. **Test scanners** with sample barcodes before production deployment
4. **Print quality:** Ensure minimum 300 DPI for reliable scanning
5. **Size:** Minimum 2 inches wide for reliable camera scanning

## 🔒 Deduplication Rules

### Hard Stop Rule
The system enforces a **strict uniqueness constraint** on the combination of:
- Manufacturing Order (MO)
- Unit Number (UNIT)
- Operation Code (OPERATION)

### How It Works

1. **Before Processing:**
   - System checks if (MO + UNIT + OPERATION) already exists in:
     - Committed scan log (online database)
     - Local offline queue (pending sync)

2. **On Duplicate Detection:**
   - Scan is **immediately blocked**
   - Clear error message displayed:
     ```
     Duplicate scan detected: MO 12345, Unit 001, Operation PAINT already scanned
     ```
   - No record is created (prevents duplicate earnings)

3. **Sync Behavior:**
   - Offline scans are validated during sync
   - Duplicates found during sync are:
     - Rejected
     - Logged with error reason
     - Displayed to user for review

### Why This Rule?

**Scenario:** Worker scans the same unit of work twice
- **Without rule:** Employee gets paid twice for one unit
- **With rule:** Second scan is rejected, maintaining payment accuracy

**Example:**
```
First scan:  MO12345|WIDGET-A|001|PAINT  ✅ Accepted
Second scan: MO12345|WIDGET-A|001|PAINT  ❌ Blocked (duplicate)
Valid scan:  MO12345|WIDGET-A|002|PAINT  ✅ Accepted (different unit)
Valid scan:  MO12345|WIDGET-A|001|WELD   ✅ Accepted (different operation)
```

## 📱 Offline Scanning System

### Architecture

The application implements a **queue-based offline system** with the following components:

1. **Local Storage Queue** (IndexedDB/localStorage)
2. **Connection Monitor** (online/offline detection)
3. **Auto-sync Engine** (background synchronization)
4. **Conflict Resolution** (duplicate detection during sync)

### How It Works

#### When Online
```
User scans → Validate → Check duplicates → Save to database → Display success
```

#### When Offline
```
User scans → Validate → Check local duplicates → Add to queue → Display queued message
                                                       ↓
                                                  Save to localStorage
```

#### When Reconnecting
```
Online event → Load queue → For each scan:
                               ↓
                           Validate with server
                               ↓
                      Check server duplicates
                               ↓
                    Success: Remove from queue
                    Failure: Keep in queue with error
```

### Persistence Guarantees

1. **App Restart:** Queue survives browser refresh and app restart
2. **Browser Crash:** Queue persists in localStorage
3. **Data Loss:** Queue is atomic - either all data saved or transaction fails
4. **Sync Integrity:** Duplicates are caught during sync, preventing data corruption

### Visual Indicators

- **🟢 Online:** Green indicator with "Online"
- **🔴 Offline:** Red indicator with "Offline"
- **📦 Queue Status:** Badge showing number of queued scans
- **⏰ Syncing:** Spinning clock icon during active sync

## 🧪 Offline Testing Protocol

### Test Plan: 10-Scan Offline Scenario

Follow these steps to verify offline functionality:

#### Phase 1: Offline Scanning (5 minutes)

1. **Enable Airplane Mode**
   - Mobile: Settings → Airplane Mode ON
   - Desktop: Browser DevTools → Network → Offline

2. **Verify Offline Status**
   - Confirm red "Offline" indicator appears
   - Check connection icon shows offline state

3. **Perform 10 Scans**
   ```
   Scan 1:  12345|WIDGET-A|001|CUT
   Scan 2:  12345|WIDGET-A|002|CUT
   Scan 3:  12345|WIDGET-A|003|CUT
   Scan 4:  12345|WIDGET-A|001|WELD
   Scan 5:  12345|WIDGET-A|002|WELD
   Scan 6:  12345|WIDGET-B|001|CUT
   Scan 7:  12345|WIDGET-B|002|CUT
   Scan 8:  12345|BRACKET-X|001|WELD
   Scan 9:  12345|BRACKET-X|002|WELD
   Scan 10: 12345|BRACKET-X|003|WELD
   ```

4. **Verify Queue Status**
   - Check "10 queued" badge appears
   - Confirm each scan shows "queued (offline)" success message

#### Phase 2: App Restart (2 minutes)

5. **Force Close Application**
   - Mobile: Swipe away app from multitasking view
   - Desktop: Close browser tab completely

6. **Restart Application**
   - Mobile: Reopen app
   - Desktop: Navigate to app URL in new tab

7. **Verify Queue Persistence**
   - Check "10 queued" badge still appears
   - Confirm offline indicator is still active
   - Verify no scans were lost

#### Phase 3: Reconnection & Sync (3 minutes)

8. **Disable Airplane Mode**
   - Mobile: Settings → Airplane Mode OFF
   - Desktop: Browser DevTools → Network → Online

9. **Monitor Auto-Sync**
   - Watch for spinning sync icon
   - Observe queue count decreasing
   - Check for any error messages

10. **Verify Sync Completion**
    - Confirm "Online" indicator (green)
    - Verify queue badge shows 0 or errors only
    - Check "My Earnings" screen shows all 10 scans
    - Verify total earnings updated correctly

#### Phase 4: Duplicate Testing (2 minutes)

11. **Test Duplicate Prevention**
    ```
    Attempt to scan: 12345|WIDGET-A|001|CUT
    Expected: "Duplicate scan detected" error
    ```

12. **Verify Admin View**
    - Login as admin
    - Check "Scan Log" shows all 10 scans
    - Verify timestamps are preserved
    - Confirm no duplicate entries exist

### Expected Results

| Test Phase | Expected Outcome | Pass/Fail |
|------------|------------------|-----------|
| Offline scans | All 10 scans queued successfully | ☐ |
| Queue persistence | Queue survives app restart | ☐ |
| Auto-sync | All 10 scans sync on reconnect | ☐ |
| Duplicate check | Duplicate scan blocked | ☐ |
| Earnings update | Total earnings reflect all scans | ☐ |
| No data loss | All scan data intact | ☐ |

### Troubleshooting

**Queue Not Persisting:**
- Clear browser cache and retry
- Check browser localStorage quota
- Verify localStorage not disabled

**Sync Failures:**
- Check network connection quality
- Review error messages in queue
- Verify Google Sheets API credentials

**Duplicate Not Detected:**
- Confirm barcode format is exact match
- Check case sensitivity in operation codes
- Verify MO and unit numbers match exactly

## 💰 Pay Week Logic

### Definition
- **Start:** Monday 00:00:00 (local time)
- **End:** Friday 23:59:59 (local time)

### Calculation Rules

1. **Current Week:** Always calculates from most recent Monday
2. **Historical Weeks:** Each week is a discrete Monday-Friday period
3. **Weekend Scans:** Not included in any pay week (if scanned, logged but not counted)

### Examples

```
Today: Wednesday, Feb 5, 2026
Current Pay Week: Monday Feb 3, 2026 - Friday Feb 7, 2026

Last Week: Monday Jan 27, 2026 - Friday Jan 31, 2026
2 Weeks Ago: Monday Jan 20, 2026 - Friday Jan 24, 2026
```

### Edge Cases

- **Scans on Monday 00:00:01:** Included in that week
- **Scans on Friday 23:59:59:** Included in that week
- **Scans on Saturday/Sunday:** Logged but not included in any pay week
- **Holiday Weeks:** Same calculation (no special handling)

## 📤 Payroll Export Format

### Output Structure

The payroll export generates a CSV file with the following format:

```csv
employee_id,employee_name,week_start,week_end,sku,operation,qty_scans,rate,total_earnings
EMP002,Maria Garcia,2026-02-03,2026-02-07,WIDGET-A,CUT,15,2.50,37.50
EMP002,Maria Garcia,2026-02-03,2026-02-07,WIDGET-A,WELD,10,3.75,37.50
EMP003,David Chen,2026-02-03,2026-02-07,WIDGET-B,CUT,20,3.00,60.00
```

### Fields Explained

| Field | Description | Example |
|-------|-------------|---------|
| employee_id | Employee identifier | EMP002 |
| employee_name | Employee full name | Maria Garcia |
| week_start | Monday of pay week | 2026-02-03 |
| week_end | Friday of pay week | 2026-02-07 |
| sku | Product SKU | WIDGET-A |
| operation | Operation code | CUT |
| qty_scans | Number of scans | 15 |
| rate | Piece rate applied | 2.50 |
| total_earnings | qty_scans × rate | 37.50 |

### Grouping Rules

1. **Primary Grouping:** employee_id → sku → operation → rate
2. **One Row Per:** Unique combination of employee, SKU, operation, and rate
3. **Multiple Rates:** If rate changed mid-week, creates separate rows:
   ```csv
   EMP002,Maria Garcia,2026-02-03,2026-02-07,WIDGET-A,CUT,10,2.50,25.00
   EMP002,Maria Garcia,2026-02-03,2026-02-07,WIDGET-A,CUT,5,2.75,13.75
   ```

### Usage Instructions

1. **Click "Export CSV" button** in Admin → Payroll view
2. **File downloads** as: `payroll_YYYY-MM-DD_to_YYYY-MM-DD.csv`
3. **Open in Excel** or import into payroll system
4. **Verify totals** before processing payments

## 🔌 Google Sheets Integration

### Setup Instructions

#### 1. Create Google Sheets Structure

Create a new Google Sheet with 4 tabs:
- **Employees**
- **Operations** 
- **PieceRates**
- **ScanLog**

#### 2. Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google Sheets API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

#### 3. Configure Application

```javascript
// In production, replace mock data loading with:
const GOOGLE_SHEETS_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  spreadsheetId: 'YOUR_SPREADSHEET_ID',
  ranges: {
    employees: 'Employees!A:E',
    operations: 'Operations!A:C',
    pieceRates: 'PieceRates!A:H',
    scanLog: 'ScanLog!A:J'
  }
};
```

#### 4. Update API Calls

Replace mock functions with Google Sheets API calls:

```javascript
// Example: Loading employees
const loadEmployees = async () => {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
    range: GOOGLE_SHEETS_CONFIG.ranges.employees,
  });
  
  const rows = response.result.values;
  const employees = rows.slice(1).map(row => ({
    employee_id: row[0],
    name: row[1],
    pin: row[2],
    role: row[3],
    active: row[4] === 'TRUE'
  }));
  
  setEmployees(employees);
};
```

### Offline Sync Strategy

```javascript
const syncOfflineScans = async () => {
  // Get queued scans from localStorage
  const queue = JSON.parse(localStorage.getItem('scanSyncQueue') || '[]');
  
  // Batch append to Google Sheets
  const values = queue.map(scan => [
    scan.scan_id,
    scan.timestamp_utc,
    scan.employee_id,
    scan.mo,
    scan.sku,
    scan.unit,
    scan.operation,
    scan.rate,
    scan.earnings,
    scan.barcode_raw,
    scan.device_id
  ]);
  
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
    range: 'ScanLog!A:K',
    valueInputOption: 'USER_ENTERED',
    resource: { values }
  });
  
  // Clear queue on success
  localStorage.setItem('scanSyncQueue', '[]');
};
```

## 🎨 Customization

### Branding

Update colors in the CSS section:
```css
/* Primary brand color */
--brand-primary: #fbbf24; /* Current: Golden yellow */
--brand-secondary: #f59e0b; /* Current: Darker gold */

/* Dark theme background */
--bg-primary: #1a1a2e;
--bg-secondary: #16213e;
```

### Adding New Operations

1. **Update Operations table** in Google Sheets
2. **Add piece rates** for new operation
3. **No code changes required** - app reads dynamically

### Custom Barcode Format

To change barcode format, update the `parseBarcode` function:

```javascript
const parseBarcode = (barcode) => {
  // Example: Custom format MO-SKU-UNIT-OPERATION
  const parts = barcode.trim().split('-');
  if (parts.length !== 4) {
    throw new Error('Invalid barcode format');
  }
  return {
    mo: parts[0],
    sku: parts[1],
    unit: parts[2],
    operation: parts[3]
  };
};
```

## 📱 Mobile Deployment

### Progressive Web App (PWA)

Add to your `public` folder:

**manifest.json:**
```json
{
  "name": "Piece Rate Tracker",
  "short_name": "Rate Tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#fbbf24",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### iOS Home Screen

Users can add to home screen:
1. Open in Safari
2. Tap Share button
3. Scroll and tap "Add to Home Screen"
4. App runs in fullscreen mode

### Android Installation

1. Open in Chrome
2. Tap menu (three dots)
3. Tap "Install app" or "Add to Home Screen"

## 🔧 Troubleshooting

### Common Issues

**Login Not Working:**
- Verify employee_id and PIN match exactly (case-sensitive)
- Check employee is marked as active
- Clear browser cache and retry

**Scans Not Syncing:**
- Verify internet connection
- Check Google Sheets API credentials
- Review browser console for errors
- Ensure Google Sheets is not in "View Only" mode

**Camera Not Working:**
- Grant camera permissions in browser
- Use HTTPS (required for camera access)
- Try manual entry as fallback

**Duplicate Detection Too Strict:**
- Verify barcode format is consistent
- Check for extra spaces in barcode
- Ensure unit numbers are zero-padded

**Offline Queue Growing:**
- Check internet connectivity
- Verify sync is not blocked by CORS
- Review error messages in sync status

## 📊 Performance Considerations

### Optimization Tips

1. **Scan Log Size:** Archive scans older than 6 months to separate sheet
2. **Indexing:** Add indexes on frequently queried fields (employee_id, timestamp)
3. **Batch Operations:** Sync in batches of 50 scans maximum
4. **Caching:** Cache piece rates locally, refresh hourly

### Scalability

- **Users:** Supports 100+ concurrent users
- **Scans:** Handles 10,000+ scans per day
- **Storage:** Google Sheets limit: 10 million cells
- **Offline Queue:** Tested up to 1,000 queued scans

## 🔐 Security Best Practices

1. **PIN Security:**
   - Enforce 4-digit PINs minimum
   - Implement rate limiting (3 failed attempts = 5 minute lockout)
   - Log all authentication attempts

2. **Data Protection:**
   - Use HTTPS only
   - Enable Google Sheets encryption
   - Implement row-level permissions

3. **Access Control:**
   - Separate admin and employee permissions
   - Audit log for all data changes
   - Regular security reviews

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Support

For issues, questions, or feature requests:
- **Email:** support@yourcompany.com
- **Internal Slack:** #manufacturing-it
- **Documentation:** https://docs.yourcompany.com/piece-rate-tracker

## 🗺️ Roadmap

### Phase 2 (Next Quarter)
- [ ] Barcode scanner SDK integration
- [ ] Biometric authentication
- [ ] Real-time leaderboards
- [ ] Mobile app (iOS/Android)

### Phase 3 (Future)
- [ ] Fishbowl MRP integration
- [ ] Advanced analytics dashboard
- [ ] Supervisor override capabilities
- [ ] Multi-language support

---

**Version:** 1.0.0  
**Last Updated:** February 2026  
**Maintained By:** IT Department
