use serde::{Deserialize, Serialize};

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

impl Role {
    pub fn as_str(self) -> &'static str {
        match self {
            Role::User => "user",
            Role::Helper => "helper",
            Role::Supporter => "supporter",
            Role::Creator => "creator",
            Role::Admin => "admin",
            Role::Owner => "owner",
            Role::Title => "title",
        }
    }
    pub fn from_str(s: &str) -> Role {
        match s {
            "helper" => Role::Helper,
            "supporter" => Role::Supporter,
            "creator" => Role::Creator,
            "admin" => Role::Admin,
            "owner" => Role::Owner,
            "title" => Role::Title,
            _ => Role::User,
        }
    }
    pub fn is_staff(self) -> bool {
        matches!(
            self,
            Role::Helper | Role::Supporter | Role::Creator | Role::Admin | Role::Owner | Role::Title
        )
    }
    pub fn can_assign_roles(self) -> bool {
        matches!(self, Role::Admin | Role::Owner | Role::Title)
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct User {
    pub id: String,
    pub email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    pub nickname: String,
    pub balance: i64,
    pub role: Role,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Chat {
    pub id: String,
    pub title: String,
    pub owner_id: String,
    pub is_dm: bool,
    pub created_at: i64,
    pub last_message_at: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer: Option<User>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Message {
    pub id: String,
    pub chat_id: String,
    pub author_id: String,
    pub author_nickname: String,
    pub text: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Complaint {
    pub id: String,
    pub from_user_id: String,
    pub from_nickname: String,
    pub target: String,
    pub reason: String,
    pub status: String,
    pub created_at: i64,
}

// --- Request bodies -----------------------------------------------------

#[derive(Deserialize)]
pub struct RegisterReq {
    pub email: String,
    pub nickname: String,
    pub password: String,
    pub password2: String,
    pub code: String,
}

#[derive(Deserialize)]
pub struct LoginReq {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct SendCodeReq {
    pub email: String,
}

#[derive(Deserialize)]
pub struct TopUpReq {
    pub amount: i64,
}

#[derive(Deserialize)]
pub struct SendMessageReq {
    pub chat_id: String,
    pub text: String,
}

#[derive(Deserialize)]
pub struct CreateChatReq {
    pub title: String,
}

#[derive(Deserialize)]
pub struct OpenDmReq {
    pub username: String,
}

#[derive(Deserialize)]
pub struct SetUsernameReq {
    pub username: String,
}

#[derive(Deserialize)]
pub struct CreateComplaintReq {
    pub target: String,
    pub reason: String,
}

#[derive(Deserialize)]
pub struct AssignRoleReq {
    pub user_id: String,
    pub role: Role,
}

// --- Response bodies ----------------------------------------------------

#[derive(Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: User,
}

#[derive(Serialize)]
pub struct SendCodeResponse {
    pub ok: bool,
    /// Present only in dev / non-production runs so the client can show the code
    /// during local testing. In real deployments this should be delivered by
    /// email, SMS, or another channel; set `SEND_CODE_EXPOSE=false` to hide it.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dev_code: Option<String>,
}
