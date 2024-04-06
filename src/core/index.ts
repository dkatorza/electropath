import { BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { InternalRouteMetadata, RouteConfig, RoutesConfig } from './interfaces';
import { generateUniqueId } from '../utils';

const routeMetadataMap = new Map<string, InternalRouteMetadata>();
const windowHandlerMap = new Map<string, () => void>();
const MSG_PREFIX = '#electropather_';
const WINDOW_LISTENER = `
document.addEventListener('click', (event) => {
  let target;
  if (event.target instanceof Element) {
    target = event.target?.closest('a[target="_blank"]');
  }

  if (target) {
    event.preventDefault();
    const href = target.getAttribute('href') || '';
    const isExternal = /^(https?:|mailto:|ftp:)/.test(href);
   
    if (window?.electroPatherApi?.sendMessage) {
      const messageType = isExternal ? 'open-external-link' : 'open-new-window'
      window.electroPatherApi.sendMessage('${MSG_PREFIX}' + messageType, href);
    }
  }
})
`;

function invokeHandlerForRoute(path: string): void {
  const handler = windowHandlerMap.get(path);

  if (handler) {
    handler();
  }
}

export function electroPatherListener(): void {
  ipcMain.on(`${MSG_PREFIX}open-new-window`, (event, path) => {
    invokeHandlerForRoute(path);
  });

  ipcMain.on(`${MSG_PREFIX}_open-external-link`, (event, path) => {
    shell.openExternal(path);
  });
}

function handleNewWindowRequest(
  routeConfig: RouteConfig,
  baseRoute: string
): void {
  const metadata = routeMetadataMap.get(routeConfig.path);
  if (!metadata) return;

  let targetWindow = metadata.window;

  if (
    targetWindow &&
    !targetWindow.isDestroyed() &&
    !routeConfig.multipleWindows
  ) {
    targetWindow.show();
    return;
  }

  targetWindow = new BrowserWindow(routeConfig.browserWindowOptions || {});

  let urlPath = `file://${path.join(__dirname, baseRoute)}`;
  if (routeConfig.path) {
    urlPath += `#${routeConfig.path}`;
  }
  targetWindow.loadURL(urlPath);

  targetWindow.webContents.on('did-finish-load', () => {
    targetWindow?.webContents.executeJavaScript(WINDOW_LISTENER);
  });

  if (routeConfig.configureWebContents) {
    routeConfig.configureWebContents(targetWindow.webContents);
  }

  routeMetadataMap.set(routeConfig.path, {
    ...metadata,
    isActive: true,
    window: targetWindow,
  });

  targetWindow.on('closed', () => {
    routeMetadataMap.set(routeConfig.path, {
      ...metadata,
      isActive: false,
      window: undefined,
    });
  });
}

/**
 * Configures routing for the application, specifying how routes should be opened in windows.
 * This setup includes options to open routes in new windows and to control whether
 * multiple instances of those windows are allowed.
 *
 * @param {BrowserWindow} mainAppWindow - The main Electron BrowserWindow instance of the application.
 *        This window is used to set up a global listener for route changes.
 * @param {RoutesConfig} config - The configuration object for routing, containing:
 *   - `baseRoute`: The base URL of the application.
 *   - `routes`: An array detailing the behavior of specific routes. Each route object can include:
 *     - `path`: The URL path for the route.
 *     - `newWindow`: A flag indicating if the route should open in a new window.
 *     - `multipleWindows` (optional): A flag that, when set to true, allows multiple windows for the same route.
 *       If set to false, an existing window for the route will be reused. Defaults to false if not provided.
 *     - `browserWindowOptions` (optional): An object specifying options for the BrowserWindow constructor, allowing
 *       customization of the new window's appearance, behavior, etc.
 *     - `configureWebContents` (optional): A function that receives the `webContents` of the new window as a parameter,
 *       allowing for custom configuration (e.g., event listeners, preload scripts) before the window is displayed.
 *
 * ### Example Usage
 *
 * ```typescript
 * import { configureRoutes } from '@electropather';
 *
 * const mainAppWindow = new BrowserWindow({  BrowserWindow options  })
 * const routingConfig: RoutesConfig = {
 *   baseRoute: 'https://yourapp.com',
 *   routes: [
 *     {
 *       path: '/dashboard',
 *       newWindow: true,
 *       multipleWindows: false,
 *       browserWindowOptions: {
 *         width: 800,
 *         height: 600,
 *         // additional BrowserWindow options...
 *       },
 *       configureWebContents: (webContents) => {
 *         webContents.on('did-finish-load', () => {
 *           console.log('Dashboard loaded');
 *           // additional webContents configuration...
 *         });
 *       },
 *     },
 *     // other routes...
 *   ],
 * };
 *
 * configureRoutes(mainAppWindow,routingConfig);
 * ```
 */
export function configureRoutes(
  mainAppWindow: BrowserWindow,
  config: RoutesConfig
): void {
  mainAppWindow.webContents.on('did-finish-load', () => {
    mainAppWindow?.webContents.executeJavaScript(WINDOW_LISTENER);
  });
  config.routes.forEach((routeConfig: RouteConfig) => {
    const id = generateUniqueId(routeConfig.path);

    routeMetadataMap.set(routeConfig.path, {
      id,
      isActive: false,
    });

    windowHandlerMap.set(routeConfig.path, () =>
      handleNewWindowRequest(routeConfig, config.baseRoute)
    );
  });
}
