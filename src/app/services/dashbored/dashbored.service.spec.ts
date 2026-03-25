import { TestBed } from '@angular/core/testing';

import { DashboredService } from './dashbored.service';

describe('DashboredService', () => {
  let service: DashboredService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboredService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
