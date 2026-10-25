import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { apiConfig } from '../api.config';
import { HelpService } from './help-service';

describe('HelpService', () => {
  let service: HelpService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(HelpService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('only posts the question, with cookies and a fresh CSRF token', async () => {
    const done = firstValueFrom(service.ask('How do I register?'));
    const csrf = http.expectOne(apiConfig.baseUrl + '/api/auth/csrf');
    expect(csrf.request.withCredentials).toBe(true);
    csrf.flush({ requestToken: 'help-csrf' });
    const request = http.expectOne(apiConfig.baseUrl + '/api/help');
    expect(request.request.body).toEqual({ question: 'How do I register?' });
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('help-csrf');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ topic: 'register', title: 'Create an account', text: 'Guide', steps: [], links: [], mode: 'guide' });
    expect((await done).topic).toBe('register');
  });
});
