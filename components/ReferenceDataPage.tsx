import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, RefreshCw } from 'lucide-react';
import { permissionActions, permissionResources, usePermissions } from '../permissions';
import { normalizeServiceError, services, type ReferenceDataKind, type ReferenceDataSnapshot } from '../services';
import { uiClasses } from '../design/tokens';
import { Button, FormField, Modal, SearchInput, StatusBadge } from './ui';

const tabs: Array<{ id: ReferenceDataKind; label: string }> = [
  { id: 'CLIENT', label: 'Clients' },
  { id: 'CONSIGNEE', label: 'Consignees' },
  { id: 'LOCATION', label: 'Locations' },
  { id: 'INTERNAL_CLIENT_CODE', label: 'Internal Codes' },
  { id: 'LOAD_TYPE', label: 'Load Types' },
];

const initialSnapshot: ReferenceDataSnapshot = {
  clients: [],
  consignees: [],
  locations: [],
  internalClientCodes: [],
  loadTypes: [],
  source: 'development-mock',
};

type FormState = Record<string, string>;

const labelFor = (kind: ReferenceDataKind) => tabs.find((item) => item.id === kind)?.label ?? kind;

export const ReferenceDataPage: React.FC = () => {
  const permissions = usePermissions();
  const canManage = permissions.can(permissionActions.manage, permissionResources.referenceData);
  const [snapshot, setSnapshot] = useState<ReferenceDataSnapshot>(initialSnapshot);
  const [activeTab, setActiveTab] = useState<ReferenceDataKind>('CLIENT');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await services.referenceData.list());
    } catch (cause) {
      setError(normalizeServiceError(cause).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const clientName = (id: string) =>
    snapshot.clients.find((client) => client.id === id)?.client_name ?? 'Unknown client';
  const rows = useMemo(() => {
    const match = (value: string) => value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    if (activeTab === 'CLIENT')
      return snapshot.clients.filter((row) => match(`${row.client_code} ${row.client_name} ${row.full_name}`));
    if (activeTab === 'CONSIGNEE')
      return snapshot.consignees.filter((row) => match(`${row.full_name} ${clientName(row.client_id)} ${row.address}`));
    if (activeTab === 'LOCATION')
      return snapshot.locations.filter((row) =>
        match(`${row.location_name} ${row.location_type} ${row.province} ${row.region}`),
      );
    if (activeTab === 'INTERNAL_CLIENT_CODE')
      return snapshot.internalClientCodes.filter((row) =>
        match(`${row.code} ${row.description} ${clientName(row.client_id)}`),
      );
    return snapshot.loadTypes.filter((row) => match(`${row.load_type_code} ${row.label} ${row.description}`));
  }, [activeTab, query, snapshot]);

  const openCreate = () => {
    setEditingId(null);
    setForm(
      activeTab === 'CLIENT'
        ? { clientCode: '', clientName: '', fullName: '', address: '' }
        : activeTab === 'CONSIGNEE'
          ? {
              clientId: snapshot.clients.find((item) => item.is_active)?.id ?? '',
              fullName: '',
              contactNo: '',
              address: '',
              cityArea: '',
            }
          : activeTab === 'LOCATION'
            ? {
                locationName: '',
                locationType: 'Warehouse',
                province: '',
                region: '',
                addressLine1: '',
                latitude: '0',
                longitude: '0',
              }
            : { clientId: snapshot.clients.find((item) => item.is_active)?.id ?? '', code: '', description: '' },
    );
  };

  const openEdit = (row: any) => {
    setEditingId(row.id);
    if (activeTab === 'CLIENT')
      setForm({
        clientCode: row.client_code ?? '',
        clientName: row.client_name,
        fullName: row.full_name ?? '',
        address: row.address ?? '',
      });
    if (activeTab === 'CONSIGNEE')
      setForm({
        clientId: row.client_id,
        fullName: row.full_name,
        contactNo: row.contact_no ?? '',
        address: row.address ?? '',
        cityArea: row.city_area ?? '',
      });
    if (activeTab === 'LOCATION')
      setForm({
        locationName: row.location_name,
        locationType: row.location_type,
        province: row.province ?? '',
        region: row.region ?? '',
        addressLine1: row.address_line_1 ?? '',
        latitude: String(row.latitude),
        longitude: String(row.longitude),
      });
    if (activeTab === 'INTERNAL_CLIENT_CODE')
      setForm({ clientId: row.client_id, code: row.code, description: row.description ?? '' });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form || !canManage) return;
    setSaving(true);
    setError(null);
    try {
      if (activeTab === 'CLIENT') {
        if (editingId) await services.referenceData.updateClient(editingId, form);
        else await services.referenceData.createClient(form);
      } else if (activeTab === 'CONSIGNEE') {
        if (editingId) await services.referenceData.updateConsignee(editingId, form);
        else await services.referenceData.createConsignee(form);
      } else if (activeTab === 'LOCATION') {
        const payload = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) };
        if (editingId) await services.referenceData.updateLocation(editingId, payload);
        else await services.referenceData.createLocation(payload);
      } else if (activeTab === 'INTERNAL_CLIENT_CODE') {
        if (editingId) await services.referenceData.updateInternalClientCode(editingId, form);
        else await services.referenceData.createInternalClientCode(form);
      }
      setForm(null);
      await refresh();
    } catch (cause) {
      setError(normalizeServiceError(cause).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: any) => {
    if (!canManage) return;
    try {
      if (activeTab === 'CLIENT') await services.referenceData.setClientActive(row.id, !row.is_active);
      if (activeTab === 'CONSIGNEE') await services.referenceData.setConsigneeActive(row.id, !row.is_active);
      if (activeTab === 'LOCATION') await services.referenceData.setLocationActive(row.id, !row.is_active);
      await refresh();
    } catch (cause) {
      setError(normalizeServiceError(cause).message);
    }
  };

  const field = (name: string, label: string, type = 'text', required = false) => (
    <FormField key={name} label={label} required={required}>
      <input
        type={type}
        value={form?.[name] ?? ''}
        onChange={(event) => setForm((value) => ({ ...value!, [name]: event.target.value }))}
        className={`${uiClasses.field} min-h-11`}
      />
    </FormField>
  );
  const clientSelect = () => (
    <FormField label="Client" required>
      <select
        value={form?.clientId ?? ''}
        onChange={(event) => setForm((value) => ({ ...value!, clientId: event.target.value }))}
        className={`${uiClasses.field} min-h-11`}
      >
        <option value="">Select a client</option>
        {snapshot.clients
          .filter((client) => client.is_active || client.id === form?.clientId)
          .map((client) => (
            <option key={client.id} value={client.id}>
              {client.client_name}
              {client.is_active ? '' : ' (inactive)'}
            </option>
          ))}
      </select>
    </FormField>
  );

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8" aria-labelledby="reference-data-title">
      <header className="flex flex-col gap-4 rounded-xl border border-navy-100 bg-white p-5 shadow-sm dark:border-carbon-800 dark:bg-carbon-950 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-navy-500 dark:text-carbon-300">
            Trip scheduling
          </p>
          <h1 id="reference-data-title" className="mt-1 text-2xl font-bold text-navy-900 dark:text-white">
            Customer & Reference Data
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-navy-600 dark:text-carbon-400">
            Manage trip lookup records. Inactive values stay legible here but are excluded from new operational
            selectors.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="min-h-11"
            icon={<RefreshCw aria-hidden="true" className="h-4 w-4" />}
            onClick={() => void refresh()}
            variant="secondary"
          >
            Refresh
          </Button>
          {canManage && activeTab !== 'LOAD_TYPE' && (
            <Button className="min-h-11" icon={<Plus aria-hidden="true" className="h-4 w-4" />} onClick={openCreate}>
              Add {labelFor(activeTab).slice(0, -1)}
            </Button>
          )}
        </div>
      </header>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
        Development adapter only — this surface does not provide production persistence, authorization, concurrency, or
        audit guarantees.
      </div>
      <div
        className="flex gap-2 overflow-x-auto border-b border-navy-200 dark:border-carbon-800"
        role="tablist"
        aria-label="Reference data categories"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setQuery('');
              setForm(null);
            }}
            className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-semibold ${activeTab === tab.id ? 'border-navy-900 text-navy-900 dark:border-white dark:text-white' : 'border-transparent text-navy-500 dark:text-carbon-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <label className="sr-only" htmlFor="reference-search">
          Search {labelFor(activeTab)}
        </label>
        <div className="w-full max-w-md">
          <SearchInput
            className="min-h-11"
            id="reference-search"
            onChange={setQuery}
            placeholder={`Search ${labelFor(activeTab).toLowerCase()}...`}
            value={query}
          />
        </div>
        <span className="text-sm text-navy-500 dark:text-carbon-300">
          {rows.length} record{rows.length === 1 ? '' : 's'}
        </span>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200"
        >
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white dark:border-carbon-800 dark:bg-carbon-950">
        {loading ? (
          <p className="p-6 text-sm text-navy-500 dark:text-carbon-300">Loading reference data…</p>
        ) : (
          <div className="divide-y divide-navy-100 dark:divide-carbon-800">
            {rows.map((row: any) => (
              <article key={row.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-semibold text-navy-900 dark:text-white">
                    {activeTab === 'CLIENT'
                      ? row.client_name
                      : activeTab === 'CONSIGNEE'
                        ? row.full_name
                        : activeTab === 'LOCATION'
                          ? row.location_name
                          : activeTab === 'INTERNAL_CLIENT_CODE'
                            ? row.code
                            : row.label}
                  </h2>
                  <p className="mt-1 text-sm text-navy-600 dark:text-carbon-400">
                    {activeTab === 'CLIENT'
                      ? `${row.client_code ?? 'No code'} · ${row.address ?? 'No address'}`
                      : activeTab === 'CONSIGNEE'
                        ? `${clientName(row.client_id)} · ${row.address ?? 'No address'}`
                        : activeTab === 'LOCATION'
                          ? `${row.location_type} · ${row.province ?? 'No province'} · ${row.region ?? 'No region'}`
                          : activeTab === 'INTERNAL_CLIENT_CODE'
                            ? `${clientName(row.client_id)} · ${row.description ?? 'No description'}`
                            : `${row.load_type_code} · ${row.description ?? 'No description'}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {activeTab !== 'LOAD_TYPE' && 'is_active' in row && (
                    <StatusBadge hideCue status={row.is_active ? 'ACTIVE' : 'INACTIVE'} />
                  )}
                  {canManage && activeTab !== 'LOAD_TYPE' && (
                    <>
                      <Button
                        className="min-h-11"
                        icon={<Edit2 aria-hidden="true" className="h-4 w-4" />}
                        onClick={() => openEdit(row)}
                        variant="secondary"
                      >
                        Edit
                      </Button>
                      {'is_active' in row && (
                        <Button
                          className="min-h-11"
                          onClick={() => void toggleActive(row)}
                          variant={row.is_active ? 'danger' : 'success'}
                        >
                          {row.is_active ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </article>
            ))}
            {rows.length === 0 && (
              <p className="p-6 text-sm text-navy-500 dark:text-carbon-300">
                No matching {labelFor(activeTab).toLowerCase()}.
              </p>
            )}
          </div>
        )}
      </div>
      <Modal
        description="Required fields are validated before the development adapter is called."
        onClose={() => setForm(null)}
        open={Boolean(form)}
        size="lg"
        title={`${editingId ? 'Edit' : 'Add'} ${labelFor(activeTab).slice(0, -1)}`}
      >
        <form onSubmit={(event) => void save(event)}>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeTab === 'CLIENT' && (
              <>
                {field('clientCode', 'Client code', 'text', true)}
                {field('clientName', 'Client name', 'text', true)}
                {field('fullName', 'Full legal name')}
                {field('address', 'Address')}
              </>
            )}
            {activeTab === 'CONSIGNEE' && (
              <>
                {clientSelect()}
                {field('fullName', 'Consignee name', 'text', true)}
                {field('contactNo', 'Contact number')}
                {field('cityArea', 'City / area')}
                {field('address', 'Address')}
              </>
            )}
            {activeTab === 'LOCATION' && (
              <>
                {field('locationName', 'Location name', 'text', true)}
                {field('locationType', 'Location type', 'text', true)}
                {field('province', 'Province')}
                {field('region', 'Region')}
                {field('addressLine1', 'Address')}
                {field('latitude', 'Latitude', 'number', true)}
                {field('longitude', 'Longitude', 'number', true)}
              </>
            )}
            {activeTab === 'INTERNAL_CLIENT_CODE' && (
              <>
                {clientSelect()}
                {field('code', 'Internal client code', 'text', true)}
                {field('description', 'Description')}
              </>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-2 border-t border-navy-100 pt-4 dark:border-carbon-800">
            <Button className="min-h-11" onClick={() => setForm(null)} variant="secondary">
              Cancel
            </Button>
            <Button className="min-h-11" isLoading={saving} type="submit">
              {saving ? 'Saving…' : 'Save reference data'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
