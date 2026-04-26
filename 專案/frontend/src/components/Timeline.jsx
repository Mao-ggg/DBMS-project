import React, { useState, useEffect } from 'react';

export default function Timeline() {
  const days = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedulesRes, usersRes] = await Promise.all([
          fetch('http://localhost:3000/api/schedules'),
          fetch('http://localhost:3000/api/users')
        ]);
        const schedulesData = await schedulesRes.json();
        const usersData = await usersRes.json();
        setShifts(schedulesData);
        setEmployees(usersData.map(u => u.name));
      } catch (err) {
        console.error('Failed to fetch timeline data', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="overflow-x-auto w-full">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-8 gap-4 border-b border-navy-100 pb-4 mb-4 text-sm font-semibold text-navy-500">
          <div className="col-span-1">時間 / 員工</div>
          {days.map((day, i) => (
            <div key={i} className="text-center">{day}</div>
          ))}
        </div>

        <div className="space-y-4">
          {employees.map((emp) => (
            <div key={emp} className="grid grid-cols-8 gap-4 items-center">
              <div className="font-medium text-navy-800">{emp}</div>
              {days.map((_, dayIndex) => {
                const shift = shifts.find(s => s.employee === emp && s.day === dayIndex);
                return (
                  <div key={dayIndex} className="h-16 rounded-md bg-navy-50 border border-navy-100 flex items-center justify-center relative group p-2">
                    {shift ? (
                      <div className={`w-full h-full rounded flex flex-col justify-center items-center text-xs text-white p-1
                        ${shift.type === 'morning' ? 'bg-gold-400' : shift.type === 'afternoon' ? 'bg-navy-500' : 'bg-gold-600'}`}>
                        <span className="font-bold">{shift.start}:00 - {shift.end}:00</span>
                        <span>{shift.role}</span>
                      </div>
                    ) : (
                      <span className="text-navy-200 text-xs">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
