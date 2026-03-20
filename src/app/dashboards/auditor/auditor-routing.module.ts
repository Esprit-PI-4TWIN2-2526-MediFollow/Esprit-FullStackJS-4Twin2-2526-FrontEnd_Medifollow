import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardAuditorComponent } from './dashboard-auditor.component';

const routes: Routes = [
{path:'',component:DashboardAuditorComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditorRoutingModule { }
