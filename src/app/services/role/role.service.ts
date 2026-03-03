import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
  name?: string;
  label?: string;
  key?: string;
  slug?: string;
};

type RoleApiResponse = RoleApiItem[] | { data?: RoleApiItem[] };

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly rolesApiUrl = 'http://localhost:3000/api/roles';

  constructor(private http: HttpClient) { }

  getAllRoles(): Observable<RoleApiItem[]> {
    return this.http.get<RoleApiResponse>(this.rolesApiUrl).pipe(
      map((response) => this.extractApiRoles(response))
    );
  }

  getAllRolesForCarousel(): Observable<CarouselRole[]> {
    return this.getAllRoles().pipe(
      map((roles) => roles.map((item) => this.mapApiItemToCarouselRole(item)))
    );
  }

  createRole(name: string): Observable<CarouselRole> {
    return this.http.post<{ data?: RoleApiItem }>(this.rolesApiUrl, { name }).pipe(
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
    return Array.isArray(response) ? response : (response.data || []);
  }

  private mapApiItemToCarouselRole(item?: RoleApiItem, fallbackName = ''): CarouselRole {
    const label = (item?.name || item?.label || fallbackName).trim();
    return {
      id: item?._id || item?.id || undefined,
      key: this.getStableRoleKey(label, item),
      label,
      imageKey: this.resolveImageKey(label),
    };
  }

}
