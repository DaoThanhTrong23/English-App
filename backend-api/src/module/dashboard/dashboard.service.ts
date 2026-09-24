import { prisma } from '../../config/prisma.js';

export class DashboardService {
  async getDashboardStats() {
    const totalStudents = await prisma.user.count({ where: { role: 'user' } });
    const totalCourses = await prisma.lesson.count();
    const totalWords = await prisma.word.count();
    const totalTests = await prisma.test.count();
    
    // Level distribution
    const soCap = await prisma.user.count({ where: { role: 'user', xpPoints: { lt: 100 } } });
    const trungCap = await prisma.user.count({ where: { role: 'user', xpPoints: { gte: 100, lt: 500 } } });
    const caoCap = await prisma.user.count({ where: { role: 'user', xpPoints: { gte: 500 } } });

    const levelData = [
      { name: 'Sơ cấp (A1-A2)', value: soCap },
      { name: 'Trung cấp (B1-B2)', value: trungCap },
      { name: 'Cao cấp (C1-C2)', value: caoCap },
    ];

    // Traffic data (7 days)
    const trafficData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const startOfDay = new Date(d.setHours(0,0,0,0));
      const endOfDay = new Date(d.setHours(23,59,59,999));
      
      const newUsers = await prisma.user.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay }, role: 'user' }
      });
      
      const activeUsers = await prisma.loginLog.count({
        where: { loginTime: { gte: startOfDay, lte: endOfDay } }
      });

      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      trafficData.push({
        name: dayNames[startOfDay.getDay()],
        new: newUsers,
        active: activeUsers
      });
    }

    return {
      totalStudents,
      totalCourses,
      totalWords,
      totalTests,
      levelData,
      trafficData
    };
  }
}

export const dashboardService = new DashboardService();
