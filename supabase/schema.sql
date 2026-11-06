-- ==============================================================================
-- Tesla Browser Maps - Supabase Database Schema
-- ცხრილები, უსაფრთხოების წესები (RLS) და ინდექსები
-- ==============================================================================

-- 1. ავტომატური განახლების ტრიგერის ფუნქცია (updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 2. შენახული მისამართების ცხრილი (Saved Places)
-- ინახავს მომხმარებლის სახლის, სამსახურის და რჩეულ ლოკაციებს
CREATE TABLE IF NOT EXISTS public.saved_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                                 -- მაგ. "სახლი", "ოფისი", "Gym"
    category TEXT NOT NULL CHECK (category IN ('home', 'work', 'favorite', 'recent')),
    address TEXT NOT NULL,                              -- ადამიანისთვის წაკითხვადი მისამართი
    lat DOUBLE PRECISION NOT NULL,                     -- გრძედი
    lng DOUBLE PRECISION NOT NULL,                     -- განედი
    place_id TEXT,                                      -- Google Places ID სწრაფი ძიებისთვის
    icon TEXT DEFAULT 'map-pin',                        -- UI აიქონის იდენტიფიკატორი
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ინდექსები სწრაფი ძიებისთვის
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON public.saved_places(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_category ON public.saved_places(user_id, category);

-- 4. ტრიგერი updated_at სვეტის ავტომატური განახლებისთვის
CREATE OR REPLACE TRIGGER update_saved_places_modtime
    BEFORE UPDATE ON public.saved_places
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security (RLS) გააქტიურება
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

-- 6. უსაფრთხოების წესები (Policies) - მომხმარებელს აქვს წვდომა მხოლოდ თავის მონაცემებზე
-- წაკითხვა (SELECT)
CREATE POLICY "მომხმარებელს შეუძლია მხოლოდ საკუთარი მისამართების ნახვა"
    ON public.saved_places
    FOR SELECT
    USING (auth.uid() = user_id);

-- დამატება (INSERT)
CREATE POLICY "მომხმარებელს შეუძლია საკუთარი მისამართების დამატება"
    ON public.saved_places
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- რედაქტირება (UPDATE)
CREATE POLICY "მომხმარებელს შეუძლია საკუთარი მისამართების რედაქტირება"
    ON public.saved_places
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- წაშლა (DELETE)
CREATE POLICY "მომხმარებელს შეუძლია საკუთარი მისამართების წაშლა"
    ON public.saved_places
    FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- (სურვილისამებრ) ბოლო მარშრუტების ისტორიის ცხრილი (Recent Routes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recent_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    origin_name TEXT NOT NULL,
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lng DOUBLE PRECISION NOT NULL,
    destination_name TEXT NOT NULL,
    destination_lat DOUBLE PRECISION NOT NULL,
    destination_lng DOUBLE PRECISION NOT NULL,
    waypoints JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recent_routes_user_id ON public.recent_routes(user_id, created_at DESC);

ALTER TABLE public.recent_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "მომხმარებელს შეუძლია საკუთარი მარშრუტების ნახვა"
    ON public.recent_routes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "მომხმარებელს შეუძლია საკუთარი მარშრუტების შენახვა"
    ON public.recent_routes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "მომხმარებელს შეუძლია საკუთარი მარშრუტების წაშლა"
    ON public.recent_routes FOR DELETE
    USING (auth.uid() = user_id);
