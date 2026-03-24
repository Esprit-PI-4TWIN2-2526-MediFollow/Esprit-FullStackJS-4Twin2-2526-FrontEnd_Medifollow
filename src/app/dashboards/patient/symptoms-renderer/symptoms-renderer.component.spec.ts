import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymptomsRendererComponent } from './symptoms-renderer.component';

describe('SymptomsRendererComponent', () => {
  let component: SymptomsRendererComponent;
  let fixture: ComponentFixture<SymptomsRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SymptomsRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SymptomsRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
