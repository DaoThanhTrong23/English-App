const fs = require('fs');

// Fix mario-game.service.ts
let service = fs.readFileSync('backend-api/src/module/mario-game/mario-game.service.ts', 'utf8');
service = service.replace(
  /\/\/ Xáo trộn danh sách bong bóng từ vựng[\s\S]*?return \{/m,
  `return {`
);
fs.writeFileSync('backend-api/src/module/mario-game/mario-game.service.ts', service);

// Fix mario-game.schema.ts
let schema = fs.readFileSync('backend-api/src/module/mario-game/mario-game.schema.ts', 'utf8');
schema = schema.replace(/meaningId: z\.number\(\),/g, ''); // Ensure meaningId is removed from ProgressGameSchema
fs.writeFileSync('backend-api/src/module/mario-game/mario-game.schema.ts', schema);
