import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from './auth.service';
import { CommunicationService } from '../communication/communication.service';

describe('AuthService', () => {
  let service: AuthService;
  let communicationService: jasmine.SpyObj<CommunicationService>;

  beforeEach(() => {
    communicationService = jasmine.createSpyObj<CommunicationService>('CommunicationService', [
      'connect',
      'disconnect',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: CommunicationService, useValue: communicationService },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
