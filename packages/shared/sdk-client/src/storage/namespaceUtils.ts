import { Context, Crypto } from '@launchdarkly/js-sdk-common';

export type Namespace = 'LaunchDarkly' | 'AnonymousKeys' | 'ContextKeys' | 'ContextIndex';

/**
 * Hashes the input and encodes it as base64
 */
function hashAndBase64Encode(crypto: Crypto): (input: string) => string {
  return (input) => crypto.createHash('sha256').update(input).digest('base64');
}

const noop = (input: string) => input; // no-op transform

export function concatNamespacesAndValues(
  parts: { value: Namespace | string; transform: (value: string) => string }[],
): string {
  const processedParts = parts.map((part) => part.transform(part.value)); // use the transform from each part to transform the value
  return processedParts.join('_');
}

export function namespaceForEnvironment(crypto: Crypto, sdkKey: string): string {
  return concatNamespacesAndValues([
    { value: 'LaunchDarkly', transform: noop },
    { value: sdkKey, transform: hashAndBase64Encode(crypto) }, // hash sdk key and encode it
  ]);
}

/**
 * @deprecated prefer {@link namespaceForGeneratedContextKey}. At one time we only generated keys for
 * anonymous contexts and they were namespaced in LaunchDarkly_AnonymousKeys.  Eventually we started
 * generating context keys for non-anonymous contexts such as for the Auto Environment Attributes
 * feature and those were namespaced in LaunchDarkly_ContextKeys.  This function can be removed
 * when the data under the LaunchDarkly_AnonymousKeys namespace is merged with data under the
 * LaunchDarkly_ContextKeys namespace.
 */
export function namespaceForAnonymousGeneratedContextKey(kind: string): string {
  return concatNamespacesAndValues([
    { value: 'LaunchDarkly', transform: noop },
    { value: 'AnonymousKeys', transform: noop },
    { value: kind, transform: noop }, // existing SDKs are not hashing or encoding this kind, though they should have
  ]);
}

export function namespaceForGeneratedContextKey(kind: string): string {
  return concatNamespacesAndValues([
    { value: 'LaunchDarkly', transform: noop },
    { value: 'ContextKeys', transform: noop },
    { value: kind, transform: noop }, // existing SDKs are not hashing or encoding this kind, though they should have
  ]);
}

export function namespaceForContextIndex(environmentNamespace: string): string {
  return concatNamespacesAndValues([
    { value: environmentNamespace, transform: noop },
    { value: 'ContextIndex', transform: noop },
  ]);
}

export function namespaceForContextData(
  crypto: Crypto,
  environmentNamespace: string,
  context: Context,
): string {
  return concatNamespacesAndValues([
    { value: environmentNamespace, transform: noop }, // use existing namespace as is, don't transform
    { value: context.canonicalKey, transform: hashAndBase64Encode(crypto) }, // hash and encode canonical key
  ]);
}
