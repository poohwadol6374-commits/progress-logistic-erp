import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// API: Get all vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { bills: true }
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// API: Bulk Import Vehicles
app.post('/api/vehicles/bulk', async (req, res) => {
  const { vehicles } = req.body;
  if (!Array.isArray(vehicles)) {
    return res.status(400).json({ error: 'Invalid data format. Expected an array of vehicles.' });
  }

  try {
    let count = 0;
    for (const v of vehicles) {
      const plateStr = String(v.plate);
      const exists = await prisma.vehicle.findUnique({ where: { plate: plateStr } });
      if (!exists) {
        await prisma.vehicle.create({
          data: {
            plate: plateStr,
            type: String(v.type || 'ไม่ระบุ'),
            maxWeight: Number(v.maxWeight) || 0,
            maxCbm: Number(v.maxCbm) || 0,
            status: 'AVAILABLE'
          }
        });
        count++;
      }
    }
    res.json({ success: true, count });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Bulk import failed', details: error.message });
  }
});

// API: Get unassigned bills
app.get('/api/bills', async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      where: { status: 'PENDING' }
    });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// API: Create new bill (From OCR Center)
app.post('/api/bills', async (req, res) => {
  const { billNumber, customer, province, items, maxWeight, maxCbm } = req.body;
  if (!billNumber || !customer || !province) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newBill = await prisma.bill.create({
      data: {
        billNumber,
        customer,
        province,
        items,
        maxWeight: Number(maxWeight) || 0,
        maxCbm: Number(maxCbm) || 0,
        status: 'PENDING',
        logs: {
          create: { status: 'PENDING', note: 'Created new bill via OCR' }
        }
      }
    });
    res.json(newBill);
  } catch (error: any) {
    console.error('Create bill error:', error);
    res.status(500).json({ error: 'Failed to create bill', details: error.message });
  }
});

// API: Assign bill to vehicle
app.post('/api/dispatch/assign', async (req, res) => {
  const { billId, vehicleId } = req.body;
  
  try {
    const bill = await prisma.bill.findUnique({ where: { id: billId } });
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });

    if (!bill || !vehicle) {
      return res.status(404).json({ error: 'Bill or Vehicle not found' });
    }

    // Capacity Validation Backend Logic
    const newWeight = vehicle.currentWeight + bill.weight;
    const newCbm = vehicle.currentCbm + bill.cbm;

    if (newWeight > vehicle.maxWeight || newCbm > vehicle.maxCbm) {
      // In real PRD, we might allow it with a WARNING state and Supervisor approval,
      // but for V1 we return an overload warning status.
      return res.status(400).json({ 
        error: 'OVERLOAD_WARNING', 
        message: 'Assigning this bill will overload the vehicle capacity.' 
      });
    }

    // Update vehicle and bill
    await prisma.$transaction([
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: { 
          currentWeight: newWeight, 
          currentCbm: newCbm 
        }
      }),
      prisma.bill.update({
        where: { id: billId },
        data: { 
          vehicleId: vehicleId,
          status: 'ASSIGNED',
          logs: {
            create: { status: 'ASSIGNED', note: `Assigned to vehicle ${vehicle.plate}` }
          }
        }
      })
    ]);

    res.json({ success: true, message: 'Assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Assignment failed' });
  }
});

// API: Bulk Assign bills to vehicles (AI Auto-Dispatch)
app.post('/api/dispatch/assign/bulk', async (req, res) => {
  const { assignments } = req.body; // Array of { billId, vehicleId, newWeight, newCbm }
  
  if (!Array.isArray(assignments)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    const transactions = [];

    // Group updates by vehicle to prevent conflicting updates in same transaction
    const vehicleUpdates = new Map();
    for (const a of assignments) {
      vehicleUpdates.set(a.vehicleId, { weight: a.newWeight, cbm: a.newCbm });
      
      // Add bill update query
      transactions.push(
        prisma.bill.update({
          where: { id: a.billId },
          data: { 
            vehicleId: a.vehicleId, 
            status: 'ASSIGNED',
            logs: {
              create: { status: 'ASSIGNED', note: 'Auto-Assigned by AI Dispatcher' }
            }
          }
        })
      );
    }

    // Add vehicle update queries
    for (const [vId, updates] of vehicleUpdates.entries()) {
      transactions.push(
        prisma.vehicle.update({
          where: { id: vId },
          data: { currentWeight: updates.weight, currentCbm: updates.cbm }
        })
      );
    }

    await prisma.$transaction(transactions);
    res.json({ success: true, count: assignments.length });
  } catch (error) {
    console.error('Bulk assignment error:', error);
    res.status(500).json({ error: 'Bulk assignment failed' });
  }
});

// API: Delete vehicle
app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    await prisma.vehicle.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// API: Update Bill Status (For Driver App)
app.put('/api/bills/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedBill = await prisma.bill.update({
      where: { id: req.params.id },
      data: { 
        status,
        logs: {
          create: { status, note: `Status updated to ${status} via Driver App` }
        }
      }
    });
    res.json(updatedBill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bill status' });
  }
});

// API: Update Vehicle Status (For Driver App)
app.put('/api/vehicles/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vehicle status' });
  }
});

// API: Get Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalBills = await prisma.bill.count();
    const pendingBills = await prisma.bill.count({ where: { status: 'PENDING' } });
    const assignedBills = await prisma.bill.count({ where: { status: 'ASSIGNED' } });

    const totalVehicles = await prisma.vehicle.count();
    const availableVehicles = await prisma.vehicle.count({ where: { status: 'AVAILABLE' } });
    const inTransitVehicles = await prisma.vehicle.count({ where: { status: 'IN_TRANSIT' } });

    // Aggregate bills by province
    const provinceGroups = await prisma.bill.groupBy({
      by: ['province'],
      _count: { province: true }
    });
    
    const billsByProvince = provinceGroups.map(g => ({
      name: g.province,
      value: g._count.province
    })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 provinces

    res.json({
      bills: { total: totalBills, pending: pendingBills, assigned: assignedBills },
      vehicles: { total: totalVehicles, available: availableVehicles, inTransit: inTransitVehicles },
      billsByProvince
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// API: Get All Bills for Reporting
app.get('/api/reports/bills', async (req, res) => {
  try {
    const allBills = await prisma.bill.findMany({
      include: {
        vehicle: true,
        logs: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(allBills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports data' });
  }
});

// API: Get All Bills (Used by BillList with full history)
app.get('/api/bills/all', async (req, res) => {
  try {
    const allBills = await prisma.bill.findMany({
      include: {
        vehicle: true,
        logs: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(allBills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Serve React Frontend (Single App Mode for Production / Railway)
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Fallback for React Router
app.get('*', (req, res) => {
  // Only serve index.html if it's not an API request
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 ERP Backend API Server is running on http://localhost:${PORT}\n`);
});
