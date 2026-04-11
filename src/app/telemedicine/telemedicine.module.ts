import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { TelemedicineRoutingModule } from './telemedicine-routing.module';
import { ConsultationListComponent } from './consultation-list/consultation-list.component';
import { ConsultationDetailComponent } from './consultation-detail/consultation-detail.component';
import { CreateConsultationComponent } from './create-consultation/create-consultation.component';
import { PrescriptionFormComponent } from './prescription-form/prescription-form.component';
import { PrescriptionListComponent } from './prescription-list/prescription-list.component';
import { DocumentUploadComponent } from './document-upload/document-upload.component';
import { DocumentListComponent } from './document-list/document-list.component';

@NgModule({
  declarations: [
    ConsultationListComponent,
    ConsultationDetailComponent,
    CreateConsultationComponent,
    PrescriptionFormComponent,
    PrescriptionListComponent,
    DocumentUploadComponent,
    DocumentListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    TelemedicineRoutingModule
  ]
})
export class TelemedicineModule { }
