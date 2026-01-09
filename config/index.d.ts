export interface Config {
    api: {
        port: number;
        host: string;
    };
    dev: {
        port: number;
    };
    test: {
        port: number;
    };
}
export declare const config: Config;
