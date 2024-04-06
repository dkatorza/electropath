import { BrowserWindow } from 'electron';
import * as path from 'path';
import { InternalRouteMetadata, RouteConfig, RoutesConfig } from './interfaces';
import { generateUniqueId } from '../utils';

const routeMetadataMap = new Map<string, InternalRouteMetadata>();
const windowHandlerMap = new Map<string, () => void>();

const WINDOW_LISTENER = `
document.addEventListener('click', (event) => {
  console.log('HERE THE CLICK', event);
  let target;
  if (event.target instanceof Element) {
    target = event.target?.closest('a[target="_blank"]');
  }

  if (target) {
    event.preventDefault();
    const href = target.getAttribute('href') || '';

    const isExternal = /^(https?:|mailto:|ftp:)/.test(href);

    if (window.electroPathApi && window.electroPathApi.sendMessage) {
      if (isExternal) {
        window.electroPathApi.sendMessage('open-external-link', href);
      } else {
        window.electroPathApi.sendMessage('open-new-window', href);
      }
    }
  }
})
`;

export function invokeHandlerForRoute(path: string): void {
  const handler = windowHandlerMap.get(path);
  console.log('handler', windowHandlerMap);
  if (handler) {
    handler();
  }
}

function handleNewWindowRequest(
  routeConfig: RouteConfig,
  baseRoute: string
): void {
  const metadata = routeMetadataMap.get(routeConfig.path);
  console.log('routeConfig', routeConfig);
  console.log('baseRoute', baseRoute);
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
    targetWindow?.webContents.executeJavaScriptInIsolatedWorld(
      targetWindow.id,
      [{ code: WINDOW_LISTENER }]
    );
  });

  console.log('targetWindow-ID', targetWindow.id);
  console.log('typeof targetWindow-ID', typeof targetWindow.id);

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
 * import { configureRoutes } from '@yourlibrary';
 *
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
 * configureRoutes(routingConfig);
 * ```
 */
export function configureRoutes(config: RoutesConfig): void {
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

export function setGlobalListener() {
  document.addEventListener('click', (event) => {
    console.log('HERE THE CLICK', event);
    let target;
    if (event.target instanceof Element) {
      target = event.target?.closest('a[target="_blank"]');
    }

    if (target) {
      event.preventDefault();
      const href = target.getAttribute('href') || '';

      const isExternal = /^(https?:|mailto:|ftp:)/.test(href);

      if (window.electroPathApi && window.electroPathApi.sendMessage) {
        if (isExternal) {
          window.electroPathApi.sendMessage('open-external-link', href);
        } else {
          window.electroPathApi.sendMessage('open-new-window', href);
        }
      }
    }
  });
}
