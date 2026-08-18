import { describe, expect, it } from 'vitest';
import { developmentDataAdapter } from '../../services/apiService';
import { createDevelopmentReferenceDataService } from '../../services/referenceData';

describe('Phase 3C reference-data service', () => {
  it('returns each trip lookup category through the typed development boundary', async () => {
    const snapshot = await createDevelopmentReferenceDataService(developmentDataAdapter).list();
    expect(snapshot).toMatchObject({ source: 'development-mock' });
    expect(snapshot.clients.length).toBeGreaterThan(0);
    expect(snapshot.consignees.length).toBeGreaterThan(0);
    expect(snapshot.locations.length).toBeGreaterThan(0);
    expect(snapshot.internalClientCodes.length).toBeGreaterThan(0);
    expect(snapshot.loadTypes.map((item) => item.load_type_code)).toContain('Dry');
  });

  it('validates unique customer and location identity fields', async () => {
    const service = createDevelopmentReferenceDataService(developmentDataAdapter);
    await expect(service.createClient({ clientCode: 'GLO-001', clientName: 'Another Global' })).rejects.toMatchObject({
      code: 'CLIENT_DUPLICATE',
    });
    await expect(
      service.createLocation({ locationName: 'Manila Port', locationType: 'Hub', latitude: 14.6, longitude: 121 }),
    ).rejects.toMatchObject({ code: 'LOCATION_DUPLICATE' });
  });

  it('keeps inactive clients readable but excludes them from operational client lookups', async () => {
    const service = createDevelopmentReferenceDataService(developmentDataAdapter);
    const client = await service.createClient({ clientCode: 'P3C-INACTIVE', clientName: 'Phase 3C Inactive Client' });
    await service.setClientActive(client.id, false);
    const snapshot = await service.list();
    expect(snapshot.clients).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: client.id, is_active: false })]),
    );
    await expect(developmentDataAdapter.getClients()).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: client.id })]),
    );
  });

  it('requires an existing client for client-dependent reference records', async () => {
    const service = createDevelopmentReferenceDataService(developmentDataAdapter);
    await expect(service.createConsignee({ clientId: 'missing', fullName: 'Unknown receiver' })).rejects.toMatchObject({
      code: 'CLIENT_NOT_FOUND',
    });
    await expect(service.createInternalClientCode({ clientId: 'missing', code: 'NO-CLIENT' })).rejects.toMatchObject({
      code: 'CLIENT_NOT_FOUND',
    });
  });
});
