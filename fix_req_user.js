const fs = require('fs');

let routeCode = fs.readFileSync('backend-api/src/module/game/game.route.ts', 'utf8');
routeCode = routeCode.replace(/req\.user\.id/g, '(req as any).user.id');
fs.writeFileSync('backend-api/src/module/game/game.route.ts', routeCode);
