import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { QuestionnaireService } from './questionnaire.service';
import { Questionnaire } from '../models/questionnaire';

describe('QuestionnaireService', () => {
  let service: QuestionnaireService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:3000/questionnaires';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QuestionnaireService]
    });
    service = TestBed.inject(QuestionnaireService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Vérifier qu'aucune requête n'est en attente
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should fetch all questionnaires', () => {
      const mockQuestionnaires: Questionnaire[] = [
        { _id: '1', title: 'Q1', status: 'active', medicalService: 'Cardiology', questions: [], responsesCount: 0 },
        { _id: '2', title: 'Q2', status: 'inactive', medicalService: 'Neurology', questions: [], responsesCount: 0 }
      ];

      service.getAll().subscribe(data => {
        expect(data.length).toBe(2);
        expect(data).toEqual(mockQuestionnaires);
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockQuestionnaires);
    });

    it('should filter questionnaires by medicalService', () => {
      const mockData: Questionnaire[] = [];

      service.getAll('Cardiology').subscribe();

      const req = httpMock.expectOne(request =>
        request.url === API_URL && request.params.get('medicalService') === 'Cardiology'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });
  });

  describe('getOne', () => {
    it('should fetch a single questionnaire by id', () => {
      const id = '1';
      const mockQuestionnaire: Questionnaire = {
        _id: id,
        title: 'Test Q',
        status: 'active',
        medicalService: 'Cardiology',
        questions: [],
        responsesCount: 0
      };

      service.getOne(id).subscribe(data => {
        expect(data).toEqual(mockQuestionnaire);
      });

      const req = httpMock.expectOne(`${API_URL}/${id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockQuestionnaire);
    });
  });

  describe('create', () => {
    it('should create a new questionnaire', () => {
      const newQuestionnaire = { title: 'New Q', medicalService: 'Oncology' };

      service.create(newQuestionnaire).subscribe();

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newQuestionnaire);
      req.flush({
        _id: '3',
        title: newQuestionnaire.title,
        medicalService: newQuestionnaire.medicalService,
        status: 'active',
        questions: [],
        responsesCount: 0
      } satisfies Questionnaire);
    });
  });

  describe('update', () => {
    it('should update a questionnaire', () => {
      const id = '1';
      const updates = { title: 'Updated Q' };

      service.update(id, updates).subscribe();

      const req = httpMock.expectOne(`${API_URL}/${id}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updates);
      req.flush({
        _id: id,
        title: updates.title ?? 'Updated Q',
        medicalService: 'Cardiology',
        status: 'active',
        questions: [],
        responsesCount: 0
      } satisfies Questionnaire);
    });
  });

  describe('delete', () => {
    it('should delete a questionnaire', () => {
      const id = '1';

      service.delete(id).subscribe();

      const req = httpMock.expectOne(`${API_URL}/${id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle questionnaire status', () => {
      const id = '1';

      service.toggleStatus(id).subscribe();

      const req = httpMock.expectOne(`${API_URL}/${id}/toggle-status`);
      expect(req.request.method).toBe('PATCH');
      req.flush({
        _id: id,
        title: 'Test Q',
        medicalService: 'Cardiology',
        status: 'inactive',
        questions: [],
        responsesCount: 0
      } satisfies Questionnaire);
    });
  });
});
