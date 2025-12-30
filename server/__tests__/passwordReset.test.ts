import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock storage before importing the app
vi.mock('../storage', () => {
  const getUserByUsername = vi.fn();
  const getUser = vi.fn();
  const createUser = vi.fn();
  const setPasswordResetToken = vi.fn();
  const getUserByPasswordResetToken = vi.fn();
  const updateUserPassword = vi.fn();
  const sessionStore = {
    get: (sid: any, cb: any) => cb(null, undefined),
    set: (sid: any, sess: any, cb: any) => cb && cb(null),
    destroy: (sid: any, cb: any) => cb && cb(null),
  };

  return {
    storage: {
      getUserByUsername,
      getUser,
      createUser,
      setPasswordResetToken,
      getUserByPasswordResetToken,
      updateUserPassword,
      sessionStore,
    },
  };
});

vi.mock('nodemailer', () => ({ createTransport: () => ({ sendMail: async () => {} }) }));

import { createApp } from '../index';
import { storage } from '../storage';

describe('Password reset flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('request endpoint responds 200 and sets token when user exists', async () => {
    (storage as any).getUserByUsername.mockResolvedValue({ id: 1, username: 'bob', email: 'bob@example.com' });
    (storage as any).setPasswordResetToken.mockResolvedValue({});

    const { app } = await createApp({ setupVite: false });
    const res = await request(app).post('/api/password-reset/request').send({ username: 'bob' });

    expect(res.status).toBe(200);
    expect((storage as any).setPasswordResetToken).toHaveBeenCalled();
  });

  it('confirm endpoint updates password and logs in', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 30);
    (storage as any).getUserByPasswordResetToken.mockResolvedValue({ id: 2, username: 'alice', email: 'a@e.com', passwordResetExpires: future });
    (storage as any).updateUserPassword.mockResolvedValue({ id: 2, username: 'alice', email: 'a@e.com' });

    const { app } = await createApp({ setupVite: false });
    const res = await request(app).post('/api/password-reset/confirm').send({ token: 'tok', newPassword: 'newpass123' });

    expect(res.status).toBe(200);
    expect((storage as any).updateUserPassword).toHaveBeenCalled();
    expect(res.body).toHaveProperty('message', 'Password updated');
  });
});
