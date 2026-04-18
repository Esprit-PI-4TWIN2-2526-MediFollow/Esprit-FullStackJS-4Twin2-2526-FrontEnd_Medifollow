// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';
// import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
// import { ProfileComponent } from './pages/profile/profile.component';
// import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
// import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
// import { BlankComponent } from './pages/blank/blank.component';
// import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
// import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
// import { InvoicesComponent } from './pages/invoices/invoices.component';
// import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
// import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
// import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
// import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
// import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
// import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
// import { ImagesComponent } from './pages/ui-elements/images/images.component';
// import { VideosComponent } from './pages/ui-elements/videos/videos.component';
// import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
// import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
// import { CalenderComponent } from './pages/calender/calender.component';
// import { AllProfilesComponent } from './users/all-profiles/all-profiles.component';
// import { ForgotPasswordComponent } from './shared/components/auth/forgot-password/forgot-password.component';
// import { ResetPasswordComponent } from './shared/components/auth/reset-password/reset-password.component';
// import { FirstLoginChangePasswordComponent } from './shared/components/auth/first-login-change-password/first-login-change-password.component';
// import { AuthGuard } from './services/auth/auth.guard';
// import { RoleManageComponent } from './roles/role-manage/role-manage.component';
// import { SpeechRecognitionService } from './services/speech-recognition.service';
// import { ManageServiceComponent } from './manage-service/manage-service.component';

// const routes: Routes = [



//   {
//     path: 'signin',
//     component: SignInComponent,
//     title: 'MediFollow - Connexion'
//   },
//   {
//     path: 'signup',
//     component: SignUpComponent,
//     title: 'MediFollow - Inscription'
//   },
//   {
//     path: 'forgot-password',
//     component: ForgotPasswordComponent,
//     title: 'MediFollow - Mot de passe oublié'
//   },
//   {
//     path: 'reset-password/:token',
//     component: ResetPasswordComponent,
//     title: 'MediFollow - Réinitialisation mot de passe'
//   },
//   {
//     path: 'first-login/change-password',
//     component: FirstLoginChangePasswordComponent,
//     title: 'MediFollow - Première connexion'
//   },

//   {
//     path: '',
//     component: AppLayoutComponent,
//     canActivate: [AuthGuard],
//     children: [
//       {
//         path: 'dashboard',
//         component: EcommerceComponent,
//         title: 'MediFollow - Dashboard',
//       },

//       // les path te3 les modules
//       //actors
//       { path: 'auditor', loadChildren: () => import('./dashboards/auditor/auditor.module').then(m => m.AuditorModule) },
//       { path: 'coordinator', loadChildren: () => import('./dashboards/coordinator/coordinator.module').then(m => m.CoordinatorModule) },
//       { path: 'nurse', loadChildren: () => import('./dashboards/nurse/nurse.module').then(m => m.NurseModule) },
//       { path: 'patient', loadChildren: () => import('./dashboards/patient/patient.module').then(m => m.PatientModule) },
//       { path: 'physician', loadChildren: () => import('./dashboards/physician/physician.module').then(m => m.DoctorModule) },
//       { path: 'super-admin', loadChildren: () => import('./dashboards/super-admin/super-admin.module').then(m => m.SuperAdminModule) },
//       //questionnaire
//       { path: 'questionnaire', loadChildren: () => import('./questionnaire/questionnaire.module').then(m => m.QuestionnaireModule) },

//       //services
//       {
//         path: 'services',
//         component: ManageServiceComponent,
//         title: 'MediFollow - Tous les services '
//       },

//       {
//         path: 'getAllUsers',
//         component: AllProfilesComponent,
//         title: 'MediFollow - Tous les utilisateurs'
//       },
//       {
//         path: 'manage-roles',
//         component: RoleManageComponent,
//         title: 'MediFollow - Gestion des rôles'
//       },
//       {
//         path: 'calendar',
//         component: CalenderComponent,
//         title: 'MediFollow - Calendrier'
//       },
//       {
//         path: 'profile',
//         component: ProfileComponent,
//         title: 'MediFollow - Profil'
//       },
//       {
//         path: 'form-elements',
//         component: FormElementsComponent,
//         title: 'MediFollow - Éléments de formulaire'
//       },
//       {
//         path: 'basic-tables',
//         component: BasicTablesComponent,
//         title: 'MediFollow - Tableaux'
//       },
//       {
//         path: 'blank',
//         component: BlankComponent,
//         title: 'MediFollow - Page vide'
//       },
//       {
//         path: 'invoice',
//         component: InvoicesComponent,
//         title: 'MediFollow - Factures'
//       },
//       {
//         path: 'line-chart',
//         component: LineChartComponent,
//         title: 'MediFollow - Graphique linéaire'
//       },
//       {
//         path: 'bar-chart',
//         component: BarChartComponent,
//         title: 'MediFollow - Graphique à barres'
//       },
//       {
//         path: 'alerts',
//         component: AlertsComponent,
//         title: 'MediFollow - Alertes'
//       },
//       {
//         path: 'avatars',
//         component: AvatarElementComponent,
//         title: 'MediFollow - Avatars'
//       },
//       {
//         path: 'badge',
//         component: BadgesComponent,
//         title: 'MediFollow - Badges'
//       },
//       {
//         path: 'buttons',
//         component: ButtonsComponent,
//         title: 'MediFollow - Boutons'
//       },
//       {
//         path: 'images',
//         component: ImagesComponent,
//         title: 'MediFollow - Images'
//       },
//       {
//         path: 'videos',
//         component: VideosComponent,
//         title: 'MediFollow - Vidéos'
//       },
//       // Module utilisateur
//       {
//         path: 'users',
//         loadChildren: () => import('./users/users.module').then(u => u.UsersModule),
//         title: 'MediFollow - Gestion utilisateurs'
//       },
//       // Redirection par défaut vers dashboard
//       {
//         path: '',
//         redirectTo: 'dashboard',
//         pathMatch: 'full'
//       }
//     ]
//   },

//   // Page 404
//   {
//     path: '404',
//     component: NotFoundComponent,
//     title: 'MediFollow - Page non trouvée'
//   },
//   {
//     path: '**',
//     redirectTo: '404'
//   }
// ];

// @NgModule({
//   imports: [RouterModule.forRoot(routes)],
//   exports: [RouterModule]
// })
// export class AppRoutingModule { }
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Pages
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { UnauthorizedComponent } from './pages/other-page/unauthorized/unauthorized.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { AllProfilesComponent } from './users/all-profiles/all-profiles.component';
import { RoleManageComponent } from './roles/role-manage/role-manage.component';

// Auth pages
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { ForgotPasswordComponent } from './shared/components/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './shared/components/auth/reset-password/reset-password.component';
import { FirstLoginChangePasswordComponent } from './shared/components/auth/first-login-change-password/first-login-change-password.component';

// Guards
import { AuthGuard } from './services/auth/auth.guard';
import { RoleGuard } from './services/auth/role.guard';
import { ManageServiceComponent } from './manage-service/manage-service.component';
import { DashboardSuperAdminComponent } from './dashboards/super-admin/dashboard-super-admin.component';

// Rôles admin réutilisables
const ADMIN_ROLES = ['SUPERADMIN', 'ADMIN'];

const routes: Routes = [


  {
    path: 'signin',
    component: SignInComponent,
    title: 'MediFollow - Connexion'
  },

  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    title: 'MediFollow - Mot de passe oublié'
  },
  {
    path: 'reset-password/:token',
    component: ResetPasswordComponent,
    title: 'MediFollow - Réinitialisation mot de passe'
  },
  {
    path: 'first-login/change-password',
    component: FirstLoginChangePasswordComponent,
    title: 'MediFollow - Première connexion'
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
    title: 'MediFollow - Accès refusé'
  },

  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        component: DashboardSuperAdminComponent,
        canActivate: [RoleGuard],
        data: { allowedRoles: ADMIN_ROLES },
        title: 'MediFollow - Dashboard'
      },
      {
        path: 'signup',
        component: SignUpComponent,
        title: 'MediFollow - Inscription'
      },
      {
        path: 'symptoms', loadChildren: () => import('./symptoms/symptoms.module').then(m => m.SymptomsModule),
        data: { allowedRoles: ['PATIENT'] }

      },
      {
        path: 'auditor',
        loadChildren: () => import('./dashboards/auditor/auditor.module').then(m => m.AuditorModule),
        canActivate: [RoleGuard],
        data: { allowedRoles: ['AUDITOR'] }
      },
      {
        path: 'coordinator',
        loadChildren: () => import('./dashboards/coordinator/coordinator.module').then(m => m.CoordinatorModule),
        canActivate: [RoleGuard],
        data: { allowedRoles: ['COORDINATOR'] }
      },
      {
        path: 'nurse',
        loadChildren: () => import('./dashboards/nurse/nurse.module').then(m => m.NurseModule),
        canActivate: [RoleGuard],
        data: { allowedRoles: ['NURSE'] }
      },
      {
        path: 'patient',
        loadChildren: () => import('./dashboards/patient/patient.module').then(m => m.PatientModule),
        canActivate: [RoleGuard],
        data: { allowedRoles: ['PATIENT'] }
      },
      {
        path: 'doctor',
        loadChildren: () => import('./dashboards/physician/doctor.module').then(m => m.DoctorModule),
        canActivate: [RoleGuard],
        data: { allowedRoles: ['DOCTOR'] }
      },
      {
        path: 'telemedicine',
        loadChildren: () => import('./telemedicine/telemedicine.module').then(m => m.TelemedicineModule),
        canActivate: [RoleGuard],
        data: { allowedRoles: ['DOCTOR', 'PATIENT', 'SUPERADMIN', 'ADMIN'] },
        title: 'MediFollow - Télémédecine'
      },
      {
        path: 'super-admin',
        loadChildren: () => import('./dashboards/super-admin/super-admin.module').then(m => m.SuperAdminModule),
        canActivate: [RoleGuard],
        data: { allowedRoles: ['SUPERADMIN'] }
      },

      {
        path: 'questionnaire',
        loadChildren: () => import('./questionnaire/questionnaire.module').then(m => m.QuestionnaireModule),
        canActivate: [RoleGuard],
        data: {
          allowedRoles: ADMIN_ROLES
        },
      },
      {
        path: 'services',
        component: ManageServiceComponent,
        canActivate: [RoleGuard],
        data: { allowedRoles: ['SUPERADMIN'] },
        title: 'MediFollow - Tous les services'
      },
      {
        path: 'getAllUsers',
        component: AllProfilesComponent,
        canActivate: [RoleGuard],
        data: { allowedRoles: ADMIN_ROLES },
        title: 'MediFollow - Tous les utilisateurs'
      },
      {
        path: 'manage-roles',
        component: RoleManageComponent,
        canActivate: [RoleGuard],
        data: { allowedRoles: ['SUPERADMIN'] },
        title: 'MediFollow - Gestion des rôles'
      },
      {
        path: 'users',
        loadChildren: () => import('./users/users.module').then(u => u.UsersModule),
        canActivate: [RoleGuard],
        data: { allowedRoles: ADMIN_ROLES },
        title: 'MediFollow - Gestion utilisateurs'
      },

      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'MediFollow - Calendrier'
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'MediFollow - Profil'
      },
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'MediFollow - Factures'
      },

      // ── UI Kit ──
      { path: 'form-elements', component: FormElementsComponent, title: 'MediFollow - Formulaires' },
      { path: 'basic-tables', component: BasicTablesComponent, title: 'MediFollow - Tableaux' },
      { path: 'blank', component: BlankComponent, title: 'MediFollow - Page vide' },
      { path: 'line-chart', component: LineChartComponent, title: 'MediFollow - Graphique linéaire' },
      { path: 'bar-chart', component: BarChartComponent, title: 'MediFollow - Graphique à barres' },
      { path: 'alerts', component: AlertsComponent, title: 'MediFollow - Alertes' },
      { path: 'avatars', component: AvatarElementComponent, title: 'MediFollow - Avatars' },
      { path: 'badge', component: BadgesComponent, title: 'MediFollow - Badges' },
      { path: 'buttons', component: ButtonsComponent, title: 'MediFollow - Boutons' },
      { path: 'images', component: ImagesComponent, title: 'MediFollow - Images' },
      { path: 'videos', component: VideosComponent, title: 'MediFollow - Vidéos' },
    ]
  },
  {
    path: '404',
    component: NotFoundComponent,
    title: 'MediFollow - Page non trouvée'
  },
  {
    path: '**',
    redirectTo: '404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }


