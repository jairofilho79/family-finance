import { Hono } from 'hono';
import { authMiddleware } from './auth';
import { buildInstallmentSchedule } from './installment-schedule';

const app = new Hono<{ Bindings: { DB: D1Database }, Variables: { user: any } }>();

app.use('*', authMiddleware);

app.post('/', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    const body = await c.req.json();

    const { description, amount, payer_id, receiver_id, date, due_date, type, total_installments, is_personal, details } = body;
    const isPersonalVal = is_personal ? 1 : 0;

    // Fallback: if due_date is not provided, use the purchase date.
    const finalDueDate = due_date || date;

    const created_at = Date.now();
    const created_by = user.sub;

    if (type === 'single' || type === 'subscription') {
        const id = crypto.randomUUID();
        await db.prepare(
            `INSERT INTO transactions (id, description, amount, payer_id, receiver_id, created_by, created_at, date, due_date, type, status, is_personal, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            id, description, amount, payer_id, receiver_id, created_by, created_at, date, finalDueDate, type, 'pending', isPersonalVal, details || null
        ).run();

        // Notification logic
        const notificationsToCreate: string[] = [];
        if (payer_id !== created_by) notificationsToCreate.push(payer_id);
        if (!isPersonalVal && receiver_id !== created_by && receiver_id !== payer_id) notificationsToCreate.push(receiver_id);

        for (const notifiedUser of notificationsToCreate) {
            await db.prepare('INSERT INTO notifications (id, user_id, message, created_at) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), notifiedUser, `Novo registro: ${description} no valor de R$ ${(amount / 100).toFixed(2).replace('.', ',')}`, created_at).run();
        }
        return c.json({ success: true, id }, 201);
    }

    if (type === 'installment' && total_installments > 0) {
        const group_id = crypto.randomUUID();
        const installment_amount = Math.round(amount / total_installments); // Handle cents

        const statements: any[] = [];
        const purchaseDate = new Date(date).getTime();
        const firstDueDate = new Date(finalDueDate).getTime();
        let schedule;
        try {
            schedule = buildInstallmentSchedule({
                purchaseDateMs: purchaseDate,
                firstDueDateMs: firstDueDate,
                totalInstallments: total_installments,
            });
        } catch {
            return c.json({ error: 'Invalid installment payload' }, 400);
        }

        for (const item of schedule) {
            const i = item.installmentNumber;
            const id = crypto.randomUUID();
            const tx_date = item.date;
            const tx_due_date = item.dueDate;

            statements.push(
                db.prepare(
                    `INSERT INTO transactions (id, description, amount, payer_id, receiver_id, created_by, created_at, date, due_date, type, group_id, installment_number, total_installments, status, is_personal, details)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                ).bind(
                    id, `${description} (${i}/${total_installments})`, installment_amount, payer_id, receiver_id, created_by, created_at, tx_date, tx_due_date, type, group_id, i, total_installments, 'pending', isPersonalVal, details || null
                )
            );
        }

        await db.batch(statements);

        const notificationsToCreate: string[] = [];
        if (payer_id !== created_by) notificationsToCreate.push(payer_id);
        if (!isPersonalVal && receiver_id !== created_by && receiver_id !== payer_id) notificationsToCreate.push(receiver_id);

        for (const notifiedUser of notificationsToCreate) {
            await db.prepare('INSERT INTO notifications (id, user_id, message, created_at) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), notifiedUser, `Nova compra parcelada: ${description} (em ${total_installments}x de R$ ${(installment_amount / 100).toFixed(2).replace('.', ',')})`, created_at).run();
        }
        return c.json({ success: true, group_id }, 201);
    }

    return c.json({ error: 'Invalid transaction type' }, 400);
});

app.get('/', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    // For now we return all transactions for this user. In a larger app, we'd paginate or filter by family group.
    const { results } = await db.prepare(
        'SELECT * FROM transactions WHERE payer_id = ? OR receiver_id = ? OR created_by = ? ORDER BY date DESC'
    ).bind(user.sub, user.sub, user.sub).all();
    return c.json({ transactions: results });
});

app.patch('/:id/paid', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    const id = c.req.param('id');
    const now = Date.now();

    const tx = await db.prepare('SELECT status FROM transactions WHERE id = ?').bind(id).first();
    if (!tx) return c.json({ error: 'Not found' }, 404);

    if (tx.status !== 'paid') {
        await db.batch([
            db.prepare('UPDATE transactions SET status = ?, paid_at = ? WHERE id = ?').bind('paid', now, id),
            db.prepare('INSERT INTO transaction_status_history (id, transaction_id, user_id, old_status, new_status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                .bind(crypto.randomUUID(), id, user.sub, tx.status, 'paid', now)
        ]);
    }

    return c.json({ success: true, paid_at: now });
});

app.post('/bulk-pay', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    const body = await c.req.json();
    const { transaction_ids } = body;

    if (!Array.isArray(transaction_ids) || transaction_ids.length === 0) {
        return c.json({ error: 'Nenhuma transação selecionada' }, 400);
    }

    const now = Date.now();
    const placeholders = transaction_ids.map(() => '?').join(',');

    // Retrieve current status before batch update to store history
    const txs = await db.prepare(`SELECT id, status, payer_id, receiver_id FROM transactions WHERE id IN (${placeholders})`)
        .bind(...transaction_ids)
        .all();

    // Batch update status
    await db.prepare(`UPDATE transactions SET status = 'paid', paid_at = ? WHERE id IN (${placeholders})`)
        .bind(now, ...transaction_ids)
        .run();

    const peersToNotify = new Set<string>();
    const historyInserts: any[] = [];

    txs.results?.forEach((t: any) => {
        if (t.payer_id !== user.sub) peersToNotify.add(t.payer_id);
        if (t.receiver_id !== user.sub) peersToNotify.add(t.receiver_id);

        if (t.status !== 'paid') {
            historyInserts.push(
                db.prepare('INSERT INTO transaction_status_history (id, transaction_id, user_id, old_status, new_status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                    .bind(crypto.randomUUID(), t.id, user.sub, t.status, 'paid', now)
            );
        }
    });

    const additionalStatements: any[] = [...historyInserts];
    for (const peerId of Array.from(peersToNotify)) {
        additionalStatements.push(
            db.prepare('INSERT INTO notifications (id, user_id, message, created_at) VALUES (?, ?, ?, ?)')
                .bind(crypto.randomUUID(), peerId, `${transaction_ids.length} transação(ões) foram marcadas como pagas.`, now)
        );
    }

    if (additionalStatements.length > 0) {
        await db.batch(additionalStatements);
    }

    return c.json({ success: true });
});

app.patch('/:id/pending', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    const id = c.req.param('id');
    const now = Date.now();

    const tx = await db.prepare('SELECT status FROM transactions WHERE id = ?').bind(id).first();
    if (!tx) return c.json({ error: 'Not found' }, 404);

    if (tx.status !== 'pending') {
        await db.batch([
            db.prepare('UPDATE transactions SET status = ?, paid_at = NULL WHERE id = ?').bind('pending', id),
            db.prepare('INSERT INTO transaction_status_history (id, transaction_id, user_id, old_status, new_status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                .bind(crypto.randomUUID(), id, user.sub, tx.status, 'pending', now)
        ]);
    }

    return c.json({ success: true });
});

app.delete('/:id', async (c) => {
    const db = c.env.DB;
    const id = c.req.param('id');

    await db.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();
    return c.json({ success: true });
});

app.patch('/:id/cancel', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    const id = c.req.param('id');
    const now = Date.now();

    const tx = await db.prepare("SELECT status FROM transactions WHERE id = ? AND type = 'subscription'").bind(id).first();
    if (!tx) return c.json({ error: 'Not found or not a subscription' }, 404);

    if (tx.status !== 'cancelled') {
        await db.batch([
            db.prepare("UPDATE transactions SET status = 'cancelled' WHERE id = ? AND type = 'subscription'").bind(id),
            db.prepare('INSERT INTO transaction_status_history (id, transaction_id, user_id, old_status, new_status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                .bind(crypto.randomUUID(), id, user.sub, tx.status, 'cancelled', now)
        ]);
    }

    return c.json({ success: true });
});

app.get('/:id', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    const id = c.req.param('id');

    const txResult = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first();
    if (!txResult) {
        return c.json({ error: 'Transaction not found' }, 404);
    }

    // Ensure the user has permission to view this transaction
    if (txResult.payer_id !== user.sub && txResult.receiver_id !== user.sub && txResult.created_by !== user.sub) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    const editsResult = await db.prepare('SELECT * FROM transaction_edits WHERE transaction_id = ? ORDER BY created_at DESC').bind(id).all();
    const statusHistoryResult = await db.prepare('SELECT * FROM transaction_status_history WHERE transaction_id = ? ORDER BY created_at DESC').bind(id).all();

    return c.json({
        transaction: txResult,
        edits: editsResult.results,
        statusHistory: statusHistoryResult.results
    });
});

app.put('/:id', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    const id = c.req.param('id');
    const body = await c.req.json();

    const tx = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first();
    if (!tx) return c.json({ error: 'Not found' }, 404);

    // Check permission - authorized if involved
    if (tx.payer_id !== user.sub && tx.receiver_id !== user.sub && tx.created_by !== user.sub) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    const fieldsToTrack = ['description', 'amount', 'payer_id', 'receiver_id', 'date', 'due_date', 'type', 'payment_description'];
    const now = Date.now();
    const editsToInsert: any[] = [];
    const updateClauses: string[] = [];
    const updateValues: any[] = [];

    for (const field of fieldsToTrack) {
        if (field in body) {
            const dbVal = tx[field];
            const bodyVal = body[field];

            const oldVal = dbVal === null || dbVal === undefined ? '' : String(dbVal);
            const newVal = bodyVal === null || bodyVal === undefined ? '' : String(bodyVal);

            if (oldVal !== newVal) {
                editsToInsert.push(
                    db.prepare('INSERT INTO transaction_edits (id, transaction_id, user_id, field_name, old_value, new_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
                        .bind(crypto.randomUUID(), id, user.sub, field, oldVal, newVal, now)
                );
                updateClauses.push(`${field} = ?`);
                updateValues.push(bodyVal);
            }
        }
    }

    if (updateClauses.length > 0) {
        const query = `UPDATE transactions SET ${updateClauses.join(', ')} WHERE id = ?`;
        await db.batch([
            db.prepare(query).bind(...updateValues, id),
            ...editsToInsert
        ]);
    }

    return c.json({ success: true });
});

export default app;
