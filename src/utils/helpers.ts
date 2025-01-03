import axios, { AxiosInstance } from 'npm:axios';
import { handleApiError } from './errors.ts';
import { RateLimiter } from './rateLimiter.ts';


export class HttpApi {
    private client: AxiosInstance;
    private endpoint: string;
    private rateLimiter: RateLimiter;

    constructor(baseUrl: string, endpoint: string = "/", rateLimiter: RateLimiter) {
        this.endpoint = endpoint;
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 5000, 
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.rateLimiter = rateLimiter;
    }

    async makeRequest(payload: any, weight: number = 2, endpoint: string = this.endpoint,): Promise<any> {
        try {

            await this.rateLimiter.waitForToken(weight);

            const response = await this.client.post(endpoint, payload);
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    }
}
