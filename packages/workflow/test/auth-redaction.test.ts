import { recordConsumedAuth, redactedHeaders, REDACTED } from '../src/auth-redaction';

const request = (headers: Record<string, string>) => ({ headers });

describe('recordConsumedAuth / redactedHeaders', () => {
	it('should leave the request untouched', () => {
		const req = request({ authorization: 'Bearer secret', 'x-tenant-id': 'acme' });

		recordConsumedAuth(req, ['authorization']);
		redactedHeaders(req);

		expect(req.headers).toEqual({ authorization: 'Bearer secret', 'x-tenant-id': 'acme' });
	});

	it('should redact only the recorded headers', () => {
		const req = request({ authorization: 'Bearer secret', 'x-tenant-id': 'acme' });

		recordConsumedAuth(req, ['authorization']);

		expect(redactedHeaders(req)).toEqual({ authorization: REDACTED, 'x-tenant-id': 'acme' });
	});

	it('should redact a credential-named header', () => {
		const req = request({ test: 'secret-value', 'x-tenant-id': 'acme' });

		recordConsumedAuth(req, ['test']);

		expect(redactedHeaders(req)).toEqual({ test: REDACTED, 'x-tenant-id': 'acme' });
	});

	it('should accumulate across several records', () => {
		const req = request({ authorization: 'a', 'x-auth-token': 'b', keep: 'c' });

		recordConsumedAuth(req, ['authorization']);
		recordConsumedAuth(req, ['x-auth-token']);

		expect(redactedHeaders(req)).toEqual({
			authorization: REDACTED,
			'x-auth-token': REDACTED,
			keep: 'c',
		});
	});

	it('should ignore a recorded header the request never sent', () => {
		const req = request({ 'x-tenant-id': 'acme' });

		recordConsumedAuth(req, ['authorization']);

		expect(redactedHeaders(req)).toEqual({ 'x-tenant-id': 'acme' });
	});

	it('should return the headers unchanged when nothing was recorded', () => {
		const req = request({ authorization: 'Bearer caller-token' });

		expect(redactedHeaders(req)).toEqual({ authorization: 'Bearer caller-token' });
	});

	it('should not be enumerable on the request', () => {
		const req = request({ authorization: 'Bearer secret' });

		recordConsumedAuth(req, ['authorization']);

		expect(Object.keys(req)).toEqual(['headers']);
		expect({ ...req }).toEqual({ headers: { authorization: 'Bearer secret' } });
	});

	it('should match recorded name case-insensitively when header key is lowercased', () => {
		const req = request({ authorization: 'Bearer secret' });

		recordConsumedAuth(req, ['Authorization']);

		expect(redactedHeaders(req)).toEqual({ authorization: REDACTED });
	});

	it('should match recorded lowercased name when header key has mixed casing', () => {
		const req = request({ 'X-Api-Key': 'secret' });

		recordConsumedAuth(req, ['x-api-key']);

		expect(redactedHeaders(req)).toEqual({ 'X-Api-Key': REDACTED });
	});

	it('should match multiple recorded names regardless of casing', () => {
		const req = request({ authorization: 'a', 'X-AUTH-TOKEN': 'b', keep: 'c' });

		recordConsumedAuth(req, ['Authorization', 'X-Auth-Token']);

		expect(redactedHeaders(req)).toEqual({
			authorization: REDACTED,
			'X-AUTH-TOKEN': REDACTED,
			keep: 'c',
		});
	});
});
