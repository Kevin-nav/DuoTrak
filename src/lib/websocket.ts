type MessageCallback = (message: string) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private messageCallbacks: MessageCallback[] = [];
  private isConnectedFlag: boolean = false;

  constructor(url: string) {
    this.url = url;
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnectedFlag = true;
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.messageCallbacks.forEach(callback => callback(event.data));
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnectedFlag = false;
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnectedFlag = false;
        reject(error);
      };
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
  }

  public send(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  public onMessage(callback: MessageCallback): void {
    this.messageCallbacks.push(callback);
  }

  public isConnected(): boolean {
    return this.isConnectedFlag;
  }
}
