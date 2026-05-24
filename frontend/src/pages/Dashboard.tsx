import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Truck, CheckCircle, Clock, Loader2, Calendar, ArrowRight } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './Dashboard.css';

interface DashboardStats {
  bills: { total: number; pending: number; assigned: number };
  vehicles: { total: number; available: number; inTransit: number };
  billsByProvince: { name: string; value: number }[];
}

// Modern vibrant color palette for charts
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Green, Orange, Red

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError('Failed to fetch data from the server');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Connection to server failed. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary mb-4" />
        <p className="text-gray-400">กำลังเชื่อมต่อกับฐานข้อมูล Supabase...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
          <p className="text-gray-400 mb-4">{error || 'ไม่พบข้อมูล Dashboard'}</p>
          <button 
            onClick={() => { setLoading(true); setError(null); fetchStats(); }}
            className="btn btn-primary"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // Formatting Pie Chart Data (Donut Chart)
  const otherVehiclesCount = stats.vehicles.total - stats.vehicles.available - stats.vehicles.inTransit;
  const vehicleStatusData = [
    { name: 'พร้อมใช้งาน (Available)', value: stats.vehicles.available },
    { name: 'กำลังวิ่งงาน (In Transit)', value: stats.vehicles.inTransit },
    { name: 'ซ่อมบำรุง (Maintenance)', value: otherVehiclesCount > 0 ? otherVehiclesCount : 0 }
  ].filter(d => d.value > 0); // Hide zeros

  const totalBills = stats.bills.total || 0;
  const pendingBills = stats.bills.pending || 0;
  const totalVehicles = stats.vehicles.total || 0;
  const availableVehicles = stats.vehicles.available || 0;

  // Formatting KPIs
  const kpis = [
    { 
      title: 'บิลจัดส่งทั้งหมด (Total Bills)', 
      value: totalBills, 
      icon: <FileText size={20} />,
      bg: 'blue',
      trend: '+12%',
      trendLabel: 'จากสัปดาห์ก่อน',
      link: '/bills'
    },
    { 
      title: 'บิลรอดำเนินการ (Pending)', 
      value: pendingBills, 
      icon: <Clock size={20} />,
      bg: 'orange',
      trend: 'ด่วน',
      trendLabel: 'ต้องจัดรถวันนี้',
      link: '/dispatch'
    },
    { 
      title: 'กองทัพรถบรรทุก (Total Vehicles)', 
      value: totalVehicles, 
      icon: <Truck size={20} />,
      bg: 'purple',
      trend: '100%',
      trendLabel: 'คันในระบบ',
      link: '/vehicles'
    },
    { 
      title: 'รถพร้อมใช้งาน (Available)', 
      value: availableVehicles, 
      icon: <CheckCircle size={20} />,
      bg: 'emerald',
      trend: 'พร้อมจัดรถ',
      trendLabel: 'รับงานได้ทันที',
      link: '/dispatch'
    }
  ];

  // Render Custom Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] p-3 border border-gray-700 rounded-lg shadow-xl">
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-white font-bold text-lg">{payload[0].value} บิลจัดส่ง</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-page h-full flex flex-col overflow-y-auto pr-2">
      
      {/* Header Section */}
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">ยินดีต้อนรับกลับ, ผู้บริหาร 👋</h1>
          <p className="text-gray-400">นี่คือสรุปภาพรวมการขนส่งและประสิทธิภาพของระบบในวันนี้</p>
        </div>
        <div className="date-filter cursor-pointer hover:bg-white/20 transition">
          <Calendar size={16} className="text-primary" />
          <span>ข้อมูล ณ วันนี้ (Today)</span>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <div 
            key={i} 
            className={`kpi-card ${kpi.bg} cursor-pointer group`}
            onClick={() => navigate(kpi.link)}
          >
            <div className="kpi-bg-shape"></div>
            <div className="kpi-header">
              <span className="kpi-title">{kpi.title}</span>
              <div className="kpi-icon-wrap group-hover:scale-110 transition-transform">{kpi.icon}</div>
            </div>
            <div className="kpi-value-wrap">
              <span className="kpi-value">{kpi.value.toLocaleString()}</span>
              <span className="kpi-trend">{kpi.trend}</span>
            </div>
            <div className="kpi-footer mt-4 flex justify-between items-center z-10 border-t border-white/20 pt-3">
              <span className="text-sm opacity-80">{kpi.trendLabel}</span>
              <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                คลิกดูรายละเอียด <ArrowRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-grid mb-8">
        
        {/* Main Chart: Bar Chart for Provinces */}
        <div className="chart-panel">
          <div className="chart-header">
            <h3 className="chart-title">ปริมาณงานแยกตามจังหวัด (Top Destinations)</h3>
            <p className="chart-subtitle">แสดง 5 อันดับจังหวัดที่มีปริมาณบิลจัดส่งสูงสุด</p>
          </div>
          <div className="chart-container">
            {stats.billsByProvince.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.billsByProvince} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 13 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 13 }}
                  />
                  <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar 
                    dataKey="value" 
                    radius={[6, 6, 0, 0]} 
                    barSize={48}
                    animationDuration={1500}
                  >
                    {stats.billsByProvince.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 bg-[#111] rounded-lg border border-dashed border-gray-700">
                ยังไม่มีข้อมูลบิลในระบบเพื่อวาดกราฟ
              </div>
            )}
          </div>
        </div>

        {/* Secondary Chart: Donut Chart for Vehicle Utilization */}
        <div className="chart-panel">
          <div className="chart-header">
            <h3 className="chart-title">สถานะรถบรรทุก</h3>
            <p className="chart-subtitle">ภาพรวมการทำงานของรถ (Fleet Utilization)</p>
          </div>
          <div className="chart-container relative flex items-center justify-center">
            {vehicleStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleStatusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={85}
                      outerRadius={115}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      animationDuration={1500}
                    >
                      {vehicleStatusData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      itemStyle={{ color: '#fff' }} 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #374151', borderRadius: '8px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle" 
                      wrapperStyle={{ paddingTop: '20px', fontSize: '13px', color: '#ccc' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text in Donut */}
                <div className="absolute flex flex-col items-center justify-center pointer-events-none" style={{top: '45%', transform: 'translateY(-50%)'}}>
                  <span className="text-4xl font-bold text-white leading-none">{totalVehicles}</span>
                  <span className="text-xs text-gray-400 mt-1">คันทั้งหมด</span>
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-500 bg-[#111] rounded-lg border border-dashed border-gray-700">
                ยังไม่มีข้อมูลรถบรรทุก
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
