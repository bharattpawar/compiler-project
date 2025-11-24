import { VercelRequest, VercelResponse } from '@vercel/node';

interface ExecutionResult {
  output: string;
  error?: string;
  success: boolean;
}

interface ExecutionRequest {
  language: string;
  code: string;
  input?: string;
  files?: Array<{ name: string; content: string }>;
}

const LANGUAGE_MAP: Record<string, string> = {
  c: "c",
  cpp: "c++",
  java: "java",
  javascript: "javascript", 
  python: "python",
};

const getFileName = (lang: string): string => {
  const fileNames: Record<string, string> = {
    c: "main.c",
    cpp: "main.cpp",
    java: "Main.java",
    javascript: "index.js",
    python: "main.py",
  };
  return fileNames[lang] || "main.txt";
};

const executeJavaScript = (code: string): ExecutionResult => {
  try {
    const logs: string[] = [];
    const originalLog = console.log;
    
    console.log = (...args: any[]) => {
      logs.push(args.map(arg => 
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(" "));
    };

    eval(code);
    console.log = originalLog;

    return {
      output: logs.join("\n") || "Code executed successfully (no output)",
      success: true
    };
  } catch (error: any) {
    console.log = console.log;
    
    let errorMessage = error.message;
    
    if (errorMessage.includes('missing ) after argument list')) {
      errorMessage = 'Syntax Error: Missing closing parenthesis';
    } else if (errorMessage.includes('Unexpected token')) {
      errorMessage = 'Syntax Error: Unexpected character or symbol';
    } else if (errorMessage.includes('is not defined')) {
      errorMessage = errorMessage.replace(/ReferenceError: /, 'Error: ');
    }
    
    return {
      output: errorMessage,
      error: errorMessage,
      success: false
    };
  }
};

const cleanErrorMessage = (message: string): string => {
  if (!message) return "";
  
  return message
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\/piston\/[^\s\n]+/g, "")
    .replace(/piston/gi, "")
    .replace(/chmod:[^\n]*/g, "")
    .replace(/cannot access[^\n]*/g, "")
    .replace(/a\.out[^\n]*/g, "")
    .replace(/main\.(cpp|java|py|js)(\.w+)?:\d+:\d+:/g, "")
    .replace(/[a-zA-Z_][\w]*\.(cpp|java|py|js):\d+:\d+:/g, "")
    .replace(/^\s*\d+\s*\|/gm, "")
    .replace(/Line\s*\d+:\d+:/g, "")
    .replace(/\/[^\s]*\/include\/[^\s]*:/g, "")
    .replace(/\/usr\/[^\s]*:/g, "")
    .replace(/\/tmp\/[^\s]*:/g, "")
    .replace(/note:[^\n]*/g, "")
    .replace(/^\s*\d+\s*\|[^\n]*operator[^\n]*/gm, "")
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (!line) return false;
      if (line.includes('template')) return false;
      if (line.includes('deduction')) return false;
      if (line.includes('derived from')) return false;
      if (line.includes('candidate')) return false;
      if (line.includes('chmod')) return false;
      if (line.includes('cannot access')) return false;
      if (line.includes('operator<<')) return false;
      if (line.includes('nullptr_t')) return false;
      if (line.includes('conversion')) return false;
      if (line.startsWith('/')) return false;
      if (line.match(/^\s*\d+\s*\|/)) return false;
      if (line.match(/^\s*\^/)) return false;
      return true;
    })
    .join('\n')
    .replace(/\n\s*\n+/g, "\n")
    .trim();
};

const decodeHtmlEntities = (text: string): string => {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
};

const executeRemote = async (request: ExecutionRequest): Promise<ExecutionResult> => {
  try {
    const decodedCode = decodeHtmlEntities(request.code);
    const files = [
      {
        name: getFileName(request.language),
        content: decodedCode,
      },
      ...(request.files || []).map(f => ({ ...f, content: decodeHtmlEntities(f.content) })),
    ];

    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: LANGUAGE_MAP[request.language],
        version: "*",
        files,
        stdin: request.input || "",
        args: [],
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Execution failed with status: ${response.status}`);
    }

    const result = await response.json();
    let outputText = "";
    let hasError = false;

    if (result.compile && result.compile.stderr) {
      const cleanedError = cleanErrorMessage(result.compile.stderr);
      if (cleanedError) {
        const errorLines = cleanedError.split('\n').filter(line => line.includes('error:'));
        const mainError = errorLines.length > 0 ? errorLines[0] : cleanedError;
        outputText += `Compilation Error:\n${mainError}`;
      } else {
        outputText += "Compilation failed - please check your code syntax";
      }
      hasError = true;
    }
    else if (result.run) {
      if (result.run.stdout) {
        outputText += cleanErrorMessage(result.run.stdout);
      }
      if (result.run.stderr) {
        outputText += cleanErrorMessage(result.run.stderr);
        hasError = true;
      }
      if (result.run.code !== 0 && !result.run.stderr) {
        outputText += `\nProcess exited with code ${result.run.code}`;
        hasError = true;
      }
    }

    outputText = decodeHtmlEntities(outputText);

    return {
      output: outputText || "No output",
      success: !hasError,
      error: hasError ? "Execution failed" : undefined
    };
  } catch (error: any) {
    return {
      output: `Error: ${error.message}`,
      error: error.message,
      success: false
    };
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const request: ExecutionRequest = req.body;

    if (!request.language || !request.code) {
      return res.status(400).json({ error: 'Language and code are required' });
    }

    let result: ExecutionResult;

    if (request.language === "javascript") {
      result = executeJavaScript(request.code);
    } else {
      result = await executeRemote(request);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      output: `Server Error: ${error.message}`,
      error: error.message,
      success: false
    });
  }
}