import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  WebContents,
} from 'electron';

export interface RouteConfig {
  path: string;
  newWindow: boolean;
  multipleWindows?: boolean;
  browserWindowOptions?: BrowserWindowConstructorOptions;
  configureWebContents?: (webContents: WebContents) => void;
}

export interface InternalRouteMetadata {
  id: string;
  isActive: boolean;
  window?: BrowserWindow;
}

export interface RoutesConfig {
  baseRoute: string;
  routes: RouteConfig[];
}
