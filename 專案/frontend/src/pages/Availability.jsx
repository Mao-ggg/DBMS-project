import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, MousePointer2, Check, Loader2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export default function Availability() {
  const { user } = useUser();
  const days = ['一', '二', '三', '四', '五', '六', '日'];
  const hours = Array.from({length: 14}, (_, i) => i + 8); // 8 AM to 21 PM
  
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'add' or 'remove'

  // Fetch availability on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/availability/${user.id}`);
        const data = await res.json();
        const newSlots = new Set();
        data.forEach(item => {
          // Expand ranges into 1-hour slots
          for (let h = item.start_time; h < item.end_time; h++) {
            newSlots.add(`${item.day_of_week}-${h}`);
          }
        });
        setSelectedSlots(newSlots);
      } catch (err) {
        console.error('Failed to fetch availability', err);
        setMessage({ text: '無法載入現有設定', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchAvailability();
  }, [user]);

  // Handle Drag Selection
  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const toggleSlot = (dayIndex, hour, mode) => {
    const key = `${dayIndex}-${hour}`;
    setSelectedSlots(prev => {
      const next = new Set(prev);
      if (mode === 'add') next.add(key);
      else if (mode === 'remove') next.delete(key);
      else {
        // Simple toggle if no mode specified
        if (next.has(key)) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  };

  const handleMouseDown = (dayIndex, hour) => {
    const key = `${dayIndex}-${hour}`;
    const mode = selectedSlots.has(key) ? 'remove' : 'add';
    setDragMode(mode);
    setIsDragging(true);
    toggleSlot(dayIndex, hour, mode);
  };

  const handleMouseEnter = (dayIndex, hour) => {
    if (isDragging) {
      toggleSlot(dayIndex, hour, dragMode);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    // Group consecutive slots into ranges for storage efficiency
    const availability = [];
    // For each day, find continuous blocks
    for (let d = 0; d < 7; d++) {
      let start = null;
      for (let h = 8; h <= 22; h++) {
        const isSelected = selectedSlots.has(`${d}-${h}`);
        if (isSelected && start === null) {
          start = h;
        } else if (!isSelected && start !== null) {
          availability.push({ day_of_week: d, start_time: start, end_time: h });
          start = null;
        }
      }
    }

    try {
      const res = await fetch('http://localhost:3000/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, availability }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: '儲存成功！', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        setMessage({ text: '儲存失敗', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: '連線錯誤', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <Loader2 className="w-10 h-10 text-navy-500 animate-spin" />
        <p className="text-navy-500 font-medium">正在載入您的設定...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 select-none">
      <header className="flex items-center mb-8">
        <Link to="/" className="p-2 hover:bg-navy-100 rounded-full transition-colors mr-4">
          <ArrowLeft className="w-5 h-5 text-navy-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">可用時間設定</h1>
          <p className="text-navy-400">請拖曳選取您可排班的時段{user?.role === 'PT' ? '，或上傳課表由系統自動解析' : ''}</p>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MousePointer2 className="w-5 h-5 text-gold-500" /> 時段選擇
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-gold-400 rounded-sm"></div> 可用</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-navy-100 rounded-sm"></div> 不可</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-8 gap-1 mb-1">
                <div></div>
                {days.map((d, i) => <div key={i} className="text-center text-xs font-semibold text-navy-500 pb-2">週{d}</div>)}
              </div>
              {hours.map(h => (
                <div key={h} className="grid grid-cols-8 gap-1 mb-1">
                  <div className="text-xs text-navy-400 text-right pr-2 pt-1">{h}:00</div>
                  {days.map((_, i) => {
                    const isSelected = selectedSlots.has(`${i}-${h}`);
                    return (
                      <div 
                        key={i} 
                        onMouseDown={() => handleMouseDown(i, h)}
                        onMouseEnter={() => handleMouseEnter(i, h)}
                        className={`h-8 rounded cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-gold-400 shadow-inner scale-[0.98]' 
                            : 'bg-navy-50 hover:bg-navy-100 border border-navy-100'
                        }`}
                      ></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between">
            <div className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text && (
                <span className="flex items-center gap-1">
                  {message.type === 'success' && <Check className="w-4 h-4" />}
                  {message.text}
                </span>
              )}
            </div>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className={`btn-primary flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? '儲存中...' : '儲存設定'}
            </button>
          </div>
        </div>

        {user?.role === 'PT' && (
          <div className="glass-card p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-navy-500" /> 課表上傳
            </h2>
            <p className="text-sm text-navy-500 mb-4">
              上傳學校課表 CSV 檔，系統將自動解析您不可排班的時段。
            </p>
            
            <label className="border-2 border-dashed border-navy-200 rounded-xl p-8 text-center hover:bg-navy-50 transition-colors cursor-pointer group block">
              <input type="file" accept=".csv" className="hidden" />
              <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-navy-500" />
              </div>
              <p className="font-medium text-navy-700">點擊或拖曳檔案至此</p>
              <p className="text-xs text-navy-400 mt-1">僅支援 .csv 格式</p>
            </label>
            
            <div className="mt-6 p-4 bg-navy-50 rounded-lg border border-navy-100">
              <h4 className="text-sm font-bold text-navy-700 mb-2">小撇步</h4>
              <ul className="text-xs text-navy-500 space-y-1 list-disc pl-4">
                <li>您可以直接用滑鼠拖曳連續選取多個時段</li>
                <li>再次點擊已選取的時段可取消選取</li>
                <li>記得點擊「儲存設定」才會正式更新</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
