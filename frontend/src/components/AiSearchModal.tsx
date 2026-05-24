import { useState } from 'react';
import { Sparkles, Search, X, Loader2, Truck, Package } from 'lucide-react';
import './AiSearchModal.css';

interface AiSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiSearchModal({ isOpen, onClose }: AiSearchModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setResult(null);

    try {
      const res = await fetch('http://localhost:3000/api/reports/bills');
      if (res.ok) {
        const bills = await res.json();
        const searchLower = query.toLowerCase();
        
        // Filter bills
        const matchedBills = bills.filter((b: any) => 
          b.billNumber.toLowerCase().includes(searchLower) ||
          b.province.toLowerCase().includes(searchLower) ||
          b.customer.toLowerCase().includes(searchLower) ||
          (b.vehicle && b.vehicle.plate.toLowerCase().includes(searchLower))
        );

        if (matchedBills.length > 0) {
          const totalWeight = matchedBills.reduce((sum: number, b: any) => sum + (b.weight || 0), 0);
          
          setResult({
            summary: `พบข้อมูลที่ตรงกับ "${query}" จำนวน ${matchedBills.length} รายการ (น้ำหนักรวม ${totalWeight.toLocaleString()} kg)`,
            details: matchedBills.map((b: any) => ({
              type: 'bill',
              label: b.billNumber,
              status: b.status,
              qty: `${b.province} - ${b.customer}`
            }))
          });
        } else {
          setResult({
            summary: `ไม่พบข้อมูลที่ตรงกับ "${query}"`,
            details: []
          });
        }
      }
    } catch (error) {
      console.error('Search failed', error);
      setResult({ summary: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล', details: [] });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="ai-modal-overlay">
      <div className="ai-modal glass-panel animate-fade-in">
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
        
        <div className="ai-modal-header">
          <div className="ai-icon-wrapper">
            <Sparkles size={24} className="text-inverse" />
          </div>
          <h2>Ask Logistics AI</h2>
          <p className="text-muted text-sm">ค้นหาข้อมูลด้วยภาษาธรรมชาติ เช่น "วันนี้รถคันไหนไปเชียงใหม่บ้าง?"</p>
        </div>

        <form onSubmit={handleSearch} className="ai-search-box">
          <Search size={20} className="text-muted" />
          <input 
            type="text" 
            placeholder="พิมพ์คำถามของคุณที่นี่..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-ai" disabled={isSearching || !query.trim()}>
            {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Ask'}
          </button>
        </form>

        <div className="ai-results-area">
          {isSearching && (
            <div className="ai-thinking">
              <Sparkles size={20} className="text-primary animate-pulse" />
              <span>AI is analyzing your request...</span>
            </div>
          )}

          {result && (
            <div className="ai-result-content animate-fade-in">
              <div className="ai-summary">
                <p>{result.summary}</p>
              </div>
              <div className="ai-detail-cards">
                {result.details.map((item: any, i: number) => (
                  <div key={i} className="ai-card">
                    {item.type === 'truck' ? <Truck size={18} className="text-info" /> : <Package size={18} className="text-success" />}
                    <div className="ai-card-info">
                      <span className="ai-card-title">{item.label}</span>
                      <span className="ai-card-sub">{item.status || item.qty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
