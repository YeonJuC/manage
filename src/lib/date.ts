export const toISO = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (iso: string, delta: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return toISO(d);
};

export const startOfMonth = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1));
};

export const endOfMonth = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};

export const weekday = (iso: string) => new Date(iso + "T00:00:00").getDay(); // 0=Sun
