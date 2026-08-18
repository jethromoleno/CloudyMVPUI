import type { Client, Consignee, InternalClientCode, Location } from '../types';
import type { DataService } from './apiService';
import {
  ServiceError,
  type ClientMutationInput,
  type ConsigneeMutationInput,
  type InternalClientCodeMutationInput,
  type LocationMutationInput,
  type ReferenceDataService,
} from './contracts';

const fail = (code: string, message: string) => {
  throw new ServiceError({ status: 400, code, message, kind: 'validation' });
};

const required = (value: string | undefined, code: string, label: string) => {
  if (!value?.trim()) fail(code, `${label} is required.`);
  return value.trim();
};

const normalized = (value: string) => value.trim().toLocaleUpperCase();

const clientPayload = (input: ClientMutationInput) => ({
  client_code: normalized(required(input.clientCode, 'CLIENT_CODE_REQUIRED', 'Client code')),
  client_name: required(input.clientName, 'CLIENT_NAME_REQUIRED', 'Client name'),
  full_name: input.fullName?.trim() || undefined,
  address: input.address?.trim() || undefined,
});

const consigneePayload = (input: ConsigneeMutationInput) => ({
  client_id: required(input.clientId, 'CLIENT_REQUIRED', 'Client'),
  full_name: required(input.fullName, 'CONSIGNEE_NAME_REQUIRED', 'Consignee name'),
  contact_no: input.contactNo?.trim() || undefined,
  address: input.address?.trim() || undefined,
  city_area: input.cityArea?.trim() || undefined,
});

const locationPayload = (input: LocationMutationInput) => {
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
    fail('LOCATION_LATITUDE_INVALID', 'Latitude must be between -90 and 90.');
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
    fail('LOCATION_LONGITUDE_INVALID', 'Longitude must be between -180 and 180.');
  return {
    location_name: required(input.locationName, 'LOCATION_NAME_REQUIRED', 'Location name'),
    location_type: required(input.locationType, 'LOCATION_TYPE_REQUIRED', 'Location type'),
    province: input.province?.trim() || undefined,
    region: input.region?.trim() || undefined,
    address_line_1: input.addressLine1?.trim() || undefined,
    latitude,
    longitude,
  };
};

const codePayload = (input: InternalClientCodeMutationInput) => ({
  client_id: required(input.clientId, 'CLIENT_REQUIRED', 'Client'),
  code: normalized(required(input.code, 'INTERNAL_CLIENT_CODE_REQUIRED', 'Internal client code')),
  description: input.description?.trim() || undefined,
});

const missing = (code: string, message: string) => {
  throw new ServiceError({ status: 404, code, message, kind: 'not_found' });
};

export const createDevelopmentReferenceDataService = (data: DataService): ReferenceDataService => {
  const clients = () => data.getCustomers();
  const clientById = async (id: string) => {
    const client = (await clients()).find((item) => item.id === id);
    if (!client) missing('CLIENT_NOT_FOUND', 'Client not found.');
    return client as Client;
  };
  const ensureUniqueClient = async (input: ClientMutationInput, ignoredId?: string) => {
    const payload = clientPayload(input);
    const duplicate = (await clients()).find(
      (item) =>
        item.id !== ignoredId &&
        (normalized(item.client_code ?? '') === payload.client_code ||
          normalized(item.client_name) === normalized(payload.client_name)),
    );
    if (duplicate) fail('CLIENT_DUPLICATE', 'Client code and client name must be unique.');
    return payload;
  };
  const ensureClientExists = async (clientId: string) => {
    await clientById(clientId);
  };

  return {
    list: async () => {
      const [allClients, consignees, locations, internalClientCodes, loadTypes] = await Promise.all([
        clients(),
        data.getConsignees(undefined, { includeInactive: true }),
        data.getReferenceLocations(),
        data.getInternalClientCodes(),
        data.getLoadTypes(),
      ]);
      return {
        clients: allClients,
        consignees,
        locations,
        internalClientCodes,
        loadTypes,
        source: 'development-mock',
      };
    },
    createClient: async (input) => data.createClient(await ensureUniqueClient(input)),
    updateClient: async (clientId, input) => {
      await clientById(clientId);
      return data.updateClient(clientId, await ensureUniqueClient(input, clientId));
    },
    setClientActive: async (clientId, active) => {
      await clientById(clientId);
      return data.updateClient(clientId, { is_active: active });
    },
    createConsignee: async (input) => {
      const payload = consigneePayload(input);
      await ensureClientExists(payload.client_id);
      return data.createConsignee(payload);
    },
    updateConsignee: async (consigneeId, input) => {
      const existing = (await data.getConsignees(undefined, { includeInactive: true })).find(
        (item) => item.id === consigneeId,
      );
      if (!existing) missing('CONSIGNEE_NOT_FOUND', 'Consignee not found.');
      const payload = consigneePayload(input);
      await ensureClientExists(payload.client_id);
      return data.updateConsignee(consigneeId, payload);
    },
    setConsigneeActive: async (consigneeId, active) => {
      const existing = (await data.getConsignees(undefined, { includeInactive: true })).find(
        (item) => item.id === consigneeId,
      );
      if (!existing) missing('CONSIGNEE_NOT_FOUND', 'Consignee not found.');
      return data.updateConsignee(consigneeId, { is_active: active });
    },
    createLocation: async (input) => {
      const payload = locationPayload(input);
      const duplicate = (await data.getReferenceLocations()).some(
        (item) => normalized(item.location_name) === normalized(payload.location_name),
      );
      if (duplicate) fail('LOCATION_DUPLICATE', 'Location name must be unique.');
      return data.createLocation(payload);
    },
    updateLocation: async (locationId, input) => {
      const existing = (await data.getReferenceLocations()).find((item) => item.id === locationId);
      if (!existing) missing('LOCATION_NOT_FOUND', 'Location not found.');
      const payload = locationPayload(input);
      const duplicate = (await data.getReferenceLocations()).some(
        (item) => item.id !== locationId && normalized(item.location_name) === normalized(payload.location_name),
      );
      if (duplicate) fail('LOCATION_DUPLICATE', 'Location name must be unique.');
      return data.updateLocation(locationId, payload);
    },
    setLocationActive: async (locationId, active) => {
      const existing = (await data.getReferenceLocations()).find((item) => item.id === locationId);
      if (!existing) missing('LOCATION_NOT_FOUND', 'Location not found.');
      return data.updateLocation(locationId, { is_active: active });
    },
    createInternalClientCode: async (input) => {
      const payload = codePayload(input);
      await ensureClientExists(payload.client_id);
      const duplicate = (await data.getInternalClientCodes()).some((item) => normalized(item.code) === payload.code);
      if (duplicate) fail('INTERNAL_CLIENT_CODE_DUPLICATE', 'Internal client code must be unique.');
      return data.createInternalClientCode(payload);
    },
    updateInternalClientCode: async (codeId, input) => {
      const existing = (await data.getInternalClientCodes()).find((item) => item.id === codeId);
      if (!existing) missing('INTERNAL_CLIENT_CODE_NOT_FOUND', 'Internal client code not found.');
      const payload = codePayload(input);
      await ensureClientExists(payload.client_id);
      const duplicate = (await data.getInternalClientCodes()).some(
        (item) => item.id !== codeId && normalized(item.code) === payload.code,
      );
      if (duplicate) fail('INTERNAL_CLIENT_CODE_DUPLICATE', 'Internal client code must be unique.');
      return data.updateInternalClientCode(codeId, payload);
    },
  };
};
