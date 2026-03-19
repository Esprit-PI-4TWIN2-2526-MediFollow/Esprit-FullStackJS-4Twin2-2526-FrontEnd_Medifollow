import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardNurseComponent } from './dashboard-nurse.component';

const routes: Routes = [
{path:'',component:DashboardNurseComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NurseRoutingModule { }
