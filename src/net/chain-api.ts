import { httpGet, httpPost } from './http.js';
import type {
  ChainStatus,
  AccountInfo,
  CreateIntentRequest,
  CreateIntentResponse,
  BatchCommitRequest,
  BatchCommitResponse,
  FinalizeRequest,
  FinalizeResponse,
  RenewDealRequest,
  RenewDealResponse,
  TerminateDealRequest,
  TerminateDealResponse,
  StorageManifestResponse,
  IntentView,
  StorageQuoteRequest,
  StorageQuoteResponse,
  CreateCollectionRequest,
  CreateCollectionResponse,
  AppendRecordRequest,
  AppendRecordResponse,
  CollectionResponse,
  CollectionRecordsResponse,
  UserCollectionsResponse,
  CreateKeyEnvelopeRequest,
  CreateAddressShareRequest,
  CreatePasscodeShareRequest,
  RevokeShareRequest,
  KeyEnvelope,
  ShareRecord,
  AgentKey,
} from '../types/wire.js';

export class ChainApi {
  constructor(
    private baseUrl: string,
    private timeout?: number,
    private retries?: number,
  ) {}

  private opts() {
    return { timeout: this.timeout, retries: this.retries };
  }

  // ── Status & Account ──

  async getStatus(): Promise<ChainStatus> {
    return httpGet<ChainStatus>(this.baseUrl, '/status', this.opts());
  }

  async getAccount(address: string): Promise<AccountInfo> {
    return httpGet<AccountInfo>(
      this.baseUrl,
      `/accounts/${encodeURIComponent(address)}`,
      this.opts(),
    );
  }

  // ── Intents ──

  async createIntent(req: CreateIntentRequest): Promise<CreateIntentResponse> {
    return httpPost<CreateIntentResponse>(this.baseUrl, '/intents', req, this.opts());
  }

  async getIntent(intentId: string): Promise<IntentView> {
    return httpGet<IntentView>(
      this.baseUrl,
      `/intents/${encodeURIComponent(intentId)}`,
      this.opts(),
    );
  }

  async getManifest(intentId: string): Promise<StorageManifestResponse> {
    return httpGet<StorageManifestResponse>(
      this.baseUrl,
      `/manifests/${encodeURIComponent(intentId)}`,
      this.opts(),
    );
  }

  // ── Upload pipeline ──

  async batchCommit(req: BatchCommitRequest): Promise<BatchCommitResponse> {
    return httpPost<BatchCommitResponse>(
      this.baseUrl,
      '/batch-commits',
      req,
      this.opts(),
    );
  }

  async finalize(req: FinalizeRequest): Promise<FinalizeResponse> {
    return httpPost<FinalizeResponse>(this.baseUrl, '/finalize', req, this.opts());
  }

  // ── Deal management ──

  async renewDeal(req: RenewDealRequest): Promise<RenewDealResponse> {
    return httpPost<RenewDealResponse>(
      this.baseUrl,
      `/intents/${encodeURIComponent(req.intent_id)}/renew`,
      req,
      this.opts(),
    );
  }

  async terminateDeal(req: TerminateDealRequest): Promise<TerminateDealResponse> {
    return httpPost<TerminateDealResponse>(
      this.baseUrl,
      '/intents/terminate',
      req,
      this.opts(),
    );
  }

  // ── Storage quote ──

  async getStorageQuote(req: StorageQuoteRequest): Promise<StorageQuoteResponse> {
    return httpPost<StorageQuoteResponse>(
      this.baseUrl,
      '/storage/quote',
      req,
      this.opts(),
    );
  }

  // ── Collections ──

  async createCollection(req: CreateCollectionRequest): Promise<CreateCollectionResponse> {
    return httpPost<CreateCollectionResponse>(
      this.baseUrl,
      '/collections',
      req,
      this.opts(),
    );
  }

  async getCollection(collectionId: string): Promise<CollectionResponse> {
    return httpGet<CollectionResponse>(
      this.baseUrl,
      `/collections/${encodeURIComponent(collectionId)}`,
      this.opts(),
    );
  }

  async getCollectionRecords(
    collectionId: string,
    params?: Record<string, string>,
  ): Promise<CollectionRecordsResponse> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return httpGet<CollectionRecordsResponse>(
      this.baseUrl,
      `/collections/${encodeURIComponent(collectionId)}/records${qs}`,
      this.opts(),
    );
  }

  async listUserCollections(user: string): Promise<UserCollectionsResponse> {
    return httpGet<UserCollectionsResponse>(
      this.baseUrl,
      `/user-collections?user=${encodeURIComponent(user)}`,
      this.opts(),
    );
  }

  async appendRecord(req: AppendRecordRequest): Promise<AppendRecordResponse> {
    return httpPost<AppendRecordResponse>(
      this.baseUrl,
      '/records',
      req,
      this.opts(),
    );
  }

  // ── Key Envelopes & Sharing ──

  async createKeyEnvelope(req: CreateKeyEnvelopeRequest): Promise<{ envelope: KeyEnvelope }> {
    return httpPost(this.baseUrl, '/key-envelopes', req, this.opts());
  }

  async listKeyEnvelopes(params: Record<string, string>): Promise<{ envelopes: KeyEnvelope[] }> {
    const qs = '?' + new URLSearchParams(params).toString();
    return httpGet(this.baseUrl, `/key-envelopes${qs}`, this.opts());
  }

  async createAddressShare(
    req: CreateAddressShareRequest,
  ): Promise<{ share: ShareRecord; envelope: KeyEnvelope }> {
    return httpPost(this.baseUrl, '/shares/address', req, this.opts());
  }

  async createPasscodeShare(
    req: CreatePasscodeShareRequest,
  ): Promise<{ share: ShareRecord; envelope: KeyEnvelope }> {
    return httpPost(this.baseUrl, '/shares/passcode', req, this.opts());
  }

  async revokeShare(req: RevokeShareRequest): Promise<void> {
    return httpPost(this.baseUrl, '/shares/revoke', req, this.opts());
  }

  async listShares(params: Record<string, string>): Promise<{ shares: ShareRecord[] }> {
    const qs = '?' + new URLSearchParams(params).toString();
    return httpGet(this.baseUrl, `/shares${qs}`, this.opts());
  }

  // ── Agent Keys ──

  async listAgentKeys(master: string): Promise<{ keys: AgentKey[] }> {
    return httpGet(
      this.baseUrl,
      `/agent-keys?master=${encodeURIComponent(master)}`,
      this.opts(),
    );
  }
}
