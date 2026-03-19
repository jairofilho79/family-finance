export const formatCurrency = (amountInCents: number) => {
  return (amountInCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};
