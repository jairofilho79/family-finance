import { Context, Next } from 'hono';

// Mock simple verification interface. Production should use proper verification logic or library if needed.
export async function verifyGoogleToken(token: string) {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!res.ok) {
        throw new Error('Invalid token');
    }
    const payload = await res.json();
    return payload as {
        sub: string;
        email: string;
        name: string;
        picture: string;
    };
}

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = await verifyGoogleToken(token);

        // Ensure user exists in our DB
        const db = c.env.DB as D1Database;
        const existing = await db.prepare('SELECT id FROM users WHERE id = ?').bind(payload.sub).first();

        if (!existing) {
            // Auto-register user logic with Invite System
            const isAdmin = payload.email === 'jairofilho79@gmail.com';
            
            if (!isAdmin) {
                const inviteToken = c.req.header('X-Invite-Token');
                if (!inviteToken) {
                    return c.json({ error: 'Convite obrigatório para novos usuários.' }, 403);
                }

                // Verify the invite token exists and is unused
                const invite = await db.prepare('SELECT id FROM invites WHERE token = ? AND used_by IS NULL').bind(inviteToken).first<{id: string}>();
                
                if (!invite) {
                    return c.json({ error: 'Convite inválido ou já utilizado.' }, 403);
                }

                // Register user
                await db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)')
                    .bind(payload.sub, payload.email, payload.name, payload.picture)
                    .run();

                // Mark invite as used
                await db.prepare('UPDATE invites SET used_by = ?, used_at = ? WHERE id = ?')
                    .bind(payload.sub, Date.now(), invite.id)
                    .run();
            } else {
                 // Auto-register admin
                 await db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)')
                     .bind(payload.sub, payload.email, payload.name, payload.picture)
                     .run();
            }
        }

        c.set('user', payload);
        await next();
    } catch (error) {
        return c.json({ error: 'Invalid or expired token' }, 401);
    }
};
