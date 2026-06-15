-- CreateTable
CREATE TABLE "organizations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "primary_color" TEXT DEFAULT '#2563EB',
    "secondary_color" TEXT DEFAULT '#0F172A',
    "plan_id" INTEGER,
    "subscription_tier" TEXT NOT NULL DEFAULT 'STARTER',
    "billing_cycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "agent_limit" INTEGER NOT NULL DEFAULT 5,
    "manager_limit" INTEGER NOT NULL DEFAULT 1,
    "lead_limit" INTEGER NOT NULL DEFAULT 1000,
    "storage_limit_mb" INTEGER NOT NULL DEFAULT 512,
    "ai_token_limit" INTEGER NOT NULL DEFAULT 10000,
    "call_minutes_limit" INTEGER NOT NULL DEFAULT 100,
    "campaign_limit" INTEGER NOT NULL DEFAULT 5,
    "billing_email" TEXT,
    "billing_address" JSONB,
    "tax_id" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "current_period_start" DATETIME,
    "current_period_end" DATETIME,
    "subscription_expires_at" DATETIME,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ip_whitelist" TEXT,
    "access_approval_required" BOOLEAN NOT NULL DEFAULT false,
    "last_platform_access_at" DATETIME,
    "last_platform_access_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "organizations_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plans" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "description" TEXT,
    "price_monthly" REAL NOT NULL,
    "price_yearly" REAL NOT NULL,
    "user_limit" INTEGER NOT NULL,
    "manager_limit" INTEGER NOT NULL DEFAULT 1,
    "lead_limit" INTEGER NOT NULL,
    "storage_limit_mb" INTEGER NOT NULL DEFAULT 512,
    "ai_token_limit" INTEGER NOT NULL,
    "call_minutes_limit" INTEGER NOT NULL DEFAULT 100,
    "campaign_limit" INTEGER NOT NULL DEFAULT 5,
    "pipeline_limit" INTEGER NOT NULL DEFAULT 3,
    "ai_assistant" BOOLEAN NOT NULL DEFAULT false,
    "ai_lead_scoring" BOOLEAN NOT NULL DEFAULT false,
    "ai_voice_calls" BOOLEAN NOT NULL DEFAULT false,
    "calling_enabled" BOOLEAN NOT NULL DEFAULT false,
    "call_recording" BOOLEAN NOT NULL DEFAULT false,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "monitoring_enabled" BOOLEAN NOT NULL DEFAULT false,
    "automation_enabled" BOOLEAN NOT NULL DEFAULT false,
    "analytics_enabled" BOOLEAN NOT NULL DEFAULT false,
    "advanced_reports" BOOLEAN NOT NULL DEFAULT false,
    "custom_branding" BOOLEAN NOT NULL DEFAULT false,
    "priority_support" BOOLEAN NOT NULL DEFAULT false,
    "api_access" BOOLEAN NOT NULL DEFAULT false,
    "webhooks_enabled" BOOLEAN NOT NULL DEFAULT false,
    "audit_logs_enabled" BOOLEAN NOT NULL DEFAULT false,
    "free_trial_days" INTEGER NOT NULL DEFAULT 0,
    "setup_fee" REAL NOT NULL DEFAULT 0,
    "features" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "platform_invoices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "subtotal" REAL,
    "tax" REAL,
    "discount" REAL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "billing_date" DATETIME NOT NULL,
    "paid_at" DATETIME,
    "period_start" DATETIME,
    "period_end" DATETIME,
    "stripe_invoice_id" TEXT,
    "invoice_url" TEXT,
    "pdf_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "platform_transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "order_id" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "gateway" TEXT,
    "method" TEXT,
    "description" TEXT,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "platform_transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER,
    "user_id" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "profileImage" TEXT,
    "timezone" TEXT DEFAULT 'UTC',
    "themePreference" TEXT DEFAULT 'system',
    "notificationPreference" JSONB,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "organization_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_workspace_id" INTEGER,
    "daily_calls_target" INTEGER NOT NULL DEFAULT 0,
    "monthly_sales_target" INTEGER NOT NULL DEFAULT 0,
    "monthly_followups_target" INTEGER NOT NULL DEFAULT 0,
    "team_id" INTEGER,
    "manager_id" INTEGER,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "agent_type" TEXT DEFAULT 'MANUAL',
    "invite_status" TEXT,
    "onboarding_method" TEXT DEFAULT 'direct',
    "has_logged_in" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_name" TEXT,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_persistent" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" DATETIME NOT NULL,
    "last_used_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teams" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "team_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "manager_id" INTEGER NOT NULL,
    "monthly_lead_target" INTEGER DEFAULT 0,
    "monthly_leads_target" INTEGER DEFAULT 0,
    "monthly_sales_target" INTEGER DEFAULT 0,
    "conversion_target" REAL DEFAULT 0,
    "revenue_goal" REAL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "teams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "teams_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "customer_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "score" INTEGER DEFAULT 0,
    "ai_summary" TEXT,
    "assigned_to" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" DATETIME,
    "priority" TEXT DEFAULT 'Normal',
    "status" TEXT DEFAULT 'PENDING',
    "type" TEXT DEFAULT 'FOLLOWUP',
    "tags" TEXT,
    "notes" TEXT,
    "reminder_time" DATETIME,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_type" TEXT,
    "activity_logs" JSONB,
    "completed_at" DATETIME,
    "assigned_to_id" INTEGER NOT NULL,
    "created_by_id" INTEGER,
    "lead_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calls" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "sid" TEXT,
    "lead_id" INTEGER,
    "agent_id" INTEGER NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ringing',
    "duration" INTEGER NOT NULL DEFAULT 0,
    "recording_url" TEXT,
    "transcript" TEXT,
    "summary" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "disposition" TEXT,
    "sentiment" TEXT DEFAULT 'NEUTRAL',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calls_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "calls_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "calls_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "raised_by_id" INTEGER NOT NULL,
    "client_id" INTEGER,
    "approver_id" INTEGER,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "discount" REAL DEFAULT 0,
    "tax" REAL DEFAULT 0,
    "subtotal" REAL DEFAULT 0,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "due_date" DATETIME,
    "sent_at" DATETIME,
    "viewed_at" DATETIME,
    "paid_at" DATETIME,
    "pdf_url" TEXT,
    "activity_logs" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_raised_by_id_fkey" FOREIGN KEY ("raised_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "invoices_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoice_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "total" REAL NOT NULL,
    CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoice_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "by" TEXT,
    "user_id" INTEGER,
    "message_id" TEXT,
    "error" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_audit_logs_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_delivery_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoice_id" INTEGER NOT NULL,
    "to" TEXT,
    "cc" TEXT,
    "bcc" TEXT,
    "status" TEXT NOT NULL,
    "message_id" TEXT,
    "error" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_delivery_logs_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "organization_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "organization_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "module" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL NOT NULL DEFAULT 0.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_usage_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ai_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "emails" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "lead_id" INTEGER,
    "agent_id" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message_id" TEXT,
    "from" TEXT,
    "to" TEXT,
    "cc" TEXT,
    "bcc" TEXT,
    "folder" TEXT NOT NULL DEFAULT 'INBOX',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "smtp_message_id" TEXT,
    "sent_at" DATETIME,
    "delivered_at" DATETIME,
    "opened_at" DATETIME,
    "failed_at" DATETIME,
    "thread_id" INTEGER,
    CONSTRAINT "emails_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "emails_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "emails_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "emails_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "email_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_threads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "lead_id" INTEGER,
    "subject" TEXT NOT NULL,
    "snippet" TEXT,
    "folder" TEXT NOT NULL DEFAULT 'INBOX',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "urgency" TEXT NOT NULL DEFAULT 'LOW',
    "sentiment" TEXT NOT NULL DEFAULT 'NEUTRAL',
    "summary" TEXT,
    "reply_suggestions" JSONB,
    "last_message_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "assigned_to_id" INTEGER,
    CONSTRAINT "email_threads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "email_threads_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "email_threads_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "smtp_host" TEXT,
    "smtp_port" INTEGER,
    "imap_host" TEXT,
    "imap_port" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "last_synced_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "email_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_attachments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email_id" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_attachments_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "email_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_delivery_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email_id" INTEGER,
    "thread_id" INTEGER,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_delivery_events_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "email_delivery_events_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "email_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "email_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "manager_id" INTEGER,
    "admin_visible" BOOLEAN NOT NULL DEFAULT true,
    "event_type" TEXT NOT NULL,
    "details" JSONB,
    "event_timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "email_audit_logs_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "email_audit_logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "email_audit_logs_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_labels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_labels_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "call_qa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "call_id" INTEGER NOT NULL,
    "manager_id" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "call_qa_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "call_qa_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "call_qa_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "manager_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'COACHING',
    "priority" TEXT DEFAULT 'NORMAL',
    "category" TEXT,
    "qa_score" REAL,
    "sentiment" TEXT,
    "due_date" DATETIME,
    "metadata" JSONB,
    "call_id" INTEGER,
    "acknowledged_at" DATETIME,
    "improvement_status" TEXT DEFAULT 'PENDING',
    "response" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedbacks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "feedbacks_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "feedbacks_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "call_annotations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "call_id" INTEGER NOT NULL,
    "manager_id" INTEGER NOT NULL,
    "timestamp" REAL NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "call_annotations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "call_annotations_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "qa_scores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "call_id" INTEGER NOT NULL,
    "manager_id" INTEGER NOT NULL,
    "greeting" INTEGER NOT NULL DEFAULT 0,
    "discovery" INTEGER NOT NULL DEFAULT 0,
    "pitch" INTEGER NOT NULL DEFAULT 0,
    "objection" INTEGER NOT NULL DEFAULT 0,
    "closing" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qa_scores_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "qa_scores_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invites" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "organization_id" INTEGER NOT NULL,
    "expires_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "actor_id" INTEGER,
    "actor_role" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" INTEGER,
    "old_value" JSONB,
    "new_value" JSONB,
    "team_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "agent_invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "team_id" INTEGER,
    "organization_id" INTEGER NOT NULL,
    "invited_by_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'agent',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" DATETIME NOT NULL,
    "accepted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_invitations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "agent_invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agent_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ThreadLabels" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ThreadLabels_A_fkey" FOREIGN KEY ("A") REFERENCES "email_labels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ThreadLabels_B_fkey" FOREIGN KEY ("B") REFERENCES "email_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "plans_tier_key" ON "plans"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "platform_invoices_invoice_no_key" ON "platform_invoices"("invoice_no");

-- CreateIndex
CREATE UNIQUE INDEX "platform_transactions_transaction_id_key" ON "platform_transactions"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "leads_organization_id_email_key" ON "leads"("organization_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "leads_organization_id_phone_key" ON "leads"("organization_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "calls_sid_key" ON "calls"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_no_key" ON "invoices"("invoice_no");

-- CreateIndex
CREATE UNIQUE INDEX "organization_settings_organization_id_key_key" ON "organization_settings"("organization_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "emails_message_id_key" ON "emails"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_accounts_email_key" ON "email_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "call_qa_call_id_key" ON "call_qa"("call_id");

-- CreateIndex
CREATE UNIQUE INDEX "qa_scores_call_id_key" ON "qa_scores"("call_id");

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invites_email_organization_id_key" ON "invites"("email", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_invitations_token_key" ON "agent_invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "_ThreadLabels_AB_unique" ON "_ThreadLabels"("A", "B");

-- CreateIndex
CREATE INDEX "_ThreadLabels_B_index" ON "_ThreadLabels"("B");
