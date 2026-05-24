import { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, Loader2, PieChart } from 'lucide-react';
import * as XLSX from 'xlsx';
import './Reports.css';

interface Bill {
  id: string;
  billNumber: string;
  customer: string;
  province: string;
  status: string;
  weight: number;
  cbm: number;
  createdAt: string;
  vehicle: { plate: string } | null;
}

export default function Reports() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'DELIVERED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/reports/bills');
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(b => {
    const matchTab = activeTab === 'ALL' || b.status === activeTab;
    const matchSearch = b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        b.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        b.province.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTab && matchSearch;
  });

  const exportToExcel = () => {
    // Transform data for Excel
    const excelData = filteredBills.map(b => ({
      'เลขที่บิล (Bill Number)': b.billNumber,
      'วันที่สร้าง (Date)': new Date(b.createdAt).toLocaleDateString('th-TH'),
      'ลูกค้า (Customer)': b.customer,
      'จังหวัด (Province)': b.province,
      'สถานะ (Status)': b.status,
      'น้ำหนัก (kg)': b.weight,
      'ปริมาตร (cbm)': b.cbm,
      'รถบรรทุก (Vehicle)': b.vehicle ? b.vehicle.plate : 'ยังไม่ได้จัดรถ'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    
    // Generate filename based on tab
    const fileName = `Logistics_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) {
    return <div className="h-full flex justify-center items-center"><Loader2 size={48} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="reports-page h-full flex flex-col">
      <div className="page-header flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3 text-3xl font-extrabold tracking-tight">
            <PieChart size={32} className="text-orange-500" /> 
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">Reports & Analytics Hub</span>
          </h1>
          <p className="page-subtitle text-slate-400 mt-2">ศูนย์รวมรายงาน และสถิติการขนส่ง</p>
        </div>
        <button onClick={exportToExcel} className="btn btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-900/50">
          <FileSpreadsheet size={18} /> ดาวน์โหลด Excel
        </button>
      </div>

      <div className="glass-panel flex-1 flex flex-col min-h-0 p-6">
        
        {/* Filters and Tabs */}
        <div className="reports-controls flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex gap-2">
            <button 
              className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              ทั้งหมด (All)
            </button>
            <button 
              className={`tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
              onClick={() => setActiveTab('PENDING')}
            >
              บิลค้างส่ง (Pending)
            </button>
            <button 
              className={`tab-btn ${activeTab === 'DELIVERED' ? 'active' : ''}`}
              onClick={() => setActiveTab('DELIVERED')}
            >
              จัดส่งสำเร็จ (Delivered)
            </button>
          </div>

          <div className="search-bar w-full md:w-auto min-w-[300px]">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="ค้นหาบิล, ลูกค้า, หรือจังหวัด..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Mini-Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="summary-card">
            <span className="summary-label">จำนวนบิลตามเงื่อนไข</span>
            <span className="summary-value text-blue-400">{filteredBills.length}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">น้ำหนักรวม (kg)</span>
            <span className="summary-value text-orange-400">{filteredBills.reduce((sum, b) => sum + (b.weight || 0), 0).toLocaleString()}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">จังหวัดเป้าหมายรวม</span>
            <span className="summary-value text-emerald-400">{new Set(filteredBills.map(b => b.province)).size}</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive flex-1 overflow-auto rounded-xl bg-slate-900/20">
          <table className="data-table w-full">
            <thead className="sticky top-0 bg-slate-800/80 backdrop-blur-md shadow-md z-10">
              <tr>
                <th>เลขที่บิล</th>
                <th>วันที่สร้าง</th>
                <th>ลูกค้า</th>
                <th>จังหวัดปลายทาง</th>
                <th>สถานะ</th>
                <th>รถบรรทุก (ผู้รับผิดชอบ)</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map(bill => (
                <tr key={bill.id}>
                  <td className="font-medium text-white">{bill.billNumber}</td>
                  <td className="text-gray-400">{new Date(bill.createdAt).toLocaleDateString('th-TH')}</td>
                  <td>{bill.customer}</td>
                  <td>{bill.province}</td>
                  <td>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      bill.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      bill.status === 'PENDING' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="text-gray-400">{bill.vehicle ? bill.vehicle.plate : '-'}</td>
                </tr>
              ))}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
