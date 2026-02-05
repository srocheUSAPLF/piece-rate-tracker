import React, { useState, useEffect, useRef } from 'react';
import { Camera, LogOut, Users, DollarSign, BarChart3, Download, Plus, Edit2, Trash2, Search, Wifi, WifiOff, CheckCircle, XCircle, Clock, AlertCircle, Menu, X } from 'lucide-react';

// ============================================================================
// BARCODE FORMAT SPECIFICATION
// ============================================================================
// Format: MO|SKU|UNIT|OPERATION
// Example: 12345|WIDGET-A|001|PAINT
// Delimiter: | (pipe character)
// - MO: Manufacturing Order number (alphanumeric)
// - SKU: Product SKU (alphanumeric with hyphens)
// - UNIT: Unit number (zero-padded 3 digits)
// - OPERATION: Operation code (uppercase alphanumeric)
// ============================================================================

const PieceRateTracker = () => {
  // State Management
  const [currentUser, setCurrentUser] = useState(null);
  const [activeScreen, setActiveScreen] = useState('login');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncQueue, setSyncQueue] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data States
  const [employees, setEmployees] = useState([]);
  const [operations, setOperations] = useState([]);
  const [pieceRates, setPieceRates] = useState([]);
  const [scanLog, setScanLog] = useState([]);

  // Form States
  const [loginForm, setLoginForm] = useState({ employeeId: '', pin: '' });
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Admin States
  const [adminView, setAdminView] = useState('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // ============================================================================
  // OFFLINE PERSISTENCE & SYNC SYSTEM
  // ============================================================================

  useEffect(() => {
    // Load sync queue from localStorage on mount
    const savedQueue = localStorage.getItem('scanSyncQueue');
    if (savedQueue) {
      setSyncQueue(JSON.parse(savedQueue));
    }

    // Load mock data (in production, this would be Google Sheets API)
    loadMockData();

    // Setup online/offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineScans();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist sync queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('scanSyncQueue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  const loadMockData = () => {
    // Mock Employees
    setEmployees([
      { employee_id: 'EMP001', name: 'John Smith', pin: '1234', role: 'admin', active: true },
      { employee_id: 'EMP002', name: 'Maria Garcia', pin: '5678', role: 'employee', active: true },
      { employee_id: 'EMP003', name: 'David Chen', pin: '9012', role: 'employee', active: true },
      { employee_id: 'EMP004', name: 'Sarah Johnson', pin: '3456', role: 'employee', active: false },
    ]);

    // Mock Operations
    setOperations([
      { operation: 'CUT', operation_name: 'Cutting', sort_order: 1 },
      { operation: 'WELD', operation_name: 'Welding', sort_order: 2 },
      { operation: 'PAINT', operation_name: 'Painting', sort_order: 3 },
      { operation: 'ASSEMBLE', operation_name: 'Assembly', sort_order: 4 },
      { operation: 'QC', operation_name: 'Quality Check', sort_order: 5 },
    ]);

    // Mock Piece Rates
    setPieceRates([
      { sku: 'WIDGET-A', operation: 'CUT', rate: 2.50, active: true, effective_start: '2024-01-01', effective_end: '2099-12-31', rate_source: 'manual', fishbowl_last_sync_utc: null },
      { sku: 'WIDGET-A', operation: 'WELD', rate: 3.75, active: true, effective_start: '2024-01-01', effective_end: '2099-12-31', rate_source: 'manual', fishbowl_last_sync_utc: null },
      { sku: 'WIDGET-A', operation: 'PAINT', rate: 2.00, active: true, effective_start: '2024-01-01', effective_end: '2099-12-31', rate_source: 'manual', fishbowl_last_sync_utc: null },
      { sku: 'WIDGET-B', operation: 'CUT', rate: 3.00, active: true, effective_start: '2024-01-01', effective_end: '2099-12-31', rate_source: 'manual', fishbowl_last_sync_utc: null },
      { sku: 'WIDGET-B', operation: 'ASSEMBLE', rate: 5.50, active: true, effective_start: '2024-01-01', effective_end: '2099-12-31', rate_source: 'manual', fishbowl_last_sync_utc: null },
      { sku: 'BRACKET-X', operation: 'CUT', rate: 1.50, active: true, effective_start: '2024-01-01', effective_end: '2099-12-31', rate_source: 'manual', fishbowl_last_sync_utc: null },
      { sku: 'BRACKET-X', operation: 'WELD', rate: 2.25, active: true, effective_start: '2024-01-01', effective_end: '2099-12-31', rate_source: 'manual', fishbowl_last_sync_utc: null },
    ]);

    // Mock Scan Log (last 4 weeks)
    const mockScans = [];
    const today = new Date();
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 28);
      const scanDate = new Date(today);
      scanDate.setDate(scanDate.getDate() - daysAgo);
      
      const skus = ['WIDGET-A', 'WIDGET-B', 'BRACKET-X'];
      const ops = ['CUT', 'WELD', 'PAINT', 'ASSEMBLE'];
      const emps = ['EMP002', 'EMP003'];
      
      const sku = skus[Math.floor(Math.random() * skus.length)];
      const operation = ops[Math.floor(Math.random() * ops.length)];
      const employee_id = emps[Math.floor(Math.random() * emps.length)];
      const mo = `MO${10000 + Math.floor(Math.random() * 90000)}`;
      const unit = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
      
      const rate = pieceRates.find(r => r.sku === sku && r.operation === operation)?.rate || 0;
      
      mockScans.push({
        scan_id: `SCAN${String(i + 1).padStart(6, '0')}`,
        timestamp_utc: scanDate.toISOString(),
        employee_id,
        mo,
        sku,
        unit,
        operation,
        rate,
        earnings: rate,
        barcode_raw: `${mo}|${sku}|${unit}|${operation}`,
        device_id: 'DEVICE001'
      });
    }
    setScanLog(mockScans);
  };

  const syncOfflineScans = async () => {
    if (syncQueue.length === 0) return;

    setIsSyncing(true);
    const successfulScans = [];
    const failedScans = [];

    for (const queuedScan of syncQueue) {
      try {
        // Check for duplicates
        const isDuplicate = scanLog.some(
          s => s.mo === queuedScan.mo && s.unit === queuedScan.unit && s.operation === queuedScan.operation
        );

        if (isDuplicate) {
          failedScans.push({ ...queuedScan, error: 'Duplicate scan detected' });
        } else {
          // In production: POST to Google Sheets API
          // For demo: add directly to scanLog
          setScanLog(prev => [...prev, queuedScan]);
          successfulScans.push(queuedScan);
        }
      } catch (error) {
        failedScans.push({ ...queuedScan, error: error.message });
      }
    }

    // Remove successful scans from queue
    setSyncQueue(failedScans);
    setIsSyncing(false);
  };

  // ============================================================================
  // BARCODE PARSING & VALIDATION
  // ============================================================================

  const parseBarcode = (barcode) => {
    const parts = barcode.trim().split('|');
    if (parts.length !== 4) {
      throw new Error('Invalid barcode format. Expected: MO|SKU|UNIT|OPERATION');
    }
    return {
      mo: parts[0],
      sku: parts[1],
      unit: parts[2],
      operation: parts[3]
    };
  };

  const findPieceRate = (sku, operation) => {
    const today = new Date().toISOString().split('T')[0];
    return pieceRates.find(
      r => r.sku === sku && 
           r.operation === operation && 
           r.active && 
           r.effective_start <= today && 
           r.effective_end >= today
    );
  };

  const checkDuplicate = (mo, unit, operation) => {
    return scanLog.some(s => s.mo === mo && s.unit === unit && s.operation === operation) ||
           syncQueue.some(s => s.mo === mo && s.unit === unit && s.operation === operation);
  };

  // ============================================================================
  // SCAN PROCESSING
  // ============================================================================

  const processScan = () => {
    setScanError('');
    setScanSuccess('');

    try {
      // Parse barcode
      const parsed = parseBarcode(scanInput);
      
      // Find piece rate
      const rate = findPieceRate(parsed.sku, parsed.operation);
      if (!rate) {
        setScanError(`No active piece rate found for ${parsed.sku} - ${parsed.operation}`);
        return;
      }

      // Check for duplicates
      if (checkDuplicate(parsed.mo, parsed.unit, parsed.operation)) {
        setScanError(`Duplicate scan detected: MO ${parsed.mo}, Unit ${parsed.unit}, Operation ${parsed.operation} already scanned`);
        return;
      }

      // Create scan record
      const scanRecord = {
        scan_id: `SCAN${Date.now()}`,
        timestamp_utc: new Date().toISOString(),
        employee_id: currentUser.employee_id,
        mo: parsed.mo,
        sku: parsed.sku,
        unit: parsed.unit,
        operation: parsed.operation,
        rate: rate.rate,
        earnings: rate.rate,
        barcode_raw: scanInput,
        device_id: 'WEB_APP'
      };

      if (isOnline) {
        // Online: add directly to scanLog (in production: POST to Google Sheets)
        setScanLog(prev => [...prev, scanRecord]);
        setScanSuccess(`✓ Scan recorded! Earned $${rate.rate.toFixed(2)}`);
      } else {
        // Offline: add to sync queue
        setSyncQueue(prev => [...prev, scanRecord]);
        setScanSuccess(`✓ Scan queued (offline). Earned $${rate.rate.toFixed(2)}. Will sync when online.`);
      }

      setScanInput('');
    } catch (error) {
      setScanError(error.message);
    }
  };

  // ============================================================================
  // PAY WEEK CALCULATIONS
  // ============================================================================

  const getPayWeekBounds = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);
    
    return { start: monday, end: friday };
  };

  const getCurrentPayWeek = () => {
    return getPayWeekBounds(new Date());
  };

  const getWeeklyEarnings = (employeeId) => {
    const { start, end } = getCurrentPayWeek();
    const userScans = scanLog.filter(s => {
      const scanDate = new Date(s.timestamp_utc);
      return s.employee_id === employeeId && scanDate >= start && scanDate <= end;
    });

    const byOperation = {};
    userScans.forEach(scan => {
      const key = `${scan.sku}|${scan.operation}`;
      if (!byOperation[key]) {
        byOperation[key] = { sku: scan.sku, operation: scan.operation, count: 0, earnings: 0 };
      }
      byOperation[key].count++;
      byOperation[key].earnings += scan.earnings;
    });

    return Object.values(byOperation);
  };

  const getLast4WeeksHistory = (employeeId) => {
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const { start, end } = getPayWeekBounds(date);
      
      const weekScans = scanLog.filter(s => {
        const scanDate = new Date(s.timestamp_utc);
        return s.employee_id === employeeId && scanDate >= start && scanDate <= end;
      });

      const total = weekScans.reduce((sum, s) => sum + s.earnings, 0);
      
      weeks.push({
        weekStart: start,
        weekEnd: end,
        scans: weekScans.length,
        earnings: total
      });
    }
    return weeks;
  };

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  const handleLogin = () => {
    const employee = employees.find(
      e => e.employee_id === loginForm.employeeId && e.pin === loginForm.pin && e.active
    );
    
    if (employee) {
      setCurrentUser(employee);
      setActiveScreen(employee.role === 'admin' ? 'admin' : 'scan');
      setLoginForm({ employeeId: '', pin: '' });
    } else {
      alert('Invalid credentials or inactive account');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveScreen('login');
    setMobileMenuOpen(false);
  };

  // ============================================================================
  // PAYROLL EXPORT
  // ============================================================================

  const exportPayroll = () => {
    const { start, end } = getCurrentPayWeek();
    
    // Group by employee, sku, operation
    const grouped = {};
    scanLog.forEach(scan => {
      const scanDate = new Date(scan.timestamp_utc);
      if (scanDate >= start && scanDate <= end) {
        const key = `${scan.employee_id}|${scan.sku}|${scan.operation}|${scan.rate}`;
        if (!grouped[key]) {
          const employee = employees.find(e => e.employee_id === scan.employee_id);
          grouped[key] = {
            employee_id: scan.employee_id,
            employee_name: employee?.name || 'Unknown',
            week_start: start.toISOString().split('T')[0],
            week_end: end.toISOString().split('T')[0],
            sku: scan.sku,
            operation: scan.operation,
            qty_scans: 0,
            rate: scan.rate,
            total_earnings: 0
          };
        }
        grouped[key].qty_scans++;
        grouped[key].total_earnings += scan.earnings;
      }
    });

    const rows = Object.values(grouped);
    const csv = [
      ['employee_id', 'employee_name', 'week_start', 'week_end', 'sku', 'operation', 'qty_scans', 'rate', 'total_earnings'],
      ...rows.map(r => [r.employee_id, r.employee_name, r.week_start, r.week_end, r.sku, r.operation, r.qty_scans, r.rate.toFixed(2), r.total_earnings.toFixed(2)])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // ============================================================================
  // UI COMPONENTS
  // ============================================================================

  const ConnectionStatus = () => (
    <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
      <span>{isOnline ? 'Online' : 'Offline'}</span>
      {syncQueue.length > 0 && (
        <span className="sync-badge">{syncQueue.length} queued</span>
      )}
      {isSyncing && <Clock size={16} className="spinning" />}
    </div>
  );

  const LoginScreen = () => (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <DollarSign size={48} />
          <h1>Piece Rate Tracker</h1>
          <p>Manufacturing Wage Management</p>
        </div>
        <div className="login-form">
          <input
            type="text"
            placeholder="Employee ID"
            value={loginForm.employeeId}
            onChange={(e) => setLoginForm({ ...loginForm, employeeId: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <input
            type="password"
            placeholder="PIN"
            value={loginForm.pin}
            onChange={(e) => setLoginForm({ ...loginForm, pin: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button onClick={handleLogin} className="btn-primary">Login</button>
        </div>
        <ConnectionStatus />
      </div>
    </div>
  );

  const ScanScreen = () => {
    const weeklyEarnings = getWeeklyEarnings(currentUser.employee_id);
    const totalWeekly = weeklyEarnings.reduce((sum, item) => sum + item.earnings, 0);

    return (
      <div className="scan-screen">
        <div className="scan-header">
          <h2>Scan Barcode</h2>
          <div className="weekly-total">
            <span>This Week:</span>
            <strong>${totalWeekly.toFixed(2)}</strong>
          </div>
        </div>

        {isCameraActive ? (
          <div className="camera-view">
            <div className="camera-placeholder">
              <Camera size={64} />
              <p>Camera scanning would be active here</p>
              <p className="camera-note">In production: Use WebRTC camera API + barcode scanner library</p>
              <button onClick={() => setIsCameraActive(false)} className="btn-secondary">
                Close Camera
              </button>
            </div>
          </div>
        ) : (
          <div className="scan-input-section">
            <button onClick={() => setIsCameraActive(true)} className="btn-camera">
              <Camera size={24} />
              <span>Scan with Camera</span>
            </button>

            <div className="or-divider">OR</div>

            <div className="manual-entry">
              <label>Manual Entry</label>
              <input
                type="text"
                placeholder="MO|SKU|UNIT|OPERATION"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && processScan()}
              />
              <button onClick={processScan} className="btn-primary">Submit Scan</button>
              <p className="hint">Format: 12345|WIDGET-A|001|PAINT</p>
            </div>
          </div>
        )}

        {scanError && (
          <div className="scan-message error">
            <XCircle size={20} />
            <span>{scanError}</span>
          </div>
        )}

        {scanSuccess && (
          <div className="scan-message success">
            <CheckCircle size={20} />
            <span>{scanSuccess}</span>
          </div>
        )}

        {weeklyEarnings.length > 0 && (
          <div className="earnings-preview">
            <h3>This Week's Operations</h3>
            <div className="earnings-list">
              {weeklyEarnings.map((item, idx) => (
                <div key={idx} className="earnings-item">
                  <div>
                    <strong>{item.sku}</strong>
                    <span>{item.operation}</span>
                  </div>
                  <div>
                    <span>{item.count} units</span>
                    <strong>${item.earnings.toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const EarningsScreen = () => {
    const weeklyEarnings = getWeeklyEarnings(currentUser.employee_id);
    const totalWeekly = weeklyEarnings.reduce((sum, item) => sum + item.earnings, 0);
    const { start, end } = getCurrentPayWeek();

    return (
      <div className="earnings-screen">
        <h2>My Earnings</h2>
        <div className="pay-week-info">
          <p>Pay Week: {start.toLocaleDateString()} - {end.toLocaleDateString()}</p>
        </div>

        <div className="total-card">
          <span>Total Weekly Earnings</span>
          <h1>${totalWeekly.toFixed(2)}</h1>
        </div>

        <div className="earnings-breakdown">
          <h3>Breakdown by Operation</h3>
          {weeklyEarnings.length === 0 ? (
            <p className="empty-state">No scans recorded this week</p>
          ) : (
            <div className="breakdown-grid">
              {weeklyEarnings.map((item, idx) => (
                <div key={idx} className="breakdown-card">
                  <div className="breakdown-header">
                    <strong>{item.sku}</strong>
                    <span className="operation-badge">{item.operation}</span>
                  </div>
                  <div className="breakdown-stats">
                    <div>
                      <span>Units</span>
                      <strong>{item.count}</strong>
                    </div>
                    <div>
                      <span>Earnings</span>
                      <strong>${item.earnings.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const HistoryScreen = () => {
    const history = getLast4WeeksHistory(currentUser.employee_id);

    return (
      <div className="history-screen">
        <h2>Last 4 Weeks</h2>
        <div className="history-list">
          {history.map((week, idx) => (
            <div key={idx} className="history-card">
              <div className="history-header">
                <span className="week-label">Week {idx === 0 ? '(Current)' : idx}</span>
                <span className="week-dates">
                  {week.weekStart.toLocaleDateString()} - {week.weekEnd.toLocaleDateString()}
                </span>
              </div>
              <div className="history-stats">
                <div>
                  <span>Scans</span>
                  <strong>{week.scans}</strong>
                </div>
                <div>
                  <span>Earnings</span>
                  <strong>${week.earnings.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AdminDashboard = () => {
    const renderEmployees = () => (
      <div className="admin-section">
        <div className="section-header">
          <h3>Employees</h3>
          <button className="btn-icon" onClick={() => setEditingItem({ type: 'employee', data: {} })}>
            <Plus size={20} />
          </button>
        </div>
        <div className="data-table">
          {employees.map(emp => (
            <div key={emp.employee_id} className={`data-row ${!emp.active ? 'inactive' : ''}`}>
              <div className="data-main">
                <strong>{emp.name}</strong>
                <span>{emp.employee_id}</span>
              </div>
              <div className="data-meta">
                <span className={`role-badge ${emp.role}`}>{emp.role}</span>
                <span className={`status-badge ${emp.active ? 'active' : 'inactive'}`}>
                  {emp.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    const renderPieceRates = () => (
      <div className="admin-section">
        <div className="section-header">
          <h3>Piece Rates</h3>
          <button className="btn-icon" onClick={() => setEditingItem({ type: 'rate', data: {} })}>
            <Plus size={20} />
          </button>
        </div>
        <div className="data-table">
          {pieceRates.filter(r => r.active).map((rate, idx) => (
            <div key={idx} className="data-row">
              <div className="data-main">
                <strong>{rate.sku}</strong>
                <span>{rate.operation}</span>
              </div>
              <div className="data-meta">
                <span className="rate-amount">${rate.rate.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    const renderScanLog = () => {
      const filteredScans = scanLog.filter(scan => 
        scan.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.mo.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 50);

      return (
        <div className="admin-section">
          <div className="section-header">
            <h3>Scan Log</h3>
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search scans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="data-table">
            {filteredScans.map(scan => {
              const emp = employees.find(e => e.employee_id === scan.employee_id);
              return (
                <div key={scan.scan_id} className="data-row scan-row">
                  <div className="scan-info">
                    <div className="scan-primary">
                      <strong>{emp?.name || scan.employee_id}</strong>
                      <span className="scan-time">{new Date(scan.timestamp_utc).toLocaleString()}</span>
                    </div>
                    <div className="scan-details">
                      <span>MO: {scan.mo}</span>
                      <span>•</span>
                      <span>{scan.sku}</span>
                      <span>•</span>
                      <span>Unit {scan.unit}</span>
                      <span>•</span>
                      <span>{scan.operation}</span>
                    </div>
                  </div>
                  <div className="scan-earnings">
                    ${scan.earnings.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const renderPayroll = () => (
      <div className="admin-section">
        <div className="section-header">
          <h3>Payroll Export</h3>
          <button className="btn-primary" onClick={exportPayroll}>
            <Download size={20} />
            <span>Export CSV</span>
          </button>
        </div>
        <div className="payroll-info">
          <p>Export current pay week ({getCurrentPayWeek().start.toLocaleDateString()} - {getCurrentPayWeek().end.toLocaleDateString()})</p>
          <p>Format: CSV with employee, SKU, operation, quantities, rates, and totals</p>
        </div>
      </div>
    );

    return (
      <div className="admin-dashboard">
        <div className="admin-nav">
          <button 
            className={adminView === 'employees' ? 'active' : ''} 
            onClick={() => setAdminView('employees')}
          >
            <Users size={20} />
            <span>Employees</span>
          </button>
          <button 
            className={adminView === 'rates' ? 'active' : ''} 
            onClick={() => setAdminView('rates')}
          >
            <DollarSign size={20} />
            <span>Piece Rates</span>
          </button>
          <button 
            className={adminView === 'scans' ? 'active' : ''} 
            onClick={() => setAdminView('scans')}
          >
            <BarChart3 size={20} />
            <span>Scan Log</span>
          </button>
          <button 
            className={adminView === 'payroll' ? 'active' : ''} 
            onClick={() => setAdminView('payroll')}
          >
            <Download size={20} />
            <span>Payroll</span>
          </button>
        </div>

        <div className="admin-content">
          {adminView === 'employees' && renderEmployees()}
          {adminView === 'rates' && renderPieceRates()}
          {adminView === 'scans' && renderScanLog()}
          {adminView === 'payroll' && renderPayroll()}
        </div>
      </div>
    );
  };

  const Navigation = () => {
    if (!currentUser) return null;

    const isAdmin = currentUser.role === 'admin';

    return (
      <>
        <nav className="main-nav">
          <div className="nav-brand">
            <DollarSign size={24} />
            <span>Piece Rate Tracker</span>
          </div>
          
          <div className="nav-links desktop-only">
            {isAdmin ? (
              <button 
                className={activeScreen === 'admin' ? 'active' : ''} 
                onClick={() => setActiveScreen('admin')}
              >
                Admin Dashboard
              </button>
            ) : (
              <>
                <button 
                  className={activeScreen === 'scan' ? 'active' : ''} 
                  onClick={() => setActiveScreen('scan')}
                >
                  Scan
                </button>
                <button 
                  className={activeScreen === 'earnings' ? 'active' : ''} 
                  onClick={() => setActiveScreen('earnings')}
                >
                  My Earnings
                </button>
                <button 
                  className={activeScreen === 'history' ? 'active' : ''} 
                  onClick={() => setActiveScreen('history')}
                >
                  History
                </button>
              </>
            )}
          </div>

          <div className="nav-actions">
            <ConnectionStatus />
            <button className="btn-icon desktop-only" onClick={handleLogout}>
              <LogOut size={20} />
            </button>
            <button className="btn-icon mobile-only" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="mobile-menu">
            {isAdmin ? (
              <button onClick={() => { setActiveScreen('admin'); setMobileMenuOpen(false); }}>
                Admin Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => { setActiveScreen('scan'); setMobileMenuOpen(false); }}>
                  Scan
                </button>
                <button onClick={() => { setActiveScreen('earnings'); setMobileMenuOpen(false); }}>
                  My Earnings
                </button>
                <button onClick={() => { setActiveScreen('history'); setMobileMenuOpen(false); }}>
                  History
                </button>
              </>
            )}
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        {!currentUser && <LoginScreen />}
        {currentUser && activeScreen === 'scan' && <ScanScreen />}
        {currentUser && activeScreen === 'earnings' && <EarningsScreen />}
        {currentUser && activeScreen === 'history' && <HistoryScreen />}
        {currentUser && activeScreen === 'admin' && <AdminDashboard />}
      </main>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #e4e4e7;
          min-height: 100vh;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Navigation */
        .main-nav {
          background: rgba(26, 26, 46, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(228, 228, 231, 0.1);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 700;
          font-size: 1.1rem;
          color: #fbbf24;
        }

        .nav-links {
          display: flex;
          gap: 0.5rem;
        }

        .nav-links button {
          background: none;
          border: none;
          color: #a1a1aa;
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .nav-links button:hover {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
        }

        .nav-links button.active {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
          font-weight: 600;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .connection-status.online {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .connection-status.offline {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .sync-badge {
          background: #fbbf24;
          color: #1a1a2e;
          padding: 0.125rem 0.5rem;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .btn-icon {
          background: none;
          border: none;
          color: #a1a1aa;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon:hover {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
        }

        .mobile-menu {
          background: rgba(26, 26, 46, 0.98);
          border-bottom: 1px solid rgba(228, 228, 231, 0.1);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mobile-menu button {
          background: none;
          border: none;
          color: #e4e4e7;
          padding: 0.875rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          text-align: left;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .mobile-menu button:hover {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
        }

        .mobile-menu .logout-btn {
          margin-top: 0.5rem;
          border-top: 1px solid rgba(228, 228, 231, 0.1);
          padding-top: 1rem;
          color: #ef4444;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          padding: 2rem 1.5rem;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
        }

        /* Login Screen */
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 100px);
        }

        .login-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 24px;
          padding: 3rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-header svg {
          color: #fbbf24;
          margin-bottom: 1rem;
        }

        .login-header h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-header p {
          color: #a1a1aa;
          font-size: 0.95rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .login-form input {
          background: rgba(228, 228, 231, 0.05);
          border: 1px solid rgba(228, 228, 231, 0.1);
          border-radius: 12px;
          padding: 1rem;
          color: #e4e4e7;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .login-form input:focus {
          outline: none;
          border-color: #fbbf24;
          background: rgba(228, 228, 231, 0.08);
        }

        .btn-primary {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border: none;
          border-radius: 12px;
          padding: 1rem;
          color: #1a1a2e;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(251, 191, 36, 0.3);
        }

        .btn-secondary {
          background: rgba(228, 228, 231, 0.1);
          border: 1px solid rgba(228, 228, 231, 0.2);
          border-radius: 12px;
          padding: 1rem;
          color: #e4e4e7;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(228, 228, 231, 0.15);
        }

        /* Scan Screen */
        .scan-screen {
          max-width: 800px;
          margin: 0 auto;
        }

        .scan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .scan-header h2 {
          font-size: 2rem;
          font-weight: 800;
        }

        .weekly-total {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 12px;
          padding: 0.75rem 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .weekly-total span {
          font-size: 0.875rem;
          color: #a1a1aa;
        }

        .weekly-total strong {
          font-size: 1.75rem;
          color: #fbbf24;
          font-weight: 800;
        }

        .btn-camera {
          width: 100%;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border: none;
          border-radius: 16px;
          padding: 2rem;
          color: #1a1a2e;
          font-size: 1.25rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .btn-camera:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(251, 191, 36, 0.4);
        }

        .camera-view {
          background: rgba(26, 26, 46, 0.6);
          border: 2px dashed rgba(251, 191, 36, 0.3);
          border-radius: 16px;
          padding: 3rem;
          margin-bottom: 1.5rem;
        }

        .camera-placeholder {
          text-align: center;
          color: #a1a1aa;
        }

        .camera-placeholder svg {
          margin-bottom: 1rem;
          color: #fbbf24;
        }

        .camera-note {
          font-size: 0.875rem;
          margin: 1rem 0;
          padding: 0.75rem;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 8px;
          color: #60a5fa;
        }

        .or-divider {
          text-align: center;
          color: #a1a1aa;
          margin: 1.5rem 0;
          position: relative;
        }

        .or-divider::before,
        .or-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: rgba(228, 228, 231, 0.2);
        }

        .or-divider::before {
          left: 0;
        }

        .or-divider::after {
          right: 0;
        }

        .manual-entry {
          background: rgba(26, 26, 46, 0.6);
          border: 1px solid rgba(228, 228, 231, 0.1);
          border-radius: 16px;
          padding: 2rem;
        }

        .manual-entry label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #fbbf24;
        }

        .manual-entry input {
          width: 100%;
          background: rgba(228, 228, 231, 0.05);
          border: 1px solid rgba(228, 228, 231, 0.1);
          border-radius: 12px;
          padding: 1rem;
          color: #e4e4e7;
          font-size: 1rem;
          font-family: 'Courier New', monospace;
          margin-bottom: 1rem;
        }

        .manual-entry input:focus {
          outline: none;
          border-color: #fbbf24;
          background: rgba(228, 228, 231, 0.08);
        }

        .hint {
          font-size: 0.875rem;
          color: #a1a1aa;
          margin-top: 0.5rem;
          font-family: 'Courier New', monospace;
        }

        .scan-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          margin-top: 1.5rem;
          font-weight: 600;
        }

        .scan-message.success {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }

        .scan-message.error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .earnings-preview {
          margin-top: 2rem;
          background: rgba(26, 26, 46, 0.6);
          border: 1px solid rgba(228, 228, 231, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .earnings-preview h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: #fbbf24;
        }

        .earnings-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .earnings-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(228, 228, 231, 0.05);
          border-radius: 10px;
        }

        .earnings-item > div {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .earnings-item > div:last-child {
          align-items: flex-end;
        }

        .earnings-item strong {
          font-weight: 700;
        }

        .earnings-item span {
          font-size: 0.875rem;
          color: #a1a1aa;
        }

        /* Earnings Screen */
        .earnings-screen h2 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .pay-week-info {
          color: #a1a1aa;
          margin-bottom: 2rem;
        }

        .total-card {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 20px;
          padding: 2.5rem;
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .total-card span {
          font-size: 1rem;
          color: #a1a1aa;
          display: block;
          margin-bottom: 0.5rem;
        }

        .total-card h1 {
          font-size: 4rem;
          font-weight: 900;
          color: #fbbf24;
        }

        .earnings-breakdown h3 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }

        .breakdown-card {
          background: rgba(26, 26, 46, 0.6);
          border: 1px solid rgba(228, 228, 231, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.2s;
        }

        .breakdown-card:hover {
          border-color: rgba(251, 191, 36, 0.3);
          transform: translateY(-2px);
        }

        .breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .breakdown-header strong {
          font-size: 1.125rem;
        }

        .operation-badge {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
          padding: 0.375rem 0.75rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .breakdown-stats {
          display: flex;
          gap: 2rem;
        }

        .breakdown-stats > div {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .breakdown-stats span {
          font-size: 0.875rem;
          color: #a1a1aa;
        }

        .breakdown-stats strong {
          font-size: 1.5rem;
          font-weight: 800;
        }

        .empty-state {
          text-align: center;
          color: #a1a1aa;
          padding: 3rem;
          font-style: italic;
        }

        /* History Screen */
        .history-screen h2 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 2rem;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .history-card {
          background: rgba(26, 26, 46, 0.6);
          border: 1px solid rgba(228, 228, 231, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.2s;
        }

        .history-card:hover {
          border-color: rgba(251, 191, 36, 0.3);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .week-label {
          font-weight: 700;
          color: #fbbf24;
        }

        .week-dates {
          font-size: 0.875rem;
          color: #a1a1aa;
        }

        .history-stats {
          display: flex;
          gap: 3rem;
        }

        .history-stats > div {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .history-stats span {
          font-size: 0.875rem;
          color: #a1a1aa;
        }

        .history-stats strong {
          font-size: 1.75rem;
          font-weight: 800;
        }

        /* Admin Dashboard */
        .admin-dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-nav {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .admin-nav button {
          background: rgba(26, 26, 46, 0.6);
          border: 1px solid rgba(228, 228, 231, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          color: #e4e4e7;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .admin-nav button:hover {
          border-color: rgba(251, 191, 36, 0.3);
          background: rgba(26, 26, 46, 0.8);
        }

        .admin-nav button.active {
          background: rgba(251, 191, 36, 0.15);
          border-color: rgba(251, 191, 36, 0.5);
          color: #fbbf24;
        }

        .admin-section {
          background: rgba(26, 26, 46, 0.6);
          border: 1px solid rgba(228, 228, 231, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(228, 228, 231, 0.05);
          border: 1px solid rgba(228, 228, 231, 0.1);
          border-radius: 10px;
          padding: 0.5rem 1rem;
        }

        .search-box input {
          background: none;
          border: none;
          color: #e4e4e7;
          font-size: 0.95rem;
          width: 250px;
        }

        .search-box input:focus {
          outline: none;
        }

        .data-table {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .data-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          background: rgba(228, 228, 231, 0.05);
          border: 1px solid rgba(228, 228, 231, 0.1);
          border-radius: 10px;
          transition: all 0.2s;
        }

        .data-row:hover {
          background: rgba(228, 228, 231, 0.08);
          border-color: rgba(251, 191, 36, 0.2);
        }

        .data-row.inactive {
          opacity: 0.5;
        }

        .data-main {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .data-main strong {
          font-weight: 700;
        }

        .data-main span {
          font-size: 0.875rem;
          color: #a1a1aa;
        }

        .data-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .role-badge,
        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .role-badge.admin {
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
        }

        .role-badge.employee {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
        }

        .status-badge.active {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .status-badge.inactive {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .rate-amount {
          font-size: 1.25rem;
          font-weight: 800;
          color: #fbbf24;
        }

        .scan-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .scan-info {
          width: 100%;
        }

        .scan-primary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .scan-time {
          font-size: 0.875rem;
          color: #a1a1aa;
        }

        .scan-details {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          font-size: 0.875rem;
          color: #a1a1aa;
        }

        .scan-earnings {
          font-size: 1.25rem;
          font-weight: 800;
          color: #fbbf24;
        }

        .payroll-info {
          padding: 2rem;
          text-align: center;
          color: #a1a1aa;
        }

        .payroll-info p {
          margin: 0.5rem 0;
        }

        /* Responsive */
        .desktop-only {
          display: flex;
        }

        .mobile-only {
          display: none;
        }

        @media (max-width: 768px) {
          .desktop-only {
            display: none;
          }

          .mobile-only {
            display: flex;
          }

          .main-content {
            padding: 1.5rem 1rem;
          }

          .login-card {
            padding: 2rem;
          }

          .total-card h1 {
            font-size: 3rem;
          }

          .breakdown-grid {
            grid-template-columns: 1fr;
          }

          .admin-nav {
            grid-template-columns: 1fr;
          }

          .scan-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .weekly-total {
            width: 100%;
          }

          .search-box {
            width: 100%;
          }

          .search-box input {
            width: 100%;
          }
        }

        /* Animations */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PieceRateTracker;
