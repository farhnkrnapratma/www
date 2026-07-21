export function cn(...inputs: any[]): string {
  const result: string[] = [];

  function process(item: any) {
    if (!item) return;
    if (typeof item === 'string' || typeof item === 'number') {
      result.push(String(item));
    } else if (Array.isArray(item)) {
      item.forEach(process);
    } else if (typeof item === 'object') {
      for (const [key, value] of Object.entries(item)) {
        if (value) result.push(key);
      }
    }
  }

  inputs.forEach(process);
  return result.join(' ');
}
