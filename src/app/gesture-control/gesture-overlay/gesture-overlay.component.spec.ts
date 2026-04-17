import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestureOverlayComponent } from './gesture-overlay.component';

describe('GestureOverlayComponent', () => {
  let component: GestureOverlayComponent;
  let fixture: ComponentFixture<GestureOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestureOverlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestureOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
