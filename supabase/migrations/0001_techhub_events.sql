-- 0001_techhub_events.sql
-- Create events table for the Tech Hub

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_image TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    venue TEXT NOT NULL,
    registration_link TEXT,
    max_team_size INTEGER,
    tags TEXT[] DEFAULT '{"Robotics", "IoT", "Hackathon", "AI", "UI/UX"}'::TEXT[],
    status TEXT NOT NULL DEFAULT 'pending',
    submitter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 1. Public/Authenticated users can INSERT new events (must force status = 'pending')
CREATE POLICY "Users can insert pending events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
    status = 'pending' AND 
    submitter_id = auth.uid()
);

-- 2. Public/Anyone can SELECT events where status = 'approved'
CREATE POLICY "Anyone can view approved events"
ON public.events
FOR SELECT
TO public
USING (status = 'approved');

-- 3. Users with 'admin' or 'co-admin' roles can SELECT all events
CREATE POLICY "Admins can select all events"
ON public.events
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'co-admin')
    )
);

-- 4. Users with 'admin' or 'co-admin' roles can UPDATE all events
CREATE POLICY "Admins can update all events"
ON public.events
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'co-admin')
    )
);

-- 5. Users with 'admin' or 'co-admin' roles can DELETE all events
CREATE POLICY "Admins can delete all events"
ON public.events
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'co-admin')
    )
);
