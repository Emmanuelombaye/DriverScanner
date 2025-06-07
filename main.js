import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import { promises as fs } from 'fs';
import Store from 'electron-store';
import { pipeline } from '@xenova/transformers';
import { fileURLToPath } from 'url';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize electron store for settings
const store = new Store();

// Initialize the error analysis model
let errorAnalysisModel = null;

// Global error handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Optionally show a dialog to the user
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('error-occurred', {
      message: 'An unexpected error occurred',
      details: error.message
    });
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('error-occurred', {
      message: 'An unexpected error occurred',
      details: reason.message || reason
    });
  }
});

// Load the error analysis model
async function loadErrorAnalysisModel() {
  try {
    if (!errorAnalysisModel) {
      console.log('Loading error analysis model...');
      errorAnalysisModel = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
      console.log('Error analysis model loaded successfully');
    }
    return errorAnalysisModel;
  } catch (error) {
    console.error('Error loading model:', error);
    throw error;
  }
}

// Preprocess error message for analysis
function preprocessErrorMessage(errorMessage) {
  if (!errorMessage || typeof errorMessage !== 'string') {
    return '';
  }
  
  // Convert to lowercase and remove special characters
  return errorMessage.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Analyze error message using DistilBERT
async function analyzeErrorWithModel(errorMessage) {
  try {
    const model = await loadErrorAnalysisModel();
    const preprocessedMessage = preprocessErrorMessage(errorMessage);
    
    if (!preprocessedMessage) {
      return { severity: 'INFO', confidence: 1.0 };
    }

    // Get model prediction
    const result = await model(preprocessedMessage);
    
    // Map model output to severity levels
    // The model outputs a score between 0 and 1, where higher values indicate more negative sentiment
    const score = result[0].score;
    
    let severity;
    if (score > 0.8) {
      severity = 'CRITICAL';
    } else if (score > 0.5) {
      severity = 'WARNING';
    } else {
      severity = 'INFO';
    }

    return {
      severity,
      confidence: score,
      details: {
        originalMessage: errorMessage,
        preprocessedMessage,
        modelOutput: result
      }
    };
  } catch (error) {
    console.error('Error analyzing message with model:', error);
    return {
      severity: 'INFO',
      confidence: 0,
      error: error.message
    };
  }
}

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
    mainWindow.loadFile(path.join(__dirname, 'src/dist/index.html'))
      .catch(error => {
        console.error('Failed to load production file:', error);
        // Show error dialog
        mainWindow.webContents.send('error-occurred', {
          message: 'Failed to load application',
          details: error.message
        });
      });
  }

  // Log any errors that occur during page load
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    mainWindow.webContents.send('error-occurred', {
      message: 'Failed to load page',
      details: errorDescription
    });
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
    console.log('Scanning drivers using systeminformation...');
    
    // Get detailed system information including drivers
    const [system, osInfo] = await Promise.all([
      si.system(),
      si.osInfo()
    ]);

    // Get all USB devices which typically have drivers
    const usbDevices = await si.usb();
    
    // Get all disk drives
    const diskLayout = await si.diskLayout();
    
    // Get all network interfaces
    const networkInterfaces = await si.networkInterfaces();

    // Combine and process all device information
    const drivers = [
      ...usbDevices.map((device, index) => ({
        id: index + 1,
        name: device.name || 'Unknown USB Device',
        version: device.revision || 'Unknown Version',
        manufacturer: device.manufacturer || 'Unknown Manufacturer',
        deviceId: device.id || '',
        installDate: 'Unknown', // systeminformation doesn't provide this
        status: 'scanned',
        type: 'USB'
      })),
      ...diskLayout.map((disk, index) => ({
        id: usbDevices.length + index + 1,
        name: disk.name || 'Unknown Disk',
        version: disk.firmwareRevision || 'Unknown Version',
        manufacturer: disk.manufacturer || 'Unknown Manufacturer',
        deviceId: disk.device || '',
        installDate: 'Unknown',
        status: 'scanned',
        type: 'Disk'
      })),
      ...networkInterfaces.map((nic, index) => ({
        id: usbDevices.length + diskLayout.length + index + 1,
        name: nic.iface || 'Unknown Network Interface',
        version: nic.driver || 'Unknown Version',
        manufacturer: nic.manufacturer || 'Unknown Manufacturer',
        deviceId: nic.mac || '',
        installDate: 'Unknown',
        status: 'scanned',
        type: 'Network'
      }))
    ];

    if (drivers.length === 0) {
      throw new Error('No drivers found in the system');
    }

    console.log(`Successfully scanned ${drivers.length} devices`);

    // Save scan results to JSON file
    const scanResults = {
      timestamp: new Date().toISOString(),
      systemInfo: {
        manufacturer: system.manufacturer,
        model: system.model,
        version: system.version,
        os: osInfo.distro,
        osVersion: osInfo.release
      },
      drivers: drivers
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

    return drivers;
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

// IPC Handlers
ipcMain.handle('get-system-info', async () => {
  try {
    return await getSystemInfo();
  } catch (error) {
    console.error('Error in get-system-info handler:', error);
    throw error;
  }
});

ipcMain.handle('scan-drivers', async () => {
  try {
    return await scanDrivers();
  } catch (error) {
    console.error('Error in scan-drivers handler:', error);
    throw error;
  }
});

ipcMain.handle('analyze-error', async (event, errorMessage) => {
  try {
    const analysis = await analyzeErrorWithModel(errorMessage);
    return analysis.severity;
  } catch (error) {
    console.error('Error in analyze-error handler:', error);
    return 'INFO';
  }
});

ipcMain.handle('rollback-driver', async (event, deviceId) => {
  try {
    return await rollbackDriver(deviceId);
  } catch (error) {
    console.error('Error in rollback-driver handler:', error);
    throw error;
  }
});

ipcMain.handle('get-theme', async () => {
  try {
    return store.get('theme', 'light');
  } catch (error) {
    console.error('Error in get-theme handler:', error);
    return 'light';
  }
});

ipcMain.handle('set-theme', async (event, theme) => {
  try {
    store.set('theme', theme);
    return true;
  } catch (error) {
    console.error('Error in set-theme handler:', error);
    throw error;
  }
}); 