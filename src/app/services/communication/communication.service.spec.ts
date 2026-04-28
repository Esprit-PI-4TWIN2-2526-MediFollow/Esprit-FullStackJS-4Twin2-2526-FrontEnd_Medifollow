import { TestBed } from '@angular/core/testing';

import { CommunicationService } from './communication.service';
import { buildServiceTestingModule } from '../../testing/test-bed-helpers';

describe('CommunicationService', () => {
  let service: CommunicationService;

  beforeEach(() => {
    TestBed.configureTestingModule(buildServiceTestingModule());
    service = TestBed.inject(CommunicationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
