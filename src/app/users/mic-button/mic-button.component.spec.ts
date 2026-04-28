import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { MicButtonComponent } from './mic-button.component';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('MicButtonComponent', () => {
  let component: MicButtonComponent;
  let fixture: ComponentFixture<MicButtonComponent>;
  let speechRecognitionService: jasmine.SpyObj<SpeechRecognitionService>;

  beforeEach(async () => {
    speechRecognitionService = jasmine.createSpyObj<SpeechRecognitionService>('SpeechRecognitionService', [
      'start',
      'stop',
    ]);
    speechRecognitionService.start.and.returnValue(of({ transcript: 'bonjour', isFinal: true }));

    await TestBed.configureTestingModule(
      buildComponentTestingModule(MicButtonComponent, {
        providers: [
          { provide: SpeechRecognitionService, useValue: speechRecognitionService },
        ],
      }),
    ).compileComponents();

    fixture = TestBed.createComponent(MicButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
