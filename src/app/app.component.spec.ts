import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { buildComponentTestingModule } from './testing/test-bed-helpers';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule(
      buildComponentTestingModule(AppComponent),
    ).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
