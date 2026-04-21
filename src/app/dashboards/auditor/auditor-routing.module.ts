import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardAuditorComponent } from './dashboard-auditor.component';
import { AuditComponent } from './audit.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardAuditorComponent },
  { path: 'audit', component: AuditComponent, title: 'MediFollow - Audit Logs' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditorRoutingModule { }
