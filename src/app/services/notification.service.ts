import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { Notification } from '../models/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:3000/notifications';
  
  private unreadCount$ = new BehaviorSubject<number>(0);
  private notifications$ = new BehaviorSubject<Notification[]>([]);

  constructor(private http: HttpClient) {
    // Poll for new notifications every 30 seconds
    interval(30000).subscribe(() => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const doctorId = user._id || user.id;
          if (doctorId) {
            this.loadUnreadNotifications(doctorId);
          }
        } catch (error) {
          console.error('Error parsing user for polling:', error);
        }
      }
    });
  }

  getUnread(doctorId: string): Observable<Notification[]> {
    const url = `${this.apiUrl}/doctor/${doctorId}/unread`;
    console.log('🌐 Making GET request to:', url);
    return this.http.get<Notification[]>(url);
  }

  getAll(doctorId: string, limit: number = 100): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/doctor/${doctorId}/all?limit=${limit}`);
  }

  getById(notificationId: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${notificationId}`);
  }

  getUnreadCount(doctorId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/doctor/${doctorId}/count`);
  }

  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAllAsRead(doctorId: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/doctor/${doctorId}/mark-all-read`, {});
  }

  // Observable streams
  getUnreadCountStream(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  getNotificationsStream(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  // Load notifications and update streams
  loadUnreadNotifications(doctorId: string): void {
    console.log('📡 NotificationService.loadUnreadNotifications called for doctor:', doctorId);
    this.getUnread(doctorId).subscribe({
      next: (notifications) => {
        console.log('✅ Notifications received:', notifications);
        this.notifications$.next(notifications);
        this.unreadCount$.next(notifications.length);
        console.log('📊 Updated unread count:', notifications.length);
      },
      error: (error) => {
        console.error('❌ Error loading notifications:', error);
      }
    });
  }

  // Update count after marking as read
  updateUnreadCount(doctorId: string): void {
    this.getUnreadCount(doctorId).subscribe({
      next: (result) => {
        this.unreadCount$.next(result.count);
      },
      error: (error) => {
        console.error('Error updating unread count:', error);
      }
    });
  }

  // Get icon for notification type
  getIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'symptom': '🩺',
      'consultation': '📅',
      'upcoming-consultation': '⏰',
      'appointment': '📅',
      'questionnaire': '📋',
      'prescription': '💊',
    };
    return icons[type] || '🔔';
  }

  // Get priority color
  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'critical': '#ef4444',
      'high': '#f97316',
      'medium': '#eab308',
      'low': '#10b981',
    };
    return colors[priority] || '#6b7280';
  }
}
