import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ViewSymptomsComponent } from './view-symptoms.component';
import { SymptomService } from '../services/symptom.service';

describe('ViewSymptomsComponent', () => {
  let component: ViewSymptomsComponent;
  let fixture: ComponentFixture<ViewSymptomsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewSymptomsComponent],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        {
          provide: SymptomService,
          useValue: {
            getFormById: () => of({ _id: '1', title: 'Latest', questions: [] }),
            submitResponse: () => of({}),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1',
              },
            },
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewSymptomsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
