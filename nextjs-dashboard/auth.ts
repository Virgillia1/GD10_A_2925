import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { authConfig } from './auth.config';
import { getSql, hasPostgresUrl } from './app/lib/db';
import type { User } from './app/lib/definitions';
import { users } from './app/lib/placeholder-data';

async function getUser(email: string): Promise<User | undefined> {
  if (!hasPostgresUrl()) {
    return users.find((user) => user.email === email);
  }

  try {
    const sql = getSql();
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    return user[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

async function passwordMatches(password: string, savedPassword: string) {
  if (!savedPassword.startsWith('$2')) {
    return password === savedPassword;
  }

  return bcrypt.compare(password, savedPassword);
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;

          const passwordsMatch = await passwordMatches(password, user.password);

          if (passwordsMatch) return user;
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});
