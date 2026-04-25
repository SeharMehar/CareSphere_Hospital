-- ======================================================
-- CareSphere: Create WardBoyTasks table + Enable Realtime
-- Run this ONCE in Supabase SQL Editor
-- ======================================================

-- Step 1: Create the table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS WardBoyTasks (
    TaskId SERIAL PRIMARY KEY,
    WardBid INT REFERENCES WardBoy(WardBid),
    AssignedByRole VARCHAR(50),
    AssignedByName VARCHAR(100),
    TaskDescription TEXT NOT NULL,
    Status VARCHAR(50) DEFAULT 'Pending',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Disable RLS so the app can read/write freely
ALTER TABLE WardBoyTasks DISABLE ROW LEVEL SECURITY;

-- Step 3: Enable Realtime (so wardboy dashboard gets instant updates)
ALTER PUBLICATION supabase_realtime ADD TABLE wardboytasks;

-- Step 4: Set REPLICA IDENTITY for UPDATE/DELETE realtime events
ALTER TABLE wardboytasks REPLICA IDENTITY FULL;
