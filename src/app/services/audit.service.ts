import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | string;

export interface AuditLog {
  timestamp: string | null;
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: string;
  departement: string;
  method: string;
  endpoint: string;
  entity: string;
  changes: unknown;
  raw: unknown;
}

export interface AuditLogQuery {
  page: number;
  limit: number;
  userName?: string;
  departement?: string;
  action?: AuditAction | '';
  entity?: string;
  from?: string;
  to?: string;
}

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditReportQuery {
  userName?: string;
  departement?: string;
  action?: AuditAction | '';
  entity?: string;
  from?: string;
  to?: string;
}

export interface AuditReport {
  total: number;
  countsByAction: Record<string, number>;
  topEntities: Array<{ entity: string; count: number }>;
  raw: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly logsUrl = 'http://localhost:3000/api/audit/logs';

  private readonly reportUrl = 'http://localhost:3000/api/audit/report';

  constructor(private http: HttpClient) {}

  getLogs(query: AuditLogQuery): Observable<AuditLogPage> {
    const params = this.toHttpParams(query);
    return this.http.get<unknown>(this.logsUrl, { params }).pipe(
      map((payload) => this.normalizeLogsPayload(payload, query)),
      catchError((error) => throwError(() => error))
    );
  }

  getReport(query: AuditReportQuery): Observable<AuditReport> {
    const params = this.toHttpParams(query);
    return this.http.get<unknown>(this.reportUrl, { params }).pipe(
      map((payload) => this.normalizeReportPayload(payload)),
      catchError((error) => throwError(() => error))
    );
  }

  private toHttpParams(query: object): HttpParams {
    let params = new HttpParams();
    Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      const serialized = String(value).trim();
      if (!serialized) return;
      params = params.set(key, serialized);
    });
    return params;
  }

  private normalizeLogsPayload(payload: unknown, query: AuditLogQuery): AuditLogPage {
    const source: any = payload ?? {};

    const itemsCandidate =
      source.items ?? source.logs ?? source.data ?? source.results ?? source.rows ?? source;

    const rawItems: any[] = Array.isArray(itemsCandidate) ? itemsCandidate : [];
    const totalCandidate =
      source.total ?? source.count ?? source.totalCount ?? source.pagination?.total ?? rawItems.length;

    const total = this.coerceNumber(totalCandidate) ?? rawItems.length;
    const page = this.coerceNumber(source.page ?? source.pagination?.page) ?? query.page;
    const limit = this.coerceNumber(source.limit ?? source.pagination?.limit) ?? query.limit;

    return {
      items: rawItems.map((row) => this.mapLog(row)),
      total,
      page,
      limit
    };
  }

  private mapLog(row: any): AuditLog {
    const timestamp = this.coerceDateString(row?.timestamp ?? row?.createdAt ?? row?.date ?? row?.time);
    const action = String(row?.action ?? row?.event ?? row?.type ?? '').trim() as AuditAction;
    const user = row?.user ?? row?.actor ?? row?.performedBy ?? null;
    const userName = this.readUserName(row, user);
    const userRole = this.readUserRole(row, user);

    return {
      timestamp,
      action,
      userId: String(row?.userId ?? row?.user ?? row?.actorId ?? row?.actor ?? ''),
      userName,
      userRole,
      departement: String(row?.departement ?? row?.department ?? row?.dept ?? ''),
      method: String(row?.method ?? row?.httpMethod ?? ''),
      endpoint: String(row?.endpoint ?? row?.path ?? row?.url ?? ''),
      entity: String(row?.entity ?? row?.resource ?? row?.model ?? ''),
      changes: row?.changes ?? row?.diff ?? row?.payload ?? row?.metadata ?? null,
      raw: row
    };
  }

  private normalizeReportPayload(payload: unknown): AuditReport {
    const source: any = this.deepUnwrapObject(payload);
    const total = this.coerceNumber(source.total ?? source.count ?? source.totalCount) ?? 0;

    const countsCandidate = this.deepUnwrapObject(
      source.countsByAction
      ?? source.byAction
      ?? source.actions
      ?? source.actionCounts
      ?? source.counts
      ?? source.statistics?.countsByAction
      ?? source.summary?.countsByAction
      ?? {}
    );

    const countsByAction = this.normalizeActionCounts(countsCandidate);

    const topCandidate = this.deepUnwrapObject(
      source.topEntities
      ?? source.entities
      ?? source.top
      ?? source.topEntityCounts
      ?? source.topResources
      ?? source.summary?.topEntities
      ?? source.statistics?.topEntities
      ?? []
    );

    const topEntities = this.normalizeTopEntities(topCandidate);

    return {
      total,
      countsByAction,
      topEntities,
      raw: payload
    };
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  private deepUnwrapObject(payload: unknown): any {
    let current: any = payload ?? {};
    let moved = true;

    while (moved && current && typeof current === 'object' && !Array.isArray(current)) {
      moved = false;
      const next =
        current.data
        ?? current.result
        ?? current.results
        ?? current.report
        ?? current.payload
        ?? current.summary;

      if (next && typeof next === 'object') {
        current = next;
        moved = true;
      }
    }

    return current ?? {};
  }

  private normalizeActionCounts(candidate: unknown): Record<string, number> {
    if (this.isPlainObject(candidate)) {
      return Object.entries(candidate).reduce<Record<string, number>>((accumulator, [key, value]) => {
        const normalizedKey = String(key).trim().toUpperCase();
        const count = this.coerceNumber(value) ?? 0;
        if (normalizedKey) accumulator[normalizedKey] = count;
        return accumulator;
      }, {});
    }

    if (Array.isArray(candidate)) {
      return candidate.reduce<Record<string, number>>((accumulator, row: any) => {
        const action = String(
          row?.action
          ?? row?.name
          ?? row?.key
          ?? row?.label
          ?? row?._id
          ?? ''
        ).trim().toUpperCase();

        const count = this.coerceNumber(row?.count ?? row?.total ?? row?.value ?? row?.n) ?? 0;
        if (action) accumulator[action] = count;
        return accumulator;
      }, {});
    }

    return {};
  }

  private normalizeTopEntities(candidate: unknown): Array<{ entity: string; count: number }> {
    if (Array.isArray(candidate)) {
      return candidate
        .map((row: any) => ({
          entity: String(row?.entity ?? row?.name ?? row?.key ?? row?.label ?? row?._id ?? '').trim(),
          count: this.coerceNumber(row?.count ?? row?.total ?? row?.value ?? row?.n) ?? 0
        }))
        .filter((row) => !!row.entity);
    }

    if (this.isPlainObject(candidate)) {
      return Object.entries(candidate)
        .map(([entity, count]) => ({
          entity: String(entity).trim(),
          count: this.coerceNumber(count) ?? 0
        }))
        .filter((row) => !!row.entity);
    }

    return [];
  }

  private coerceNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private coerceDateString(value: unknown): string | null {
    if (!value) return null;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }

  private readUserName(row: any, user: any): string {
    const direct =
      row?.userName
      ?? row?.user_name
      ?? row?.username
      ?? row?.fullName
      ?? row?.actorName
      ?? row?.performedByName
      ?? user?.name
      ?? user?.fullName
      ?? user?.username;

    if (direct && typeof direct === 'string') {
      return direct.trim();
    }

    const first = String(user?.firstName ?? user?.firstname ?? row?.firstName ?? '').trim();
    const last = String(user?.lastName ?? user?.lastname ?? row?.lastName ?? '').trim();
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;

    const email = user?.email ?? row?.userEmail ?? row?.email ?? '';
    if (typeof email === 'string' && email.trim()) return email.trim();

    return '';
  }

  private readUserRole(row: any, user: any): string {
    const direct =
      row?.userRole
      ?? row?.user_role
      ?? row?.role
      ?? row?.roleName
      ?? row?.role_name
      ?? row?.actorRole
      ?? user?.roleName
      ?? user?.role;

    if (typeof direct === 'string') {
      return direct.trim();
    }

    if (direct && typeof direct === 'object') {
      const name = (direct as any)?.name;
      if (typeof name === 'string') return name.trim();
    }

    const nested = user?.role?.name ?? user?.role?.label ?? row?.user?.role?.name;
    if (typeof nested === 'string') return nested.trim();

    return '';
  }
}
