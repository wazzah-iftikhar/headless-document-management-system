export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T = never>(error: Error): Result<T> => ({ ok: false, error });

export const tryAsync = async <T>(
  fn: () => Promise<T>
): Promise<Result<T>> => {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(String(error))
    );
  }
};