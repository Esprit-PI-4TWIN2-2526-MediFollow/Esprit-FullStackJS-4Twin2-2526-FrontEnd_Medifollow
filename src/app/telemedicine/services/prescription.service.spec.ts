import { TestBed } from '@angular/core/testing';

import { PrescriptionService } from './prescription.service';
import { buildServiceTestingModule } from '../../testing/test-bed-helpers';

describe('PrescriptionService', () => {
  let service: PrescriptionService;

  beforeEach(() => {
    TestBed.configureTestingModule(buildServiceTestingModule());
    service = TestBed.inject(PrescriptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
