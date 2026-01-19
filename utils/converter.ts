
import { ConversionType, PatchRule } from '../types';

/**
 * 宣告全域 OpenCC (來自 CDN 的 UMD 版本)
 */
declare global {
  interface Window {
    OpenCC: any;
  }
}

// 獲取全域變數
const getOpenCC = () => (window as any).OpenCC || (globalThis as any).OpenCC;

/**
 * 轉義正則表達式中的特殊字符
 */
export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * 解析補丁字串為規則陣列，並按長度排序（長詞優先）
 */
export const parsePatches = (patchStr: string): PatchRule[] => {
  return patchStr
    .split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const [old, newVal] = line.split('=');
      return { old: old?.trim() || '', newVal: newVal?.trim() || '' };
    })
    .filter(rule => rule.old !== '')
    .sort((a, b) => b.old.length - a.old.length);
};

/**
 * 應用自定義補丁到文本
 */
export const applyCustomPatches = (text: string, patchRules: PatchRule[]): string => {
  let result = text;
  patchRules.forEach(rule => {
    const escapedOld = escapeRegExp(rule.old);
    const regex = new RegExp(escapedOld, 'g');
    result = result.replace(regex, rule.newVal);
  });
  return result;
};

/**
 * 執行 OpenCC 繁簡轉換
 */
export const convertText = async (text: string, type: ConversionType): Promise<string> => {
  if (!text) return '';
  
  const OpenCC = getOpenCC();
  if (!OpenCC) {
    console.warn('OpenCC library not found, skipping conversion.');
    return text;
  }

  // 使用 OpenCC.js 核心轉換邏輯
  const converter = OpenCC.Converter({ 
    from: type === ConversionType.TO_SIMPLIFIED ? 'tw' : 'cn', 
    to: type === ConversionType.TO_SIMPLIFIED ? 'cn' : 'tw' 
  });
  
  return converter(text);
};
