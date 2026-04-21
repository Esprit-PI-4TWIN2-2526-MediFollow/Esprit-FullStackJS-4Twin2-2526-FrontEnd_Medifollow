import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { NotificationService } from '../../../services/notification.service';
import { Notification } from '../../../models/notification';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss']
})
export class NotificationDropdownComponent implements OnInit {
  isOpen = false;
  unreadCount$: Observable<number>;
  notifications$: Observable<Notification[]>;
  doctorId: string | null = null;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private elementRef: ElementRef
  ) {
    console.log('🏗️ NotificationDropdownComponent constructor called');
    this.unreadCount$ = this.notificationService.getUnreadCountStream();
    this.notifications$ = this.notificationService.getNotificationsStream();
    console.log('📡 Observables initialized');
  }

  ngOnInit() {
    console.log('🔔 NotificationDropdown ngOnInit called');
    
    // Get user object from localStorage
    const userStr = localStorage.getItem('user');
    console.log('👤 User string from localStorage:', userStr);
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.doctorId = user._id || user.id;
        console.log('👨‍⚕️ Doctor ID extracted:', this.doctorId);
        console.log('👤 Full user object:', user);
      } catch (error) {
        console.error('❌ Error parsing user from localStorage:', error);
      }
    }
    
    console.log('🔑 Access token exists:', !!localStorage.getItem('accessToken'));
    
    if (this.doctorId) {
      // Load initial notifications
      console.log('📡 Calling loadUnreadNotifications for doctor:', this.doctorId);
      this.notificationService.loadUnreadNotifications(this.doctorId);
      console.log('✅ loadUnreadNotifications called');
    } else {
      console.warn('⚠️ No doctor ID found in localStorage');
      console.log('📦 localStorage keys:', Object.keys(localStorage));
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  handleNotificationClick(notification: Notification) {
    // Mark as read
    this.notificationService.markAsRead(notification._id).subscribe(() => {
      if (this.doctorId) {
        this.notificationService.loadUnreadNotifications(this.doctorId);
      }
    });
    
    // Navigate to action URL
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
    
    this.isOpen = false;
  }

  markAllAsRead() {
    if (this.doctorId) {
      this.notificationService.markAllAsRead(this.doctorId).subscribe(() => {
        this.notificationService.loadUnreadNotifications(this.doctorId!);
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
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationDate.toLocaleDateString();
  }

  viewAllNotifications() {
    this.router.navigate(['/notifications']);
    this.isOpen = false;
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification._id;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
