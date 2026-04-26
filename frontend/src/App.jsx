import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Calendar, Repeat, Clock, Bell, LogOut } from 'lucide-react';
import Timeline from './components/Timeline';
import Availability from './pages/Availability';
import Swap from './pages/Swap';
import Hours from './pages/Hours';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { useUser } from './contexts/UserContext';

function Home() {
  const { user, logout } = useUser();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-10 text-center relative">
        <div className="absolute right-0 top-0 flex items-center gap-4">
          <span className="text-navy-700 font-medium">嗨，{user?.name} ({user?.role})</span>
          <button onClick={logout} className="text-navy-500 hover:text-red-500 transition-colors flex items-center gap-1 text-sm">
            <LogOut className="w-4 h-4" /> 登出
          </button>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Shift Scheduler</h1>
        <p className="text-navy-400 text-lg">Your automated weekly schedule</p>
      </header>
      
      {/* 4 Feature Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <Link to="/availability" className="glass-card flex flex-col items-center justify-center p-6 hover:bg-gold-50 transition-colors group cursor-pointer border border-transparent hover:border-gold-300">
          <div className="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center mb-3 group-hover:bg-white transition-colors">
            <Calendar className="w-6 h-6 text-navy-600" />
          </div>
          <h3 className="font-semibold text-navy-800">可用時間</h3>
          <p className="text-xs text-navy-400 mt-1">{user?.role === 'PT' ? '設定/上傳課表' : '設定可用時間'}</p>
        </Link>
        
        <Link to="/swap" className="glass-card flex flex-col items-center justify-center p-6 hover:bg-gold-50 transition-colors group cursor-pointer border border-transparent hover:border-gold-300">
          <div className="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center mb-3 group-hover:bg-white transition-colors">
            <Repeat className="w-6 h-6 text-navy-600" />
          </div>
          <h3 className="font-semibold text-navy-800">換班申請</h3>
          <p className="text-xs text-navy-400 mt-1">發起或審核換班</p>
        </Link>
        
        <Link to="/hours" className="glass-card flex flex-col items-center justify-center p-6 hover:bg-gold-50 transition-colors group cursor-pointer border border-transparent hover:border-gold-300">
          <div className="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center mb-3 group-hover:bg-white transition-colors">
            <Clock className="w-6 h-6 text-navy-600" />
          </div>
          <h3 className="font-semibold text-navy-800">工時統計</h3>
          <p className="text-xs text-navy-400 mt-1">薪資試算</p>
        </Link>
        
        <Link to="/notifications" className="glass-card flex flex-col items-center justify-center p-6 hover:bg-gold-50 transition-colors group cursor-pointer border border-transparent hover:border-gold-300 relative">
          <div className="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center mb-3 group-hover:bg-white transition-colors">
            <Bell className="w-6 h-6 text-navy-600" />
          </div>
          <span className="absolute top-4 right-4 w-3 h-3 rounded-full bg-red-500 shadow-sm animate-pulse"></span>
          <h3 className="font-semibold text-navy-800">通知中心</h3>
          <p className="text-xs text-navy-400 mt-1">最新動態</p>
        </Link>
      </div>

      {/* Main Timeline */}
      <section className="glass-card p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">當週班表</h2>
          {user?.is_manager === 1 && (
            <Link to="/admin" className="text-sm text-gold-600 hover:text-gold-700 font-medium bg-gold-50 px-3 py-1 rounded-full">
              管理員設定 &rarr;
            </Link>
          )}
        </div>
        <Timeline />
      </section>
    </div>
  );
}

function App() {
  const { user } = useUser();

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/hours" element={<Hours />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={user.is_manager ? <Admin /> : <Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
