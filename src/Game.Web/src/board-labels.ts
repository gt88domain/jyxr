/** Keep each label inside its own grid cell, including its text stroke. */
export function boardLabel(name: string, number: number, cell: number, measure: (text: string) => number): string {
  const badge = `#${number}`;
  if (cell < 55) return badge;
  const full = `${badge} ${name}`;
  const width = Math.max(0, cell - 8);
  if (measure(full) <= width) return full;
  const letters = Array.from(name);
  while (letters.length) {
    const shortened = `${badge} ${letters.join('')}…`;
    if (measure(shortened) <= width) return shortened;
    letters.pop();
  }
  return badge;
}
