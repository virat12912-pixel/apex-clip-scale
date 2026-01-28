-- Phase 2-4: Part 1 - Add new roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client_viewer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clipper';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin';