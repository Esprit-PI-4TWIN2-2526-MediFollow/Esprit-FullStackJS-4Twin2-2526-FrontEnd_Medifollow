import { TestBed } from '@angular/core/testing';

import { GestureControlService } from './gesture-control.service';

describe('GestureControlService', () => {
  let service: GestureControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestureControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
