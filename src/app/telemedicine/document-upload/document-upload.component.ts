import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MedicalDocumentService } from '../services/medical-document.service';
import { UploadDocumentDto } from '../models/medical-document.model';

@Component({
  selector: 'app-document-upload',
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.css']
})
export class DocumentUploadComponent implements OnInit {
  consultationId = '';
  patientId = '';
  selectedFile: File | null = null;
  
  title = '';
  description = '';
  type: 'lab-result' | 'imaging' | 'report' | 'prescription' | 'other' = 'lab-result';
  examDate = '';
  laboratory = '';
  radiologist = '';

  loading = false;
  error: string | null = null;
  currentUserId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: MedicalDocumentService
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user._id; // MongoDB uses _id
    
    this.consultationId = this.route.snapshot.paramMap.get('consultationId') || '';
    this.patientId = this.route.snapshot.queryParamMap.get('patientId') || '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onSubmit(): void {
    if (!this.selectedFile || !this.title.trim() || !this.patientId) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    const dto: UploadDocumentDto = {
      file: this.selectedFile,
      patientId: this.patientId,
      consultationId: this.consultationId || undefined,
      type: this.type,
      title: this.title,
      description: this.description,
      examDate: this.examDate || undefined,
      laboratory: this.laboratory || undefined,
      radiologist: this.radiologist || undefined
    };

    this.loading = true;
    this.error = null;

    this.documentService.upload(dto, this.currentUserId).subscribe({
      next: () => {
        alert('Document uploadé avec succès!');
        if (this.consultationId) {
          this.router.navigate(['/telemedicine/consultation', this.consultationId]);
        } else {
          this.router.navigate(['/telemedicine/documents']);
        }
      },
      error: (err) => {
        this.error = 'Erreur lors de l\'upload du document';
        console.error(err);
        this.loading = false;
      }
    });
  }

  cancel(): void {
    if (this.consultationId) {
      this.router.navigate(['/telemedicine/consultation', this.consultationId]);
    } else {
      this.router.navigate(['/telemedicine/documents']);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}
