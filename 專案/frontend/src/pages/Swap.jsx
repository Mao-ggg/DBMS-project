import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRightLeft, Check, X, ShieldCheck, Loader2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export default function Swap() {
  const { user } = useUser();
  const [myShifts, setMyShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    scheduleId: '',
    targetUserId: '',
    reason: ''
  });

  const fetchData = async () => {
    try {
      const [schedulesRes, usersRes, requestsRes] = await Promise.all([
        fetch('http://localhost:3000/api/schedules'),
        fetch('http://localhost:3000/api/users'),
        fetch(`http://localhost:3000/api/swap-requests/${user.id}`)
      ]);
      
      const schedules = await schedulesRes.json();
      const users = await usersRes.json();
      const reqs = await requestsRes.json();
      
      setMyShifts(schedules.filter(s => s.user_id === user.id));
      setEmployees(users.filter(u => u.id !== user.id));
      setRequests(reqs);
    } catch (err) {
      console.error('Fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.scheduleId || !formData.targetUserId) {
      alert('請選擇班次與目標同事');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:3000/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: user.id,
          targetUserId: parseInt(formData.targetUserId),
          scheduleId: parseInt(formData.scheduleId),
          reason: formData.reason
        }),
      });
      if (res.ok) {
        alert('換班申請已送出');
        fetchData();
        setFormData({ scheduleId: '', targetUserId: '', reason: '' });
      }
    } catch (err) {
      alert('發送失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResponse = async (requestId, status) => {
    try {
      const res = await fetch(`http://localhost:3000/api/swap/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      alert('處理失敗');
    }
  };

  const getDayName = (dayIndex) => ['一', '二', '三', '四', '五', '六', '日'][dayIndex];

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <Loader2 className="w-10 h-10 text-navy-500 animate-spin" />
      <p className="text-navy-500">正在獲取申請資料...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="flex items-center mb-8">
        <Link to="/" className="p-2 hover:bg-navy-100 rounded-full transition-colors mr-4">
          <ArrowLeft className="w-5 h-5 text-navy-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">換班申請</h1>
          <p className="text-navy-400">發起換班或審核收到的申請</p>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-gold-500" /> 發起申請
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">我的班次</label>
              <select 
                value={formData.scheduleId}
                onChange={e => setFormData({...formData, scheduleId: e.target.value})}
                className="w-full bg-navy-50 border border-navy-100 rounded-md p-3 outline-none focus:border-gold-400 transition-colors"
              >
                <option value="">選擇要換出的班次</option>
                {myShifts.map(s => (
                  <option key={s.id} value={s.id}>
                    週{getDayName(s.day)} {s.start}:00-{s.end}:00 ({s.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">目標同事</label>
              <select 
                value={formData.targetUserId}
                onChange={e => setFormData({...formData, targetUserId: e.target.value})}
                className="w-full bg-navy-50 border border-navy-100 rounded-md p-3 outline-none focus:border-gold-400 transition-colors"
              >
                <option value="">選擇換班對象</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.role || '員工'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">原因 (選填)</label>
              <textarea 
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
                className="w-full bg-navy-50 border border-navy-100 rounded-md p-3 outline-none focus:border-gold-400 transition-colors resize-none h-24" 
                placeholder="請填寫換班原因..."
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              className={`btn-primary w-full mt-2 flex justify-center items-center gap-2 ${submitting ? 'opacity-70' : ''}`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              送出申請
            </button>
          </form>
        </section>

        <section className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-6">收到的申請</h2>
          <div className="space-y-4">
            {requests.filter(r => r.target_user_id === user.id).length === 0 ? (
              <p className="text-center text-navy-400 py-8">目前沒有待處理的申請</p>
            ) : (
              requests.filter(r => r.target_user_id === user.id).map(req => (
                <div key={req.id} className="p-4 border border-navy-100 rounded-xl bg-navy-50/50 hover:bg-white transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-semibold text-navy-800">{req.requester_name}</span>
                      <span className="text-xs text-navy-400 ml-2">
                        {new Date(req.created_at).toLocaleString()}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      req.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {req.status === 'pending' ? '待處理' : req.status === 'accepted' ? '已接受' : '已拒絕'}
                    </span>
                  </div>
                  <p className="text-sm text-navy-600 mb-4">
                    想跟你換 <strong className="text-gold-600">週{getDayName(req.day_of_week)} {req.start_time}:00-{req.end_time}:00</strong> 的班次
                    {req.reason && <div className="mt-2 text-xs italic">原因: {req.reason}</div>}
                  </p>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleResponse(req.id, 'accepted')}
                        className="flex-1 btn-primary bg-green-500 hover:bg-green-600 text-white flex justify-center items-center gap-1 py-2"
                      >
                        <Check className="w-4 h-4" /> 接受
                      </button>
                      <button 
                        onClick={() => handleResponse(req.id, 'rejected')}
                        className="flex-1 btn-secondary bg-white text-red-500 border-red-200 hover:bg-red-50 flex justify-center items-center gap-1 py-2"
                      >
                        <X className="w-4 h-4" /> 拒絕
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <h2 className="text-xl font-semibold mt-10 mb-6">我的發出</h2>
          <div className="space-y-4">
             {requests.filter(r => r.requester_id === user.id).map(req => (
                <div key={req.id} className="p-4 border border-navy-100 rounded-xl bg-white/50">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-navy-600">對象: {req.target_name}</span>
                      <span className={`font-bold ${req.status === 'accepted' ? 'text-green-600' : req.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {req.status === 'pending' ? '待處理' : req.status === 'accepted' ? '已通過' : '被駁回'}
                      </span>
                   </div>
                   <div className="text-xs text-navy-400 mt-1">
                      週{getDayName(req.day_of_week)} {req.start_time}:00-{req.end_time}:00
                   </div>
                </div>
             ))}
          </div>
        </section>
      </div>
    </div>
  );
}
