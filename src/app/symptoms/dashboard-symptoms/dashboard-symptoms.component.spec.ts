import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { DashboardSymptomsComponent } from './dashboard-symptoms.component';
import { SymptomService } from '../services/symptom.service';

describe('DashboardSymptomsComponent', () => {
  let component: DashboardSymptomsComponent;
  let fixture: ComponentFixture<DashboardSymptomsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardSymptomsComponent],
      imports: [RouterTestingModule],
      providers: [
        {
          provide: SymptomService,
          useValue: {
            getForms: () => of([])
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardSymptomsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
