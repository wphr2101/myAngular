import { apiConfig, apiRequestOptions } from './api.config.production';

describe('Production browser configuration', () => {
  it('uses same-origin APIs without a shared API key', () => {
    expect(apiConfig.baseUrl).toBe('');
    expect(apiRequestOptions.headers).toEqual({});
    expect('apiToken' in apiConfig).toBe(false);
  });
});
