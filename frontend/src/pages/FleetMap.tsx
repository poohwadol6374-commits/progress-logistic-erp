import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Truck, MapPin, Navigation, Package } from 'lucide-react';
import './FleetMap.css';

// Fix for default Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons
const createTruckIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-truck-marker',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-9l-3.5-3H14v12h3"/><path d="M14 17h-4"/><circle cx="8.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/></svg>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const HQ_ICON = L.divIcon({
  className: 'custom-hq-marker',
  html: `<div style="background-color: #10b981; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid white;">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Province Coordinates Mapping
const PROVINCE_COORDS: Record<string, [number, number]> = {
  'กรุงเทพมหานคร': [13.7563, 100.5018],
  'เชียงใหม่': [18.7883, 98.9853],
  'ขอนแก่น': [16.4322, 102.8236],
  'สงขลา': [7.1898, 100.5954],
  'ภูเก็ต': [7.8804, 98.3923],
  'ชลบุรี': [13.3611, 100.9847],
  'นครราชสีมา': [14.9799, 102.0978],
  'ระยอง': [12.6814, 101.2816],
  'สุราษฎร์ธานี': [9.1333, 99.3167],
  'อุดรธานี': [17.4138, 102.7872],
};

const HQ_COORD: [number, number] = PROVINCE_COORDS['กรุงเทพมหานคร'];

interface ActiveVehicle {
  id: string;
  plate: string;
  status: string;
  bill: any;
  currentCoord: [number, number];
  targetCoord: [number, number];
  progress: number;
}

export default function FleetMap() {
  const [loading, setLoading] = useState(true);
  const [activeVehicles, setActiveVehicles] = useState<ActiveVehicle[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // In a real app, this would be a single optimized query
      const vehiclesRes = await fetch('http://localhost:3000/api/vehicles');
      const billsRes = await fetch('http://localhost:3000/api/bills/all');
      
      if (vehiclesRes.ok && billsRes.ok) {
        const vehicles = await vehiclesRes.json();
        const bills = await billsRes.json();

        // Process data for simulation
        const simulated: ActiveVehicle[] = [];
        
        vehicles.forEach((v: any) => {
          if (v.status === 'ASSIGNED' || v.status === 'IN_TRANSIT') {
            const activeBill = bills.find((b: any) => b.vehicleId === v.id && (b.status === 'ASSIGNED' || b.status === 'IN_TRANSIT' || b.status === 'DEPARTED'));
            
            if (activeBill) {
              const targetCoord = PROVINCE_COORDS[activeBill.province] || [
                HQ_COORD[0] + (Math.random() - 0.5) * 5,
                HQ_COORD[1] + (Math.random() - 0.5) * 5
              ];

              // Simulate progress based on createdAt (mocking logic)
              const createdAt = new Date(activeBill.createdAt).getTime();
              const now = new Date().getTime();
              const diffHours = (now - createdAt) / (1000 * 60 * 60);
              let progress = Math.min(diffHours / 24, 0.8); // Max 80% for visual sake, assumes 24h trip
              
              if (progress < 0.1) progress = 0.2; // Show at least some movement

              const currentCoord: [number, number] = [
                HQ_COORD[0] + (targetCoord[0] - HQ_COORD[0]) * progress,
                HQ_COORD[1] + (targetCoord[1] - HQ_COORD[1]) * progress
              ];

              simulated.push({
                id: v.id,
                plate: v.plate,
                status: v.status,
                bill: activeBill,
                currentCoord,
                targetCoord,
                progress: Math.round(progress * 100)
              });
            }
          }
        });

        setActiveVehicles(simulated);
      }
    } catch (error) {
      console.error('Failed to fetch fleet data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-full flex justify-center items-center"><Loader2 size={48} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="fleet-map-page h-full flex flex-col gap-6">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1 className="page-title flex items-center gap-3 text-3xl font-extrabold tracking-tight">
            <Navigation size={32} className="text-blue-500" /> 
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Live Fleet Map</span>
          </h1>
          <p className="page-subtitle text-slate-400 mt-2">แผนที่ติดตามสถานะรถบรรทุกและเส้นทางจัดส่งแบบเรียลไทม์ (Simulated)</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Sidebar: Active Fleet */}
        <div className="w-1/3 max-w-sm glass-panel p-4 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
            <Truck size={20} className="text-orange-500" /> 
            Active Fleet ({activeVehicles.length})
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {activeVehicles.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">ไม่มีรถที่กำลังวิ่งงานในขณะนี้</div>
            ) : (
              activeVehicles.map(v => (
                <div key={v.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white text-lg">{v.plate}</span>
                    <span className="badge bg-blue-500/20 text-blue-400 border-none text-xs">{v.progress}% เดินทาง</span>
                  </div>
                  
                  <div className="text-sm text-gray-400 space-y-1 mt-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-500" /> 
                      <span className="truncate">ต้นทาง: สำนักงานใหญ่ กทม.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-orange-500" /> 
                      <span className="truncate">ปลายทาง: {v.bill.province}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-purple-400" /> 
                      <span className="truncate">บิล: {v.bill.billNumber}</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2 mt-4 overflow-hidden border border-white/5">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{ width: `${v.progress}%` }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 map-container relative">
          <MapContainer 
            center={[13.5, 100.5]} 
            zoom={6} 
            style={{ height: '100%', width: '100%', background: '#0f172a' }}
            zoomControl={false}
          >
            {/* Dark Mode Map Tiles (CartoDB Dark Matter) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {/* HQ Marker */}
            <Marker position={HQ_COORD} icon={HQ_ICON}>
              <Popup className="custom-popup">
                <div className="font-bold text-emerald-400 text-lg mb-1">HQ / Warehouse</div>
                <div className="text-sm text-gray-300">กรุงเทพมหานคร</div>
              </Popup>
            </Marker>

            {/* Active Vehicles Routes & Markers */}
            {activeVehicles.map(v => (
              <div key={`route-${v.id}`}>
                {/* Route Line */}
                <Polyline 
                  positions={[HQ_COORD, v.targetCoord]} 
                  pathOptions={{ color: '#3b82f6', weight: 3, dashArray: '5, 10', opacity: 0.5 }} 
                />
                
                {/* Vehicle Marker */}
                <Marker position={v.currentCoord} icon={createTruckIcon('#f97316')}>
                  <Popup>
                    <div className="min-w-[150px]">
                      <div className="font-bold text-orange-400 text-lg border-b border-white/10 pb-2 mb-2">{v.plate}</div>
                      <div className="text-sm space-y-1 text-gray-200">
                        <div><strong className="text-gray-400">บิล:</strong> {v.bill.billNumber}</div>
                        <div><strong className="text-gray-400">ลูกค้า:</strong> {v.bill.customer}</div>
                        <div><strong className="text-gray-400">มุ่งหน้า:</strong> {v.bill.province}</div>
                        <div className="mt-2 pt-2 border-t border-white/10 font-bold text-blue-400">{v.progress}% ถึงที่หมาย</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* Destination Marker */}
                <Marker position={v.targetCoord} opacity={0.6}>
                  <Popup>ปลายทาง: {v.bill.province}</Popup>
                </Marker>
              </div>
            ))}
          </MapContainer>
          
          {/* Legend Overlay */}
          <div className="absolute bottom-6 right-6 z-[1000] bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl">
            <h4 className="text-white font-bold mb-3 text-sm border-b border-white/10 pb-2">Map Legend</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> สำนักงานใหญ่ (HQ)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div> รถกำลังขนส่ง (In Transit)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-0 border-t-2 border-blue-500 border-dashed"></div> เส้นทางจัดส่ง (Route)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
