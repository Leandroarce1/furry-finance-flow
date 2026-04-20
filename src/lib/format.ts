export const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export const fmtDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const monthKey = (iso: string) => iso.slice(0, 7); // yyyy-mm

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
