-- Spatial types and functions (geography, ST_DWithin, ST_Distance).
CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
-- Trigram indexes for fuzzy place and town search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
