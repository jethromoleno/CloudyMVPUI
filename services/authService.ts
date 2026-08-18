import type { SystemUser } from '../types';
import { developmentDataAdapter } from './apiService';
import type {
  AuthCredentials,
  AuthService,
  AuthSnapshot,
  DevelopmentIdentitySummary,
  RequestOptions,
} from './contracts';
import { ServiceError } from './contracts';

type AuthListener = (snapshot: AuthSnapshot) => void;

abstract class MemoryAuthAdapter implements AuthService {
  abstract readonly adapterKind: AuthService['adapterKind'];
  abstract readonly reviewIdentities: readonly DevelopmentIdentitySummary[];

  protected snapshot: AuthSnapshot = {
    status: 'unauthenticated',
    user: null,
    error: null,
  };

  private readonly listeners = new Set<AuthListener>();

  getSnapshot = (): AuthSnapshot => this.snapshot;

  subscribe = (listener: AuthListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  protected publish(next: AuthSnapshot) {
    this.snapshot = next;
    this.listeners.forEach((listener) => listener(next));
  }

  abstract signIn(credentials: AuthCredentials): Promise<SystemUser>;
  abstract refresh(options?: RequestOptions): Promise<SystemUser>;

  signOut = async (): Promise<void> => {
    this.publish({ status: 'unauthenticated', user: null, error: null });
  };

  invalidateUser = async (userId: string, reason: string): Promise<void> => {
    if (this.snapshot.user?.id !== userId) return;
    const error = new ServiceError({
      status: 401,
      code: 'SESSION_INVALIDATED',
      message: reason,
      kind: 'authentication',
    });
    this.publish({ status: 'inactive', user: null, error });
  };
}

const digest = async (value: string): Promise<string> => {
  const bytes = new TextEncoder().encode(value);
  const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

// Development review credentials are represented only as one-way digests. The
// adapter is selected only by Vite's DEV branch and is not production auth.
const DEVELOPMENT_CREDENTIAL_DIGESTS: Readonly<Record<string, string>> = Object.freeze({
  SuperAdmin: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  CebuAdmin: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  CebuDispatch: '693c10e4281fc0e6c4ac168f177078c815c2e7198f9eb1a1c01d31e7c17b7820',
  CebuEncoder: '6bb563de3349c24bb63d6465df4f24c49e4fe46b2e82948f46b79e31f15335c7',
  CebuViewer: '65375049b9e4d7cad6c9ba286fdeb9394b28135a3e84136404cfccfdcc438894',
  InactiveViewer: '65375049b9e4d7cad6c9ba286fdeb9394b28135a3e84136404cfccfdcc438894',
});

const DEVELOPMENT_REVIEW_IDENTITIES: readonly DevelopmentIdentitySummary[] = Object.freeze([
  { username: 'SuperAdmin', role: 'SuperAdmin' },
  { username: 'CebuAdmin', role: 'Admin' },
  { username: 'CebuDispatch', role: 'Dispatcher' },
  { username: 'CebuEncoder', role: 'Encoder' },
  { username: 'CebuViewer', role: 'Viewer' },
  { username: 'InactiveViewer', role: 'Viewer', active: false },
]);

class DevelopmentAuthAdapter extends MemoryAuthAdapter {
  readonly adapterKind = 'development' as const;
  readonly reviewIdentities = DEVELOPMENT_REVIEW_IDENTITIES;

  signIn = async ({ username, password }: AuthCredentials): Promise<SystemUser> => {
    this.publish({ status: 'authenticating', user: null, error: null });

    const expectedDigest = DEVELOPMENT_CREDENTIAL_DIGESTS[username];
    const suppliedDigest = await digest(password);
    const users = await developmentDataAdapter.getUsers();
    const user = users.find((candidate) => candidate.username === username);

    if (!user || !expectedDigest || suppliedDigest !== expectedDigest) {
      const error = new ServiceError({
        status: 401,
        code: 'AUTHENTICATION_FAILED',
        message: 'Sign-in failed. Check your credentials and try again.',
        kind: 'authentication',
        errors: { credentials: ['The supplied development credentials were not accepted.'] },
      });
      this.publish({ status: 'unauthenticated', user: null, error });
      throw error;
    }

    if (!user.is_active) {
      const error = new ServiceError({
        status: 403,
        code: 'USER_INACTIVE',
        message: 'This account is inactive. Contact an administrator.',
        kind: 'authorization',
      });
      this.publish({ status: 'inactive', user: null, error });
      throw error;
    }

    this.publish({ status: 'authenticated', user, error: null });
    return user;
  };

  refresh = async (options?: RequestOptions): Promise<SystemUser> => {
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const currentUser = this.snapshot.user;
    if (!currentUser) {
      const error = new ServiceError({
        status: 401,
        code: 'SESSION_EXPIRED',
        message: 'Your in-memory session has expired. Sign in again.',
        kind: 'authentication',
      });
      this.publish({ status: 'expired', user: null, error });
      throw error;
    }

    this.publish({ status: 'refreshing', user: currentUser, error: null });
    await Promise.resolve();
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const persistedUser = (await developmentDataAdapter.getUsers()).find((user) => user.id === currentUser.id);
    if (!persistedUser || !persistedUser.is_active) {
      const error = new ServiceError({
        status: 401,
        code: 'SESSION_INVALIDATED',
        message: 'This account is no longer active. Sign in again after an administrator reactivates it.',
        kind: 'authentication',
      });
      this.publish({ status: 'inactive', user: null, error });
      throw error;
    }
    this.publish({ status: 'authenticated', user: persistedUser, error: null });
    return persistedUser;
  };
}

class UnconfiguredProductionAuthAdapter extends MemoryAuthAdapter {
  readonly adapterKind = 'unconfigured-production' as const;
  readonly reviewIdentities: readonly DevelopmentIdentitySummary[] = [];

  private failClosed(): never {
    const error = new ServiceError({
      status: 503,
      code: 'AUTH_NOT_CONFIGURED',
      message:
        'Production authentication is not configured. Live Supabase integration requires separate authorization.',
      kind: 'unavailable',
      retryable: false,
    });
    this.publish({ status: 'denied', user: null, error });
    throw error;
  }

  signIn = async (_credentials: AuthCredentials): Promise<SystemUser> => this.failClosed();
  refresh = async (_options?: RequestOptions): Promise<SystemUser> => this.failClosed();
}

export const authService: AuthService = import.meta.env.DEV
  ? new DevelopmentAuthAdapter()
  : new UnconfiguredProductionAuthAdapter();
