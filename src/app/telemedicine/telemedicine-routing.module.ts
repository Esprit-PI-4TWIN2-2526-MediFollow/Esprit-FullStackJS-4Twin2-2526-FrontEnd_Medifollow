import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsultationListComponent } from './consultation-list/consultation-list.component';
import { ConsultationDetailComponent } from './consultation-detail/consultation-detail.component';
import { CreateConsultationComponent } from './create-consultation/create-consultation.component';
import { PrescriptionFormComponent } from './prescription-form/prescription-form.component';
import { PrescriptionListComponent } from './prescription-list/prescription-list.component';
import { DocumentUploadComponent } from './document-upload/document-upload.component';
import { DocumentListComponent } from './document-list/document-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'consultations', pathMatch: 'full' },
  { path: 'consultations', component: ConsultationListComponent },
  { path: 'consultation/:id', component: ConsultationDetailComponent },
  { path: 'create-consultation', component: CreateConsultationComponent },
  { path: 'prescription/create/:consultationId', component: PrescriptionFormComponent },
  { path: 'prescriptions', component: PrescriptionListComponent },
  { path: 'document/upload/:consultationId', component: DocumentUploadComponent },
  { path: 'documents', component: DocumentListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TelemedicineRoutingModule { }
