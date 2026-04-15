import { environment } from '../../environments/environment';

/**
 * Centralized API configuration
 * All services should use these constants instead of hardcoded URLs
 */
export class ApiConfig {
  static readonly BASE_URL = environment.apiUrl;
  
  // API Endpoints
  static readonly ROLES = `${ApiConfig.BASE_URL}/api/roles`;
  static readonly SYMPTOMS = `${ApiConfig.BASE_URL}/symptoms`;
  static readonly AI = `${ApiConfig.BASE_URL}/ai`;
  static readonly COORDINATOR = `${ApiConfig.BASE_URL}/coordinator`;
  static readonly DASHBOARD = `${ApiConfig.BASE_URL}/dashboard`;
  static readonly SERVICES = `${ApiConfig.BASE_URL}/services`;
  static readonly WEBAUTHN = `${ApiConfig.BASE_URL}/api/webauthn`;
  static readonly QUESTIONNAIRES = `${ApiConfig.BASE_URL}/questionnaires`;
  static readonly FACE_RECOGNITION = `${ApiConfig.BASE_URL}/api/face-recognition`;
  static readonly USERS = `${ApiConfig.BASE_URL}/api`;
  static readonly ALERTS = `${ApiConfig.BASE_URL}/alerts`;
  static readonly AUTH = `${ApiConfig.BASE_URL}/api`;
  static readonly FORGET_PASSWORD = `${ApiConfig.BASE_URL}/users/forgetpassword`;
  
  /**
   * Check if a URL is an API request
   */
  static isApiRequest(url: string): boolean {
    return url.startsWith(ApiConfig.BASE_URL);
  }
}
