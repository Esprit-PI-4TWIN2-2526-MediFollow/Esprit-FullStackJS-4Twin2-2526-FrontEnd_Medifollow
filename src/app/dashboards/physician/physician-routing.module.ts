import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPhysicianComponent } from './dashboard-physician.component';

const routes: Routes = [
{path:'',component:DashboardPhysicianComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PhysicianRoutingModule { }
