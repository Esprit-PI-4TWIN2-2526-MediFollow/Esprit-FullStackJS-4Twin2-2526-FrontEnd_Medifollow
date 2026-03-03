import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';

export type CarouselRole = {
  id?: string;
  key: string;
  label: string;
  imageKey?: string;
  isOther?: boolean;
};

export type RoleApiItem = {
  _id?: string;
  id?: string;
  roleId?: string;
  name?: string;
  label?: string;
  title?: string;
  role?: string;
  key?: string;
  slug?: string;
};

type RoleApiResponse =
  | RoleApiItem[]
  | {
      data?: RoleApiItem[] | { roles?: RoleApiItem[]; items?: RoleApiItem[] };
      roles?: RoleApiItem[];
      items?: RoleApiItem[];
      result?: RoleApiItem[];
    };

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly rolesApiUrl = 'http://localhost:3000/api/roles';
  private readonly legacyApiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getAllRoles(): Observable<RoleApiItem[]> {
    return this.http.get<RoleApiResponse>(this.rolesApiUrl).pipe(
      map((response) => this.extractApiRoles(response)),
      switchMap((roles) => {
        if (roles.length > 0) return of(roles);
        return this.http.get<RoleApiResponse>(this.legacyApiUrl).pipe(
          map((legacyResponse) => this.extractApiRoles(legacyResponse))
        );
      }),
      catchError(() =>
        this.http.get<RoleApiResponse>(this.legacyApiUrl).pipe(
          map((legacyResponse) => this.extractApiRoles(legacyResponse))
        )
      )
    );
  }

  getAllRolesForCarousel(): Observable<CarouselRole[]> {
    return this.getAllRoles().pipe(
      map((roles) => roles.map((item) => this.mapApiItemToCarouselRole(item)))
    );
  }



  createRole(name: string): Observable<CarouselRole> {
    return this.http.post<{ data?: RoleApiItem }>(`${this.rolesApiUrl}/add`, { name }).pipe(
      map((response) => this.mapApiItemToCarouselRole(response?.data, name))
    );
  }

  updateRole(id: string, name: string): Observable<CarouselRole> {
    return this.http.put<{ data?: RoleApiItem }>(`${this.rolesApiUrl}/${id}`, { name }).pipe(
      map((response) => this.mapApiItemToCarouselRole(response?.data, name))
    );
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.rolesApiUrl}/${id}`);
  }

  getRoleImageSrc(role: CarouselRole): string {
    return `/images/roles/${role.imageKey || this.resolveImageKey(role.label)}.svg`;
  }

  resolveImageKey(name: string): string {
    const n = this.normalizeRoleKey(name);
    if (n.includes('doctor')) return 'doctor';
    if (n.includes('nurse')) return 'nurse';
    if (n.includes('audit')) return 'auditor';
    if (n.includes('coord')) return 'coordinator';
    if (n.includes('patient')) return 'patient';
    return 'admin';
  }

  normalizeRoleKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'role';
  }

  getStableRoleKey(name: string, item?: RoleApiItem): string {
    const apiKey = String(item?.key || item?.slug || '').trim();
    if (apiKey) return this.normalizeRoleKey(apiKey);
    return this.normalizeRoleKey(name);
  }

  private extractApiRoles(response: RoleApiResponse | null | undefined): RoleApiItem[] {
    if (!response) return [];

    if (Array.isArray(response)) return response;

    if (Array.isArray(response.roles)) return response.roles;
    if (Array.isArray(response.items)) return response.items;
    if (Array.isArray(response.result)) return response.result;

    const data = response.data;
    if (Array.isArray(data)) return data;

    if (data && typeof data === 'object') {
      if (Array.isArray(data.roles)) return data.roles;
      if (Array.isArray(data.items)) return data.items;
    }

    return [];
  }

  private mapApiItemToCarouselRole(item?: RoleApiItem, fallbackName = ''): CarouselRole {
    const label = String(item?.name || item?.label || item?.title || item?.role || fallbackName).trim();
    return {
      id: item?._id || item?.id || item?.roleId || undefined,
      key: this.getStableRoleKey(label, item),
      label,
      imageKey: this.resolveImageKey(label),
    };
  }

}
