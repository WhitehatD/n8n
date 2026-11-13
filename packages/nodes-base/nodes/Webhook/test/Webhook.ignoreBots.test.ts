import type { Request, Response } from 'express';
import { mock } from 'vitest-mock-extended';
import type { IWebhookFunctions } from 'n8n-workflow';

import { Webhook } from '../Webhook.node';

describe('Test Webhook Node - ignoreBots option', () => {
	const node = new Webhook();

	let context: ReturnType<typeof mock<IWebhookFunctions>>;
	let req: ReturnType<typeof mock<Request>>;
	let res: ReturnType<typeof mock<Response>>;

	beforeEach(() => {
		vi.clearAllMocks();
		context = mock<IWebhookFunctions>({ nodeHelpers: mock() });
		req = mock<Request>();
		res = mock<Response>();

		context.getRequestObject.mockReturnValue(req);
		context.getResponseObject.mockReturnValue(res);
		context.getChildNodes.mockReturnValue([]);
		context.getNode.mockReturnValue({
			type: 'n8n-nodes-base.webhook',
			typeVersion: 2,
			name: 'Webhook',
		} as any);
		context.getNodeParameter.mockImplementation((paramName: string) => {
			if (paramName === 'options') return { ignoreBots: true };
			if (paramName === 'responseMode') return 'onReceived';
			if (paramName === 'httpMethod') return 'GET';
			return undefined;
		});

		req.headers = { 'user-agent': 'Mozilla/5.0' };
		req.params = {};
		req.query = {};
		req.body = { test: true };

		Object.defineProperty(req, 'ips', { value: [], configurable: true });
		Object.defineProperty(req, 'ip', { value: '127.0.0.1', configurable: true });

		res.writeHead.mockImplementation(() => res);
		res.end.mockImplementation(() => res);
	});

	it('should reject a bot user-agent with a clear message mentioning bots, not authorization', async () => {
		const result = await node.webhook(context);

		expect(res.writeHead).toHaveBeenCalledWith(403, expect.any(Object));
		expect(res.end).toHaveBeenCalledWith(
			'Request rejected: bot detected. Set the "Ignore Bots" option to false to allow bots.',
		);
		expect(result).toEqual({ noWebhookResponse: true });
	});

	it('should allow a non-bot user-agent through', async () => {
		req.headers['user-agent'] =
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

		const result = await node.webhook(context);

		expect(res.writeHead).not.toHaveBeenCalled();
		expect(result.workflowData).toBeDefined();
	});

	it('should allow a request when ignoreBots is disabled', async () => {
		context.getNodeParameter.mockImplementation((paramName: string) => {
			if (paramName === 'options') return {};
			if (paramName === 'responseMode') return 'onReceived';
			if (paramName === 'httpMethod') return 'GET';
			return undefined;
		});

		const result = await node.webhook(context);

		expect(res.writeHead).not.toHaveBeenCalled();
		expect(result.workflowData).toBeDefined();
	});
});