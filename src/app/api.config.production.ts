interface ClientConfiguration { baseUrl?: string; }

const runtime = (globalThis as typeof globalThis & {
  customerOperationsConfig?: ClientConfiguration;
}).customerOperationsConfig;

export const apiConfig = {
  baseUrl: runtime?.baseUrl ?? '',
};

export const apiRequestOptions = {
  headers: {} as Record<string, string>,
};
