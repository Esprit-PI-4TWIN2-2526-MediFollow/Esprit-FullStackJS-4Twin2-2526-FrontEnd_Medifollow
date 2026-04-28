import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, EMPTY, of } from 'rxjs';

import { ChatComponent } from './chat.component';
import { CommunicationService } from '../services/communication/communication.service';

describe('ChatComponent', () => {
  let httpTestingController: HttpTestingController;
  let communicationService: jasmine.SpyObj<CommunicationService>;

  beforeEach(async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ _id: 'doctor-1', role: 'DOCTOR', firstName: 'John', lastName: 'Doctor' }),
    );

    communicationService = jasmine.createSpyObj<CommunicationService>('CommunicationService', [
      'connect',
      'joinRoom',
      'sendMessage',
      'sendTyping',
      'uploadAttachment',
      'markAsRead',
      'disconnect',
    ]);

    communicationService.getMessages = jasmine.createSpy().and.returnValue(of([]));
    communicationService.getMessageEvents = jasmine.createSpy().and.returnValue(EMPTY);
    communicationService.getTyping = jasmine.createSpy().and.returnValue(of(null));
    communicationService.getCurrentRoomId = jasmine.createSpy().and.returnValue(
      new BehaviorSubject<string | null>(null).asObservable(),
    );
    communicationService.isConnected = jasmine.createSpy().and.returnValue(
      new BehaviorSubject<boolean>(true).asObservable(),
    );

    await TestBed.configureTestingModule({
      imports: [
        ChatComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: CommunicationService, useValue: communicationService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ targetUserId: 'patient-1' })),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ChatComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    httpTestingController = TestBed.inject(HttpTestingController);
    httpTestingController.expectOne('http://localhost:3000/api/users/all').flush([]);

    expect(component).toBeTruthy();
  });

  afterEach(() => {
    if (httpTestingController) {
      httpTestingController.verify();
    }
    localStorage.clear();
  });
});
