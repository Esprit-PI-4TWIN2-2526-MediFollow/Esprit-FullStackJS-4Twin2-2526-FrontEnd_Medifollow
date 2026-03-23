import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { BuilderComponent } from './builder.component';
import { SymptomService } from '../services/symptom.service';

describe('BuilderComponent', () => {
  let component: BuilderComponent;
  let fixture: ComponentFixture<BuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BuilderComponent],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        {
          provide: SymptomService,
          useValue: {
            createForm: () => of({})
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
