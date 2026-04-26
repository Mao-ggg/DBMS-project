import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, CalendarDays, Settings, Loader2, CheckCircle2 } from 'lucide-react';

export default function Admin() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:3000/api/admin/generate-schedule', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setTimeout(() => setResult(null), 5000);
      } else {
        alert(data.message || '生成失敗');
      }
    } catch (err) {
      alert('伺服器連線錯誤');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="flex items-center mb-8">
        <Link to="/" className="p-2 hover:bg-navy-100 rounded-full transition-colors mr-4">
          <ArrowLeft className="w-5 h-5 text-navy-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-playfair text-navy-900">管理員控制台</h1>
          <p className="text-navy-400">員工管理與自動排班設定</p>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card p-6 cursor-not-allowed opacity-60 grayscale border border-transparent transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-navy-50 rounded-lg">
              <Users className="w-6 h-6 text-navy-600" />
            </div>
            <h2 className="text-xl font-semibold">員工管理</h2>
          </div>
          <p className="text-sm text-navy-500">新增/移除員工、設定時薪與角色權限 (開發中)。</p>
        </div>

        <div className="glass-card p-6 hover:border-gold-300 border border-transparent transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-navy-50 rounded-lg">
              <CalendarDays className="w-6 h-6 text-navy-600" />
            </div>
            <h2 className="text-xl font-semibold">自動排班</h2>
          </div>
          <p className="text-sm text-navy-500 mb-4">設定班次需求人數，點擊一鍵自動生成當週班表。</p>
          
          {result ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              {result.message}
            </div>
          ) : (
            <button 
              onClick={handleGenerate}
              disabled={generating}
              className={`w-full btn-primary py-2 text-sm flex justify-center items-center gap-2 ${generating ? 'opacity-70' : ''}`}
            >
              {generating && <Loader2 className="w-4 h-4 animate-spin" />}
              {generating ? '生成中...' : '一鍵生成班表'}
            </button>
          )}
        </div>

        <div className="glass-card p-6 cursor-not-allowed opacity-60 grayscale border border-transparent transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-navy-50 rounded-lg">
              <Settings className="w-6 h-6 text-navy-600" />
            </div>
            <h2 className="text-xl font-semibold">系統設定</h2>
          </div>
          <p className="text-sm text-navy-500">營業時間、班次類型定義、通知設定 (開發中)。</p>
        </div>
      </div>
    </div>
  );
}
