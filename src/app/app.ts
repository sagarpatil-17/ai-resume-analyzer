import { HttpClient } from '@angular/common/http';
import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '../environments/environment';
import { catchError, of } from 'rxjs';

interface ResumeAnalysis {
  matchScore: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
}

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/resume/analyze`;

  readonly jobDescriptionControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(30)],
  });

  // State Signals
  readonly selectedFile = signal<File | null>(null);
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');

  // Trigger signal for the rxResource request
  private readonly analyzeTrigger = signal<FormData | null>(null);

  // Declarative Resource with correct Angular 19/20+ signatures
  private readonly analysisResource = rxResource<ResumeAnalysis | null, FormData | null>({
    // 'params' replaces 'request'
    params: () => this.analyzeTrigger(),

    // 'stream' replaces 'loader'
    stream: ({ params }) => {
      // If no data has been submitted yet, don't execute the HTTP call
      if (!params) return of(null);

      return this.http.post<ResumeAnalysis>(this.apiUrl, params).pipe(
        catchError((error) => {
          const message = error?.error?.message;
          const parsedMessage = Array.isArray(message)
            ? message.join(', ')
            : typeof message === 'string'
              ? message
              : 'Unable to analyze the resume. Please try again.';

          this.errorMessage.set(parsedMessage);
          return of(null);
        })
      );
    }
  });

  // Computed Signals derived from the resource state
  readonly analysis = computed(() => this.analysisResource.value() ?? null);
  readonly loading = computed(() => this.analysisResource.isLoading());

  readonly scoreLabel = computed(() => {
    const currentAnalysis = this.analysis();
    if (!currentAnalysis) return '';

    if (currentAnalysis.matchScore >= 80) return 'Strong match';
    if (currentAnalysis.matchScore >= 60) return 'Good potential';
    return 'Needs improvement';
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.clearMessagesAndAnalysis();

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.selectedFile.set(null);
      input.value = '';
      this.errorMessage.set('Please select a PDF file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.selectedFile.set(null);
      input.value = '';
      this.errorMessage.set('The maximum file size is 5 MB.');
      return;
    }

    this.selectedFile.set(file);
    this.successMessage.set('Resume selected successfully.');
  }

  analyze(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.analyzeTrigger.set(null); // Reset previous request state

    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Please upload your resume PDF.');
      return;
    }

    if (this.jobDescriptionControl.invalid) {
      this.jobDescriptionControl.markAsTouched();
      this.errorMessage.set('Please enter a job description with at least 30 characters.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file, file.name);
    formData.append('jobDescription', this.jobDescriptionControl.value.trim());

    // Setting this signal automatically fires the rxResource loader
    this.analyzeTrigger.set(formData);
  }

  reset(): void {
    this.selectedFile.set(null);
    this.analyzeTrigger.set(null);
    this.clearMessagesAndAnalysis();
    this.jobDescriptionControl.reset('');

    const input = document.getElementById('resume-file') as HTMLInputElement | null;
    if (input) {
      input.value = '';
    }
  }

  private clearMessagesAndAnalysis(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.analyzeTrigger.set(null);
  }
}