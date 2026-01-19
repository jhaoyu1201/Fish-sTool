
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConversionType, PatchRule, ToastMessage, SiteConfig } from './types';
import { convertText, applyCustomPatches, parsePatches } from './utils/converter';
import Toast from './components/Toast';

const DEFAULT_CONFIG: SiteConfig = {
  siteName: '夢幻文字雲端轉換器',
  subtitle: '追求效率與美感的創作者工具',
  customIcon: null,
  clickSound: null,
  gasUrl: null,
};

const App: React.FC = () => {
  // 核心數據狀態
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [patches, setPatches] = useState('');
  
  // 品牌配置狀態
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  
  // UI 狀態
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [quickSearch, setQuickSearch] = useState('');
  const [quickReplace, setQuickReplace] = useState('');

  // 用於防止初始化重複執行的 Ref
  const hasInitialized = useRef(false);

  // 統一的提示函數
  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    setToasts(prev => [...prev, { id: Date.now() + Math.random(), message, type }]);
  }, []);

  // 雲端同步功能：使用 config 中的 gasUrl
  const syncFromCloud = useCallback(async (targetUrl: string | null = config.gasUrl, silent: boolean = false) => {
    const url = targetUrl;
    if (!url) {
      if (!silent) addToast('未設定雲端網址，請前往後台設定', 'info');
      return;
    }
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const text = await response.text();
      
      let finalPatches = text;
      try {
        const data = JSON.parse(text);
        finalPatches = data.patches || text;
      } catch {
        finalPatches = text;
      }
      
      setPatches(finalPatches);
      if (!silent) addToast('雲端補丁下載成功 ☁️', 'success');
    } catch (error) {
      if (!silent) addToast('雲端下載失敗，請檢查網址或 CORS 設定', 'error');
    }
  }, [config.gasUrl, addToast]);

  const uploadToCloud = async () => {
    if (!config.gasUrl) return addToast('未設定雲端網址，請前往後台設定', 'error');
    try {
      await fetch(config.gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patches })
      });
      addToast('已送出雲端上傳請求 🚀', 'info');
    } catch (error) {
      addToast('上傳失敗', 'error');
    }
  };

  // 初始化：只執行一次
  useEffect(() => {
    if (hasInitialized.current) return;

    const savedPatches = localStorage.getItem('dream_cloud_patches');
    const savedConfigStr = localStorage.getItem('dream_cloud_site_config');
    
    if (savedPatches) setPatches(savedPatches);
    
    if (savedConfigStr) {
      const savedConfig: SiteConfig = JSON.parse(savedConfigStr);
      setConfig(savedConfig);
      if (savedConfig.gasUrl) {
        syncFromCloud(savedConfig.gasUrl, true);
      }
    }

    hasInitialized.current = true;
  }, [syncFromCloud]);

  // 同步更新瀏覽器分頁標題與 Favicon
  useEffect(() => {
    // 更新標題
    document.title = config.siteName;

    // 更新 Favicon
    if (config.customIcon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = config.customIcon;
    }
  }, [config.siteName, config.customIcon]);

  // 播放音效
  const playSound = useCallback(() => {
    if (config.clickSound) {
      const audio = new Audio(config.clickSound);
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
  }, [config.clickSound]);

  const wrap = (fn: (...args: any[]) => void) => (...args: any[]) => {
    playSound();
    fn(...args);
  };

  const handleConvert = async (type: ConversionType) => {
    if (!inputText.trim()) return addToast('請先輸入內容', 'info');
    try {
      let result = await convertText(inputText, type);
      result = applyCustomPatches(result, parsePatches(patches));
      setOutputText(result);
      addToast('轉換完成 ✨', 'success');
    } catch { addToast('發生未知錯誤', 'error'); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <header className="flex justify-between items-start mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/40 p-2 rounded-2xl shadow-sm backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/50">
            {config.customIcon ? (
              <img src={config.customIcon} alt="Icon" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            )}
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent leading-tight">
              {config.siteName}
            </h1>
            <p className="text-slate-500 text-sm font-medium tracking-wide opacity-80">{config.subtitle}</p>
          </div>
        </div>
      </header>

      <main className="space-y-6">
        {/* 輸入區域 */}
        <section className="glass-panel rounded-[2rem] p-6 shadow-xl border-white/40">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-slate-600 font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              輸入原文
            </h2>
            <button onClick={wrap(() => setInputText(''))} className="text-xs text-slate-400 hover:text-rose-500 transition-colors font-medium">清空內容</button>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="請在此貼上您的中文內容..."
            className="w-full h-44 bg-transparent border-none focus:ring-0 text-lg leading-relaxed placeholder:text-slate-300 resize-none no-scrollbar"
          />
        </section>

        {/* Action Bar */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 glass-panel rounded-[1.5rem] p-3 shadow-md flex items-center gap-2 sm:gap-4">
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <input value={quickSearch} onChange={e => setQuickSearch(e.target.value)} placeholder="把這個錯字..." className="flex-1 min-w-0 bg-white/50 border-none rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-rose-200 outline-none" />
              <span className="text-rose-300 font-bold shrink-0">➔</span>
              <input value={quickReplace} onChange={e => setQuickReplace(e.target.value)} placeholder="換成對的..." className="flex-1 min-w-0 bg-white/50 border-none rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-rose-200 outline-none" />
            </div>
            <button 
              onClick={wrap(() => {
                if (!quickSearch.trim()) return addToast('請輸入要修正的字', 'info');
                const rule = `${quickSearch.trim()}=${quickReplace.trim()}`;
                setPatches(p => p ? `${p}\n${rule}` : rule);
                setQuickSearch(''); setQuickReplace(''); addToast('已加入補丁', 'success');
              })} 
              className="bg-rose-400 text-white px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shrink-0 whitespace-nowrap active:scale-95 transition-transform"
            >
              修正並記憶
            </button>
          </div>

          <div className="lg:col-span-5 flex gap-2">
            <button onClick={wrap(() => handleConvert(ConversionType.TO_SIMPLIFIED))} className="flex-1 bg-gradient-to-r from-rose-400 to-rose-500 text-white font-bold rounded-2xl shadow-lg py-3 hover:brightness-105 active:scale-95 transition-all">變簡體</button>
            <button onClick={wrap(() => handleConvert(ConversionType.TO_TRADITIONAL))} className="flex-1 bg-gradient-to-r from-purple-400 to-purple-500 text-white font-bold rounded-2xl shadow-lg py-3 hover:brightness-105 active:scale-95 transition-all">變繁體</button>
            <button onClick={wrap(() => { setInputText(outputText); setOutputText(inputText); })} className="bg-white/60 w-12 sm:w-14 flex items-center justify-center rounded-2xl shadow-md text-slate-500 hover:rotate-180 transition-transform duration-500">🔄</button>
          </div>
        </section>

        {/* 成果輸出 */}
        <section className="glass-panel rounded-[2rem] p-6 shadow-xl">
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-slate-600 font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              成果報告
            </h2>
            <button onClick={wrap(() => { navigator.clipboard.writeText(outputText); addToast('成果已複製', 'success'); })} className="text-xs bg-white/60 px-4 py-1.5 rounded-lg border border-white/20 hover:bg-white transition-all font-medium">📋 複製成果</button>
          </div>
          <textarea readOnly value={outputText} className="w-full h-44 bg-transparent border-none focus:ring-0 text-lg leading-relaxed no-scrollbar resize-none cursor-default" placeholder="轉換後的內容將顯示於此..." />
        </section>

        {/* 智慧補丁系統 */}
        <section className="glass-panel rounded-[1.5rem] overflow-hidden shadow-lg border border-white/20">
          <details className="group" open>
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/30 transition-colors list-none">
              <div className="flex items-center gap-3">
                <span className="text-lg">✨</span>
                <span className="font-bold text-slate-600">智慧補丁系統 (Cloud Dictionary)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${config.gasUrl ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                   {config.gasUrl ? '☁️ 已連結雲端' : '未設定網址'}
                </span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </summary>
            <div className="p-4 border-t border-white/20 space-y-4 bg-white/10">
              <div className="flex justify-between items-center">
                 <div className="flex gap-2">
                  <button onClick={wrap(() => syncFromCloud(null, false))} className="px-4 py-2 bg-sky-400 text-white text-[10px] font-bold rounded-xl shadow-md hover:brightness-105 active:scale-95 transition-all whitespace-nowrap">☁️ 手動下載補丁</button>
                  <button onClick={wrap(uploadToCloud)} className="px-4 py-2 bg-indigo-400 text-white text-[10px] font-bold rounded-xl shadow-md hover:brightness-105 active:scale-95 transition-all whitespace-nowrap">🚀 上傳至雲端</button>
                </div>
                <button onClick={wrap(() => { localStorage.setItem('dream_cloud_patches', patches); addToast('已儲存至本地', 'success'); })} className="text-[10px] font-bold text-rose-400 hover:underline">💾 儲存至本地</button>
              </div>

              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                規則清單（每行一條：舊字=新字）
              </div>
              
              <textarea
                value={patches}
                onChange={(e) => setPatches(e.target.value)}
                className="w-full h-48 bg-white/40 rounded-xl p-4 text-sm font-mono border-none focus:ring-2 focus:ring-rose-200 resize-none no-scrollbar leading-relaxed"
                placeholder="範例：&#10;發佈=發布&#10;程式=程序"
              />
              <p className="text-[9px] text-slate-400 text-center italic">※ 提示：雲端網址現在統一由後台 (admin.html) 進行管理設定。</p>
            </div>
          </details>
        </section>
      </main>

      <Toast toasts={toasts} onRemove={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
};

export default App;
