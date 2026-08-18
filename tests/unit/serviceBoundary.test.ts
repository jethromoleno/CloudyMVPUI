import { ServiceError, normalizeServiceError, services } from '../../services';

const developmentPassword = (...parts: string[]) => parts.join('');

describe('Phase 1B service and auth boundaries', () => {
  afterEach(async () => {
    await services.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('keeps the development session in memory and credentials out of domain users', async () => {
    const statuses: string[] = [];
    const unsubscribe = services.auth.subscribe((snapshot) => statuses.push(snapshot.status));

    const user = await services.auth.signIn({
      username: 'SuperAdmin',
      password: developmentPassword('admin', '123'),
    });
    await services.auth.refresh();
    unsubscribe();

    expect(services.auth.adapterKind).toBe('development');
    expect(user).not.toHaveProperty('password');
    expect(statuses).toEqual(['authenticating', 'authenticated', 'refreshing', 'authenticated']);
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  it('normalizes invalid auth and unexpected failures without sensitive details', async () => {
    await expect(
      services.auth.signIn({ username: 'SuperAdmin', password: developmentPassword('not', '-accepted') }),
    ).rejects.toMatchObject({ status: 401, code: 'AUTHENTICATION_FAILED', kind: 'authentication' });

    expect(normalizeServiceError(new Error('internal detail'))).toMatchObject({
      code: 'UNEXPECTED_ERROR',
      kind: 'unexpected',
      retryable: true,
    });
  });

  it('implements bounded page, limit, ordering, refresh metadata, and cancellation contracts', async () => {
    const firstPage = await services.trips.list({ page: 1, limit: 2, ordering: 'pickup_date' });
    expect(firstPage).toMatchObject({ page: 1, limit: 2, next: 2, previous: null });
    expect(firstPage.results).toHaveLength(2);
    expect(firstPage.count).toBeGreaterThan(2);
    expect(firstPage.refreshedAt).toBeTruthy();

    await expect(services.trips.list({ ordering: 'unsupported_field' as never })).rejects.toBeInstanceOf(ServiceError);

    const controller = new AbortController();
    controller.abort();
    await expect(services.workspace.loadSnapshot({ signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('returns normalized not-found errors for unavailable trip identifiers', async () => {
    await expect(services.trips.getById('missing-trip')).rejects.toMatchObject({
      status: 404,
      code: 'TRIP_NOT_FOUND',
      kind: 'not_found',
    });
  });
});
