import WebSocket from 'ws';
import { EventEmitter } from 'events';

import * as CONSTANTS from '../types/constants';

export class WebSocketClient extends EventEmitter {
private ws: WebSocket | null = null;
private url: string;
private pingInterval: NodeJS.Timeout | null = null;
private reconnectAttempts: number = 0;
private maxReconnectAttempts: number = 5;
private reconnectDelay: number = 5000;

constructor(testnet: boolean = false) {
    super();
    this.url = testnet ? CONSTANTS.WSS_URLS.TESTNET : CONSTANTS.WSS_URLS.PRODUCTION;
}

connect(): Promise<void> {
    return new Promise((resolve, reject) => {
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.startPingInterval();
        resolve();
    });

    this.ws.on('message', (data: WebSocket.Data) => {
        const message = JSON.parse(data.toString());
        this.emit('message', message);
    });

    this.ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        reject(error);
    });

    this.ws.on('close', () => {
        console.log('WebSocket disconnected');
        this.stopPingInterval();
        this.reconnect();
    });
    });
}

private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
    console.error('Max reconnection attempts reached. Please reconnect manually.');
    }
}

private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
    this.sendMessage({ method: 'ping' });
    }, 30000); // Send ping every 30 seconds
}

private stopPingInterval(): void {
    if (this.pingInterval) {
    clearInterval(this.pingInterval);
    this.pingInterval = null;
    }
}

sendMessage(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
    throw new Error('WebSocket is not connected');
    }
    this.ws.send(JSON.stringify(message));
}

close(): void {
    if (this.ws) {
    this.ws.close();
    }
    this.stopPingInterval();
}
}