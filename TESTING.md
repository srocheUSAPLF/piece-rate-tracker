# Testing Guide - Piece Rate Tracker

## Overview
This document provides detailed testing procedures to verify all critical functionality of the Piece Rate Tracker application.

## Pre-Test Setup

### 1. Environment Preparation
```bash
# Start local server
npm start

# Or use Python SimpleHTTPServer
python -m http.server 8080

# Open in browser
http://localhost:8080
```

### 2. Test Accounts
Use these pre-configured accounts for testing:

**Admin:**
- ID: `EMP001`
- PIN: `1234`
- Name: John Smith

**Employees:**
- ID: `EMP002`, PIN: `5678` - Maria Garcia
- ID: `EMP003`, PIN: `9012` - David Chen

## Test Suite 1: Authentication

### Test 1.1: Successful Login
**Steps:**
1. Enter employee ID: `EMP002`
2. Enter PIN: `5678`
3. Click "Login"

**Expected Result:**
- ✅ Redirects to Scan screen
- ✅ Navigation shows employee functions
- ✅ Connection status visible

**Status:** ☐ Pass / ☐ Fail

### Test 1.2: Invalid Credentials
**Steps:**
1. Enter employee ID: `EMP999`
2. Enter PIN: `0000`
3. Click "Login"

**Expected Result:**
- ✅ Shows error: "Invalid credentials or inactive account"
- ✅ Remains on login screen

**Status:** ☐ Pass / ☐ Fail

### Test 1.3: Inactive Account
**Steps:**
1. Enter employee ID: `EMP004`
2. Enter PIN: `3456`
3. Click "Login"

**Expected Result:**
- ✅ Shows error (account inactive)
- ✅ Login blocked

**Status:** ☐ Pass / ☐ Fail

### Test 1.4: Admin Login
**Steps:**
1. Enter employee ID: `EMP001`
2. Enter PIN: `1234`
3. Click "Login"

**Expected Result:**
- ✅ Redirects to Admin Dashboard
- ✅ Shows admin navigation options

**Status:** ☐ Pass / ☐ Fail

## Test Suite 2: Barcode Scanning (Online)

### Test 2.1: Valid Scan
**Prerequisites:** Login as EMP002

**Steps:**
1. Navigate to Scan screen
2. Enter barcode: `12345|WIDGET-A|001|CUT`
3. Click "Submit Scan"

**Expected Result:**
- ✅ Success message: "✓ Scan recorded! Earned $2.50"
- ✅ Weekly earnings updates to $2.50
- ✅ Scan appears in earnings preview

**Status:** ☐ Pass / ☐ Fail

### Test 2.2: Invalid Barcode Format
**Steps:**
1. Enter barcode: `12345-WIDGET-A-001-CUT` (wrong delimiter)
2. Click "Submit Scan"

**Expected Result:**
- ✅ Error: "Invalid barcode format. Expected: MO|SKU|UNIT|OPERATION"

**Status:** ☐ Pass / ☐ Fail

### Test 2.3: No Piece Rate Found
**Steps:**
1. Enter barcode: `12345|UNKNOWN-SKU|001|CUT`
2. Click "Submit Scan"

**Expected Result:**
- ✅ Error: "No active piece rate found for UNKNOWN-SKU - CUT"

**Status:** ☐ Pass / ☐ Fail

### Test 2.4: Duplicate Detection
**Steps:**
1. Scan: `12345|WIDGET-A|001|CUT` (first time)
2. Scan: `12345|WIDGET-A|001|CUT` (second time)

**Expected Result:**
- ✅ First scan: Success
- ✅ Second scan: Error "Duplicate scan detected: MO 12345, Unit 001, Operation CUT already scanned"

**Status:** ☐ Pass / ☐ Fail

### Test 2.5: Multiple Operations Same Unit
**Steps:**
1. Scan: `12345|WIDGET-A|001|CUT`
2. Scan: `12345|WIDGET-A|001|WELD`

**Expected Result:**
- ✅ Both scans succeed
- ✅ Different operations allowed on same unit

**Status:** ☐ Pass / ☐ Fail

### Test 2.6: Multiple Units Same Operation
**Steps:**
1. Scan: `12345|WIDGET-A|001|CUT`
2. Scan: `12345|WIDGET-A|002|CUT`
3. Scan: `12345|WIDGET-A|003|CUT`

**Expected Result:**
- ✅ All three scans succeed
- ✅ Weekly earnings increases by $2.50 each time

**Status:** ☐ Pass / ☐ Fail

## Test Suite 3: Offline Functionality (CRITICAL)

### Test 3.1: Basic Offline Scan
**Steps:**
1. **Login as EMP002**
2. **Enable Airplane Mode** (Settings → Airplane Mode ON)
3. **Verify offline indicator** (red, shows "Offline")
4. **Enter barcode:** `99999|WIDGET-A|100|CUT`
5. **Click Submit Scan**

**Expected Result:**
- ✅ Success message: "✓ Scan queued (offline). Earned $2.50. Will sync when online."
- ✅ Queue badge shows "1 queued"
- ✅ Scan appears in earnings (locally)

**Status:** ☐ Pass / ☐ Fail

---

### Test 3.2: 10-Scan Offline Scenario (PRIMARY TEST)

This is the **most important test** for offline functionality.

#### Phase A: Offline Scanning (5 minutes)

**Setup:**
1. Login as EMP002
2. Enable Airplane Mode
3. Confirm offline indicator active

**Perform 10 Scans:**
```
Scan 1:  88888|WIDGET-A|201|CUT
Scan 2:  88888|WIDGET-A|202|CUT
Scan 3:  88888|WIDGET-A|203|CUT
Scan 4:  88888|WIDGET-A|204|CUT
Scan 5:  88888|WIDGET-A|205|CUT
Scan 6:  88888|WIDGET-B|201|CUT
Scan 7:  88888|WIDGET-B|202|CUT
Scan 8:  88888|BRACKET-X|201|WELD
Scan 9:  88888|BRACKET-X|202|WELD
Scan 10: 88888|BRACKET-X|203|WELD
```

**Verify After Each Scan:**
- ✅ Success message shows "queued (offline)"
- ✅ Queue badge increments (1, 2, 3... 10)
- ✅ No errors displayed

**Status:** ☐ Pass / ☐ Fail

---

#### Phase B: Persistence Test (2 minutes)

**Steps:**
1. **Note current queue count** (should be 10)
2. **Close browser tab completely** (or force close app on mobile)
3. **Wait 30 seconds**
4. **Reopen application in new tab/window**
5. **Observe queue badge BEFORE logging in**

**Expected Result:**
- ✅ After reopening, queue badge shows "10 queued"
- ✅ No scans lost
- ✅ Offline indicator still active
- ✅ Can see queued items if you check My Earnings

**Status:** ☐ Pass / ☐ Fail

---

#### Phase C: Sync Test (3 minutes)

**Steps:**
1. **Disable Airplane Mode**
2. **Observe sync process:**
   - Watch for spinning clock icon
   - Monitor queue badge count
   - Check for any errors

**Expected Result:**
- ✅ Sync starts automatically within 5 seconds
- ✅ Queue badge counts down: 10 → 9 → 8... → 0
- ✅ Online indicator turns green
- ✅ Success confirmation shown

**Verification:**
3. **Check My Earnings screen:**
   - Navigate to "My Earnings"
   - Verify all 10 scans are present
   - Confirm correct earnings calculated
   
4. **Check Admin View:**
   - Logout and login as EMP001 (admin)
   - Navigate to Scan Log
   - Verify all 10 scans appear
   - Confirm timestamps preserved

**Expected Earnings:**
```
WIDGET-A CUT:  5 units × $2.50 = $12.50
WIDGET-B CUT:  2 units × $3.00 = $6.00
BRACKET-X WELD: 3 units × $2.25 = $6.75
TOTAL: $25.25
```

**Status:** ☐ Pass / ☐ Fail

---

#### Phase D: Duplicate Prevention During Sync

**Steps:**
1. **Go back online** (if not already)
2. **Try to scan duplicate:** `88888|WIDGET-A|201|CUT`
3. **Click Submit Scan**

**Expected Result:**
- ✅ Blocked with error: "Duplicate scan detected..."
- ✅ No new scan created
- ✅ Earnings unchanged

**Status:** ☐ Pass / ☐ Fail

---

### Test 3.3: Offline Duplicate Detection
**Steps:**
1. Enable Airplane Mode
2. Scan: `77777|WIDGET-A|301|CUT`
3. Scan: `77777|WIDGET-A|301|CUT` (duplicate)

**Expected Result:**
- ✅ First scan queued successfully
- ✅ Second scan blocked with duplicate error
- ✅ Only 1 item in queue

**Status:** ☐ Pass / ☐ Fail

### Test 3.4: Mixed Online/Offline Scans
**Steps:**
1. Online: Scan `55555|WIDGET-A|401|CUT`
2. Enable Airplane Mode
3. Offline: Scan `55555|WIDGET-A|402|CUT`
4. Offline: Scan `55555|WIDGET-A|403|CUT`
5. Go back online
6. Wait for sync

**Expected Result:**
- ✅ Online scan saved immediately
- ✅ Offline scans queued (badge shows 2)
- ✅ All scans sync successfully
- ✅ Total 3 scans visible

**Status:** ☐ Pass / ☐ Fail

### Test 3.5: Sync Failure Handling
**Steps:**
1. Offline: Queue 3 scans with valid format
2. Go online
3. Wait for sync to start
4. Quickly go offline again (simulate network interruption)

**Expected Result:**
- ✅ Partial sync may occur
- ✅ Failed scans remain in queue
- ✅ Error shown for failed items
- ✅ Can retry sync when back online

**Status:** ☐ Pass / ☐ Fail

## Test Suite 4: Earnings & History

### Test 4.1: Current Week Earnings
**Prerequisites:** Complete some scans as EMP002

**Steps:**
1. Navigate to "My Earnings"
2. Review breakdown

**Expected Result:**
- ✅ Shows correct pay week dates (Monday-Friday)
- ✅ Total matches sum of operations
- ✅ Each operation grouped correctly

**Status:** ☐ Pass / ☐ Fail

### Test 4.2: Weekly Breakdown Accuracy
**Steps:**
1. Note individual operation earnings
2. Calculate: Count × Rate
3. Compare with displayed total

**Expected Result:**
- ✅ All calculations correct
- ✅ No rounding errors
- ✅ Earnings match scan log

**Status:** ☐ Pass / ☐ Fail

### Test 4.3: History View
**Steps:**
1. Navigate to "History"
2. Review last 4 weeks

**Expected Result:**
- ✅ Shows 4 weeks
- ✅ Current week labeled "(Current)"
- ✅ Each week shows correct date range
- ✅ Scan counts accurate

**Status:** ☐ Pass / ☐ Fail

## Test Suite 5: Admin Functions

### Test 5.1: Admin Login & Dashboard
**Steps:**
1. Login as EMP001
2. Observe admin dashboard

**Expected Result:**
- ✅ Shows admin navigation (Employees, Piece Rates, Scan Log, Payroll)
- ✅ Different UI than employee view

**Status:** ☐ Pass / ☐ Fail

### Test 5.2: Employee Management View
**Steps:**
1. Navigate to "Employees" tab
2. Review employee list

**Expected Result:**
- ✅ Shows all employees
- ✅ Displays role badges (admin/employee)
- ✅ Shows active/inactive status
- ✅ Inactive employees visually distinct

**Status:** ☐ Pass / ☐ Fail

### Test 5.3: Piece Rates View
**Steps:**
1. Navigate to "Piece Rates" tab
2. Review rates

**Expected Result:**
- ✅ Shows SKU and operation
- ✅ Displays rate amount
- ✅ Only active rates shown

**Status:** ☐ Pass / ☐ Fail

### Test 5.4: Scan Log Search
**Steps:**
1. Navigate to "Scan Log" tab
2. Enter search term: "WIDGET-A"
3. Observe results

**Expected Result:**
- ✅ Filters to matching scans
- ✅ Shows employee name
- ✅ Shows all scan details
- ✅ Displays earnings

**Status:** ☐ Pass / ☐ Fail

### Test 5.5: Payroll Export
**Steps:**
1. Navigate to "Payroll" tab
2. Click "Export CSV"
3. Open downloaded file

**Expected Result:**
- ✅ File downloads successfully
- ✅ Filename: `payroll_YYYY-MM-DD_to_YYYY-MM-DD.csv`
- ✅ Contains correct columns
- ✅ Data grouped by employee/SKU/operation
- ✅ Calculations correct (qty × rate = total)

**Status:** ☐ Pass / ☐ Fail

## Test Suite 6: Mobile Responsiveness

### Test 6.1: Mobile Login
**Steps:**
1. Open on mobile device (or browser DevTools mobile view)
2. Attempt login

**Expected Result:**
- ✅ Login form properly sized
- ✅ Input fields large enough to tap
- ✅ No zoom on input focus

**Status:** ☐ Pass / ☐ Fail

### Test 6.2: Mobile Navigation
**Steps:**
1. Login on mobile
2. Check navigation

**Expected Result:**
- ✅ Hamburger menu appears
- ✅ Menu slides in smoothly
- ✅ All options accessible

**Status:** ☐ Pass / ☐ Fail

### Test 6.3: Mobile Scanning
**Steps:**
1. Navigate to Scan screen on mobile
2. Test manual entry

**Expected Result:**
- ✅ Input keyboard friendly
- ✅ Submit button easily tappable
- ✅ Success/error messages readable

**Status:** ☐ Pass / ☐ Fail

### Test 6.4: Mobile Earnings View
**Steps:**
1. View "My Earnings" on mobile

**Expected Result:**
- ✅ Cards stack vertically
- ✅ Text readable without zoom
- ✅ All data visible

**Status:** ☐ Pass / ☐ Fail

## Test Suite 7: Edge Cases & Error Handling

### Test 7.1: Empty State - No Scans
**Steps:**
1. Login as EMP004 (no scans)
2. View "My Earnings"

**Expected Result:**
- ✅ Shows "No scans recorded this week"
- ✅ Total shows $0.00
- ✅ No crash or errors

**Status:** ☐ Pass / ☐ Fail

### Test 7.2: Rapid Scanning
**Steps:**
1. Submit 10 scans as fast as possible

**Expected Result:**
- ✅ All scans processed
- ✅ No scans lost
- ✅ No duplicate errors (unless actually duplicates)

**Status:** ☐ Pass / ☐ Fail

### Test 7.3: Long Session
**Steps:**
1. Login and leave browser open for 30 minutes
2. Attempt scan

**Expected Result:**
- ✅ Still logged in
- ✅ Scan processes normally
- ✅ No session timeout

**Status:** ☐ Pass / ☐ Fail

### Test 7.4: Browser Refresh
**Steps:**
1. Login
2. Perform 2 scans
3. Refresh browser (F5)

**Expected Result:**
- ✅ Redirects to login
- ✅ After re-login, scans still visible
- ✅ No data loss

**Status:** ☐ Pass / ☐ Fail

## Test Suite 8: Pay Week Logic

### Test 8.1: Monday Morning
**Setup:** Set system date to Monday 00:00:01

**Steps:**
1. Login
2. Perform scan
3. Check "My Earnings"

**Expected Result:**
- ✅ Scan included in current week
- ✅ Week start is today (Monday)
- ✅ Week end is Friday

**Status:** ☐ Pass / ☐ Fail

### Test 8.2: Friday Evening
**Setup:** Set system date to Friday 23:59:00

**Steps:**
1. Perform scan
2. Check "My Earnings"

**Expected Result:**
- ✅ Scan included in current week
- ✅ Week end is today (Friday)

**Status:** ☐ Pass / ☐ Fail

### Test 8.3: Weekend Scan
**Setup:** Set system date to Saturday

**Steps:**
1. Perform scan
2. Check "My Earnings" and "History"

**Expected Result:**
- ✅ Scan logged with timestamp
- ✅ Not included in any pay week (implementation dependent)
- ✅ Appears in scan log

**Status:** ☐ Pass / ☐ Fail

## Performance Benchmarks

### Benchmark 1: Scan Processing Time
**Target:** < 500ms per scan

**Steps:**
1. Record timestamp before scan
2. Submit scan
3. Record timestamp when success message appears

**Results:**
- Scan 1: _____ ms
- Scan 2: _____ ms
- Scan 3: _____ ms
- Average: _____ ms

**Status:** ☐ Pass (< 500ms) / ☐ Fail

### Benchmark 2: Offline Queue Size
**Target:** Support 1000+ queued scans

**Steps:**
1. Create test script to queue 1000 scans
2. Verify all stored in localStorage
3. Sync and verify all process

**Status:** ☐ Pass / ☐ Fail / ☐ Not Tested

## Critical Path Summary

The following tests are **MANDATORY** before production deployment:

1. ✅ Test 1.1 - Successful Login
2. ✅ Test 2.1 - Valid Scan
3. ✅ Test 2.4 - Duplicate Detection
4. ✅ **Test 3.2 - 10-Scan Offline Scenario (ALL PHASES)**
5. ✅ Test 4.1 - Current Week Earnings
6. ✅ Test 5.5 - Payroll Export

**Overall System Status:** ☐ Ready for Production / ☐ Needs Work

## Test Execution Log

**Test Date:** _______________  
**Tester Name:** _______________  
**Environment:** ☐ Development / ☐ Staging / ☐ Production  
**Device/Browser:** _______________  

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

**Issues Found:**
_____________________________________________
_____________________________________________
_____________________________________________

**Sign-off:** _______________  
**Date:** _______________
