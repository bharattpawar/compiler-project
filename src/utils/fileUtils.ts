import type { CompilerLanguage } from '@/services/workspaceService';

export const getFileIconClass = (filename: string, isFolder: boolean = false): { icon: string; color: string } => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (isFolder) {
    return { icon: 'folder', color: 'text-blue-400' };
  }
  
  switch (ext) {
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'c':
    case 'h':
    case 'hpp':
      return { icon: 'code', color: 'text-blue-500' };
    case 'java':
      return { icon: 'code', color: 'text-orange-500' };
    case 'js':
    case 'mjs':
    case 'cjs':
      return { icon: 'code', color: 'text-yellow-400' };
    case 'py':
      return { icon: 'code', color: 'text-green-500' };
    case 'json':
      return { icon: 'json', color: 'text-yellow-500' };
    case 'html':
      return { icon: 'code', color: 'text-orange-400' };
    case 'css':
      return { icon: 'code', color: 'text-blue-400' };
    case 'ts':
    case 'tsx':
      return { icon: 'code', color: 'text-blue-600' };
    case 'md':
      return { icon: 'text', color: 'text-gray-400' };
    default:
      return { icon: 'text', color: 'text-gray-400' };
  }
};

export const getLanguageFromExtension = (filename: string): CompilerLanguage => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'c':
      return 'c';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'java':
      return 'java';
    case 'js':
    case 'mjs':
      return 'javascript';
    case 'py':
      return 'python';
    default:
      return 'cpp';
  }
};

export const getLanguageColor = (language: CompilerLanguage): string => {
  switch (language) {
    case 'c':
      return 'text-blue-500';
    case 'cpp':
      return 'text-blue-400';
    case 'java':
      return 'text-orange-400';
    case 'javascript':
      return 'text-yellow-400';
    case 'python':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
};

export const joinPath = (...parts: string[]): string => {
  return parts
    .map(part => part.replace(/^\/+|\/+$/g, ''))
    .filter(part => part.length > 0)
    .join('/')
    .replace(/^/, '/');
};

export const getParentPath = (path: string): string => {
  if (path === '/') return '/';
  const lastSlash = path.lastIndexOf('/');
  return lastSlash <= 0 ? '/' : path.substring(0, lastSlash);
};

export const getBasename = (path: string): string => {
  return path.substring(path.lastIndexOf('/') + 1);
};