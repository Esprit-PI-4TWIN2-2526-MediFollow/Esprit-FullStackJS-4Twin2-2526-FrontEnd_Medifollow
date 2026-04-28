import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CreateConsultationComponent } from './create-consultation.component';
import { ConsultationService } from '../services/consultation.service';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('CreateConsultationComponent', () => {
  let component: CreateConsultationComponent;
  let fixture: ComponentFixture<CreateConsultationComponent>;
  let consultationService: jasmine.SpyObj<ConsultationService>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem('user', JSON.stringify({ _id: 'doctor-1', role: 'DOCTOR' }));
    consultationService = jasmine.createSpyObj<ConsultationService>('ConsultationService', ['create']);
    consultationService.create.and.returnValue(of({ _id: 'consultation-1' } as any));

    await TestBed.configureTestingModule(
      buildComponentTestingModule(CreateConsultationComponent, {
        providers: [
          { provide: ConsultationService, useValue: consultationService },
        ],
      }),
    ).compileComponents();

    fixture = TestBed.createComponent(CreateConsultationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpTestingController = TestBed.inject(HttpTestingController);
    httpTestingController.expectOne('http://localhost:3000/api/users/patients').flush([]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });
});
