import { Hono } from 'hono';
import { authMiddleware } from './auth';

const app = new Hono<{ Bindings: { DB: D1Database }, Variables: { user: any } }>();

app.use('*', authMiddleware);

app.get('/', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;

    const { results } = await db.prepare(
        'SELECT * FROM payment_methods WHERE user_id = ? ORDER BY order_index ASC, created_at DESC'
    ).bind(user.sub).all();

    return c.json({ payment_methods: results || [] });
});

app.post('/', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    const body: { name?: string, image_url?: string } = await c.req.json();

    if (!body.name) {
        return c.json({ error: 'Name is required' }, 400);
    }

    const newId = crypto.randomUUID();
    const now = Date.now();

    // Find max order
    const { results } = await db.prepare('SELECT MAX(order_index) as max_order FROM payment_methods WHERE user_id = ?').bind(user.sub).all();
    const maxOrder = results && results.length > 0 && results[0].max_order !== null ? (results[0].max_order as number) : -1;

    try {
        await db.prepare(
            `INSERT INTO payment_methods (id, user_id, name, image_url, order_index, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
            newId,
            user.sub,
            body.name,
            body.image_url || null,
            maxOrder + 1,
            now
        ).run();

        return c.json({ success: true, id: newId }, 201);
    } catch (e: any) {
        console.error(e);
        return c.json({ error: e.message }, 500);
    }
});

app.put('/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const db = c.env.DB;
    const body: { name?: string, image_url?: string } = await c.req.json();

    // Verify it belongs to user
    const item = await db.prepare('SELECT * FROM payment_methods WHERE id = ? AND user_id = ?').bind(id, user.sub).first();
    if (!item) {
        return c.json({ error: 'Not found' }, 404);
    }

    if (!body.name) {
        return c.json({ error: 'Name is required' }, 400);
    }

    try {
        await db.prepare('UPDATE payment_methods SET name = ?, image_url = ? WHERE id = ?').bind(body.name, body.image_url || null, id).run();
        return c.json({ success: true });
    } catch (e: any) {
        console.error(e);
        return c.json({ error: 'Failed to update payment method' }, 500);
    }
});

app.delete('/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const db = c.env.DB;

    // Verify it belongs to user
    const item = await db.prepare('SELECT * FROM payment_methods WHERE id = ? AND user_id = ?').bind(id, user.sub).first();
    if (!item) {
        return c.json({ error: 'Not found' }, 404);
    }

    await db.prepare('DELETE FROM payment_methods WHERE id = ?').bind(id).run();

    return c.json({ success: true });
});

app.put('/order/update', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    const body: { items: { id: string, order_index: number }[] } = await c.req.json();

    if (!body.items || !Array.isArray(body.items)) {
        return c.json({ error: 'Invalid items array' }, 400);
    }

    const statements = body.items.map(item => {
        return db.prepare('UPDATE payment_methods SET order_index = ? WHERE id = ? AND user_id = ?')
            .bind(item.order_index, item.id, user.sub);
    });

    try {
        await db.batch(statements);
        return c.json({ success: true });
    } catch (e: any) {
        console.error(e);
        return c.json({ error: 'Failed to update order' }, 500);
    }
});

export default app;
