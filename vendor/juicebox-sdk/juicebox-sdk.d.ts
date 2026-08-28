/* tslint:disable */
/* eslint-disable */
/**
* Error returned during `Client.register`
*/
export enum RegisterError {
/**
* A realm rejected the `Client`'s auth token.
*/
  InvalidAuth = 0,
/**
* The SDK software is too old to communicate with this realm
* and must be upgraded.
*/
  UpgradeRequired = 1,
/**
* The tenant has exceeded their allowed number of operations. Try again
* later.
*/
  RateLimitExceeded = 2,
/**
* A software error has occurred. This request should not be retried
* with the same parameters. Verify your inputs, check for software
* updates and try again.
*/
  Assertion = 3,
/**
* A transient error in sending or receiving requests to a realm.
* This request may succeed by trying again with the same parameters.
*/
  Transient = 4,
}
/**
* Error returned during `Client.delete`
*/
export enum DeleteError {
/**
* A realm rejected the `Client`'s auth token.
*/
  InvalidAuth = 0,
/**
* The SDK software is too old to communicate with this realm
* and must be upgraded.
*/
  UpgradeRequired = 1,
/**
* The tenant has exceeded their allowed number of operations. Try again
* later.
*/
  RateLimitExceeded = 2,
/**
* A software error has occurred. This request should not be retried
* with the same parameters. Verify your inputs, check for software
* updates and try again.
*/
  Assertion = 3,
/**
* A transient error in sending or receiving requests to a realm.
* This request may succeed by trying again with the same parameters.
*/
  Transient = 4,
}
/**
* Error returned during `Client.recover`
*/
export enum RecoverErrorReason {
/**
* The secret could not be unlocked, but you can try again
* with a different PIN if you have guesses remaining. If no
* guesses remain, this secret is locked and inaccessible.
*/
  InvalidPin = 0,
/**
* The secret was not registered or not fully registered with the
* provided realms.
*/
  NotRegistered = 1,
/**
* A realm rejected the `Client`'s auth token.
*/
  InvalidAuth = 2,
/**
* The SDK software is too old to communicate with this realm
* and must be upgraded.
*/
  UpgradeRequired = 3,
/**
* The tenant has exceeded their allowed number of operations. Try again
* later.
*/
  RateLimitExceeded = 4,
/**
* A software error has occurred. This request should not be retried
* with the same parameters. Verify your inputs, check for software
* updates and try again.
*/
  Assertion = 5,
/**
* A transient error in sending or receiving requests to a realm.
* This request may succeed by trying again with the same parameters.
*/
  Transient = 6,
}
/**
*/
export class AuthTokenGenerator {
  free(): void;
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
  constructor(value: any);
/**
* @param {string} realm_id
* @param {string} secret_id
* @returns {string}
*/
  vend(realm_id: string, secret_id: string): string;
/**
* @returns {string}
*/
  static random_secret_id(): string;
}
/**
*/
export class Client {
  free(): void;
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
  constructor(configuration: Configuration, previous_configurations: Configuration[]);
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
  register(pin: Uint8Array, secret: Uint8Array, info: Uint8Array, num_guesses: number): Promise<void>;
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
  recover(pin: Uint8Array, info: Uint8Array): Promise<Uint8Array>;
/**
* Deletes the registered secret for this user, if any.
*
* @returns {Promise<void>} - If delete could not be completed successfully, the promise will
* be rejected with a {@link DeleteError}.
*/
  delete(): Promise<void>;
}
/**
* The parameters used to configure a `Client`.
*/
export class Configuration {
  free(): void;
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
  constructor(value: any);
}
/**
*/
export class RecoverError {
  free(): void;
/**
* Guesses remaining is only valid if `reason` is `InvalidPin`
*/
  guesses_remaining?: number;
/**
* The reason recovery failed.
*/
  reason: RecoverErrorReason;
}
