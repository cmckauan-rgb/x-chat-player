/* @ts-self-types="./chat_xdk_wasm.d.ts" */

/**
 * The X Chat encryption SDK for JavaScript (crypto-only WASM layer).
 *
 * Provides all cryptographic operations: key generation, encrypt/decrypt,
 * sign/verify. Juicebox key-storage lifecycle (setup/unlock/delete/changePin)
 * is handled by the JS wrapper in `index.js`, which calls `exportKeys()` /
 * `importKeys()` to shuttle raw key bytes across the boundary.
 */
export class Chat {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChatFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chat_free(ptr, 0);
    }
    /**
     * Decrypt a base64-encoded ciphertext and return the UTF-8 plaintext.
     *
     * Use for metadata fields like group names returned by the API.
     * @param {string} ciphertext_b64
     * @param {Uint8Array} conversation_key
     * @returns {string}
     */
    decrypt(ciphertext_b64, conversation_key) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(ciphertext_b64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(conversation_key, wasm.__wbindgen_malloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.chat_decrypt(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var ptr3 = ret[0];
            var len3 = ret[1];
            if (ret[3]) {
                ptr3 = 0; len3 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
    /**
     * Decrypt an encrypted conversation key (ECIES).
     * @param {string} encrypted_key_b64
     * @returns {Uint8Array}
     */
    decryptConversationKey(encrypted_key_b64) {
        const ptr0 = passStringToWasm0(encrypted_key_b64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chat_decryptConversationKey(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v2;
    }
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
     * @param {string} event_b64
     * @param {any} conversation_keys
     * @param {any} signing_keys
     * @returns {any}
     */
    decryptEvent(event_b64, conversation_keys, signing_keys) {
        const ptr0 = passStringToWasm0(event_b64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chat_decryptEvent(this.__wbg_ptr, ptr0, len0, conversation_keys, signing_keys);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
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
     * @param {string[]} events
     * @param {any} signing_keys
     * @returns {any}
     */
    decryptEvents(events, signing_keys) {
        const ptr0 = passArrayJsValueToWasm0(events, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chat_decryptEvents(this.__wbg_ptr, ptr0, len0, signing_keys);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Decrypt a streaming-encrypted payload (e.g. media).
     * @param {Uint8Array} encrypted
     * @param {Uint8Array} conversation_key
     * @returns {Uint8Array}
     */
    decryptStream(encrypted, conversation_key) {
        const ptr0 = passArray8ToWasm0(encrypted, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(conversation_key, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.chat_decryptStream(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v3 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v3;
    }
    /**
     * Encrypt a UTF-8 string and return base64 ciphertext.
     *
     * Use for metadata fields like group names before sending to the API.
     * @param {string} plaintext
     * @param {Uint8Array} conversation_key
     * @returns {string}
     */
    encrypt(plaintext, conversation_key) {
        let deferred4_0;
        let deferred4_1;
        try {
            const ptr0 = passStringToWasm0(plaintext, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArray8ToWasm0(conversation_key, wasm.__wbindgen_malloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.chat_encrypt(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var ptr3 = ret[0];
            var len3 = ret[1];
            if (ret[3]) {
                ptr3 = 0; len3 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred4_0 = ptr3;
            deferred4_1 = len3;
            return getStringFromWasm0(ptr3, len3);
        } finally {
            wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
        }
    }
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
     * @param {any} params
     * @returns {any}
     */
    encryptAddReaction(params) {
        const ret = wasm.chat_encryptAddReaction(this.__wbg_ptr, params);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
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
     * @param {any} params
     * @returns {any}
     */
    encryptEdit(params) {
        const ret = wasm.chat_encryptEdit(this.__wbg_ptr, params);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
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
     * @param {any} params
     * @returns {any}
     */
    encryptMessage(params) {
        const ret = wasm.chat_encryptMessage(this.__wbg_ptr, params);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Encrypt a reaction-remove.
     *
     * Takes the same params object shape as `encryptAddReaction`.
     * @param {any} params
     * @returns {any}
     */
    encryptRemoveReaction(params) {
        const ret = wasm.chat_encryptRemoveReaction(this.__wbg_ptr, params);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
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
     * @param {any} params
     * @returns {any}
     */
    encryptReply(params) {
        const ret = wasm.chat_encryptReply(this.__wbg_ptr, params);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Encrypt a stream (e.g. media).
     * @param {Uint8Array} plaintext
     * @param {Uint8Array} conversation_key
     * @returns {Uint8Array}
     */
    encryptStream(plaintext, conversation_key) {
        const ptr0 = passArray8ToWasm0(plaintext, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(conversation_key, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.chat_encryptStream(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v3 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v3;
    }
    /**
     * Export private keys as raw bytes (`Uint8Array`).
     * @returns {Uint8Array}
     */
    exportKeys() {
        const ret = wasm.chat_exportKeys(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Extract and decrypt conversation keys from raw KeyChange event strings.
     *
     * Returns a `ConversationKeyResult` with:
     * - `keys`: Object mapping key version strings to `Uint8Array` conversation keys
     * - `latestVersion`: The highest key version (use for encrypting new messages)
     * @param {string[]} events
     * @returns {any}
     */
    extractConversationKeys(events) {
        const ptr0 = passArrayJsValueToWasm0(events, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chat_extractConversationKeys(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Generate new keypairs and return the registration payload.
     *
     * The key version is read from the JS clock (`Date.now()`) because the
     * `wasm32-unknown-unknown` target has no system clock.
     * @returns {any}
     */
    generateKeypairs() {
        const ret = wasm.chat_generateKeypairs(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Get the fingerprint of the loaded identity public key.
     *
     * Returns a URL-safe base64 string that users can compare
     * out-of-band (e.g. in person or over a trusted channel) to
     * verify key authenticity.
     * @returns {string}
     */
    getPublicKeyFingerprint() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.chat_getPublicKeyFingerprint(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Get current public keys.
     * @returns {any}
     */
    getPublicKeys() {
        const ret = wasm.chat_getPublicKeys(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Returns `true` when the identity key is loaded (sufficient for decryption).
     * @returns {boolean}
     */
    hasIdentityKey() {
        const ret = wasm.chat_hasIdentityKey(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Import private keys from raw bytes (`Uint8Array`).
     *
     * The input bytes are zeroized after import. When `version` is given it
     * also records the public key version the keys were registered under
     * (participant-key filtering plus the session `signingKeyVersion`).
     * @param {Uint8Array} keys
     * @param {string | null} [version]
     */
    importKeys(keys, version) {
        const ptr0 = passArray8ToWasm0(keys, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(version) ? 0 : passStringToWasm0(version, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.chat_importKeys(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Returns `true` when both identity and signing keys are loaded.
     * @returns {boolean}
     */
    isUnlocked() {
        const ret = wasm.chat_isUnlocked(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Clear keys from memory.
     */
    lock() {
        wasm.chat_lock(this.__wbg_ptr);
    }
    /**
     * Report whether the loaded identity public key is the key in
     * `publicKeyB64`.
     *
     * The X API returns the identity public key in SPKI/DER encoding while
     * `getPublicKeys` returns the raw SEC1 point; this accepts either
     * encoding, so use it to check whether the keys on this device belong
     * to a key registered to the account.
     * @param {string} public_key_b64
     * @returns {boolean}
     */
    matchesRegisteredKey(public_key_b64) {
        const ptr0 = passStringToWasm0(public_key_b64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chat_matchesRegisteredKey(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * Create a new Chat instance.
     */
    constructor() {
        const ret = wasm.chat_new();
        this.__wbg_ptr = ret >>> 0;
        ChatFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
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
     * @param {any} params
     * @returns {any}
     */
    prepareConversationKeyChange(params) {
        const ret = wasm.chat_prepareConversationKeyChange(this.__wbg_ptr, params);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
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
     * @param {any} params
     * @returns {any}
     */
    prepareGroupCreate(params) {
        const ret = wasm.chat_prepareGroupCreate(this.__wbg_ptr, params);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
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
     * @param {any} params
     * @returns {any}
     */
    prepareGroupMembersChange(params) {
        const ret = wasm.chat_prepareGroupMembersChange(this.__wbg_ptr, params);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
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
     * @param {any} params
     * @returns {any}
     */
    prepareMessageDelete(params) {
        const ret = wasm.chat_prepareMessageDelete(this.__wbg_ptr, params);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Enable or disable the conversation-key cache (off by default).
     *
     * While enabled, `decryptEvents` caches, per conversation, the key whose
     * key change carried a valid signature at the highest version seen, and
     * the encrypt methods resolve an omitted `conversationKey` /
     * `conversationKeyVersion` pair from it. Disabling clears the cache.
     * @param {boolean} enabled
     */
    setCacheKeys(enabled) {
        wasm.chat_setCacheKeys(this.__wbg_ptr, enabled);
    }
    /**
     * Set the session identity: the owner's user id and signing-key
     * version, used as defaults wherever a params object omits
     * `senderId` / `signingKeyVersion`.
     * @param {string} user_id
     * @param {string} signing_key_version
     */
    setIdentity(user_id, signing_key_version) {
        const ptr0 = passStringToWasm0(user_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(signing_key_version, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.chat_setIdentity(this.__wbg_ptr, ptr0, len0, ptr1, len1);
    }
    /**
     * When enabled — the default — `decryptEvent` throws for any signed
     * event whose signature cannot be verified (invalid, missing, or no
     * matching signing key) instead of returning it with `verified: false`.
     * @param {boolean} reject
     */
    setRejectUnverified(reject) {
        wasm.chat_setRejectUnverified(this.__wbg_ptr, reject);
    }
    /**
     * Store signing keys to use when a decrypt call omits its `signingKeys`
     * argument (same array shape as `decryptEvents`). Only this explicit
     * call populates the store — a key carried inside an event is never
     * trusted for verification. Each call replaces the previous set.
     * @param {any} signing_keys
     */
    setSigningKeys(signing_keys) {
        const ret = wasm.chat_setSigningKeys(this.__wbg_ptr, signing_keys);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Sign data. Returns raw signature bytes (`Uint8Array`).
     * @param {Uint8Array} data
     * @returns {Uint8Array}
     */
    sign(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chat_sign(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v2;
    }
    /**
     * Create an incremental stream decryptor for large payloads.
     * @param {Uint8Array} conversation_key
     * @returns {StreamDecryptor}
     */
    streamDecryptor(conversation_key) {
        const ptr0 = passArray8ToWasm0(conversation_key, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chat_streamDecryptor(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return StreamDecryptor.__wrap(ret[0]);
    }
    /**
     * Create an incremental stream encryptor for large payloads.
     * @param {Uint8Array} conversation_key
     * @returns {StreamEncryptor}
     */
    streamEncryptor(conversation_key) {
        const ptr0 = passArray8ToWasm0(conversation_key, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chat_streamEncryptor(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return StreamEncryptor.__wrap(ret[0]);
    }
    /**
     * Verify a signature.
     * @param {string} public_key_b64
     * @param {Uint8Array} signature
     * @param {Uint8Array} data
     * @returns {boolean}
     */
    verify(public_key_b64, signature, data) {
        const ptr0 = passStringToWasm0(public_key_b64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(signature, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.chat_verify(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * Verify that a signing key is authentically bound to an identity key.
     *
     * Call this when you receive another user's public keys from the X API
     * to detect server-side key substitution. All inputs are base64.
     * @param {string} identity_public_key_b64
     * @param {string} signing_public_key_b64
     * @param {string} identity_public_key_signature_b64
     * @returns {boolean}
     */
    verifyKeyBinding(identity_public_key_b64, signing_public_key_b64, identity_public_key_signature_b64) {
        const ptr0 = passStringToWasm0(identity_public_key_b64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(signing_public_key_b64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(identity_public_key_signature_b64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.chat_verifyKeyBinding(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
}
if (Symbol.dispose) Chat.prototype[Symbol.dispose] = Chat.prototype.free;

/**
 * Incremental stream decryptor for large payloads.
 *
 * Feed ciphertext with `push`; call `finish` once at end of input. `finish`
 * throws if the stream ended before its final frame (truncation), so callers
 * must not treat plaintext as complete until `finish` succeeds.
 */
export class StreamDecryptor {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(StreamDecryptor.prototype);
        obj.__wbg_ptr = ptr;
        StreamDecryptorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StreamDecryptorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_streamdecryptor_free(ptr, 0);
    }
    /**
     * Decrypt the final frame and consume the decryptor.
     * @returns {Uint8Array}
     */
    finish() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.streamdecryptor_finish(ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Decrypt a ciphertext chunk, returning plaintext available so far.
     * @param {Uint8Array} ciphertext
     * @returns {Uint8Array}
     */
    push(ciphertext) {
        const ptr0 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.streamdecryptor_push(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v2;
    }
}
if (Symbol.dispose) StreamDecryptor.prototype[Symbol.dispose] = StreamDecryptor.prototype.free;

/**
 * Incremental stream encryptor for large payloads.
 *
 * Feed plaintext with `push`; call `finish` once to emit the final frame.
 */
export class StreamEncryptor {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(StreamEncryptor.prototype);
        obj.__wbg_ptr = ptr;
        StreamEncryptorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StreamEncryptorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_streamencryptor_free(ptr, 0);
    }
    /**
     * Emit the final frame and consume the encryptor.
     * @returns {Uint8Array}
     */
    finish() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.streamencryptor_finish(ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Encrypt a plaintext chunk, returning ciphertext available so far.
     * @param {Uint8Array} plaintext
     * @returns {Uint8Array}
     */
    push(plaintext) {
        const ptr0 = passArray8ToWasm0(plaintext, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.streamencryptor_push(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v2;
    }
}
if (Symbol.dispose) StreamEncryptor.prototype[Symbol.dispose] = StreamEncryptor.prototype.free;

/**
 * Decode base64 string to bytes.
 *
 * Returns null if the input is not valid base64.
 * @param {string} b64
 * @returns {Uint8Array | undefined}
 */
export function base64ToBytes(b64) {
    const ptr0 = passStringToWasm0(b64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.base64ToBytes(ptr0, len0);
    let v2;
    if (ret[0] !== 0) {
        v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v2;
}

/**
 * Encode bytes to base64 string.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function bytesToBase64(bytes) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.bytesToBase64(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Encode bytes to lowercase hex string.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function bytesToHex(bytes) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.bytesToHex(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Detect image dimensions from file bytes.
 *
 * Supports PNG, JPEG, GIF, WebP, and BMP.
 * Returns `{ width, height }` or null.
 * @param {Uint8Array} bytes
 * @returns {any}
 */
export function detectImageDimensions(bytes) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.detectImageDimensions(ptr0, len0);
    return ret;
}

/**
 * Detect MIME type from file bytes using magic numbers.
 *
 * Returns the MIME type string (e.g., "image/png", "video/mp4") or null.
 * @param {Uint8Array} bytes
 * @returns {string | undefined}
 */
export function detectMimeType(bytes) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.detectMimeType(ptr0, len0);
    let v2;
    if (ret[0] !== 0) {
        v2 = getStringFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v2;
}

/**
 * Decode hex string to bytes.
 *
 * Returns null if the input is not valid hex.
 * @param {string} hex
 * @returns {Uint8Array | undefined}
 */
export function hexToBytes(hex) {
    const ptr0 = passStringToWasm0(hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.hexToBytes(ptr0, len0);
    let v2;
    if (ret[0] !== 0) {
        v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v2;
}

/**
 * Initialize panic hook for better error messages in console.
 */
export function init() {
    wasm.init();
}

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_83742b46f01ce22d: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_a5a435bd7bbec835: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_bigint_get_as_i64_447a76b5c6ef7bda: function(arg0, arg1) {
            const v = arg1;
            const ret = typeof(v) === 'bigint' ? v : undefined;
            getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_boolean_get_c0f3f60bac5a78d1: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_5398f5bb970e0daa: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_41dbb8413020e076: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_bigint_e2141d4f045b7eda: function(arg0) {
            const ret = typeof(arg0) === 'bigint';
            return ret;
        },
        __wbg___wbindgen_is_function_3c846841762788c1: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_null_0b605fc6b167c56f: function(arg0) {
            const ret = arg0 === null;
            return ret;
        },
        __wbg___wbindgen_is_object_781bc9f159099513: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_7ef6b97b02428fae: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_52709e72fb9f179c: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_eq_ee31bfad3e536463: function(arg0, arg1) {
            const ret = arg0 === arg1;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_5bcc3bed3c69e72b: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_number_get_34bb9d9dcfa21373: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_395e606bd0ee4427: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_6ddd609b62940d55: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_2d781c1f4d5c0ef8: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_call_e133b57c9155d22c: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_crypto_38df2bab126b63dc: function(arg0) {
            const ret = arg0.crypto;
            return ret;
        },
        __wbg_done_08ce71ee07e3bd17: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_entries_e8a20ff8c9757101: function(arg0) {
            const ret = Object.entries(arg0);
            return ret;
        },
        __wbg_error_a6fa202b58aa1cd3: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_from_4bdf88943703fd48: function(arg0) {
            const ret = Array.from(arg0);
            return ret;
        },
        __wbg_getRandomValues_c44a50d8cfdaebeb: function() { return handleError(function (arg0, arg1) {
            arg0.getRandomValues(arg1);
        }, arguments); },
        __wbg_get_326e41e095fb2575: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_a8ee5c45dabc1b3b: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_unchecked_329cfe50afab7352: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_with_ref_key_6412cf3094599694: function(arg0, arg1) {
            const ret = arg0[arg1];
            return ret;
        },
        __wbg_instanceof_ArrayBuffer_101e2bf31071a9f6: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Map_f194b366846aca0c: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Map;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_740438561a5b956d: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_33b91feb269ff46e: function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        },
        __wbg_isSafeInteger_ecd6a7f9c3e053cd: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_iterator_d8f549ec8fb061b1: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_length_b3416cf66a5452c8: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_ea16607d7b61445b: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_msCrypto_bd5a034af96bcba6: function(arg0) {
            const ret = arg0.msCrypto;
            return ret;
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_49d5571bd3f0c4d4: function() {
            const ret = new Map();
            return ret;
        },
        __wbg_new_5f486cdf45a04d78: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_a70fbab9066b301f: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_ab79df5bd7c26067: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_from_slice_22da9388ac046e50: function(arg0, arg1) {
            const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_with_length_825018a1616e9e55: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        },
        __wbg_next_11b99ee6237339e3: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_next_e01a967809d1aa68: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_node_84ea875411254db1: function(arg0) {
            const ret = arg0.node;
            return ret;
        },
        __wbg_now_16f0c993d5dd6c27: function() {
            const ret = Date.now();
            return ret;
        },
        __wbg_process_44c7a14e11e9f69e: function(arg0) {
            const ret = arg0.process;
            return ret;
        },
        __wbg_prototypesetcall_d62e5099504357e6: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_push_e87b0e732085a946: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_randomFillSync_6c25eac9869eb53c: function() { return handleError(function (arg0, arg1) {
            arg0.randomFillSync(arg1);
        }, arguments); },
        __wbg_require_b4edbdcf3e2a1ef0: function() { return handleError(function () {
            const ret = module.require;
            return ret;
        }, arguments); },
        __wbg_set_282384002438957f: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_set_7eaa4f96924fd6b3: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_bf7251625df30a02: function(arg0, arg1, arg2) {
            const ret = arg0.set(arg1, arg2);
            return ret;
        },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_8adb955bd33fac2f: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_ad356e0db91c7913: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_f207c857566db248: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_bb9f1ba69d61b386: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_subarray_a068d24e39478a8a: function(arg0, arg1, arg2) {
            const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_value_21fc78aab0322612: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_versions_276b2795b1c6a219: function(arg0) {
            const ret = arg0.versions;
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0) {
            // Cast intrinsic for `I64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000005: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./chat_xdk_wasm_bg.js": import0,
    };
}

const ChatFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chat_free(ptr >>> 0, 1));
const StreamDecryptorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_streamdecryptor_free(ptr >>> 0, 1));
const StreamEncryptorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_streamencryptor_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('chat_xdk_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
