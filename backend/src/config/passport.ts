import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import logger from '../utils/logger';
import prisma from '../config/database';

// Google OAuth Strategy
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3101/api/auth/google/callback';

if (googleClientId && googleClientSecret) {
  passport.use(new GoogleStrategy({
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: googleCallbackUrl,
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      // Check if this is from an allowed domain/organization
      const email = profile.emails?.[0]?.value;
      if (!email) {
        logger.warn('No email found in Google profile');
        return done(null, false);
      }

      // The actual user creation/linking is handled in the controller
      // Here we just pass the profile data
      return done(null, profile);
    } catch (error) {
      logger.error('Google strategy error:', error);
      return done(error, false);
    }
  }));
} else {
  logger.warn('Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required');
}

// JWT Strategy
const jwtSecret = process.env.JWT_SECRET;

if (jwtSecret) {
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
  }, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          isAdmin: true,
          approvalStatus: true,
        },
      });

      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (error) {
      logger.error('JWT strategy error:', error);
      return done(error, false);
    }
  }));
} else {
  logger.warn('JWT strategy not configured - JWT_SECRET required');
}

// Passport serialization (not used with JWT, but required for Google OAuth)
passport.serializeUser((user: unknown, done) => {
  done(null, user);
});

passport.deserializeUser((user: unknown, done) => {
  done(null, user as any);
});

export default passport;