import { Pool, PoolClient } from "pg";
import { config } from "../config";
import { logger } from "../utils/logger";

let pool: Pool | null = null;
let isConnected = false;
let initPromise: Promise<boolean> | null = null;

export async function getPostgresPool(): Promise<Pool | null> {
  if (!config.databaseUrl) {
    return null;
  }

  if (pool && isConnected) {
    return pool;
  }

  if (initPromise) {
    await initPromise;
    return isConnected ? pool : null;
  }

  initPromise = (async () => {
    try {
      pool = new Pool({
        connectionString: config.databaseUrl,
        ssl:
          config.databaseUrl.includes("sslmode=disable") || config.databaseUrl.includes("localhost")
            ? false
            : { rejectUnauthorized: false },
        max: config.isVercel ? 5 : 20, // Low pool size for serverless
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000,
      });

      pool.on("error", (err) => {
        logger.error("[PostgreSQL Pool Error]:", { details: err.message });
        isConnected = false;
      });

      const client = await pool.connect();
      try {
        await client.query("SELECT 1;");
        isConnected = true;
        logger.info("[Database] Connected successfully to PostgreSQL instance.");
        await runSchemaMigrations(client);
      } finally {
        client.release();
      }
      return true;
    } catch (err: any) {
      logger.warn(`[Database] PostgreSQL connection notice: ${err.message}. Falling back to local storage engine.`);
      isConnected = false;
      return false;
    }
  })();

  await initPromise;
  return isConnected ? pool : null;
}

export function isPostgresActive(): boolean {
  return isConnected;
}

async function runSchemaMigrations(client: PoolClient) {
  try {
    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'user',
        plan VARCHAR(32) NOT NULL DEFAULT 'free',
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        avatar_url TEXT,
        ai_credits_remaining INT NOT NULL DEFAULT 500,
        daily_credits_limit INT NOT NULL DEFAULT 500,
        last_credit_reset_date VARCHAR(32),
        storage_used_mb INT NOT NULL DEFAULT 0,
        storage_limit_mb INT NOT NULL DEFAULT 1000,
        projects_count INT NOT NULL DEFAULT 0,
        is_email_verified BOOLEAN NOT NULL DEFAULT false,
        password_reset_token VARCHAR(255),
        password_reset_expires BIGINT,
        email_verification_token VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // 2. Sessions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_agent TEXT,
        ip_address VARCHAR(64),
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    `);

    // 3. Projects Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        aspect_ratio VARCHAR(32) NOT NULL DEFAULT '16:9',
        resolution VARCHAR(32) NOT NULL DEFAULT '1080p',
        fps INT NOT NULL DEFAULT 30,
        duration NUMERIC NOT NULL DEFAULT 15,
        tracks JSONB NOT NULL DEFAULT '[]',
        thumbnail_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    `);

    // 4. Payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_email VARCHAR(255) NOT NULL,
        plan VARCHAR(64) NOT NULL DEFAULT 'studio_pro',
        amount_pkr NUMERIC NOT NULL DEFAULT 1500,
        tid VARCHAR(64) NOT NULL,
        sender_phone VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        verified_by VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_tid ON payments(tid);
    `);

    // 5. Audit Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        user_id VARCHAR(64),
        user_email VARCHAR(255),
        event_type VARCHAR(64) NOT NULL,
        ip_address VARCHAR(64),
        status VARCHAR(32) NOT NULL,
        details TEXT,
        metadata JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
    `);

    // 6. Password Reset Tokens Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(32) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at BIGINT NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_reset_email ON password_reset_tokens(email);
    `);

    // 7. Email Verification Tokens Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(32) NOT NULL,
        expires_at BIGINT NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. AI Jobs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_jobs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        job_type VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
        progress INT NOT NULL DEFAULT 0,
        prompt TEXT NOT NULL,
        model VARCHAR(64) NOT NULL,
        result_url TEXT,
        error TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_id ON ai_jobs(user_id);
    `);

    logger.info("[Database] PostgreSQL tables and indexes verified successfully.");
  } catch (migErr: any) {
    logger.error("[Database] Migration error:", { details: migErr.message });
  }
}
