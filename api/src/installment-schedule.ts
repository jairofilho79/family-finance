export function buildInstallmentSchedule(params: {
    purchaseDateMs: number;
    firstDueDateMs: number;
    totalInstallments: number;
}): Array<{ installmentNumber: number; date: number; dueDate: number }> {
    const { purchaseDateMs, firstDueDateMs, totalInstallments } = params;

    if (!Number.isFinite(purchaseDateMs) || !Number.isFinite(firstDueDateMs)) {
        throw new Error('purchaseDateMs and firstDueDateMs must be numbers');
    }
    if (!Number.isInteger(totalInstallments) || totalInstallments <= 0) {
        throw new Error('totalInstallments must be a positive integer');
    }

    const schedule: Array<{ installmentNumber: number; date: number; dueDate: number }> = [];
    const currentDue = new Date(firstDueDateMs);

    for (let i = 1; i <= totalInstallments; i++) {
        schedule.push({
            installmentNumber: i,
            date: purchaseDateMs,
            dueDate: currentDue.getTime(),
        });
        currentDue.setMonth(currentDue.getMonth() + 1);
    }

    return schedule;
}
