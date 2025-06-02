const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const si = require('systeminformation');
const fs = require('fs').promises;
const Store = require('electron-store');

// Initialize electron store for settings
const store = new Store();

let mainWindow;

function createWindow() {
  // Request admin privileges
  if (!app.isPackaged) {
    app.commandLine.appendSwitch('no-sandbox');
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'src/preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.ico')
  });

  // Set development mode based on environment
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // Wait for the dev server to be ready
    const loadURL = async () => {
      try {
        await mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
      } catch (error) {
        console.error('Failed to load development URL:', error);
        // Retry after 1 second
        setTimeout(loadURL, 1000);
      }
    };
    loadURL();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, 'src/dist/index.html'));
  }

  // Log any errors that occur during page load
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure app is ready before creating window
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Get system information
async function getSystemInfo() {
  try {
    const { stdout } = await execAsync('systeminfo | findstr /B /C:"OS Name" /C:"OS Version"');
    const lines = stdout.split('\n');
    const osInfo = {
      os: lines[0].split(':')[1].trim(),
      version: lines[1].split(':')[1].trim(),
      architecture: process.arch
    };
    return osInfo;
  } catch (error) {
    console.error('Error getting system info:', error);
    return {
      os: 'Windows',
      version: 'Unknown',
      architecture: process.arch
    };
  }
}

// Analyze error message severity using local rules
function analyzeErrorSeverity(errorMessage) {
  if (!errorMessage || typeof errorMessage !== 'string') {
    return 'INFO';
  }

  const criticalKeywords = [
    'crash', 'fatal', 'critical', 'blue screen', 'bsod', 'system failure',
    'corrupt', 'corrupted', 'unrecoverable', 'severe', 'serious',
    'error', 'failed', 'failure', 'not working', 'broken'
  ];
  
  const warningKeywords = [
    'warning', 'caution', 'notice', 'minor', 'slight', 'potential',
    'might', 'could', 'possible', 'recommended', 'suggest',
    'consider', 'attention', 'note'
  ];

  const lowerError = errorMessage.toLowerCase();
  
  if (criticalKeywords.some(keyword => lowerError.includes(keyword))) {
    return 'CRITICAL';
  } else if (warningKeywords.some(keyword => lowerError.includes(keyword))) {
    return 'WARNING';
  }
  
  return 'INFO';
}

// Scan installed drivers
async function scanDrivers() {
  try {
    // Use a simpler PowerShell command first to test
    const command = `
      $ErrorActionPreference = 'Stop'
      try {
        $drivers = Get-WmiObject Win32_PnPSignedDriver | 
          Where-Object { $_.DeviceName -ne $null } |
          Select-Object DeviceName, DriverVersion, Manufacturer, InstallDate, DeviceID |
          ConvertTo-Json -AsArray

        if ($null -eq $drivers) {
          Write-Error "No drivers found"
          exit 1
        }
        Write-Output $drivers
      } catch {
        Write-Error $_.Exception.Message
        exit 1
      }
    `;

    console.log('Executing PowerShell command...');
    
    // First, test if PowerShell is accessible
    try {
      await execAsync('powershell -Command "Get-Command"');
    } catch (error) {
      console.error('PowerShell test failed:', error);
      throw new Error('PowerShell is not accessible. Please ensure PowerShell is installed and accessible.');
    }

    // Run the actual command
    const { stdout, stderr } = await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${command}"`);
    
    if (stderr) {
      console.error('PowerShell error:', stderr);
      throw new Error(`PowerShell error: ${stderr}`);
    }

    if (!stdout || stdout.trim() === '') {
      console.error('No output from PowerShell command');
      throw new Error('No driver data received from PowerShell');
    }

    console.log('PowerShell output received:', stdout.substring(0, 100) + '...');

    let drivers = [];
    try {
      // Parse the JSON output
      const parsedData = JSON.parse(stdout);
      drivers = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      if (drivers.length === 0) {
        throw new Error('No drivers found in the system');
      }

      console.log(`Successfully parsed ${drivers.length} drivers`);
    } catch (parseError) {
      console.error('Error parsing driver data:', parseError);
      console.error('Raw output:', stdout);
      throw new Error('Failed to parse driver data: ' + parseError.message);
    }
    
    // Process and format driver data with null checks
    const processedDrivers = drivers.map((driver, index) => {
      if (!driver || typeof driver !== 'object') {
        console.warn(`Invalid driver data at index ${index}:`, driver);
        return null;
      }

      // Handle null values and format the data
      return {
        id: index + 1,
        name: driver.DeviceName || 'Unknown Device',
        version: driver.DriverVersion || 'Unknown Version',
        manufacturer: driver.Manufacturer || 'Unknown Manufacturer',
        deviceId: driver.DeviceID || '',
        installDate: driver.InstallDate ? new Date(driver.InstallDate).toISOString().split('T')[0] : 'Unknown',
        status: 'scanned'
      };
    }).filter(Boolean); // Remove any null entries

    if (processedDrivers.length === 0) {
      throw new Error('No valid drivers found after processing');
    }

    console.log(`Successfully processed ${processedDrivers.length} drivers`);

    // Save scan results to JSON file
    const scanResults = {
      timestamp: new Date().toISOString(),
      drivers: processedDrivers
    };

    try {
      await fs.writeFile(
        path.join(app.getPath('userData'), 'scan-results.json'),
        JSON.stringify(scanResults, null, 2)
      );
      console.log('Scan results saved successfully');
    } catch (writeError) {
      console.error('Error saving scan results:', writeError);
      // Don't throw here, as the scan was successful
    }

    return processedDrivers;
  } catch (error) {
    console.error('Error scanning drivers:', error);
    throw new Error(`Failed to scan drivers: ${error.message}`);
  }
}

// Rollback driver
async function rollbackDriver(deviceId) {
  try {
    await execAsync(`pnputil /rollback-driver "${deviceId}"`);
    return { success: true, message: 'Driver rolled back successfully' };
  } catch (error) {
    console.error('Error rolling back driver:', error);
    return { success: false, message: error.message };
  }
}

// Get theme preference
function getThemePreference() {
  return store.get('theme', 'light');
}

// Set theme preference
function setThemePreference(theme) {
  store.set('theme', theme);
}

// IPC handlers
ipcMain.handle('get-system-info', async () => {
  return await getSystemInfo();
});

ipcMain.handle('scan-drivers', async () => {
  return await scanDrivers();
});

ipcMain.handle('analyze-error', async (event, errorMessage) => {
  try {
    const severity = analyzeErrorSeverity(errorMessage);
    console.log('Analyzed error message:', { errorMessage, severity });
    return severity;
  } catch (error) {
    console.error('Error analyzing error message:', error);
    return 'INFO';
  }
});

ipcMain.handle('rollback-driver', async (event, deviceId) => {
  return await rollbackDriver(deviceId);
});

ipcMain.handle('get-theme', () => {
  return getThemePreference();
});

ipcMain.handle('set-theme', (event, theme) => {
  setThemePreference(theme);
}); 