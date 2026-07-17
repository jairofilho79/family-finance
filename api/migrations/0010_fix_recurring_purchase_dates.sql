-- Keep purchase date (date) as the first purchase for subscriptions and installments.
-- Payment date (due_date) continues to advance monthly and is left untouched.

-- Subscription charges (type=single, group_id = root subscription id)
UPDATE transactions
SET date = (
	SELECT root.date
	FROM transactions AS root
	WHERE root.id = transactions.group_id
	  AND root.type = 'subscription'
)
WHERE type = 'single'
  AND group_id IS NOT NULL
  AND EXISTS (
	SELECT 1
	FROM transactions AS root
	WHERE root.id = transactions.group_id
	  AND root.type = 'subscription'
  );

-- Installments after the first: reuse installment #1 purchase date in the same group
UPDATE transactions
SET date = (
	SELECT first.date
	FROM transactions AS first
	WHERE first.group_id = transactions.group_id
	  AND first.type = 'installment'
	  AND first.installment_number = 1
)
WHERE type = 'installment'
  AND group_id IS NOT NULL
  AND installment_number > 1
  AND EXISTS (
	SELECT 1
	FROM transactions AS first
	WHERE first.group_id = transactions.group_id
	  AND first.type = 'installment'
	  AND first.installment_number = 1
  );
