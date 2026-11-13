import type { ICredentialDataDecryptedObject, IHttpRequestOptions } from 'n8n-workflow';

import { NotionApi } from '../NotionApi.credentials';

describe('NotionApi Credential', () => {
	const notionApi = new NotionApi();

	describe('authenticate', () => {
		it('should add Authorization header with API key', async () => {
			const credentials: ICredentialDataDecryptedObject = {
				apiKey: 'secret_notion_key_123',
			};

			const requestOptions: IHttpRequestOptions = {
				headers: {},
				url: 'https://api.notion.com/v1/users',
			};

			const result = await notionApi.authenticate(credentials, requestOptions);

			expect(result.headers).toEqual({
				Authorization: 'Bearer secret_notion_key_123 ',
				'Notion-Version': '2022-02-22',
			});
		});

		it('should set Notion-Version when no version header is present', async () => {
			const credentials: ICredentialDataDecryptedObject = {
				apiKey: 'secret_notion_key_123',
			};

			const requestOptions: IHttpRequestOptions = {
				headers: {
					'Content-Type': 'application/json',
				},
				url: 'https://api.notion.com/v1/users',
			};

			const result = await notionApi.authenticate(credentials, requestOptions);

			expect(result.headers).toEqual({
				'Content-Type': 'application/json',
				Authorization: 'Bearer secret_notion_key_123 ',
				'Notion-Version': '2022-02-22',
			});
		});

		it('should preserve a user-set Notion-Version header with original casing', async () => {
			const credentials: ICredentialDataDecryptedObject = {
				apiKey: 'secret_notion_key_123',
			};

			const requestOptions: IHttpRequestOptions = {
				headers: {
					'Notion-Version': '2026-03-11',
				},
				url: 'https://api.notion.com/v1/search',
			};

			const result = await notionApi.authenticate(credentials, requestOptions);

			expect(result.headers).toEqual({
				'Notion-Version': '2026-03-11',
				Authorization: 'Bearer secret_notion_key_123 ',
			});
		});

		it('should preserve a user-set notion-version header with lowercase casing', async () => {
			const credentials: ICredentialDataDecryptedObject = {
				apiKey: 'secret_notion_key_123',
			};

			const requestOptions: IHttpRequestOptions = {
				headers: {
					'notion-version': '2026-03-11',
				},
				url: 'https://api.notion.com/v1/search',
			};

			const result = await notionApi.authenticate(credentials, requestOptions);

			expect(result.headers).toEqual({
				'notion-version': '2026-03-11',
				Authorization: 'Bearer secret_notion_key_123 ',
			});
		});

		it('should preserve a user-set NOTION-VERSION header with uppercase casing', async () => {
			const credentials: ICredentialDataDecryptedObject = {
				apiKey: 'secret_notion_key_123',
			};

			const requestOptions: IHttpRequestOptions = {
				headers: {
					'NOTION-VERSION': '2026-03-11',
				},
				url: 'https://api.notion.com/v1/search',
			};

			const result = await notionApi.authenticate(credentials, requestOptions);

			expect(result.headers).toEqual({
				'NOTION-VERSION': '2026-03-11',
				Authorization: 'Bearer secret_notion_key_123 ',
			});
		});

		it('should preserve user headers alongside the default version when no version header is set', async () => {
			const credentials: ICredentialDataDecryptedObject = {
				apiKey: 'secret_notion_key_123',
			};

			const requestOptions: IHttpRequestOptions = {
				headers: {
					'X-Custom-Header': 'custom-value',
				},
				url: 'https://api.notion.com/v1/search',
			};

			const result = await notionApi.authenticate(credentials, requestOptions);

			expect(result.headers).toEqual({
				'X-Custom-Header': 'custom-value',
				Authorization: 'Bearer secret_notion_key_123 ',
				'Notion-Version': '2022-02-22',
			});
		});
	});
});
