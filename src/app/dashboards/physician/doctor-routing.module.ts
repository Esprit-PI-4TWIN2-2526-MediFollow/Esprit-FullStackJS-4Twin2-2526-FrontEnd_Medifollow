import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardDoctorComponent } from './dashboard-doctor.component';
import { PatientResponsesComponent } from './patient-responses/patient-responses.component';
import { ViewQuestionnaireComponent } from './view-questionnaire/view-questionnaire.component';
import { ChatComponent } from '../../chat/chat.component';
import { ContactsComponent } from '../../chat/contacts/contacts.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardDoctorComponent },
  { path: 'patient/:id/responses', component: PatientResponsesComponent },
  { path: 'viewQu/:id', component: ViewQuestionnaireComponent },
  { path: 'contacts', component: ContactsComponent },       // ← liste

  { path: 'chat/:targetUserId', component: ChatComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class DoctorRoutingModule { }
