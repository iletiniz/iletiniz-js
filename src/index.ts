import { IletinizClient } from './client.js';

export { IletinizClient } from './client.js';
export type { IletinizClientOptions } from './client.js';

export { MessagesResource } from './resources/messages.js';
export { HealthResource } from './resources/health.js';
export { ScheduledResource } from './resources/scheduled.js';
export { RemindersResource } from './resources/reminders.js';
export { PartnerResource } from './resources/partner.js';

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
  ChildAccount,
  ChildApiKey,
  ChildApiKeyInfo,
  ChildGrantableScope,
  CreateChildAccountParams,
  CreateChildApiKeyParams,
  CreateOneTimeReminderParams,
  CreateRecurringReminderParams,
  CreateReminderParams,
  IysMode,
  ListChildAccountsParams,
  ListParams,
  ListRemindersParams,
  ListResponse,
  ListScheduledParams,
  PartnerProfile,
  QuotaTransferResponse,
  Reminder,
  ReminderFrequency,
  ReminderMessage,
  ReminderStatus,
  ScheduleCreatedResponse,
  ScheduledMessage,
  ScheduledStatus,
  SendAttempt,
  UpdateReminderParams,
  WhatsappBodyComponent,
  WhatsappButtonComponent,
  WhatsappComponent,
  WhatsappHeaderComponent,
  WhatsappSignupLink,
  WhatsappTemplate,
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
