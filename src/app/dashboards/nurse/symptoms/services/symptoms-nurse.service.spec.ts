import { TestBed } from '@angular/core/testing';

import { SymptomsNurseService } from './symptoms-nurse.service';

describe('SymptomsNurseService', () => {
  let service: SymptomsNurseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SymptomsNurseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
