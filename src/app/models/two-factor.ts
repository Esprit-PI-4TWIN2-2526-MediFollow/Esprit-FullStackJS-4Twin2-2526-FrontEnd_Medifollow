export interface TwoFactorStatusResponse {
  twoFactorEnabled: boolean;
}

export interface TwoFactorSetupResponse {
  qrCodeDataUrl: string;
  otpauthUrl: string;
  secretBase32: string;
}

export interface TwoFactorEnableDisableRequest {
  code: string;
}

export interface TwoFactorEnableDisableResponse {
  twoFactorEnabled: boolean;
}

