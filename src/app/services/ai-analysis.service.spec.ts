import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AiAnalysisService } from './ai-analysis.service';

describe('AiAnalysisService', () => {
  let service: AiAnalysisService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AiAnalysisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
