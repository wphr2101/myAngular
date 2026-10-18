import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Inputform } from './inputform';
import { apiConfig } from '../api.config';

describe('Visitor comment CSRF', () => {
  let component: Inputform;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    component = TestBed.runInInjectionContext(() => new Inputform());
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { http.verify(); vi.restoreAllMocks(); });

  function submit() {
    (component as any).inputForm.setValue({ name: 'Demo', email: 'demo@example.test',
      address: 'Example', city: 'Demo', state: 'NJ', zipcode: '00000', phone: '000', comments: 'Test' });
    (component as any).showFormValues();
  }
  it('fetches a fresh CSRF token and sends the matching cookie', () => {
    submit();
    const csrf = http.expectOne(apiConfig.baseUrl + '/api/auth/csrf');
    expect(csrf.request.withCredentials).toBe(true);
    http.expectNone(apiConfig.baseUrl + '/api/insertComment');
    csrf.flush({ requestToken: 'comment-csrf' });
    const post = http.expectOne(apiConfig.baseUrl + '/api/insertComment');
    expect(post.request.headers.get('X-CSRF-TOKEN')).toBe('comment-csrf');
    expect(post.request.withCredentials).toBe(true);
    post.flush({ message: 'Saved' });
    expect((component as any).isSubmitting).toBe(false);
  });
  it('does not submit if CSRF initialization fails', () => {
    submit();
    http.expectOne(apiConfig.baseUrl + '/api/auth/csrf').flush({}, { status: 503, statusText: 'Unavailable' });
    http.expectNone(apiConfig.baseUrl + '/api/insertComment');
    expect((component as any).isSubmitting).toBe(false);
  });
});
