const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'scheduler.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // 建立所需的表
    db.serialize(() => {
      // 員工表
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT,
        hourly_rate INTEGER DEFAULT 185,
        password TEXT DEFAULT '1234',
        is_manager BOOLEAN DEFAULT 0
      )`);

      // 嘗試增加新欄位，如果已存在會略過錯誤
      db.run(`ALTER TABLE users ADD COLUMN password TEXT DEFAULT '1234'`, (err) => {});
      db.run(`ALTER TABLE users ADD COLUMN is_manager BOOLEAN DEFAULT 0`, (err) => {});

      // 班次定義表 (每天的班次需求)
      db.run(`CREATE TABLE IF NOT EXISTS shifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_of_week INTEGER,
        start_time INTEGER,
        end_time INTEGER,
        required_people INTEGER,
        role_type TEXT
      )`);

      // 實際排班表
      db.run(`CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        shift_id INTEGER,
        week_start_date TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (shift_id) REFERENCES shifts(id)
      )`);

      // 可用時間表
      db.run(`CREATE TABLE IF NOT EXISTS availability (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        day_of_week INTEGER,
        start_time INTEGER,
        end_time INTEGER,
        is_available BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      // 換班申請表
      db.run(`CREATE TABLE IF NOT EXISTS swap_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requester_id INTEGER,
        target_user_id INTEGER,
        schedule_id INTEGER,
        status TEXT DEFAULT 'pending',
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users(id),
        FOREIGN KEY (target_user_id) REFERENCES users(id),
        FOREIGN KEY (schedule_id) REFERENCES schedules(id)
      )`);

      // 通知表
      db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        message TEXT,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);
      
      // 插入一些假資料
      db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (row && row.count === 0) {
          const insertUser = db.prepare("INSERT INTO users (name, role, hourly_rate, password, is_manager) VALUES (?, ?, ?, ?, ?)");
          // 角色簡化為：店經理、正職、PT
          insertUser.run("Admin", "店經理", 250, "1234", 1);
          insertUser.run("Alice", "正職", 200, "1234", 0);
          insertUser.run("Bob", "PT", 185, "1234", 0);
          insertUser.run("Charlie", "PT", 185, "1234", 0);
          insertUser.finalize();
        }
      });

      // 插入一些預設班次需求
      db.get("SELECT COUNT(*) as count FROM shifts", (err, row) => {
        if (row && row.count === 0) {
          const insertShift = db.prepare("INSERT INTO shifts (day_of_week, start_time, end_time, required_people, role_type) VALUES (?, ?, ?, ?, ?)");
          // 每天固定三個時段需求，不再分內外場
          for (let day = 0; day < 7; day++) {
            insertShift.run(day, 9, 14, 1, "早班值班");
            insertShift.run(day, 14, 20, 1, "晚班值班");
            insertShift.run(day, 10, 18, 1, "全日值班");
          }
          insertShift.finalize();
        }
      });
    });
  }
});

module.exports = db;
