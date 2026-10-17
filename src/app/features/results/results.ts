
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import {
  ChatMessage,
  ChatResponse,
  ResumeAnalysis,
  ResumeService,
} from '../../core/services/resume.service';
import { Header } from '../../shared/components/header/header';

@Component({
  selector: 'app-results',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, Header],
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class Results {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly resumeService = inject(ResumeService);

  readonly analysis = signal<ResumeAnalysis | null>(null);
  readonly messages = signal<ChatMessage[]>([]);
  readonly loadingHistory = signal(false);
  readonly sendingMessage = signal(false);
  readonly errorMessage = signal('');
  readonly chatError = signal('');

  readonly chatControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(4000)],
  });

  readonly scoreLabel = computed(() => {
    const score = this.analysis()?.matchScore ?? 0;

    if (score >= 80) return 'Strong match';
    if (score >= 60) return 'Good potential';
    return 'Needs improvement';
  });

  readonly scoreDescription = computed(() => {
    const score = this.analysis()?.matchScore ?? 0;

    if (score >= 80) {
      return 'Your resume appears well aligned with this role. Review the recommendations to strengthen it further.';
    }

    if (score >= 60) {
      return 'Your resume has relevant experience, but there may be opportunities to improve how it matches this role.';
    }

    return 'Focus on making your relevant experience and demonstrated skills easier to identify.';
  });

  readonly scoreRingBackground = computed(() => {
    const score = this.analysis()?.matchScore ?? 0;
    const safeScore = Math.min(100, Math.max(0, score));

    return `conic-gradient(#a78bfa ${safeScore * 3.6}deg, #33313f 0deg)`;
  });

  constructor() {
    const navigationAnalysis = history.state?.analysis as
      | ResumeAnalysis
      | undefined;

    if (navigationAnalysis) {
      this.analysis.set(navigationAnalysis);
      this.addWelcomeMessage();
      return;
    }

    const analysisId = this.route.snapshot.paramMap.get('analysisId');

    if (!analysisId) {
      this.errorMessage.set('No analysis was selected.');
      return;
    }

    // Only MongoDB ObjectId-shaped IDs can be looked up in saved history.
    // Guest analysis IDs are UUIDs and currently have no retrieval endpoint.
    if (!/^[a-fA-F0-9]{24}$/.test(analysisId)) {
      this.errorMessage.set(
        'This guest analysis is no longer available on this page. Please analyze your resume again.',
      );
      return;
    }

    this.loadingHistory.set(true);

    this.resumeService
      .getHistoryItem(analysisId)
      .pipe(finalize(() => this.loadingHistory.set(false)))
      .subscribe({
        next: (result) => {
          this.analysis.set(result);
          this.addWelcomeMessage();
        },
        error: () => {
          this.errorMessage.set(
            'Unable to load this saved analysis. Please sign in and try again.',
          );
        },
      });
  }

  private addWelcomeMessage(): void {
    if (this.messages().length > 0) return;

    this.messages.set([
      {
        role: 'MODEL',
        content:
          'Hi! I can help you understand your resume results, improve your bullet points, and prepare for this job. What would you like to work on?',
      },
    ]);
  }

  sendMessage(suggestion?: string): void {
    const message = (suggestion ?? this.chatControl.value).trim();
    const analysis = this.analysis();

    if (this.sendingMessage() || !message) {
      return;
    }

    if (message.length > 4000) {
      this.chatError.set('Your message cannot exceed 4,000 characters.');
      return;
    }

    if (!analysis) {
      this.chatError.set(
        'Resume analysis not found. Please analyze your resume again.',
      );
      return;
    }

    const analysisId = analysis.analysisId || analysis.id;

    if (!analysisId) {
      this.chatError.set(
        'Analysis ID is missing. Please analyze your resume again.',
      );
      return;
    }

    this.chatError.set('');
    this.sendingMessage.set(true);

    this.messages.update((current) => [
      ...current,
      { role: 'USER', content: message },
    ]);

    this.chatControl.setValue('');

    this.resumeService
      .chat(analysisId, message)
      .pipe(finalize(() => this.sendingMessage.set(false)))
      .subscribe({
        next: (response: ChatResponse) => {
          const lastModelMessage = response.messages
            ?.slice()
            .reverse()
            .find((item) => item.role === 'MODEL');

          const reply =
            response.reply ||
            response.message ||
            lastModelMessage?.content;

          if (!reply) {
            this.chatError.set(
              'The AI response was empty. Please try another question.',
            );
            return;
          }

          this.messages.update((current) => [
            ...current,
            { role: 'MODEL', content: reply },
          ]);
        },
        error: (error) => {
          const errorMessage = error?.error?.message;

          this.chatError.set(
            Array.isArray(errorMessage)
              ? errorMessage.join(' ')
              : typeof errorMessage === 'string'
                ? errorMessage
                : 'Unable to get an AI response. Please try again.',
          );
        },
      });
  }

  onChatSubmit(event: SubmitEvent): void {
    event.preventDefault();
    event.stopPropagation();

    console.log('Chat form submitted');

    this.sendMessage();
  }

  useSuggestion(question: string): void {
    this.sendMessage(question);
  }

  startNewAnalysis(): void {
    this.router.navigateByUrl('/');
  }

  trackMessage(index: number, message: ChatMessage): string {
    return `${message.role}-${index}-${message.createdAt ?? ''}`;
  }
}
