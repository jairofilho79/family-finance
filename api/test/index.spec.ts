import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';
import { buildInstallmentSchedule } from '../src/installment-schedule';

describe('API worker', () => {
	it('GET / returns API status message', async () => {
		const request = new Request<unknown, IncomingRequestCfProperties>('http://example.com/');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({ message: 'Family Finance API is running!' });
	});
});

describe('installment schedule', () => {
	it('keeps purchase date fixed and increments due_date monthly', () => {
		const purchaseDateMs = new Date('2026-04-13T00:00:00.000Z').getTime();
		const firstDueDateMs = new Date('2026-04-20T00:00:00.000Z').getTime();

		const schedule = buildInstallmentSchedule({
			purchaseDateMs,
			firstDueDateMs,
			totalInstallments: 3,
		});

		expect(schedule).toHaveLength(3);
		expect(schedule.map((s) => s.date)).toEqual([purchaseDateMs, purchaseDateMs, purchaseDateMs]);

		const d1 = new Date(schedule[0].dueDate);
		const d2 = new Date(schedule[1].dueDate);
		const d3 = new Date(schedule[2].dueDate);
		expect(d1.toISOString()).toBe('2026-04-20T00:00:00.000Z');
		expect(d2.toISOString()).toBe('2026-05-20T00:00:00.000Z');
		expect(d3.toISOString()).toBe('2026-06-20T00:00:00.000Z');
	});
});
