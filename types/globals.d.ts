import { IpcRenderer } from 'electron';

declare global {
  interface Window {
    electroPathApi: {
      setGlobalListener: () => void;
      sendMessage: (channel: string, data?: any) => void;
    };
  }
}
