/** Storage is optional: blocked access, invalid JSON and quota errors must not break the UI. */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Não foi possível salvar ${key} no navegador.`, error);
  }
}

export function readStoredArray<T>(key: string, fallback: T[], isItem: (item: unknown) => item is T): T[] {
  const saved = readStorage(key);
  if (saved === null) return fallback;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.every(isItem)) return parsed;
  } catch {
    // Keep the original payload available for manual recovery before effects persist the fallback.
  }
  writeStorage(`${key}_recovery`, saved);
  return fallback;
}
