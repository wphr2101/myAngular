export const apiConfig = {
  baseUrl: 'https://example.invalid',
  apiToken: '',
};

export const apiRequestOptions = {
  headers: {
    'X-API-Key': apiConfig.apiToken,
  },
};
