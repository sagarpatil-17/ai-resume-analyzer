
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ResumeAnalysis {
  matchScore: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
}

@Injectable({
  providedIn: 'root',
})

export class ResumeService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  analyzeResume(
    resume: File,
    jobDescription: string,
  ): Observable<ResumeAnalysis> {
    const formData = new FormData();

    formData.append('resume', resume);
    formData.append('jobDescription', jobDescription);

    return this.http.post<ResumeAnalysis>(
      this.apiUrl,
      formData,
    );
  }
}
