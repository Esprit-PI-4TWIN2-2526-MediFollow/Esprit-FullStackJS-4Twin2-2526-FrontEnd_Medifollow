import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ConsultationListComponent } from './consultation-list.component';
import { ConsultationService } from '../services/consultation.service';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('ConsultationListComponent', () => {
  let component: ConsultationListComponent;
  let fixture: ComponentFixture<ConsultationListComponent>;
  let consultationService: jasmine.SpyObj<ConsultationService>;

  beforeEach(async () => {
    localStorage.setItem('user', JSON.stringify({ _id: 'doctor-1', role: 'DOCTOR' }));
    consultationService = jasmine.createSpyObj<ConsultationService>('ConsultationService', [
      'findAll',
      'findByDoctor',
      'findByPatient',
      'start',
      'cancel',
    ]);
    consultationService.findAll.and.returnValue(of([]));
    consultationService.findByDoctor.and.returnValue(of([]));
    consultationService.findByPatient.and.returnValue(of([]));
    consultationService.start.and.returnValue(of({} as any));
    consultationService.cancel.and.returnValue(of({} as any));

    await TestBed.configureTestingModule(
      buildComponentTestingModule(ConsultationListComponent, {
        providers: [
          { provide: ConsultationService, useValue: consultationService },
        ],
      }),
    ).compileComponents();

    fixture = TestBed.createComponent(ConsultationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    localStorage.clear();
  });
});
