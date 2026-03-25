// // import { Injectable } from '@angular/core';
// // import { CanActivate, Router } from '@angular/router';

// // @Injectable({ providedIn: 'root' })
// // export class AuthGuard implements CanActivate {
// //   constructor(private router: Router) {}

// //   canActivate(): boolean {
// //     const token = localStorage.getItem('accessToken');
// //     if (token) return true;
// //     this.router.navigate(['/signin']);
// //     return false;
// //   }
// // }
// // auth.guard.ts
// import { Injectable } from '@angular/core';
// import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

// @Injectable({ providedIn: 'root' })
// export class AuthGuard implements CanActivate {
//   constructor(private router: Router) {}

//   private readonly ROLE_HOME: Record<string, string> = {
//     SUPERADMIN: '/dashboard',
//     ADMIN: '/dashboard',
//     AUDITOR: '/auditor/dashboard',
//     COORDINATOR: '/coordinator/dashboard',
//     NURSE: '/nurse/dashboard',
//     PATIENT: '/patient/dashboard',
//     DOCTOR: '/physician/dashboard',
//   };

//   canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
//     const token = localStorage.getItem('accessToken');

//     if (!token) {
//       this.router.navigate(['/signin']);
//       return false;
//     }

//     // Si l'utilisateur va vers '' ou '/dashboard' → rediriger vers son vrai dashboard

//     const user = JSON.parse(localStorage.getItem('user') || '{}');
//     const role = this.extractRole(user).toUpperCase();
//     const targetPath = state.url;

//     const isDefaultRedirect = targetPath === '/' || targetPath === '/dashboard';

//     if (isDefaultRedirect) {
//       const home = this.ROLE_HOME[role] ?? '/dashboard';
//       if (home !== '/dashboard') {
//         this.router.navigate([home]);
//         return false;
//       }
//     }

//     return true;
//   }

//   private extractRole(user: any): string {
//     if (!user?.role) return '';
//     if (typeof user.role === 'string') return user.role;
//     return user.role?.name ?? '';
//   }
// }
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  private readonly ROLE_HOME: Record<string, string> = {
    SUPERADMIN: '/dashboard',
    ADMIN: '/dashboard',
    AUDITOR: '/auditor/dashboard',
    COORDINATOR: '/coordinator/dashboard',
    NURSE: '/nurse/dashboard',
    PATIENT: '/patient/dashboard',
    DOCTOR: '/doctor/dashboard',
  };

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      this.router.navigate(['/signin']);
      return false;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = this.extractRole(user).toUpperCase();
    const targetPath = state.url.split('?')[0];

    if (targetPath === '/' || targetPath === '') {
      const home = this.ROLE_HOME[role] ?? '/dashboard';
      this.router.navigate([home]);
      return false;
    }
    if (targetPath === '/dashboard') {
      const home = this.ROLE_HOME[role] ?? '/dashboard';
      if (home !== '/dashboard') {
        this.router.navigate([home]);
        return false;
      }
    }

    return true;
  }

  private extractRole(user: any): string {
    if (!user?.role) return '';
    if (typeof user.role === 'string') return user.role;
    return user.role?.name ?? '';
  }
}
