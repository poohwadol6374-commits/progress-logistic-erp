import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create Mock Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      plate: '1กข 1234',
      type: '6 ล้อ',
      maxWeight: 5000,
      maxCbm: 15,
      status: 'AVAILABLE'
    }
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      plate: '2คฆ 5678',
      type: '10 ล้อ',
      maxWeight: 15000,
      maxCbm: 30,
      status: 'AVAILABLE'
    }
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      plate: '3งจ 9012',
      type: 'กระบะ 4 ล้อ',
      maxWeight: 3000,
      maxCbm: 5,
      status: 'AVAILABLE'
    }
  });

  // Create Mock Bills
  await prisma.bill.create({
    data: {
      billNumber: 'BL-2023-010',
      customer: 'บริษัท A จำกัด',
      province: 'เชียงใหม่',
      weight: 1200,
      cbm: 4,
      status: 'PENDING'
    }
  });

  await prisma.bill.create({
    data: {
      billNumber: 'BL-2023-011',
      customer: 'บริษัท B จำกัด',
      province: 'เชียงใหม่',
      weight: 4000,
      cbm: 12,
      status: 'PENDING'
    }
  });

  await prisma.bill.create({
    data: {
      billNumber: 'BL-2023-012',
      customer: 'หจก. C',
      province: 'ลำพูน',
      weight: 800,
      cbm: 2,
      status: 'PENDING'
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
