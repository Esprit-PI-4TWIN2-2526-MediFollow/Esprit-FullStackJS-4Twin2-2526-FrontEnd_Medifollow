import { TestBed } from '@angular/core/testing';

import { MedicalDocumentService } from './medical-document.service';

describe('MedicalDocumentService', () => {
  let service: MedicalDocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedicalDocumentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
