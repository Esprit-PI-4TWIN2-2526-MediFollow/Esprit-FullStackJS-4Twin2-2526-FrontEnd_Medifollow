import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router) { }

  // Exceptions : rôles dont le nom de route diffère du nom du rôle
  private readonly ROUTE_EXCEPTIONS: Record<string, string> = {
    DOCTOR: '/physician/dashboard',
  };

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleName: string = this.extractRoleName(user);

    if (route.data['redirectToRole']) {
      this.router.navigate([this.getHomeRoute(roleName)]);
      return false;
    }

    const allowedRoles: string[] | undefined = route.data['allowedRoles'];

    if (!allowedRoles || allowedRoles.length === 0) return true;

    const hasAccess = allowedRoles
      .map(r => r.toUpperCase())
      .includes(roleName.toUpperCase());

    // if (!hasAccess) this.router.navigate(['/unauthorized']);
    if (!hasAccess) this.router.navigate([this.getHomeRoute(roleName)]);

    return hasAccess;
  }

  private extractRoleName(user: any): string {
    if (!user?.role) return '';
    if (typeof user.role === 'string') return user.role;
    if (typeof user.role === 'object') return user.role.name ?? '';
    return '';
  }

  private getHomeRoute(roleName: string): string {
    if (!roleName) return '/signin';

    const normalized = roleName.toUpperCase();

    // Vérifier les exceptions d'abord
    if (this.ROUTE_EXCEPTIONS[normalized]) {
      return this.ROUTE_EXCEPTIONS[normalized];
    }

    // // Admins → dashboard partagé
    // if (['SUPERADMIN', 'ADMIN'].includes(normalized)) {
    //   return '/dashboard';
    // }

    // Convention générale : /<roleName_lowercase>/dashboard
    // Ex: NURSE → /nurse/dashboard, AUDITOR → /auditor/dashboard
    return `/${roleName.toLowerCase()}/dashboard`;
  }
}
