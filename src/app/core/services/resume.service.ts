
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface ResumeAnalysis {
  id?: string;
  analysisId: string;
  matchScore: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
}

export interface AnalyzeResumeRequest {
  resume: File;
  jobDescription: string;
}

export interface ChatMessage {
  id?: string;
  role: 'USER' | 'MODEL';
  content: string;
  createdAt?: string;
}

export interface ChatResponse {
  reply: string;
  message?: string;
  messages?: ChatMessage[];
}

@Injectable({
  providedIn: 'root',
})
export class ResumeService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/resume`;

  analyzeResume(
    request: AnalyzeResumeRequest,
    guest = true,
  ): Observable<ResumeAnalysis> {
    const formData = new FormData();

    formData.append('resume', request.resume, request.resume.name);
    formData.append(
      'jobDescription',
      request.jobDescription.trim(),
    );

    const endpoint = guest
      ? `${this.apiUrl}/guest/analyze`
      : `${this.apiUrl}/analyze`;

    return this.http.post<ResumeAnalysis>(endpoint, formData);
  }

  chat(
    analysisId: string,
    message: string,
  ): Observable<ChatResponse> {
    const loggedIn = this.authService.isLoggedIn();

    const endpoint = loggedIn
      ? `${this.apiUrl}/chat`
      : `${this.apiUrl}/guest/chat`;

    console.log('Logged in:', loggedIn);
    console.log('Analysis ID:', analysisId);
    console.log('Chat endpoint:', endpoint);

    return this.http.post<ChatResponse>(endpoint, {
      analysisId,
      message: message.trim(),
    });
  }

  getHistory(): Observable<ResumeAnalysis[]> {
    return this.http.get<ResumeAnalysis[]>(
      `${this.apiUrl}/history`,
    );
  }

  getHistoryItem(
    analysisId: string,
  ): Observable<ResumeAnalysis> {
    return this.http.get<ResumeAnalysis>(
      `${this.apiUrl}/history/${analysisId}`,
    );
  }
}
