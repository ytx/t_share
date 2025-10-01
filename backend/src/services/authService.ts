import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import prisma from '../config/database';

export interface AuthResult {
  user: {
    id: number;
    email: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    isAdmin: boolean;
    approvalStatus: string;
  };
  token: string;
}

export interface RegisterData {
  email: string;
  username?: string;
  displayName?: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface GoogleUserData {
  googleId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

class AuthService {
  private normalizeUser(user: { id: number; email: string; username?: string | null; displayName?: string | null; avatarUrl?: string | null; isAdmin: boolean; approvalStatus: string }): { id: number; email: string; username?: string; displayName?: string; avatarUrl?: string; isAdmin: boolean; approvalStatus: string } {
    return {
      id: user.id,
      email: user.email,
      username: user.username ?? undefined,
      displayName: user.displayName ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      isAdmin: user.isAdmin,
      approvalStatus: user.approvalStatus,
    };
  }

  private generateToken(userId: number): string {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn } as jwt.SignOptions);
  }

  async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Check if username is taken (if provided)
      if (data.username) {
        const existingUsername = await prisma.user.findFirst({
          where: { username: data.username },
        });

        if (existingUsername) {
          throw new Error('Username is already taken');
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          displayName: data.displayName || data.username || data.email.split('@')[0],
          passwordHash,
          isAdmin: false,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          isAdmin: true,
          approvalStatus: true,
        },
      });

      // Create default preferences
      await prisma.userPreference.create({
        data: {
          userId: user.id,
          theme: 'light',
          editorKeybinding: 'default',
          editorShowLineNumbers: true,
          editorWordWrap: true,
          editorShowWhitespace: false,
          panelSplitRatio: 0.5,
        },
      });

      // Generate token
      const token = this.generateToken(user.id);

      logger.info(`User registered successfully: ${user.email}`);

      return { user: this.normalizeUser(user), token };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthResult> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          isAdmin: true,
          approvalStatus: true,
          passwordHash: true,
        },
      });

      if (!user || !user.passwordHash) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = this.generateToken(user.id);

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;

      logger.info(`User logged in successfully: ${user.email}`);

      return { user: this.normalizeUser(userWithoutPassword), token };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  async googleAuth(data: GoogleUserData): Promise<AuthResult> {
    try {
      let user = await prisma.user.findUnique({
        where: { googleId: data.googleId },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isAdmin: true,
          approvalStatus: true,
        },
      });

      if (!user) {
        // Check if user exists with same email
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser) {
          // Link Google account to existing user
          user = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              googleId: data.googleId,
              avatarUrl: data.avatarUrl,
            },
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isAdmin: true,
              approvalStatus: true,
            },
          });
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email: data.email,
              googleId: data.googleId,
              displayName: data.displayName || data.email.split('@')[0],
              avatarUrl: data.avatarUrl,
              isAdmin: false,
            },
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isAdmin: true,
              approvalStatus: true,
            },
          });

          // Create default preferences for new user
          await prisma.userPreference.create({
            data: {
              userId: user.id,
              theme: 'light',
              editorKeybinding: 'default',
              editorShowLineNumbers: true,
              editorWordWrap: true,
              editorShowWhitespace: false,
              panelSplitRatio: 0.5,
            },
          });
        }
      }

      // Generate token
      const token = this.generateToken(user.id);

      logger.info(`Google auth successful: ${user.email}`);

      return { user: this.normalizeUser(user), token };
    } catch (error) {
      logger.error('Google auth failed:', error);
      throw error;
    }
  }

  async getUserById(id: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isAdmin: true,
          approvalStatus: true,
          createdAt: true,
        },
      });

      return user;
    } catch (error) {
      logger.error('Get user by ID failed:', error);
      throw error;
    }
  }

  async updateUser(id: number, data: Partial<{ username: string; displayName: string }>) {
    try {
      // Check if username is taken (if being updated)
      if (data.username) {
        const existingUsername = await prisma.user.findFirst({
          where: {
            username: data.username,
            NOT: { id },
          },
        });

        if (existingUsername) {
          throw new Error('Username is already taken');
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          isAdmin: true,
          approvalStatus: true,
        },
      });

      logger.info(`User updated successfully: ${user.email}`);

      return user;
    } catch (error) {
      logger.error('Update user failed:', error);
      throw error;
    }
  }
}

export default new AuthService();