"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
];
function corsOrigin(origin, callback) {
    if (!origin)
        return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin))
        return callback(null, true);
    if (origin.endsWith('.vercel.app'))
        return callback(null, true);
    callback(new Error('Not allowed by CORS'), false);
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: corsOrigin,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(`\n🚀 resPOS API running on http://localhost:${port}/api/v1`);
}
bootstrap();
//# sourceMappingURL=main.js.map