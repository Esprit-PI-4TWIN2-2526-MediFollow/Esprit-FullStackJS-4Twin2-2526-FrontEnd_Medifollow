import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { DocumentUploadComponent } from './document-upload.component';
import { MedicalDocumentService } from '../services/medical-document.service';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('DocumentUploadComponent', () => {
  let component: DocumentUploadComponent;
  let fixture: ComponentFixture<DocumentUploadComponent>;
  let documentService: jasmine.SpyObj<MedicalDocumentService>;

  beforeEach(async () => {
    documentService = jasmine.createSpyObj<MedicalDocumentService>('MedicalDocumentService', ['upload']);
    documentService.upload.and.returnValue(of({ _id: 'document-1' } as any));

    await TestBed.configureTestingModule(
      buildComponentTestingModule(DocumentUploadComponent, {
        providers: [
          { provide: MedicalDocumentService, useValue: documentService },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: (key: string) => (key === 'consultationId' ? 'consultation-1' : null),
                },
                queryParamMap: {
                  get: (key: string) => (key === 'patientId' ? 'patient-1' : null),
                },
              },
            },
          },
        ],
      }),
    ).compileComponents();

    fixture = TestBed.createComponent(DocumentUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
