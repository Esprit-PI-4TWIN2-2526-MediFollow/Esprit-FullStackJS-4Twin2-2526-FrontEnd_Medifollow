import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const allowedRoles = route.data['roles'] as string[];

    if (user && allowedRoles.includes(user.role)) return true;

    this.router.navigate(['/unauthorized']);
    return false;
  }
}
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
