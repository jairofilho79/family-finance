import { Hono } from 'hono';
import { authMiddleware } from './auth';

const app = new Hono<{ Bindings: { DB: D1Database }, Variables: { user: any } }>();

app.use('*', authMiddleware);

app.get('/balances', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;

    const start = c.req.query('start');
    const end = c.req.query('end');

    let query = `SELECT payer_id, receiver_id, SUM(amount) as total_amount 
     FROM transactions 
     WHERE status = 'pending' AND (type = 'single' OR type = 'installment' OR type = 'subscription')
     AND (payer_id = ? OR receiver_id = ? OR created_by = ?)`;

    const params: any[] = [user.sub, user.sub, user.sub];

    if (start && end) {
        query += ` AND date >= ? AND date <= ?`;
        params.push(parseInt(start, 10), parseInt(end, 10));
    }

    query += ` GROUP BY payer_id, receiver_id`;

    const { results } = await db.prepare(query).bind(...params).all();

    return c.json({ balances: results });
});

export default app;
