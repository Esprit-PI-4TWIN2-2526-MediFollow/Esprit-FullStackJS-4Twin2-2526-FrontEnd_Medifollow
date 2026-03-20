import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuestionnaireRoutingModule } from './questionnaire-routing.module';
import { DashboardQuestionnaireComponent } from './dashboard-questionnaire.component';
import { ViewQuestionnaireComponent } from './view-questionnaire/view-questionnaire.component';
import { BuilderComponent } from './builder/builder.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    DashboardQuestionnaireComponent,

    ViewQuestionnaireComponent,
    BuilderComponent
  ],
  imports: [
    CommonModule,
    QuestionnaireRoutingModule,
    FormsModule
  ]
})
export class QuestionnaireModule { }
