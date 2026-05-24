import { useState, useEffect } from 'react';
import { Search, Filter, Edit3, Trash2, Clock, MapPin, Truck, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import './BillList.css';

const API_BASE_URL = 'http://localhost:3000/api';

export default function BillList() {
  const [bills, setBills] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Timeline Modal State
  const [selectedBillForTimeline, setSelectedBillForTimeline] = useState<any>(null);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/bills/all`);
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (err) {
      console.error('Failed to fetch bills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBills = bills.filter(b => 
    b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'DELIVERED': return 'badge-success';
      case 'PENDING': return 'badge-warning';
      case 'ASSIGNED': return 'badge-info';
      case 'DEPARTED': return 'badge-primary';
      case 'IN_TRANSIT': return 'badge-primary';
      default: return 'badge-danger';
    }
  };

  const getTimelineIcon = (status: string) => {
    switch(status) {
      case 'PENDING': return <Clock size={16} />;
      case 'ASSIGNED': return <MapPin size={16} />;
      case 'DEPARTED':
      case 'IN_TRANSIT': return <Truck size={16} />;
      case 'DELIVERED': return <CheckCircle2 size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  return (
    <div className="bill-list-page relative h-full flex flex-col">
      <div className="page-header flex justify-between items-end mb-6">
        <div>
          <h1 className="page-title">Bill Management & Tracking</h1>
          <p className="page-subtitle">View all delivery bills and track activity timeline</p>
        </div>
        <button className="btn btn-primary bg-gradient-to-r from-blue-500 to-indigo-600 border-none shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105 transition-transform">
          Create New Bill
        </button>
      </div>

      <div className="glass-panel p-6 flex-1 flex flex-col min-h-0">
        <div className="table-controls mb-6 flex justify-between items-center gap-4">
          <div className="search-bar w-full max-w-md">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by Bill No, Customer, or Province..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary flex items-center gap-2">
            <Filter size={18} /> Filters
          </button>
        </div>

        <div className="table-responsive flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-48 text-muted">
              Loading bills database...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Customer</th>
                  <th>Province</th>
                  <th>Date</th>
                  <th>Weight (kg)</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-white/5 transition-colors">
                    <td className="font-medium text-primary cursor-pointer hover:underline" onClick={() => setSelectedBillForTimeline(bill)}>
                      {bill.billNumber}
                    </td>
                    <td>{bill.customer}</td>
                    <td>{bill.province}</td>
                    <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
                    <td>{bill.weight}</td>
                    <td>
                      {bill.vehicle ? (
                        <span className="text-blue-300 font-semibold text-sm bg-blue-900/30 px-2 py-1 rounded border border-blue-800/50">
                          {bill.vehicle.plate}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(bill.status)}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-3">
                        <button 
                          className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 text-sm bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20"
                          onClick={() => setSelectedBillForTimeline(bill)}
                        >
                          <Clock size={14}/> Timeline
                        </button>
                        <button className="text-muted hover:text-primary transition-colors"><Edit3 size={16}/></button>
                        <button className="text-muted hover:text-danger transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted">
                      No bills found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Activity Timeline Modal */}
      {selectedBillForTimeline && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-900/80 sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="text-primary" /> Activity Timeline
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Traceability log for <span className="text-primary font-semibold">{selectedBillForTimeline.billNumber}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedBillForTimeline(null)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="timeline-container relative pl-6 border-l-2 border-gray-700 ml-4 space-y-8">
                {selectedBillForTimeline.logs && selectedBillForTimeline.logs.length > 0 ? (
                  selectedBillForTimeline.logs.map((log: any, idx: number) => {
                    // Reverse idx just for animation delay if needed, but we'll keep it simple
                    const isLatest = idx === 0;
                    return (
                      <div key={log.id} className="timeline-item relative">
                        <div className={`absolute -left-[35px] p-1.5 rounded-full border-4 border-gray-900 ${isLatest ? 'bg-primary text-white shadow-[0_0_10px_rgba(255,107,0,0.8)]' : 'bg-gray-600 text-gray-300'}`}>
                          {getTimelineIcon(log.status)}
                        </div>
                        <div className={`bg-gray-800/50 border ${isLatest ? 'border-primary/30' : 'border-gray-700'} rounded-lg p-4`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`font-semibold ${isLatest ? 'text-primary' : 'text-gray-200'}`}>
                              {log.status}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {log.note && (
                            <p className="text-sm text-gray-400 mt-2">
                              {log.note}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-gray-500 italic">No activity logs found for this bill.</div>
                )}
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-800 bg-gray-900/50 flex justify-end">
              <button 
                onClick={() => setSelectedBillForTimeline(null)}
                className="btn btn-secondary border-gray-700 hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
