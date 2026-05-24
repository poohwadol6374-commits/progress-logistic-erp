import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, ArrowRight, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import './Settings.css';

export default function Settings() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      alert("กรุณาอัปโหลดไฟล์ .xlsx หรือ .csv เท่านั้น");
      return;
    }
    
    setFile(file);
    setImportSuccess(false);
    setIsValidating(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        // Data mapping and validation
        const mappedData = json.map((row: any) => ({
          plate: row['ทะเบียนรถ'] || row['Plate'] || '',
          type: row['ประเภทรถ'] || row['Type'] || 'ไม่ระบุ',
          maxWeight: Number(row['น้ำหนักสูงสุด (กก.)'] || row['MaxWeight']) || 0,
          maxCbm: Number(row['ปริมาตรสูงสุด (CBM)'] || row['MaxCBM']) || 0,
          isValid: !!(row['ทะเบียนรถ'] || row['Plate']) // Plate is required
        }));

        setParsedData(mappedData);
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการอ่านไฟล์");
      } finally {
        setIsValidating(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    const validData = parsedData.filter(d => d.isValid);
    if (validData.length === 0) return;

    setIsImporting(true);
    try {
      const res = await fetch('http://localhost:3000/api/vehicles/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicles: validData })
      });

      if (!res.ok) throw new Error('Import failed');
      
      setImportSuccess(true);
      setParsedData([]);
      setFile(null);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการนำเข้าข้อมูลไปยัง Database");
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedData.filter(d => d.isValid).length;
  const errorCount = parsedData.length - validCount;

  return (
    <div className="settings-page h-full flex flex-col">
      <div className="page-header mb-8 flex justify-between items-end">
        <div>
          <h1 className="page-title text-3xl bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent font-extrabold tracking-tight">Master Data Settings</h1>
          <p className="page-subtitle text-slate-400 mt-2">นำเข้าข้อมูลหลัก (Excel Migration) สำหรับรถบรรทุกและพนักงาน</p>
        </div>
        <button className="btn btn-secondary flex items-center gap-2">
          <Download size={16} /> โหลดไฟล์ Template (.xlsx)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
        {/* Left Col: Upload Zone */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 relative z-10">
            <h3 className="text-xl font-semibold mb-4 text-white">Import Vehicles Data</h3>
            
            <div 
              className={`dropzone ${file ? 'active' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                accept=".xlsx, .csv" 
                onChange={handleFileSelect}
              />
              <div className="dropzone-icon">
                <UploadCloud size={32} />
              </div>
              <h4 className="font-semibold mb-2">
                {file ? file.name : "ลากไฟล์มาวางที่นี่"}
              </h4>
              <p className="text-sm text-muted">
                {file ? "คลิกเพื่อเปลี่ยนไฟล์" : "รองรับไฟล์ .xlsx, .csv"}
              </p>
            </div>

            {importSuccess && (
              <div className="mt-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center gap-3 animate-fade-in">
                <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">นำเข้าข้อมูลสำเร็จ!</h4>
                  <p className="text-sm">ข้อมูลรถบรรทุกถูกบันทึกลง Database เรียบร้อยแล้ว สามารถดูผลลัพธ์ได้ที่หน้า Dispatch</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Preview Table */}
        <div className="col-span-1 lg:col-span-2 glass-panel flex flex-col min-w-0 relative z-0">
          <div className="panel-header flex justify-between items-center p-6 pb-2 border-b border-white/5">
            <h3 className="text-xl font-semibold text-white">Data Preview</h3>
            {parsedData.length > 0 && (
              <div className="flex gap-4">
                <div className="badge badge-success">Valid: {validCount}</div>
                {errorCount > 0 && <div className="badge badge-danger">Errors: {errorCount}</div>}
              </div>
            )}
          </div>
          
          <div className="p-6 flex-1 overflow-auto bg-slate-900/20 rounded-b-xl">
            {isValidating ? (
              <div className="h-full flex flex-col items-center justify-center text-muted">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p>กำลังวิเคราะห์โครงสร้างไฟล์ Excel...</p>
              </div>
            ) : parsedData.length > 0 ? (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>ทะเบียนรถ</th>
                      <th>ประเภทรถ</th>
                      <th>น้ำหนักสูงสุด (kg)</th>
                      <th>ปริมาตร (CBM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, i) => (
                      <tr key={i} className={!row.isValid ? 'error-row' : ''}>
                        <td>
                          {row.isValid ? 
                            <CheckCircle2 size={16} className="text-success" /> : 
                            <AlertTriangle size={16} className="text-danger" />
                          }
                        </td>
                        <td className={!row.plate ? 'cell-error' : ''}>{row.plate || 'ขาดข้อมูล!'}</td>
                        <td>{row.type}</td>
                        <td>{row.maxWeight}</td>
                        <td>{row.maxCbm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted opacity-50">
                <FileSpreadsheet size={48} className="mb-4" />
                <p>อัปโหลดไฟล์ Excel เพื่อดูตัวอย่างข้อมูลก่อนนำเข้า Database</p>
              </div>
            )}
          </div>

          {parsedData.length > 0 && (
            <div className="p-4 border-t border-white/5 bg-slate-900/40 flex justify-end rounded-b-xl">
              <button 
                className="btn btn-primary flex items-center gap-2"
                onClick={handleImport}
                disabled={isImporting || validCount === 0}
              >
                {isImporting ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                {isImporting ? "กำลังนำเข้าข้อมูล..." : `นำเข้าข้อมูลลง Database (${validCount} รายการ)`}
                {!isImporting && <ArrowRight size={16} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
