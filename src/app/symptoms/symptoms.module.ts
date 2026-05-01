import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SymptomsRoutingModule } from './symptoms-routing.module';
import { BuilderComponent } from './builder/builder.component';
import { ViewSymptomsComponent } from './view-symptoms/view-symptoms.component';
import { DashboardSymptomsComponent } from './dashboard-symptoms/dashboard-symptoms.component';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [
    BuilderComponent,
    ViewSymptomsComponent,
    DashboardSymptomsComponent
  ],
  imports: [
    CommonModule,
    SymptomsRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ]
})
export class SymptomsModule { }
