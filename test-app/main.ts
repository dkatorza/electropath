import { app, BrowserWindow, WebContents } from 'electron';
import path from 'path';
import { configureRoutes } from '../src/core';

const routingConfig = {
  baseRoute: './test-app/index.html',
  routes: [
    {
      path: '/dashboard',
      newWindow: true,
      multipleWindows: false,
      browserWindowOptions: {
        width: 800,
        height: 600,
      },
      configureWebContents: (webContents: WebContents) => {
        webContents.on('did-finish-load', () => {
          console.log('Dashboard loaded');
        });
      },
    },
    { path: '/notifications', newWindow: true, multipleWindows: true },
  ],
};

configureRoutes(routingConfig);

function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(createWindow);
