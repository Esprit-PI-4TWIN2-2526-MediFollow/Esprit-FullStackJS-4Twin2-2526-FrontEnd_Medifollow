import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionnaireRendererComponent } from './questionnaire-renderer.component';

describe('QuestionnaireRendererComponent', () => {
  let component: QuestionnaireRendererComponent;
  let fixture: ComponentFixture<QuestionnaireRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuestionnaireRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionnaireRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
