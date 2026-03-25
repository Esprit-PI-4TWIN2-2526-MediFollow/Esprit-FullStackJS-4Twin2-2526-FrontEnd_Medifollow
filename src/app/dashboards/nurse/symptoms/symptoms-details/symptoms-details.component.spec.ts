import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymptomsDetailsComponent } from './symptoms-details.component';

describe('SymptomsDetailsComponent', () => {
  let component: SymptomsDetailsComponent;
  let fixture: ComponentFixture<SymptomsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SymptomsDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SymptomsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
