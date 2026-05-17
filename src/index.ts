import { IletinizClient } from './client.js';

export { IletinizClient } from './client.js';
export type { IletinizClientOptions } from './client.js';

export { MessagesResource } from './resources/messages.js';
export { HealthResource } from './resources/health.js';

export {
  IletinizError,
  IletinizAPIError,
  IletinizAuthenticationError,
  IletinizPermissionError,
  IletinizValidationError,
  IletinizRateLimitError,
  IletinizNotFoundError,
  IletinizServerError,
  IletinizConnectionError,
  IletinizTimeoutError,
} from './errors.js';

export type {
  ApiError,
  BulkItemInput,
  HealthResponse,
  MessageStatus,
  MessageStatusResponse,
  RequestOptions,
  SendBulkItemResult,
  SendBulkParams,
  SendBulkResponse,
  SendMessageParams,
  SendMessageResponse,
  SendMessageStatus,
  TemplateVariables,
} from './types.js';

export default IletinizClient;
