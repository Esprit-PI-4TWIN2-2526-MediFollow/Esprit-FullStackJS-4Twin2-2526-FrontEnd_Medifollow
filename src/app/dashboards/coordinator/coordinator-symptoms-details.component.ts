import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CoordinatorSymptomsResponse,
  CoordinatorSymptomsService
} from '../../services/coordinator-symptoms.service';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { SuggestionsService } from '../../services/suggestion/suggestion.service';

@Component({
  selector: 'app-coordinator-symptoms-details',
  templateUrl: './coordinator-symptoms-details.component.html',
  styleUrl: './coordinator-symptoms-details.component.css'
})
export class CoordinatorSymptomsDetailsComponent implements OnInit {
  response: CoordinatorSymptomsResponse | null = null;
  responseId = '';
  note = '';
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

    inlineSuggestion = ''; // texte grisé après le curseur

  suggestions: string[] = [];
  isSuggestionsLoading = false;
  showSuggestions = false;
  realTimeCompletions: string[] = [];
  medicalTerms: string[] = [];

   private destroy$ = new Subject<void>();
  private noteInput$ = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coordinatorSymptomsService: CoordinatorSymptomsService,
        private suggestionsService: SuggestionsService

  ) {}


ngOnInit(): void {
  this.responseId = this.route.snapshot.paramMap.get('responseId') || '';

  // Décoder le JWT directement (pas besoin de librairie)
  const token = localStorage.getItem('accessToken') || '';
  let userId = '';
  let department = '';

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🎫 JWT payload:', payload);
      userId = payload.sub || payload._id || payload.id || '';
      department = payload.assignedDepartment || payload.department || '';
    } catch (e) {
      console.error('JWT decode error:', e);
    }
  }

  // Fallback sur localStorage user
  if (!userId || !department) {
    const raw = localStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;
    console.log('👤 User from localStorage:', user);
    userId = userId || user?._id || '';
    department = department || user?.assignedDepartment || user?.department || '';
  }

  console.log('🔌 Final connect:', { userId, department });

  if (userId && department) {
    this.suggestionsService.connect(userId, department);
  } else {
    console.error('❌ Cannot connect: missing userId or department');
  }

  this.suggestionsService.onRealTimeSuggestions()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => {
      console.log('📥 Suggestions:', data);
      const first = data.suggestions.completions?.[0]
                 || data.suggestions.medicalTerms?.[0]
                 || '';
      this.inlineSuggestion = first;
    });

  this.noteInput$
    .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
    .subscribe(note => {
      console.log('📤 Emitting for:', note);
      if (note.length >= 3) {
        this.suggestionsService.getRealTimeSuggestions(note, this.responseId);
      } else {
        this.inlineSuggestion = '';
      }
    });

  this.loadDetails();
}

  goBack(): void {
    this.router.navigate(['/coordinator/symptoms-review']);
  }

  // onNoteInput(event: Event): void {
  //   this.note = (event.target as HTMLTextAreaElement).value;
  // }

  validateResponse(): void {
    if (!this.responseId || this.isSubmitting) {
      return;
    }
    this.submit('validate');
  }

  reportIssue(): void {
    if (!this.responseId || this.isSubmitting) {
      return;
    }
    this.submit('issue');
  }

  get vitalsRows(): Array<{ label: string; value: string }> {
    if (!this.response) {
      return [];
    }

    return Object.entries(this.response.vitals).map(([key, value]) => ({
      label: this.humanizeKey(key),
      value
    }));
  }

  private loadDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.coordinatorSymptomsService.getResponseDetails(this.responseId).subscribe({
      next: (response) => {
        this.response = response;
        this.note = response.validationNote;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load the symptoms response details.';
        this.isLoading = false;
      }
    });
  }

  private submit(action: 'validate' | 'issue'): void {
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = action === 'validate'
      ? this.coordinatorSymptomsService.validateResponse(this.responseId, this.note)
      : this.coordinatorSymptomsService.reportIssue(this.responseId, this.note);

    request.subscribe({
      next: (response) => {
        this.response = response;
        this.note = response.validationNote;
        this.successMessage = action === 'validate'
          ? 'Symptoms response validated successfully.'
          : 'Issue reported successfully.';
        this.isSubmitting = false;
      },
      error: () => {
        this.errorMessage = action === 'validate'
          ? 'Unable to validate this response.'
          : 'Unable to report an issue for this response.';
        this.isSubmitting = false;
      }
    });
  }

  private humanizeKey(value: string): string {
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/^\w/, (letter) => letter.toUpperCase());
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.suggestionsService.disconnect();
  }

  onNoteInput(event: Event): void {
    this.note = (event.target as HTMLTextAreaElement).value;
    this.inlineSuggestion = ''; // reset pendant la frappe
    this.noteInput$.next(this.note);
  }

  onNoteKeydown(event: KeyboardEvent): void {
    if (!this.inlineSuggestion) return;

    if (event.key === 'Tab') {
      event.preventDefault();
      this.note = this.note + this.inlineSuggestion + ' ';
      this.inlineSuggestion = '';
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.inlineSuggestion = '';
    }
  }
  get isAlreadyValidated(): boolean {
  return this.response?.validated === true;
}
}

