import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { PatientResponsesComponent } from './patient-responses.component';
import { buildComponentTestingModule } from '../../../testing/test-bed-helpers';

describe('PatientResponsesComponent', () => {
  let component: PatientResponsesComponent;
  let fixture: ComponentFixture<PatientResponsesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(
      buildComponentTestingModule(PatientResponsesComponent, {
        imports: [HttpClientTestingModule],
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: (_key: string) => '1',
                },
              },
            },
          },
        ],
      }),
    ).compileComponents();

    fixture = TestBed.createComponent(PatientResponsesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
