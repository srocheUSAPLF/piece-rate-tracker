# Quick Start Deployment Guide

## 🚀 5-Minute Deployment

### Option 1: GitHub Pages (Recommended)

1. **Create Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourcompany/piece-rate-tracker.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: main, folder: / (root)
   - Save

3. **Access**
   - URL: `https://yourcompany.github.io/piece-rate-tracker/`
   - Wait 2-3 minutes for deployment

### Option 2: Netlify Drop

1. **Build**
   - No build needed! Just zip all files
   
2. **Deploy**
   - Go to https://app.netlify.com/drop
   - Drag and drop your folder
   - Get instant URL

3. **Custom Domain** (Optional)
   - Settings → Domain Management
   - Add custom domain

### Option 3: Local Network Deployment

Perfect for **internal manufacturing floor tablets/phones**:

1. **Install Node.js** on any computer on your network

2. **Start Server**
   ```bash
   npm install -g http-server
   http-server -p 8080
   ```

3. **Access from Devices**
   - Find server IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - On tablets/phones: `http://192.168.1.XXX:8080`
   - Bookmark for easy access

### Option 4: Cloud Hosting (Production)

**Recommended Providers:**
- **Vercel**: Automatic deployments, free SSL
- **Firebase Hosting**: Google infrastructure, offline support
- **AWS S3 + CloudFront**: Enterprise-grade, scalable

## 📝 Google Sheets Integration

### Step 1: Create Sheets

1. Create new Google Sheet: "Piece Rate Tracker Data"
2. Create 4 tabs:
   - Employees
   - Operations
   - PieceRates
   - ScanLog

### Step 2: Set Up Headers

**Employees Tab:**
```
employee_id | name | pin | role | active
```

**Operations Tab:**
```
operation | operation_name | sort_order
```

**PieceRates Tab:**
```
sku | operation | rate | active | effective_start | effective_end | rate_source | fishbowl_last_sync_utc
```

**ScanLog Tab:**
```
scan_id | timestamp_utc | employee_id | mo | sku | unit | operation | rate | earnings | barcode_raw | device_id
```

### Step 3: Enable API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project: "Piece Rate Tracker"
3. Enable APIs:
   - Google Sheets API
   - Google Drive API (for file access)
4. Create credentials:
   - OAuth 2.0 Client ID
   - Add authorized JavaScript origins: `http://localhost:8080`, `https://yourdomain.com`
   - Add redirect URIs: `http://localhost:8080/callback`, `https://yourdomain.com/callback`
5. Download credentials JSON

### Step 4: Configure App

In `piece-rate-tracker.jsx`, replace the mock data loading section:

```javascript
const GOOGLE_SHEETS_CONFIG = {
  apiKey: 'YOUR_API_KEY_HERE',
  clientId: 'YOUR_CLIENT_ID_HERE',
  spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE',
  discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
  scopes: 'https://www.googleapis.com/auth/spreadsheets'
};
```

Get Spreadsheet ID from URL:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```

### Step 5: Add Seed Data

Copy sample data into your sheets:

**Employees:**
```
EMP001 | John Smith | 1234 | admin | TRUE
EMP002 | Maria Garcia | 5678 | employee | TRUE
EMP003 | David Chen | 9012 | employee | TRUE
```

**Operations:**
```
CUT | Cutting | 1
WELD | Welding | 2
PAINT | Painting | 3
ASSEMBLE | Assembly | 4
QC | Quality Check | 5
```

**PieceRates:**
```
WIDGET-A | CUT | 2.50 | TRUE | 2024-01-01 | 2099-12-31 | manual | [blank]
WIDGET-A | WELD | 3.75 | TRUE | 2024-01-01 | 2099-12-31 | manual | [blank]
WIDGET-A | PAINT | 2.00 | TRUE | 2024-01-01 | 2099-12-31 | manual | [blank]
WIDGET-B | CUT | 3.00 | TRUE | 2024-01-01 | 2099-12-31 | manual | [blank]
```

## 🔒 Security Setup

### 1. Change Default PINs

**CRITICAL:** Before deployment, update all default PINs in the Employees sheet!

Default PINs (change these immediately):
- EMP001: 1234 → YOUR_SECURE_PIN
- EMP002: 5678 → YOUR_SECURE_PIN
- EMP003: 9012 → YOUR_SECURE_PIN

### 2. Restrict Sheet Access

1. Open Google Sheet
2. Click "Share" button
3. Set permissions:
   - General access: Restricted
   - Add service account email (from Google Cloud)
   - Permission: Editor

### 3. Add HTTPS

**Required for:**
- Camera access (barcode scanning)
- Service Workers (offline mode)
- Production deployment

All hosting options listed above provide free SSL.

## 📱 Mobile Setup

### iOS (iPhone/iPad)

1. Open in Safari: `https://your-deployment-url.com`
2. Tap Share button (square with arrow)
3. Scroll and tap "Add to Home Screen"
4. Name: "Rate Tracker"
5. Tap "Add"
6. Icon appears on home screen

**Result:** Runs like native app in fullscreen mode!

### Android (Phone/Tablet)

1. Open in Chrome: `https://your-deployment-url.com`
2. Tap menu (three dots)
3. Tap "Install app" or "Add to Home Screen"
4. Confirm installation
5. Icon appears on home screen

**Result:** Installs as Progressive Web App!

## 🧪 Quick Test

After deployment:

1. **Login Test**
   - Try EMP002 / 5678
   - Should see Scan screen

2. **Scan Test**
   - Enter: `12345|WIDGET-A|001|CUT`
   - Should show: "Earned $2.50"

3. **Offline Test**
   - Enable airplane mode
   - Scan: `12345|WIDGET-A|002|CUT`
   - Should queue successfully
   - Disable airplane mode
   - Should auto-sync

4. **Admin Test**
   - Login: EMP001 / 1234
   - Should see Admin Dashboard
   - Try exporting payroll

If all tests pass: ✅ **Ready for production use!**

## 🆘 Troubleshooting

### Issue: Login not working
**Fix:** Check employee_id is exact match (case-sensitive)

### Issue: Scans not syncing
**Fix:** Verify Google Sheets API credentials configured

### Issue: Camera not working
**Fix:** Ensure using HTTPS (required for camera access)

### Issue: Offline mode not working
**Fix:** Check Service Worker is registered (browser console)

### Issue: Can't install on mobile
**Fix:** Must use HTTPS and have manifest.json

## 📞 Support

**Internal IT:**
- Slack: #manufacturing-it
- Email: it-support@yourcompany.com
- Phone: ext. 5555

**External Support:**
- Documentation: See README.md
- Testing Guide: See TESTING.md

## 🎯 Next Steps

1. ✅ Deploy to hosting
2. ✅ Configure Google Sheets
3. ✅ Change default PINs
4. ✅ Add your employees
5. ✅ Add your piece rates
6. ✅ Test with one user
7. ✅ Roll out to team
8. ✅ Monitor first week
9. ✅ Train supervisors on admin features
10. ✅ Schedule weekly payroll exports

---

**Deployment Time:** ~30 minutes (including Google Sheets setup)
**Difficulty:** ⭐⭐☆☆☆ (Beginner-friendly)
**Cost:** $0 (using free tiers)
