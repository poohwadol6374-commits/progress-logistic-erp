import { useState, useEffect } from 'react';
import { Truck, MapPin, Package, CheckCircle, Navigation, Loader2 } from 'lucide-react';
import './DriverApp.css';

interface Vehicle {
  id: string;
  plate: string;
  status: string;
  bills: Bill[];
}

interface Bill {
  id: string;
  billNumber: string;
  customer: string;
  province: string;
  status: string;
}

export default function DriverApp() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();
    // Poll for updates every 5 seconds (Simple real-time simulation)
    const interval = setInterval(fetchVehicles, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error('Failed to fetch vehicles', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (vehicleId: string, vehicleStatus: string, bills: Bill[], billStatus: string) => {
    setActionLoading(true);
    try {
      // 1. Update Vehicle Status
      await fetch(`http://localhost:3000/api/vehicles/${vehicleId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: vehicleStatus })
      });

      // 2. Update all attached Bills Status
      for (const bill of bills) {
        await fetch(`http://localhost:3000/api/bills/${bill.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: billStatus })
        });
      }

      await fetchVehicles(); // Refresh data
    } catch (error) {
      alert('Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && vehicles.length === 0) {
    return <div className="driver-app flex items-center justify-center"><Loader2 size={48} className="animate-spin text-blue-500"/></div>;
  }

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const activeJobs = selectedVehicle?.bills.filter(b => b.status === 'ASSIGNED' || b.status === 'IN_TRANSIT') || [];

  return (
    <div className="driver-app">
      <div className="driver-header">
        <Truck size={48} className="mx-auto mb-2 text-white opacity-90" />
        <h1 className="text-2xl font-bold">Driver Delivery App</h1>
        <p className="text-blue-200 text-sm opacity-80">แอปพลิเคชันสำหรับพนักงานขับรถ</p>
      </div>

      <div className="driver-content max-w-md mx-auto">
        
        {/* Step 1: Login / Select Vehicle */}
        {!selectedVehicle && (
          <div className="driver-card text-center mt-8">
            <h2 className="text-lg font-semibold mb-4">เข้าสู่ระบบ (เลือกรถของคุณ)</h2>
            <select 
              className="select-vehicle"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              <option value="">-- เลือกทะเบียนรถบรรทุก --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plate} ({v.status})</option>
              ))}
            </select>
          </div>
        )}

        {/* Step 2: Show Jobs */}
        {selectedVehicle && (
          <>
            <div className="flex justify-between items-center px-2 mb-2">
              <div>
                <span className="text-sm text-gray-400">รถประจำทาง</span>
                <h2 className="text-xl font-bold text-blue-400">{selectedVehicle.plate}</h2>
              </div>
              <button 
                onClick={() => setSelectedVehicleId('')}
                className="text-sm text-gray-400 underline"
              >
                เปลี่ยนรถ
              </button>
            </div>

            {activeJobs.length === 0 ? (
              <div className="driver-card text-center py-10">
                <CheckCircle size={64} className="mx-auto mb-4 text-green-500 opacity-50" />
                <h3 className="text-lg font-bold text-white mb-2">ไม่มีงานในขณะนี้</h3>
                <p className="text-gray-400 text-sm">รอรับงานจัดสรรจาก Dispatcher...</p>
              </div>
            ) : (
              <div className="driver-card">
                <div className="flex items-center gap-2 mb-4 text-orange-400">
                  <Package size={20} />
                  <h3 className="font-bold text-lg">งานที่ได้รับมอบหมาย ({activeJobs.length} บิล)</h3>
                </div>

                <div className="flex flex-col gap-3">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-white">{job.billNumber}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${job.status === 'IN_TRANSIT' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-300'}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="job-row text-sm">
                        <span><MapPin size={14} className="inline mr-1"/>ปลายทาง</span>
                        <span>{job.province}</span>
                      </div>
                      <div className="job-row text-sm">
                        <span>ลูกค้า</span>
                        <span>{job.customer}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  {selectedVehicle.status === 'AVAILABLE' && (
                    <button 
                      className="driver-btn driver-btn-start"
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate(selectedVehicle.id, 'IN_TRANSIT', activeJobs, 'IN_TRANSIT')}
                    >
                      {actionLoading ? <Loader2 className="animate-spin" /> : <Navigation size={20} />}
                      เริ่มจัดส่ง (Start Delivery)
                    </button>
                  )}

                  {selectedVehicle.status === 'IN_TRANSIT' && (
                    <button 
                      className="driver-btn driver-btn-complete"
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate(selectedVehicle.id, 'AVAILABLE', activeJobs, 'DELIVERED')}
                    >
                      {actionLoading ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                      จัดส่งสำเร็จ (Delivered)
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
