
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { ResumeService } from '../../core/services/resume.service';
import { AuthService } from '../../core/services/auth.service';
import { Header } from '../../shared/components/header/header';

@Component({
  selector: 'app-analyzer',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, Header],
  templateUrl: './analyzer.html',
  styleUrl: './analyzer.css',
})
export class Analyzer {
  private readonly resumeService = inject(ResumeService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly selectedFile = signal<File | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly isDragging = signal(false);

  readonly maxFileSize = 5 * 1024 * 1024;

  readonly jobDescriptionControl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(30),
      Validators.maxLength(20000),
    ],
  });

  readonly fileSizeLabel = computed(() => {
    const file = this.selectedFile();

    if (!file) {
      return '';
    }

    return file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
  });

  get descriptionLength(): number {
    return this.jobDescriptionControl.value.length;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.errorMessage.set('');

    if (file) {
      this.setFile(file);
    }

    // Allow selecting the same file again.
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    this.errorMessage.set('');

    const file = event.dataTransfer?.files?.[0];

    if (file) {
      this.setFile(file);
    }
  }

  private setFile(file: File): void {
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf || !file.name.toLowerCase().endsWith('.pdf')) {
      this.selectedFile.set(null);
      this.errorMessage.set('Please select a PDF resume.');
      return;
    }

    if (file.size === 0) {
      this.selectedFile.set(null);
      this.errorMessage.set('The selected PDF is empty.');
      return;
    }

    if (file.size > this.maxFileSize) {
      this.selectedFile.set(null);
      this.errorMessage.set('Your resume must be smaller than 5 MB.');
      return;
    }

    this.selectedFile.set(file);
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.errorMessage.set('');
  }


  analyze(): void {
    this.errorMessage.set('');

    const file = this.selectedFile();
    const description = this.jobDescriptionControl.value.trim();

    if (!file) {
      this.errorMessage.set('Please upload your resume PDF.');
      return;
    }

    if (description.length < 30 || description.length > 20000) {
      this.jobDescriptionControl.markAsTouched();
      this.errorMessage.set(
        'Enter a job description between 30 and 20,000 characters.',
      );
      return;
    }

    if (this.loading()) {
      return;
    }

    this.loading.set(true);

    const isGuest = !this.authService.isLoggedIn();

    this.resumeService
      .analyzeResume(
        {
          resume: file,
          jobDescription: description,
        },
        isGuest,
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          const analysisId = result.analysisId || result.id;

          if (!analysisId) {
            this.errorMessage.set(
              'The analysis completed, but the server did not return an analysis ID.',
            );
            return;
          }

          this.router.navigate(['/results', analysisId], {
            state: {
              analysis: result,
              isGuest,
            },
          });
        },
        error: (error) => {
          const message = error?.error?.message;

          this.errorMessage.set(
            Array.isArray(message)
              ? message.join(' ')
              : typeof message === 'string'
                ? message
                : 'Unable to analyze your resume. Please try again.',
          );
        },
      });
  }


  reset(): void {
    this.selectedFile.set(null);
    this.jobDescriptionControl.reset('');
    this.errorMessage.set('');
    this.isDragging.set(false);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/']);
  }
}
