
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import {
  ResumeAnalysis,
  ResumeService,
} from '../../core/services/resume.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-history',
  imports: [CommonModule, RouterModule],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History {
  private readonly resumeService = inject(ResumeService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly analyses = signal<ResumeAnalysis[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly searchTerm = signal('');

  readonly user = this.authService.user;

  constructor() {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.resumeService
      .getHistory()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.analyses.set(response);
        },
        error: (error) => {
          if (error.status === 401 || error.status === 403) {
            this.authService.logout();
            void this.router.navigate(['/login'], {
              queryParams: { returnUrl: '/history' },
            });
            return;
          }

          const message = error?.error?.message;

          this.errorMessage.set(
            Array.isArray(message)
              ? message.join(' ')
              : typeof message === 'string'
                ? message
                : 'Unable to load your analysis history. Please try again.',
          );
        },
      });
  }

  filteredAnalyses(): ResumeAnalysis[] {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.analyses();
    }

    return this.analyses().filter((analysis) =>
      [
        analysis.summary,
        ...(analysis.matchingSkills ?? []),
        ...(analysis.missingSkills ?? []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }

  openAnalysis(analysis: ResumeAnalysis): void {
    const id = analysis.id || analysis.analysisId;

    if (!id) {
      this.errorMessage.set('This analysis does not have a valid ID.');
      return;
    }

    void this.router.navigate(['/results', id], {
      state: {
        analysis,
        isGuest: false,
      },
    });
  }

  trackByAnalysis(
    index: number,
    analysis: ResumeAnalysis,
  ): string | number {
    return analysis.id || analysis.analysisId || index;
  }
}
