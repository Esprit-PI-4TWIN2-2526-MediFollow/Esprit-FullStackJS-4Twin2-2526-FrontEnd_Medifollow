import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { DashboardSymptomsComponent } from './dashboard-symptoms.component';
import { SymptomForm, SymptomService } from '../services/symptom.service';

describe('DashboardSymptomsComponent', () => {
  let component: DashboardSymptomsComponent;
  let fixture: ComponentFixture<DashboardSymptomsComponent>;
  let symptomService: jasmine.SpyObj<SymptomService>;
  let router: Router;

  const forms: SymptomForm[] = [
    {
      _id: 'form-1',
      title: 'Daily Pain Follow-up',
      status: 'active',
      responsesCount: 2,
      createdAt: '2026-02-01T10:00:00.000Z',
      questions: [{ _id: 'question-1', label: 'Pain level', type: 'scale' }],
    },
    {
      _id: 'form-2',
      title: 'Respiratory Check',
      status: 'inactive',
      responsesCount: 0,
      questions: [{ _id: 'question-2', label: 'Oxygen level', type: 'number' }],
    },
  ];

  beforeEach(async () => {
    symptomService = jasmine.createSpyObj<SymptomService>('SymptomService', [
      'getForms',
      'deleteForm',
    ]);
    symptomService.getForms.and.returnValue(of(forms));
    symptomService.deleteForm.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      declarations: [DashboardSymptomsComponent],
      imports: [CommonModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: SymptomService, useValue: symptomService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(console, 'error');

    fixture = TestBed.createComponent(DashboardSymptomsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load symptoms forms on init', () => {
    expect(component).toBeTruthy();
    expect(symptomService.getForms).toHaveBeenCalled();
    expect(component.forms).toEqual(forms);
    expect(component.isLoading).toBeFalse();
  });

  it('should expose an error message when forms cannot be loaded', () => {
    symptomService.getForms.and.returnValue(throwError(() => new Error('network error')));

    component.loadForms();

    expect(component.forms).toEqual(forms);
    expect(component.errorMessage).toBe('Unable to load forms right now.');
    expect(component.isLoading).toBeFalse();
  });

  it('should filter forms by title and status', () => {
    component.searchTerm = 'pain';
    component.statusFilter = 'active';

    expect(component.filteredForms.map((form) => form._id)).toEqual(['form-1']);

    component.statusFilter = 'inactive';

    expect(component.filteredForms).toEqual([]);
  });

  it('should reset pagination when the search input changes', () => {
    component.currentPage = 2;

    component.onSearchInput({ target: { value: 'respiratory' } } as unknown as Event);

    expect(component.searchTerm).toBe('respiratory');
    expect(component.currentPage).toBe(1);
  });

  it('should paginate forms and ignore invalid page changes', () => {
    component.itemsPerPage = 1;
    component.currentPage = 1;

    expect(component.totalPages).toBe(2);
    expect(component.totalPagesArray).toEqual([1, 2]);
    expect(component.paginatedForms.map((form) => form._id)).toEqual(['form-1']);

    component.goToPage(2);
    expect(component.paginatedForms.map((form) => form._id)).toEqual(['form-2']);

    component.goToPage(3);
    expect(component.currentPage).toBe(2);
  });

  it('should navigate to create, edit and view screens', () => {
    component.goToCreate();
    component.goToEdit('form-1');
    component.goToView('form-2');

    expect(router.navigate).toHaveBeenCalledWith(['/symptoms/builder']);
    expect(router.navigate).toHaveBeenCalledWith(['/symptoms/builder', 'form-1']);
    expect(router.navigate).toHaveBeenCalledWith(['/symptoms/view', 'form-2']);
  });

  it('should delete a confirmed form and keep the current page valid', fakeAsync(() => {
    const swalSpy = spyOn(Swal, 'fire').and.returnValues(
      Promise.resolve({ isConfirmed: true } as any),
      Promise.resolve({} as any)
    );
    component.itemsPerPage = 1;
    component.currentPage = 2;

    component.deleteForm('form-2', 'Respiratory Check');
    flushMicrotasks();

    expect(symptomService.deleteForm).toHaveBeenCalledWith('form-2');
    expect(component.forms.map((form) => form._id)).toEqual(['form-1']);
    expect(component.currentPage).toBe(1);
    expect(swalSpy).toHaveBeenCalledTimes(2);
  }));

  it('should keep active as the default status when none is provided', () => {
    expect(component.getFormStatus({ title: 'Untyped form', questions: [] })).toBe('active');
  });
});
