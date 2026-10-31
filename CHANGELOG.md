# Changelog / Değişiklik Günlüğü

Bu projedeki önemli değişiklikler bu dosyada belgelenir.
All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Sürümleme / Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

### Added
- `client.partner.listApiKeys(id)` ve `client.partner.revokeApiKey(id, keyId)`: alt hesabın API anahtarlarını listeleme ve iptal etme; `ChildApiKeyInfo` tipi.

## [0.2.0] - 2026-10-31

### Added
- `whatsappTemplate` (Meta onaylı şablon), bulk `items[].whatsappComponents`, WhatsApp için `sender` = `phone_number_id`.
- `scheduledAt`, `fallback`, `idempotencyKey`, metin tabanlı `iys` modları.
- `client.scheduled` (list/retrieve/cancel), `client.reminders` (CRUD), `client.partner` (alt hesap, anahtar, kota aktarma, WhatsApp bağlantı linki).
- Yanıtlarda `sandbox`, `whatsapp_template`, `attempts`, `delivered_via`.
- `npm test` (node:test, sahte fetch).

### Changed
- Partner kota aktarımı / hesap ve anahtar oluşturma istekleri yeniden denenmez.
- `to` doğrulaması API ile hizalandı (1-64 karakter).

## [0.1.0] - 2026-05-12

### Eklenenler / Added
- Açık kaynak proje hijyen dosyaları: LICENSE (MIT), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY
- İki dilli dokümantasyon (Türkçe + English)
- İlk açık kaynak yayını / Initial open-source release
