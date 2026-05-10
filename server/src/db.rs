use crate::models::*;
use anyhow::{anyhow, Result};
use chrono::Utc;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::params;
use uuid::Uuid;

pub type DbPool = Pool<SqliteConnectionManager>;

pub fn open_pool(path: &str) -> Result<DbPool> {
    let manager = SqliteConnectionManager::file(path);
    let pool = r2d2::Pool::builder().max_size(8).build(manager)?;
    let conn = pool.get()?;
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE,
            nickname TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            balance INTEGER NOT NULL DEFAULT 0,
            role TEXT NOT NULL DEFAULT 'user',
            created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            consumed INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_codes_email ON codes(email);
        CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            is_dm INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            last_message_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS chat_members (
            chat_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            PRIMARY KEY (chat_id, user_id)
        );
        CREATE INDEX IF NOT EXISTS idx_chat_members_user ON chat_members(user_id);
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            chat_id TEXT NOT NULL,
            author_id TEXT NOT NULL,
            author_nickname TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
        CREATE TABLE IF NOT EXISTS complaints (
            id TEXT PRIMARY KEY,
            from_user_id TEXT NOT NULL,
            from_nickname TEXT NOT NULL,
            target TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            created_at INTEGER NOT NULL
        );
        "#,
    )?;

    // Lightweight migrations for older DBs (adds columns if missing)
    let _ = conn.execute("ALTER TABLE users ADD COLUMN username TEXT", []);
    let _ = conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)", []);
    let _ = conn.execute("ALTER TABLE chats ADD COLUMN is_dm INTEGER NOT NULL DEFAULT 0", []);

    Ok(pool)
}

// --- Users --------------------------------------------------------------

pub fn create_user(pool: &DbPool, email: &str, nickname: &str, password_hash: &str) -> Result<User> {
    let conn = pool.get()?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO users (id, email, username, nickname, password_hash, balance, role, created_at) VALUES (?, ?, NULL, ?, ?, 0, 'user', ?)",
        params![id, email, nickname, password_hash, now],
    )?;
    get_user(pool, &id)?.ok_or_else(|| anyhow!("user not found after insert"))
}

pub fn get_user(pool: &DbPool, id: &str) -> Result<Option<User>> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT id, email, username, nickname, balance, role, created_at FROM users WHERE id = ?")?;
    let mut rows = stmt.query(params![id])?;
    if let Some(r) = rows.next()? {
        Ok(Some(User {
            id: r.get(0)?,
            email: r.get(1)?,
            username: r.get(2).ok(),
            nickname: r.get(3)?,
            balance: r.get(4)?,
            role: Role::from_str(&r.get::<_, String>(5)?),
            created_at: r.get(6)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn get_user_by_email(pool: &DbPool, email: &str) -> Result<Option<(User, String)>> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT id, email, username, nickname, balance, role, created_at, password_hash FROM users WHERE email = ?")?;
    let mut rows = stmt.query(params![email])?;
    if let Some(r) = rows.next()? {
        let user = User {
            id: r.get(0)?,
            email: r.get(1)?,
            username: r.get(2).ok(),
            nickname: r.get(3)?,
            balance: r.get(4)?,
            role: Role::from_str(&r.get::<_, String>(5)?),
            created_at: r.get(6)?,
        };
        let hash: String = r.get(7)?;
        Ok(Some((user, hash)))
    } else {
        Ok(None)
    }
}

pub fn get_user_by_username(pool: &DbPool, username: &str) -> Result<Option<User>> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT id, email, username, nickname, balance, role, created_at FROM users WHERE username = ? COLLATE NOCASE")?;
    let mut rows = stmt.query(params![username])?;
    if let Some(r) = rows.next()? {
        Ok(Some(User {
            id: r.get(0)?,
            email: r.get(1)?,
            username: r.get(2).ok(),
            nickname: r.get(3)?,
            balance: r.get(4)?,
            role: Role::from_str(&r.get::<_, String>(5)?),
            created_at: r.get(6)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn set_username(pool: &DbPool, user_id: &str, username: &str) -> Result<User> {
    let conn = pool.get()?;
    // Uniqueness is enforced by the UNIQUE INDEX on users(username)
    conn.execute(
        "UPDATE users SET username = ? WHERE id = ?",
        params![username, user_id],
    )?;
    get_user(pool, user_id)?.ok_or_else(|| anyhow!("user not found"))
}

pub fn list_users(pool: &DbPool) -> Result<Vec<User>> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT id, email, username, nickname, balance, role, created_at FROM users ORDER BY created_at DESC")?;
    let iter = stmt.query_map([], |r| {
        Ok(User {
            id: r.get(0)?,
            email: r.get(1)?,
            username: r.get(2).ok(),
            nickname: r.get(3)?,
            balance: r.get(4)?,
            role: Role::from_str(&r.get::<_, String>(5)?),
            created_at: r.get(6)?,
        })
    })?;
    Ok(iter.filter_map(|r| r.ok()).collect())
}

/// Case-insensitive search by username, nickname, or email prefix.
pub fn search_users(pool: &DbPool, query: &str, limit: i64) -> Result<Vec<User>> {
    let conn = pool.get()?;
    let pat = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT id, email, username, nickname, balance, role, created_at
         FROM users
         WHERE username LIKE ? COLLATE NOCASE
            OR nickname LIKE ? COLLATE NOCASE
            OR email    LIKE ? COLLATE NOCASE
         ORDER BY
            CASE WHEN username LIKE ? COLLATE NOCASE THEN 0 ELSE 1 END,
            username, nickname
         LIMIT ?",
    )?;
    let iter = stmt.query_map(params![pat, pat, pat, pat, limit], |r| {
        Ok(User {
            id: r.get(0)?,
            email: r.get(1)?,
            username: r.get(2).ok(),
            nickname: r.get(3)?,
            balance: r.get(4)?,
            role: Role::from_str(&r.get::<_, String>(5)?),
            created_at: r.get(6)?,
        })
    })?;
    Ok(iter.filter_map(|r| r.ok()).collect())
}

pub fn top_up(pool: &DbPool, user_id: &str, amount: i64) -> Result<User> {
    let conn = pool.get()?;
    conn.execute("UPDATE users SET balance = balance + ? WHERE id = ?", params![amount, user_id])?;
    get_user(pool, user_id)?.ok_or_else(|| anyhow!("user not found"))
}

pub fn set_role(pool: &DbPool, user_id: &str, role: Role) -> Result<User> {
    let conn = pool.get()?;
    conn.execute("UPDATE users SET role = ? WHERE id = ?", params![role.as_str(), user_id])?;
    get_user(pool, user_id)?.ok_or_else(|| anyhow!("user not found"))
}

// --- Verification codes -------------------------------------------------

pub fn put_code(pool: &DbPool, email: &str, code: &str) -> Result<()> {
    let conn = pool.get()?;
    conn.execute(
        "INSERT INTO codes (email, code, created_at, consumed) VALUES (?, ?, ?, 0)",
        params![email, code, Utc::now().timestamp()],
    )?;
    Ok(())
}

pub fn verify_code(pool: &DbPool, email: &str, code: &str) -> Result<bool> {
    let conn = pool.get()?;
    // codes expire after 10 minutes
    let cutoff = Utc::now().timestamp() - 600;
    let id: Option<i64> = conn
        .query_row(
            "SELECT id FROM codes WHERE email = ? AND code = ? AND consumed = 0 AND created_at > ? ORDER BY id DESC LIMIT 1",
            params![email, code, cutoff],
            |r| r.get(0),
        )
        .ok();
    if let Some(id) = id {
        conn.execute("UPDATE codes SET consumed = 1 WHERE id = ?", params![id])?;
        Ok(true)
    } else {
        Ok(false)
    }
}

// --- Chats --------------------------------------------------------------

pub fn list_chats_for(pool: &DbPool, user_id: &str) -> Result<Vec<Chat>> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT c.id, c.title, c.owner_id, c.is_dm, c.created_at, c.last_message_at
         FROM chats c
         JOIN chat_members m ON m.chat_id = c.id
         WHERE m.user_id = ?
         ORDER BY c.last_message_at DESC",
    )?;
    let iter = stmt.query_map(params![user_id], |r| {
        Ok(Chat {
            id: r.get(0)?,
            title: r.get(1)?,
            owner_id: r.get(2)?,
            is_dm: r.get::<_, i64>(3)? != 0,
            created_at: r.get(4)?,
            last_message_at: r.get(5)?,
            peer: None,
        })
    })?;
    let mut chats: Vec<Chat> = iter.filter_map(|r| r.ok()).collect();

    // For DMs, attach the "other" user as peer for nice UI rendering.
    for c in chats.iter_mut().filter(|c| c.is_dm) {
        let other: Option<String> = conn
            .query_row(
                "SELECT user_id FROM chat_members WHERE chat_id = ? AND user_id <> ? LIMIT 1",
                params![c.id, user_id],
                |r| r.get(0),
            )
            .ok();
        if let Some(oid) = other {
            if let Ok(Some(u)) = get_user(pool, &oid) {
                c.title = u.nickname.clone();
                c.peer = Some(u);
            }
        }
    }
    Ok(chats)
}

pub fn is_member(pool: &DbPool, chat_id: &str, user_id: &str) -> Result<bool> {
    let conn = pool.get()?;
    let n: i64 = conn.query_row(
        "SELECT COUNT(*) FROM chat_members WHERE chat_id = ? AND user_id = ?",
        params![chat_id, user_id],
        |r| r.get(0),
    )?;
    Ok(n > 0)
}

pub fn create_group_chat(pool: &DbPool, owner_id: &str, title: &str) -> Result<Chat> {
    let conn = pool.get()?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO chats (id, title, owner_id, is_dm, created_at, last_message_at) VALUES (?, ?, ?, 0, ?, ?)",
        params![id, title, owner_id, now, now],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO chat_members (chat_id, user_id) VALUES (?, ?)",
        params![id, owner_id],
    )?;
    Ok(Chat {
        id,
        title: title.into(),
        owner_id: owner_id.into(),
        is_dm: false,
        created_at: now,
        last_message_at: now,
        peer: None,
    })
}

/// Gets the DM chat between two users, creating it if missing.
pub fn get_or_create_dm(pool: &DbPool, a: &str, b: &str) -> Result<Chat> {
    let conn = pool.get()?;
    // Find an existing DM chat where both users are members.
    let existing: Option<String> = conn
        .query_row(
            "SELECT c.id FROM chats c
             JOIN chat_members ma ON ma.chat_id = c.id AND ma.user_id = ?
             JOIN chat_members mb ON mb.chat_id = c.id AND mb.user_id = ?
             WHERE c.is_dm = 1
             LIMIT 1",
            params![a, b],
            |r| r.get(0),
        )
        .ok();

    if let Some(id) = existing {
        let mut stmt = conn.prepare(
            "SELECT id, title, owner_id, is_dm, created_at, last_message_at FROM chats WHERE id = ?",
        )?;
        let row = stmt.query_row(params![id], |r| {
            Ok(Chat {
                id: r.get(0)?,
                title: r.get(1)?,
                owner_id: r.get(2)?,
                is_dm: r.get::<_, i64>(3)? != 0,
                created_at: r.get(4)?,
                last_message_at: r.get(5)?,
                peer: None,
            })
        })?;
        return Ok(row);
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO chats (id, title, owner_id, is_dm, created_at, last_message_at) VALUES (?, '', ?, 1, ?, ?)",
        params![id, a, now, now],
    )?;
    conn.execute("INSERT OR IGNORE INTO chat_members (chat_id, user_id) VALUES (?, ?)", params![id, a])?;
    conn.execute("INSERT OR IGNORE INTO chat_members (chat_id, user_id) VALUES (?, ?)", params![id, b])?;

    Ok(Chat {
        id,
        title: String::new(),
        owner_id: a.into(),
        is_dm: true,
        created_at: now,
        last_message_at: now,
        peer: None,
    })
}

// --- Messages -----------------------------------------------------------

pub fn list_messages(pool: &DbPool, chat_id: &str, limit: i64) -> Result<Vec<Message>> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT id, chat_id, author_id, author_nickname, text, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC LIMIT ?",
    )?;
    let iter = stmt.query_map(params![chat_id, limit], |r| {
        Ok(Message {
            id: r.get(0)?,
            chat_id: r.get(1)?,
            author_id: r.get(2)?,
            author_nickname: r.get(3)?,
            text: r.get(4)?,
            created_at: r.get(5)?,
        })
    })?;
    Ok(iter.filter_map(|r| r.ok()).collect())
}

pub fn insert_message(
    pool: &DbPool,
    chat_id: &str,
    author_id: &str,
    author_nickname: &str,
    text: &str,
) -> Result<Message> {
    let conn = pool.get()?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO messages (id, chat_id, author_id, author_nickname, text, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        params![id, chat_id, author_id, author_nickname, text, now],
    )?;
    conn.execute(
        "UPDATE chats SET last_message_at = ? WHERE id = ?",
        params![now, chat_id],
    )?;
    Ok(Message {
        id,
        chat_id: chat_id.into(),
        author_id: author_id.into(),
        author_nickname: author_nickname.into(),
        text: text.into(),
        created_at: now,
    })
}

// --- Complaints ---------------------------------------------------------

pub fn list_complaints(pool: &DbPool) -> Result<Vec<Complaint>> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT id, from_user_id, from_nickname, target, reason, status, created_at FROM complaints ORDER BY created_at DESC")?;
    let iter = stmt.query_map([], |r| {
        Ok(Complaint {
            id: r.get(0)?,
            from_user_id: r.get(1)?,
            from_nickname: r.get(2)?,
            target: r.get(3)?,
            reason: r.get(4)?,
            status: r.get(5)?,
            created_at: r.get(6)?,
        })
    })?;
    Ok(iter.filter_map(|r| r.ok()).collect())
}

pub fn create_complaint(
    pool: &DbPool,
    from_user_id: &str,
    from_nickname: &str,
    target: &str,
    reason: &str,
) -> Result<Complaint> {
    let conn = pool.get()?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO complaints (id, from_user_id, from_nickname, target, reason, status, created_at) VALUES (?, ?, ?, ?, ?, 'open', ?)",
        params![id, from_user_id, from_nickname, target, reason, now],
    )?;
    Ok(Complaint {
        id,
        from_user_id: from_user_id.into(),
        from_nickname: from_nickname.into(),
        target: target.into(),
        reason: reason.into(),
        status: "open".into(),
        created_at: now,
    })
}

pub fn resolve_complaint(pool: &DbPool, id: &str) -> Result<bool> {
    let conn = pool.get()?;
    let n = conn.execute("UPDATE complaints SET status = 'resolved' WHERE id = ?", params![id])?;
    Ok(n > 0)
}
