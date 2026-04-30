import { TestBed } from '@angular/core/testing';

import { GestureControlService } from './gesture-control.service';
import { buildServiceTestingModule } from '../testing/test-bed-helpers';

describe('GestureControlService', () => {
  let service: GestureControlService;

  beforeEach(() => {
    TestBed.configureTestingModule(buildServiceTestingModule());
    service = TestBed.inject(GestureControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
