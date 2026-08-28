/* tslint:disable */
/* eslint-disable */

/**
 * The X Chat encryption SDK for JavaScript (crypto-only WASM layer).
 *
 * Provides all cryptographic operations: key generation, encrypt/decrypt,
 * sign/verify. Juicebox key-storage lifecycle (setup/unlock/delete/changePin)
 * is handled by the JS wrapper in `index.js`, which calls `exportKeys()` /
 * `importKeys()` to shuttle raw key bytes across the boundary.
 */
export class Chat {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Decrypt a base64-encoded ciphertext and return the UTF-8 plaintext.
     *
     * Use for metadata fields like group names returned by the API.
     */
    decrypt(ciphertext_b64: string, conversation_key: Uint8Array): string;
    /**
     * Decrypt an encrypted conversation key (ECIES).
     */
    decryptConversationKey(encrypted_key_b64: string): Uint8Array;
    /**
     * Decrypt a raw webhook event payload.
     *
     * `conversationKeys` is a plain `version → key bytes` map — the `.keys`
     * property of the object returned by `extractConversationKeys` (passing
     * the whole result object yields an empty map and every decrypt fails
     * with "no matching key found"). Omitting it falls back to the opt-in
     * key cache (`setCacheKeys(true)`).
     * `signingKeys` is an array of `{ userId, publicKeyVersion, publicKey,
     * identityPublicKey, identityPublicKeySignature }` objects; entries are
     * filtered to the event's sender and the SDK picks the matching version
     * automatically. Omitting it falls back to the keys stored via
     * `setSigningKeys`. Under the default reject-unverified policy no
     * signing keys from either source makes every signed event throw; only
     * after `setRejectUnverified(false)` are such events returned with
     * `verified: false`.
     */
    decryptEvent(event_b64: string, conversation_keys: any, signing_keys: any): any;
    /**
     * Decrypt multiple events in batch.
     *
     * This is the recommended API for decrypting messages. It:
     * 1. Extracts conversation keys from any KeyChange events
     * 2. For each message, finds the correct signing key by matching userId + version
     * 3. Decrypts the message using the appropriate conversation key
     *
     * `signingKeys` is an array of `{ userId, publicKeyVersion, publicKey,
     * identityPublicKey, identityPublicKeySignature }` objects for ALL
     * participants in the conversation (pass the X API response through).
     * Omitting it falls back to the keys stored via `setSigningKeys`.
     *
     * Returns `{ messages, conversationKeys, errors }`.
     */
    decryptEvents(events: string[], signing_keys: any): any;
    /**
     * Decrypt a streaming-encrypted payload (e.g. media).
     */
    decryptStream(encrypted: Uint8Array, conversation_key: Uint8Array): Uint8Array;
    /**
     * Encrypt a UTF-8 string and return base64 ciphertext.
     *
     * Use for metadata fields like group names before sending to the API.
     */
    encrypt(plaintext: string, conversation_key: Uint8Array): string;
    /**
     * Encrypt a reaction-add.
     *
     * Takes a single params object with camelCase keys: required `emoji`,
     * plus `targetEvent` — the base64 raw event being reacted to, from which
     * the conversation id and target sequence id are derived — or explicit
     * `conversationId` / `targetMessageSequenceId` overrides. `senderId`,
     * `signingKeyVersion`, `conversationKey` (Uint8Array), and
     * `conversationKeyVersion` resolve from the session identity and key
     * cache when omitted. The same shape works for `encryptRemoveReaction`.
     * The SDK generates the message id and returns it as `messageId` on the
     * result.
     */
    encryptAddReaction(params: any): any;
    /**
     * Encrypt a message edit.
     *
     * Takes a single params object with camelCase keys: `updatedText`,
     * plus `targetEvent` — the base64 raw event being edited, from which the
     * conversation id and target sequence id are derived — or explicit
     * `conversationId` / `targetMessageSequenceId` overrides. `entities`
     * (array of `[start, end, "type"]` tuples) describes the replacement
     * text; `senderId`, `signingKeyVersion`, `conversationKey` (Uint8Array),
     * and `conversationKeyVersion` resolve from the session identity and key
     * cache when omitted. The SDK generates the message id and returns it as
     * `messageId` on the result.
     */
    encryptEdit(params: any): any;
    /**
     * Encrypt a text message for the X API.
     *
     * Takes a single params object with camelCase keys: required
     * `conversationId` and `text`, plus optional `senderId` /
     * `signingKeyVersion` (resolved from the session identity set via
     * `setIdentity` when omitted), `conversationKey` (Uint8Array) /
     * `conversationKeyVersion` (resolved from the opt-in key cache when
     * omitted), `entities` (array of `[start, end, "type"]` tuples),
     * `attachments` (array of attachment objects), `shouldNotify`, and
     * `ttlMsec`.
     *
     * The SDK generates the message id and returns it as `messageId` on the
     * result; callers do not pass one.
     */
    encryptMessage(params: any): any;
    /**
     * Encrypt a reaction-remove.
     *
     * Takes the same params object shape as `encryptAddReaction`.
     */
    encryptRemoveReaction(params: any): any;
    /**
     * Encrypt a reply message for the X API.
     *
     * Takes a single params object: the same fields as `encryptMessage` plus
     * `replyToEvent` — the base64 raw signed event being replied to, from
     * which the reply preview (sequence id, sender, text, entities,
     * attachments) is derived — with optional `replyToEditEvent`,
     * `replyToCkces` (base64 raw key-change events needed to decrypt the
     * original), and explicit `replyToSequenceId`, `replyToSenderId`,
     * `replyToText`, `replyToEntities`, `replyToAttachments` overrides for
     * callers that no longer hold the raw event.
     */
    encryptReply(params: any): any;
    /**
     * Encrypt a stream (e.g. media).
     */
    encryptStream(plaintext: Uint8Array, conversation_key: Uint8Array): Uint8Array;
    /**
     * Export private keys as raw bytes (`Uint8Array`).
     */
    exportKeys(): Uint8Array;
    /**
     * Extract and decrypt conversation keys from raw KeyChange event strings.
     *
     * Returns a `ConversationKeyResult` with:
     * - `keys`: Object mapping key version strings to `Uint8Array` conversation keys
     * - `latestVersion`: The highest key version (use for encrypting new messages)
     */
    extractConversationKeys(events: string[]): any;
    /**
     * Generate new keypairs and return the registration payload.
     *
     * The key version is read from the JS clock (`Date.now()`) because the
     * `wasm32-unknown-unknown` target has no system clock.
     */
    generateKeypairs(): any;
    /**
     * Get the fingerprint of the loaded identity public key.
     *
     * Returns a URL-safe base64 string that users can compare
     * out-of-band (e.g. in person or over a trusted channel) to
     * verify key authenticity.
     */
    getPublicKeyFingerprint(): string;
    /**
     * Get current public keys.
     */
    getPublicKeys(): any;
    /**
     * Returns `true` when the identity key is loaded (sufficient for decryption).
     */
    hasIdentityKey(): boolean;
    /**
     * Import private keys from raw bytes (`Uint8Array`).
     *
     * The input bytes are zeroized after import. When `version` is given it
     * also records the public key version the keys were registered under
     * (participant-key filtering plus the session `signingKeyVersion`).
     */
    importKeys(keys: Uint8Array, version?: string | null): void;
    /**
     * Returns `true` when both identity and signing keys are loaded.
     */
    isUnlocked(): boolean;
    /**
     * Clear keys from memory.
     */
    lock(): void;
    /**
     * Report whether the loaded identity public key is the key in
     * `publicKeyB64`.
     *
     * The X API returns the identity public key in SPKI/DER encoding while
     * `getPublicKeys` returns the raw SEC1 point; this accepts either
     * encoding, so use it to check whether the keys on this device belong
     * to a key registered to the account.
     */
    matchesRegisteredKey(public_key_b64: string): boolean;
    /**
     * Create a new Chat instance.
     */
    constructor();
    /**
     * Prepare a signed conversation-key change, ready to send to the X API.
     *
     * Takes a single params object with camelCase keys: `publicKeys` (the
     * flat array of public keys — self plus recipients — from the X API),
     * plus optional `senderId` / `signingKeyVersion` (resolved from the
     * session identity when omitted) and `conversationId`. Omit
     * `conversationId` for a one-to-one and it is derived from the two
     * participants; pass the existing id for a group key rotation.
     *
     * Returns `{ conversationId, conversationKey, conversationKeyVersion,
     * participantKeys, actionSignatures }`.
     */
    prepareConversationKeyChange(params: any): any;
    /**
     * Prepare a signed group create, ready to send to the X API.
     *
     * Takes a single params object with camelCase keys: `publicKeys` (for
     * the new roster), `conversationId`, `memberIds`, `adminIds`, plus
     * optional `senderId` / `signingKeyVersion` (resolved from the session
     * identity when omitted), `title`, `avatarUrl`, and `ttlMsec`. Emits
     * two action signatures (a conversation-key change and the group
     * create). Returns the same shape as
     * [`Chat::prepare_conversation_key_change`].
     */
    prepareGroupCreate(params: any): any;
    /**
     * Prepare a signed group member-add change, ready to send to the X API.
     *
     * Takes a single params object with camelCase keys: `publicKeys` (for
     * the updated roster), `conversationId`, `newMemberIds`,
     * `currentMemberIds`, `currentAdminIds`, `currentPendingMemberIds`,
     * plus optional `senderId` / `signingKeyVersion` (resolved from the
     * session identity when omitted), `currentTitle`, `currentAvatarUrl`,
     * `currentTtlMsec`, and `currentScreenCaptureBlockingEnabled`. Returns
     * the same shape as [`Chat::prepare_conversation_key_change`].
     */
    prepareGroupMembersChange(params: any): any;
    /**
     * Build the signed action for deleting messages from a conversation.
     *
     * Takes a single params object with camelCase keys: `conversationId`,
     * `sequenceIds` (array of message sequence ids), `deleteForAll`
     * (boolean: every participant vs only the caller's view), plus optional
     * `senderId` / `signingKeyVersion` (resolved from the session identity
     * when omitted). Returns the action signature to submit alongside the
     * delete request; the SDK generates the action's message id
     * (`messageId` on the result).
     */
    prepareMessageDelete(params: any): any;
    /**
     * Enable or disable the conversation-key cache (off by default).
     *
     * While enabled, `decryptEvents` caches, per conversation, the key whose
     * key change carried a valid signature at the highest version seen, and
     * the encrypt methods resolve an omitted `conversationKey` /
     * `conversationKeyVersion` pair from it. Disabling clears the cache.
     */
    setCacheKeys(enabled: boolean): void;
    /**
     * Set the session identity: the owner's user id and signing-key
     * version, used as defaults wherever a params object omits
     * `senderId` / `signingKeyVersion`.
     */
    setIdentity(user_id: string, signing_key_version: string): void;
    /**
     * When enabled — the default — `decryptEvent` throws for any signed
     * event whose signature cannot be verified (invalid, missing, or no
     * matching signing key) instead of returning it with `verified: false`.
     */
    setRejectUnverified(reject: boolean): void;
    /**
     * Store signing keys to use when a decrypt call omits its `signingKeys`
     * argument (same array shape as `decryptEvents`). Only this explicit
     * call populates the store — a key carried inside an event is never
     * trusted for verification. Each call replaces the previous set.
     */
    setSigningKeys(signing_keys: any): void;
    /**
     * Sign data. Returns raw signature bytes (`Uint8Array`).
     */
    sign(data: Uint8Array): Uint8Array;
    /**
     * Create an incremental stream decryptor for large payloads.
     */
    streamDecryptor(conversation_key: Uint8Array): StreamDecryptor;
    /**
     * Create an incremental stream encryptor for large payloads.
     */
    streamEncryptor(conversation_key: Uint8Array): StreamEncryptor;
    /**
     * Verify a signature.
     */
    verify(public_key_b64: string, signature: Uint8Array, data: Uint8Array): boolean;
    /**
     * Verify that a signing key is authentically bound to an identity key.
     *
     * Call this when you receive another user's public keys from the X API
     * to detect server-side key substitution. All inputs are base64.
     */
    verifyKeyBinding(identity_public_key_b64: string, signing_public_key_b64: string, identity_public_key_signature_b64: string): boolean;
}

/**
 * Incremental stream decryptor for large payloads.
 *
 * Feed ciphertext with `push`; call `finish` once at end of input. `finish`
 * throws if the stream ended before its final frame (truncation), so callers
 * must not treat plaintext as complete until `finish` succeeds.
 */
export class StreamDecryptor {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Decrypt the final frame and consume the decryptor.
     */
    finish(): Uint8Array;
    /**
     * Decrypt a ciphertext chunk, returning plaintext available so far.
     */
    push(ciphertext: Uint8Array): Uint8Array;
}

/**
 * Incremental stream encryptor for large payloads.
 *
 * Feed plaintext with `push`; call `finish` once to emit the final frame.
 */
export class StreamEncryptor {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Emit the final frame and consume the encryptor.
     */
    finish(): Uint8Array;
    /**
     * Encrypt a plaintext chunk, returning ciphertext available so far.
     */
    push(plaintext: Uint8Array): Uint8Array;
}

/**
 * Decode base64 string to bytes.
 *
 * Returns null if the input is not valid base64.
 */
export function base64ToBytes(b64: string): Uint8Array | undefined;

/**
 * Encode bytes to base64 string.
 */
export function bytesToBase64(bytes: Uint8Array): string;

/**
 * Encode bytes to lowercase hex string.
 */
export function bytesToHex(bytes: Uint8Array): string;

/**
 * Detect image dimensions from file bytes.
 *
 * Supports PNG, JPEG, GIF, WebP, and BMP.
 * Returns `{ width, height }` or null.
 */
export function detectImageDimensions(bytes: Uint8Array): any;

/**
 * Detect MIME type from file bytes using magic numbers.
 *
 * Returns the MIME type string (e.g., "image/png", "video/mp4") or null.
 */
export function detectMimeType(bytes: Uint8Array): string | undefined;

/**
 * Decode hex string to bytes.
 *
 * Returns null if the input is not valid hex.
 */
export function hexToBytes(hex: string): Uint8Array | undefined;

/**
 * Initialize panic hook for better error messages in console.
 */
export function init(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_chat_free: (a: number, b: number) => void;
    readonly __wbg_streamdecryptor_free: (a: number, b: number) => void;
    readonly __wbg_streamencryptor_free: (a: number, b: number) => void;
    readonly base64ToBytes: (a: number, b: number) => [number, number];
    readonly bytesToBase64: (a: number, b: number) => [number, number];
    readonly bytesToHex: (a: number, b: number) => [number, number];
    readonly chat_decrypt: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
    readonly chat_decryptConversationKey: (a: number, b: number, c: number) => [number, number, number, number];
    readonly chat_decryptEvent: (a: number, b: number, c: number, d: any, e: any) => [number, number, number];
    readonly chat_decryptEvents: (a: number, b: number, c: number, d: any) => [number, number, number];
    readonly chat_decryptStream: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
    readonly chat_encrypt: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
    readonly chat_encryptAddReaction: (a: number, b: any) => [number, number, number];
    readonly chat_encryptEdit: (a: number, b: any) => [number, number, number];
    readonly chat_encryptMessage: (a: number, b: any) => [number, number, number];
    readonly chat_encryptRemoveReaction: (a: number, b: any) => [number, number, number];
    readonly chat_encryptReply: (a: number, b: any) => [number, number, number];
    readonly chat_encryptStream: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
    readonly chat_exportKeys: (a: number) => [number, number, number, number];
    readonly chat_extractConversationKeys: (a: number, b: number, c: number) => [number, number, number];
    readonly chat_generateKeypairs: (a: number) => [number, number, number];
    readonly chat_getPublicKeyFingerprint: (a: number) => [number, number, number, number];
    readonly chat_getPublicKeys: (a: number) => [number, number, number];
    readonly chat_hasIdentityKey: (a: number) => number;
    readonly chat_importKeys: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly chat_isUnlocked: (a: number) => number;
    readonly chat_lock: (a: number) => void;
    readonly chat_matchesRegisteredKey: (a: number, b: number, c: number) => [number, number, number];
    readonly chat_new: () => number;
    readonly chat_prepareConversationKeyChange: (a: number, b: any) => [number, number, number];
    readonly chat_prepareGroupCreate: (a: number, b: any) => [number, number, number];
    readonly chat_prepareGroupMembersChange: (a: number, b: any) => [number, number, number];
    readonly chat_prepareMessageDelete: (a: number, b: any) => [number, number, number];
    readonly chat_setCacheKeys: (a: number, b: number) => void;
    readonly chat_setIdentity: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly chat_setRejectUnverified: (a: number, b: number) => void;
    readonly chat_setSigningKeys: (a: number, b: any) => [number, number];
    readonly chat_sign: (a: number, b: number, c: number) => [number, number, number, number];
    readonly chat_streamDecryptor: (a: number, b: number, c: number) => [number, number, number];
    readonly chat_streamEncryptor: (a: number, b: number, c: number) => [number, number, number];
    readonly chat_verify: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly chat_verifyKeyBinding: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly detectImageDimensions: (a: number, b: number) => any;
    readonly detectMimeType: (a: number, b: number) => [number, number];
    readonly hexToBytes: (a: number, b: number) => [number, number];
    readonly streamdecryptor_finish: (a: number) => [number, number, number, number];
    readonly streamdecryptor_push: (a: number, b: number, c: number) => [number, number, number, number];
    readonly streamencryptor_finish: (a: number) => [number, number, number, number];
    readonly streamencryptor_push: (a: number, b: number, c: number) => [number, number, number, number];
    readonly init: () => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
