import { auditOperations } from '../AuditDescription';
import { N8n } from '../N8n.node';
import { projectOperations } from '../ProjectDescription';
import { userOperations } from '../UserDescription';
import { N8nApi } from '../../../credentials/N8nApi.credentials';

function collectUrls(value: unknown): string[] {
	if (Array.isArray(value)) return value.flatMap(collectUrls);
	if (value === null || typeof value !== 'object') return [];

	return Object.entries(value).flatMap(([key, child]) => {
		if (key === 'url' && typeof child === 'string') return [child];
		return collectUrls(child);
	});
}

describe('n8n Node Structure', () => {
	it.each([
		['audit', auditOperations],
		['project', projectOperations],
		['user', userOperations],
	])('%s operation default should be one of its options', (_resource, operations) => {
		const operation = operations[0];
		const values = (operation.options as Array<{ value: string }>).map((o) => o.value);
		expect(values).toContain(operation.default);
	});

	it('encodes every dynamic request URL path segment', () => {
		const dynamicUrls = collectUrls(new N8n().description.properties).filter(
			(url) => url.includes('$value') || url.includes('$parameter'),
		);

		expect(dynamicUrls.length).toBeGreaterThan(0);
		for (const url of dynamicUrls) {
			const dynamicExpressions = [...url.matchAll(/{{\s*(.*?)\s*}}/g)]
				.map((match) => match[1])
				.filter((expression) => expression.includes('$value') || expression.includes('$parameter'));

			expect(url.replace(/{{\s*(.*?)\s*}}/g, '')).not.toMatch(/\$(?:value|parameter)/);
			expect(dynamicExpressions.length).toBeGreaterThan(0);
			for (const expression of dynamicExpressions) {
				expect(expression).toMatch(/^toPathSegment\(.+\)$/);
			}
		}
	});

	it('requestDefaults.baseURL ensures trailing slash for correct URL resolution with relative routing URLs', () => {
		const node = new N8n();
		const baseURLExpression = node.description.requestDefaults?.baseURL as string;
		expect(baseURLExpression).toBeDefined();
		// The expression should replace no slash or a single trailing slash with a single slash
		expect(baseURLExpression).toBe('={{ $credentials.baseUrl.replace(/\/?$/, "/") }}');
	});
});

describe('n8n Node URL resolution', () => {
	/**
	 * When a routing `url` does NOT start with `/` and `baseURL` ends with `/`,
	 * `new URL(url, baseURL)` correctly appends the path segments.
	 * This is the pattern the n8n node uses via its requestDefaults.baseURL
	 * (which ensures a trailing slash) and its routing URLs (without leading slash).
	 */
	it.each([
		{ baseUrl: 'http://localhost:5678/api/v1/', url: 'workflows', expected: 'http://localhost:5678/api/v1/workflows' },
		{ baseUrl: 'http://localhost:5678/api/v1/', url: 'workflows/123', expected: 'http://localhost:5678/api/v1/workflows/123' },
		{ baseUrl: 'http://localhost:5678//api/v1/', url: 'workflows', expected: 'http://localhost:5678//api/v1/workflows' },
		{ baseUrl: 'https://n8n.example.com/api/v1/', url: 'credentials/schema/n8nApi', expected: 'https://n8n.example.com/api/v1/credentials/schema/n8nApi' },
	])('resolves URL correctly: $baseUrl + $url → $expected', ({ baseUrl, url, expected }) => {
		expect(new URL(url, baseUrl).href).toBe(expected);
	});
});
