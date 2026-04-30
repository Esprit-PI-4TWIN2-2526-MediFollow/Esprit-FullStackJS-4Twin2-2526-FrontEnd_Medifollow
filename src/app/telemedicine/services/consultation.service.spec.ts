import { TestBed } from '@angular/core/testing';

import { ConsultationService } from './consultation.service';
import { buildServiceTestingModule } from '../../testing/test-bed-helpers';

describe('ConsultationService', () => {
  let service: ConsultationService;

  beforeEach(() => {
    TestBed.configureTestingModule(buildServiceTestingModule());
    service = TestBed.inject(ConsultationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
