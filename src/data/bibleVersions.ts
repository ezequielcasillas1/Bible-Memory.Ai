import { BibleVersion } from '../types';

export const bibleVersions: BibleVersion[] = [
  {
    id: 'de4e12af7f28f599-01',
    name: 'King James Version',
    abbreviation: 'KJV'
  },
  {
    id: '114c1c4e4b214513-01',
    name: 'New King James Version',
    abbreviation: 'NKJV'
  },
  {
    id: '7142879509583d59-01',
    name: 'New Living Translation',
    abbreviation: 'NLT'
  },
  {
    id: '90c8a4bdc6b54c6b-01',
    name: 'English Standard Version',
    abbreviation: 'ESV'
  },
  {
    id: '685d1470fe4d5361-01',
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