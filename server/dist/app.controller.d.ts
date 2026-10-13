import { Connection } from 'mongoose';
export declare class AppController {
    private readonly connection;
    constructor(connection: Connection);
    live(): {
        status: string;
    };
    ready(): {
        __raw: {
            success: boolean;
            error: {
                code: string;
                message: string;
                fieldErrors: {};
            };
        };
        status?: undefined;
        database?: undefined;
    } | {
        status: string;
        database: string;
        __raw?: undefined;
    };
}
