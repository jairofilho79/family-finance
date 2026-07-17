import { Hono } from 'hono';
import { cors } from 'hono/cors';
import usersApp from './users';
import transactionsApp from './transactions';
import dashboardApp from './dashboard';
import notificationsApp from './notifications';
import recurringApp from './recurring';
import paymentMethodsApp from './payment-methods';

type Bindings = {
	DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/', (c) => {
	return c.json({ message: 'Family Finance API is running!' });
});

app.route('/users', usersApp);
app.route('/transactions', transactionsApp);
app.route('/dashboard', dashboardApp);
app.route('/notifications', notificationsApp);
app.route('/recurring', recurringApp);
app.route('/payment-methods', paymentMethodsApp);

export default {
	fetch: app.fetch,
	async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
		const db = env.DB;

		// 1. Fetch all active subscriptions (the root subscription record)
		const { results } = await db.prepare(
			"SELECT * FROM transactions WHERE type = 'subscription' AND status != 'cancelled'"
		).all();

		const subscriptions = results as any[];

		if (!subscriptions || subscriptions.length === 0) return;

		const now = Date.now();
		const statements: any[] = [];
		const notifications: any[] = [];

		for (const sub of subscriptions) {
			const subId = sub.id;

			// 2. Find the most recent charge generated for this subscription
			const lastChargeResult = await db.prepare(
				"SELECT due_date FROM transactions WHERE group_id = ? AND type = 'single' ORDER BY due_date DESC LIMIT 1"
			).bind(subId).first() as any;

			// Determine the target day-of-month from the last charge's due_date,
			// or fall back to the subscription's own due_date/date
			let referenceDueDate: Date;
			if (lastChargeResult && lastChargeResult.due_date) {
				referenceDueDate = new Date(lastChargeResult.due_date);
			} else if (sub.due_date) {
				referenceDueDate = new Date(sub.due_date);
			} else {
				referenceDueDate = new Date(sub.date);
			}

			// 3. Calculate the next month's date, preserving the day-of-month
			const targetDay = referenceDueDate.getDate();
			const nextMonth = new Date(referenceDueDate);
			nextMonth.setMonth(nextMonth.getMonth() + 1);

			// Handle months with fewer days (e.g., Jan 31 → Feb 28)
			// If the day overflowed (e.g., set day 31 in a 28-day month), JS rolls to next month.
			// We detect this and use the last day of the intended month instead.
			if (nextMonth.getDate() !== targetDay) {
				// Rolled over — go back to last day of intended month
				nextMonth.setDate(0); // Sets to last day of previous month (which is the intended month)
			}

			const nextTimestamp = nextMonth.getTime();
			// ponytail: keep original subscription purchase date so "compras recentes" stays meaningful
			const purchaseTimestamp = Number(sub.date) || nextTimestamp;

			const id = crypto.randomUUID();

			statements.push(
				db.prepare(
					`INSERT INTO transactions (id, description, amount, payer_id, receiver_id, created_by, created_at, date, due_date, type, group_id, status, is_personal)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				).bind(
					id,
					sub.description,
					sub.amount,
					sub.payer_id,
					sub.receiver_id,
					sub.created_by,
					now,        // created_at is always now
					purchaseTimestamp, // date = first subscription purchase date
					nextTimestamp, // due_date = payment date (+1 month each charge)
					'single',
					subId,
					'pending',
					sub.is_personal || 0
				)
			);

			const notificationsToCreate: string[] = [];
			if (sub.payer_id !== sub.created_by) notificationsToCreate.push(sub.payer_id);
			if (!sub.is_personal && sub.receiver_id !== sub.created_by && sub.receiver_id !== sub.payer_id) notificationsToCreate.push(sub.receiver_id);

			for (const notifiedUser of notificationsToCreate) {
				const notifId = crypto.randomUUID();
				notifications.push(
					db.prepare('INSERT INTO notifications (id, user_id, message, created_at) VALUES (?, ?, ?, ?)').bind(notifId, notifiedUser, `Nova cobrança de assinatura: ${sub.description} no valor de R$ ${(sub.amount / 100).toFixed(2).replace('.', ',')}`, now)
				);
			}
		}

		// Execute all statements
		await db.batch([...statements, ...notifications]);
	}
};
