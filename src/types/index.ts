export type Language = 'c' | 'cpp' | 'java' | 'javascript' | 'python';
export type CompilerLanguage = Language;

export interface VFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: CompilerLanguage;
  isSaved: boolean;
}

export interface VFolder {
  id: string;
  name: string;
  path: string;
  children: (VFile | VFolder)[];
}