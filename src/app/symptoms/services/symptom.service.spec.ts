import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SymptomService } from './symptom.service';

describe('SymptomService', () => {
  let service: SymptomService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(SymptomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
