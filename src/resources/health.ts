import type { HttpClient } from '../http.js';
import type { HealthResponse, RequestOptions } from '../types.js';

export class HealthResource {
  constructor(private readonly http: HttpClient) {}

  /** API ve veritabanının erişilebilirliğini kontrol eder. */
  check(options?: RequestOptions): Promise<HealthResponse> {
    return this.http.request<HealthResponse>({
      method: 'GET',
      path: '/v1/health',
      options,
    });
  }
}
