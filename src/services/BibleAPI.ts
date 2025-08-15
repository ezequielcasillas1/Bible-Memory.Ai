// BibleAPI.ts
export interface BibleVersion {
  id: string;
  abbreviation: string;
  name: string;
  description?: string;
}

const API_BASE = "https://api.scripture.api.bible/v1";

function requiredEnv(name: string): string {
  const v = import.meta.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/** Fetch the 5 requested English Bible versions (KJV, NKJV, NLT, ESV, ASV). */
export async function getBibleVersions(): Promise<BibleVersion[]> {
  try {
    const apiKey = requiredEnv("VITE_BIBLE_API_KEY");
    const url = `${API_BASE}/bibles?abbreviation=KJV,NKJV,NLT,ESV,ASV&include-full-details=true`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Scripture API /bibles error:", res.status, text);
      return [];
    }

    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : [];

    // Map to the strict shape
    return data.map((b: any) => ({
      id: String(b.id),
      abbreviation: String(b.abbreviation),
      name: String(b.name),
      description: b.description ? String(b.description) : undefined,
    })) as BibleVersion[];
  } catch (error) {
    console.error("Failed to fetch Bible versions:", error);
    return [];
  }
}

/** Helper: fetch a passage by Bible ID and reference, e.g. "John 3:16". */
export async function getPassageByReference(bibleId: string, reference: string): Promise<any> {
  try {
    const apiKey = requiredEnv("VITE_BIBLE_API_KEY");
    // Encoded reference for safety
    const url = `${API_BASE}/bibles/${encodeURIComponent(bibleId)}/passages?search=${encodeURIComponent(reference)}&content-type=text&include-notes=false`;
    const res = await fetch(url, {
      headers: { "accept": "application/json", "api-key": apiKey },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Scripture API passage error:", res.status, text);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch passage:", error);
    return null;
  }
}