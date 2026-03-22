import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // ── Compatibilité : role peut être une string OU un objet {_id, name}
    const roleName: string = this.extractRoleName(user);

    // ── Redirection initiale sur ''
    if (route.data['redirectToRole']) {
      this.router.navigate([this.getHomeRoute(roleName)]);
      return false;
    }

    const allowedRoles: string[] | undefined = route.data['allowedRoles'];

    // Pas de restriction → accessible à tous
    if (!allowedRoles || allowedRoles.length === 0) return true;

    // Comparaison insensible à la casse
    const hasAccess = allowedRoles
      .map(r => r.toUpperCase())
      .includes(roleName.toUpperCase());

    if (!hasAccess) this.router.navigate(['/unauthorized']);
    return hasAccess;
  }

  private extractRoleName(user: any): string {
    if (!user?.role) return '';

    // Cas 1 : role est une string → "SUPERADMIN"
    if (typeof user.role === 'string') return user.role;

    // Cas 2 : role est un objet → { _id: '...', name: 'SUPERADMIN' }
    if (typeof user.role === 'object') return user.role.name ?? '';

    return '';
  }

  private getHomeRoute(roleName: string): string {
    if (!roleName) return '/signin';

    const adminRoles = ['SUPERADMIN', 'ADMIN'];
    if (adminRoles.includes(roleName.toUpperCase())) return '/dashboard';

    return `/${roleName.toLowerCase()}`;
  }
}
