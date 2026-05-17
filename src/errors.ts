export interface ApiErrorBody {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export class IletinizError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IletinizError';
  }
}

export class IletinizAPIError extends IletinizError {
  /** HTTP status kodu. */
  public readonly status: number;
  /** API tarafından dönen makine-okunur hata kodu (varsa). */
  public readonly code: string | undefined;
  /** API tarafından dönen ham gövde. */
  public readonly body: ApiErrorBody | string | undefined;
  /** Sunucu tarafında üretilen request id (varsa). */
  public readonly requestId: string | undefined;

  constructor(params: {
    status: number;
    message: string;
    code?: string;
    body?: ApiErrorBody | string;
    requestId?: string;
  }) {
    super(params.message);
    this.name = 'IletinizAPIError';
    this.status = params.status;
    this.code = params.code;
    this.body = params.body;
    this.requestId = params.requestId;
  }
}

export class IletinizAuthenticationError extends IletinizAPIError {
  constructor(params: ConstructorParameters<typeof IletinizAPIError>[0]) {
    super(params);
    this.name = 'IletinizAuthenticationError';
  }
}

export class IletinizPermissionError extends IletinizAPIError {
  constructor(params: ConstructorParameters<typeof IletinizAPIError>[0]) {
    super(params);
    this.name = 'IletinizPermissionError';
  }
}

export class IletinizValidationError extends IletinizAPIError {
  constructor(params: ConstructorParameters<typeof IletinizAPIError>[0]) {
    super(params);
    this.name = 'IletinizValidationError';
  }
}

export class IletinizRateLimitError extends IletinizAPIError {
  constructor(params: ConstructorParameters<typeof IletinizAPIError>[0]) {
    super(params);
    this.name = 'IletinizRateLimitError';
  }
}

export class IletinizNotFoundError extends IletinizAPIError {
  constructor(params: ConstructorParameters<typeof IletinizAPIError>[0]) {
    super(params);
    this.name = 'IletinizNotFoundError';
  }
}

export class IletinizServerError extends IletinizAPIError {
  constructor(params: ConstructorParameters<typeof IletinizAPIError>[0]) {
    super(params);
    this.name = 'IletinizServerError';
  }
}

export class IletinizConnectionError extends IletinizError {
  public readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'IletinizConnectionError';
    this.cause = cause;
  }
}

export class IletinizTimeoutError extends IletinizError {
  constructor(message: string) {
    super(message);
    this.name = 'IletinizTimeoutError';
  }
}

export function buildApiError(
  status: number,
  body: ApiErrorBody | string | undefined,
  requestId: string | undefined,
): IletinizAPIError {
  const code = typeof body === 'object' && body ? (body.error as string | undefined) : undefined;
  const message =
    (typeof body === 'object' && body && (body.message as string | undefined)) ||
    (typeof body === 'string' && body) ||
    `HTTP ${status}`;

  const params = { status, message, code, body, requestId };
  if (status === 401) return new IletinizAuthenticationError(params);
  if (status === 403) return new IletinizPermissionError(params);
  if (status === 404) return new IletinizNotFoundError(params);
  if (status === 422 || status === 400) return new IletinizValidationError(params);
  if (status === 429) return new IletinizRateLimitError(params);
  if (status >= 500) return new IletinizServerError(params);
  return new IletinizAPIError(params);
}
