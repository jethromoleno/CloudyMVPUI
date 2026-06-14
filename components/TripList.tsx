import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Trip, TripStatusType, Employee, Customer, Location, Truck, LoadType, Theme } from '../types';
import { 
  Plus, MapPin, User, FileText, Truck as TruckIcon, Settings, X, 
  Calendar as CalendarIcon, List as ListIcon, ChevronLeft, ChevronRight,
  Map as MapIcon, Search, ZoomIn, ZoomOut, Compass, Activity, RotateCcw, Info,
  AlertTriangle, Loader2
} from 'lucide-react';

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
  trips, setTrips, employees, customers, locations, trucks, theme, isLoading = false, error = null
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [cancelTripConfirm, setCancelTripConfirm] = useState<{
    trip: Trip;
    onConfirm: () => void;
  } | null>(null);
  
  // Custom View Mode State: default to Calendar View for prominent and beautiful schedule display
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'map'>('calendar');
  
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
  });

  // Form State
  const initialFormState: Partial<Trip> = {
    trip_code: '',
    customer_id: undefined,
    truck_id: undefined,
    driver_id: undefined,
    origin_location_id: undefined,
    destination_location_id: undefined,
    scheduled_start_time: '',
    status: 'Scheduled',
    load_type: 'Dry',
    net_weight: 0,
    loading_ref_no: ''
  };

  const [formData, setFormData] = useState<Partial<Trip>>(initialFormState);

  const handleOpenModal = (trip?: Trip) => {
    if (trip) {
      setEditingId(trip.trip_id);
      // Format date for datetime-local input (YYYY-MM-DDThh:mm)
      const formattedDate = trip.scheduled_start_time.length > 16 
        ? trip.scheduled_start_time.slice(0, 16) 
        : trip.scheduled_start_time;

      setFormData({
        ...trip,
        scheduled_start_time: formattedDate
      });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleAddTripForDate = (date: Date) => {
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const localDateTime = `${yearStr}-${monthStr}-${dayStr}T08:00`;
    
    setEditingId(null);
    setFormData({
      ...initialFormState,
      scheduled_start_time: localDateTime
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.truck_id || !formData.origin_location_id) return;

    if (editingId) {
      // Update Existing Trip
      const updatedTrip: Trip = {
        ...formData as Trip,
        id: String(editingId),
        trip_id: String(editingId), // Ensure ID persists
        scheduled_start_time: formData.scheduled_start_time || new Date().toISOString()
      };

      const originalTrip = trips.find(t => t.trip_id === editingId || t.id === editingId);
      const isChangingToCancelled = updatedTrip.status === 'Cancelled' && originalTrip?.status !== 'Cancelled';

      if (isChangingToCancelled) {
        setCancelTripConfirm({
          trip: updatedTrip,
          onConfirm: () => {
            setTrips(trips.map(t => t.trip_id === editingId || t.id === editingId ? updatedTrip : t));
            setIsModalOpen(false);
            setFormData(initialFormState);
          }
        });
        return;
      }
      
      setTrips(trips.map(t => t.trip_id === editingId || t.id === editingId ? updatedTrip : t));
    } else {
      // Create New Trip
      const randomId = 'trip-' + (Math.floor(Math.random() * 10000) + 1000);
      const newTrip: Trip = {
        id: randomId,
        trip_id: randomId,
        trip_advise_code: formData.trip_code || `TRIP-${Math.floor(Math.random() * 1000)}`,
        trip_code: formData.trip_code || `TRIP-${Math.floor(Math.random() * 1000)}`,
        branch_id: 'branch-1',
        encoder_employee_id: 'emp-2',
        status_id: 'status-sched',
        client_id: String(formData.customer_id),
        customer_id: String(formData.customer_id),
        pickup_date: (formData.scheduled_start_time || new Date().toISOString()).split('T')[0],
        pickup_time_window: '08:00 AM - 12:00 PM',
        truck_size: '10-Wheeler Wing',
        load_type_id: 'load-dry',
        truck_id: String(formData.truck_id),
        driver_id: String(formData.driver_id),
        is_stripper_used: false,
        is_transfer: false,
        remarks: '',
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        origin_location_id: String(formData.origin_location_id),
        destination_location_id: String(formData.destination_location_id),
        scheduled_start_time: formData.scheduled_start_time || new Date().toISOString(),
        status: formData.status || 'Scheduled',
        load_type: String(formData.load_type),
        net_weight: Number(formData.net_weight),
        loading_ref_no: formData.loading_ref_no
      };
      setTrips([...trips, newTrip]);
    }

    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  const getStatusColor = (status: TripStatusType) => {
    switch (status) {
      case 'In Transit': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 border-blue-200 dark:border-blue-400/20';
      case 'Completed': return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20';
      case 'Cancelled': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border-red-200 dark:border-red-400/20';
      case 'Scheduled': return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20';
      default: return 'text-navy-600 dark:text-carbon-400 bg-navy-100 dark:bg-carbon-800 border-navy-200 dark:border-carbon-700';
    }
  };

  const getTripBadgeStyles = (status: TripStatusType) => {
    switch (status) {
      case 'In Transit': return 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/65 dark:text-blue-300 dark:border-blue-800/50';
      case 'Completed': return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/65 dark:text-emerald-300 dark:border-emerald-800/50';
      case 'Cancelled': return 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/65 dark:text-red-300 dark:border-red-800/50';
      case 'Scheduled': return 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/65 dark:text-amber-300 dark:border-amber-800/50';
      default: return 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-carbon-800/40 dark:hover:bg-carbon-800/80 dark:text-carbon-300 dark:border-carbon-700/50';
    }
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

          <button 
            onClick={() => handleOpenModal()}
            className="bg-navy-900 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-200 text-white dark:text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-navy-900/20 dark:shadow-none text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Trip Advice
          </button>
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
                      <button
                        onClick={() => handleAddTripForDate(day.date)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-navy-100 dark:hover:bg-carbon-800 rounded text-navy-500 dark:text-carbon-400 hover:text-navy-900 dark:hover:text-white"
                        title={`Add Trip on ${day.date.toLocaleDateString()}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
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
        <div className="bg-white dark:bg-carbon-900 rounded-lg border border-navy-100 dark:border-carbon-800 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-50 dark:bg-carbon-900 border-b border-navy-100 dark:border-carbon-800 text-navy-500 dark:text-carbon-400 text-xs uppercase tracking-wider font-semibold">
                <th className="p-4">Trip Code</th>
                <th className="p-4">Route</th>
                <th className="p-4">Assets (Truck/Driver)</th>
                <th className="p-4">Customer/Load</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Modify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50 dark:divide-carbon-800 text-sm">
              {trips.map((trip) => {
                const customer = customers.find(c => c.customer_id === trip.customer_id);
                const driver = employees.find(e => e.employee_id === trip.driver_id);
                const truck = trucks.find(t => t.truck_id === trip.truck_id);
                const origin = locations.find(l => l.location_id === trip.origin_location_id);
                const dest = locations.find(l => l.location_id === trip.destination_location_id);

                return (
                  <React.Fragment key={trip.trip_id}>
                    <tr className="hover:bg-navy-50 dark:hover:bg-carbon-800/50 transition-colors group">
                      <td className="p-4">
                        <div className="font-mono text-navy-900 dark:text-white font-medium">{trip.trip_code}</div>
                        <div className="text-navy-500 dark:text-carbon-500 text-xs mt-1">{new Date(trip.scheduled_start_time).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-navy-600 dark:text-carbon-300">
                            <span className={`w-2 h-2 rounded-full ${origin?.is_hub ? 'bg-purple-500' : 'bg-navy-400'}`}></span>
                            {origin?.name}
                          </div>
                          <div className="ml-1 border-l border-navy-200 dark:border-carbon-700 h-3"></div>
                          <div className="flex items-center gap-2 text-navy-900 dark:text-white font-medium">
                            <MapPin className="w-3 h-3 text-red-500" />
                            {dest?.name}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-navy-600 dark:text-carbon-300 flex items-center gap-2">
                          <TruckIcon className="w-3 h-3" /> {truck?.license_plate} <span className="text-navy-400 dark:text-carbon-500 text-xs">({truck?.tonner_capacity}T)</span>
                        </div>
                        <div className="text-navy-500 dark:text-carbon-500 text-xs mt-1 flex items-center gap-2">
                           <User className="w-3 h-3" /> {driver?.first_name} {driver?.last_name}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-navy-900 dark:text-white font-medium">{customer?.name}</div>
                        <div className="text-navy-500 dark:text-carbon-500 text-xs mt-1">{trip.load_type} • {trip.net_weight?.toLocaleString()} kg</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(trip.status)}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleOpenModal(trip)}
                          className="text-navy-400 hover:text-navy-900 dark:text-carbon-400 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-navy-100 dark:hover:bg-carbon-800"
                          title="Modify Trip"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
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
          <div className="bg-white dark:bg-carbon-900 rounded-lg border border-navy-100 dark:border-carbon-800 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-navy-100 dark:border-carbon-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-navy-900 dark:text-white">
                {editingId ? 'Modify Trip Details' : 'Create New Trip Advice'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-navy-400 hover:text-navy-800 dark:text-carbon-400 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-navy-500 dark:text-carbon-400 mb-2 uppercase">Trip Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. TRIP-2024-001"
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:border-navy-400 dark:focus:border-carbon-600 focus:outline-none focus:ring-1 focus:ring-navy-400 dark:focus:ring-carbon-600 transition-all"
                    value={formData.trip_code}
                    onChange={(e) => setFormData({...formData, trip_code: e.target.value})}
                    required 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-navy-500 dark:text-carbon-400 mb-2 uppercase">Scheduled Date</label>
                  <input 
                    type="datetime-local" 
                    className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:border-navy-400 dark:focus:border-carbon-600 focus:outline-none focus:ring-1 focus:ring-navy-400 dark:focus:ring-carbon-600 transition-all"
                    value={formData.scheduled_start_time}
                    onChange={(e) => setFormData({...formData, scheduled_start_time: e.target.value})}
                    required 
                  />
                </div>

                <div className="col-span-2 border-t border-navy-100 dark:border-carbon-800 pt-4">
                   <h3 className="text-sm font-semibold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                     <FileText className="w-4 h-4 text-navy-400 dark:text-carbon-400" /> Logistics Details
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-navy-500 dark:text-carbon-400 mb-1">Customer</label>
                        <select 
                          className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:outline-none"
                          value={formData.customer_id || ''}
                          onChange={(e) => setFormData({...formData, customer_id: Number(e.target.value)})}
                          required
                        >
                          <option value="">Select Customer</option>
                          {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-500 dark:text-carbon-400 mb-1">Load Type</label>
                        <select 
                          className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:outline-none"
                          value={formData.load_type}
                          onChange={(e) => setFormData({...formData, load_type: e.target.value as LoadType})}
                        >
                          <option value="Dry">Dry Goods</option>
                          <option value="Chilled">Chilled</option>
                          <option value="Ref">Frozen/Reefer</option>
                          <option value="Combi">Combi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-500 dark:text-carbon-400 mb-1">Origin (Pickup)</label>
                        <select 
                          className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:outline-none"
                          value={formData.origin_location_id || ''}
                          onChange={(e) => setFormData({...formData, origin_location_id: Number(e.target.value)})}
                          required
                        >
                          <option value="">Select Origin</option>
                          {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.name} {l.is_hub ? '(Hub)' : ''}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-500 dark:text-carbon-400 mb-1">Destination (Drop)</label>
                        <select 
                          className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:outline-none"
                          value={formData.destination_location_id || ''}
                          onChange={(e) => setFormData({...formData, destination_location_id: Number(e.target.value)})}
                          required
                        >
                          <option value="">Select Destination</option>
                          {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.name}</option>)}
                        </select>
                      </div>
                   </div>
                </div>

                <div className="col-span-2 border-t border-navy-100 dark:border-carbon-800 pt-4">
                   <h3 className="text-sm font-semibold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                     <TruckIcon className="w-4 h-4 text-navy-400 dark:text-carbon-400" /> Asset Assignment
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-navy-500 dark:text-carbon-400 mb-1">Assign Truck</label>
                        <select 
                          className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:outline-none"
                          value={formData.truck_id || ''}
                          onChange={(e) => setFormData({...formData, truck_id: Number(e.target.value)})}
                          required
                        >
                          <option value="">Select Truck</option>
                          {trucks.map(t => <option key={t.truck_id} value={t.truck_id}>{t.license_plate} ({t.tonner_capacity}T)</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-500 dark:text-carbon-400 mb-1">Assign Driver</label>
                        <select 
                          className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:outline-none"
                          value={formData.driver_id || ''}
                          onChange={(e) => setFormData({...formData, driver_id: Number(e.target.value)})}
                          required
                        >
                          <option value="">Select Driver</option>
                          {drivers.map(d => <option key={d.employee_id} value={d.employee_id}>{d.first_name} {d.last_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-500 dark:text-carbon-400 mb-1">Net Weight (kg)</label>
                        <input 
                          type="number" 
                          className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:outline-none"
                          value={formData.net_weight}
                          onChange={(e) => setFormData({...formData, net_weight: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-navy-500 dark:text-carbon-400 mb-1">Ref No.</label>
                        <input 
                          type="text" 
                          className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:outline-none"
                          value={formData.loading_ref_no}
                          onChange={(e) => setFormData({...formData, loading_ref_no: e.target.value})}
                          placeholder="Doc #"
                        />
                      </div>
                      
                      {editingId && (
                        <div className="col-span-2">
                           <label className="block text-xs font-medium text-navy-500 dark:text-carbon-400 mb-1">Trip Status</label>
                           <select 
                              className="w-full bg-navy-50 dark:bg-carbon-950 border border-navy-200 dark:border-carbon-800 rounded-md p-2.5 text-navy-900 dark:text-white focus:outline-none"
                              value={formData.status}
                              onChange={(e) => setFormData({...formData, status: e.target.value as TripStatusType})}
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="In Transit">In Transit</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                              <option value="Rescue">Rescue</option>
                            </select>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-navy-200 dark:bg-carbon-800 dark:border-carbon-700 hover:bg-navy-50 dark:hover:bg-carbon-700 text-navy-700 dark:text-white py-2.5 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-navy-900 dark:bg-white hover:bg-navy-800 dark:hover:bg-gray-200 text-white dark:text-black py-2.5 rounded-lg transition-colors text-sm font-semibold shadow-md shadow-navy-900/10 dark:shadow-none"
                >
                  {editingId ? 'Save Changes' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripList;