import type { Language } from '@/types/index';

export const getBoilerplateCode = (problemTitle: string, language: Language): string => {
  const templates: Record<Language, string> = {
    c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    javascript: `console.log("Hello, World!");`,
    python: `print("Hello, World!")`
  };
  
  return templates[language] || '';
};