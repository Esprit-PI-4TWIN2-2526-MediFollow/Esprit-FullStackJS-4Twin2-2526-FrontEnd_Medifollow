import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymptomsListComponent } from './symptoms-list.component';

describe('SymptomsListComponent', () => {
  let component: SymptomsListComponent;
  let fixture: ComponentFixture<SymptomsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SymptomsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SymptomsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
