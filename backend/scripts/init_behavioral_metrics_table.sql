-- backend/scripts/init_behavioral_metrics_table.sql

CREATE TABLE IF NOT EXISTS user_behavioral_metrics (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    time_of_day_success JSONB,
    procrastination_index FLOAT,
    category_affinity JSONB,
    archetype VARCHAR(50),
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
