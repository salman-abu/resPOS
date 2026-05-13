import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): Promise<{
        status: string;
        database: string;
    }>;
    getHealth(): {
        status: string;
        timestamp: string;
    };
}
