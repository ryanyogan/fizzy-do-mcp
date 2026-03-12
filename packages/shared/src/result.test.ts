import { describe, it, expect } from 'vitest';
import {
  Ok,
  Err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  map,
  mapErr,
  andThen,
  fromPromise,
  fromTry,
  type Result,
} from './result.js';

describe('Result', () => {
  describe('Ok', () => {
    it('creates a successful result', () => {
      const result = Ok(42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it('works with complex types', () => {
      const result = Ok({ name: 'test', value: [1, 2, 3] });
      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ name: 'test', value: [1, 2, 3] });
    });

    it('works with null and undefined', () => {
      expect(Ok(null).value).toBe(null);
      expect(Ok(undefined).value).toBe(undefined);
    });
  });

  describe('Err', () => {
    it('creates a failed result', () => {
      const error = new Error('test error');
      const result = Err(error);
      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
    });

    it('works with custom error types', () => {
      const result = Err({ code: 'NOT_FOUND', message: 'Resource not found' });
      expect(result.ok).toBe(false);
      expect(result.error).toEqual({ code: 'NOT_FOUND', message: 'Resource not found' });
    });
  });

  describe('isOk', () => {
    it('returns true for Ok results', () => {
      expect(isOk(Ok(42))).toBe(true);
    });

    it('returns false for Err results', () => {
      expect(isOk(Err(new Error('test')))).toBe(false);
    });

    it('narrows the type correctly', () => {
      const result: Result<number, Error> = Ok(42);
      if (isOk(result)) {
        // TypeScript should know this is a number
        const value: number = result.value;
        expect(value).toBe(42);
      }
    });
  });

  describe('isErr', () => {
    it('returns true for Err results', () => {
      expect(isErr(Err(new Error('test')))).toBe(true);
    });

    it('returns false for Ok results', () => {
      expect(isErr(Ok(42))).toBe(false);
    });

    it('narrows the type correctly', () => {
      const result: Result<number, Error> = Err(new Error('test'));
      if (isErr(result)) {
        // TypeScript should know this is an Error
        const error: Error = result.error;
        expect(error.message).toBe('test');
      }
    });
  });

  describe('unwrap', () => {
    it('returns the value for Ok results', () => {
      expect(unwrap(Ok(42))).toBe(42);
    });

    it('throws the error for Err results', () => {
      const error = new Error('test error');
      expect(() => unwrap(Err(error))).toThrow(error);
    });
  });

  describe('unwrapOr', () => {
    it('returns the value for Ok results', () => {
      expect(unwrapOr(Ok(42), 0)).toBe(42);
    });

    it('returns the default value for Err results', () => {
      expect(unwrapOr(Err(new Error('test')), 0)).toBe(0);
    });
  });

  describe('map', () => {
    it('transforms the value for Ok results', () => {
      const result = map(Ok(21), (x) => x * 2);
      expect(result.ok).toBe(true);
      expect((result as { ok: true; value: number }).value).toBe(42);
    });

    it('passes through Err results unchanged', () => {
      const error = new Error('test');
      const result = map(Err(error), (x: number) => x * 2);
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: Error }).error).toBe(error);
    });
  });

  describe('mapErr', () => {
    it('transforms the error for Err results', () => {
      const result = mapErr(Err('not found'), (e) => new Error(e));
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: Error }).error.message).toBe('not found');
    });

    it('passes through Ok results unchanged', () => {
      const result = mapErr(Ok(42), (e: string) => new Error(e));
      expect(result.ok).toBe(true);
      expect((result as { ok: true; value: number }).value).toBe(42);
    });
  });

  describe('andThen', () => {
    it('chains successful results', () => {
      const double = (x: number): Result<number, Error> => Ok(x * 2);
      const result = andThen(Ok(21), double);
      expect(result.ok).toBe(true);
      expect((result as { ok: true; value: number }).value).toBe(42);
    });

    it('short-circuits on error', () => {
      const error = new Error('first error');
      const double = (x: number): Result<number, Error> => Ok(x * 2);
      const result = andThen(Err(error), double);
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: Error }).error).toBe(error);
    });

    it('propagates errors from the function', () => {
      const fail = (_x: number): Result<number, Error> => Err(new Error('failed'));
      const result = andThen(Ok(42), fail);
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: Error }).error.message).toBe('failed');
    });
  });

  describe('fromPromise', () => {
    it('wraps successful promises', async () => {
      const result = await fromPromise(Promise.resolve(42));
      expect(result.ok).toBe(true);
      expect((result as { ok: true; value: number }).value).toBe(42);
    });

    it('wraps rejected promises', async () => {
      const error = new Error('test error');
      const result = await fromPromise(Promise.reject(error));
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: Error }).error).toBe(error);
    });

    it('uses custom error mapper', async () => {
      const result = await fromPromise(
        Promise.reject('string error'),
        (e) => new Error(`Mapped: ${e}`),
      );
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: Error }).error.message).toBe('Mapped: string error');
    });
  });

  describe('fromTry', () => {
    it('wraps successful functions', () => {
      const result = fromTry(() => 42);
      expect(result.ok).toBe(true);
      expect((result as { ok: true; value: number }).value).toBe(42);
    });

    it('wraps throwing functions', () => {
      const error = new Error('test error');
      const result = fromTry(() => {
        throw error;
      });
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: Error }).error).toBe(error);
    });

    it('uses custom error mapper', () => {
      const result = fromTry(
        () => {
          throw 'string error';
        },
        (e) => new Error(`Mapped: ${e}`),
      );
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: Error }).error.message).toBe('Mapped: string error');
    });
  });
});
