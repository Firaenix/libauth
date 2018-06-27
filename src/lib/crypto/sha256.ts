import {
  decodeBase64String,
  HashFunction,
  instantiateRustWasm,
  sha256Base64Bytes
} from '../bin';

export interface Sha256 extends HashFunction {
  /**
   * Returns the sha256 hash of the provided input.
   *
   * To incrementally construct a sha256 hash (e.g. for streaming), use `init`,
   * `update`, and `final`.
   *
   * @param input a Uint8Array to be hashed using sha256
   */
  readonly hash: (input: Uint8Array) => Uint8Array;

  /**
   * Begin an incremental sha256 hashing computation.
   *
   * The returned raw state can be provided to `update` with additional input to
   * advance the computation.
   *
   * ## Example
   * ```ts
   * const state1 = sha256.init();
   * const state2 = sha256.update(state1, new Uint8Array([1, 2, 3]));
   * const state3 = sha256.update(state2, new Uint8Array([4, 5, 6]));
   * const hash = sha256.final(state3);
   * ```
   */
  readonly init: () => Uint8Array;

  /**
   * Add input to an incremental sha256 hashing computation.
   *
   * Returns a raw state which can again be passed to `update` with additional
   * input to continue the computation.
   *
   * When the computation has been updated with all input, pass the raw state to
   * `final` to finish and return a hash.
   *
   * @param rawState a raw state returned by either `init` or `update`
   * @param input a Uint8Array to be added to the sha256 computation
   */
  readonly update: (rawState: Uint8Array, input: Uint8Array) => Uint8Array;

  /**
   * Finish an incremental sha256 hashing computation.
   *
   * Returns the final hash.
   *
   * @param rawState a raw state returned by `update`.
   */
  readonly final: (rawState: Uint8Array) => Uint8Array;
}

/**
 * An ultimately-portable (but slower) version of `instantiateSha256Bytes`
 * which does not require the consumer to provide the sha256 binary buffer.
 */
export async function instantiateSha256(): Promise<Sha256> {
  return instantiateSha256Bytes(getEmbeddedSha256Binary());
}

/**
 * The most performant way to instantiate sha256 functionality. To avoid
 * using Node.js or DOM-specific APIs, you can use `instantiateSha256`.
 *
 * @param webassemblyBytes A buffer containing the sha256 binary.
 */
export async function instantiateSha256Bytes(
  webassemblyBytes: ArrayBuffer
): Promise<Sha256> {
  const wasm = await instantiateRustWasm(
    webassemblyBytes,
    './sha256',
    'sha256',
    'sha256_init',
    'sha256_update',
    'sha256_final'
  );
  return {
    final: wasm.final,
    hash: wasm.hash,
    init: wasm.init,
    update: wasm.update
  };
}

export function getEmbeddedSha256Binary(): ArrayBuffer {
  return decodeBase64String(sha256Base64Bytes);
}
