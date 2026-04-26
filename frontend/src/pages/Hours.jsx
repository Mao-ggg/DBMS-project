import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export default function Hours() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalHours: 0,
    totalPay: 0,
    hourlyRate: 0,
    records: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/stats/${user.id}`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchStats();
  }, [user]);

  const getDayName = (dayIndex) => ['一', '二', '三', '四', '五', '六', '日'][dayIndex];

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <Loader2 className="w-10 h-10 text-navy-500 animate-spin" />
      <p className="text-navy-500 font-medium">計算薪資中...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="flex items-center mb-8">
        <Link to="/" className="p-2 hover:bg-navy-100 rounded-full transition-colors mr-4">
          <ArrowLeft className="w-5 h-5 text-navy-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-playfair text-navy-900">工時與薪資</h1>
          <p className="text-navy-400 font-medium">當週工時統計與薪資試算</p>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-gold-600" />
          </div>
          <p className="text-sm text-navy-400 font-medium">本週累計工時</p>
          <p className="text-3xl font-bold text-navy-800 mt-1 font-playfair">{stats.totalHours} <span className="text-lg text-navy-400">小時</span></p>
        </div>
        
        <div className="glass-card p-6 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-navy-400 font-medium">預估薪資</p>
          <p className="text-3xl font-bold text-navy-800 mt-1 font-playfair">${stats.totalPay.toLocaleString()}</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm text-navy-400 font-medium">目前時薪</p>
          <p className="text-3xl font-bold text-navy-800 mt-1 font-playfair">${stats.hourlyRate}</p>
        </div>
      </div>

      <section className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-navy-500" /> 出勤紀錄
        </h2>
        <div className="overflow-x-auto">
          {stats.records.length === 0 ? (
            <p className="text-center text-navy-400 py-10">目前尚無班表紀錄</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-navy-100 text-sm text-navy-400 font-bold">
                  <th className="pb-3 px-2">日期</th>
                  <th className="pb-3 px-2">角色</th>
                  <th className="pb-3 px-2">班次時段</th>
                  <th className="pb-3 px-2 text-right">時數</th>
                </tr>
              </thead>
              <tbody className="text-navy-700">
                {stats.records.map((record, index) => (
                  <tr key={index} className="border-b border-navy-50 hover:bg-navy-50/50 transition-colors group">
                    <td className="py-4 px-2 font-medium">週{getDayName(record.day_of_week)}</td>
                    <td className="py-4 px-2">
                      <span className="px-2 py-0.5 bg-navy-50 text-navy-600 rounded text-xs font-bold">
                        {record.role_type}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-sm">{record.start_time}:00 - {record.end_time}:00</td>
                    <td className="py-4 px-2 text-right font-bold text-gold-600">
                      {(record.end_time - record.start_time).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
