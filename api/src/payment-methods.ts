import { Hono } from 'hono';
import { authMiddleware } from './auth';

const app = new Hono<{ Bindings: { DB: D1Database }, Variables: { user: any } }>();

app.use('*', authMiddleware);

const getEffectiveSharedId = (item: any) => {
    // Backward-compat: in case migration 0009 is not applied yet for some rows.
    return item?.shared_id ?? (item?.name ? String(item.name).trim().toLowerCase() : null);
};

const normalizeImageUrl = (url: any) => {
    if (url === undefined) return null;
    if (url === null) return null;
    const s = String(url).trim();
    return s.length > 0 ? s : null;
};

app.get('/', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;

    // Ensure the current user has a row for every shared item (shared_id) in the system.
    // Each user row has its own `id` (used as `pm_<id>` in transactions), but name/image/order
    // are synchronized via `shared_id`.
    const [globalSharedRes, userSharedRes] = await Promise.all([
        db.prepare('SELECT DISTINCT shared_id FROM payment_methods WHERE shared_id IS NOT NULL').all(),
        db.prepare('SELECT DISTINCT shared_id FROM payment_methods WHERE user_id = ? AND shared_id IS NOT NULL').bind(user.sub).all()
    ]);

    const globalSharedIds = new Set((globalSharedRes.results || []).map((r: any) => r.shared_id));
    const userSharedIds = new Set((userSharedRes.results || []).map((r: any) => r.shared_id));

    const missingSharedIds: string[] = [];
    for (const sid of globalSharedIds) {
        if (!userSharedIds.has(sid)) missingSharedIds.push(sid);
    }

    if (missingSharedIds.length > 0) {
        const now = Date.now();
        for (const sharedId of missingSharedIds) {
            const canonical = await db.prepare(
                'SELECT * FROM payment_methods WHERE shared_id = ? ORDER BY created_at DESC LIMIT 1'
            ).bind(sharedId).first();

            if (!canonical) continue;

            await db.prepare(
                `INSERT INTO payment_methods (id, user_id, name, image_url, shared_id, order_index, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                crypto.randomUUID(),
                user.sub,
                canonical.name,
                canonical.image_url ?? null,
                sharedId,
                canonical.order_index ?? 0,
                now
            ).run();
        }
    }

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

    const now = Date.now();
    const sharedId = crypto.randomUUID();

    // Find max order globally so the shared list keeps consistent ordering.
    const { results: orderRes } = await db.prepare('SELECT MAX(order_index) as max_order FROM payment_methods').all();
    const maxOrder =
        orderRes && orderRes.length > 0 && orderRes[0].max_order !== null
            ? (orderRes[0].max_order as number)
            : -1;

    try {
        const { results: usersRes } = await db.prepare('SELECT id FROM users').all();
        const userIds = (usersRes || []).map((r: any) => r.id as string);
        if (userIds.length === 0) return c.json({ error: 'No users found' }, 400);

        const imageUrl = normalizeImageUrl(body.image_url);

        let createdIdForRequester: string | null = null;
        const orderIndex = maxOrder + 1;

        const statements: any[] = [];
        for (const uId of userIds) {
            const newId = crypto.randomUUID();
            if (uId === user.sub) createdIdForRequester = newId;

            statements.push(
                db.prepare(
                    `INSERT INTO payment_methods (id, user_id, name, image_url, shared_id, order_index, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`
                ).bind(
                    newId,
                    uId,
                    body.name,
                    imageUrl,
                    sharedId,
                    orderIndex,
                    now
                )
            );
        }

        await db.batch(statements);

        return c.json({ success: true, id: createdIdForRequester }, 201);
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
        const sharedId = getEffectiveSharedId(item);
        if (!sharedId) return c.json({ error: 'Invalid payment method' }, 400);

        await db.prepare(
            'UPDATE payment_methods SET name = ?, image_url = ?, shared_id = ? WHERE shared_id = ?'
        ).bind(body.name, normalizeImageUrl(body.image_url), sharedId, sharedId).run();
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

    const sharedId = getEffectiveSharedId(item);
    if (!sharedId) return c.json({ error: 'Invalid payment method' }, 400);

    // Delete for all users by shared identifier.
    await db.prepare('DELETE FROM payment_methods WHERE shared_id = ?').bind(sharedId).run();

    return c.json({ success: true });
});

app.put('/order/update', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    const body: { items: { id: string, order_index: number }[] } = await c.req.json();

    if (!body.items || !Array.isArray(body.items)) {
        return c.json({ error: 'Invalid items array' }, 400);
    }

    try {
        // Update order for each shared item (shared_id), not just for this user.
        for (const item of body.items) {
            const paymentRow = await db.prepare('SELECT * FROM payment_methods WHERE id = ? AND user_id = ?').bind(item.id, user.sub).first();
            if (!paymentRow) continue; // ignore unknown ids

            const sharedId = getEffectiveSharedId(paymentRow);
            if (!sharedId) continue;

            await db.prepare('UPDATE payment_methods SET order_index = ? WHERE shared_id = ?')
                .bind(item.order_index, sharedId)
                .run();
        }

        return c.json({ success: true });
    } catch (e: any) {
        console.error(e);
        return c.json({ error: 'Failed to update order' }, 500);
    }
});

export default app;
