import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ServiceManagementService } from './service-management.service';

describe('ServiceManagementService', () => {
  let service: ServiceManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ServiceManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
