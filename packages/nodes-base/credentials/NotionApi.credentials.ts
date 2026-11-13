import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

export class NotionApi implements ICredentialType {
	name = 'notionApi';

	displayName = 'Notion API';

	documentationUrl = 'notion';

	properties: INodeProperties[] = [
		{
			displayName: 'Internal Integration Secret',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.notion.com/v1',
			url: '/users/me',
		},
	};

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		requestOptions.headers = {
			...requestOptions.headers,
			Authorization: `Bearer ${credentials.apiKey} `,
		};

		// if version it's not set, set it to last one
		// version is only set when the request is made from
		// the notion node, or was set explicitly in the http node.
		// HTTP Request node lowercases header names, so check
		// case-insensitively to avoid overriding a user-set version.
		const notionVersionKey = Object.keys(requestOptions.headers).find(
			(key) => key.toLowerCase() === 'notion-version',
		);
		if (!notionVersionKey) {
			requestOptions.headers = {
				...requestOptions.headers,
				'Notion-Version': '2022-02-22',
			};
		}

		return requestOptions;
	}
}
