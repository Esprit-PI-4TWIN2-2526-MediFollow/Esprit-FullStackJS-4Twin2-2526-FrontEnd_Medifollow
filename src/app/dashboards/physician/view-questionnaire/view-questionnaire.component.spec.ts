import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { ViewQuestionnaireComponent } from './view-questionnaire.component';
import { buildComponentTestingModule } from '../../../testing/test-bed-helpers';

describe('ViewQuestionnaireComponent', () => {
  let component: ViewQuestionnaireComponent;
  let fixture: ComponentFixture<ViewQuestionnaireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(
      buildComponentTestingModule(ViewQuestionnaireComponent, {
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

    fixture = TestBed.createComponent(ViewQuestionnaireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
