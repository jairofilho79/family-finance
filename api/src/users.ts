import { Hono } from 'hono';
import { authMiddleware } from './auth';

const app = new Hono<{ Bindings: { DB: D1Database }, Variables: { user: any } }>();

app.use('*', authMiddleware);

app.get('/me', async (c) => {
    const userPayload = c.get('user');
    const db = c.env.DB;

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userPayload.sub).first();
    return c.json({ user });
});

app.patch('/me/settings', async (c) => {
    const userPayload = c.get('user');
    const db = c.env.DB;
    const body = await c.req.json();

    const updates: string[] = [];
    const bindings: any[] = [];

    if (body.theme !== undefined) {
        updates.push('theme = ?');
        bindings.push(body.theme);
    }
    if (body.font_size !== undefined) {
        updates.push('font_size = ?');
        bindings.push(body.font_size);
    }
    if (body.group_recurring !== undefined) {
        updates.push('group_recurring = ?');
        bindings.push(body.group_recurring);
    }

    if (updates.length > 0) {
        bindings.push(userPayload.sub);
        await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
            .bind(...bindings)
            .run();
    }

    const updatedUser = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userPayload.sub).first();
    return c.json({ user: updatedUser });
});

app.post('/invite', async (c) => {
    const userPayload = c.get('user');
    const db = c.env.DB;

    // Only jairofilho79@gmail.com can invite
    if (userPayload.email !== 'jairofilho79@gmail.com') {
        return c.json({ error: 'Apenas administradores podem gerar convites.' }, 403);
    }

    // Generate a simple alphanumeric token (e.g., 8 chars)
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    const id = crypto.randomUUID();

    await db.prepare('INSERT INTO invites (id, token, created_by, created_at) VALUES (?, ?, ?, ?)')
        .bind(id, token, userPayload.sub, Date.now())
        .run();

    return c.json({ token });
});

// Used to select the payer/receiver from available family members
app.get('/', async (c) => {
    const db = c.env.DB;
    const { results } = await db.prepare('SELECT id, name, picture, email, pix_key FROM users').all();
    return c.json({ users: results });
});

app.patch('/me/pix', async (c) => {
    const userPayload = c.get('user');
    const db = c.env.DB;
    const body = await c.req.json();

    await db.prepare('UPDATE users SET pix_key = ? WHERE id = ?')
        .bind(body.pix_key || null, userPayload.sub)
        .run();

    const updatedUser = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userPayload.sub).first();
    return c.json({ user: updatedUser });
});

export default app;
