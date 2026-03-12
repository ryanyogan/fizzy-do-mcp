import { describe, it, expect } from 'vitest';
import {
  FizzyError,
  FizzyApiError,
  FizzyAuthError,
  FizzyForbiddenError,
  FizzyNotFoundError,
  FizzyValidationError,
  FizzyNetworkError,
  FizzyConfigError,
  FizzyRateLimitError,
  toFizzyError,
} from './errors.js';

describe('FizzyError', () => {
  describe('FizzyApiError', () => {
    it('creates an API error with status', () => {
      const error = new FizzyApiError('Bad request', 400);
      expect(error.message).toBe('Bad request');
      expect(error.status).toBe(400);
      expect(error.code).toBe('API_ERROR');
      expect(error.name).toBe('FizzyApiError');
    });

    it('is retryable for 5xx errors', () => {
      expect(new FizzyApiError('Server error', 500).retryable).toBe(true);
      expect(new FizzyApiError('Bad gateway', 502).retryable).toBe(true);
      expect(new FizzyApiError('Service unavailable', 503).retryable).toBe(true);
    });

    it('is retryable for 429 rate limit', () => {
      expect(new FizzyApiError('Rate limited', 429).retryable).toBe(true);
    });

    it('is not retryable for 4xx client errors', () => {
      expect(new FizzyApiError('Bad request', 400).retryable).toBe(false);
      expect(new FizzyApiError('Not found', 404).retryable).toBe(false);
      expect(new FizzyApiError('Unauthorized', 401).retryable).toBe(false);
    });

    it('includes details in toJSON', () => {
      const error = new FizzyApiError('Validation failed', 422, { field: ['is required'] }, 30);
      const json = error.toJSON();
      expect(json).toEqual({
        name: 'FizzyApiError',
        code: 'API_ERROR',
        message: 'Validation failed',
        retryable: false,
        status: 422,
        details: { field: ['is required'] },
        retryAfter: 30,
      });
    });
  });

  describe('FizzyAuthError', () => {
    it('creates an auth error with default message', () => {
      const error = new FizzyAuthError();
      expect(error.message).toBe('Authentication failed. Check your access token.');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('accepts a custom message', () => {
      const error = new FizzyAuthError('Token expired');
      expect(error.message).toBe('Token expired');
    });
  });

  describe('FizzyForbiddenError', () => {
    it('creates a forbidden error with default message', () => {
      const error = new FizzyForbiddenError();
      expect(error.message).toBe('You do not have permission to perform this action.');
      expect(error.code).toBe('FORBIDDEN_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('accepts a custom message', () => {
      const error = new FizzyForbiddenError('Cannot delete board');
      expect(error.message).toBe('Cannot delete board');
    });
  });

  describe('FizzyNotFoundError', () => {
    it('creates a not found error with default message', () => {
      const error = new FizzyNotFoundError();
      expect(error.message).toBe('The requested resource was not found.');
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('includes resource info', () => {
      const error = new FizzyNotFoundError('Card not found', 'card', '123');
      expect(error.resourceType).toBe('card');
      expect(error.resourceId).toBe('123');
    });

    it('includes resource info in toJSON', () => {
      const error = new FizzyNotFoundError('Card not found', 'card', '123');
      const json = error.toJSON();
      expect(json.resourceType).toBe('card');
      expect(json.resourceId).toBe('123');
    });
  });

  describe('FizzyValidationError', () => {
    it('creates a validation error with issues', () => {
      const issues = [
        { path: ['title'], message: 'Required', code: 'required' },
        { path: ['board_id'], message: 'Invalid format' },
      ];
      const error = new FizzyValidationError('Validation failed', issues);
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.retryable).toBe(false);
      expect(error.issues).toEqual(issues);
    });

    it('includes issues in toJSON', () => {
      const issues = [{ path: ['title'], message: 'Required' }];
      const error = new FizzyValidationError('Validation failed', issues);
      const json = error.toJSON();
      expect(json.issues).toEqual(issues);
    });
  });

  describe('FizzyNetworkError', () => {
    it('creates a network error with default message', () => {
      const error = new FizzyNetworkError();
      expect(error.message).toBe('Network request failed.');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('accepts a cause error', () => {
      const cause = new Error('ECONNREFUSED');
      const error = new FizzyNetworkError('Connection refused', cause);
      expect(error.cause).toBe(cause);
    });

    it('includes cause in toJSON', () => {
      const cause = new Error('ECONNREFUSED');
      const error = new FizzyNetworkError('Connection refused', cause);
      const json = error.toJSON();
      expect(json.cause).toBe('ECONNREFUSED');
    });
  });

  describe('FizzyConfigError', () => {
    it('creates a config error', () => {
      const error = new FizzyConfigError('Missing access token');
      expect(error.message).toBe('Missing access token');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.retryable).toBe(false);
    });
  });

  describe('FizzyRateLimitError', () => {
    it('creates a rate limit error with default message', () => {
      const error = new FizzyRateLimitError();
      expect(error.message).toBe('Rate limit exceeded. Please slow down your requests.');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('includes retry-after header', () => {
      const error = new FizzyRateLimitError('Too many requests', 60);
      expect(error.retryAfter).toBe(60);
    });

    it('includes retryAfter in toJSON', () => {
      const error = new FizzyRateLimitError('Too many requests', 60);
      const json = error.toJSON();
      expect(json.retryAfter).toBe(60);
    });
  });

  describe('toFizzyError', () => {
    it('returns FizzyError instances unchanged', () => {
      const error = new FizzyAuthError();
      expect(toFizzyError(error)).toBe(error);
    });

    it('wraps Error instances in FizzyNetworkError', () => {
      const error = new Error('Network failure');
      const fizzyError = toFizzyError(error);
      expect(fizzyError).toBeInstanceOf(FizzyNetworkError);
      expect(fizzyError.message).toBe('Network failure');
      expect((fizzyError as FizzyNetworkError).cause).toBe(error);
    });

    it('wraps strings in FizzyNetworkError', () => {
      const fizzyError = toFizzyError('Something went wrong');
      expect(fizzyError).toBeInstanceOf(FizzyNetworkError);
      expect(fizzyError.message).toBe('Something went wrong');
    });

    it('wraps other types in FizzyNetworkError', () => {
      const fizzyError = toFizzyError({ code: 500 });
      expect(fizzyError).toBeInstanceOf(FizzyNetworkError);
      expect(fizzyError.message).toBe('[object Object]');
    });
  });

  describe('Error inheritance', () => {
    it('all errors are instances of Error', () => {
      expect(new FizzyApiError('test', 400)).toBeInstanceOf(Error);
      expect(new FizzyAuthError()).toBeInstanceOf(Error);
      expect(new FizzyForbiddenError()).toBeInstanceOf(Error);
      expect(new FizzyNotFoundError()).toBeInstanceOf(Error);
      expect(new FizzyValidationError('test', [])).toBeInstanceOf(Error);
      expect(new FizzyNetworkError()).toBeInstanceOf(Error);
      expect(new FizzyConfigError('test')).toBeInstanceOf(Error);
      expect(new FizzyRateLimitError()).toBeInstanceOf(Error);
    });

    it('all errors are instances of FizzyError', () => {
      expect(new FizzyApiError('test', 400)).toBeInstanceOf(FizzyError);
      expect(new FizzyAuthError()).toBeInstanceOf(FizzyError);
      expect(new FizzyForbiddenError()).toBeInstanceOf(FizzyError);
      expect(new FizzyNotFoundError()).toBeInstanceOf(FizzyError);
      expect(new FizzyValidationError('test', [])).toBeInstanceOf(FizzyError);
      expect(new FizzyNetworkError()).toBeInstanceOf(FizzyError);
      expect(new FizzyConfigError('test')).toBeInstanceOf(FizzyError);
      expect(new FizzyRateLimitError()).toBeInstanceOf(FizzyError);
    });

    it('errors have proper stack traces', () => {
      const error = new FizzyApiError('test', 400);
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('FizzyApiError');
    });
  });
});
