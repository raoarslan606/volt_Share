-- PostGIS Extension + Geospatial Column for Station
-- Run AFTER Prisma initial migration

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add generated geography column for spatial queries
ALTER TABLE "Station"
  ADD COLUMN IF NOT EXISTS geog geography(Point, 4326)
  GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED;

-- 3. Create GIST index for fast nearby search
CREATE INDEX IF NOT EXISTS station_geog_idx ON "Station" USING GIST (geog);
