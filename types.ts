
export interface PatchRule {
  old: string;
  newVal: string;
}

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

export enum ConversionType {
  TO_SIMPLIFIED = 'TO_SIMPLIFIED',
  TO_TRADITIONAL = 'TO_TRADITIONAL'
}

export interface SiteConfig {
  siteName: string;
  subtitle: string;
  customIcon: string | null;
  clickSound: string | null;
  gasUrl: string | null;
}
