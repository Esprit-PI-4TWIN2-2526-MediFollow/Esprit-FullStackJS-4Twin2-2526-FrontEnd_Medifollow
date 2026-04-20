import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification';

@Component({
  selector: 'app-notifications-page',
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss']
})
export class NotificationsPageComponent implements OnInit {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  loading = true;
  activeFilter: 'all' | 'unread' | 'symptom' | 'consultation' | 'questionnaire' | 'prescription' | 'upcoming-consultation' | 'appointment' = 'all';
  doctorId: string | null = null;
  userRole: string | null = null;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    // Get user object from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.doctorId = user._id || user.id;
        this.userRole = user.role?.name || user.role;
        console.log('👤 Notifications page - User ID:', this.doctorId);
        console.log('🎭 User Role:', this.userRole);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
    
    if (this.doctorId) {
      this.loadNotifications();
    } else {
      console.warn('No user ID found, cannot load notifications');
      this.loading = false;
    }
  }

  loadNotifications() {
    this.loading = true;
    
    if (this.doctorId) {
      this.notificationService.getAll(this.doctorId, 200).subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.applyFilter();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.loading = false;
        }
      });
    }
  }

  applyFilter() {
    if (this.activeFilter === 'all') {
      this.filteredNotifications = this.notifications;
    } else if (this.activeFilter === 'unread') {
      this.filteredNotifications = this.notifications.filter(n => !n.isRead);
    } else {
      this.filteredNotifications = this.notifications.filter(n => n.type === this.activeFilter);
    }
  }

  setFilter(filter: typeof this.activeFilter) {
    this.activeFilter = filter;
    this.applyFilter();
  }

  handleNotificationClick(notification: Notification) {
    this.notificationService.markAsRead(notification._id).subscribe(() => {
      if (this.doctorId) {
        this.notificationService.updateUnreadCount(this.doctorId);
      }
      
      if (notification.actionUrl) {
        this.router.navigate([notification.actionUrl]);
      }
    });
  }

  markAllAsRead() {
    if (this.doctorId) {
      this.notificationService.markAllAsRead(this.doctorId).subscribe(() => {
        this.loadNotifications();
        this.notificationService.updateUnreadCount(this.doctorId!);
      });
    }
  }

  getIcon(type: string): string {
    return this.notificationService.getIcon(type);
  }

  getPriorityColor(priority: string): string {
    return this.notificationService.getPriorityColor(priority);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return notificationDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  getTypeCount(type: string): number {
    return this.notifications.filter(n => n.type === type).length;
  }

  isDoctor(): boolean {
    return this.userRole === 'DOCTOR' || this.userRole === 'doctor';
  }

  isPatient(): boolean {
    return this.userRole === 'PATIENT' || this.userRole === 'patient';
  }
}
