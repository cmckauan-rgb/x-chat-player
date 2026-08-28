let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let WASM_VECTOR_LEN = 0;

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8Memory0();

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
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let cachedFloat64Memory0 = null;

function getFloat64Memory0() {
    if (cachedFloat64Memory0 === null || cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
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
    if (builtInMatches.length > 1) {
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

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

            } else {
                state.a = a;
            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_40(arg0, arg1) {
    wasm.wasm_bindgen__convert__closures__invoke0_mut__h049e4b2574a589ac(arg0, arg1);
}

function __wbg_adapter_43(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h664375554e075ae3(arg0, arg1, addHeapObject(arg2));
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
function __wbg_adapter_144(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h35a3737c9c8313d7(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

/**
* Error returned during `Client.register`
*/
export const RegisterError = Object.freeze({
/**
* A realm rejected the `Client`'s auth token.
*/
InvalidAuth:0,"0":"InvalidAuth",
/**
* The SDK software is too old to communicate with this realm
* and must be upgraded.
*/
UpgradeRequired:1,"1":"UpgradeRequired",
/**
* The tenant has exceeded their allowed number of operations. Try again
* later.
*/
RateLimitExceeded:2,"2":"RateLimitExceeded",
/**
* A software error has occurred. This request should not be retried
* with the same parameters. Verify your inputs, check for software
* updates and try again.
*/
Assertion:3,"3":"Assertion",
/**
* A transient error in sending or receiving requests to a realm.
* This request may succeed by trying again with the same parameters.
*/
Transient:4,"4":"Transient", });
/**
* Error returned during `Client.delete`
*/
export const DeleteError = Object.freeze({
/**
* A realm rejected the `Client`'s auth token.
*/
InvalidAuth:0,"0":"InvalidAuth",
/**
* The SDK software is too old to communicate with this realm
* and must be upgraded.
*/
UpgradeRequired:1,"1":"UpgradeRequired",
/**
* The tenant has exceeded their allowed number of operations. Try again
* later.
*/
RateLimitExceeded:2,"2":"RateLimitExceeded",
/**
* A software error has occurred. This request should not be retried
* with the same parameters. Verify your inputs, check for software
* updates and try again.
*/
Assertion:3,"3":"Assertion",
/**
* A transient error in sending or receiving requests to a realm.
* This request may succeed by trying again with the same parameters.
*/
Transient:4,"4":"Transient", });
/**
* Error returned during `Client.recover`
*/
export const RecoverErrorReason = Object.freeze({
/**
* The secret could not be unlocked, but you can try again
* with a different PIN if you have guesses remaining. If no
* guesses remain, this secret is locked and inaccessible.
*/
InvalidPin:0,"0":"InvalidPin",
/**
* The secret was not registered or not fully registered with the
* provided realms.
*/
NotRegistered:1,"1":"NotRegistered",
/**
* A realm rejected the `Client`'s auth token.
*/
InvalidAuth:2,"2":"InvalidAuth",
/**
* The SDK software is too old to communicate with this realm
* and must be upgraded.
*/
UpgradeRequired:3,"3":"UpgradeRequired",
/**
* The tenant has exceeded their allowed number of operations. Try again
* later.
*/
RateLimitExceeded:4,"4":"RateLimitExceeded",
/**
* A software error has occurred. This request should not be retried
* with the same parameters. Verify your inputs, check for software
* updates and try again.
*/
Assertion:5,"5":"Assertion",
/**
* A transient error in sending or receiving requests to a realm.
* This request may succeed by trying again with the same parameters.
*/
Transient:6,"6":"Transient", });
/**
*/
export class AuthTokenGenerator {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_authtokengenerator_free(ptr);
    }
    /**
    * Constructs a new generator from an Object.
    *
    * The provided Object must contain the following parameters:
    *
    * - `key`: A hex string representing the private signing key.
    *
    * - `tenant`: The name of the tenant the key belongs to.
    *
    * - `version`: The integer version of the signing key.
    *
    * An example generator looks like:
    * ```js
    * const generator = new AuthTokenGenerator({
    *     "key": "0668e97c5d282a08d4251255541845e2d78b78b9438e1562b51d9cf4e099be53",
    *     "tenant": "acme",
    *     "version": 1
    *   });
    * ```
    * @param {any} value
    */
    constructor(value) {
        const ret = wasm.authtokengenerator_new(addHeapObject(value));
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
    /**
    * @param {string} realm_id
    * @param {string} secret_id
    * @returns {string}
    */
    vend(realm_id, secret_id) {
        let deferred3_0;
        let deferred3_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(realm_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(secret_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            wasm.authtokengenerator_vend(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred3_0 = r0;
            deferred3_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
    * @returns {string}
    */
    static random_secret_id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.authtokengenerator_random_secret_id(retptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
/**
*/
export class Client {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_client_free(ptr);
    }
    /**
    * Initializes a new client with the provided configuration.
    *
    * A `Client` requires authentication, which is acquired through
    * a `JuiceboxGetAuthToken(realmId: Uint8Array): Promise<string>`
    * that you must define globally.
    *
    * @param {Configuration} configuration - Represents the current configuration.
    * The configuration provided must include at least one `Realm`.
    * @param {Configuration[]} previous_configurations - Represents any other
    * configurations you have previously registered with that you may not yet
    * have migrated the data from. During {@link Client#recover}, they will be
    * tried if the current user has not yet registered on the current configuration.
    * These should be ordered from most recently to least recently used.
    */
    constructor(configuration, previous_configurations) {
        _assertClass(configuration, Configuration);
        var ptr0 = configuration.__destroy_into_raw();
        const ret = wasm.client_new(ptr0, addHeapObject(previous_configurations));
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
    /**
    * Stores a new PIN-protected secret on the configured realms.
    *
    * @param {Uint8Array} pin - A user provided PIN. If using a strong
    * `PinHashingMode`, this can safely be a low-entropy value.
    * @param {Uint8Array} secret - A user provided secret with a maximum
    * length of 128-bytes.
    * @param {Uint8Array} info - Additional data added to the salt for the
    * configured `PinHashingMode`.
    * The chosen data must be consistent between registration and recovery or
    * recovery will fail. This data does not need to be a well-kept secret. A
    * user's ID is a reasonable choice, but even the name of the company or
    * service could be viable if nothing else is available.
    * @param {number} num_guesses - The number of guesses allowed before the
    * secret can no longer be accessed.
    *
    * @returns {Promise<void>} – If registration could not be completed successfully,
    * the promise will be rejected with a {@link RegisterError}.
    */
    register(pin, secret, info, num_guesses) {
        const ptr0 = passArray8ToWasm0(pin, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(secret, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(info, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.client_register(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, num_guesses);
        return takeObject(ret);
    }
    /**
    * Retrieves a PIN-protected secret from the configured realms, or falls back to the
    * previous realms if the current realms do not have any secret registered.
    *
    * @param {Uint8Array} pin - A user provided PIN. If using a strong `PinHashingMode`,
    * this can safely be a low-entropy value.
    * @param {Uint8Array} info - Additional data added to the salt for the configured
    * `PinHashingMode`.
    * The chosen data must be consistent between registration and recovery or recovery
    * will fail. This data does not need to be a well-kept secret. A user's ID is a reasonable
    * choice, but even the name of the company or service could be viable if nothing else
    * is available.
    *
    * @returns {Promise<Uint8Array>} - The recovered user provided secret. If recovery could not
    * be completed successfully, the promise will be rejected with a {@link RecoverError}.
    */
    recover(pin, info) {
        const ptr0 = passArray8ToWasm0(pin, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(info, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.client_recover(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * Deletes the registered secret for this user, if any.
    *
    * @returns {Promise<void>} - If delete could not be completed successfully, the promise will
    * be rejected with a {@link DeleteError}.
    */
    delete() {
        const ret = wasm.client_delete(this.__wbg_ptr);
        return takeObject(ret);
    }
}
/**
* The parameters used to configure a `Client`.
*/
export class Configuration {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_configuration_free(ptr);
    }
    /**
    * Constructs a new configuration from an Object.
    *
    * The provided Object must contain the following parameters:
    *
    * - `realms`: An array of remote services that the client interacts with.
    *
    * Each `realm` is itself an Object containing an: id, address, and optionally a public_key.
    *
    * There must be between `registerThreshold` and 255
    * realms, inclusive.
    * - `registerThreshold`: A registration will be considered successful if it's successful
    * on at least this many realms.
    *
    * Must be between `recoverThreshold` and `realms.count`, inclusive.
    * - `recoverThreshold`: A recovery (or an adversary) will need the cooperation of this
    * many realms to retrieve the secret.
    *
    * Must be between `ceil(realms.count / 2)` and `realms.count`, inclusive.
    * - `pinHashingMode`: Defines how the provided PIN will be hashed before register and
    * recover operations. Changing modes will make previous secrets stored on the realms
    * inaccessible with the same PIN and should not be done without re-registering secrets.
    *
    * Possible pinHashingModes are:
    * - `Standard2019` - A tuned hash, secure for use on modern devices as of 2019 with low-entropy PINs.
    * - `FastInsecure` - A fast hash used for testing. Do not use in production.
    *
    * An example configuration looks like:
    * ```js
    * const configuration = new Configuration({
    *     realms: [
    *         {
    *             "address": "https://juicebox.hsm.realm.address",
    *             "id": "0102030405060708090a0b0c0d0e0f10",
    *             "public_key": "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"
    *         },
    *         {
    *             "address": "https://your.software.realm.address",
    *             "id": "2102030405060708090a0b0c0d0e0f10"
    *         },
    *         {
    *             "address": "https://juicebox.software.realm.address",
    *             "id": "3102030405060708090a0b0c0d0e0f10"
    *         }
    *     ],
    *     register_threshold: 3,
    *     recover_threshold: 3,
    *     pin_hashing_mode: "Standard2019"
    * });
    * ```
    * @param {any} value
    */
    constructor(value) {
        const ret = wasm.configuration_new(addHeapObject(value));
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
}
/**
*/
export class RecoverError {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(RecoverError.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_recovererror_free(ptr);
    }
    /**
    * The reason recovery failed.
    * @returns {RecoverErrorReason}
    */
    get reason() {
        const ret = wasm.__wbg_get_recovererror_reason(this.__wbg_ptr);
        return ret;
    }
    /**
    * The reason recovery failed.
    * @param {RecoverErrorReason} arg0
    */
    set reason(arg0) {
        wasm.__wbg_set_recovererror_reason(this.__wbg_ptr, arg0);
    }
    /**
    * Guesses remaining is only valid if `reason` is `InvalidPin`
    * @returns {number | undefined}
    */
    get guesses_remaining() {
        const ret = wasm.__wbg_get_recovererror_guesses_remaining(this.__wbg_ptr);
        return ret === 0xFFFFFF ? undefined : ret;
    }
    /**
    * Guesses remaining is only valid if `reason` is `InvalidPin`
    * @param {number | undefined} [arg0]
    */
    set guesses_remaining(arg0) {
        wasm.__wbg_set_recovererror_guesses_remaining(this.__wbg_ptr, isLikeNone(arg0) ? 0xFFFFFF : arg0);
    }
}

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbg_recovererror_new(arg0) {
    const ret = RecoverError.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_cb_drop(arg0) {
    const obj = takeObject(arg0).original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    const ret = false;
    return ret;
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbindgen_is_string(arg0) {
    const ret = typeof(getObject(arg0)) === 'string';
    return ret;
};

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbindgen_in(arg0, arg1) {
    const ret = getObject(arg0) in getObject(arg1);
    return ret;
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_fetch_edb546a0ab30aba2(arg0) {
    const ret = fetch(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_setTimeout_de06f469be594d94() { return handleError(function (arg0, arg1) {
    const ret = setTimeout(getObject(arg0), arg1);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_JuiceboxGetAuthToken_b281475283f56b2c() { return handleError(function (arg0) {
    const ret = JuiceboxGetAuthToken(takeObject(arg0));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_abda76e883ba8a5f() {
    const ret = new Error();
    return addHeapObject(ret);
};

export function __wbg_stack_658279fe44541cf6(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_error_f851667af71bcfc6(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_queueMicrotask_4d890031a6a5a50c(arg0) {
    queueMicrotask(getObject(arg0));
};

export function __wbg_queueMicrotask_adae4bc085237231(arg0) {
    const ret = getObject(arg0).queueMicrotask;
    return addHeapObject(ret);
};

export function __wbindgen_is_function(arg0) {
    const ret = typeof(getObject(arg0)) === 'function';
    return ret;
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_jsval_loose_eq(arg0, arg1) {
    const ret = getObject(arg0) == getObject(arg1);
    return ret;
};

export function __wbindgen_boolean_get(arg0) {
    const v = getObject(arg0);
    const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    return ret;
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
};

export function __wbindgen_as_number(arg0) {
    const ret = +getObject(arg0);
    return ret;
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbg_getwithrefkey_4a92a5eca60879b9(arg0, arg1) {
    const ret = getObject(arg0)[getObject(arg1)];
    return addHeapObject(ret);
};

export function __wbg_now_0343d9c3e0e8eedc() {
    const ret = Date.now();
    return ret;
};

export function __wbg_now_b724952e890dc703(arg0) {
    const ret = getObject(arg0).now();
    return ret;
};

export function __wbg_headers_d135d2bb8cc60413(arg0) {
    const ret = getObject(arg0).headers;
    return addHeapObject(ret);
};

export function __wbg_newwithstrandinit_f581dff0d19a8b03() { return handleError(function (arg0, arg1, arg2) {
    const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_set_27f236f6d7a28c29() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).set(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_arrayBuffer_a9d862b05aaee2f9(arg0) {
    const ret = getObject(arg0).arrayBuffer();
    return addHeapObject(ret);
};

export function __wbg_instanceof_Response_4c3b1446206114d1(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Response;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_status_d6d47ad2837621eb(arg0) {
    const ret = getObject(arg0).status;
    return ret;
};

export function __wbg_headers_24def508a7518df9(arg0) {
    const ret = getObject(arg0).headers;
    return addHeapObject(ret);
};

export function __wbg_blob_c6537f3e31e66dad() { return handleError(function (arg0) {
    const ret = getObject(arg0).blob();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_crypto_58f13aa23ffcb166(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
};

export function __wbg_process_5b786e71d465a513(arg0) {
    const ret = getObject(arg0).process;
    return addHeapObject(ret);
};

export function __wbg_versions_c2ab80650590b6a2(arg0) {
    const ret = getObject(arg0).versions;
    return addHeapObject(ret);
};

export function __wbg_node_523d7bd03ef69fba(arg0) {
    const ret = getObject(arg0).node;
    return addHeapObject(ret);
};

export function __wbg_msCrypto_abcb1295e768d1f2(arg0) {
    const ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
};

export function __wbg_require_2784e593a4674877() { return handleError(function () {
    const ret = module.require;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_randomFillSync_a0d98aa11c81fe89() { return handleError(function (arg0, arg1) {
    getObject(arg0).randomFillSync(takeObject(arg1));
}, arguments) };

export function __wbg_getRandomValues_504510b5564925af() { return handleError(function (arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
}, arguments) };

export function __wbg_get_f01601b5a68d10e3(arg0, arg1) {
    const ret = getObject(arg0)[arg1 >>> 0];
    return addHeapObject(ret);
};

export function __wbg_length_1009b1af0c481d7b(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_newnoargs_c62ea9419c21fbac(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_next_9b877f231f476d01(arg0) {
    const ret = getObject(arg0).next;
    return addHeapObject(ret);
};

export function __wbg_next_6529ee0cca8d57ed() { return handleError(function (arg0) {
    const ret = getObject(arg0).next();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_done_5fe336b092d60cf2(arg0) {
    const ret = getObject(arg0).done;
    return ret;
};

export function __wbg_value_0c248a78fdc8e19f(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
};

export function __wbg_iterator_db7ca081358d4fb2() {
    const ret = Symbol.iterator;
    return addHeapObject(ret);
};

export function __wbg_get_7b48513de5dc5ea4() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_90c26b09837aba1c() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_9fb8d994e1c0aaac() {
    const ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_self_f0e34d89f33b99fd() { return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_d3b084224f4774d7() { return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_9caa27ff917c6860() { return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_35dfdd59a4da3e74() { return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_from_71add2e723d1f1b2(arg0) {
    const ret = Array.from(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_isArray_74fb723e24f76012(arg0) {
    const ret = Array.isArray(getObject(arg0));
    return ret;
};

export function __wbg_instanceof_ArrayBuffer_e7d53d51371448e2(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof ArrayBuffer;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_call_5da1969d7cd31ccd() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_isSafeInteger_f93fde0dca9820f8(arg0) {
    const ret = Number.isSafeInteger(getObject(arg0));
    return ret;
};

export function __wbg_entries_9e2e2aa45aa5094a(arg0) {
    const ret = Object.entries(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_new_60f57089c7563e81(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_144(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return addHeapObject(ret);
    } finally {
        state0.a = state0.b = 0;
    }
};

export function __wbg_resolve_6e1c6553a82f85b7(arg0) {
    const ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_then_3ab08cd4fbb91ae9(arg0, arg1) {
    const ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_then_8371cc12cfedc5a2(arg0, arg1, arg2) {
    const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_buffer_a448f833075b71ba(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_d0482f893617af71(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_new_8f67e318f15d7254(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_2357bf09366ee480(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_1d25fa9e4ac21ce7(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_instanceof_Uint8Array_bced6f43aed8c1aa(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Uint8Array;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_newwithlength_6c2df9e2f3028c43(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_subarray_2e940e41c0f5a1d9(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_stringify_e1b19966d964d242() { return handleError(function (arg0) {
    const ret = JSON.stringify(getObject(arg0));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_set_759f75cd92b612d2() { return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
}, arguments) };

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper610(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 123, __wbg_adapter_40);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper901(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 217, __wbg_adapter_43);
    return addHeapObject(ret);
};

