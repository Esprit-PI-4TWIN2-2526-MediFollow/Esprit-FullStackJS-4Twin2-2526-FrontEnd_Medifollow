import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardCoordinatorComponent } from './dashboard-coordinator.component';
import { CoordinatorFollowUpProtocolComponent } from './coordinator-follow-up-protocol.component';
import { CoordinatorProtocolDetailsComponent } from './coordinator-protocol-details.component';
import { CoordinatorSymptomsReviewComponent } from './coordinator-symptoms-review.component';
import { CoordinatorSymptomsDetailsComponent } from './coordinator-symptoms-details.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardCoordinatorComponent },
  { path: 'follow-up/protocol', component: CoordinatorFollowUpProtocolComponent },
  { path: 'follow-up/protocol/:patientId', component: CoordinatorProtocolDetailsComponent },
  { path: 'symptoms-review', component: CoordinatorSymptomsReviewComponent },
  { path: 'symptoms-review/:responseId', component: CoordinatorSymptomsDetailsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoordinatorRoutingModule { }
