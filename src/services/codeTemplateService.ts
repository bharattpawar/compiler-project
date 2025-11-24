import { getBoilerplateCode } from "@/utils/boilerplateTemplates";
import type { Language } from "@/types/index";
import { compilerAPI, problemsAPI } from "@/lib/api";

interface CodeTemplate {
  visibleCode: string;
  hiddenCode: string;
}

interface ApiCodeTemplateResponse {
  success: boolean;
  message: string;
  data: {
    sampleCode: {
      [language: string]: CodeTemplate;
    };
  };
}

class CodeTemplateService {
  private templateCache: Map<string, { [language: string]: CodeTemplate }> =
    new Map();

  /**
   * Fetch code templates for a specific problem from the API
   */
  async fetchCodeTemplates(
    problemId: string
  ): Promise<{ [language: string]: CodeTemplate } | null> {
    // Check cache first
    if (this.templateCache.has(problemId)) {
      return this.templateCache.get(problemId) || null;
    }

    try {
      const response = await compilerAPI.getCode(problemId);
      const data: ApiCodeTemplateResponse = response.data;

      try {
        const progress = await problemsAPI.getProgress(problemId);
        const progressResp = progress.data;
        if (progressResp.success && progressResp.visibleCodeByLanguage) {
          // Merge user progress into templates
          Object.keys(progressResp.visibleCodeByLanguage).forEach((lang) => {
            data.data.sampleCode[lang].visibleCode =
                progressResp.visibleCodeByLanguage[lang].visibleCode;
          });
        }
      }catch (error) {
        console.warn("Failed to fetch user progress:", error instanceof Error ? error.message : 'Unknown error');
      }

      if (data.success && data.data.sampleCode) {
        // Cache the templates
        this.templateCache.set(problemId, data.data.sampleCode);
        return data.data.sampleCode;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch ORIGINAL code templates (without user progress) for reset functionality
   */
  async fetchOriginalCodeTemplates(
    problemId: string
  ): Promise<{ [language: string]: CodeTemplate } | null> {
    try {
      const response = await compilerAPI.getCode(problemId);
      const data: ApiCodeTemplateResponse = response.data;

      if (data.success && data.data.sampleCode) {
        return data.data.sampleCode;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get visible code for a specific problem and language
   * Falls back to hardcoded templates if API fails
   */
  async getVisibleCode(
    problemId: string,
    language: Language,
    problemTitle?: string
  ): Promise<string> {
    try {
      const templates = await this.fetchCodeTemplates(problemId);

      if (templates && templates[language]?.visibleCode) {
        const template = templates[language].visibleCode;
        return template;
      }
    } catch {
      // Failed to fetch template from API
    }

    // Fallback to hardcoded boilerplate
    if (problemTitle) {
      const hardcodedTemplate = getBoilerplateCode(problemTitle, language);
      if (hardcodedTemplate.trim()) {
        return hardcodedTemplate;
      }
    }

    // Final fallback to generic template
    const genericTemplate = this.getGenericTemplate(language);
    return genericTemplate;
  }

  /**
   * Get ORIGINAL visible code for reset functionality (ignores user progress)
   */
  async getOriginalVisibleCode(
    problemId: string,
    language: Language,
    problemTitle?: string
  ): Promise<string> {
    try {
      const templates = await this.fetchOriginalCodeTemplates(problemId);

      if (templates && templates[language]?.visibleCode) {
        const template = templates[language].visibleCode;
        // If the database template is not empty, use it
        if (template.trim()) {
          return template;
        }
      }
    } catch {
      // Failed to fetch template from API
    }

    // Fallback to hardcoded boilerplate based on problem title
    if (problemTitle) {
      const hardcodedTemplate = getBoilerplateCode(problemTitle, language);
      if (hardcodedTemplate.trim()) {
        return hardcodedTemplate;
      }
    }

    // Generate meaningful template based on problem title
    const meaningfulTemplate = this.generateMeaningfulTemplate(language, problemTitle);
    return meaningfulTemplate;
  }

  /**
   * Get available languages for a problem from API templates
   */
  async getAvailableLanguages(problemId: string): Promise<string[]> {
    try {
      const templates = await this.fetchCodeTemplates(problemId);
      return templates ? Object.keys(templates) : [];
    } catch {
      // Failed to fetch available languages from API
      return ["javascript", "python", "java", "cpp"]; // Default languages
    }
  }

  /**
   * Clear cache for a specific problem
   */
  clearCache(problemId?: string): void {
    if (problemId) {
      this.templateCache.delete(problemId);
    } else {
      this.templateCache.clear();
    }
  }

  /**
   * Generate meaningful template based on problem title and common patterns
   */
  private generateMeaningfulTemplate(language: Language, problemTitle?: string): string {
    if (!problemTitle) {
      return this.getGenericTemplate(language);
    }

    const title = problemTitle.toLowerCase();
    
    // Two Sum pattern
    if (title.includes('two sum') || title.includes('twosum')) {
      const templates: Record<Language, string> = {
        javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Your solution here
    
};`,
        python: `def two_sum(nums, target):
    """
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    """
    # Your solution here
    pass`,
        java: `public int[] twoSum(int[] nums, int target) {
    // Your solution here
    return new int[]{};
}`,
        cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    // Your solution here
    return {};
}`,
        c: `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Your solution here
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    return result;
}`
      };
      return templates[language] || this.getGenericTemplate(language);
    }

    // Add Two Numbers (Linked List) pattern
    if (title.includes('add two numbers')) {
      const templates: Record<Language, string> = {
        javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
var addTwoNumbers = function(l1, l2) {
    // Your solution here
    
};`,
        python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

def addTwoNumbers(l1, l2):
    """
    :type l1: ListNode
    :type l2: ListNode
    :rtype: ListNode
    """
    # Your solution here
    pass`,
        java: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    // Your solution here
    return null;
}`,
        cpp: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
    // Your solution here
    return nullptr;
}`,
        c: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 */
struct ListNode* addTwoNumbers(struct ListNode* l1, struct ListNode* l2) {
    // Your solution here
    return NULL;
}`
      };
      return templates[language] || this.getGenericTemplate(language);
    }

    // Valid Parentheses pattern
    if (title.includes('valid parentheses') || title.includes('parentheses')) {
      const templates: Record<Language, string> = {
        javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
    // Your solution here
    
};`,
        python: `def is_valid(s):
    """
    :type s: str
    :rtype: bool
    """
    # Your solution here
    pass`,
        java: `public boolean isValid(String s) {
    // Your solution here
    return false;
}`,
        cpp: `bool isValid(string s) {
    // Your solution here
    return false;
}`,
        c: `bool isValid(char* s) {
    // Your solution here
    return false;
}`
      };
      return templates[language] || this.getGenericTemplate(language);
    }

    // Array/List problems
    if (title.includes('array') || title.includes('list') || title.includes('nums')) {
      const templates: Record<Language, string> = {
        javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
var solutionFunction = function(nums) {
    // Your solution here
    
};`,
        python: `def solution_function(nums):
    """
    :type nums: List[int]
    :rtype: List[int]
    """
    # Your solution here
    pass`,
        java: `public int[] solutionFunction(int[] nums) {
    // Your solution here
    return new int[]{};
}`,
        cpp: `vector<int> solutionFunction(vector<int>& nums) {
    // Your solution here
    return {};
}`,
        c: `int* solutionFunction(int* nums, int numsSize, int* returnSize) {
    // Your solution here
    *returnSize = 0;
    return NULL;
}`
      };
      return templates[language] || this.getGenericTemplate(language);
    }

    // String problems
    if (title.includes('string') || title.includes('substring') || title.includes('palindrome')) {
      const templates: Record<Language, string> = {
        javascript: `/**
 * @param {string} s
 * @return {string}
 */
var solutionFunction = function(s) {
    // Your solution here
    
};`,
        python: `def solution_function(s):
    """
    :type s: str
    :rtype: str
    """
    # Your solution here
    pass`,
        java: `public String solutionFunction(String s) {
    // Your solution here
    return "";
}`,
        cpp: `string solutionFunction(string s) {
    // Your solution here
    return "";
}`,
        c: `char* solutionFunction(char* s) {
    // Your solution here
    return NULL;
}`
      };
      return templates[language] || this.getGenericTemplate(language);
    }

    // Default to generic template
    return this.getGenericTemplate(language);
  }

  /**
   * Generic template fallback
   */
  private getGenericTemplate(language: Language): string {
    const genericTemplates: Record<Language, string> = {
      javascript: `// Write your solution here
function solve() {
    // Your code here
}`,
      python: `# Write your solution here
def solve():
    # Your code here
    pass`,
      java: `// Write your solution here
public class Solution {
    public void solve() {
        // Your solution here
    }
}`,
      cpp: `// Write your solution here
#include <iostream>
using namespace std;

class Solution {
public:
    void solve() {
        // Your solution here
    }
};`,
      c: `// Write your solution here
#include <stdio.h>

void solve() {
    // Your solution here
}`,
    };

    return genericTemplates[language] || "// Your solution here";
  }
}

// Export singleton instance
export const codeTemplateService = new CodeTemplateService();

export default codeTemplateService;
