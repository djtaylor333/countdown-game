/**
 * Fetch word definitions from the Free Dictionary API.
 * https://api.dictionaryapi.dev/api/v2/entries/en/{word}
 */

export interface DictionaryEntry {
  word: string;
  definition: string;
  partOfSpeech: string;
}

export async function fetchDefinition(word: string): Promise<DictionaryEntry | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`,
    );
    if (!res.ok) return null;

    const data = await res.json() as Array<{
      meanings: Array<{
        partOfSpeech: string;
        definitions: Array<{ definition: string }>;
      }>;
    }>;

    if (!Array.isArray(data) || data.length === 0) return null;

    const firstMeaning = data[0].meanings?.[0];
    if (!firstMeaning) return null;

    const definition = firstMeaning.definitions?.[0]?.definition ?? '';
    return {
      word: word.toUpperCase(),
      definition,
      partOfSpeech: firstMeaning.partOfSpeech ?? '',
    };
  } catch {
    return null;
  }
}

export async function fetchDefinitions(words: string[]): Promise<Map<string, DictionaryEntry>> {
  const results = new Map<string, DictionaryEntry>();
  const fetches = words.map(async (w) => {
    const entry = await fetchDefinition(w);
    if (entry) results.set(w.toUpperCase(), entry);
  });
  await Promise.allSettled(fetches);
  return results;
}
