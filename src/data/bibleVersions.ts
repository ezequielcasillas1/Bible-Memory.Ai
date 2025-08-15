import { BibleVersion } from '../services/BibleAPI';

export const getVersionById = (id: string, availableVersions: BibleVersion[]): BibleVersion | undefined => {
  return availableVersions.find(version => version.id === id);
};

export const getVersionByAbbreviation = (abbreviation: string, availableVersions: BibleVersion[]): BibleVersion | undefined => {
  return availableVersions.find(version => version.abbreviation === abbreviation);
};