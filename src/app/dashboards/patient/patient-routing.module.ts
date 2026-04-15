import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPatientComponent } from './dashboard-patient.component';
import { QuestionnaireRendererComponent } from './questionnaire-renderer/questionnaire-renderer.component';
import { SymptomsRendererComponent } from './symptoms-renderer/symptoms-renderer.component';
import { ChatComponent } from '../../chat/chat.component';
import { ContactsComponent } from '../../chat/contacts/contacts.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardPatientComponent },
  { path: 'questionnaire/:id', component: QuestionnaireRendererComponent },
  { path: 'symptoms', component: SymptomsRendererComponent },
  { path: 'symptoms-history/:date', component: SymptomsRendererComponent },
  { path: 'contacts', component: ContactsComponent },
  { path: 'chat/:targetUserId', component: ChatComponent }, // ← ajoute

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientRoutingModule { }
