import type { HttpClient } from '../http.js';
import type {
  ChildAccount,
  ChildApiKey,
  ChildApiKeyInfo,
  CreateChildAccountParams,
  CreateChildApiKeyParams,
  ListChildAccountsParams,
  ListResponse,
  PartnerProfile,
  QuotaTransferResponse,
  RequestOptions,
  WhatsappSignupLink,
} from '../types.js';
import { IletinizError } from '../errors.js';
import { assertId, listQuery, stripUndefined } from './util.js';

/**
 * Partner API (`/v1/partner`). Yalnız partner hesabının `partner:manage`
 * yetkili CANLI (iltz_live_) anahtarıyla çalışır.
 */
export class PartnerResource {
  constructor(private readonly http: HttpClient) {}

  /** Partner profili: fiyatlandırma, kota bakiyesi, alt hesap sayısı. */
  profile(options?: RequestOptions): Promise<PartnerProfile> {
    return this.http.request<PartnerProfile>({
      method: 'GET',
      path: '/v1/partner',
      options,
    });
  }

  createAccount(
    params: CreateChildAccountParams,
    options?: RequestOptions,
  ): Promise<ChildAccount> {
    if (!params?.name || params.name.trim().length < 2) {
      throw new IletinizError("'name' en az 2 karakter olmalıdır.");
    }
    return this.http.request<ChildAccount>({
      method: 'POST',
      path: '/v1/partner/accounts',
      body: stripUndefined(params),
      retry: false,
      options,
    });
  }

  listAccounts(
    params?: ListChildAccountsParams,
    options?: RequestOptions,
  ): Promise<ListResponse<ChildAccount>> {
    return this.http.request<ListResponse<ChildAccount>>({
      method: 'GET',
      path: '/v1/partner/accounts',
      query: listQuery(params),
      options,
    });
  }

  retrieveAccount(id: number, options?: RequestOptions): Promise<ChildAccount> {
    assertId(id);
    return this.http.request<ChildAccount>({
      method: 'GET',
      path: `/v1/partner/accounts/${id}`,
      options,
    });
  }

  suspendAccount(id: number, options?: RequestOptions): Promise<ChildAccount> {
    assertId(id);
    return this.http.request<ChildAccount>({
      method: 'POST',
      path: `/v1/partner/accounts/${id}/suspend`,
      options,
    });
  }

  unsuspendAccount(id: number, options?: RequestOptions): Promise<ChildAccount> {
    assertId(id);
    return this.http.request<ChildAccount>({
      method: 'POST',
      path: `/v1/partner/accounts/${id}/unsuspend`,
      options,
    });
  }

  /** Alt hesap için API anahtarı üretir. Düz metin `key` yalnız bu yanıtta döner. */
  createApiKey(
    id: number,
    params: CreateChildApiKeyParams,
    options?: RequestOptions,
  ): Promise<ChildApiKey> {
    assertId(id);
    if (!params?.name) throw new IletinizError("'name' zorunludur.");
    return this.http.request<ChildApiKey>({
      method: 'POST',
      path: `/v1/partner/accounts/${id}/api-keys`,
      body: stripUndefined(params),
      retry: false,
      options,
    });
  }

  /** Alt hesabın API anahtarlarını listeler (en yeni önce). Düz metin anahtar/hash dönmez. */
  listApiKeys(
    id: number,
    options?: RequestOptions,
  ): Promise<{ data: ChildApiKeyInfo[] }> {
    assertId(id);
    return this.http.request<{ data: ChildApiKeyInfo[] }>({
      method: 'GET',
      path: `/v1/partner/accounts/${id}/api-keys`,
      options,
    });
  }

  /** Alt hesabın API anahtarını iptal eder. İdempotenttir: iptal edilmiş anahtar için aynı nesne döner. */
  revokeApiKey(
    id: number,
    keyId: number,
    options?: RequestOptions,
  ): Promise<ChildApiKeyInfo> {
    assertId(id);
    assertId(keyId, 'keyId');
    return this.http.request<ChildApiKeyInfo>({
      method: 'DELETE',
      path: `/v1/partner/accounts/${id}/api-keys/${keyId}`,
      options,
    });
  }

  /** Partner kotasından alt hesaba mesaj kotası aktarır. */
  transferQuota(
    id: number,
    amount: number,
    options?: RequestOptions,
  ): Promise<QuotaTransferResponse> {
    assertId(id);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 10_000_000) {
      throw new IletinizError("'amount' 1 ile 10.000.000 arasında tam sayı olmalıdır.");
    }
    return this.http.request<QuotaTransferResponse>({
      method: 'POST',
      path: `/v1/partner/accounts/${id}/quota-transfers`,
      body: { amount },
      retry: false,
      options,
    });
  }

  /** Alt hesabın WhatsApp numarasını bağlaması için tek kullanımlık bağlantı üretir. */
  createWhatsappSignupLink(
    id: number,
    options?: RequestOptions,
  ): Promise<WhatsappSignupLink> {
    assertId(id);
    return this.http.request<WhatsappSignupLink>({
      method: 'POST',
      path: `/v1/partner/accounts/${id}/whatsapp-signup`,
      options,
    });
  }
}
