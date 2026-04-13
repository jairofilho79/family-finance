-- Backfill: corrigir datas de parcelas (apenas pendentes)
--
-- Objetivo:
-- - Para cada group_id de transações do tipo 'installment' em status 'pending' onde a coluna `date`
--   (data da compra) diverge entre parcelas, corrigir para:
--   - `date` = date da parcela 1 (installment_number = 1), para todas as parcelas
--   - `due_date` = due_date da parcela 1 (fallback para `date` da parcela 1) + (installment_number-1) meses
--
-- Como executar (exemplos):
-- - Local / preview:   npx wrangler d1 execute family-finance-db --local --file=./api/scripts/backfill_installment_dates_pending.sql
-- - Produção:          npx wrangler d1 execute family-finance-db --remote --file=./api/scripts/backfill_installment_dates_pending.sql
--
-- Dica: antes de rodar em produção, rode as queries de auditoria abaixo para estimar impacto.

-- 1) Auditoria pré: grupos pendentes com compra inconsistente
WITH candidate_groups AS (
  SELECT
    group_id,
    COUNT(*) AS rows_count,
    COUNT(DISTINCT date) AS distinct_purchase_dates
  FROM transactions
  WHERE type = 'installment'
    AND status = 'pending'
    AND group_id IS NOT NULL
  GROUP BY group_id
  HAVING COUNT(DISTINCT date) > 1
)
SELECT
  COUNT(*) AS groups_to_fix,
  COALESCE(SUM(rows_count), 0) AS rows_to_fix
FROM candidate_groups;

-- (Opcional) inspecionar alguns grupos
WITH candidate_groups AS (
  SELECT group_id
  FROM transactions
  WHERE type = 'installment'
    AND status = 'pending'
    AND group_id IS NOT NULL
  GROUP BY group_id
  HAVING COUNT(DISTINCT date) > 1
)
SELECT
  t.group_id,
  t.installment_number,
  t.total_installments,
  t.date,
  t.due_date
FROM transactions t
WHERE t.group_id IN (SELECT group_id FROM candidate_groups)
ORDER BY t.group_id, t.installment_number
LIMIT 50;

-- 2) Backfill: recalcular `date` e `due_date` por group_id a partir da parcela 1
WITH candidate_groups AS (
  SELECT group_id
  FROM transactions
  WHERE type = 'installment'
    AND status = 'pending'
    AND group_id IS NOT NULL
  GROUP BY group_id
  HAVING COUNT(DISTINCT date) > 1
),
anchors AS (
  SELECT
    group_id,
    date AS purchase_anchor_ms,
    COALESCE(due_date, date) AS due_anchor_ms
  FROM transactions
  WHERE type = 'installment'
    AND status = 'pending'
    AND installment_number = 1
    AND group_id IN (SELECT group_id FROM candidate_groups)
)
UPDATE transactions
SET
  date = (
    SELECT a.purchase_anchor_ms
    FROM anchors a
    WHERE a.group_id = transactions.group_id
  ),
  due_date = (
    SELECT
      CAST(
        strftime(
          '%s',
          datetime(
            (a.due_anchor_ms / 1000),
            'unixepoch',
            printf('+%d months', (transactions.installment_number - 1))
          )
        ) AS INTEGER
      ) * 1000
    FROM anchors a
    WHERE a.group_id = transactions.group_id
  )
WHERE type = 'installment'
  AND status = 'pending'
  AND group_id IN (SELECT group_id FROM candidate_groups)
  AND installment_number IS NOT NULL;

-- 3) Auditoria pós: deve zerar grupos pendentes com compra inconsistente
WITH candidate_groups AS (
  SELECT
    group_id,
    COUNT(*) AS rows_count,
    COUNT(DISTINCT date) AS distinct_purchase_dates
  FROM transactions
  WHERE type = 'installment'
    AND status = 'pending'
    AND group_id IS NOT NULL
  GROUP BY group_id
  HAVING COUNT(DISTINCT date) > 1
)
SELECT
  COUNT(*) AS remaining_groups,
  COALESCE(SUM(rows_count), 0) AS remaining_rows
FROM candidate_groups;

