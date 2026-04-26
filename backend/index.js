const express = require('express');
const cors = require('cors');
const multer = require('multer');
const db = require('./db');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// API: 首頁測試
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// API: 登入
app.post('/api/login', (req, res) => {
  const { name, password } = req.body;
  db.get('SELECT * FROM users WHERE name = ? AND password = ?', [name, password], (err, row) => {
    if (err) {
      res.status(500).json({ success: false, message: '伺服器錯誤' });
    } else if (row) {
      // 移除密碼後回傳
      const { password, ...user } = row;
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
    }
  });
});

// API: 取得所有使用者
app.get('/api/users', (req, res) => {
  db.all('SELECT id, name, role, is_manager FROM users', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API: 取得當週班表
app.get('/api/schedules', (req, res) => {
  const sql = `
    SELECT s.id, u.id as user_id, u.name as employee, u.role as employee_role, sh.role_type as role, sh.day_of_week as day, sh.start_time as start, sh.end_time as end
    FROM schedules s
    JOIN users u ON s.user_id = u.id
    JOIN shifts sh ON s.shift_id = sh.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const formatted = rows.map(r => ({
      ...r,
      type: r.start < 12 ? 'morning' : (r.start >= 12 && r.start < 16 ? 'afternoon' : 'full')
    }));
    res.json(formatted);
  });
});

// API: 取得可用時間
app.get('/api/availability/:userId', (req, res) => {
  const { userId } = req.params;
  db.all('SELECT * FROM availability WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API: 設定可用時間
app.post('/api/availability', (req, res) => {
  const { userId, availability } = req.body; // availability: [{ day_of_week, start_time, end_time }, ...]
  
  if (!userId || !Array.isArray(availability)) {
    return res.status(400).json({ success: false, message: '無效的資料' });
  }

  db.serialize(() => {
    db.run('DELETE FROM availability WHERE user_id = ?', [userId], (err) => {
      if (err) {
        console.error('Error deleting old availability:', err.message);
      }
    });
    
    const stmt = db.prepare('INSERT INTO availability (user_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)');
    availability.forEach(slot => {
      stmt.run(userId, slot.day_of_week, slot.start_time, slot.end_time);
    });
    stmt.finalize((err) => {
      if (err) {
        res.status(500).json({ success: false, message: '儲存失敗' });
      } else {
        res.json({ success: true, message: '儲存成功' });
      }
    });
  });
});

// API: 上傳課表解析
app.post('/api/upload', upload.single('schedule'), (req, res) => {
  // 模擬 AI 解析
  setTimeout(() => {
    res.json({ 
      success: true, 
      message: 'AI 解析完成',
      parsedAvailability: [] 
    });
  }, 1500);
});

// API: 取得換班申請
app.get('/api/swap-requests/:userId', (req, res) => {
  const { userId } = req.params;
  const sql = `
    SELECT sr.*, u1.name as requester_name, u2.name as target_name, sh.day_of_week, sh.start_time, sh.end_time
    FROM swap_requests sr
    JOIN users u1 ON sr.requester_id = u1.id
    JOIN users u2 ON sr.target_user_id = u2.id
    JOIN schedules s ON sr.schedule_id = s.id
    JOIN shifts sh ON s.shift_id = sh.id
    WHERE sr.requester_id = ? OR sr.target_user_id = ?
    ORDER BY sr.created_at DESC
  `;
  db.all(sql, [userId, userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API: 發起換班申請
app.post('/api/swap', (req, res) => {
  const { requesterId, targetUserId, scheduleId, reason } = req.body;
  const sql = `INSERT INTO swap_requests (requester_id, target_user_id, schedule_id, reason) VALUES (?, ?, ?, ?)`;
  db.run(sql, [requesterId, targetUserId, scheduleId, reason], function(err) {
    if (err) {
      res.status(500).json({ success: false, message: '發起失敗' });
    } else {
      res.json({ success: true, message: '換班申請已送出', requestId: this.lastID });
    }
  });
});

// API: 回應換班申請
app.put('/api/swap/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'accepted' or 'rejected'

  db.serialize(() => {
    db.run('UPDATE swap_requests SET status = ? WHERE id = ?', [status, id], (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: '更新失敗' });
      }

      if (status === 'accepted') {
        db.get('SELECT schedule_id, target_user_id FROM swap_requests WHERE id = ?', [id], (err, row) => {
          if (row) {
            db.run('UPDATE schedules SET user_id = ? WHERE id = ?', [row.target_user_id, row.schedule_id], (err) => {
              if (err) console.error('Error updating schedule:', err.message);
            });
          }
        });
      }
      res.json({ success: true, status });
    });
  });
});

// API: 取得通知
app.get('/api/notifications/:userId', (req, res) => {
  res.json([]);
});

// API: 自動生成班表 (Admin)
app.post('/api/admin/generate-schedule', (req, res) => {
  db.serialize(() => {
    // 1. 清空舊班表
    db.run('DELETE FROM schedules', (err) => {
      if (err) console.error('Error clearing schedules:', err.message);
    });

    // 2. 獲取所有班次需求與員工可用時間
    db.all('SELECT * FROM shifts', [], (err, shifts) => {
      if (err) return res.status(500).json({ success: false, message: '讀取班次失敗' });

      db.all('SELECT * FROM availability', [], (err, availabilities) => {
        if (err) return res.status(500).json({ success: false, message: '讀取可用時間失敗' });

        const stmt = db.prepare('INSERT INTO schedules (user_id, shift_id, week_start_date) VALUES (?, ?, ?)');
        const today = new Date().toISOString().split('T')[0];

        let assignedCount = 0;
        shifts.forEach(shift => {
          // 找尋符合此班次時段的員工
          const candidates = availabilities.filter(avail => 
            avail.day_of_week === shift.day_of_week &&
            avail.start_time <= shift.start_time &&
            avail.end_time >= shift.end_time
          );

          if (candidates.length > 0) {
            // 隨機選一個
            const winner = candidates[Math.floor(Math.random() * candidates.length)];
            stmt.run(winner.user_id, shift.id, today);
            assignedCount++;
          }
        });

        stmt.finalize((err) => {
          if (err) {
            res.status(500).json({ success: false, message: '生成失敗' });
          } else {
            res.json({ 
              success: true, 
              message: `班表生成完成，共安排 ${assignedCount} 個班次`,
              assignedCount 
            });
          }
        });
      });
    });
  });
});

// API: 取得薪資與工時統計
app.get('/api/stats/:userId', (req, res) => {
  const { userId } = req.params;
  const sql = `
    SELECT s.id, u.hourly_rate, sh.day_of_week, sh.start_time, sh.end_time, sh.role_type
    FROM schedules s
    JOIN users u ON s.user_id = u.id
    JOIN shifts sh ON s.shift_id = sh.id
    WHERE s.user_id = ?
  `;
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    let totalHours = 0;
    let totalPay = 0;
    
    if (rows.length === 0) {
      db.get('SELECT hourly_rate FROM users WHERE id = ?', [userId], (err, userRow) => {
        res.json({
          totalHours: 0,
          totalPay: 0,
          hourlyRate: userRow ? userRow.hourly_rate : 185,
          records: []
        });
      });
      return;
    }

    rows.forEach(row => {
      const hours = row.end_time - row.start_time;
      totalHours += hours;
      totalPay += hours * row.hourly_rate;
    });

    res.json({
      totalHours,
      totalPay,
      hourlyRate: rows[0].hourly_rate,
      records: rows
    });
  });
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
