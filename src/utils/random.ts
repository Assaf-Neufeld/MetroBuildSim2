export const randomFloat = (): number => Math.random();

export const randomInt = (maxExclusive: number): number => {
  return Math.floor(Math.random() * maxExclusive);
};

export const pickRandom = <T>(values: T[]): T => {
  return values[randomInt(values.length)];
};

export const pickRandomExcluding = <T>(values: T[], excluded: (item: T) => boolean): T | null => {
  const filtered = values.filter((value) => !excluded(value));
  if (filtered.length === 0) return null;
  return pickRandom(filtered);
};
