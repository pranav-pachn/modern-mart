import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit, requireAdmin } from '@/lib/api-guard';
import { NextResponse } from 'next/server';

// Mock NextAuth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/lib/auth';

describe('api-guard', () => {
  describe('rateLimit', () => {
    it('should allow requests under the limit', () => {
      const req = new Request('http://localhost');
      req.headers.set('x-forwarded-for', '192.168.1.1');

      // First request
      let res = rateLimit(req, { limit: 2, windowMs: 1000 });
      expect(res).toBeNull(); // null means allowed

      // Second request
      res = rateLimit(req, { limit: 2, windowMs: 1000 });
      expect(res).toBeNull();
    });

    it('should block requests over the limit and return 429', async () => {
      const req = new Request('http://localhost');
      req.headers.set('x-forwarded-for', '10.0.0.1');

      rateLimit(req, { limit: 1, windowMs: 1000 });
      const res = rateLimit(req, { limit: 1, windowMs: 1000 }); // Exceeds limit

      expect(res).toBeInstanceOf(NextResponse);
      expect(res?.status).toBe(429);
      
      const body = await res?.json();
      expect(body.error).toMatch(/too many requests/i);
    });
  });

  describe('requireAdmin', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return 401 if no session is present', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);
      
      const res = await requireAdmin();
      expect(res?.status).toBe(401);
    });

    it('should return 403 if user is not an admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: '1', role: 'customer' },
        expires: '123'
      } as any);
      
      const res = await requireAdmin();
      expect(res?.status).toBe(403);
    });

    it('should return null (allow access) if user is admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: '1', role: 'admin' },
        expires: '123'
      } as any);
      
      const res = await requireAdmin();
      expect(res).toBeNull();
    });
  });
});
