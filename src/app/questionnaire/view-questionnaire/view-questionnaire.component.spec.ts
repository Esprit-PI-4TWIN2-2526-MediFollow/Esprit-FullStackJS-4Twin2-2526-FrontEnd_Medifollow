import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { ViewQuestionnaireComponent } from './view-questionnaire.component';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('ViewQuestionnaireComponent', () => {
  let component: ViewQuestionnaireComponent;
  let fixture: ComponentFixture<ViewQuestionnaireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(
      buildComponentTestingModule(ViewQuestionnaireComponent, {
        providers: [
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
      }),
    ).compileComponents();

    fixture = TestBed.createComponent(ViewQuestionnaireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
