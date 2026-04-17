import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestureSettingsComponent } from './gesture-settings.component';

describe('GestureSettingsComponent', () => {
  let component: GestureSettingsComponent;
  let fixture: ComponentFixture<GestureSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestureSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestureSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
