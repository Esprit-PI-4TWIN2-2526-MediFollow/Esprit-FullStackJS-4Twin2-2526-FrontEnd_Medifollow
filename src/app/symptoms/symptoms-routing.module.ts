import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardSymptomsComponent } from './dashboard-symptoms/dashboard-symptoms.component';
import { ViewSymptomsComponent } from './view-symptoms/view-symptoms.component';
import { BuilderComponent } from './builder/builder.component';

const routes: Routes = [
  { path: '', component: DashboardSymptomsComponent },
  { path: 'builder', component: BuilderComponent },
  { path: 'builder/:id', component: BuilderComponent },
  { path: 'view/:id', component: ViewSymptomsComponent }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SymptomsRoutingModule { }
