import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { QuestionnaireRendererComponent } from './questionnaire-renderer.component';
import { buildComponentTestingModule } from '../../../testing/test-bed-helpers';

describe('QuestionnaireRendererComponent', () => {
  let component: QuestionnaireRendererComponent;
  let fixture: ComponentFixture<QuestionnaireRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(
      buildComponentTestingModule(QuestionnaireRendererComponent, {
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

    fixture = TestBed.createComponent(QuestionnaireRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
