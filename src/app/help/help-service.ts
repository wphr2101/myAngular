import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { switchMap, timeout } from 'rxjs';
import { apiConfig, apiRequestOptions } from '../api.config';

export interface HelpAnswer {
  topic: string;
  title: string;
  text: string;
  steps: string[];
  links: { label: string; path: string }[];
  mode: 'guide' | 'ai' | 'policy';
}

@Injectable({ providedIn: 'root' })
export class HelpService {
  private readonly http = inject(HttpClient);
  private readonly options = { ...apiRequestOptions, withCredentials: true };

  ask(question: string) {
    return this.http.get<{ requestToken: string }>(apiConfig.baseUrl + '/api/auth/csrf', this.options).pipe(
      switchMap(csrf => this.http.post<HelpAnswer>(apiConfig.baseUrl + '/api/help', { question }, {
        ...this.options,
        headers: new HttpHeaders(apiRequestOptions.headers).set('X-CSRF-TOKEN', csrf.requestToken),
      })),
      timeout(15_000),
    );
  }
}
