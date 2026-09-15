-- 0002_add_is_archived_to_events.sql
-- Add is_archived column to events table for soft deletes

ALTER TABLE public.events ADD COLUMN is_archived BOOLEAN DEFAULT false;
