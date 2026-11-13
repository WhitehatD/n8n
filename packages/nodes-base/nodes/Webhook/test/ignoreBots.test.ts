import type { Request, Response } from 'express';
import { mock } from 'vitest-mock-extended';
import type { IWebhookFunctions } from 'n8n-workflow';

import { Webhook } from '../Webhook.node';

describe('Webhook ignoreBots option', () => {
	const node = new Webhook();
	let context: ReturnType<typeof mock<IWebhookFunctions>>;
	let req: ReturnType<typeof mock<Request>>;
	let res: ReturnType<typeof mock<Response>>;

	beforeEach(() => {
		vi.clearAllMocks();
		context = mock<IWebhookFunctions>({ nodeHelpers: mock(), logger: mock() });
		req = mock<Request>();
		res = mock<Response>();

		context.getRequestObject.mockReturnValue(req);
		context.getResponseObject.mockReturnValue(res);
		context.getChildNodes.mockReturnValue([]);
		context.getNode.mockReturnValue({
			type: 'n8n-nodes-base.webhook',
			typeVersion: 2,
			name: 'Webhook',
			parameters: {},
		} as any);
		context.getNodeParameter.mockImplementation((paramName: string) => {
			if (paramName === 'options') return { ignoreBots: true };
			if (paramName === 'responseMode') return 'onReceived';
			if (paramName === 'httpMethod') return 'POST';
			return undefined;
		});
		req.headers = {};
		req.params = {};
		req.query = {};
		req.body = { test: 'data' };
		Object.defineProperty(req, 'ips', { value: [], configurable: true });
		Object.defineProperty(req, 'ip', { value: '127.0.0.1', configurable: true });
		res.writeHead.mockImplementation(() => res);
		res.end.mockImplementation(() => res);
	});

	it('rejects requests with a bot user-agent when ignoreBots is enabled and returns a descriptive message', async () => {
		req.headers['user-agent'] = 'curl/8.0';

		const result = await node.webhook(context);

		expect(result).toEqual({ noWebhookResponse: true });
		expect(res.writeHead).toHaveBeenCalledWith(
			403,
			expect.objectContaining({ 'WWW-Authenticate': 'Basic realm="Webhook"' }),
		);
		expect(res.end).toHaveBeenCalled();
		const endMessage = res.end.mock.calls[0][0] as string;
		// The old misleading message should not appear
		expect(endMessage).not.toBe('Authorization data is wrong!');
		// The message should describe the actual cause
		expect(endMessage).toContain('bot');
		expect(endMessage).toContain('Ignore Bots');
	});

	it('allows requests with a non-bot user-agent when ignoreBots is enabled', async () => {
		req.headers['user-agent'] =
			'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

		const result = await node.webhook(context);

		expect(result.workflowData).toBeDefined();
		expect(res.writeHead).not.toHaveBeenCalledWith(403, expect.anything());
	});

	it('allows requests with a bot user-agent when ignoreBots is not enabled', async () => {
		context.getNodeParameter.mockImplementation((paramName: string) => {
			if (paramName === 'options') return {};
			if (paramName === 'responseMode') return 'onReceived';
			if (paramName === 'httpMethod') return 'POST';
			return undefined;
		});
		req.headers['user-agent'] = 'curl/8.0';

		const result = await node.webhook(context);

		expect(result.workflowData).toBeDefined();
	});
});