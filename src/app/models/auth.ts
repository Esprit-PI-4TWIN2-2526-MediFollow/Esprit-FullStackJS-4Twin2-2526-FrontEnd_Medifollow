import { Users } from './users';

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInSuccessResponse {
  accessToken: string;
  user: Users;
}

export interface FirstLoginRequiredResponse {
  requiresPasswordChange: true;
  onboardingToken: string;
  message: string;
}

export interface TwoFactorRequiredResponse {
  requiresTwoFactor: true;
  twoFactorToken: string;
}

export type SignInResponse =
  | SignInSuccessResponse
  | FirstLoginRequiredResponse
  | TwoFactorRequiredResponse;

export interface FirstLoginChangePasswordRequest {
  onboardingToken: string;
  newPassword: string;
}

export interface FirstLoginChangePasswordResponse {
  message: string;
  accessToken: string;
  user: Users;
}
