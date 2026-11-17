export interface FlashMessage {
  type?: FlashMessageTypes;
  open: boolean;
  text?: string;
  timeout?: number;
  action?: { label: string, run: () => void };
}

export type FlashMessageTypes = 'success' | 'error' | 'warning' | 'primary' | 'secondary'
