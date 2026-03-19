import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardCoordinatorComponent } from './dashboard-coordinator.component';

const routes: Routes = [
{path:'',component:DashboardCoordinatorComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoordinatorRoutingModule { }
