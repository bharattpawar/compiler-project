const iconMap: Record<string, string> = {
  cpp: 'cplusplus',
  cc: 'cplusplus',
  cxx: 'cplusplus',
  c: 'c',
  h: 'c',
  hpp: 'cplusplus',
  java: 'java',
  js: 'javascript',
  jsx: 'react',
  ts: 'typescript',
  tsx: 'react',
  py: 'python',
  html: 'html5',
  css: 'css3',
  json: 'json',
  md: 'markdown',
  txt: 'text',
};

export const getFileIcon = (filename: string): string => {
  const ext = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : '';
  const iconName = ext ? iconMap[ext] || 'text' : 'text';
  return `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${iconName}/${iconName}-original.svg`;
};
