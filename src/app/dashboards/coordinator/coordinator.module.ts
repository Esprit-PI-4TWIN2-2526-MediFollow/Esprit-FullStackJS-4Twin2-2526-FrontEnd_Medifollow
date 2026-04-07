import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CoordinatorRoutingModule } from './coordinator-routing.module';
import { DashboardCoordinatorComponent } from './dashboard-coordinator.component';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { CoordinatorFollowUpProtocolComponent } from './coordinator-follow-up-protocol.component';
import { CoordinatorProtocolDetailsComponent } from './coordinator-protocol-details.component';
import { CoordinatorSymptomsReviewComponent } from './coordinator-symptoms-review.component';
import { CoordinatorSymptomsDetailsComponent } from './coordinator-symptoms-details.component';


@NgModule({
  declarations: [
    DashboardCoordinatorComponent,
    CoordinatorFollowUpProtocolComponent,
    CoordinatorProtocolDetailsComponent,
    CoordinatorSymptomsReviewComponent,
    CoordinatorSymptomsDetailsComponent
  ],
  imports: [
    CommonModule,
    CoordinatorRoutingModule,
    FormsModule,
    NgChartsModule
  ]
})
export class CoordinatorModule { }
