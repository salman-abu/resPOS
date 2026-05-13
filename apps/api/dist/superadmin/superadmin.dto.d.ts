import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
export declare class SuperAdminLoginDto {
    email: string;
    passwordString: string;
}
export declare class UpdateSubscriptionDto {
    subscription_plan?: SubscriptionPlan;
    subscription_status?: SubscriptionStatus;
    subscription_start_at?: string;
    subscription_ends_at?: string;
}
