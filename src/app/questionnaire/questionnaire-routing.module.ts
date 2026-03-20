import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardQuestionnaireComponent } from './dashboard-questionnaire.component';
import { ViewQuestionnaireComponent } from './view-questionnaire/view-questionnaire.component';
import { BuilderComponent } from './builder/builder.component';

const routes: Routes = [
{path:'',component:DashboardQuestionnaireComponent},
{path:'create',component:BuilderComponent},
{path:'edit/:id',component:BuilderComponent},
{path:'view/:id',component:ViewQuestionnaireComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QuestionnaireRoutingModule { }
