import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Service, ServiceManagementService } from './service-management.service';

const mockHoraire = { jour: 'Lundi', ouverture: '08:00', fermeture: '17:00' };

const mockService: Service = {
  _id: '1',
  nom: 'Urgences',
  description: 'Service des urgences',
  localisation: 'Bâtiment A',
  type: 'MEDICAL',
  telephone: '71000000',
  email: 'urgences@hopital.tn',
  capacite: 50,
  statut: 'ACTIF',
  tempsAttenteMoyen: 30,
  estUrgence: true,
  horaires: [mockHoraire],
  responsableId: 'resp-001',
};

describe('ServiceManagementService', () => {
  let service: ServiceManagementService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/services';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ServiceManagementService],
    });
    service = TestBed.inject(ServiceManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Vérifie qu'aucune requête HTTP inattendue n'a été émise
    httpMock.verify();
  });

  // ─── Instanciation ───────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── getAll ──────────────────────────────────────────────────────────────────

  describe('getAll()', () => {
    it('should return an array of services via GET', () => {
      const mockServices: Service[] = [mockService];

      service.getAll().subscribe((services) => {
        expect(services.length).toBe(1);
        expect(services).toEqual(mockServices);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockServices);
    });

    it('should return an empty array when there are no services', () => {
      service.getAll().subscribe((services) => {
        expect(services).toEqual([]);
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush([]);
    });
  });

  // ─── getOne ──────────────────────────────────────────────────────────────────

  describe('getOne()', () => {
    it('should return a single service by id via GET', () => {
      service.getOne('1').subscribe((s) => {
        expect(s).toEqual(mockService);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockService);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should create a service via POST and return the created service', () => {
      const { _id, createdAt, updatedAt, ...payload } = mockService;

      service.create(payload).subscribe((s) => {
        expect(s).toEqual(mockService);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockService);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should update a service via PUT and return the updated service', () => {
      const patch: Partial<Service> = { nom: 'Urgences Modifié', capacite: 60 };
      const updatedService = { ...mockService, ...patch };

      service.update('1', patch).subscribe((s) => {
        expect(s).toEqual(updatedService);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(patch);
      req.flush(updatedService);
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────────

  // describe('delete()', () => {
  //   it('should delete a service via DELETE and return void', () => {
  //     service.delete('1').subscribe((result) => {
  //       expect(result).toBeUndefined();
  //     });

  //     const req = httpMock.expectOne(`${apiUrl}/1`);
  //     expect(req.request.method).toBe('DELETE');
  //     req.flush(null);
  //   });
  // });

  // ─── activate ────────────────────────────────────────────────────────────────

  describe('activate()', () => {
    it('should activate a service via PUT and return the updated service', () => {
      const activatedService: Service = { ...mockService, statut: 'ACTIF' };

      service.activate('1').subscribe((s) => {
        expect(s.statut).toBe('ACTIF');
        expect(s).toEqual(activatedService);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/activate`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(activatedService);
    });
  });

  // ─── deactivate ──────────────────────────────────────────────────────────────

  describe('deactivate()', () => {
    it('should deactivate a service via PUT and return the updated service', () => {
      const deactivatedService: Service = { ...mockService, statut: 'INACTIF' };

      service.deactivate('1').subscribe((s) => {
        expect(s.statut).toBe('INACTIF');
        expect(s).toEqual(deactivatedService);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/deactivate`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(deactivatedService);
    });
  });

  // ─── generateWithAI ──────────────────────────────────────────────────────────

  describe('generateWithAI()', () => {
    it('should call POST /ai-generate with the description and return a partial service', () => {
      const description = 'Un service de cardiologie pour adultes';
      const aiResult: Partial<Service> = {
        nom: 'Cardiologie',
        description,
        type: 'MEDICAL',
        estUrgence: false,
      };

      service.generateWithAI(description).subscribe((result) => {
        expect(result).toEqual(aiResult);
      });

      const req = httpMock.expectOne(`${apiUrl}/ai-generate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ description });
      req.flush(aiResult);
    });
  });

  // ─── Gestion d'erreurs HTTP ───────────────────────────────────────────────────

  describe('HTTP error handling', () => {
    it('getAll() should propagate a 500 server error', () => {
      service.getAll().subscribe({
        next: () => fail('Expected an error'),
        error: (err) => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('getOne() should propagate a 404 error when service is not found', () => {
      service.getOne('inexistant').subscribe({
        next: () => fail('Expected an error'),
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/inexistant`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('create() should propagate a 400 error on bad payload', () => {
      const { _id, createdAt, updatedAt, ...payload } = mockService;

      service.create(payload).subscribe({
        next: () => fail('Expected an error'),
        error: (err) => {
          expect(err.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });
});
