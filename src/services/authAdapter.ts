import { AuthSession, UserProfile, UserRole } from '../types/banking';

/**
 * FINORA Authentication Adapter
 *
 * SECURITY ARCHITECTURE NOTE:
 * - Demo mode keeps the active AuthSession strictly in React memory (never persisted to localStorage).
 * - No passwords, PINs, or bearer/JWT tokens are ever saved in localStorage or sessionStorage.
 * - For production deployment, swap the methods below to invoke server-side endpoints
 *   (e.g. POST /api/auth/login returning HttpOnly, Secure, SameSite=Strict session cookies).
 */

export interface AuthCredentialsInput {
  email: string;
  passcode: string;
  requestedRole: UserRole;
}

export interface AuthRegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  passcode: string;
}

export interface AuthAdapterResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

export const authAdapter = {
  /**
   * Simulates entry against the local educational directory.
   * The passcode receives format-only validation; it is not compared with a credential,
   * persisted, or used to establish identity. This is not authentication.
   */
  async signInDemo(
    input: AuthCredentialsInput,
    users: UserProfile[],
  ): Promise<AuthAdapterResult> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const emailNormalized = input.email.trim().toLowerCase();
    if (!emailNormalized || !emailNormalized.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!input.passcode || input.passcode.length < 6) {
      return {
        success: false,
        error: 'Demo entry code must be at least 6 characters.',
      };
    }

    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === emailNormalized && u.role === input.requestedRole,
    );

    if (!matchedUser) {
      return {
        success: false,
        error: `No ${input.requestedRole === UserRole.ADMIN ? 'administrator' : 'customer'} profile matches "${input.email}". Use a quick-access demo profile below or create a simulated customer.`,
      };
    }

    return {
      success: true,
      session: {
        userId: matchedUser.id,
        role: matchedUser.role,
        authMode: 'DEMO_SANDBOX',
        authenticatedAt: new Date().toISOString(),
      },
    };
  },

  /**
   * One-click role switch / quick entry for educational demonstration.
   */
  createQuickDemoSession(user: UserProfile): AuthSession {
    return {
      userId: user.id,
      role: user.role,
      authMode: 'DEMO_SANDBOX',
      authenticatedAt: new Date().toISOString(),
    };
  },

  /**
   * Production integration contract blueprint (unused in local sandbox).
   * Ready to wire to an Express/OAuth2/OIDC backend without touching UI components.
   */
  async signInProduction(_endpoint: string, _credentials: AuthCredentialsInput): Promise<AuthAdapterResult> {
    return {
      success: false,
      error: 'Production authentication endpoint is disabled in educational sandbox mode.',
    };
  },
};
