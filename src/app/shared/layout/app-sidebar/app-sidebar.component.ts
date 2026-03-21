import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  action?: () => void; // Ajouter une propriété action

};

@Component({
  selector: 'app-sidebar',
  templateUrl: './app-sidebar.component.html',
  styleUrls: ['./app-sidebar.component.css'],
})
export class AppSidebarComponent {

  // Main nav items
  navItems: NavItem[] = [
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z" fill="currentColor"/>
  </svg>`,
      name: "Dashboard",
      subItems: [
        { name: "View", path: "/basic-tables", pro: false },
      ],
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V3.75H15.25V2.75C15.25 2.33579 15.5858 2 16 2C16.4142 2 16.75 2.33579 16.75 2.75V3.75H18.5C19.7426 3.75 20.75 4.75736 20.75 6V9V19C20.75 20.2426 19.7426 21.25 18.5 21.25H5.5C4.25736 21.25 3.25 20.2426 3.25 19V9V6C3.25 4.75736 4.25736 3.75 5.5 3.75H7.25V2.75C7.25 2.33579 7.58579 2 8 2ZM8 5.25H5.5C5.08579 5.25 4.75 5.58579 4.75 6V8.25H19.25V6C19.25 5.58579 18.9142 5.25 18.5 5.25H16H8ZM19.25 9.75H4.75V19C4.75 19.4142 5.08579 19.75 5.5 19.75H18.5C18.9142 19.75 19.25 19.4142 19.25 19V9.75Z" fill="currentColor"/>
  </svg>`,
      name: "Calendar",
      path: "/calendar",
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 3.5C4.00736 3.5 3 4.50736 3 5.75V11.25C3 12.4926 4.00736 13.5 5.25 13.5H10.75C11.9926 13.5 13 12.4926 13 11.25V5.75C13 4.50736 11.9926 3.5 10.75 3.5H5.25ZM4.5 5.75C4.5 5.33579 4.83579 5 5.25 5H10.75C11.1642 5 11.5 5.33579 11.5 5.75V11.25C11.5 11.6642 11.1642 12 10.75 12H5.25C4.83579 12 4.5 11.6642 4.5 11.25V5.75ZM13.25 10.5C13.25 9.25736 14.2574 8.25 15.5 8.25H18.5C19.7426 8.25 20.75 9.25736 20.75 10.5V18.25C20.75 19.4926 19.7426 20.5 18.5 20.5H5.5C4.25736 20.5 3.25 19.4926 3.25 18.25V15.5C3.25 14.2574 4.25736 13.25 5.5 13.25H13.25V10.5ZM15.5 9.75C14.9142 9.75 14.5 10.1642 14.5 10.75V17.5H5.5C5.08579 17.5 4.75 17.1642 4.75 16.75V15.5C4.75 14.9142 5.16421 14.5 5.75 14.5H14.5V10.75C14.5 10.3358 14.9142 9.75 15.5 9.75Z" fill="currentColor"/>
  </svg>`,
      name: "Manage Roles",
      path: "/manage-roles",
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.75C9.1005 2.75 6.75 5.1005 6.75 8C6.75 10.8995 9.1005 13.25 12 13.25C14.8995 13.25 17.25 10.8995 17.25 8C17.25 5.1005 14.8995 2.75 12 2.75ZM8.25 8C8.25 5.92893 9.92893 4.25 12 4.25C14.0711 4.25 15.75 5.92893 15.75 8C15.75 10.0711 14.0711 11.75 12 11.75C9.92893 11.75 8.25 10.0711 8.25 8ZM5.25 15.5C4.00736 15.5 3 16.5074 3 17.75V19.5C3 20.7426 4.00736 21.75 5.25 21.75H18.75C19.9926 21.75 21 20.7426 21 19.5V17.75C21 16.5074 19.9926 15.5 18.75 15.5H5.25ZM4.5 17.75C4.5 17.3358 4.83579 17 5.25 17H18.75C19.1642 17 19.5 17.3358 19.5 17.75V19.5C19.5 19.9142 19.1642 20.25 18.75 20.25H5.25C4.83579 20.25 4.5 19.9142 4.5 19.5V17.75Z" fill="currentColor"/>
  </svg>`,
      name: "Manage Profiles",
      path: "/getAllUsers",
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M3 3.75C3 2.50736 4.00736 1.5 5.25 1.5H18.75C19.9926 1.5 21 2.50736 21 3.75V22.5H16.5V18.75C16.5 17.5074 15.4926 16.5 14.25 16.5H9.75C8.50736 16.5 7.5 17.5074 7.5 18.75V22.5H3V3.75ZM4.5 3.75V21H6V18.75C6 16.6789 7.67893 15 9.75 15H14.25C16.3211 15 18 16.6789 18 18.75V21H19.5V3.75C19.5 3.33579 19.1642 3 18.75 3H5.25C4.83579 3 4.5 3.33579 4.5 3.75ZM9 18.75V21H15V18.75C15 18.3358 14.6642 18 14.25 18H9.75C9.33579 18 9 18.3358 9 18.75ZM11.25 6C11.25 5.58579 11.5858 5.25 12 5.25C12.4142 5.25 12.75 5.58579 12.75 6V7.5H14.25C14.6642 7.5 15 7.83579 15 8.25C15 8.66421 14.6642 9 14.25 9H12.75V10.5C12.75 10.9142 12.4142 11.25 12 11.25C11.5858 11.25 11.25 10.9142 11.25 10.5V9H9.75C9.33579 9 9 8.66421 9 8.25C9 7.83579 9.33579 7.5 9.75 7.5H11.25V6Z" fill="currentColor"/>
  </svg>`,
      name: "Manage Services",
      path: "/services",
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 3.75H16C17.7949 3.75 19.25 5.20507 19.25 7V17C19.25 18.7949 17.7949 20.25 16 20.25H8C6.20507 20.25 4.75 18.7949 4.75 17V7C4.75 5.20507 6.20507 3.75 8 3.75Z" stroke="currentColor" stroke-width="1.5"/>
  <path d="M8 8.5H9.5V10H8V8.5Z" fill="currentColor"/>
  <path d="M11 9.25H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M8.3 13.3L9 14L10.2 12.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11 13.75H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M8 16.5H9.5V18H8V16.5Z" fill="currentColor"/>
  <path d="M11 17.25H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`,
      name: "Manage Questionnaires",
      path: "/questionnaire",
    },



    // {
    //   name: "Forms",
    //   icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H18.5001C19.7427 20.75 20.7501 19.7426 20.7501 18.5V5.5C20.7501 4.25736 19.7427 3.25 18.5001 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H18.5001C18.9143 4.75 19.2501 5.08579 19.2501 5.5V18.5C19.2501 18.9142 18.9143 19.25 18.5001 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V5.5ZM6.25005 9.7143C6.25005 9.30008 6.58583 8.9643 7.00005 8.9643L17 8.96429C17.4143 8.96429 17.75 9.30008 17.75 9.71429C17.75 10.1285 17.4143 10.4643 17 10.4643L7.00005 10.4643C6.58583 10.4643 6.25005 10.1285 6.25005 9.7143ZM6.25005 14.2857C6.25005 13.8715 6.58583 13.5357 7.00005 13.5357H17C17.4143 13.5357 17.75 13.8715 17.75 14.2857C17.75 14.6999 17.4143 15.0357 17 15.0357H7.00005C6.58583 15.0357 6.25005 14.6999 6.25005 14.2857Z" fill="currentColor"></path></svg>`,
    //   subItems: [
    //     { name: "Form Elements", path: "/form-elements", pro: false }
    //   ],
    // },
    // {
    //   name: "Tables",
    //   icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.25 5.5C3.25 4.25736 4.25736 3.25 5.5 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V18.5C20.75 19.7426 19.7426 20.75 18.5 20.75H5.5C4.25736 20.75 3.25 19.7426 3.25 18.5V5.5ZM5.5 4.75C5.08579 4.75 4.75 5.08579 4.75 5.5V8.58325L19.25 8.58325V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H5.5ZM19.25 10.0833H15.416V13.9165H19.25V10.0833ZM13.916 10.0833L10.083 10.0833V13.9165L13.916 13.9165V10.0833ZM8.58301 10.0833H4.75V13.9165H8.58301V10.0833ZM4.75 18.5V15.4165H8.58301V19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5ZM10.083 19.25V15.4165L13.916 15.4165V19.25H10.083ZM15.416 19.25V15.4165H19.25V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15.416Z" fill="currentColor"></path></svg>`,
    //   subItems: [
    //     { name: "Basic Tables", path: "/basic-tables", pro: false },
    //   ],
    // },

    // {
    //   name: "Pages",
    //   icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.50391 4.25C8.50391 3.83579 8.83969 3.5 9.25391 3.5H15.2777C15.4766 3.5 15.6674 3.57902 15.8081 3.71967L18.2807 6.19234C18.4214 6.333 18.5004 6.52376 18.5004 6.72268V16.75C18.5004 17.1642 18.1646 17.5 17.7504 17.5H16.248V17.4993H14.748V17.5H9.25391C8.83969 17.5 8.50391 17.1642 8.50391 16.75V4.25ZM14.748 19H9.25391C8.01126 19 7.00391 17.9926 7.00391 16.75V6.49854H6.24805C5.83383 6.49854 5.49805 6.83432 5.49805 7.24854V19.75C5.49805 20.1642 5.83383 20.5 6.24805 20.5H13.998C14.4123 20.5 14.748 20.1642 14.748 19.75L14.748 19ZM7.00391 4.99854V4.25C7.00391 3.00736 8.01127 2 9.25391 2H15.2777C15.8745 2 16.4468 2.23705 16.8687 2.659L19.3414 5.13168C19.7634 5.55364 20.0004 6.12594 20.0004 6.72268V16.75C20.0004 17.9926 18.9931 19 17.7504 19H16.248L16.248 19.75C16.248 20.9926 15.2407 22 13.998 22H6.24805C5.00541 22 3.99805 20.9926 3.99805 19.75V7.24854C3.99805 6.00589 5.00541 4.99854 6.24805 4.99854H7.00391Z" fill="currentColor"></path></svg>`,
    //   subItems: [
    //     { name: "Blank Page", path: "/blank", pro: false },
    //     { name: "404 Error", path: "/error-404", pro: false },
    //   ],
    // },
  ];
  // Others nav items
  othersItems: NavItem[] = [
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C11.5858 2 11.25 2.33579 11.25 2.75V12C11.25 12.4142 11.5858 12.75 12 12.75H21.25C21.6642 12.75 22 12.4142 22 12C22 6.47715 17.5228 2 12 2ZM12.75 11.25V3.53263C13.2645 3.57761 13.7659 3.66843 14.25 3.80098V3.80099C15.6929 4.19606 16.9827 4.96184 18.0104 5.98959C19.0382 7.01734 19.8039 8.30707 20.199 9.75C20.3316 10.2341 20.4224 10.7355 20.4674 11.25H12.75ZM2 12C2 7.25083 5.31065 3.27489 9.75 2.25415V3.80099C6.14748 4.78734 3.5 8.0845 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C15.9155 20.5 19.2127 17.8525 20.199 14.25H21.7459C20.7251 18.6894 16.7492 22 12 22C6.47715 22 2 17.5229 2 12Z" fill="currentColor"></path></svg>`,
      name: "Charts",
      subItems: [
        { name: "Line Chart", path: "/line-chart", pro: false },
        { name: "Bar Chart", path: "/bar-chart", pro: false },
      ],
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.75C9.1005 2.75 6.75 5.1005 6.75 8C6.75 10.8995 9.1005 13.25 12 13.25C14.8995 13.25 17.25 10.8995 17.25 8C17.25 5.1005 14.8995 2.75 12 2.75ZM8.25 8C8.25 5.92893 9.92893 4.25 12 4.25C14.0711 4.25 15.75 5.92893 15.75 8C15.75 10.0711 14.0711 11.75 12 11.75C9.92893 11.75 8.25 10.0711 8.25 8ZM5.25 15.5C4.00736 15.5 3 16.5074 3 17.75V19.5C3 20.7426 4.00736 21.75 5.25 21.75H18.75C19.9926 21.75 21 20.7426 21 19.5V17.75C21 16.5074 19.9926 15.5 18.75 15.5H5.25ZM4.5 17.75C4.5 17.3358 4.83579 17 5.25 17H18.75C19.1642 17 19.5 17.3358 19.5 17.75V19.5C19.5 19.9142 19.1642 20.25 18.75 20.25H5.25C4.83579 20.25 4.5 19.9142 4.5 19.5V17.75Z" fill="currentColor"/>
  </svg>`,
      name: "Sign Out",
      path: "/siginin",
      action: () => this.signOut()
    }
  ];


  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    // Subscribe to router events
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      })
    );

    // Subscribe to combined observables to close submenus when all are false
    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
        ([isExpanded, isMobileOpen, isHovered]) => {
          if (!isExpanded && !isMobileOpen && !isHovered) {
            // this.openSubmenu = null;
            // this.savedSubMenuHeights = { ...this.subMenuHeights };
            // this.subMenuHeights = {};
            this.cdr.detectChanges();
          } else {
            // Restore saved heights when reopening
            // this.subMenuHeights = { ...this.savedSubMenuHeights };
            // this.cdr.detectChanges();
          }
        }
      )
    );

    // Initial load
    this.setActiveMenuFromRoute(this.router.url);
  }
  signOut() {
    console.log('Sign out clicked');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    this.authService.logout();
    this.router.navigate(['/signin']);
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  toggleSubmenu(section: string, index: number) {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;

      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges(); // Ensure UI updates
        }
      });
    }
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) {
        this.sidebarService.setHovered(true);
      }
    }).unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    const menuGroups = [
      { items: this.navItems, prefix: 'main' },
      { items: this.othersItems, prefix: 'others' },
    ];

    menuGroups.forEach(group => {
      group.items.forEach((nav, i) => {
        if (nav.subItems) {
          nav.subItems.forEach(subItem => {
            if (currentUrl === subItem.path) {
              const key = `${group.prefix}-${i}`;
              this.openSubmenu = key;

              setTimeout(() => {
                const el = document.getElementById(key);
                if (el) {
                  this.subMenuHeights[key] = el.scrollHeight;
                  this.cdr.detectChanges(); // Ensure UI updates
                }
              });
            }
          });
        }
      });
    });
  }

  onSubmenuClick() {
    console.log('click submenu');
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }


}
