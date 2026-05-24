import { useState, useRef } from 'react';
import { UploadCloud, Scan, FileText, CheckCircle2, Save, XCircle, Loader2 } from 'lucide-react';
import './OcrCenter.css';

type OcrState = 'IDLE' | 'SCANNING' | 'VERIFYING' | 'SUCCESS';

export default function OcrCenter() {
  const [ocrState, setOcrState] = useState<OcrState>('IDLE');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Data (Extracted by mock AI)
  const [formData, setFormData] = useState({
    billNumber: '',
    customer: '',
    province: '',
    items: '',
    maxWeight: 0,
    maxCbm: 0
  });

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const processImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาอัปโหลดไฟล์รูปภาพบิลเท่านั้น');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setOcrState('SCANNING');
      
      // Simulate AI Scanning Delay (2.5 seconds)
      setTimeout(() => {
        // Mock Extracted Data
        const randomId = Math.floor(Math.random() * 10000);
        setFormData({
          billNumber: `INV-2026-${randomId}`,
          customer: 'บริษัท ลูกค้าจำลอง จำกัด',
          province: 'กรุงเทพมหานคร',
          items: 'อะไหล่รถยนต์ 5 พาเลท',
          maxWeight: 1250,
          maxCbm: 4.5
        });
        setOcrState('VERIFYING');
      }, 2500);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:3000/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Save failed');
      
      setOcrState('SUCCESS');
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึกบิลเข้า Database");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setOcrState('IDLE');
    setImagePreview(null);
    setFormData({ billNumber: '', customer: '', province: '', items: '', maxWeight: 0, maxCbm: 0 });
  };

  return (
    <div className="ocr-page h-full flex flex-col">
      <div className="page-header mb-8">
        <h1 className="page-title text-3xl bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent font-extrabold tracking-tight">OCR Center (AI Bill Scanner)</h1>
        <p className="page-subtitle text-slate-400 mt-2">สแกนบิลสินค้าอัตโนมัติด้วย AI พร้อมให้พนักงานตรวจสอบความถูกต้อง (Verify)</p>
      </div>

      <div className="flex gap-6 h-full min-h-0">
        
        {/* Left Col: Upload & Preview */}
        <div className="w-1/2 flex flex-col gap-4">
          {ocrState === 'IDLE' ? (
            <div className="glass-panel p-6 h-full flex flex-col items-center justify-center">
              <div 
                className="upload-zone w-full"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  hidden 
                  ref={fileInputRef} 
                  accept="image/jpeg, image/png" 
                  onChange={handleFileSelect}
                />
                <div className="upload-icon">
                  <UploadCloud size={36} />
                </div>
                <h3 className="text-xl font-bold mb-2">ลากรูปภาพบิลมาวางที่นี่</h3>
                <p className="text-muted">รองรับไฟล์ JPG, PNG (ระบบจะอ่านข้อความด้วย AI ทันที)</p>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText size={18} className="text-primary"/> 
                  เอกสารต้นฉบับ
                </h3>
                <button onClick={handleReset} className="text-muted hover:text-danger text-sm flex items-center gap-1">
                  <XCircle size={16} /> ยกเลิก
                </button>
              </div>
              
              <div className="scanner-container flex-1">
                {imagePreview && <img src={imagePreview} alt="Bill Preview" className="scanner-image" />}
                {ocrState === 'SCANNING' && <div className="scanner-line"></div>}
                
                {ocrState === 'SCANNING' && (
                  <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white backdrop-blur-sm z-10 rounded-md">
                    <Scan size={56} className="text-emerald-400 animate-pulse mb-4 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
                    <h3 className="text-2xl font-bold mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400">กำลังสแกนและสกัดข้อมูล...</h3>
                    <p className="text-sm text-emerald-200/80">AI กำลังอ่านใบเสร็จ โปรดรอสักครู่</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Verification Form */}
        <div className="w-1/2 flex flex-col gap-4">
          {ocrState === 'IDLE' || ocrState === 'SCANNING' ? (
            <div className="glass-panel p-8 h-full flex flex-col items-center justify-center text-center opacity-50">
              <Scan size={64} className="text-muted mb-6" />
              <h3 className="text-xl font-semibold mb-2">รอข้อมูลจาก AI</h3>
              <p className="text-muted max-w-sm">ผลลัพธ์จากการสแกน (OCR) จะปรากฏที่นี่ เพื่อให้พนักงานทำการตรวจสอบ (Human Verification)</p>
            </div>
          ) : ocrState === 'SUCCESS' ? (
            <div className="glass-panel p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-emerald-900/30 text-emerald-400 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-[0_0_30px_rgba(52,211,153,0.3)] border border-emerald-500/30">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">บันทึกบิลสำเร็จ!</h2>
              <p className="text-muted mb-8 max-w-md">ข้อมูลบิล {formData.billNumber} ถูกส่งไปยังระบบ Dispatch เรียบร้อยแล้ว พร้อมสำหรับการจ่ายงานจัดรถ</p>
              
              <div className="flex gap-4">
                <button onClick={handleReset} className="btn btn-primary px-8">สแกนบิลใบต่อไป</button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 h-full flex flex-col animate-fade-in">
              <div className="flex justify-between items-center pb-4 border-b border-slate-700 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <CheckCircle2 size={20} /> Human Verification
                  </h3>
                  <p className="text-sm text-muted">โปรดตรวจสอบและแก้ไขข้อมูลที่ AI อาจอ่านผิดพลาด</p>
                </div>
                <div className="badge badge-warning">AI Confidence: 89%</div>
              </div>

              <div className="flex-1 overflow-auto pr-2">
                <div className="form-row">
                  <div className="form-group">
                    <label>เลขที่บิล (Bill Number)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.billNumber}
                      onChange={(e) => setFormData({...formData, billNumber: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>วันที่จัดส่ง</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>ชื่อลูกค้า (Customer)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.customer}
                    onChange={(e) => setFormData({...formData, customer: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>จังหวัดปลายทาง</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.province}
                    onChange={(e) => setFormData({...formData, province: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>รายการสินค้า (Items)</label>
                  <textarea 
                    className="form-control" 
                    rows={2}
                    value={formData.items}
                    onChange={(e) => setFormData({...formData, items: e.target.value})}
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>น้ำหนักรวม (kg)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.maxWeight}
                      onChange={(e) => setFormData({...formData, maxWeight: Number(e.target.value)})}
                    />
                  </div>
                  <div className="form-group">
                    <label>ปริมาตรรวม (CBM)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      step="0.1"
                      value={formData.maxCbm}
                      onChange={(e) => setFormData({...formData, maxCbm: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 mt-4 flex justify-end gap-3">
                <button className="btn btn-secondary" onClick={handleReset}>ยกเลิก</button>
                <button 
                  className="btn btn-primary flex items-center gap-2" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? "กำลังบันทึก..." : "ยืนยันและสร้างบิล"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
