import { prisma } from './src/config/prisma.ts';
prisma.$queryRaw`SELECT 1`.then(console.log).catch(console.error).finally(()=>prisma.$disconnect());
