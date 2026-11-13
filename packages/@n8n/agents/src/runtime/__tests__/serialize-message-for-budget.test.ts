import { describe, expect, it } from 'vitest';

import { serializeMessageForBudget } from '../memory/memory-orchestrator';
import type { AgentDbMessage } from '../../types/sdk/message';

describe('serializeMessageForBudget', () => {
	it('escapes whitespace in rejected tool-call error text', () => {
		const error = 'Syntax error: ' + ' \t'.repeat(100);
		const message: AgentDbMessage = {
			id: 'test',
			createdAt: new Date(),
			role: 'assistant',
			content: [
				{
					type: 'tool-call',
					toolCallId: 'call_1',
					toolName: 'test_tool',
					input: {},
					state: 'rejected',
					error,
				},
			],
		};

		const result = serializeMessageForBudget(message);

		// The error text should be JSON-stringified (escaped), not raw
		expect(result).not.toContain('\t');
		// Should contain the JSON-escaped tab
		expect(result).toContain('\\t');
		// The raw error should NOT appear verbatim
		expect(result).not.toContain(error);
	});

	it('includes resolved tool-call output as JSON', () => {
		const output = 'plain text with \t tab';
		const message: AgentDbMessage = {
			id: 'test',
			createdAt: new Date(),
			role: 'assistant',
			content: [
				{
					type: 'tool-call',
					toolCallId: 'call_1',
					toolName: 'test_tool',
					input: {},
					state: 'resolved',
					output,
				},
			],
		};

		const result = serializeMessageForBudget(message);

		// Resolved output is already JSON-stringified
		expect(result).toContain('\\t');
		expect(result).not.toContain('\t');
	});

	it('includes text content unchanged', () => {
		const message: AgentDbMessage = {
			id: 'test',
			createdAt: new Date(),
			role: 'user',
			content: [{ type: 'text', text: 'Hello world' }],
		};

		expect(serializeMessageForBudget(message)).toBe('Hello world');
	});
});