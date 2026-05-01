import { TestBed } from '@angular/core/testing';

import { MedicalDocumentService } from './medical-document.service';
import { buildServiceTestingModule } from '../../testing/test-bed-helpers';

describe('MedicalDocumentService', () => {
  let service: MedicalDocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule(buildServiceTestingModule());
    service = TestBed.inject(MedicalDocumentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
