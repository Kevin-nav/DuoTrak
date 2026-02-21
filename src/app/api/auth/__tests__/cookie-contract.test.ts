import { getSessionCookieName } from '@/lib/auth';

test('auth cookie contract uses __session consistently', async () => {
  const cookieName = getSessionCookieName();
  expect(cookieName).toBe('__session');
});
