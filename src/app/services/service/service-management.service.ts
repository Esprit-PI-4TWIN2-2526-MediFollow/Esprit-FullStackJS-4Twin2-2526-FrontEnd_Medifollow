import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Horaire {
  jour: string;
  ouverture: string;
  fermeture: string;
}

export interface Service {
  _id?: string;
  nom: string;
  description: string;
  localisation: string;
  type: string;
  telephone: string;
  email: string;
  capacite: number;
  statut: 'ACTIF' | 'INACTIF';
  tempsAttenteMoyen: number;
  estUrgence: boolean;
  horaires: Horaire[];
  responsableId: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceManagementService {
  private readonly apiUrl = 'http://localhost:3000/services';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Service[]> {
    return this.http.get<Service[]>(this.apiUrl);
  }

  getOne(id: string): Observable<Service> {
    return this.http.get<Service>(`${this.apiUrl}/${id}`);
  }

  create(service: Omit<Service, '_id' | 'createdAt' | 'updatedAt'>): Observable<Service> {
    return this.http.post<Service>(this.apiUrl, service);
  }

  update(id: string, service: Partial<Service>): Observable<Service> {
    return this.http.put<Service>(`${this.apiUrl}/${id}`, service);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activate(id: string): Observable<Service> {
    return this.http.put<Service>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivate(id: string): Observable<Service> {
    return this.http.put<Service>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
