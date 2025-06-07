const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of valid IPC channels
const validChannels = [
  'get-system-info',
  'scan-drivers',
  'analyze-error',
  'rollback-driver',
  'get-theme',
  'set-theme',
  'error-occurred'
];

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    invoke: (channel, ...args) => {
      if (!validChannels.includes(channel)) {
        throw new Error(`Unauthorized IPC channel: ${channel}`);
      }

      try {
        return ipcRenderer.invoke(channel, ...args);
      } catch (error) {
        console.error(`Error in IPC channel ${channel}:`, error);
        throw error;
      }
    }
  }
); 