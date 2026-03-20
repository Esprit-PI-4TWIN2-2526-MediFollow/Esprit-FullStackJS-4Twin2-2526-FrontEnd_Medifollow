import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardQuestionnaireComponent } from './dashboard-questionnaire.component';

describe('DashboardQuestionnaireComponent', () => {
  let component: DashboardQuestionnaireComponent;
  let fixture: ComponentFixture<DashboardQuestionnaireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardQuestionnaireComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardQuestionnaireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
