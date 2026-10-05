# Personal Life OS — Product Specification

> เว็บแอปพลิเคชันสำหรับจัดการชีวิตประจำวันแบบครบวงจร  
> แนวคิดหลัก: **“เปิดแอปเดียว แล้วรู้ว่าชีวิตวันนี้มีอะไรต้องทำ ต้องจ่าย ต้องดูแล และต้องเตรียมอะไร”**

---

## 1. Product Concept

Personal Life OS ไม่ควรเป็นเพียงแอปบันทึกรายรับรายจ่าย แต่เป็น **Personal Life Management Platform** ที่รวมข้อมูลสำคัญในชีวิตประจำวันไว้ในระบบเดียว

ระบบควรช่วยผู้ใช้:

- บันทึกและติดตามการเงิน
- จัดการค่าใช้จ่ายประจำ
- จัดการทรัพย์สินและสิ่งของที่ซื้อ
- ติดตามประกันและวันหมดอายุ
- ดูแลรถยนต์และประวัติซ่อมบำรุง
- วางแผนและสรุปค่าใช้จ่ายการท่องเที่ยว
- หารค่าใช้จ่ายกับกลุ่มเพื่อน
- จัดการงาน นัดหมาย และ Reminder
- จัดเก็บเอกสารสำคัญ
- ดูภาพรวมชีวิตผ่าน Dashboard
- ใช้ AI ช่วยบันทึกข้อมูลด้วยภาษาธรรมชาติ

---

# 2. Product Goals

## Primary Goals

1. ลดภาระการจดจำเรื่องสำคัญในชีวิต
2. รวมข้อมูลส่วนตัวที่กระจัดกระจายไว้ในระบบเดียว
3. ทำให้การบันทึกข้อมูลรวดเร็วที่สุด
4. แจ้งเตือนสิ่งที่กำลังจะถึงกำหนด
5. แสดงภาพรวมทางการเงินและทรัพย์สิน
6. ทำให้ข้อมูลในแต่ละ Module เชื่อมโยงกัน
7. รองรับ AI และ Automation ในอนาคต

## UX Principle

> **Record once, use everywhere.**

ตัวอย่าง:

เมื่อผู้ใช้ซื้อ iPhone:

- สร้าง Expense
- สร้าง Purchase
- สร้าง Asset
- บันทึก Warranty
- บันทึก Receipt
- สร้าง Expiration Reminder

โดยไม่ต้องกรอกข้อมูลซ้ำหลายครั้ง

---

# 3. Main Information Architecture

```text
LIFE OS
│
├── 🏠 Dashboard
│
├── 💰 Money
│   ├── Income
│   ├── Expenses
│   ├── Accounts
│   ├── Credit Cards
│   ├── Bills
│   ├── Subscriptions
│   ├── Budgets
│   └── Financial Goals
│
├── 📦 Assets
│   ├── Purchases
│   ├── Products
│   ├── Warranty
│   └── Documents
│
├── 🚗 Vehicles
│   ├── Vehicles
│   ├── Fuel
│   ├── Maintenance
│   ├── Insurance
│   └── Tax
│
├── 🏠 Home
│   ├── Property
│   ├── Appliances
│   └── Maintenance
│
├── ✈️ Trips
│   ├── Trips
│   ├── Expenses
│   ├── Members
│   └── Settlement
│
├── 📅 Calendar
│
├── ✅ Tasks
│
├── 🛒 Shopping
│
├── 📄 Documents
│
├── 🔔 Notifications
│
└── 🤖 AI Assistant
```

---

# 4. Dashboard

Dashboard คือหน้าแรกของระบบ และควรเน้นข้อมูลที่ผู้ใช้ต้องรู้ “ตอนนี้”

## Dashboard Sections

### Greeting

```text
Good Morning 👋

20 September 2026
```

### Money Overview

```text
เงินคงเหลือรวม
฿42,850

รายรับเดือนนี้
฿58,000

รายจ่ายเดือนนี้
฿24,350
```

### Upcoming Payments

```text
🔴 Internet
฿699
ครบกำหนดพรุ่งนี้

🟠 Phone
฿599
ครบกำหนดใน 4 วัน
```

### Upcoming Reminders

```text
🔧 เช็กระยะรถ
อีก 800 km

📱 Warranty iPhone
หมดใน 12 วัน

🚗 ประกันรถ
หมดใน 30 วัน
```

### Today's Tasks

แสดง:

- งานวันนี้
- นัดหมาย
- ค่าใช้จ่ายที่ต้องจ่าย
- Reminder
- Event

### Vehicle Status

```text
Toyota

Current Mileage
12,450 km

Next Maintenance
15,000 km
```

---

# 5. Money Management

## 5.1 Income

รองรับ:

- เงินเดือน
- Freelance
- โบนัส
- รายได้เสริม
- เงินคืน
- รายได้อื่น ๆ

### Income Fields

- Amount
- Date
- Account
- Category
- Source
- Note
- Attachment

---

# 5.2 Expenses

หมวดหมู่เริ่มต้น:

- อาหาร
- เครื่องดื่ม
- เดินทาง
- รถ
- บ้าน
- Shopping
- Entertainment
- สุขภาพ
- การศึกษา
- ท่องเที่ยว
- Subscription
- Bills
- อื่น ๆ

### Expense Fields

- Amount
- Date
- Time
- Category
- Account
- Payment Method
- Merchant
- Location
- Note
- Receipt
- Tags

---

# 5.3 Accounts

ผู้ใช้สามารถสร้างบัญชีได้ เช่น:

- เงินสด
- SCB
- KBank
- BBL
- Wallet
- Savings
- Investment

แต่ละบัญชีควรมี:

- Account Name
- Account Type
- Current Balance
- Currency
- Bank
- Last Updated

---

# 5.4 Credit Cards

ข้อมูล:

- Card Name
- Bank
- Credit Limit
- Current Usage
- Billing Cycle
- Statement Date
- Payment Due Date
- Minimum Payment
- Outstanding Balance

ระบบควรแจ้งเตือนวันชำระ

---

# 5.5 Fixed / Recurring Expenses

สำหรับค่าใช้จ่ายที่เกิดขึ้นเป็นประจำ

ตัวอย่าง:

| รายการ | จำนวน | รอบ | วันครบกำหนด |
|---|---:|---|---:|
| Internet | ฿699 | Monthly | 5 |
| Phone | ฿599 | Monthly | 10 |
| Netflix | ฿419 | Monthly | 15 |
| Insurance | ฿1,500 | Monthly | 20 |
| Rent | ฿8,000 | Monthly | 1 |

รองรับ:

- Monthly
- Weekly
- Quarterly
- Yearly
- Custom

### Reminder

ตั้งค่า:

- แจ้งก่อน 1 วัน
- 3 วัน
- 7 วัน
- 30 วัน

---

# 5.6 Cash Flow Forecast

ระบบควรคาดการณ์เงินสดในอนาคตจาก:

- รายรับประจำ
- รายจ่ายประจำ
- Bills
- Subscriptions
- Scheduled Expenses
- Financial Goals

ตัวอย่าง:

```text
อีก 10 วัน

เงินคงเหลือปัจจุบัน
฿38,200

ค่าใช้จ่ายที่กำลังจะถึง
-฿12,450

คาดการณ์คงเหลือ
฿25,750
```

---

# 5.7 Subscription Manager

จัดการบริการที่คิดเงินเป็นรอบ:

- Netflix
- Spotify
- iCloud
- Google One
- Adobe
- ChatGPT
- SaaS
- Cloud Services

ข้อมูล:

- Service Name
- Price
- Billing Cycle
- Next Billing Date
- Payment Method
- Category
- Status
- Cancellation URL
- Notes

Dashboard:

```text
Subscriptions

Monthly
฿3,240

Yearly
฿38,880
```

---

# 5.8 Budgets

ผู้ใช้กำหนดงบประมาณ เช่น:

```text
อาหาร
฿8,000 / เดือน

Shopping
฿5,000 / เดือน

Entertainment
฿2,000 / เดือน
```

แสดง Progress:

```text
Food
฿6,450 / ฿8,000
80.6%
```

---

# 5.9 Financial Goals

ตัวอย่าง:

- Emergency Fund
- ซื้อรถ
- ซื้อบ้าน
- เที่ยวญี่ปุ่น
- ซื้อ Computer

ข้อมูล:

- Goal Name
- Target Amount
- Current Amount
- Target Date
- Monthly Contribution
- Account

---

# 6. Purchases & Assets

## 6.1 Purchase History

ทุกการซื้อของควรสามารถบันทึก:

- Product Name
- Brand
- Model
- Category
- Purchase Date
- Price
- Store
- Purchase Channel
- Payment Method
- Serial Number
- SKU
- Receipt
- Product Image
- Product URL
- Warranty
- Notes

---

# 6.2 Asset Management

แยก “รายการซื้อ” ออกจาก “ทรัพย์สินที่ยังใช้งานอยู่”

ตัวอย่าง:

```text
My Assets

💻 MacBook Pro
📱 iPhone
📺 TV
📷 Camera
🚗 Toyota
🏠 Home
```

Asset แต่ละรายการควรมี:

- Purchase
- Warranty
- Maintenance
- Repair
- Documents
- Expenses
- Notes

---

# 6.3 Warranty

เก็บ:

- Warranty Provider
- Start Date
- Expiry Date
- Warranty Type
- Coverage
- Serial Number
- Warranty Document
- Contact
- Terms

แจ้งเตือน:

```text
⚠️ Warranty Expiring

iPhone 17 Pro

หมดประกันใน 30 วัน
```

---

# 7. Vehicle Management

## 7.1 Vehicle Profile

ข้อมูล:

- Brand
- Model
- Year
- License Plate
- VIN
- Color
- Purchase Date
- Purchase Price
- Current Mileage
- Insurance
- Tax
- Registration
- Service Center

---

# 7.2 Maintenance

รายการ:

- Engine Oil
- Oil Filter
- Air Filter
- Brake Pads
- Tires
- Battery
- Transmission Oil
- Coolant
- Air Conditioner
- Periodic Inspection
- Repair
- Other

### Maintenance Record

- Date
- Mileage
- Service Type
- Description
- Parts Cost
- Labor Cost
- Total Cost
- Service Provider
- Receipt
- Notes

---

# 7.3 Maintenance Schedule

รองรับการแจ้งเตือนแบบ:

### Date Based

```text
Next Service
20 October 2026
```

### Mileage Based

```text
Current
12,450 km

Next
15,000 km

Remaining
2,550 km
```

### Date + Mileage

ระบบแจ้งเตือนเมื่อถึงอย่างใดอย่างหนึ่ง

---

# 7.4 Fuel Log

บันทึก:

- Date
- Mileage
- Liters
- Price/Liter
- Total
- Fuel Type
- Station
- Payment Method

คำนวณ:

- Cost per km
- Average km/L
- Monthly Fuel Cost
- Yearly Fuel Cost

---

# 7.5 Vehicle Insurance & Tax

เก็บ:

- Insurance Company
- Policy Number
- Start Date
- Expiry Date
- Premium
- Coverage
- Insurance Document

รวมถึง:

- พ.ร.บ.
- ภาษีรถ
- Registration

และแจ้งเตือนวันหมดอายุ

---

# 8. Home Management

## Home Profile

รองรับบ้าน / คอนโด / ที่พัก

ข้อมูล:

- Property Name
- Address
- Purchase/Rent
- Purchase Date
- Documents
- Notes

## Appliances

ตัวอย่าง:

- Air Conditioner
- Refrigerator
- Washing Machine
- Water Heater
- TV
- Water Pump
- Filter

ข้อมูล:

- Purchase
- Warranty
- Maintenance
- Repair
- Replacement

---

# 9. Home Maintenance

ตัวอย่าง:

- ล้างแอร์
- เปลี่ยนไส้กรอง
- ล้างเครื่องซักผ้า
- ล้างถังน้ำ
- ตรวจระบบไฟฟ้า
- ตรวจปั๊มน้ำ
- ทำความสะอาด
- เปลี่ยนอุปกรณ์

รองรับ Schedule:

```text
Air Conditioner Cleaning
Every 6 months
```

---

# 10. Trip Management

สร้าง Trip เช่น:

```text
🇯🇵 Japan Trip 2027

15 Mar - 20 Mar 2027
4 People
Budget ฿80,000
```

ข้อมูล:

- Trip Name
- Destination
- Start Date
- End Date
- Members
- Budget
- Flights
- Hotel
- Transportation
- Places
- Expenses
- Documents
- Notes

---

# 11. Group Expense & Settlement

Feature สำหรับเดินทางกับเพื่อนหรือกลุ่ม

## Members

ตัวอย่าง:

```text
A
B
C
D
```

## Expense

```text
Hotel
฿4,000

Paid by
A

Split
A / B / C / D
```

ระบบคำนวณยอดที่แต่ละคนต้องรับผิดชอบ

### Example

```text
A paid ฿4,000
B paid ฿1,200
C paid ฿800
D paid ฿0
```

หลังหาร:

```text
A should receive
฿2,000

B should pay
฿500

C should pay
฿700

D should pay
฿1,000
```

ระบบควร Optimize Settlement เพื่อลดจำนวนรายการโอน

เช่น:

```text
D → A ฿1,000
C → A ฿700
B → A ฿500
```

---

# 12. Partial Split

ค่าใช้จ่ายไม่จำเป็นต้องหารทุกคน

ตัวอย่าง:

```text
Beer
฿600

Participants:
A
B
C
```

D ไม่ต้องจ่าย

รองรับ:

- Equal Split
- Percentage Split
- Exact Amount
- Shares
- Selected Members

---

# 13. Calendar

สร้าง **Life Calendar** รวมข้อมูลจากทุก Module

ตัวอย่าง:

```text
20 Sep

🔴 Internet Payment
🟠 Vehicle Maintenance
🟡 iPhone Warranty
🔵 Appointment
🟢 Birthday
🟣 Trip
```

Calendar Views:

- Day
- Week
- Month
- Agenda

---

# 14. Reminder System

รองรับ:

## One-time

```text
จ่ายค่าตั๋วเครื่องบิน
```

## Recurring

```text
จ่าย Internet
ทุกเดือน
```

## Expiration

```text
Insurance
หมดอายุ
```

## Mileage

```text
Vehicle Service
ทุก 10,000 km
```

## Date + Mileage

ระบบแจ้งเมื่อถึงเงื่อนไขใดก่อน

---

# 15. Task Management

ไม่ควรเป็น Todo App เต็มรูปแบบ แต่เน้น Task ที่เกี่ยวกับชีวิต

ตัวอย่าง:

- โทรหาศูนย์
- จ่ายบิล
- นัดช่าง
- ส่งเอกสาร
- ซื้อของ
- ติดต่อประกัน

ข้อมูล:

- Task
- Due Date
- Priority
- Category
- Reminder
- Related Module
- Status

---

# 16. Shopping List

สร้างรายการซื้อของ:

```text
Shopping List

☐ น้ำดื่ม
☐ กระดาษทิชชู่
☐ น้ำยาซักผ้า
☐ อาหาร
```

เมื่อซื้อแล้วสามารถ:

```text
Shopping List
        ↓
Purchase
        ↓
Expense
        ↓
Asset / Inventory
```

ได้โดยไม่ต้องกรอกข้อมูลซ้ำ

---

# 17. Documents Vault

เก็บเอกสารสำคัญ:

- ใบเสร็จ
- Warranty
- ประกัน
- เอกสารรถ
- พ.ร.บ.
- ภาษีรถ
- Passport
- ใบขับขี่
- สัญญา
- เอกสารบ้าน
- ใบรับรอง
- คู่มือสินค้า

## Document Metadata

- Document Name
- Type
- Issue Date
- Expiry Date
- Related Asset
- Related Vehicle
- Related Person
- File
- Notes

สามารถตั้ง Expiration Reminder ได้

---

# 18. Notification Center

รวมทุกสิ่งที่ผู้ใช้ต้องจัดการ

ตัวอย่าง:

```text
🔔 TODAY

🔴 ต้องจ่าย
Internet ฿699

🟠 ใกล้หมดอายุ
iPhone Warranty — 12 วัน

🟡 ต้องเตรียม
Vehicle Service — 800 km

🟢 Upcoming
Japan Trip — 15 Oct
```

ควรมี:

- Read / Unread
- Snooze
- Mark as Done
- Reminder Again
- Notification Settings

---

# 19. Personal Analytics

ระบบควรช่วยให้ผู้ใช้เข้าใจข้อมูลของตัวเอง

## Financial Analytics

- รายรับต่อเดือน
- รายจ่ายต่อเดือน
- Savings Rate
- ค่าใช้จ่ายตามหมวด
- ค่าใช้จ่ายตาม Account
- ค่าใช้จ่ายตาม Merchant
- Fixed Cost
- Variable Cost
- Subscription Cost

## Asset Analytics

- มูลค่าทรัพย์สิน
- ค่าใช้จ่ายในการดูแล
- ค่า Repair
- ค่า Warranty

## Vehicle Analytics

- Fuel Cost
- Maintenance Cost
- Cost/km
- Annual Vehicle Cost

---

# 20. Activity Timeline

ทุก Asset / Vehicle / Purchase ควรมี Timeline

ตัวอย่าง:

```text
🚗 Toyota

2026
│
├── 20 Sep
│   เปลี่ยนน้ำมันเครื่อง
│   ฿1,800
│
├── 12 Aug
│   เติมน้ำมัน
│   ฿1,200
│
├── 05 Jul
│   เปลี่ยนยาง
│   ฿18,000
│
├── 01 Jun
│   เช็กระยะ
│   ฿4,500
│
└── 15 Mar
    ต่อประกัน
    ฿15,000
```

---

# 21. Global Search

ค้นหาข้อมูลทุก Module จากจุดเดียว

ตัวอย่างค้นหา:

```text
iPhone
```

ระบบควรค้นพบ:

- Purchase
- Expense
- Asset
- Warranty
- Receipt
- Document
- Repair
- Notes

รองรับ Search:

- Name
- Brand
- Model
- Serial Number
- Store
- Note
- Tag

---

# 22. AI Assistant

AI เป็น Feature สำคัญในระยะต่อไป

ผู้ใช้สามารถพิมพ์ภาษาธรรมชาติ

### Example 1

```text
วันนี้กินข้าว 85 บาท จ่ายเงินสด
```

ระบบสร้าง:

```text
Expense
Amount: ฿85
Category: Food
Payment: Cash
Date: Today
```

### Example 2

```text
ซื้อ AirPods Pro ที่ Apple 8,990 บาทวันนี้ ประกัน 1 ปี
```

ระบบสร้าง:

```text
Purchase
Asset
Expense
Warranty
Reminder
```

### Example 3

```text
เดือนหน้าจะไปเชียงใหม่ 3 วันกับ A B C
```

ระบบสามารถเตรียม:

```text
Trip
Members
Dates
Budget
Expense Group
```

---

# 23. Quick Add

ปุ่ม `+` ควรอยู่ในตำแหน่งที่เข้าถึงง่ายเสมอ

```text
+ เพิ่ม

💸 รายจ่าย
💰 รายรับ
🛒 ซื้อของ
🚗 เติมน้ำมัน
🔧 ซ่อมรถ
📅 นัดหมาย
🔔 เตือน
✈️ ทริป
📝 งาน
📄 เอกสาร
```

หลักการ:

> การบันทึกข้อมูลทั่วไปควรใช้เวลาไม่เกินไม่กี่วินาที

---

# 24. Smart Data Linking

ข้อมูลแต่ละ Module ต้องเชื่อมโยงกัน

ตัวอย่าง:

```text
Purchase
   │
   ├── Expense
   │
   ├── Asset
   │     ├── Warranty
   │     ├── Maintenance
   │     └── Documents
   │
   └── Store
```

Vehicle:

```text
Vehicle
   │
   ├── Fuel
   ├── Maintenance
   ├── Repair
   ├── Insurance
   ├── Tax
   └── Expenses
```

Trip:

```text
Trip
   │
   ├── Members
   ├── Expenses
   ├── Settlement
   ├── Documents
   └── Calendar
```

---

# 25. Suggested Navigation

สำหรับ Desktop:

```text
Sidebar

🏠 Dashboard

💰 Money
   Overview
   Income
   Expenses
   Accounts
   Cards
   Bills
   Subscriptions
   Budgets
   Goals

📦 Assets
   Purchases
   Assets
   Warranty
   Documents

🚗 Vehicles

🏠 Home

✈️ Trips

📅 Calendar

✅ Tasks

🛒 Shopping

🔔 Notifications

🤖 AI Assistant
```

สำหรับ Mobile:

```text
Bottom Navigation

Home
Money
+
Calendar
More
```

โดย `+` เป็น Quick Add

---

# 26. UX Design Principles

## 26.1 Minimal Input

ไม่บังคับกรอกทุก Field

แบ่งเป็น:

### Required

- Name
- Amount
- Date

### Optional

- Note
- Receipt
- Store
- Location
- Tags

### Advanced

- Serial Number
- Warranty
- Documents
- Metadata

---

## 26.2 Progressive Disclosure

แสดงข้อมูลพื้นฐานก่อน

จากนั้นให้กด:

> More Details

เพื่อเปิดข้อมูลขั้นสูง

---

## 26.3 Mobile First

แม้จะเป็น Web App แต่ควรออกแบบ Mobile First เพราะผู้ใช้จะบันทึกข้อมูลจากมือถือเป็นหลัก

รองรับ:

- Responsive
- PWA
- Add to Home Screen
- Offline-first สำหรับข้อมูลพื้นฐาน
- Camera Upload
- File Upload

---

# 27. MVP Roadmap

ไม่ควรสร้างทุก Feature พร้อมกัน

## Phase 1 — Core Life OS

### Modules

- Dashboard
- Income
- Expenses
- Accounts
- Bills
- Recurring Expenses
- Calendar
- Reminder
- Quick Add

เป้าหมาย:

> ทำให้ผู้ใช้สามารถใช้ระบบทุกวันได้จริง

---

# 28. Phase 2 — Assets

เพิ่ม:

- Purchases
- Assets
- Warranty
- Documents
- Global Search

เป้าหมาย:

> รู้ว่าเรามีอะไร ซื้อจากไหน ราคาเท่าไร และยังมีประกันหรือไม่

---

# 29. Phase 3 — Vehicle

เพิ่ม:

- Vehicle
- Fuel
- Maintenance
- Repair
- Insurance
- Tax
- Mileage Reminder

---

# 30. Phase 4 — Trips

เพิ่ม:

- Trip
- Members
- Group Expenses
- Split
- Settlement
- Trip Budget

---

# 31. Phase 5 — Smart Life OS

เพิ่ม:

- AI Assistant
- Smart Analytics
- Cash Flow Forecast
- Smart Reminder
- Automatic Data Linking
- Natural Language Input

---

# 32. Recommended Future Features

สามารถพิจารณาเพิ่มในอนาคต:

- Family Sharing
- Shared Household
- Multiple Profiles
- Bank Integration
- Automatic Transaction Import
- OCR ใบเสร็จ
- Receipt Scanner
- QR / Barcode Scanner
- Currency Conversion
- Multi-Currency Trip
- Investment Tracking
- Net Worth
- Debt Tracking
- Loan Tracking
- Medical Appointment Reminder
- Pet Management
- Personal Contacts
- Birthday Reminder
- Important Dates
- Emergency Information

---

# 33. Long-term Vision

เป้าหมายระยะยาวของระบบคือการเป็น

> **Personal Operating System**

ไม่ใช่แอปการเงิน

ไม่ใช่ Todo App

ไม่ใช่ Expense Tracker

แต่เป็นระบบที่เชื่อมโยง:

```text
Money
+
Assets
+
Vehicle
+
Home
+
Travel
+
Tasks
+
Calendar
+
Documents
+
Reminders
+
AI
```

ทั้งหมดเข้าด้วยกัน

---

# 34. Core Product Philosophy

## One App

ข้อมูลชีวิตทั้งหมดอยู่ในที่เดียว

## One Record

บันทึกข้อมูลครั้งเดียว แล้วนำไปใช้กับหลาย Module

## One Timeline

ทุกสิ่งมีประวัติ

## One Calendar

ทุกกำหนดการรวมอยู่ใน Calendar เดียว

## One Notification Center

สิ่งที่ต้องทำถูกรวมไว้ในที่เดียว

## One AI Assistant

ผู้ใช้สามารถสั่งงานด้วยภาษาธรรมชาติ

---

# 35. Final Product Vision

```text
                    PERSONAL LIFE OS
                           │
          ┌────────────────┼────────────────┐
          │                │                │
        MONEY           ASSETS           LIFE
          │                │                │
      Expenses         Purchases        Calendar
      Income           Warranty         Tasks
      Bills            Documents        Trips
      Accounts         Vehicles         Shopping
      Cards            Home            Reminders
      Goals
          │                │                │
          └────────────────┼────────────────┘
                           │
                     AI ASSISTANT
                           │
                    SMART AUTOMATION
```

## Final Principle

> **The system should not only remember what happened.**
>
> **It should help the user know what needs to happen next.**
