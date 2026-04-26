import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Notifications() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link to="/" className="p-2 hover:bg-navy-100 rounded-full transition-colors mr-4">
            <ArrowLeft className="w-5 h-5 text-navy-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">通知中心</h1>
          </div>
        </div>
        <button className="text-sm text-navy-500 hover:text-navy-800 transition-colors">
          全部設為已讀
        </button>
      </header>

      <div className="space-y-4">
        {/* Notification Items */}
        <div className="glass-card p-5 border-l-4 border-l-gold-400 flex gap-4 items-start">
          <div className="mt-1">
            <Bell className="w-5 h-5 text-gold-500" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-800">收到換班申請</h3>
            <p className="text-sm text-navy-600 mt-1">Charlie 想要與您交換 10/24 (一) 09:00-14:00 的班次。</p>
            <p className="text-xs text-navy-400 mt-2">2 小時前</p>
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-green-400 flex gap-4 items-start bg-navy-50/30">
          <div className="mt-1">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-800">換班申請已通過</h3>
            <p className="text-sm text-navy-600 mt-1">Alice 接受了您的換班申請。班表已自動更新。</p>
            <p className="text-xs text-navy-400 mt-2">昨天 14:30</p>
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-red-400 flex gap-4 items-start bg-navy-50/30">
          <div className="mt-1">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-800">換班申請被拒絕</h3>
            <p className="text-sm text-navy-600 mt-1">Bob 拒絕了您 10/27 (四) 的換班申請。</p>
            <p className="text-xs text-navy-400 mt-2">2 天前</p>
          </div>
        </div>
      </div>
    </div>
  );
}
