interface ClientConfiguration { baseUrl?: string; apiToken?: string; }

const runtime = (globalThis as typeof globalThis & {
  customerOperationsConfig?: ClientConfiguration;
}).customerOperationsConfig;

export const apiConfig = {
  baseUrl: runtime?.baseUrl ?? '',
  apiToken: runtime?.apiToken ?? '',
};

export const apiRequestOptions = {
  headers: { 'X-API-Key': apiConfig.apiToken },
};
