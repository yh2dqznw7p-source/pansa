use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    User,
    Helper,
    Supporter,
    Creator,
    Admin,
    Owner,
    Title,
}

impl fmt::Display for Role {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Role::User => "user",
            Role::Helper => "helper",
            Role::Supporter => "supporter",
            Role::Creator => "creator",
            Role::Admin => "admin",
            Role::Owner => "owner",
            Role::Title => "title",
        };
        write!(f, "{}", s)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub nickname: String,
    pub password_hash: String,
    pub balance: u64,
    pub role: Role,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationCode {
    pub email: String,
    pub code: String,
    pub created_at: i64,
    pub consumed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chat {
    pub id: String,
    pub title: String,
    pub members: Vec<String>,
    pub last_message_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub chat_id: String,
    pub author_id: String,
    pub author_nickname: String,
    pub text: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Complaint {
    pub id: String,
    pub from_user_id: String,
    pub from_nickname: String,
    pub target: String,
    pub reason: String,
    pub status: ComplaintStatus,
    pub created_at: i64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ComplaintStatus {
    Open,
    InProgress,
    Resolved,
    Rejected,
}
