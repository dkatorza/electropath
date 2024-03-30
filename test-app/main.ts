import { app, BrowserWindow } from 'electron';
import path from 'path';

function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Correct path to index.html
  mainWindow.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(createWindow);
