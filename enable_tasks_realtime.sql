-- Enable Supabase Realtime on the wardboytasks table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Step 1: Add the wardboytasks table to the Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE wardboytasks;

-- Step 2: Ensure the table has REPLICA IDENTITY set (required for UPDATE/DELETE events)
ALTER TABLE wardboytasks REPLICA IDENTITY FULL;

-- Verify it's enabled:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
