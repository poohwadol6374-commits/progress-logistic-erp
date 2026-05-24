import { useState, useEffect } from 'react';
import { Truck, Package, AlertTriangle, ArrowRight, CheckCircle2, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import './DispatchBoard.css';

const API_BASE_URL = 'http://localhost:3000/api';

export default function DispatchBoard() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [unassignedBills, setUnassignedBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAutoDispatching, setIsAutoDispatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehiclesRes, billsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/vehicles`),
        fetch(`${API_BASE_URL}/bills`)
      ]);

      if (!vehiclesRes.ok || !billsRes.ok) throw new Error('Failed to fetch data');

      const vehiclesData = await vehiclesRes.json();
      const billsData = await billsRes.json();

      setVehicles(vehiclesData);
      setUnassignedBills(billsData);
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Backend ได้ โปรดตรวจสอบว่าระบบ Backend (พอร์ต 3000) กำลังทำงานอยู่');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectBill = (billId: string) => {
    setSelectedBill(selectedBill === billId ? null : billId);
  };

  const handleAssignToVehicle = async (vehicleId: string) => {
    if (!selectedBill) return;

    setIsAssigning(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/dispatch/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: selectedBill, vehicleId })
      });

      const data = await res.json();

      if (!res.ok) {
        // Show the backend error message (e.g. Overload warning)
        throw new Error(data.message || 'Assignment failed');
      }

      // Success, refresh data
      setSelectedBill(null);
      await fetchData();
      
      // We can use a toast here for success, but for now we rely on the UI update
    } catch (err: any) {
      alert(`⚠️ แจ้งเตือนจากระบบหลังบ้าน:\n\n${err.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAutoDispatch = async () => {
    if (unassignedBills.length === 0) return;
    
    setIsAutoDispatching(true);
    setError(null);
    
    try {
      // 1. Filter available vehicles
      const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE' && v.currentWeight < v.maxWeight);
      if (availableVehicles.length === 0) {
        throw new Error('ไม่พบรถบรรทุกที่ว่าง (AVAILABLE) สำหรับจัดงาน');
      }

      // Deep clone to track running capacity
      const vTrackers = availableVehicles.map(v => ({ ...v }));
      const assignments = [];
      const unassignedAfterAI = [];

      // 2. Group bills by province
      const provinceGroups = unassignedBills.reduce((acc, bill) => {
        if (!acc[bill.province]) acc[bill.province] = [];
        acc[bill.province].push(bill);
        return acc;
      }, {} as Record<string, any[]>);

      // 3. Assign logic
      for (const province of Object.keys(provinceGroups)) {
        const billsInProv = provinceGroups[province];
        // Sort by weight descending to fit larger items first
        billsInProv.sort((a: any, b: any) => b.weight - a.weight);

        for (const bill of billsInProv) {
          let assigned = false;
          // Find a vehicle that can fit it
          for (const v of vTrackers) {
            if (v.currentWeight + bill.weight <= v.maxWeight && v.currentCbm + bill.cbm <= v.maxCbm) {
              v.currentWeight += bill.weight;
              v.currentCbm += bill.cbm;
              assignments.push({
                billId: bill.id,
                vehicleId: v.id,
                newWeight: v.currentWeight,
                newCbm: v.currentCbm
              });
              assigned = true;
              break;
            }
          }
          if (!assigned) {
            unassignedAfterAI.push(bill);
          }
        }
      }

      if (assignments.length === 0) {
        throw new Error('รถบรรทุกไม่สามารถรองรับน้ำหนัก/ปริมาตรของบิลที่เหลือได้');
      }

      // 4. Send Bulk API
      const res = await fetch(`${API_BASE_URL}/dispatch/assign/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      });

      if (!res.ok) throw new Error('Auto-dispatch API failed');

      await fetchData();
      alert(`🤖 AI Auto-Dispatch สำเร็จ!\nจัดรถอัตโนมัติไปแล้ว ${assignments.length} บิล\n${unassignedAfterAI.length > 0 ? `(มี ${unassignedAfterAI.length} บิลที่จัดไม่ได้เพราะรถเต็ม)` : ''}`);
    } catch (err: any) {
      alert(`⚠️ แจ้งเตือนจากระบบ AI:\n\n${err.message}`);
    } finally {
      setIsAutoDispatching(false);
    }
  };

  if (isLoading && vehicles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-primary">
        <Loader2 size={48} className="animate-spin mb-4" />
        <h2 className="text-xl font-semibold">กำลังเชื่อมต่อกับระบบหลังบ้าน...</h2>
        <p className="text-muted">Loading raw data from API Server</p>
      </div>
    );
  }

  return (
    <div className="dispatch-board h-full flex flex-col relative">
      {isAssigning && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center gap-4 text-white">
            <Loader2 className="animate-spin text-primary" size={24} />
            <span className="font-semibold">ระบบกำลังคำนวณและบันทึกลงฐานข้อมูล...</span>
          </div>
        </div>
      )}

      {isAutoDispatching && (
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 border border-gray-700 text-white p-8 rounded-xl shadow-[0_0_50px_rgba(255,107,0,0.3)] flex flex-col items-center gap-4 animate-fade-in">
            <Sparkles className="text-primary animate-bounce" size={48} />
            <span className="font-bold text-xl">🤖 AI กำลังคำนวณเส้นทางและน้ำหนัก...</span>
            <p className="text-sm text-gray-400">Finding the optimal vehicle assignments</p>
          </div>
        </div>
      )}

      <div className="page-header mb-6 flex justify-between items-end">
        <div>
          <h1 className="page-title">Dispatch Assignment</h1>
          <p className="page-subtitle">เชื่อมต่อข้อมูลแบบ Real-time กับ Backend API</p>
        </div>
        <button className="btn btn-secondary flex items-center gap-2" onClick={fetchData}>
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border-l-4 border-red-500 text-red-400 p-4 mb-6 rounded shadow-sm flex items-center gap-3">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="dispatch-container flex gap-6 h-full">
        {/* Left Column: Unassigned Bills */}
        <div className="bills-column flex-1 glass-panel flex flex-col">
          <div className="panel-header flex justify-between items-center">
            <h3>Ready ({unassignedBills.length})</h3>
            {unassignedBills.length > 0 && (
              <button 
                onClick={handleAutoDispatch}
                className="btn btn-sm flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-[0_0_15px_rgba(255,107,0,0.3)] border-none"
              >
                <Sparkles size={14} /> AI Auto-Dispatch
              </button>
            )}
          </div>
          <div className="bills-list p-4 flex flex-col gap-4 overflow-y-auto">
            {unassignedBills.map(bill => (
              <div 
                key={bill.id} 
                className={`bill-card ${selectedBill === bill.id ? 'selected' : ''}`}
                onClick={() => handleSelectBill(bill.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-primary">{bill.billNumber}</span>
                  <span className="badge badge-warning">{bill.status}</span>
                </div>
                <div className="text-sm mb-1"><strong>{bill.customer}</strong></div>
                <div className="text-sm text-muted mb-3">📍 {bill.province}</div>
                <div className="flex gap-4 text-sm font-medium">
                  <span className="flex items-center gap-1"><Package size={14}/> {bill.weight} kg</span>
                  <span className="flex items-center gap-1">📦 {bill.cbm} CBM</span>
                </div>
              </div>
            ))}
            {unassignedBills.length === 0 && !isLoading && (
              <div className="text-center text-muted py-8 animate-fade-in">
                <CheckCircle2 size={48} className="mx-auto mb-2 text-success opacity-50" />
                No pending bills. All clear!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Vehicles */}
        <div className="vehicles-column flex-2 glass-panel flex flex-col">
          <div className="panel-header flex justify-between items-center">
            <h3>Active Fleet Database ({vehicles.length})</h3>
            {selectedBill && (
              <div className="animate-fade-in badge badge-info flex items-center gap-2 py-2 px-4 text-sm">
                <ArrowRight size={16} /> Select a vehicle to assign
              </div>
            )}
          </div>
          <div className="vehicles-grid p-4 overflow-y-auto">
            {vehicles.map(vehicle => {
              const weightPct = Math.min(100, Math.round((vehicle.currentWeight / vehicle.maxWeight) * 100));
              const cbmPct = Math.min(100, Math.round((vehicle.currentCbm / vehicle.maxCbm) * 100));
              const isOverweight = vehicle.currentWeight > vehicle.maxWeight;
              const isOverCbm = vehicle.currentCbm > vehicle.maxCbm;

              return (
                <div 
                  key={vehicle.id} 
                  className={`vehicle-card ${selectedBill ? 'assignable' : ''} ${isOverweight || isOverCbm ? 'over-capacity' : ''}`}
                  onClick={() => handleAssignToVehicle(vehicle.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`vehicle-icon ${isOverweight || isOverCbm ? 'bg-danger text-white' : 'bg-primary-light text-primary'}`}>
                        <Truck size={24} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{vehicle.plate}</h4>
                        <span className="text-sm text-muted">{vehicle.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium mb-1">Assigned: {vehicle.bills?.length || 0} bills</div>
                      {isOverweight || isOverCbm ? (
                        <span className="badge badge-danger flex items-center gap-1"><AlertTriangle size={12}/> Overload</span>
                      ) : (
                        <span className="badge badge-success">{vehicle.status}</span>
                      )}
                    </div>
                  </div>

                  {/* Capacity Bars */}
                  <div className="capacity-section mt-4">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Weight ({vehicle.currentWeight} / {vehicle.maxWeight} kg)</span>
                      <span className={isOverweight ? 'text-danger' : ''}>{weightPct}%</span>
                    </div>
                    <div className="progress-bg">
                      <div className={`progress-bar ${isOverweight ? 'bg-danger' : weightPct > 80 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${weightPct}%` }}></div>
                    </div>

                    <div className="flex justify-between text-xs font-semibold mb-1 mt-3">
                      <span>Volume ({vehicle.currentCbm} / {vehicle.maxCbm} CBM)</span>
                      <span className={isOverCbm ? 'text-danger' : ''}>{cbmPct}%</span>
                    </div>
                    <div className="progress-bg">
                      <div className={`progress-bar ${isOverCbm ? 'bg-danger' : cbmPct > 80 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${cbmPct}%` }}></div>
                    </div>
                  </div>
                  
                  {selectedBill && (
                    <div className="assign-overlay">
                      <div className="assign-btn">
                        <ArrowRight size={20} /> Assign API
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
