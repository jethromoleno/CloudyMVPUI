import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Trip, TripStatusType, Employee, Customer, Location, Truck, LoadType, Theme, TripStop } from '../types';
import { 
  Plus, MapPin, User, FileText, Truck as TruckIcon, Settings, X, 
  Calendar as CalendarIcon, List as ListIcon, ChevronLeft, ChevronRight,
  Map as MapIcon, Search, ZoomIn, ZoomOut, Compass, Activity, RotateCcw, Info,
  AlertTriangle, Loader2, Eye, Trash2, Clock, Check, Layers, Fuel, BadgeAlert,
  ArrowUpDown, SlidersHorizontal, ArrowRight, CheckCircle2, ShieldAlert, Edit,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { api } from '../services/apiService';

interface TripListProps {
  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  employees: Employee[];
  customers: Customer[];
  locations: Location[];
  trucks: Truck[];
  theme: Theme;
  isLoading?: boolean;
  error?: string | null;
  userRole?: string;
  currentView?: string;
  initialEditingId?: string | number | null;
  onClearInitialEditingId?: () => void;
}

// Background geographic shapes representing the structured Philippine islands schematic
const GEOGRAPHY_POLYGONS = [
  // Luzon (North)
  {
    name: "Luzon",
    points: "180,80 230,60 260,70 270,120 250,150 280,180 250,220 220,280 210,260 215,220 185,210 170,180 190,140 160,110",
  },
  // Mindoro
  {
    name: "Mindoro",
    points: "175,250 195,260 190,290 165,285 165,265"
  },
  // Palawan
  {
    name: "Palawan",
    points: "60,350 80,330 145,440 135,465 115,465 50,380"
  },
  // Panay (Visayas)
  {
    name: "Panay",
    points: "250,380 280,370 290,410 260,420"
  },
  // Negros (Visayas)
  {
    name: "Negros",
    points: "290,415 310,405 320,460 295,470 285,440"
  },
  // Cebu (Visayas)
  {
    name: "Cebu",
    points: "320,400 330,400 325,480 315,480"
  },
  // Leyte & Samar (Visayas)
  {
    name: "Samar",
    points: "370,300 410,340 375,390"
  },
  {
    name: "Leyte",
    points: "350,390 380,395 385,440 360,435"
  },
  // Bohol
  {
    name: "Bohol",
    points: "340,450 370,455 355,480"
  },
  // Mindanao (South)
  {
    name: "Mindanao",
    points: "310,540 380,510 430,520 470,555 450,650 400,660 380,620 370,640 340,640 330,580 300,570"
  }
];

// Leaflet and OpenStreetMap Zero-Cost Implementation Setup

const MANILA_CEBU_ROUTE: [number, number][] = [
  [14.5995, 120.9842], // Manila
  [13.7565, 121.0583], // Batangas Port
  [13.15, 121.43],     // Passing south of Calapan/Pinamalayan (maritime)
  [12.40, 122.05],     // Maritime route west of Romblon
  [11.90, 122.95],     // East of Panay / Sibuyan Sea maritime path
  [11.35, 123.60],     // North of Bantayan Island / Visayan Sea
  [10.3157, 123.8854]  // Cebu
];

const CEBU_DAVAO_ROUTE: [number, number][] = [
  [10.3157, 123.8854], // Cebu
  [9.85, 124.30],      // East of Bohol / Bohol Strait
  [9.78, 125.50],      // Surigao City
  [8.95, 125.53],      // Butuan / Northern Mindanao
  [8.51, 125.97],      // San Francisco (Agusan del Sur) - AH26
  [8.04, 126.06],      // Trento - AH26
  [7.85, 126.05],      // Nabunturan / Davao de Oro - AH26
  [7.44, 125.80],      // Tagum City - AH26
  [7.0707, 125.6012]   // Davao
];

const DAVAO_MANILA_ROUTE: [number, number][] = [
  [7.0707, 125.6012],  // Davao
  [7.44, 125.80],      // Tagum City
  [8.04, 126.06],      // Trento
  [8.51, 125.97],      // San Francisco
  [8.95, 125.53],      // Butuan (AH26)
  [9.72, 125.46],      // Surigao / Lipata Ferry
  [9.95, 125.26],      // San Ricardo (Southern Leyte)
  [10.16, 125.13],     // Liloan
  [10.38, 124.98],     // Sogod
  [10.73, 125.01],     // Abuyog
  [11.24, 125.00],     // Tacloban
  [11.30, 125.01],     // San Juanico Bridge
  [11.78, 124.88],     // Catbalogan
  [12.07, 124.59],     // Calbayog
  [12.50, 124.28],     // Allen Ferry Terminal
  [12.59, 124.08],     // Matnog Ferry Terminal
  [12.97, 124.01],     // Sorsogon City
  [13.14, 123.68],     // Legazpi / Daraga
  [13.62, 123.19],     // Naga City
  [14.11, 122.95],     // Daet
  [13.96, 122.29],     // Calauag
  [13.91, 122.10],     // Gumaca
  [13.93, 121.61],     // Lucena City
  [14.07, 121.32],     // San Pablo
  [14.21, 121.16],     // Calamba
  [14.5995, 120.9842]  // Manila
];

function getCityKey(loc: Location): 'manila' | 'cebu' | 'davao' | null {
  const name = (loc.name || '').toLowerCase();
  const city = (loc.city || '').toLowerCase();
  if (city.includes('manila') || name.includes('manila')) return 'manila';
  if (city.includes('cebu') || name.includes('cebu')) return 'cebu';
  if (city.includes('davao') || name.includes('davao')) return 'davao';
  return null;
}

function calculateRoutePoints(origin: Location, dest: Location): [number, number][] {
  if (!origin?.latitude || !origin?.longitude || !dest?.latitude || !dest?.longitude) {
    return [];
  }

  const oKey = getCityKey(origin);
  const dKey = getCityKey(dest);

  if (oKey && dKey && oKey !== dKey) {
    let baseRoute: [number, number][] | null = null;
    let originalDirection = true;

    if ((oKey === 'manila' && dKey === 'cebu') || (oKey === 'cebu' && dKey === 'manila')) {
      baseRoute = MANILA_CEBU_ROUTE;
      originalDirection = oKey === 'manila';
    } else if ((oKey === 'cebu' && dKey === 'davao') || (oKey === 'davao' && dKey === 'cebu')) {
      baseRoute = CEBU_DAVAO_ROUTE;
      originalDirection = oKey === 'cebu';
    } else if ((oKey === 'davao' && dKey === 'manila') || (oKey === 'manila' && dKey === 'davao')) {
      baseRoute = DAVAO_MANILA_ROUTE;
      originalDirection = oKey === 'davao';
    }

    if (baseRoute) {
      const points = originalDirection ? [...baseRoute] : [...baseRoute].reverse();
      // Replace boundary elements with the exact markers database positions
      points[0] = [origin.latitude, origin.longitude];
      points[points.length - 1] = [dest.latitude, dest.longitude];
      return points;
    }
  }

  // A-to-B straight route fallback
  return [
    [origin.latitude, origin.longitude],
    [dest.latitude, dest.longitude]
  ];
}

const TripList: React.FC<TripListProps> = ({ 
  trips, setTrips, employees, customers, locations, trucks, theme, isLoading = false, error = null, userRole, currentView, initialEditingId, onClearInitialEditingId
}) => {
  const [branchesState, setBranchesState] = useState<any[]>([]);
  const [consigneesState, setConsigneesState] = useState<any[]>([]);
  const [internalClientCodesState, setInternalClientCodesState] = useState<any[]>([]);
  const [loadTypesState, setLoadTypesState] = useState<any[]>([]);
  const [tripStopsState, setTripStopsState] = useState<any[]>([]);
  const [tripEventsState, setTripEventsState] = useState<any[]>([]);
  const [tripFuelLogsState, setTripFuelLogsState] = useState<any[]>([]);
  const [driversState, setDriversState] = useState<any[]>([]);

  const loadTripResources = async () => {
    try {
      const [br, cons, icc, lt, ts, te, tfl, dr] = await Promise.all([
        api.getBranches(),
        api.getConsignees(),
        api.getInternalClientCodes(),
        api.getLoadTypes(),
        api.getTripStops(),
        api.getTripEvents(),
        api.getFuelLogs(),
        api.getDrivers()
      ]);
      setBranchesState(br);
      setConsigneesState(cons);
      setInternalClientCodesState(icc);
      setLoadTypesState(lt);
      setTripStopsState(ts);
      setTripEventsState(te);
      setTripFuelLogsState(tfl);
      setDriversState(dr);
    } catch (err) {
      console.error('Error loading resources in TripList:', err);
    }
  };

  useEffect(() => {
    loadTripResources();
  }, [trips]);

  const MOCK_BRANCHES = branchesState;
  const MOCK_CONSIGNEES = consigneesState;
  const MOCK_INTERNAL_CLIENT_CODES = internalClientCodesState;
  const MOCK_LOAD_TYPES = loadTypesState;
  const MOCK_TRIP_STOPS = tripStopsState;
  const MOCK_TRIP_EVENTS = tripEventsState;
  const MOCK_TRIP_FUEL_LOGS = tripFuelLogsState;
  const MOCK_DRIVERS = driversState;

  const isSuperAdminOrAdmin = userRole === 'SuperAdmin' || userRole === 'Admin';
  const isEncoder = userRole === 'Encoder';
  
  // Custom View Mode State: default to Calendar View for prominent and beautiful schedule display, or List view if viewing trip management
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'map'>(
    currentView === 'trip-management' ? 'list' : 'calendar'
  );

  const isReadOnly = !isSuperAdminOrAdmin && (!isEncoder || viewMode === 'calendar');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [formStops, setFormStops] = useState<TripStop[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [cancelTripConfirm, setCancelTripConfirm] = useState<{
    trip: Trip;
    onConfirm: () => void;
  } | null>(null);

  // --- Backoffice Listing Filter States ---
  const [listSearch, setListSearch] = useState('');
  const [listStatus, setListStatus] = useState('All');
  const [listStartDate, setListStartDate] = useState('');
  const [listEndDate, setListEndDate] = useState('');
  const [listBranch, setListBranch] = useState('All');
  const [listLoadType, setListLoadType] = useState('All');
  const [listTruck, setListTruck] = useState('All');
  const [listDriver, setListDriver] = useState('All');
  const [listTransferOnly, setListTransferOnly] = useState(false);

  // --- Selected Trip Side Drawer State ---
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'stops' | 'events' | 'fuel'>('overview');

  // --- Entity Mapping Helper Resolvers ---
  const getDriverObject = (driverId?: string) => {
    if (!driverId) return null;
    const profile = MOCK_DRIVERS.find(d => d.id === driverId || d.employee_id === driverId);
    const empId = profile ? profile.employee_id : driverId;
    return employees.find(e => e.id === empId || e.employee_id === empId);
  };

  const getHelperObject = (helperId?: string) => {
    if (!helperId) return null;
    return employees.find(e => e.id === helperId || e.employee_id === helperId);
  };

  const getTruckObject = (truckId?: string | number) => {
    if (!truckId) return null;
    return trucks.find(t => String(t.id) === String(truckId) || String(t.truck_id) === String(truckId));
  };

  const getCustomerObject = (customerId?: string | number) => {
    if (!customerId) return null;
    return customers.find(c => String(c.id) === String(customerId) || String(c.customer_id) === String(customerId));
  };

  const getLocationObject = (locationId?: string | number) => {
    if (!locationId) return null;
    return locations.find(l => String(l.id) === String(locationId) || String(l.location_id) === String(locationId));
  };

  const getAssignmentConflict = (trip: Trip) => {
    if (trip.status === 'Cancelled' || trip.is_deleted) return null;
    const sameDateTrips = trips.filter(t => 
      !t.is_deleted && 
      t.status !== 'Cancelled' && 
      t.id !== trip.id && 
      t.trip_id !== trip.trip_id &&
      t.pickup_date === trip.pickup_date
    );

    const truckConflict = trip.truck_id 
      ? sameDateTrips.find(t => t.truck_id === trip.truck_id) 
      : null;

    const driverConflict = trip.driver_id 
      ? sameDateTrips.find(t => t.driver_id === trip.driver_id) 
      : null;

    if (truckConflict) {
      return {
        type: 'Truck',
        conflictingCode: truckConflict.trip_advise_code || truckConflict.trip_code || 'Another Trip'
      };
    }

    if (driverConflict) {
      return {
        type: 'Driver',
        conflictingCode: driverConflict.trip_advise_code || driverConflict.trip_code || 'Another Trip'
      };
    }

    return null;
  };

  // Sync viewMode on currentView changes
  useEffect(() => {
    setViewMode(currentView === 'trip-management' ? 'list' : 'calendar');
  }, [currentView]);
  
  // Map Interactive zoom and pan states
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 12.8797, lng: 121.7740 });
  const [mapOffset, setMapOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeMapTripId, setActiveMapTripId] = useState<number | null>(null);
  const [mapStatusFilter, setMapStatusFilter] = useState<string>('All');
  const [mapSearch, setMapSearch] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  // Focus and open edit modal for a designated trip ID on demand (e.g. from Dashboard clicks)
  useEffect(() => {
    if (initialEditingId && trips.length > 0) {
      const tripToEdit = trips.find(t => String(t.id) === String(initialEditingId) || String(t.trip_id) === String(initialEditingId));
      if (tripToEdit) {
        handleOpenModal(tripToEdit);
      }
      if (onClearInitialEditingId) {
        onClearInitialEditingId();
      }
    }
  }, [initialEditingId, trips]);

  // Leaflet map container reference and instance storage
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Leaflet map initialization and maintenance
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersGroupRef.current = null;
        polylineRef.current = null;
      }
      return;
    }

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: mapZoom,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      leafletMapRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    const timer = setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersGroupRef.current = null;
        polylineRef.current = null;
      }
    };
  }, [viewMode]);

  // Pan map to mapCenter when it changes
  useEffect(() => {
    if (leafletMapRef.current && viewMode === 'map') {
      leafletMapRef.current.setView([mapCenter.lat, mapCenter.lng], mapZoom);
    }
  }, [mapCenter.lat, mapCenter.lng, mapZoom, viewMode]);

  // Dynamically update Leaflet markers and routes
  useEffect(() => {
    const map = leafletMapRef.current;
    const group = markersGroupRef.current;
    if (!map || !group || viewMode !== 'map') return;

    // Clear previous markers
    group.clearLayers();

    // Clear previous polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // 1. Render hub markers (purple)
    locations.filter(l => l.is_hub).forEach(hub => {
      const hubIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-6 w-6 rounded-full bg-purple-400 opacity-40 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-4.5 w-4.5 bg-purple-600 border border-white shadow-md"></span>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      L.marker([hub.latitude, hub.longitude], { icon: hubIcon })
        .bindPopup(`
          <div class="p-1 text-xs">
            <p class="font-bold text-purple-700">${hub.name}</p>
            <p class="text-gray-500 font-medium">Main Logistics Hub</p>
          </div>
        `)
        .addTo(group);
    });

    // 2. Filter map trips
    const filteredMapTrips = trips.filter(trip => {
      const customer = customers.find(c => c.customer_id === trip.customer_id);
      const dest = locations.find(l => l.location_id === trip.destination_location_id);
      const origin = locations.find(l => l.location_id === trip.origin_location_id);
      
      if (mapStatusFilter !== 'All' && trip.status !== mapStatusFilter) {
        return false;
      }
      
      if (mapSearch) {
        const searchLower = mapSearch.toLowerCase();
        const codeMatch = trip.trip_code.toLowerCase().includes(searchLower);
        const customerMatch = customer?.name.toLowerCase().includes(searchLower) || false;
        const destMatch = dest?.name.toLowerCase().includes(searchLower) || false;
        const originMatch = origin?.name.toLowerCase().includes(searchLower) || false;
        return codeMatch || customerMatch || destMatch || originMatch;
      }
      
      return true;
    });

    // 3. Render destination markers
    filteredMapTrips.forEach(trip => {
      const dest = locations.find(l => l.location_id === trip.destination_location_id);
      if (!dest?.latitude || !dest?.longitude) return;

      let pinColor = '#f59e0b'; // Amber Scheduled
      if (trip.status === 'In Transit') pinColor = '#3b82f6'; // Blue
      if (trip.status === 'Completed') pinColor = '#10b981'; // Emerald
      if (trip.status === 'Cancelled') pinColor = '#ef4444'; // Red

      const isSelected = activeMapTripId === trip.trip_id;
      const sizeClass = isSelected ? 'h-6 w-6 border-2 ring-2 ring-blue-400' : 'h-4 w-4 border-2';
      const pulseAnimation = isSelected ? `<span class="absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-60 animate-pulse"></span>` : '';

      const destIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            ${pulseAnimation}
            <span class="relative inline-flex rounded-full ${sizeClass} shadow-lg" style="background-color: ${pinColor}; border-color: #ffffff;"></span>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: isSelected ? [32, 32] : [24, 24],
        iconAnchor: isSelected ? [16, 16] : [12, 12]
      });

      const customer = customers.find(c => c.customer_id === trip.customer_id);
      const truck = trucks.find(t => t.truck_id === trip.truck_id);
      const driver = employees.find(e => e.employee_id === trip.driver_id);
      const getStatusCSS = (status: string) => {
        if (status === 'Completed') return 'background-color:#d1fae5; color:#065f46; border-color:#a7f3d0;';
        if (status === 'In Transit') return 'background-color:#dbeafe; color:#1e40af; border-color:#bfdbfe;';
        if (status === 'Scheduled') return 'background-color:#fef3c7; color:#92400e; border-color:#fde68a;';
        return 'background-color:#fee2e2; color:#991b1b; border-color:#fca5a5;';
      };

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 11px; line-height: 1.4; color: #1e293b; min-width: 190px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding-bottom: 4px; border-b: 1px solid #e2e8f0;">
            <span style="font-family: monospace; font-weight: 700; color: #1e293b; font-size: 12px;">${trip.trip_code}</span>
            <span style="font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 9999px; font-family: sans-serif; border: 1px solid; ${getStatusCSS(trip.status)}">${trip.status}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 3px;">
            <p style="margin: 0;"><strong>To:</strong> ${dest.name}</p>
            <p style="margin: 0;"><strong>Client:</strong> ${customer?.name || 'N/A'}</p>
            <p style="margin: 0;"><strong>Carrier:</strong> ${truck?.license_plate || 'Unassigned'}</p>
            <p style="margin: 0;"><strong>Driver:</strong> ${driver ? `${driver.first_name} ${driver.last_name}` : 'Unassigned'}</p>
            <p style="margin: 0; font-size: 10px; color: #64748b; margin-top: 2px;">Load: ${trip.load_type} • ${trip.net_weight?.toLocaleString() || 0} kg</p>
          </div>
        </div>
      `;

      const marker = L.marker([dest.latitude, dest.longitude], { icon: destIcon })
        .bindPopup(popupContent, { minWidth: 200 })
        .addTo(group);

      if (isSelected) {
        marker.openPopup();
      }

      marker.on('click', () => {
        setActiveMapTripId(trip.trip_id);
        const origin = locations.find(l => l.location_id === trip.origin_location_id);
        if (origin?.latitude && origin?.longitude && dest.latitude && dest.longitude && map) {
          const routePoints = calculateRoutePoints(origin, dest);
          map.fitBounds(routePoints, { padding: [50, 50] });
          
          const center = map.getCenter();
          const zoom = map.getZoom();
          setMapCenter({ lat: center.lat, lng: center.lng });
          setMapZoom(zoom);
        } else {
          setMapCenter({ lat: dest.latitude, lng: dest.longitude });
        }
      });
    });

    // 4. Render active route line (Origin -> Destination)
    if (activeMapTripId) {
      const activeTrip = trips.find(t => t.trip_id === activeMapTripId);
      if (activeTrip) {
        const origin = locations.find(l => l.location_id === activeTrip.origin_location_id);
        const dest = locations.find(l => l.location_id === activeTrip.destination_location_id);

        if (origin?.latitude && origin?.longitude && dest?.latitude && dest?.longitude) {
          let routeColor = '#3b82f6';
          if (activeTrip.status === 'Completed') routeColor = '#10b981';
          if (activeTrip.status === 'Scheduled') routeColor = '#f59e0b';
          if (activeTrip.status === 'Cancelled') routeColor = '#ef4444';

          const routePoints = calculateRoutePoints(origin, dest);

          const polyline = L.polyline(
            routePoints,
            {
              color: routeColor,
              weight: 4,
              opacity: 0.8,
              dashArray: activeTrip.status === 'Scheduled' ? '5, 8' : undefined
            }
          ).addTo(map);

          polylineRef.current = polyline;
        }
      }
    }
  }, [viewMode, trips, locations, customers, trucks, employees, mapStatusFilter, mapSearch, activeMapTripId]);

  // Map Project coordinate mapping helper
  const projectCoordinates = (lat?: number, lng?: number) => {
    const validLat = lat ?? 14.5995;
    const validLng = lng ?? 120.9842;
    const minLng = 116.5;
    const maxLng = 126.5;
    const minLat = 5.5;
    const maxLat = 19.5;
    
    const x = ((validLng - minLng) / (maxLng - minLng)) * 500;
    const y = (1 - (validLat - minLat) / (maxLat - minLat)) * 700;
    
    return { x, y };
  };

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (trips.length > 0) {
      // Intelligently default to the month of the most recent scheduled trip so the view is seeded with data
      const sorted = [...trips].sort((a, b) => new Date(b.scheduled_start_time).getTime() - new Date(a.scheduled_start_time).getTime());
      const latestDate = new Date(sorted[0].scheduled_start_time);
      if (!isNaN(latestDate.getTime())) {
        return latestDate;
      }
    }
    return new Date();
  });  // Form State
  const initialFormState: Partial<Trip> = {
    trip_advise_code: '',
    trip_code: '',
    branch_id: 'branch-1',
    customer_id: undefined,
    internal_client_code_id: undefined,
    consignee_id: undefined,
    scheduled_start_time: '',
    pickup_date: '',
    pickup_time_window: '08:00 AM - 12:00 PM',
    status: 'Scheduled',
    truck_size: '10-Wheeler Wing',
    truck_id: undefined,
    driver_id: undefined,
    helper1_employee_id: undefined,
    helper2_employee_id: undefined,
    load_type_id: 'load-dry',
    load_type: 'Dry',
    loading_ref_no: '',
    net_weight: 0,
    is_transfer: false,
    transfer_from_id: undefined,
    remarks: ''
  };

  const [formData, setFormData] = useState<Partial<Trip>>(initialFormState);
  const [confirmDeleteStopId, setConfirmDeleteStopId] = useState<string | null>(null);

  const checkAvailability = (pickupDate: string, excludeTripId: string | number | null) => {
    const activeTripsOnDate = trips.filter(t => 
      t.pickup_date === pickupDate &&
      String(t.id || t.trip_id) !== String(excludeTripId) &&
      t.status !== 'Cancelled' &&
      t.status !== 'Completed' &&
      !t.is_deleted
    );

    const busyTrucks = new Set(activeTripsOnDate.map(t => String(t.truck_id)));
    const busyDrivers = new Set(activeTripsOnDate.map(t => String(t.driver_id)));

    const truckToTripMap: Record<string, string> = {};
    const driverToTripMap: Record<string, string> = {};

    activeTripsOnDate.forEach(t => {
      const code = t.trip_advise_code || t.trip_code || String(t.id || t.trip_id);
      if (t.truck_id) {
        truckToTripMap[String(t.truck_id)] = code;
      }
      if (t.driver_id) {
        driverToTripMap[String(t.driver_id)] = code;
      }
    });

    return {
      busyTrucks,
      busyDrivers,
      truckToTripMap,
      driverToTripMap
    };
  };

  const getAvailabilityStatus = () => {
    if (!formData.scheduled_start_time) {
      return { 
        busyTrucks: new Set<string>(), 
        busyDrivers: new Set<string>(), 
        truckToTripMap: {} as Record<string, string>, 
        driverToTripMap: {} as Record<string, string> 
      };
    }
    const dateStr = formData.scheduled_start_time.split('T')[0];
    return checkAvailability(dateStr, editingId);
  };

  const getConflictWarning = () => {
    if (!formData.scheduled_start_time) return null;
    const dateStr = formData.scheduled_start_time.split('T')[0];
    const { busyDrivers, busyTrucks, driverToTripMap, truckToTripMap } = checkAvailability(dateStr, editingId);

    const warnings: string[] = [];
    if (formData.driver_id && busyDrivers.has(String(formData.driver_id))) {
      warnings.push(`Driver is already assigned to active Trip ${driverToTripMap[String(formData.driver_id)]} on ${dateStr}.`);
    }
    if (formData.truck_id && busyTrucks.has(String(formData.truck_id))) {
      warnings.push(`Truck is already assigned to active Trip ${truckToTripMap[String(formData.truck_id)]} on ${dateStr}.`);
    }

    return warnings.length > 0 ? warnings : null;
  };

  const validateForm = (isDraftSave = false) => {
    const errors: Record<string, string> = {};

    // 1. Trip adv code validation
    if (!formData.trip_code?.trim()) {
      errors.trip_code = "Trip advice code is required.";
    } else {
      const codeInput = formData.trip_code.trim().toUpperCase();
      const codeExists = trips.some(t => 
        String(t.id || t.trip_id) !== String(editingId) && 
        (t.trip_advise_code?.toUpperCase() === codeInput || t.trip_code?.toUpperCase() === codeInput)
      );
      if (codeExists) {
        errors.trip_code = "Trip advice code must be unique.";
      }
    }

    // 2. Client is required
    if (!formData.customer_id) {
      errors.customer_id = "Client/Customer is required.";
    }

    // 3. Pickup Date is required
    if (!formData.scheduled_start_time) {
      errors.scheduled_start_time = "Pickup date and time are required.";
    }

    // 4. Net weight cannot be negative
    if (formData.net_weight !== undefined && formData.net_weight < 0) {
      errors.net_weight = "Net weight cannot be negative.";
    }

    // 5. If not Save Draft (standard Schedule Trip), check driver, truck, and stops:
    if (!isDraftSave) {
      if (!formData.truck_id) {
        errors.truck_id = "Truck is required.";
      }
      if (!formData.driver_id) {
        errors.driver_id = "Driver is required.";
      }

      const hasPickup = formStops.some(s => s.stop_type === 'Pickup' && s.location_id);
      const hasDrop = formStops.some(s => (s.stop_type === 'Dropoff' || s.stop_type === 'Drop') && s.location_id);
      if (!hasPickup) {
        errors.stops = "At least one valid Pickup stop is required (with a location selected).";
      }
      if (!hasDrop) {
        errors.stops_drop = "At least one valid Drop/Dropoff stop is required (with a location selected).";
      }

      // Helper validations
      if (formData.helper1_employee_id && String(formData.helper1_employee_id) === String(formData.driver_id)) {
        errors.helper1 = "Helper 1 cannot be the same employee as the driver.";
      }
      if (formData.helper2_employee_id && String(formData.helper2_employee_id) === String(formData.driver_id)) {
        errors.helper2 = "Helper 2 cannot be the same employee as the driver.";
      }
      if (formData.helper1_employee_id && formData.helper2_employee_id && String(formData.helper1_employee_id) === String(formData.helper2_employee_id)) {
        errors.helper2 = "Helper 1 and Helper 2 cannot be the same employee.";
      }

      // Conflict / Double booking validations
      if (formData.scheduled_start_time) {
        const pickupDateInput = formData.scheduled_start_time.split('T')[0];
        const { busyDrivers, busyTrucks, driverToTripMap, truckToTripMap } = checkAvailability(pickupDateInput, editingId);

        if (formData.driver_id && busyDrivers.has(String(formData.driver_id))) {
          const conflictingTrip = driverToTripMap[String(formData.driver_id)];
          errors.driver_id = `Driver is double-booked on this date for trip ${conflictingTrip}.`;
        }
        if (formData.truck_id && busyTrucks.has(String(formData.truck_id))) {
          const conflictingTrip = truckToTripMap[String(formData.truck_id)];
          errors.truck_id = `Truck is double-booked on this date for trip ${conflictingTrip}.`;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (isDraft: boolean = false) => {
    if (!validateForm(isDraft)) {
      return;
    }

    const parentTripCode = formData.trip_code?.trim() || `TRIP-${Math.floor(Math.random() * 1000)}`;
    const inputPickupDate = formData.scheduled_start_time ? formData.scheduled_start_time.split('T')[0] : new Date().toISOString().split('T')[0];

    const targetId = editingId ? String(editingId) : 'trip-' + (Math.floor(Math.random() * 10000) + 1000);

    const updatedTrip: Trip = {
      ...(formData as Trip),
      id: targetId,
      trip_id: targetId,
      trip_advise_code: parentTripCode,
      trip_code: parentTripCode,
      client_id: String(formData.customer_id || ''),
      customer_id: String(formData.customer_id || ''),
      pickup_date: inputPickupDate,
      scheduled_start_time: formData.scheduled_start_time || new Date().toISOString(),
      status: isDraft ? 'Scheduled' : (formData.status || 'Scheduled'),
      is_draft: isDraft,
      
      // Asset allocations
      truck_id: formData.truck_id ? String(formData.truck_id) : undefined,
      driver_id: formData.driver_id ? String(formData.driver_id) : undefined,
      helper1_employee_id: formData.helper1_employee_id ? String(formData.helper1_employee_id) : undefined,
      helper2_employee_id: formData.helper2_employee_id ? String(formData.helper2_employee_id) : undefined,
      
      // Route/Stops locations
      origin_location_id: formStops.find(s => s.stop_type === 'Pickup')?.location_id || formData.origin_location_id,
      destination_location_id: formStops.find(s => (s.stop_type === 'Dropoff' || s.stop_type === 'Drop'))?.location_id || formData.destination_location_id,
      
      updated_at: new Date().toISOString(),
      created_at: editingId ? (formData.created_at || new Date().toISOString()) : new Date().toISOString()
    };

    // Save trip stops in MOCK_TRIP_STOPS via apiService
    await api.saveTripStops(targetId, formStops);

    if (editingId) {
      setTrips(trips.map(t => t.id === targetId || t.trip_id === targetId ? updatedTrip : t));
    } else {
      setTrips([...trips, updatedTrip]);
    }

    setIsModalOpen(false);
    setFormData(initialFormState);
    setFormStops([]);
    setSelectedTripId(targetId);
  };

  const handleOpenModal = (trip?: Trip) => {
    if (trip) {
      setEditingId(trip.trip_id || trip.id);
      const formattedDate = trip.scheduled_start_time
        ? (trip.scheduled_start_time.length > 16 
          ? trip.scheduled_start_time.slice(0, 16) 
          : trip.scheduled_start_time)
        : '';

      setFormData({
        ...trip,
        trip_code: trip.trip_advise_code || trip.trip_code || '',
        customer_id: trip.client_id || trip.customer_id,
        scheduled_start_time: formattedDate,
        is_transfer: trip.is_transfer || false,
        transfer_from_id: trip.transfer_from_id || undefined,
        helper1_employee_id: trip.helper1_employee_id || undefined,
        helper2_employee_id: trip.helper2_employee_id || undefined
      });

      const existingStops = MOCK_TRIP_STOPS.filter(s => s.trip_advise_id === trip.id || s.trip_advise_id === trip.trip_id);
      const sortedStops = [...existingStops].sort((a,b) => a.stop_sequence - b.stop_sequence);
      setFormStops(sortedStops.map(s => ({...s})));
    } else {
      setEditingId(null);
      setFormData({
        ...initialFormState,
        trip_code: `TRIP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      });
      setFormStops([
        {
          id: 'temp-stop-1',
          trip_advise_id: '',
          stop_sequence: 1,
          stop_type: 'Pickup',
          location_id: '',
          specific_address: '',
          city_area: '',
          notes: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'temp-stop-2',
          trip_advise_id: '',
          stop_sequence: 2,
          stop_type: 'Dropoff',
          location_id: '',
          specific_address: '',
          city_area: '',
          notes: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    }
    setIsModalOpen(true);
    setValidationErrors({});
  };

  const handleAddTripForDate = (date: Date) => {
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const localDateTime = `${yearStr}-${monthStr}-${dayStr}T08:00`;
    
    setEditingId(null);
    setFormData({
      ...initialFormState,
      trip_code: `TRIP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      scheduled_start_time: localDateTime
    });
    setFormStops([
      {
        id: 'temp-stop-1',
        trip_advise_id: '',
        stop_sequence: 1,
        stop_type: 'Pickup',
        location_id: '',
        specific_address: '',
        city_area: '',
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'temp-stop-2',
        trip_advise_id: '',
        stop_sequence: 2,
        stop_type: 'Dropoff',
        location_id: '',
        specific_address: '',
        city_area: '',
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);
    setIsModalOpen(true);
    setValidationErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(false);
  };

  const handleAddStop = () => {
    const newStop: TripStop = {
      id: 'temp-' + Math.floor(Math.random() * 1000000),
      trip_advise_id: '',
      stop_sequence: formStops.length + 1,
      stop_type: 'Dropoff',
      location_id: '',
      specific_address: '',
      city_area: '',
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setFormStops([...formStops, newStop]);
  };

  const handleConfirmRemoveStop = (stopId: string) => {
    setConfirmDeleteStopId(stopId);
  };

  const handleExecuteRemoveStop = (stopId: string) => {
    setFormStops(formStops.filter(s => s.id !== stopId));
    setConfirmDeleteStopId(null);
  };

  const handleCancelRemoveStop = () => {
    setConfirmDeleteStopId(null);
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formStops.length - 1) return;

    const updated = [...formStops];
    const swapWithIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = updated[index];
    updated[index] = updated[swapWithIndex];
    updated[swapWithIndex] = temp;

    const sequenced = updated.map((s, idx) => ({
      ...s,
      stop_sequence: idx + 1
    }));

    setFormStops(sequenced);
  };

  const handleStopChange = (stopId: string, field: keyof TripStop, value: any) => {
    setFormStops(formStops.map(s => {
      if (s.id === stopId) {
        return {
          ...s,
          [field]: value,
          updated_at: new Date().toISOString()
        };
      }
      return s;
    }));
  };

  const getStatusColor = (status: TripStatusType) => {
    switch (status) {
      case 'In Transit': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 border-blue-200 dark:border-blue-400/20';
      case 'Completed': return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20';
      case 'Cancelled': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border-red-200 dark:border-red-400/20';
      case 'Scheduled': return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20';
      default: return 'text-navy-600 dark:text-carbon-400 bg-navy-100 dark:bg-carbon-800 border-navy-200 dark:border-carbon-700';
    }
  };  const getTripBadgeStyles = (status: TripStatusType) => {
    switch (status) {
      case 'In Transit': return 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/65 dark:text-blue-300 dark:border-blue-800/50';
      case 'Completed': return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/65 dark:text-emerald-300 dark:border-emerald-800/50';
      case 'Cancelled': return 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/65 dark:text-red-300 dark:border-red-800/50';
      case 'Scheduled': return 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/65 dark:text-amber-300 dark:border-amber-800/50';
      default: return 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-carbon-800/40 dark:hover:bg-carbon-800/80 dark:text-carbon-300 dark:border-carbon-700/50';
    }
  };

  const handleQuickStatusUpdate = (trip: Trip, newStatus: string) => {
    if (trip.status === newStatus) return;
    if (newStatus === 'Cancelled') {
      handleDirectCancelTrip(trip);
      return;
    }
    const updated = trips.map(t => {
      if (t.id === trip.id || t.trip_id === trip.trip_id) {
        return { 
          ...t, 
          status: newStatus as TripStatusType,
          updated_at: new Date().toISOString()
        };
      }
      return t;
    });
    setTrips(updated);
  };

  const handleDirectCancelTrip = (trip: Trip) => {
    setCancelTripConfirm({
      trip,
      onConfirm: () => {
        const updated = trips.map(t => {
          if (t.id === trip.id || t.trip_id === trip.trip_id) {
            return {
              ...t,
              status: 'Cancelled' as TripStatusType,
              updated_at: new Date().toISOString()
            };
          }
          return t;
        });
        setTrips(updated);
        setCancelTripConfirm(null);
      }
    });
  };

  const drivers = employees.filter(e => e.role === 'Driver');

  // Calendar Navigation Handlers
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Monthly Calendar Grid Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday...
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    dayNumber: number;
  }

  const calendarDays: CalendarDay[] = [];

  // Trailing days from the previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayVal = totalDaysInPrevMonth - i;
    calendarDays.push({
      date: new Date(year, month - 1, dayVal),
      isCurrentMonth: false,
      dayNumber: dayVal
    });
  }

  // Days of the current month
  for (let i = 1; i <= totalDaysInMonth; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
      dayNumber: i
    });
  }

  // Leading days of the next month to finish the 7-column grid rows
  const remainingCells = calendarDays.length % 7;
  const daysToAdd = remainingCells === 0 ? 0 : 7 - remainingCells;
  for (let i = 1; i <= daysToAdd; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
      dayNumber: i
    });
  }

  const getTripsForDate = (date: Date) => {
    return trips.filter(trip => {
      const tDate = new Date(trip.scheduled_start_time);
      return tDate.getFullYear() === date.getFullYear() &&
             tDate.getMonth() === date.getMonth() &&
             tDate.getDate() === date.getDate();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const tripsInMonth = trips.filter(trip => {
    const tDate = new Date(trip.scheduled_start_time);
    return tDate.getFullYear() === year && tDate.getMonth() === month;
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="p-8 h-full bg-navy-50 dark:bg-carbon-950 overflow-y-auto relative transition-colors duration-300">
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-carbon-950/70 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-navy-800 dark:text-white" />
            <span className="text-xs font-semibold text-navy-600 dark:text-carbon-400">Loading telemetry registers...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-850 dark:text-red-450 text-sm">System Alert</h4>
            <p className="text-xs text-red-650 dark:text-red-350/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {cancelTripConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded-lg p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2 mb-2 font-sans">
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" /> Confirm Trip Cancellation
            </h3>
            <p className="text-sm text-navy-600 dark:text-carbon-450 mb-6 leading-relaxed">
              Are you sure you want to cancel Trip <strong className="font-mono text-xs bg-navy-50 dark:bg-carbon-800 px-1.5 py-0.5 rounded text-navy-900 dark:text-white font-bold">{cancelTripConfirm.trip.trip_code}</strong>? This action will release assigned drivers and vehicles.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setCancelTripConfirm(null)}
                className="bg-navy-50 hover:bg-navy-100 dark:bg-carbon-800 dark:hover:bg-carbon-700 text-navy-800 dark:text-white px-4 py-2 rounded text-xs font-medium transition-colors"
              >
                No, Keep Trip
              </button>
              <button 
                onClick={() => {
                  cancelTripConfirm.onConfirm();
                  setCancelTripConfirm(null);
                }}
                className="bg-red-600 hover:bg-red-750 text-white px-4 py-2 rounded text-xs font-semibold shadow-md transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white">Trip Schedule</h1>
          <p className="text-navy-600 dark:text-carbon-400 mt-1">Manage dispatching and route logistics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="bg-white dark:bg-carbon-900 p-0.5 rounded-lg border border-navy-100 dark:border-carbon-800 flex shadow-sm">
            {userRole !== 'Viewer' && (
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-navy-900 text-white dark:bg-white dark:text-carbon-950 shadow-sm'
                    : 'text-navy-500 hover:text-navy-900 dark:text-carbon-400 dark:hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Calendar View
              </button>
            )}
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-navy-900 text-white dark:bg-white dark:text-carbon-950 shadow-sm'
                  : 'text-navy-500 hover:text-navy-900 dark:text-carbon-400 dark:hover:text-white'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'map'
                  ? 'bg-navy-900 text-white dark:bg-white dark:text-carbon-950 shadow-sm'
                  : 'text-navy-500 hover:text-navy-900 dark:text-carbon-400 dark:hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Map View
            </button>
          </div>

          {!isReadOnly && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-navy-950 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-navy-100 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> New Trip Advice
            </button>
          )}
        </div>
      </div>

      {viewMode === 'calendar' && (
        <div className="flex flex-col gap-4">
          {/* Calendar Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-carbon-900 p-4 rounded-xl border border-navy-100 dark:border-carbon-800 shadow-sm">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-navy-900 dark:text-white min-w-[140px] select-none">
                {monthNames[month]} {year}
              </h2>
              {tripsInMonth.length > 0 && (
                <span className="bg-navy-50 dark:bg-carbon-800 text-navy-600 dark:text-carbon-300 px-2.5 py-1 rounded-full text-xs font-semibold border border-navy-100 dark:border-carbon-700 select-none">
                  {tripsInMonth.length} {tripsInMonth.length === 1 ? 'Trip' : 'Trips'} Scheduled
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 border border-navy-100 dark:border-carbon-800 bg-white dark:bg-carbon-800 hover:bg-navy-50 dark:hover:bg-carbon-705 text-navy-600 dark:text-carbon-300 rounded-lg transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-2 border border-navy-100 dark:border-carbon-800 bg-white dark:bg-carbon-800 hover:bg-navy-50 dark:hover:bg-carbon-705 text-navy-600 dark:text-carbon-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 border border-navy-100 dark:border-carbon-800 bg-white dark:bg-carbon-800 hover:bg-navy-50 dark:hover:bg-carbon-705 text-navy-600 dark:text-carbon-300 rounded-lg transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Table Grid */}
          <div className="bg-white dark:bg-carbon-900 rounded-xl border border-navy-100 dark:border-carbon-800 overflow-hidden shadow-sm flex flex-col">
            {/* Days of Week Row */}
            <div className="grid grid-cols-7 border-b border-navy-100 dark:border-carbon-800 bg-navy-50 dark:bg-carbon-900 select-none">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayOfWeek) => (
                <div key={dayOfWeek} className="py-2.5 text-center text-xs font-bold text-navy-500 dark:text-carbon-400 uppercase tracking-wider border-r last:border-r-0 border-navy-100 dark:border-carbon-800">
                  {dayOfWeek}
                </div>
              ))}
            </div>

            {/* Monthly Dates Grid */}
            <div className="grid grid-cols-7 auto-rows-[128px] divide-x divide-y divide-navy-100 dark:divide-carbon-800">
              {calendarDays.map((day, idx) => {
                const dayTrips = getTripsForDate(day.date);
                const isSelectedMonth = day.isCurrentMonth;
                const isDayToday = isToday(day.date);

                return (
                  <div
                    key={`${day.date.toISOString()}-${idx}`}
                    className={`relative p-2 flex flex-col group transition-colors overflow-hidden ${
                      isSelectedMonth 
                        ? 'bg-white dark:bg-carbon-900' 
                        : 'bg-navy-50/50 dark:bg-carbon-950/40 text-navy-400 dark:text-carbon-600'
                    } ${
                      isDayToday 
                        ? 'ring-2 ring-inset ring-blue-500/30 bg-blue-50/10 dark:bg-blue-500/5' 
                        : ''
                    } hover:bg-navy-50/30 dark:hover:bg-carbon-800/20`}
                  >
                    {/* Date Cell Header */}
                    <div className="flex items-center justify-between mb-1 select-none">
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full leading-none transition-colors ${
                        isDayToday 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : isSelectedMonth 
                            ? 'text-navy-900 dark:text-white' 
                            : 'text-navy-400 dark:text-carbon-600'
                      }`}>
                        {day.dayNumber}
                      </span>

                      {/* Micro Quick Add Button on Hover */}
                      {!isReadOnly && (
                        <button
                          onClick={() => handleAddTripForDate(day.date)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-navy-100 dark:hover:bg-carbon-800 rounded text-navy-500 dark:text-carbon-400 hover:text-navy-900 dark:hover:text-white"
                          title={`Add Trip on ${day.date.toLocaleDateString()}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Cell Trips list container */}
                    <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-0.5 custom-narrow-scrollbar">
                      {dayTrips.map((trip) => {
                        const dest = locations.find(l => l.location_id === trip.destination_location_id);
                        return (
                          <div
                            key={trip.trip_id}
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid triggering cell click
                              handleOpenModal(trip);
                            }}
                            className={`p-1 text-[10px] rounded border font-medium cursor-pointer transition-all flex flex-col gap-0.5 truncate shadow-sm ${getTripBadgeStyles(trip.status)}`}
                            title={`Trip: ${trip.trip_code}\nTo: ${dest?.name || 'Unknown'}\nStatus: ${trip.status}`}
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span className="font-mono">{trip.trip_code}</span>
                              <span className="text-[8px] opacity-75">{trip.load_type}</span>
                            </div>
                            <div className="truncate text-[9px] opacity-90 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{dest?.name || 'Destination'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Detailed Advanced Filters Panel */}
          <div className="bg-white dark:bg-carbon-900 rounded-xl border border-navy-150 dark:border-carbon-800 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-navy-50 dark:border-carbon-950 pb-2">
              <span className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                Advanced Logistics Search & Filters
              </span>
              {(listSearch || listStatus !== 'All' || listStartDate || listEndDate || listBranch !== 'All' || listLoadType !== 'All' || listTruck !== 'All' || listDriver !== 'All' || listTransferOnly) && (
                <button
                  onClick={() => {
                    setListSearch('');
                    setListStatus('All');
                    setListStartDate('');
                    setListEndDate('');
                    setListBranch('All');
                    setListLoadType('All');
                    setListTruck('All');
                    setListDriver('All');
                    setListTransferOnly(false);
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Active Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {/* Filter: Search */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[11px] font-bold text-navy-500 dark:text-carbon-450 uppercase mb-1 tracking-wider">Search Dispatch Registry</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-navy-400 dark:text-carbon-500" />
                  </span>
                  <input
                    type="text"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Search trip code, client registry, consignee, truckplate, driver..."
                    className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-lg py-2 pl-9 pr-3 text-xs text-navy-900 dark:text-white placeholder-navy-400 focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500 transition-all font-medium"
                  />
                  {listSearch && (
                    <button onClick={() => setListSearch('')} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-navy-400 hover:text-navy-900 dark:hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter: Status */}
              <div>
                <label className="block text-[11px] font-bold text-navy-500 dark:text-carbon-450 uppercase mb-1 tracking-wider">Trip Status</label>
                <select
                  value={listStatus}
                  onChange={(e) => setListStatus(e.target.value)}
                  className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-lg py-2 px-2.5 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rescue">Rescue</option>
                </select>
              </div>

              {/* Filter: Pickup Date From */}
              <div>
                <label className="block text-[11px] font-bold text-navy-500 dark:text-carbon-450 uppercase mb-1 tracking-wider">Scheduled From</label>
                <input
                  type="date"
                  value={listStartDate}
                  onChange={(e) => setListStartDate(e.target.value)}
                  className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-lg py-1.5 px-2.5 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Filter: Pickup Date To */}
              <div>
                <label className="block text-[11px] font-bold text-navy-500 dark:text-carbon-450 uppercase mb-1 tracking-wider">Scheduled To</label>
                <input
                  type="date"
                  value={listEndDate}
                  onChange={(e) => setListEndDate(e.target.value)}
                  className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-lg py-1.5 px-2.5 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Filter: Branch */}
              <div>
                <label className="block text-[11px] font-bold text-navy-500 dark:text-carbon-450 uppercase mb-1 tracking-wider">Origin Branch</label>
                <select
                  value={listBranch}
                  onChange={(e) => setListBranch(e.target.value)}
                  className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-lg py-2 px-2.5 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Branches</option>
                  {MOCK_BRANCHES.map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              </div>

              {/* Filter: Load Type */}
              <div>
                <label className="block text-[11px] font-bold text-navy-500 dark:text-carbon-450 uppercase mb-1 tracking-wider">Load Type</label>
                <select
                  value={listLoadType}
                  onChange={(e) => setListLoadType(e.target.value)}
                  className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-lg py-2 px-2.5 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Load Types</option>
                  <option value="Dry">Dry Cargo</option>
                  <option value="Chilled">Chilled Cargo</option>
                  <option value="Ref">Reefer Frozen</option>
                  <option value="Combi">Multi-Temp Combo</option>
                </select>
              </div>

              {/* Filter: Truck */}
              <div>
                <label className="block text-[11px] font-bold text-navy-500 dark:text-carbon-450 uppercase mb-1 tracking-wider">Assigned Truck</label>
                <select
                  value={listTruck}
                  onChange={(e) => setListTruck(e.target.value)}
                  className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-lg py-2 px-2.5 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Trucks</option>
                  {trucks.map(t => (
                    <option key={t.truck_id || t.id} value={t.truck_id || t.id}>{t.license_plate || t.plate_number}</option>
                  ))}
                </select>
              </div>

              {/* Filter: Driver */}
              <div>
                <label className="block text-[11px] font-bold text-navy-500 dark:text-carbon-450 uppercase mb-1 tracking-wider">Assigned Driver</label>
                <select
                  value={listDriver}
                  onChange={(e) => setListDriver(e.target.value)}
                  className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-lg py-2 px-2.5 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Drivers</option>
                  {drivers.map(d => (
                    <option key={d.employee_id || d.id} value={d.employee_id || d.id}>{d.first_name || d.full_name} {d.last_name || ''}</option>
                  ))}
                </select>
              </div>

              {/* Filter: Transfer Only */}
              <div className="flex items-center pt-5 h-full">
                <label className="relative flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={listTransferOnly}
                    onChange={(e) => setListTransferOnly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-navy-100 peer-focus:outline-none rounded-full peer dark:bg-carbon-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-navy-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-carbon-600 peer-checked:bg-blue-500"></div>
                  <span className="ml-2 text-xs font-semibold text-navy-700 dark:text-carbon-300">Transfer Trips Only</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-5 items-stretch">
            {/* Left Panel: High Density Table Listing with Horizontal Scroll */}
            <div className={`transition-all duration-300 ${selectedTripId ? 'xl:w-2/3 w-full' : 'w-full'} bg-white dark:bg-carbon-900 rounded-xl border border-navy-150 dark:border-carbon-800 overflow-hidden shadow-sm flex flex-col`}>
              <div className="overflow-x-auto select-none">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                  <thead>
                    <tr className="bg-navy-50 dark:bg-carbon-900/80 border-b border-navy-155 dark:border-carbon-800 text-[11px] uppercase tracking-wider font-bold text-navy-600 dark:text-carbon-400">
                      <th className="p-3 pl-4 min-w-[120px]">Trip Advice Code</th>
                      <th className="p-3 min-w-[110px]">Status</th>
                      <th className="p-3 min-w-[150px]">Client</th>
                      <th className="p-3 min-w-[110px]">Int. Code</th>
                      <th className="p-3 min-w-[150px]">Consignee</th>
                      <th className="p-3 min-w-[150px]">Pickup Date/Time</th>
                      <th className="p-3 min-w-[110px]">Truck Size</th>
                      <th className="p-3 min-w-[100px]">Truck Plate</th>
                      <th className="p-3 min-w-[130px]">Primary Driver</th>
                      <th className="p-3 min-w-[140px]">Helper(s)</th>
                      <th className="p-3 min-w-[110px]">Load Type</th>
                      <th className="p-3 min-w-[110px]">Transfer</th>
                      <th className="p-3 min-w-[100px] text-right">Net Weight</th>
                      <th className="p-3 min-w-[180px]">Route Summary</th>
                      <th className="p-3 min-w-[120px]">Last Updated</th>
                      <th className="p-3 text-center min-w-[180px] sticky right-0 bg-navy-50 dark:bg-carbon-900 border-l border-navy-155 dark:border-carbon-800 shadow-[-4px_0_12px_rgba(0,0,0,0.04)] z-10">Row Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50 dark:divide-carbon-850 text-xs">
                    {(() => {
                      const computedFilteredTrips = trips.filter(trip => {
                        if (trip.is_deleted) return false;
                        
                        // Search Filter (code, client, consignee, plate, driver)
                        if (listSearch) {
                          const query = listSearch.toLowerCase();
                          const codeMatches = (trip.trip_advise_code || trip.trip_code || '').toLowerCase().includes(query);
                          
                          const cust = getCustomerObject(trip.customer_id || trip.client_id);
                          const clientNameMatches = (cust?.client_name || cust?.name || '').toLowerCase().includes(query);
                          
                          const cons = MOCK_CONSIGNEES.find(c => c.id === trip.consignee_id || c.client_id === trip.client_id);
                          const consigneeNameMatches = (cons?.full_name || '').toLowerCase().includes(query);
                          
                          const trk = getTruckObject(trip.truck_id);
                          const plateMatches = (trk?.plate_number || trk?.license_plate || '').toLowerCase().includes(query);
                          
                          const drv = getDriverObject(trip.driver_id);
                          const driverNameMatches = (drv?.full_name || `${drv?.first_name || ''} ${drv?.last_name || ''}`).toLowerCase().includes(query);
                          
                          if (!codeMatches && !clientNameMatches && !consigneeNameMatches && !plateMatches && !driverNameMatches) {
                            return false;
                          }
                        }

                        // Status Filter
                        if (listStatus !== 'All') {
                          if (trip.status !== listStatus) return false;
                        }

                        // Date Range Filter
                        if (listStartDate) {
                          if (trip.pickup_date < listStartDate) return false;
                        }
                        if (listEndDate) {
                          if (trip.pickup_date > listEndDate) return false;
                        }

                        // Branch Filter
                        if (listBranch !== 'All') {
                          if (trip.branch_id !== listBranch) return false;
                        }

                        // Load Type Filter
                        if (listLoadType !== 'All') {
                          const match = trip.load_type_id === listLoadType || 
                                        (trip.load_type || '').toLowerCase() === listLoadType.toLowerCase();
                          if (!match) return false;
                        }

                        // Truck Filter
                        if (listTruck !== 'All') {
                          if (String(trip.truck_id) !== String(listTruck)) return false;
                        }

                        // Driver Filter
                        if (listDriver !== 'All') {
                          if (String(trip.driver_id) !== String(listDriver)) return false;
                        }

                        // Transfer Only Filter
                        if (listTransferOnly) {
                          if (!trip.is_transfer) return false;
                        }

                        return true;
                      });

                      if (computedFilteredTrips.length === 0) {
                        return (
                          <tr>
                            <td colSpan={16} className="text-center py-16 text-navy-500 dark:text-carbon-400">
                              <BadgeAlert className="w-8 h-8 text-navy-400 dark:text-carbon-650 mx-auto mb-2.5" />
                              <p className="text-sm font-bold">No dispatch records found matching active filter set.</p>
                              <p className="text-xs text-navy-400 dark:text-carbon-500 mt-1">Try resetting dates or clearing search query.</p>
                            </td>
                          </tr>
                        );
                      }

                      return computedFilteredTrips.map((trip) => {
                        const customer = getCustomerObject(trip.customer_id || trip.client_id);
                        const driver = getDriverObject(trip.driver_id);
                        const truck = getTruckObject(trip.truck_id);
                        const origin = getLocationObject(trip.origin_location_id);
                        const dest = getLocationObject(trip.destination_location_id);
                        const consignee = MOCK_CONSIGNEES.find(c => c.id === trip.consignee_id || c.client_id === (trip.client_id || trip.customer_id));
                        const internalCode = MOCK_INTERNAL_CLIENT_CODES.find(icc => icc.id === trip.internal_client_code_id || icc.client_id === (trip.client_id || trip.customer_id));
                        const branch = MOCK_BRANCHES.find(b => b.id === trip.branch_id);

                        const helper1 = getHelperObject(trip.helper1_employee_id);
                        const helper2 = getHelperObject(trip.helper2_employee_id);

                        const isCancelled = trip.status === 'Cancelled';
                        const isCompleted = trip.status === 'Completed';

                        const conflict = getAssignmentConflict(trip);
                        const stopsList = MOCK_TRIP_STOPS.filter(s => s.trip_advise_id === trip.id || s.trip_advise_id === trip.trip_id);
                        const hasNoStops = stopsList.length === 0;

                        return (
                          <tr 
                            key={trip.trip_id || trip.id} 
                            onClick={() => setSelectedTripId(String(trip.id || trip.trip_id))}
                            className={`border-b border-navy-50 dark:border-carbon-850 hover:bg-navy-50/50 dark:hover:bg-carbon-800/40 transition-colors cursor-pointer group ${
                              selectedTripId === String(trip.id || trip.trip_id) ? 'bg-blue-50/30 dark:bg-blue-550/10' : ''
                            } ${isCancelled ? 'opacity-65 grayscale-[30%] bg-red-50/10 dark:bg-red-950/5' : ''}`}
                          >
                            {/* Trip Advice Code */}
                            <td className="p-3 pl-4">
                              <div className="flex flex-col gap-1">
                                <div className={`font-mono font-bold tracking-tight ${isCancelled ? 'line-through text-red-500 dark:text-red-400' : 'text-navy-950 dark:text-white'}`}>
                                  {trip.trip_advise_code || trip.trip_code}
                                </div>
                                <div className="text-[10px] text-navy-400 dark:text-carbon-500 flex items-center gap-1">
                                  <span>{branch?.branch_code || 'MNL'}</span>
                                  {conflict && (
                                    <span className="inline-flex items-center text-red-500 animate-pulse" title={`Double booking conflict: ${conflict.type}`}>
                                      <ShieldAlert className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                  {hasNoStops && (
                                    <span className="inline-flex items-center text-amber-500" title="Warning: No trip stops configured">
                                      <BadgeAlert className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-3 text-[10px]">
                              <span className={`px-2 py-0.5 rounded-full font-bold tracking-wide border uppercase text-[9px] inline-block ${getTripBadgeStyles(trip.status)}`}>
                                {trip.status}
                              </span>
                            </td>

                            {/* Client */}
                            <td className="p-3 font-semibold text-navy-800 dark:text-carbon-350">
                              <div className="max-w-[140px] truncate" title={customer?.client_name || customer?.name}>
                                {customer?.client_name || customer?.name || 'No Client Specified'}
                              </div>
                            </td>

                            {/* Internal Code */}
                            <td className="p-3 font-mono text-navy-500 dark:text-carbon-450 uppercase">
                              {internalCode?.code || 'N/A'}
                            </td>

                            {/* Consignee */}
                            <td className="p-3 text-navy-700 dark:text-carbon-400">
                              <div className="max-w-[140px] truncate" title={consignee?.full_name}>
                                {consignee?.full_name || 'N/A'}
                              </div>
                            </td>

                            {/* Pickup Date/Time */}
                            <td className="p-3">
                              <div className="font-semibold text-navy-900 dark:text-white">
                                {trip.pickup_date}
                              </div>
                              <div className="text-[10px] text-navy-450 dark:text-carbon-500 mt-0.5 truncate max-w-[140px]">
                                {trip.pickup_time_window || 'Standard window'}
                              </div>
                            </td>

                            {/* Truck Size */}
                            <td className="p-3 text-navy-600 dark:text-carbon-400">
                              {trip.truck_size || '10-Wheeler'}
                            </td>

                            {/* Truck Plate */}
                            <td className="p-3 font-mono font-semibold text-navy-800 dark:text-carbon-300 uppercase">
                              {truck?.plate_number || truck?.license_plate || 'Unassigned'}
                            </td>

                            {/* Driver */}
                            <td className="p-3 font-semibold text-navy-800 dark:text-carbon-300">
                              {driver ? `${driver.first_name || ''} ${driver.last_name || ''}`.trim() : 'Unassigned'}
                            </td>

                            {/* Helper(s) */}
                            <td className="p-3 text-navy-500 dark:text-carbon-450 text-[11px] truncate max-w-[130px]" title={`H1: ${helper1?.full_name || ''}, H2: ${helper2?.full_name || ''}`}>
                              {helper1 || helper2 ? (
                                <div className="space-y-0.5">
                                  {helper1 && <div className="truncate">👋 {helper1.first_name} {helper1.last_name}</div>}
                                  {helper2 && <div className="truncate">👋 {helper2.first_name} {helper2.last_name}</div>}
                                </div>
                              ) : (
                                <span className="italic text-navy-400">No Helpers</span>
                              )}
                            </td>

                            {/* Load Type */}
                            <td className="p-3">
                              <span className="text-navy-650 dark:text-carbon-400 bg-navy-50 dark:bg-carbon-950 px-1.5 py-0.5 rounded border border-navy-100 dark:border-carbon-805">
                                {trip.load_type || 'Dry Goods'}
                              </span>
                            </td>

                            {/* Transfer */}
                            <td className="p-3 text-[11px]">
                              {trip.is_transfer ? (
                                <span className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-150 rounded font-semibold inline-flex items-center gap-0.5">
                                  <Layers className="w-3 h-3" /> Yes
                                </span>
                              ) : (
                                <span className="text-navy-400">Standard</span>
                              )}
                            </td>

                            {/* Net Weight */}
                            <td className="p-3 text-right font-mono font-medium text-navy-800 dark:text-carbon-300">
                              {trip.net_weight ? `${trip.net_weight.toLocaleString()} kg` : '0 kg'}
                            </td>

                            {/* Route Summary */}
                            <td className="p-3">
                              <div className="flex items-center gap-1 hover:text-blue-500">
                                <span className="font-semibold text-navy-900 dark:text-white shrink-0 truncate max-w-[80px]" title={origin?.location_name || origin?.name}>
                                  {origin?.location_name || origin?.name || 'Origin'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-navy-400 shrink-0" />
                                <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0 truncate max-w-[80px]" title={dest?.location_name || dest?.name}>
                                  {dest?.location_name || dest?.name || 'Destination'}
                                </span>
                              </div>
                            </td>

                            {/* Last Updated */}
                            <td className="p-3 text-navy-450 dark:text-carbon-500 font-mono text-[10px]">
                              {trip.updated_at ? new Date(trip.updated_at).toLocaleDateString() : 'N/A'}
                            </td>

                            {/* Actions Column (Highly stylized sticky side operations block) */}
                            <td 
                              className="p-3 text-center sticky right-0 bg-white dark:bg-carbon-900 border-l border-navy-155 dark:border-carbon-800 shadow-[-4px_0_12px_rgba(0,0,0,0.04)] z-10"
                              onClick={(e) => e.stopPropagation()} // stop parent row selection
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Action: View Details sidebar */}
                                <button
                                  onClick={() => {
                                    setSelectedTripId(String(trip.id || trip.trip_id));
                                    setDetailTab('overview');
                                  }}
                                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 p-1.5 rounded transition-colors"
                                  title="View full logistics drawer panel"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Action: Edit modal */}
                                <button
                                  onClick={() => handleOpenModal(trip)}
                                  disabled={isCompleted || isReadOnly}
                                  className="text-navy-500 dark:text-carbon-400 hover:bg-navy-100 dark:hover:bg-carbon-800 p-1.5 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                  title={isCompleted ? "Completed runs are read-only" : "Modify trip logistics details"}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                {/* Action: View stops tab in detail panel */}
                                <button
                                  onClick={() => {
                                    setSelectedTripId(String(trip.id || trip.trip_id));
                                    setDetailTab('stops');
                                  }}
                                  className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-55/70 dark:hover:bg-emerald-950/20 p-1.5 rounded transition-colors"
                                  title="View transit routing stops"
                                >
                                  <MapPin className="w-4 h-4" />
                                </button>

                                {/* Action: View event timeline tab in detail panel */}
                                <button
                                  onClick={() => {
                                    setSelectedTripId(String(trip.id || trip.trip_id));
                                    setDetailTab('events');
                                  }}
                                  className="text-purple-500 hover:text-purple-700 hover:bg-purple-55/70 dark:hover:bg-purple-950/20 p-1.5 rounded transition-colors"
                                  title="View milestone activity events logs"
                                >
                                  <Activity className="w-4 h-4" />
                                </button>

                                {/* Action: Cancel dispatch */}
                                <button
                                  onClick={() => handleDirectCancelTrip(trip)}
                                  disabled={isCancelled || isReadOnly}
                                  className="text-red-550 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                  title={isCancelled ? "Already cancelled" : "Cancel advising schedule"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Panel: Detail View (drawer-like) */}
            {selectedTripId && (() => {
              const selectedTripObj = trips.find(t => String(t.id) === selectedTripId || String(t.trip_id) === selectedTripId);
              if (!selectedTripObj) return null;

              const customer = getCustomerObject(selectedTripObj.customer_id || selectedTripObj.client_id);
              const driver = getDriverObject(selectedTripObj.driver_id);
              const truck = getTruckObject(selectedTripObj.truck_id);
              const origin = getLocationObject(selectedTripObj.origin_location_id);
              const dest = getLocationObject(selectedTripObj.destination_location_id);
              const consignee = MOCK_CONSIGNEES.find(c => c.id === selectedTripObj.consignee_id || c.client_id === (selectedTripObj.client_id || selectedTripObj.customer_id));
              const internalCode = MOCK_INTERNAL_CLIENT_CODES.find(icc => icc.id === selectedTripObj.internal_client_code_id || icc.client_id === (selectedTripObj.client_id || selectedTripObj.customer_id));
              const branch = MOCK_BRANCHES.find(b => b.id === selectedTripObj.branch_id);

              const helper1 = getHelperObject(selectedTripObj.helper1_employee_id);
              const helper2 = getHelperObject(selectedTripObj.helper2_employee_id);

              const isCancelled = selectedTripObj.status === 'Cancelled';
              const isCompleted = selectedTripObj.status === 'Completed';

              const conflict = getAssignmentConflict(selectedTripObj);

              const stops = MOCK_TRIP_STOPS.filter(s => s.trip_advise_id === selectedTripObj.id || s.trip_advise_id === selectedTripObj.trip_id).sort((a,b) => a.stop_sequence - b.stop_sequence);
              const events = MOCK_TRIP_EVENTS.filter(e => e.trip_advise_id === selectedTripObj.id || e.trip_advise_id === selectedTripObj.trip_id).sort((a,b) => new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime());
              const fuels = MOCK_TRIP_FUEL_LOGS.filter(f => f.trip_advise_id === selectedTripObj.id || f.trip_advise_id === selectedTripObj.trip_id).sort((a,b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());

              return (
                <div className="xl:w-1/3 w-full bg-white dark:bg-carbon-900 border border-navy-150 dark:border-carbon-800 rounded-xl p-5 shadow-lg flex flex-col space-y-4 self-stretch relative">
                  {/* Panel Header */}
                  <div className="flex items-start justify-between border-b border-navy-50 dark:border-carbon-950 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-navy-950 dark:text-white font-mono">
                          {selectedTripObj.trip_advise_code || selectedTripObj.trip_code}
                        </h2>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getTripBadgeStyles(selectedTripObj.status)}`}>
                          {selectedTripObj.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-navy-450 dark:text-carbon-450 mt-0.5">Origin branch: {branch?.branch_name || 'Manila Port'}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedTripId(null)} 
                      className="text-navy-400 hover:text-navy-900 dark:hover:text-white p-1 rounded-full hover:bg-navy-50 dark:hover:bg-carbon-850"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Business Alerts Segment */}
                  {conflict && (
                    <div className="bg-red-50 dark:bg-red-550/10 border border-red-200 dark:border-red-400/20 rounded-lg p-3 text-red-700 dark:text-red-400 flex gap-2">
                      <ShieldAlert className="w-5 h-5 shrink-0 animate-bounce" />
                      <div>
                        <p className="font-bold text-[11px] uppercase tracking-wide">Double Booking Conflict Warning</p>
                        <p className="text-[10px] mt-0.5">Assigned asset is conflict-booked on date <strong>{selectedTripObj.pickup_date}</strong> with trip <strong>{conflict.conflictingCode}</strong>.</p>
                      </div>
                    </div>
                  )}

                  {isCancelled && (
                    <div className="bg-amber-50 dark:bg-amber-550/10 border border-amber-250 dark:border-amber-500/20 rounded-lg p-3 text-amber-700 dark:text-amber-400 flex gap-2">
                      <Info className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold text-[11px] uppercase tracking-wide">Trips Schedule Cancelled</p>
                        <p className="text-[10px] mt-0.5">This trip schedule has been cancelled. Vehicle and driver assignments are released from dispatch. Changes are restricted.</p>
                      </div>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="bg-blue-50 dark:bg-blue-550/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3 text-blue-700 dark:text-blue-400 flex gap-2 animate-pulse">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold text-[11px] uppercase tracking-wide">Dispatch Run Successfully Completed</p>
                        <p className="text-[10px] mt-0.5">All stops and drops have been verified. Logged as archived. Record is read-only by default.</p>
                      </div>
                    </div>
                  )}

                  {/* Quick Dispatch Status Selector */}
                  {!isCancelled && !isReadOnly && (
                    <div className="bg-navy-50/50 dark:bg-carbon-950 p-3 rounded-lg border border-navy-100 dark:border-carbon-805 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-navy-600 dark:text-carbon-400 uppercase tracking-wider">Quick Status:</span>
                      <select
                        value={selectedTripObj.status}
                        onChange={(e) => handleQuickStatusUpdate(selectedTripObj, e.target.value)}
                        className="bg-white dark:bg-carbon-900 border border-navy-200 dark:border-carbon-800 rounded px-2 py-1 text-xs text-navy-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Rescue">Rescue</option>
                      </select>
                    </div>
                  )}

                  {/* Sub-Tabs Selector */}
                  <div className="bg-navy-50 dark:bg-carbon-950 p-1 rounded-lg flex border border-navy-100 dark:border-carbon-805">
                    {[
                      { key: 'overview', icon: FileText, label: 'Overview' },
                      { key: 'stops', icon: MapPin, label: `Stops (${stops.length})` },
                      { key: 'events', icon: Activity, label: `Timeline (${events.length})` },
                      { key: 'fuel', icon: Fuel, label: 'Fuel' }
                    ].map(t => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setDetailTab(t.key as any)}
                          className={`flex-1 flex flex-col items-center py-2 rounded-md transition-all text-[10px] font-bold uppercase tracking-wide gap-1 ${
                            detailTab === t.key 
                              ? 'bg-white dark:bg-carbon-900 text-blue-600 dark:text-blue-400 shadow-sm border border-navy-100/50 dark:border-carbon-800' 
                              : 'text-navy-400 hover:text-navy-900 dark:text-carbon-500 dark:hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Body Content */}
                  <div className="flex-1 overflow-y-auto max-h-[420px] pr-1.5 custom-narrow-scrollbar text-xs">
                    {/* Tab: Overview */}
                    {detailTab === 'overview' && (
                      <div className="space-y-4">
                        {/* Section: Logistics Details */}
                        <div className="space-y-2">
                          <h3 className="text-[11px] font-bold text-navy-400 dark:text-carbon-500 uppercase tracking-widest border-b border-navy-50 dark:border-carbon-850 pb-1">Logistics & Client Details</h3>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <p className="text-[10px] text-navy-400 dark:text-carbon-500">CLIENT NAME</p>
                              <p className="font-semibold text-navy-800 dark:text-white text-xs">{customer?.client_name || customer?.name || 'Unassigned'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-navy-400 dark:text-carbon-500">INTERNAL CLIENT CODE</p>
                              <p className="font-mono font-bold text-navy-800 dark:text-white">{internalCode?.code || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] text-navy-400 dark:text-carbon-500">CONSIGNEE NAME & DEPOT</p>
                              <p className="font-semibold text-navy-800 dark:text-white text-xs">{consignee?.full_name || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] text-navy-400 dark:text-carbon-500">CONSIGNEE SPECIFIC ADDRESS</p>
                              <p className="text-navy-650 dark:text-carbon-400 leading-relaxed text-[11px]">{consignee?.address || 'No specific depot address registered'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-navy-400 dark:text-carbon-500">LOAD CLASSIFICATION</p>
                              <p className="font-semibold text-navy-850 dark:text-white">{selectedTripObj.load_type || 'Dry Cargo'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-navy-400 dark:text-carbon-500">NET REGISTRY WEIGHT</p>
                              <p className="font-semibold text-navy-850 dark:text-white font-mono text-xs">{selectedTripObj.net_weight ? `${selectedTripObj.net_weight.toLocaleString()} kg` : '0 kg'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Section: Asset Assignments */}
                        <div className="space-y-2">
                          <h3 className="text-[11px] font-bold text-navy-400 dark:text-carbon-500 uppercase tracking-widest border-b border-navy-50 dark:border-carbon-850 pb-1">Asset Assignments</h3>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <p className="text-[10px] text-navy-400 dark:text-carbon-500">VEHICLE PLATE NUMBER</p>
                              <p className="font-mono font-bold text-navy-800 dark:text-white text-xs">{truck?.plate_number || truck?.license_plate || 'Unassigned'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-navy-400 dark:text-carbon-500">VEHICLE CLASS / LOAD LIMIT</p>
                              <p className="font-semibold text-navy-800 dark:text-white">{truck?.truck_size || selectedTripObj.truck_size || 'N/A'} ({truck?.tonner_capacity || 0}T Limit)</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-navy-400 dark:text-carbon-500">PRIMARY DRIVER PROFILE</p>
                              <p className="font-semibold text-navy-800 dark:text-white text-xs">{driver ? `${driver.first_name} ${driver.last_name}` : 'Unassigned'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-navy-400 dark:text-carbon-500">DRIVER LICENSE DETAILS</p>
                              <p className="font-mono text-navy-500 dark:text-carbon-450 text-[11px]">{MOCK_DRIVERS.find(d => d.id === selectedTripObj.driver_id || d.employee_id === selectedTripObj.driver_id)?.license_number || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] text-navy-400 dark:text-carbon-500">ASSISTING CREW HELPERS</p>
                              {helper1 || helper2 ? (
                                <div className="flex gap-1.5 mt-1">
                                  {helper1 && (
                                    <span className="bg-navy-50 dark:bg-carbon-805 px-2 py-1 rounded border border-navy-100 dark:border-carbon-700 font-semibold text-navy-700 dark:text-carbon-300">
                                      {helper1.first_name} {helper1.last_name}
                                    </span>
                                  )}
                                  {helper2 && (
                                    <span className="bg-navy-50 dark:bg-carbon-805 px-2 py-1 rounded border border-navy-100 dark:border-carbon-700 font-semibold text-navy-700 dark:text-carbon-300">
                                      {helper2.first_name} {helper2.last_name}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="italic text-navy-450 dark:text-carbon-500 font-medium text-[11px]">No helping personnel attached to this run.</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Section: Audit Information */}
                        <div className="space-y-2">
                          <h3 className="text-[11px] font-bold text-navy-400 dark:text-carbon-500 uppercase tracking-widest border-b border-navy-50 dark:border-carbon-850 pb-1">System Audit Logs</h3>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <p className="text-[10px] text-navy-405 dark:text-carbon-500">REGISTERED CREATED AT</p>
                              <p className="font-mono text-navy-600 dark:text-carbon-400">{selectedTripObj.created_at ? new Date(selectedTripObj.created_at).toLocaleString() : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-navy-405 dark:text-carbon-500">LAST LOGGED MODIFICATION</p>
                              <p className="font-mono text-navy-600 dark:text-carbon-400">{selectedTripObj.updated_at ? new Date(selectedTripObj.updated_at).toLocaleString() : 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] text-navy-405 dark:text-carbon-500 font-bold">DIGITAL ENCODER GOB-CLERK</p>
                              <p className="font-medium text-navy-800 dark:text-carbon-300">
                                🧑‍💻 {employees.find(e => e.id === selectedTripObj.encoder_employee_id || e.employee_id === selectedTripObj.encoder_employee_id)?.full_name || 'System Auto dispatcher'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab: Stops */}
                    {detailTab === 'stops' && (
                      <div className="space-y-4">
                        {stops.length === 0 ? (
                          <div className="bg-amber-50 dark:bg-amber-550/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 text-center">
                            <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-2 animate-pulse" />
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">No scheduled stops defined for this trip advice.</p>
                            <p className="text-[10.5px] text-amber-600 dark:text-carbon-450 mt-1">Please add routing nodes to avoid dispatch errors.</p>
                          </div>
                        ) : (
                          <div className="relative pl-6 border-l border-navy-150 dark:border-carbon-800 space-y-4 ml-2.5 mt-2 select-none">
                            {stops.map((stop, idx) => {
                              const loc = getLocationObject(stop.location_id);
                              const isPickup = stop.stop_type === 'Pickup';
                              return (
                                <div key={stop.id} className="relative">
                                  {/* Dot indicator */}
                                  <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-carbon-900 flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${
                                    isPickup ? 'bg-blue-600' : 'bg-rose-500'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-navy-900 dark:text-white">{loc?.location_name || loc?.name || 'Hub Terminal'}</span>
                                      <span className={`text-[8.5px] px-1.5 rounded-full font-bold uppercase ${
                                        isPickup ? 'bg-blue-50 text-blue-700 border border-blue-150 dark:bg-blue-950/20 dark:text-blue-300' : 'bg-rose-50 text-rose-700 border border-rose-150 dark:bg-rose-950/20 dark:text-rose-300'
                                      }`}>
                                        {stop.stop_type}
                                      </span>
                                    </div>
                                    <p className="text-[10.5px] text-navy-450 dark:text-carbon-450 mt-0.5">{stop.specific_address || loc?.address_line_1}</p>
                                    <p className="font-mono text-[9.5px] text-navy-400 dark:text-carbon-500 mt-1">
                                      ⏰ Scheduled: {stop.scheduled_at ? new Date(stop.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD'}
                                      {stop.actual_at && ` | Actual: ${new Date(stop.actual_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab: Events (Milestones Timeline) */}
                    {detailTab === 'events' && (
                      <div className="space-y-4">
                        {events.length === 0 ? (
                          <div className="text-center py-8 text-navy-400 dark:text-carbon-500">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No event historical events compiled for this run advice.</p>
                          </div>
                        ) : (
                          <div className="relative pl-6 border-l border-navy-100 dark:border-carbon-805 space-y-4 ml-2.5 mt-2">
                            {events.map((evt) => (
                              <div key={evt.id} className="relative">
                                <span className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white dark:ring-carbon-900 shadow-sm" />
                                <div className="text-[11px]">
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-navy-900 dark:text-white uppercase tracking-wider">{evt.event_type}</p>
                                    <span className="font-mono text-[9px] text-navy-400 dark:text-carbon-500">{new Date(evt.event_timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                                  <p className="text-navy-500 dark:text-carbon-450 mt-0.5 leading-relaxed">{evt.remarks || 'No remarks recorded'}</p>
                                  {evt.document_no && (
                                    <p className="font-mono text-[9px] text-blue-550 dark:text-blue-400 mt-1">Doc Code Ref: {evt.document_no}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab: Fuel Logs */}
                    {detailTab === 'fuel' && (
                      <div className="space-y-4">
                        {fuels.length === 0 ? (
                          <div className="text-center py-10 text-navy-450 dark:text-carbon-500 bg-navy-50/30 dark:bg-carbon-950 p-4 rounded-xl border border-navy-100 dark:border-carbon-850 select-none">
                            <Fuel className="w-7 h-7 mx-auto mb-1.5 text-navy-405 dark:text-carbon-600" />
                            <p className="font-bold">No fueling receipts exist for this dispatch.</p>
                            <p className="text-[10px] mt-0.5">Refuel requests can be logged inside fleet logistics module.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-blue-50/50 dark:bg-blue-950/10 p-3 rounded-lg border border-blue-150 text-blue-800 dark:text-blue-300 flex justify-between font-mono text-[11px]">
                              <span>Total Liters: <strong className="text-navy-950 dark:text-white font-bold">{fuels.reduce((sum, f) => sum + f.liters, 0).toFixed(1)} L</strong></span>
                              <span>Total Expenses: <strong className="text-navy-950 dark:text-white font-bold">₱{fuels.reduce((sum, f) => sum + f.total_amount, 0).toLocaleString()}</strong></span>
                            </div>
                            <div className="divide-y divide-navy-50 dark:divide-carbon-850">
                              {fuels.map((fuel) => (
                                <div key={fuel.id} className="py-2.5 flex items-center justify-between text-[11px]">
                                  <div>
                                    <p className="font-bold text-navy-900 dark:text-white">Ref: {fuel.fuel_ref_no}</p>
                                    <p className="font-mono text-[10px] text-navy-400 dark:text-carbon-500 mt-0.5">Logged: {new Date(fuel.logged_at).toLocaleDateString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono font-bold text-navy-850 dark:text-white">{fuel.liters} L</p>
                                    <p className="font-mono text-navy-400 dark:text-carbon-400 text-[10px]">₱{fuel.total_amount.toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {viewMode === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[550px] overflow-hidden">
          {/* Left Column: Trip Selection & Filters */}
          <div className="lg:col-span-1 bg-white dark:bg-carbon-900 rounded-xl border border-navy-100 dark:border-carbon-800 p-4 flex flex-col h-full overflow-hidden shadow-sm">
            <h2 className="text-lg font-bold text-navy-900 dark:text-white mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Interactive Dispatch Map
            </h2>

            {/* Map Search input */}
            <div className="relative mb-3">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-navy-400 dark:text-carbon-500" />
              </span>
              <input
                type="text"
                placeholder="Search trip code, customer..."
                className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-lg py-2 pl-9 pr-4 text-xs text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
              />
              {mapSearch && (
                <button
                  onClick={() => setMapSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-navy-400 hover:text-navy-950 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Pills Row */}
            <div className="flex flex-wrap gap-1.5 mb-4 border-b border-navy-50 dark:border-carbon-800 pb-3">
              {['All', 'Scheduled', 'In Transit', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setMapStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all border ${
                    mapStatusFilter === status
                      ? 'bg-navy-900 dark:bg-white text-white dark:text-carbon-950 border-navy-900 dark:border-white shadow-sm'
                      : 'bg-navy-50/50 dark:bg-carbon-950 hover:bg-navy-100/70 dark:hover:bg-carbon-800 text-navy-600 dark:text-carbon-400 border-navy-100 dark:border-carbon-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Scrollable Trips List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-narrow-scrollbar">
              {(() => {
                const filteredMapTripsList = trips.filter(trip => {
                  const customer = customers.find(c => c.customer_id === trip.customer_id);
                  const dest = locations.find(l => l.location_id === trip.destination_location_id);
                  const origin = locations.find(l => l.location_id === trip.origin_location_id);
                  
                  if (mapStatusFilter !== 'All' && trip.status !== mapStatusFilter) {
                    return false;
                  }
                  
                  if (mapSearch) {
                    const searchLower = mapSearch.toLowerCase();
                    const codeMatch = trip.trip_code.toLowerCase().includes(searchLower);
                    const customerMatch = customer?.name.toLowerCase().includes(searchLower) || false;
                    const destMatch = dest?.name.toLowerCase().includes(searchLower) || false;
                    const originMatch = origin?.name.toLowerCase().includes(searchLower) || false;
                    return codeMatch || customerMatch || destMatch || originMatch;
                  }
                  
                  return true;
                });

                if (filteredMapTripsList.length === 0) {
                  return (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-navy-500 dark:text-carbon-400">
                      <MapPin className="w-8 h-8 text-navy-300 dark:text-carbon-600 mb-2 stroke-1" />
                      <p className="text-xs font-medium">No scheduled trips found</p>
                      <p className="text-[10px] opacity-75 mt-0.5">Try altering your search filters</p>
                    </div>
                  );
                }

                return filteredMapTripsList.map((trip) => {
                  const customer = customers.find(c => c.customer_id === trip.customer_id);
                  const driver = employees.find(e => e.employee_id === trip.driver_id);
                  const truck = trucks.find(t => t.truck_id === trip.truck_id);
                  const origin = locations.find(l => l.location_id === trip.origin_location_id);
                  const dest = locations.find(l => l.location_id === trip.destination_location_id);
                  const isActive = activeMapTripId === trip.trip_id;

                  const handleTripClick = () => {
                    setActiveMapTripId(trip.trip_id);
                    if (dest?.latitude && dest?.longitude) {
                      if (origin?.latitude && origin?.longitude && leafletMapRef.current) {
                        const routePoints = calculateRoutePoints(origin, dest);
                        leafletMapRef.current.fitBounds(routePoints, { padding: [50, 50] });
                        
                        const center = leafletMapRef.current.getCenter();
                        const zoom = leafletMapRef.current.getZoom();
                        setMapCenter({ lat: center.lat, lng: center.lng });
                        setMapZoom(zoom);
                      } else {
                        setMapCenter({ lat: dest.latitude, lng: dest.longitude });
                        setMapZoom(11);
                      }
                    }
                  };

                  return (
                    <div
                      key={trip.trip_id}
                      onClick={handleTripClick}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                        isActive
                          ? 'bg-blue-50/45 dark:bg-blue-950/15 border-blue-400 dark:border-blue-500/45 ring-1 ring-blue-400 dark:ring-blue-500/30'
                          : 'bg-white dark:bg-carbon-900 border-navy-100 dark:border-carbon-805 hover:bg-navy-50/30 dark:hover:bg-carbon-800/10 hover:border-navy-200 dark:hover:border-carbon-700'
                      }`}
                    >
                      {/* Top bar with Trip Code and Status Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold font-mono text-navy-900 dark:text-white">
                            {trip.trip_code}
                          </span>
                          <span className="text-[10px] text-navy-400 dark:text-carbon-500 font-medium">
                            • {trip.load_type}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(trip.status)}`}>
                          {trip.status}
                        </span>
                      </div>

                      {/* Path endpoints */}
                      <div className="flex flex-col gap-0.5 text-xs">
                        <div className="flex items-center gap-2 text-navy-500 dark:text-carbon-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></span>
                          <span className="truncate">{origin?.name || 'Origin Hub'}</span>
                        </div>
                        <div className="w-1.5 h-2.5 border-l border-dashed border-navy-200 dark:border-carbon-700 ml-0.75"></div>
                        <div className="flex items-center gap-2 text-navy-900 dark:text-white font-medium">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate">{dest?.name || 'Destination'}</span>
                        </div>
                      </div>

                      {/* Assets detail */}
                      <div className="flex items-center justify-between text-[10px] text-navy-500 dark:text-carbon-400 border-t border-navy-50/50 dark:border-carbon-805 pt-2 mt-1">
                        <span className="flex items-center gap-1 font-semibold">
                          <TruckIcon className="w-3 h-3 text-navy-400 dark:text-carbon-500" />
                          {truck?.license_plate || 'Unassigned'}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-navy-400 dark:text-carbon-500" />
                          {driver ? `${driver.first_name} ${driver.last_name.slice(0, 1)}.` : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Right Column: Zero-Cost Leaflet Dispatch Map Board */}
          <div className="lg:col-span-2 bg-white dark:bg-carbon-900 rounded-xl border border-navy-100 dark:border-carbon-800 overflow-hidden relative shadow-sm h-full flex flex-col">
            <div className="flex-1 w-full h-full relative" style={{ minHeight: '450px' }}>
              <div 
                ref={mapContainerRef} 
                className="w-full h-full z-10" 
                style={{ background: '#f8fafc' }}
                id="leaflet-dispatch-map"
              />
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT TRIP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-carbon-900 rounded-lg border border-navy-100 dark:border-carbon-800 w-full max-w-4xl shadow-2xl max-h-[95vh] overflow-y-auto animate-in fade-in duration-150">
            <div className="p-6 border-b border-navy-100 dark:border-carbon-800 flex justify-between items-center bg-navy-50/20 dark:bg-carbon-950/20">
              <div>
                <h2 className="text-lg font-bold text-navy-900 dark:text-white">
                  {editingId ? 'Modify Trip Details' : 'Create New Trip Advice'}
                </h2>
                <p className="text-[11px] text-navy-450 dark:text-carbon-450 mt-1 font-medium">
                  Configure assignment variables, sequence multi-drop route stops, and log references.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-navy-400 hover:text-navy-800 dark:text-carbon-400 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {(() => {
                const currentOriginalTrip = trips.find(t => String(t.id || t.trip_id) === String(editingId));
                const originalStatus = currentOriginalTrip?.status || 'Scheduled';
                const isCompletedLock = originalStatus === 'Completed';
                const isCancelledLock = originalStatus === 'Cancelled';
                const isFormFieldsDisabled = isReadOnly || isCompletedLock || isCancelledLock;

                // Obtain checkAvailability asset results
                const { busyTrucks, busyDrivers, truckToTripMap, driverToTripMap } = getAvailabilityStatus();

                // Dynamic values for cascading dropdowns
                const filteredClientCodes = MOCK_INTERNAL_CLIENT_CODES.filter(
                  icc => String(icc.client_id) === String(formData.customer_id)
                );
                const filteredConsignees = MOCK_CONSIGNEES.filter(
                  c => String(c.client_id) === String(formData.customer_id)
                );

                // Dynamically collect unique truck sizes to build size dropdown
                const uniqueTruckSizes = Array.from(new Set([
                  '10-Wheeler Wing', '6-Wheeler Closed', '12-Wheeler Reefer', '10-Wheeler Reefer', 'Flatbed Trailer',
                  ...trucks.map(t => t.truck_size).filter(Boolean)
                ]));

                // Helper list
                const helperCandidates = employees.filter(e => 
                  e.role === 'Helper' || e.employee_role_id === 'er-2'
                );

                return (
                  <>
                    {(isCompletedLock || isCancelledLock) && (
                      <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                        isCompletedLock 
                          ? 'bg-blue-50 dark:bg-blue-950/10 border-blue-200 text-blue-700 dark:text-blue-400' 
                          : 'bg-red-50 dark:bg-red-950/10 border-red-200 text-red-700 dark:text-red-400'
                      }`}>
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>
                          {isCompletedLock 
                            ? 'Completed Dispatch Run: Trip advice details are locked as read-only archive.' 
                            : 'Cancelled Dispatch Run: Logistics details are locked. Only status/notes history are editable.'}
                        </span>
                      </div>
                    )}

                    {/* REAL-TIME COLLISION INDICATORS BANNER */}
                    {(() => {
                      const warnings = getConflictWarning();
                      if (warnings && warnings.length > 0) {
                        return (
                          <div className="p-3.5 bg-amber-50/75 border border-amber-200 dark:bg-amber-950/10 dark:border-amber-900 rounded-lg flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-400 animate-pulse">
                            <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-bold uppercase tracking-wide">Real-time Asset Booking Warnings:</p>
                              <ul className="list-disc pl-4 space-y-0.5 font-medium">
                                {warnings.map((warn, wIdx) => <li key={wIdx}>{warn}</li>)}
                              </ul>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* SECTION 1: TRIP IDENTITY */}
                    <div className="bg-white dark:bg-carbon-900/40 p-4 rounded-xl border border-navy-100 dark:border-carbon-800/80 space-y-4">
                      <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-navy-50 dark:border-carbon-800 pb-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Section I: Trip Identity & Handshake
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Trip Advice Code</label>
                          <input 
                            type="text" 
                            placeholder="e.g. TRIP-2024-001"
                            className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                            value={formData.trip_code || ''}
                            onChange={(e) => setFormData({...formData, trip_code: e.target.value.toUpperCase()})}
                            required 
                            disabled={isFormFieldsDisabled || isEncoder}
                          />
                          {validationErrors.trip_code && (
                            <p className="text-red-500 text-[10.5px] mt-1 font-medium">{validationErrors.trip_code}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Dispatch Branch</label>
                          <select
                            className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                            value={formData.branch_id || ''}
                            onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                            disabled={isFormFieldsDisabled}
                            required
                          >
                            <option value="">Select Branch</option>
                            {MOCK_BRANCHES.map(b => (
                              <option key={b.id} value={b.id}>
                                {b.branch_name} ({b.branch_code})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Client / Customer</label>
                          <select 
                            className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                            value={formData.customer_id || ''}
                            onChange={(e) => setFormData({
                              ...formData, 
                              customer_id: e.target.value,
                              internal_client_code_id: undefined, // reset dependent drop
                              consignee_id: undefined // reset dependent drop
                            })}
                            required
                            disabled={isFormFieldsDisabled || isEncoder}
                          >
                            <option value="">Select Client</option>
                            {customers.map(c => {
                              const key = c.customer_id || c.id;
                              const value = c.name || c.client_name;
                              return <option key={key} value={key}>{value}</option>;
                            })}
                          </select>
                          {validationErrors.customer_id && (
                            <p className="text-red-500 text-[10.5px] mt-1 font-medium">{validationErrors.customer_id}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase flex items-center justify-between">
                            <span>Internal Client Code</span>
                            {!formData.customer_id && <span className="text-[9px] text-amber-600 font-normal italic">Requires Customer</span>}
                          </label>
                          <select
                            className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none disabled:opacity-50"
                            value={formData.internal_client_code_id || ''}
                            onChange={(e) => setFormData({...formData, internal_client_code_id: e.target.value})}
                            disabled={isFormFieldsDisabled || !formData.customer_id}
                          >
                            <option value="">Select Internal Code</option>
                            {filteredClientCodes.map(icc => (
                              <option key={icc.id} value={icc.id}>
                                {icc.code} - {icc.description}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase flex items-center justify-between">
                            <span>Consignee</span>
                            {!formData.customer_id && <span className="text-[9px] text-amber-600 font-normal italic">Requires Customer</span>}
                          </label>
                          <select
                            className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none disabled:opacity-50"
                            value={formData.consignee_id || ''}
                            onChange={(e) => setFormData({...formData, consignee_id: e.target.value})}
                            disabled={isFormFieldsDisabled || !formData.customer_id}
                          >
                            <option value="">Select Consignee</option>
                            {filteredConsignees.map(cons => (
                              <option key={cons.id} value={cons.id}>
                                {cons.full_name} ({cons.city_area || 'Custom'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Pickup Date & Time</label>
                          <input 
                            type="datetime-local" 
                            className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            value={formData.scheduled_start_time || ''}
                            onChange={(e) => setFormData({...formData, scheduled_start_time: e.target.value})}
                            required 
                            disabled={isFormFieldsDisabled || isEncoder}
                          />
                          {validationErrors.scheduled_start_time && (
                            <p className="text-red-500 text-[10.5px] mt-1 font-medium">{validationErrors.scheduled_start_time}</p>
                          )}
                        </div>

                        {editingId && (
                          <div className="col-span-1 md:col-span-2 lg:col-span-3">
                            <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Trip Execution Status</label>
                            <div className="flex flex-wrap gap-2">
                              {['Scheduled', 'In Transit', 'Completed', 'Cancelled', 'Rescue'].map((statusOption) => {
                                const isCurrent = formData.status === statusOption;
                                return (
                                  <button
                                    key={statusOption}
                                    type="button"
                                    onClick={() => setFormData({...formData, status: statusOption})}
                                    disabled={isReadOnly}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                      isCurrent 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                                        : 'bg-navy-50 dark:bg-carbon-950 hover:bg-navy-100/70 border-navy-150 text-navy-700 dark:text-carbon-400 dark:border-carbon-800'
                                    }`}
                                  >
                                    {statusOption}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 2: ASSIGNMENT OF ASSETS */}
                    <div className="bg-white dark:bg-carbon-900/40 p-4 rounded-xl border border-navy-100 dark:border-carbon-800/80 space-y-4">
                      <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-navy-50 dark:border-carbon-800 pb-2">
                        <TruckIcon className="w-4 h-4 text-blue-500" />
                        Section II: Cargo, Load Types & Crew Allocations
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Truck Size Requirement</label>
                          <select 
                            className="w-full bg-navy-50/55 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                            value={formData.truck_size || ''}
                            onChange={(e) => setFormData({...formData, truck_size: e.target.value})}
                            disabled={isFormFieldsDisabled || isEncoder}
                          >
                            <option value="">Select Size Classification</option>
                            {uniqueTruckSizes.map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Assign Transport Unit (Truck)</label>
                          <select 
                            className="w-full bg-navy-50/55 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                            value={formData.truck_id || ''}
                            onChange={(e) => setFormData({...formData, truck_id: e.target.value})}
                            required={!isFormFieldsDisabled}
                            disabled={isFormFieldsDisabled || isEncoder}
                          >
                            <option value="">Select Truck</option>
                            {(() => {
                              const sizeFiltered = trucks.filter(t => {
                                const isSelected = String(t.truck_id || t.id) === String(formData.truck_id);
                                const isDeleted = t.is_deleted;
                                const isDeactivated = t.is_active === false;
                                if (isDeleted) return false;
                                if (isDeactivated && !isSelected) return false;
                                return !formData.truck_size || t.truck_size === formData.truck_size;
                              });
                              return sizeFiltered.map(t => {
                                const tValue = t.truck_id || t.id;
                                const isBusy = busyTrucks.has(String(tValue));
                                const statusStr = t.truck_status_id || t.status || 'Available';
                                
                                let isUnavailable = false;
                                let noteStr = '';
                                
                                if (isBusy) {
                                  isUnavailable = true;
                                  noteStr = `Occupied on overlapping Run ${truckToTripMap[String(tValue)]}`;
                                } else if (String(statusStr).toLowerCase().includes('maint')) {
                                  isUnavailable = true;
                                  noteStr = "Awaiting Maintenance";
                                } else if (String(statusStr).toLowerCase().includes('inactive')) {
                                  isUnavailable = true;
                                  noteStr = "Inactive Status";
                                }

                                const isCurrentlySelected = String(tValue) === String(formData.truck_id);
                                const shouldDisable = isUnavailable && !isCurrentlySelected;

                                return (
                                  <option key={String(tValue)} value={String(tValue)} disabled={shouldDisable}>
                                    {t.plate_number || t.license_plate} ({t.truck_size}) {isUnavailable ? ` - [🚨 UNUSED: ${noteStr}]` : ' - [✅ Available]'}
                                  </option>
                                );
                              });
                            })()}
                          </select>
                          {validationErrors.truck_id && (
                            <p className="text-red-500 text-[10.5px] mt-1 font-medium">{validationErrors.truck_id}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Assign Primary Helmsman (Driver)</label>
                          <select 
                            className="w-full bg-navy-50/55 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                            value={formData.driver_id || ''}
                            onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                            required={!isFormFieldsDisabled}
                            disabled={isFormFieldsDisabled || isEncoder}
                          >
                            <option value="">Select Driver</option>
                            {drivers
                              .filter(d => {
                                const dId = d.employee_id || d.id;
                                const isCurrentlySelected = String(dId) === String(formData.driver_id);
                                const isEmployeeActive = d.is_active !== false && d.employment_status === 'Active';
                                return isEmployeeActive || isCurrentlySelected;
                              })
                              .map(d => {
                                const dId = d.employee_id || d.id;
                                const isBusy = busyDrivers.has(String(dId));
                                const empStatus = d.employment_status || 'Active';
                                const driverProfile = MOCK_DRIVERS.find(p => p.employee_id === d.id || p.id === d.id || p.employee_id === d.employee_id);
                                
                                const isLicenseExpired = driverProfile?.license_expiry ? new Date(driverProfile.license_expiry) < new Date('2026-06-15') : false;
                                const availabilityStatus = driverProfile?.availability_status || 'Available';
                                const isNotAvailable = availabilityStatus !== 'Available';

                                let isUnavailable = false;
                                let noteStr = '';
                                
                                if (isBusy) {
                                  isUnavailable = true;
                                  noteStr = `Assigned on Active Run ${driverToTripMap[String(dId)]}`;
                                } else if (empStatus !== 'Active' || d.is_active === false) {
                                  isUnavailable = true;
                                  noteStr = `Status: Inactive`;
                                } else if (isLicenseExpired) {
                                  isUnavailable = true;
                                  noteStr = `License Expired (${driverProfile?.license_expiry})`;
                                } else if (isNotAvailable) {
                                  isUnavailable = true;
                                  noteStr = `Driver Status: ${availabilityStatus}`;
                                }

                                const isCurrentlySelected = String(dId) === String(formData.driver_id);
                                const shouldDisable = isUnavailable && !isCurrentlySelected;

                                return (
                                  <option key={String(dId)} value={String(dId)} disabled={shouldDisable}>
                                    {d.first_name} {d.last_name} ({d.employee_code || dId}) {isUnavailable ? ` - [🚨 UNUSED: ${noteStr}]` : ' - [✅ Available]'}
                                  </option>
                                );
                              })}
                          </select>
                          {validationErrors.driver_id && (
                            <p className="text-red-500 text-[10.5px] mt-1 font-medium">{validationErrors.driver_id}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Helper Assistant Crew 1</label>
                          <select 
                            className="w-full bg-navy-50/55 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                            value={formData.helper1_employee_id || ''}
                            onChange={(e) => setFormData({...formData, helper1_employee_id: e.target.value || undefined})}
                            disabled={isFormFieldsDisabled}
                          >
                            <option value="">Select Helper 1 (Optional)</option>
                            {helperCandidates.map(h => (
                              <option key={h.employee_id || h.id} value={h.employee_id || h.id}>
                                {h.first_name} {h.last_name}
                              </option>
                            ))}
                          </select>
                          {validationErrors.helper1 && (
                            <p className="text-red-500 text-[10.5px] mt-1 font-medium">{validationErrors.helper1}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Helper Assistant Crew 2</label>
                          <select 
                            className="w-full bg-navy-50/55 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                            value={formData.helper2_employee_id || ''}
                            onChange={(e) => setFormData({...formData, helper2_employee_id: e.target.value || undefined})}
                            disabled={isFormFieldsDisabled}
                          >
                            <option value="">Select Helper 2 (Optional)</option>
                            {helperCandidates.map(h => (
                              <option key={h.employee_id || h.id} value={h.employee_id || h.id}>
                                {h.first_name} {h.last_name}
                              </option>
                            ))}
                          </select>
                          {validationErrors.helper2 && (
                            <p className="text-red-500 text-[10.5px] mt-1 font-medium">{validationErrors.helper2}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Load Commodity Category</label>
                          <select 
                            className="w-full bg-navy-50/55 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                            value={formData.load_type || 'Dry'}
                            onChange={(e) => setFormData({...formData, load_type: e.target.value as LoadType})}
                            disabled={isReadOnly || isEncoder}
                          >
                            <option value="Dry">Dry Goods</option>
                            <option value="Chilled">Chilled</option>
                            <option value="Ref">Frozen Reefers</option>
                            <option value="Combi">Combi Compartments</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: ROUTE/STOPS TIMELINE */}
                    <div className="bg-white dark:bg-carbon-900/40 p-4 rounded-xl border border-navy-100 dark:border-carbon-800/80 space-y-4">
                      <div className="flex justify-between items-center border-b border-navy-50 dark:border-carbon-800 pb-2">
                        <div>
                          <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            Section III: Waypoint stops Sequencing Nodes
                          </h3>
                        </div>
                        {!isFormFieldsDisabled && (
                          <button
                            type="button"
                            onClick={handleAddStop}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold tracking-wide transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add New Stop Node
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {formStops.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed border-navy-100 dark:border-carbon-800 rounded-lg text-navy-400 dark:text-carbon-500">
                             <MapPin className="w-6 h-6 mx-auto mb-1.5 opacity-50 text-blue-400" />
                             <p className="text-xs font-bold">No route stops configured.</p>
                             <p className="text-[10px] mt-0.5">Please add at least one Pickup and one Drop stop to authorize scheduling.</p>
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            {formStops.map((stop, index) => {
                              const isPickup = stop.stop_type === 'Pickup';
                              const isConfirmingDelete = confirmDeleteStopId === stop.id;

                              return (
                                <div key={stop.id} className="relative bg-navy-50/15 dark:bg-carbon-950/25 border border-navy-100 dark:border-carbon-800 rounded-lg p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 transition-shadow hover:shadow-xs border-l-4 border-l-blue-500">
                                  
                                  {/* Delete inline visual overlay check */}
                                  {isConfirmingDelete && (
                                    <div className="absolute inset-0 bg-white/95 dark:bg-carbon-900/98 backdrop-blur-xs rounded-lg flex items-center justify-between px-6 py-2.5 z-20 animate-in fade-in duration-100">
                                      <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-red-100 dark:bg-red-950/30 rounded">
                                          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-navy-900 dark:text-white">Delete routing node #{index + 1} from sequence?</p>
                                          <p className="text-[10px] text-navy-450 dark:text-carbon-450 mt-0.5">This deletes the scheduled stop variables irreversibly.</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <button 
                                          type="button" 
                                          onClick={() => handleCancelRemoveStop()}
                                          className="px-2.5 py-1 text-[10px] font-bold bg-navy-50 hover:bg-navy-100 dark:bg-carbon-800 dark:hover:bg-carbon-750 text-navy-700 dark:text-carbon-300 rounded border border-navy-150"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          type="button" 
                                          onClick={() => handleExecuteRemoveStop(stop.id)}
                                          className="px-2.5 py-1 text-[10px] font-bold bg-red-650 text-white rounded hover:bg-red-700"
                                        >
                                          Confirm Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Sequence Indicator and Node Toggle */}
                                  <div className="md:col-span-2 flex flex-row md:flex-col justify-between md:justify-center items-start border-r border-navy-50 dark:border-carbon-850/30 pr-1 gap-2">
                                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-navy-550 dark:text-carbon-400">
                                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-navy-900 dark:bg-carbon-800 text-white font-mono text-[10px]">
                                        {index + 1}
                                      </span>
                                      NODE
                                    </span>
                                    <select
                                      className={`text-[11px] font-bold uppercase py-0.5 px-2 rounded-full border focus:outline-none cursor-pointer ${
                                        isPickup 
                                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300' 
                                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300'
                                      }`}
                                      value={stop.stop_type}
                                      onChange={(e) => handleStopChange(stop.id, 'stop_type', e.target.value)}
                                      disabled={isFormFieldsDisabled}
                                    >
                                      <option value="Pickup">Pickup</option>
                                      <option value="Dropoff">Drop</option>
                                    </select>
                                  </div>

                                  {/* Base location picker */}
                                  <div className="md:col-span-3">
                                    <label className="block text-[10px] uppercase font-semibold text-navy-450 dark:text-carbon-500 mb-1">Logistics Core Terminal</label>
                                    <select
                                      className="w-full bg-navy-50/55 dark:bg-carbon-950 border border-navy-150 dark:border-carbon-800 rounded px-2 py-1 text-xs text-navy-900 dark:text-white focus:outline-none"
                                      value={stop.location_id || ''}
                                      onChange={(e) => handleStopChange(stop.id, 'location_id', e.target.value)}
                                      disabled={isFormFieldsDisabled}
                                    >
                                      <option value="">Select Base Terminal</option>
                                      {locations.map(loc => {
                                        const mId = loc.location_id || loc.id;
                                        const mName = loc.name || loc.location_name;
                                        return (
                                          <option key={String(mId)} value={String(mId)}>
                                            {mName} {loc.location_type === 'Hub' ? '(Hub)' : ''}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>

                                  {/* Specific Customer Address */}
                                  <div className="md:col-span-3">
                                    <label className="block text-[10px] uppercase font-semibold text-navy-450 dark:text-carbon-500 mb-1">Site / Specific Address</label>
                                    <input
                                      type="text"
                                      className="w-full bg-navy-50/55 dark:bg-carbon-950 border border-navy-150 dark:border-carbon-800 rounded px-2 py-1 text-xs text-navy-900 dark:text-white focus:outline-none"
                                      placeholder="e.g. Warehouse Gate 3 / Store Site"
                                      value={stop.specific_address || ''}
                                      onChange={(e) => handleStopChange(stop.id, 'specific_address', e.target.value)}
                                      disabled={isFormFieldsDisabled}
                                    />
                                  </div>

                                  {/* District City Area */}
                                  <div className="md:col-span-2">
                                    <label className="block text-[10px] uppercase font-semibold text-navy-450 dark:text-carbon-500 mb-1">City / Catchment Area</label>
                                    <input
                                      type="text"
                                      className="w-full bg-navy-50/55 dark:bg-carbon-950 border border-navy-150 dark:border-carbon-800 rounded px-2 py-1 text-xs text-navy-900 dark:text-white focus:outline-none"
                                      placeholder="e.g. Mandaue City"
                                      value={stop.city_area || ''}
                                      onChange={(e) => handleStopChange(stop.id, 'city_area', e.target.value)}
                                      disabled={isFormFieldsDisabled}
                                    />
                                  </div>

                                  {/* Reordering Up/Down controls */}
                                  <div className="md:col-span-2 flex items-end justify-end gap-1.5">
                                    {!isFormFieldsDisabled && (
                                      <>
                                        <button
                                          type="button"
                                          title="Move Node Sequence Up"
                                          disabled={index === 0}
                                          onClick={() => handleMoveStop(index, 'up')}
                                          className="p-1 border border-navy-150 dark:border-carbon-800 bg-white dark:bg-carbon-900 rounded hover:bg-navy-50 dark:hover:bg-carbon-800 text-navy-500 disabled:opacity-30 self-center md:self-end"
                                        >
                                          <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          title="Move Node Sequence Down"
                                          disabled={index === formStops.length - 1}
                                          onClick={() => handleMoveStop(index, 'down')}
                                          className="p-1 border border-navy-150 dark:border-carbon-800 bg-white dark:bg-carbon-900 rounded hover:bg-navy-50 dark:hover:bg-carbon-800 text-navy-500 disabled:opacity-30 self-center md:self-end"
                                        >
                                          <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          title="Delete Node Stop"
                                          onClick={() => handleConfirmRemoveStop(stop.id)}
                                          className="p-1 border border-red-200 dark:border-red-950 bg-red-50 dark:bg-red-950/20 rounded hover:bg-red-100 text-red-650 self-center md:self-end"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  {/* Inline Detailed Instructions */}
                                  <div className="md:col-span-12 mt-1 border-t border-dashed border-navy-100 dark:border-carbon-800 pt-2 flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-navy-500 dark:text-carbon-400">Loading instructions / notes:</span>
                                    <input
                                      type="text"
                                      className="flex-1 bg-transparent border-0 border-b border-navy-100 dark:border-carbon-800 focus:border-blue-500 p-0 text-xs text-navy-700 dark:text-carbon-300 focus:outline-none font-medium italic"
                                      placeholder="Specific instruction tags (e.g., call consignee 1 hr ahead, look for Guard Santos, gate pass red tape)..."
                                      value={stop.notes || ''}
                                      onChange={(e) => handleStopChange(stop.id, 'notes', e.target.value)}
                                      disabled={isFormFieldsDisabled}
                                    />
                                  </div>

                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Stops list structural validation alerts */}
                      {(validationErrors.stops || validationErrors.stops_drop) && (
                        <div className="p-3 bg-red-50/40 dark:bg-red-950/20 border border-red-150 rounded-lg text-xs text-red-700 space-y-1.5 font-medium">
                          {validationErrors.stops && <p className="flex items-center gap-1">❌ {validationErrors.stops}</p>}
                          {validationErrors.stops_drop && <p className="flex items-center gap-1">❌ {validationErrors.stops_drop}</p>}
                        </div>
                      )}
                    </div>

                    {/* SECTION 4: CARGO AND REFERENCES */}
                    <div className="bg-white dark:bg-carbon-900/40 p-4 rounded-xl border border-navy-100 dark:border-carbon-800/80 space-y-4">
                      <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-navy-50 dark:border-carbon-800 pb-2">
                        <Layers className="w-4 h-4 text-blue-500" />
                        Section IV: Logistics payload details & References
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Loading Reference Number</label>
                          <input 
                            type="text" 
                            className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                            placeholder="e.g. BILL-OF-LADING-9938"
                            value={formData.loading_ref_no || ''}
                            onChange={(e) => setFormData({...formData, loading_ref_no: e.target.value})}
                            disabled={isFormFieldsDisabled}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">Net Weight Cargo (kg)</label>
                          <input 
                            type="number" 
                            className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                            placeholder="e.g. 5200"
                            value={formData.net_weight !== undefined ? formData.net_weight : 0}
                            onChange={(e) => setFormData({...formData, net_weight: Number(e.target.value)})}
                            disabled={isFormFieldsDisabled}
                            min="0"
                          />
                          {validationErrors.net_weight && (
                            <p className="text-red-500 text-[10.5px] mt-1 font-medium">{validationErrors.net_weight}</p>
                          )}
                        </div>

                        {/* Cargo transfer logs structure */}
                        <div className="col-span-1 md:col-span-2">
                          <div className="p-3 bg-navy-50/40 dark:bg-carbon-950/20 border border-navy-150 dark:border-carbon-850 rounded-lg">
                            <div className="flex items-center gap-2">
                              <input
                                id="is_transfer_trigger"
                                type="checkbox"
                                className="rounded border-navy-300 text-blue-605 focus:ring-blue-500 h-4 w-4 bg-white dark:bg-carbon-900 cursor-pointer"
                                checked={!!formData.is_transfer}
                                onChange={(e) => setFormData({
                                  ...formData, 
                                  is_transfer: e.target.checked,
                                  transfer_from_id: e.target.checked ? formData.transfer_from_id : undefined
                                })}
                                disabled={isFormFieldsDisabled}
                              />
                              <label htmlFor="is_transfer_trigger" className="text-xs font-semibold text-navy-750 dark:text-carbon-300 cursor-pointer select-none">
                                This trip represents a transfer shipment from another source trip advice (Inter-run cargo transfer)
                              </label>
                            </div>

                            {formData.is_transfer && (
                              <div className="mt-3 animate-in slide-in-from-top-1.5 duration-200">
                                <label className="block text-[10.5px] font-bold text-navy-550 dark:text-carbon-400 mb-1.5 uppercase">Select Originating (Source) Trip Advice Run</label>
                                <select
                                  className="w-full bg-white dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none"
                                  value={formData.transfer_from_id || ''}
                                  onChange={(e) => setFormData({...formData, transfer_from_id: e.target.value})}
                                  disabled={isFormFieldsDisabled}
                                >
                                  <option value="">Choose Source Trip Code</option>
                                  {trips.filter(t => String(t.id || t.trip_id) !== String(editingId)).map(t => (
                                    <option key={t.id || t.trip_id} value={t.id || t.trip_id}>
                                      {t.trip_advise_code || t.trip_code || t.id} ({t.pickup_date || 'No Date'}) - Client: {(() => {
                                        const cObj = getCustomerObject(t.customer_id);
                                        return cObj ? (cObj.name || cObj.client_name) : 'Unknown';
                                      })()}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-[11px] font-semibold text-navy-550 dark:text-carbon-450 mb-1.5 uppercase">General Dispatch Instructions / Remarks</label>
                          <textarea
                            className="w-full bg-navy-50/50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2 text-xs text-navy-900 dark:text-white focus:outline-none min-h-[75px]"
                            placeholder="Specify general carrier instructions, contact milestones, or general client demands assigned to this logistics route advice..."
                            value={formData.remarks || ''}
                            onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                            disabled={isFormFieldsDisabled}
                          />
                        </div>
                      </div>
                    </div>

                    {/* MODAL BOTTOM BAR BUTTONS */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-navy-100 dark:border-carbon-800 justify-end">
                      {isFormFieldsDisabled ? (
                        <button 
                          type="button" 
                          onClick={() => setIsModalOpen(false)}
                          className="px-6 py-2 bg-navy-900 dark:bg-white text-white dark:text-black rounded-lg transition-colors text-xs font-bold shadow-md hover:bg-navy-800"
                        >
                          Dismiss (Logistics View Only)
                        </button>
                      ) : (
                        <>
                          <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 dark:bg-carbon-800 dark:border-carbon-700 dark:hover:bg-carbon-750 text-navy-700 dark:text-white rounded-lg transition-colors text-xs font-semibold"
                          >
                            Cancel & Clear Variables
                          </button>

                          {/* Save Draft Action - only during creation of new schedules */}
                          {!editingId && (
                            <button 
                              type="button" 
                              onClick={() => handleSave(true)}
                              className="px-4 py-2.5 bg-navy-100 hover:bg-navy-150 dark:bg-carbon-800 dark:hover:bg-carbon-700 text-navy-900 dark:text-white rounded-lg transition-colors text-xs font-semibold"
                            >
                              Save Draft Advice
                            </button>
                          )}

                          {/* Schedule Trip Action */}
                          <button 
                            type="submit" 
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-bold shadow-md"
                          >
                            {editingId ? 'Save Changes' : 'Schedule Trip'}
                          </button>
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripList;