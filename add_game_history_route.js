const fs = require('fs');

let serviceCode = fs.readFileSync('backend-api/src/module/game/game.service.ts', 'utf8');
const historyServiceFunc = `
  async getHistory(userId: number) {
    const history = await prisma.gameHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    // Group by gameCode to get best score and count
    const stats = await prisma.gameHistory.groupBy({
      by: ['gameCode'],
      where: { userId },
      _max: { score: true },
      _count: { id: true }
    });
    
    return { history, stats };
  }
`;
if (!serviceCode.includes('getHistory(userId: number)')) {
  serviceCode = serviceCode.replace('async play(code: string, difficulty: string, userCefrLevel: string) {', historyServiceFunc + '\n  async play(code: string, difficulty: string, userCefrLevel: string) {');
  fs.writeFileSync('backend-api/src/module/game/game.service.ts', serviceCode);
}

let routeCode = fs.readFileSync('backend-api/src/module/game/game.route.ts', 'utf8');
const historyRouteFunc = `
gameRouter.get("/history", Authenticate, asyncHandler(async (req, res) => {
  const data = await gameService.getHistory(req.user.id);
  res.status(200).json({ success: true, data });
}));
`;
if (!routeCode.includes('"/history"')) {
  routeCode = routeCode.replace('gameRouter.get("/:code/play", Authenticate, asyncHandler(async (req, res) => {', historyRouteFunc + '\n// ========================\ngameRouter.get("/:code/play", Authenticate, asyncHandler(async (req, res) => {');
  fs.writeFileSync('backend-api/src/module/game/game.route.ts', routeCode);
}
