import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardNurseComponent } from './dashboard-nurse.component';
import { SymptomsDetailsComponent } from './symptoms/symptoms-details/symptoms-details.component';
import { SymptomsListComponent } from './symptoms/symptoms-list/symptoms-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardNurseComponent },
  { path: 'symptoms', component: SymptomsListComponent },
  { path: 'symptoms/:responseId', component: SymptomsDetailsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NurseRoutingModule { }
