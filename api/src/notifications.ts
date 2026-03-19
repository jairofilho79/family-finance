import { Hono } from 'hono';
import { authMiddleware } from './auth';

const app = new Hono<{ Bindings: { DB: D1Database }, Variables: { user: any } }>();

app.use('*', authMiddleware);

app.get('/', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;

    const { results } = await db.prepare(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(user.sub).all();

    return c.json({ notifications: results });
});

app.patch('/:id/read', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    const id = c.req.param('id');

    await db.prepare(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
    ).bind(id, user.sub).run();

    return c.json({ success: true });
});

export default app;
