# Logistics Dispatch Intelligence Platform (Web PRD Master Note)

## Project Overview
ระบบบริหารจัดการงานขนส่งสำหรับธุรกิจโลจิสติกที่ใช้ OCR, Dashboard, Analytics และ AI Search
เพื่อให้ทราบว่าสินค้าใดถูกส่งไปจังหวัดใด เวลาใด รถคันใด และคนขับคนใดรับผิดชอบ

---

# Vision
สร้างศูนย์กลางข้อมูลขนส่งที่แทน Excel และเอกสารกระดาษทั้งหมด

เป้าหมาย:
- ลดการคีย์ข้อมูล
- ลดบิลตกหล่น
- ลดบิลซ้ำ
- ติดตามงานได้แบบ Real-time
- ตรวจสอบย้อนหลังได้
- วิเคราะห์ข้อมูลเชิงธุรกิจได้

---

# Roles

## Data Entry (Employee)
- Upload เอกสาร
- ทำการ OCR และตรวจสอบความถูกต้อง (Verify)
- สร้างบิลเข้าระบบและจัดการข้อมูลพื้นฐาน

## Dispatcher (ผู้จัดรถ)
- จัดรถและคนขับ
- เปลี่ยนสถานะงาน
- ติดตามและแก้ไขปัญหาการจัดส่ง

## Supervisor
- ตรวจสอบและอนุมัติงาน (Approval)
- ดูแลภาพรวมและจัดการปัญหา (Escalations)

## Driver (ผ่าน LINE OA ใน Phase V1)
- รับทราบการมอบหมายงาน
- อัปเดตสถานะงาน (เช่น เริ่มวิ่ง, จัดส่งสำเร็จ) พร้อมแนบรูปถ่ายยืนยัน

## Admin
- เข้าถึงทุกข้อมูล
- Dashboard
- Reports
- Analytics
- User Management
- Audit Log
- System Settings

---

# Core Modules

## Authentication
- Login
- Logout
- Reset Password
- MFA สำหรับ Admin
- Session Timeout

## Bill Management
ข้อมูลบิล:
- Bill Number
- Document Type
- Customer
- Province
- Dispatch Date
- Departure Time
- Status
- Remarks

## Product Items
- SKU
- Product Name
- Quantity
- Unit
- Weight
- CBM (Cubic Meters - ปริมาตร)
- Remark

## OCR Center
รองรับ:
- JPG
- PNG
- PDF
- Scan

ดึงข้อมูล:
- เลขบิล
- วันที่
- จังหวัด
- ลูกค้า
- SKU (พร้อมระบบ Mapping หน้าจอ หากเจอ SKU ใหม่ที่ไม่มีใน Master)
- จำนวน
- น้ำหนัก และ ปริมาตร

Flow:
Upload -> OCR -> Review (บังคับ Verify หาก Confidence < 80%) -> Verify -> Save

Flow:
Upload -> OCR -> Review -> Verify -> Save

## Province Dashboard
แสดง:
- จำนวนบิล
- จำนวนลูกค้า
- จำนวนสินค้า
- จำนวนรถ
- จำนวนคนขับ
- เวลาออกคลัง
- สถานะงาน

## Vehicle Management
- ทะเบียนรถ
- ประเภทรถ
- Capacity (รองรับการคำนวณทั้ง Weight และ CBM)
- Status
- Assignment History
- Maintenance Schedule (ตารางซ่อมบำรุงรถ)

## Driver Management
- Driver Profile
- Assignment History
- Workload Statistics
- Shift & Leave (ตารางกะทำงานและวันหยุด)

## Dispatch Assignment
- Assign Vehicle (แจ้งเตือนหากเกิน Capacity)
- Assign Driver
- Assign Route (รองรับ Multi-drop การแวะส่งหลายจุดในบิลเดียว/หลายบิล)
- Departure Schedule

## Search Engine
ค้นหาโดย:
- Bill
- Province
- Customer
- SKU
- Vehicle
- Driver
- Date Range

## Reports
- Daily
- Weekly
- Monthly
- Province
- Customer
- Product
- Vehicle
- Driver

Export:
- Excel
- CSV
- PDF

---

# Recommended Additional Features

## Excel Migration
- Import Excel
- Mapping Columns
- Validation
- Preview
- Bulk Import

## Data Cleansing
- Province Mapping
- Customer Merge
- Duplicate Detection

## Approval Workflow
Draft
-> OCR Completed
-> Verified
-> Supervisor Approved
-> Assigned
-> Departed
-> Delivered
-> Closed

## Escalation Rules
- OCR Pending > 4h (แจ้งเตือน In-app ถึง Data Entry)
- Not Assigned > 6h (แจ้งเตือน In-app ถึง Dispatcher)
- Not Closed > 48h (แจ้งเตือนผ่าน LINE Notify/Email ถึง Supervisor)

## Capacity Validation
ระบบจะ "แจ้งเตือน (Warning)" เมื่อรถบรรทุกเกินกำหนด (น้ำหนัก/ปริมาตร) โดยให้ Supervisor อนุมัติหากจำเป็นต้องฝืนจัดส่ง

## Activity Timeline
เก็บทุกเหตุการณ์ของบิล

## Comments & Mentions
- Comment
- @Mention User

## Bulk Actions
- Bulk Status Update
- Bulk OCR Upload

## Scheduled Reports
ส่งรายงานอัตโนมัติ

## Soft Delete
ลบแล้วกู้คืนได้

---

# AI Features

## Smart Summary
สรุปงานรายวันอัตโนมัติ

## Natural Language Search
ตัวอย่าง:
- เชียงใหม่วันนี้ส่งอะไรบ้าง
- ลูกค้า A ส่งกี่บิล
- รถทะเบียน XXX ขนอะไร

## Anomaly Detection
ตรวจจับ:
- บิลซ้ำ
- จำนวนผิดปกติ
- จังหวัดผิด
- รถเกิน Capacity

## Forecast
คาดการณ์ปริมาณงานล่วงหน้า

---

# Dashboards

## Executive Dashboard
- Total Bills
- Active Provinces
- Active Vehicles
- Active Drivers
- Pending Jobs
- Closed Jobs

## Operations Dashboard
- Ready To Dispatch
- Assigned Jobs
- OCR Queue
- Delayed Jobs

## Province Dashboard
- Shipment Volume
- Customers
- Products
- Vehicle Usage

## Vehicle Dashboard
- Utilization
- Assignments
- History

## Driver Dashboard
- Workload
- Assigned Deliveries
- Performance

---

# Database Tables

Master:
- users
- roles
- customers
- provinces
- products
- vehicles
- drivers
- document_types

Transaction:
- bills
- bill_items
- bill_documents
- shipment_assignments
- shipment_status_logs
- notifications
- audit_logs
- comments
- ocr_results

---

# API Groups

/auth
/users
/customers
/provinces
/products
/vehicles
/drivers
/bills
/ocr
/reports
/dashboard
/notifications

---

# Security

- RBAC
- MFA
- Encryption
- Audit Trail
- Login History
- IP Logging

---

# Backup & Recovery

Backup:
- Daily
- Weekly Snapshot

Recovery Target:
- < 4 Hours

---

# Success Metrics

- OCR Accuracy > 95%
- Search < 5 Seconds
- Duplicate Bills Reduced
- Faster Data Entry
- Faster Reporting

---

# Future Roadmap

V1
- Core Logistics (รวมถึงระบบ Import Excel สำหรับข้อมูล Master)
- OCR (เน้นแบบฟอร์มมาตรฐานของบริษัทก่อน)
- Dashboard
- Reports
- LINE OA Integration (ให้คนขับใช้แทน Mobile App ไปก่อนเพื่ออัปเดตสถานะ)

V2
- AI Search
- Analytics
- Notifications

V3
- Forecasting
- Route Optimization
- ERP Integration
- Mobile App
