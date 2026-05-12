import { $Enums } from '@prisma/client';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: $Enums.Role[]) => import("@nestjs/common").CustomDecorator<string>;
