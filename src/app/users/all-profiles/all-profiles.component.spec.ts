import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllProfilesComponent } from './all-profiles.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('AllProfilesComponent', () => {
  let component: AllProfilesComponent;
  let fixture: ComponentFixture<AllProfilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AllProfilesComponent],
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AllProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});