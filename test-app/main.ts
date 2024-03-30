const { app, BrowserWindow } = require('electron');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load the index.html of the app.
  mainWindow.loadFile('test-app/index.html');
}

app.whenReady().then(createWindow);
