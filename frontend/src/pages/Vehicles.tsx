import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Truck, Loader2 } from 'lucide-react';
import './Vehicles.css';

interface Vehicle {
  id: string;
  plate: string;
  type: string;
  maxWeight: number;
  maxCbm: number;
  status: string;
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
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

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรถคันนี้?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/vehicles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVehicles(vehicles.filter(v => v.id !== id));
      } else {
        alert('ไม่สามารถลบได้ อาจมีบิลค้างอยู่');
      }
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="vehicles-page h-full flex flex-col">
      <div className="page-header flex justify-between items-end mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Truck size={28} /> Vehicles Database</h1>
          <p className="page-subtitle">จัดการฐานข้อมูลรถบรรทุกทั้งหมดในระบบ</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> เพิ่มรถใหม่
        </button>
      </div>

      <div className="glass-panel p-6 flex-1 flex flex-col min-h-0">
        <div className="table-controls mb-6">
          <div className="search-bar w-full max-w-md">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="ค้นหาจาก ทะเบียนรถ หรือ ประเภทรถ..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ทะเบียนรถ (Plate)</th>
                  <th>ประเภท (Type)</th>
                  <th>น้ำหนักสูงสุด (Weight)</th>
                  <th>ปริมาตรสูงสุด (CBM)</th>
                  <th>สถานะ (Status)</th>
                  <th className="text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="font-medium text-primary">{vehicle.plate}</td>
                    <td>{vehicle.type}</td>
                    <td>{vehicle.maxWeight.toLocaleString()} kg</td>
                    <td>{vehicle.maxCbm.toFixed(1)} m³</td>
                    <td>
                      <span className={`badge badge-${
                        vehicle.status === 'AVAILABLE' ? 'success' : 
                        vehicle.status === 'IN_TRANSIT' ? 'warning' : 'info'
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleDelete(vehicle.id)}
                          className="text-muted hover:text-danger p-2 transition-colors"
                          title="ลบรถคันนี้"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVehicles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted">
                      ไม่พบข้อมูลรถบรรทุก (โปรดไปที่เมนู Settings เพื่อ Import จาก Excel)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
