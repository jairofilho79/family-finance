-- Auditoria: parcelas ('installment') - consistência de datas
--
-- Conceitos no schema:
-- - `date`     = data da compra (deve ser única no grupo)
-- - `due_date` = data para pagar (deve avançar mensalmente por parcela)
--
-- Execute com:
--   npx wrangler d1 execute family-finance-db --remote --file=./api/scripts/audit_installment_dates.sql

-- A) Grupos pendentes com data de compra inconsistente (deve ser 0 após backfill)
SELECT
  COUNT(*) AS groups_with_inconsistent_purchase_date
FROM (
  SELECT group_id
  FROM transactions
  WHERE type = 'installment'
    AND status = 'pending'
    AND group_id IS NOT NULL
  GROUP BY group_id
  HAVING COUNT(DISTINCT date) > 1
);

-- B) Amostra dos grupos pendentes inconsistentes (para inspeção manual)
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
  t.due_date,
  t.status
FROM transactions t
WHERE t.group_id IN (SELECT group_id FROM candidate_groups)
ORDER BY t.group_id, t.installment_number
LIMIT 100;

-- C) Grupos pendentes com 1ª parcela sem due_date (apenas informativo)
SELECT
  COUNT(*) AS pending_groups_without_due_date_on_first_installment
FROM (
  SELECT group_id
  FROM transactions
  WHERE type = 'installment'
    AND status = 'pending'
    AND group_id IS NOT NULL
    AND installment_number = 1
    AND due_date IS NULL
);

