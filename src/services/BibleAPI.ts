import { renderChapterToHtml, renderVerseToHtml } from '../utils/renderBible';
import { fetchPassageHTML, WldehVersion, WldehVersions } from './wldeh';

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  available: boolean;
}

export interface Verse {
  reference: string;
  html: string;
  text: string;
}

// Map UI version IDs to wldeh slugs
const VERSION_MAP: Record<string, WldehVersion> = {
  'en-kjv': 'en-kjv',
  'en-asv': 'en-asv', 
  'en-webus': 'en-webus',
  'en-ylt': 'en-ylt',
  'en-darby': 'en-darby',
  'en-drb': 'en-drb'
};

// Legacy function name for compatibility
export async function getPassageFromWldeh(version: string, humanRef: string): Promise<Verse> {
  return getPassageByReference(version, humanRef);
}

export async function getPassageByReference(version: string, humanRef: string): Promise<Verse> {
  // Map version to wldeh slug
  const wldehVersion = VERSION_MAP[version] || 'en-kjv';
  
  try {
    const { html, reference, isReference } = await fetchPassageHTML(wldehVersion, humanRef);
    
    if (!isReference) {
      throw new Error(`"${humanRef}" is not a valid Bible reference`);
    }
    
    // Extract plain text from HTML for the text field
    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    return {
      reference: reference || humanRef,
      html,
      text
    };
  } catch (error) {
    console.error('Failed to fetch passage:', error);
    throw new Error(`Failed to fetch ${humanRef} from ${version}`);
  }
}

export function getBibleVersions(): BibleVersion[] {
  return [
    { id: 'en-kjv', name: 'King James Version', abbreviation: 'KJV', available: true },
    { id: 'en-asv', name: 'American Standard Version', abbreviation: 'ASV', available: true },
    { id: 'en-webus', name: 'World English Bible', abbreviation: 'WEB', available: true },
    { id: 'en-ylt', name: 'Young\'s Literal Translation', abbreviation: 'YLT', available: true },
    { id: 'en-darby', name: 'Darby Bible', abbreviation: 'DARBY', available: true },
    { id: 'en-drb', name: 'Douay-Rheims', abbreviation: 'DRB', available: true },
    { id: 'nkjv', name: 'New King James Version', abbreviation: 'NKJV', available: false },
    { id: 'nlt', name: 'New Living Translation', abbreviation: 'NLT', available: false },
    { id: 'esv', name: 'English Standard Version', abbreviation: 'ESV', available: false }
  ];
}

export function getVersionById(id: string, versions: BibleVersion[]): BibleVersion | undefined {
  return versions.find(v => v.id === id);
}

export async function searchVerses(query: string, version: string = 'en-kjv'): Promise<Verse[]> {
  try {
    // Try to parse as a Bible reference first
    const result = await getPassageByReference(version, query);
    return [result];
  } catch (error) {
    // If parsing fails, return empty array
    console.warn('Search failed:', error);
    return [];
  }
}