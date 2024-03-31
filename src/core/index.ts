import { BrowserWindow } from 'electron';
import { InternalRouteMetadata, RouteConfig, RoutesConfig } from './interfaces';
import { generateUniqueId } from '../utils';

const routeMetadataMap = new Map<string, InternalRouteMetadata>();
const windowHandlerMap = new Map<string, () => void>();

function invokeHandlerForRoute(path: string): void {
  const handler = windowHandlerMap.get(path);
  if (handler) {
    handler();
  }
}

function handleExternalWindow(
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
  targetWindow.loadURL(`${baseRoute}${routeConfig.path}`);

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
      handleExternalWindow(routeConfig, config.baseRoute)
    );
  });
}
