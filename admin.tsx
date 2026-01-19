
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { SiteConfig } from './types';

const DEFAULT_CONFIG: SiteConfig = {
  siteName: '夢幻文字雲端轉換器',
  subtitle: '追求效率與美感的創作者工具',
  customIcon: null,
  clickSound: null,
  gasUrl: null,
};

const AdminApp: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [saveStatus, setSaveStatus] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dream_cloud_site_config');
    if (saved) {
      try {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
  }, []);

  // 同步更新瀏覽器分頁標題與 Favicon
  useEffect(() => {
    document.title = `${config.siteName} - 後台管理`;
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

  const handleSave = () => {
    localStorage.setItem('dream_cloud_site_config', JSON.stringify(config));
    // 同步舊有的 gas_url 鍵值以確保相容性
    if (config.gasUrl) {
      localStorage.setItem('dream_cloud_gas_url', config.gasUrl);
    }
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleFileUpload = (type: 'icon' | 'sound', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setConfig({ ...config, [type === 'icon' ? 'customIcon' : 'clickSound']: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen p-6 md:p-12 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white shadow-2xl rounded-[2.5rem] p-10 border border-slate-100">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="bg-indigo-600 p-2 rounded-xl text-white">⚙️</span>
            後台管理平台
          </h1>
          <a href="index.html" className="text-indigo-600 font-bold hover:underline">返回主網站 →</a>
        </div>

        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase">網站名稱</label>
              <input 
                type="text" value={config.siteName} 
                onChange={e => setConfig({...config, siteName: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase">網站副標題</label>
              <input 
                type="text" value={config.subtitle} 
                onChange={e => setConfig({...config, subtitle: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase">雲端補丁 GAS URL (固定讀取網址)</label>
            <input 
              type="text" 
              value={config.gasUrl || ''} 
              onChange={e => setConfig({...config, gasUrl: e.target.value})}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-[10px] text-slate-400 px-2 italic">設定後，主程式將固定從此網址自動下載並同步補丁。</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-500 uppercase">自訂品牌 ICON</label>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-xl shadow-sm overflow-hidden flex items-center justify-center">
                  {config.customIcon ? <img src={config.customIcon} className="w-full h-full object-cover" alt="Custom Icon" /> : <span className="text-2xl">☁️</span>}
                </div>
                <input type="file" accept="image/*" onChange={e => handleFileUpload('icon', e)} className="text-xs" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-500 uppercase">按鈕點擊音效</label>
              <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <input type="file" accept="audio/*" onChange={e => handleFileUpload('sound', e)} className="text-xs" />
                {config.clickSound && (
                  <button onClick={() => new Audio(config.clickSound!).play()} className="text-xs text-indigo-600 font-bold self-start">▶ 測試音效</button>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-xl ${saveStatus ? 'bg-emerald-500' : 'bg-slate-900 hover:scale-[1.02]'}`}
          >
            {saveStatus ? '✅ 已成功儲存全站設定！' : '儲存全站設定'}
          </button>
        </div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('admin-root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<AdminApp />);
}
