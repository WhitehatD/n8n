import type { ICredentialDataDecryptedObject, IHttpRequestOptions } from 'n8n-workflow';

import { NotionApi } from '../NotionApi.credentials';

describe('NotionApi Credential', () => {
	const notionApi = new NotionApi();

	it('should have correct properties', () => {
		expect(notionApi.name).toBe('notionApi');
		expect(notionApi.displayName).toBe('Notion API');
		expect(notionApi.documentationUrl).toBe('notion');
		expect(notionApi.properties).toHaveLength(1);
	});

	describe('authenticate', () => {
		it('should add Authorization and Notion-Version headers', async () => {
			const credentials: ICredentialDataDecryptedObject = {
				apiKey: 'secret_abc123',
			};

			const requestOptions: IHttpRequestOptions = {
				headers: {},
				method: 'GET',
				url: 'https://api.notion.com/v1/users',
			};

			const result = await notionApi.authenticate(credentials, requestOptions);

			expect(result.headers).toEqual({
				Authorization: 'Bearer secret_abc123 ',
				'Notion-Version': '2022-02-22',
			});
		});

		it('should not override Notion-Version if already set (exact case)', async () => {
			const credentials: ICredentialDataDecryptedObject = {
				apiKey: 'secret_abc123',
			};

			const requestOptions: IHttpRequestOptions = {
				headers: {
					'Notion-Version': '2026-03-11',
				},
				method: 'GET',
				url: 'https://api.notion.com/v1/users',
			};

			const result = await notionApi.authenticate(credentials, requestOptions);

			expect(result.headers?.['Notion-Version']).toBe('2026-03-11');
			// Should not add the default version
			expect(Object.keys(result.headers ?? {})).not.toContain('2022-02-22');
		});

		it('should not override Notion-Version if already set (lowercase header, as HTTP Request node sends)', async () => {
			const credentials: ICredentialDataDecryptedObject = {
				apiKey: 'secret_abc123',
			};

			const requestOptions: IHttpRequestOptions = {
				headers: {
					'notion-version': '2026-03-11',
				},
				method: 'GET',
				url: 'https://api.notion.com/v1/users',
			};

			const result = await notionApi.authenticate(credentials, requestOptions);

			// The credential should recognize the lowercase version header
			// and not overwrite it with the default
			expect(result.headers?.['notion-version']).toBe('2026-03-11');
			expect(result.headers?.['Notion-Version']).toBeUndefined();
		});

		it('should preserve other existing headers', async () => {
			const credentials: ICredentialDataDecryptedObject = {
				apiKey: 'secret_abc123',
			};

			const requestOptions: IHttpRequestOptions = {
				headers: {
					'X-Custom-Header': 'custom-value',
				},
				method: 'GET',
				url: 'https://api.notion.com/v1/users',
			};

			const result = await notionApi.authenticate(credentials, requestOptions);

			expect(result.headers).toEqual({
				'X-Custom-Header': 'custom-value',
				Authorization: 'Bearer secret_abc123 ',
				'Notion-Version': '2022-02-22',
			});
		});
	});
});
