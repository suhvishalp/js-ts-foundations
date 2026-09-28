/**
 * The exhaustiveness check. Put it in the `default` branch of a switch over a union.
 * If every case is handled, `value` has been narrowed to `never` and this compiles.
 * Add a new member to the union and forget a case: the leftover member is not
 * assignable to `never`, and the build fails at this line.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
