import { decodeAgentKeyString, deriveKeyInfo, normalizeAddress } from './auth/agent-key.js';
import type { ParsedAgentKey } from './auth/agent-key.js';
import { ChainApi } from './net/chain-api.js';
import { GatewayApi } from './net/gateway-api.js';
import type { SDKConfig, UploadInput, EncryptedUploadInput, DownloadOptions, EncryptedDownloadOptions, CollectionOptions, RecordOptions, RecordFilter, ShareAddressOptions, SharePasscodeOptions, CollectionDownloadOptions } from './types/params.js';
import type { UploadResult, EncryptedUploadResult, DownloadResult, RenewResult, TerminateResult, CollectionResult, RecordResult, ShareResult, AgentKeyInfo, CollectionDownloadResult, ChainStatus, AccountInfo, IntentView, StorageManifestResponse, DataCollection, DataRecord } from './types/results.js';
import { uploadViaGateway } from './ops/upload.js';
import { downloadViaGateway, downloadEncrypted, downloadCollection } from './ops/download.js';
import { createCollection, appendRecord, listCollections, listRecords } from './ops/collections.js';
import { shareWithAddress, shareWithPasscode, revokeShare } from './ops/sharing.js';
import { renewDeal, terminateDeal, getStatus, getManifest } from './ops/deals.js';
import { AuthenticationError } from './errors.js';

export class FalariSDK {
  private agentKey: ParsedAgentKey;
  private chain: ChainApi;
  private gateway: GatewayApi | null;
  private chainId: string | null = null;

  constructor(config: SDKConfig) {
    this.agentKey = decodeAgentKeyString(config.agentKey);
    this.chain = new ChainApi(config.chainUrl, config.timeout, config.retries);
    this.gateway = config.gatewayUrl
      ? new GatewayApi(config.gatewayUrl, config.agentKey, config.timeout)
      : null;
  }

  // ── Helpers ──

  private async getChainId(): Promise<string> {
    if (!this.chainId) {
      const status = await this.chain.getStatus();
      this.chainId = status.chain_id;
    }
    return this.chainId;
  }

  private requireGateway(): GatewayApi {
    if (!this.gateway) {
      throw new AuthenticationError('gatewayUrl is required for this operation');
    }
    return this.gateway;
  }

  // ── Storage Operations ──

  async upload(input: UploadInput): Promise<UploadResult> {
    const gw = this.requireGateway();
    return uploadViaGateway(gw, input);
  }

  async download(intentId: string, _opts?: DownloadOptions): Promise<DownloadResult> {
    const gw = this.requireGateway();
    return downloadViaGateway(gw, intentId);
  }

  async downloadEncrypted(
    intentId: string,
    opts: EncryptedDownloadOptions,
  ): Promise<DownloadResult> {
    return downloadEncrypted(this.chain, this.gateway, intentId, opts);
  }

  async renew(intentId: string, duration: number): Promise<RenewResult> {
    const chainId = await this.getChainId();
    return renewDeal(
      this.chain,
      chainId,
      this.agentKey.master,
      this.agentKey.privateKey,
      intentId,
      duration,
      this.agentKey.keyId,
    );
  }

  async terminate(intentId: string, reason?: string): Promise<TerminateResult> {
    const chainId = await this.getChainId();
    return terminateDeal(
      this.chain,
      chainId,
      this.agentKey.master,
      this.agentKey.privateKey,
      intentId,
      reason,
      this.agentKey.keyId,
    );
  }

  async getStatus(intentId: string): Promise<IntentView> {
    return getStatus(this.chain, intentId);
  }

  async getManifest(intentId: string): Promise<StorageManifestResponse> {
    return getManifest(this.chain, intentId);
  }

  // ── Collection Operations ──

  async createCollection(
    name: string,
    opts?: CollectionOptions,
  ): Promise<CollectionResult> {
    const chainId = await this.getChainId();
    return createCollection(
      this.chain,
      chainId,
      this.agentKey.master,
      this.agentKey.privateKey,
      name,
      opts,
    );
  }

  async appendRecord(
    collectionId: string,
    intentId: string,
    opts?: RecordOptions,
  ): Promise<RecordResult> {
    const chainId = await this.getChainId();
    return appendRecord(
      this.chain,
      chainId,
      this.agentKey.master,
      this.agentKey.privateKey,
      collectionId,
      intentId,
      opts,
    );
  }

  async listCollections(): Promise<DataCollection[]> {
    return listCollections(this.chain, this.agentKey.master);
  }

  async listRecords(collectionId: string, filter?: RecordFilter): Promise<DataRecord[]> {
    return listRecords(this.chain, collectionId, filter);
  }

  async downloadCollection(
    collectionId: string,
    opts: CollectionDownloadOptions,
  ): Promise<CollectionDownloadResult> {
    const gw = this.requireGateway();
    return downloadCollection(gw, collectionId, opts);
  }

  // ── Sharing Operations ──

  async shareWithAddress(
    intentId: string,
    recipient: string,
    opts: ShareAddressOptions,
  ): Promise<ShareResult> {
    const chainId = await this.getChainId();
    return shareWithAddress(
      this.chain,
      chainId,
      this.agentKey.master,
      this.agentKey.privateKey,
      intentId,
      recipient,
      opts,
    );
  }

  async shareWithPasscode(
    intentId: string,
    opts: SharePasscodeOptions,
  ): Promise<ShareResult> {
    const chainId = await this.getChainId();
    return shareWithPasscode(
      this.chain,
      chainId,
      this.agentKey.master,
      this.agentKey.privateKey,
      intentId,
      opts,
    );
  }

  async revokeShare(shareId: string): Promise<void> {
    const chainId = await this.getChainId();
    return revokeShare(
      this.chain,
      chainId,
      this.agentKey.master,
      this.agentKey.privateKey,
      shareId,
    );
  }

  // ── Utility ──

  async getChainStatus(): Promise<ChainStatus> {
    return this.chain.getStatus();
  }

  async getAccount(address?: string): Promise<AccountInfo> {
    return this.chain.getAccount(address || this.agentKey.master);
  }

  async getStorageQuote(
    fileSize: number,
    opts?: { dataShards?: number; parityShards?: number; duration?: number },
  ): Promise<{ requiredFee: number }> {
    const resp = await this.chain.getStorageQuote({
      file_size: fileSize,
      erasure: {
        data_shards: opts?.dataShards ?? 4,
        parity_shards: opts?.parityShards ?? 2,
        shard_size: 0,
      },
      policy: {
        class: 'permanent',
        duration: opts?.duration ?? 86400 * 365,
        redundancy: 'erasure',
        renewable: true,
        auto_renew: false,
        deletion_policy: 'standard',
      },
    });
    return { requiredFee: resp.required_fee };
  }

  agentKeyInfo(): AgentKeyInfo {
    const info = deriveKeyInfo(this.agentKey.privateKey);
    return {
      keyId: this.agentKey.keyId,
      master: this.agentKey.master,
      address: this.agentKey.address,
      publicKey: info.publicKey,
    };
  }
}
