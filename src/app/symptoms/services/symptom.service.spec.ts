import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { SymptomForm, SymptomService } from './symptom.service';

describe('SymptomService', () => {
  let service: SymptomService;
  let httpMock: HttpTestingController;

  const apiUrl = 'http://localhost:3000/symptoms';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(SymptomService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a symptoms form through the form endpoint', () => {
    const payload: Partial<SymptomForm> = {
      title: 'Daily follow-up',
      medicalService: 'Cardiology',
      questions: [
        { label: 'Pain level', type: 'scale', required: true, order: 0 },
      ],
    };
    const response: SymptomForm = {
      _id: 'form-1',
      title: 'Daily follow-up',
      questions: payload.questions ?? [],
    };

    service.createForm(payload).subscribe((createdForm) => {
      expect(createdForm).toEqual(response);
    });

    const request = httpMock.expectOne(`${apiUrl}/form`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(response);
  });

  it('should update a symptoms form by id', () => {
    const payload: Partial<SymptomForm> = {
      title: 'Updated follow-up',
      status: 'inactive',
    };

    service.updateForm('form-1', payload).subscribe((updatedForm) => {
      expect(updatedForm.title).toBe('Updated follow-up');
      expect(updatedForm.status).toBe('inactive');
    });

    const request = httpMock.expectOne(`${apiUrl}/form/form-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush({ _id: 'form-1', title: 'Updated follow-up', status: 'inactive', questions: [] });
  });

  it('should fallback to the forms list when getFormById returns an error', () => {
    const fallbackForms: SymptomForm[] = [
      { _id: 'other-form', title: 'Other form', questions: [] },
      { _id: 'form-1', title: 'Fallback form', questions: [] },
    ];

    service.getFormById('form-1').subscribe((form) => {
      expect(form).toEqual(fallbackForms[1]);
    });

    const directRequest = httpMock.expectOne(`${apiUrl}/form/form-1`);
    expect(directRequest.request.method).toBe('GET');
    directRequest.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

    const fallbackRequest = httpMock.expectOne(`${apiUrl}/form`);
    expect(fallbackRequest.request.method).toBe('GET');
    fallbackRequest.flush(fallbackForms);
  });

  it('should fail when getFormById cannot find the form in the fallback list', () => {
    let receivedError: Error | undefined;

    service.getFormById('missing-form').subscribe({
      error: (error) => {
        receivedError = error;
      },
    });

    httpMock
      .expectOne(`${apiUrl}/form/missing-form`)
      .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    httpMock.expectOne(`${apiUrl}/form`).flush([{ _id: 'form-1', title: 'Known form', questions: [] }]);

    expect(receivedError).toEqual(jasmine.any(Error));
    expect(receivedError?.message).toBe('Symptoms form not found');
  });

  it('should submit a response to the response endpoint', () => {
    const payload = {
      formId: 'form-1',
      answers: [
        { questionId: 'question-1', value: 7 },
        { questionId: 'question-2', value: true },
      ],
    };

    service.submitResponse(payload).subscribe((response) => {
      expect(response).toEqual({ saved: true });
    });

    const request = httpMock.expectOne(`${apiUrl}/response`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ saved: true });
  });

  it('should request AI-generated symptoms questions with the selected category', () => {
    service
      .generateQuestionsWithAI('Post surgery', 'Daily monitoring', 3, 'subjective_symptoms')
      .subscribe((response) => {
        expect(response.questions.length).toBe(1);
        expect(response.questions[0].type).toBe('scale');
      });

    const request = httpMock.expectOne('http://localhost:3000/ai/generate-questions');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      medicalService: 'Symptoms Monitoring',
      title: 'Post surgery',
      description: 'Daily monitoring',
      count: 3,
      category: 'subjective_symptoms',
    });
    request.flush({
      questions: [
        { label: 'Pain level', type: 'scale', category: 'subjective_symptoms' },
      ],
    });
  });
});
