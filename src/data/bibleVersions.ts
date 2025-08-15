import { BibleVersion } from '../types';

export const bibleVersions: BibleVersion[] = [
  {
    id: 'de4e12af7f28f599-02',
    name: 'King James Version',
    abbreviation: 'KJV'
  },
  {
    id: 'c315fa9f71d4af3a-01',
    name: 'New King James Version',
    abbreviation: 'NKJV'
  },
  {
    id: '71c6eab17ae5b667-01',
    name: 'New Living Translation',
    abbreviation: 'NLT'
  },
  {
    id: 'f421fe261da7624f-01',
    name: 'English Standard Version',
    abbreviation: 'ESV'
  },
  {
    id: '06125adad2d5898a-01',
    name: 'American Standard Version',
    abbreviation: 'ASV'
  }
];

export const getVersionById = (id: string): BibleVersion | undefined => {
  return bibleVersions.find(version => version.id === id);
};

export const getVersionByAbbreviation = (abbreviation: string): BibleVersion | undefined => {
  return bibleVersions.find(version => version.abbreviation === abbreviation);
};