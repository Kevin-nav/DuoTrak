import { WebSocketService } from './websocket';

// Mock the global WebSocket object
class MockWebSocket {
  public onopen: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onclose: (() => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public readyState: number = WebSocket.CONNECTING;
  public url: string;
  private messages: string[] = [];

  constructor(url: string) {
    this.url = url;
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 10);
  }

  public close(): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }

  public send(message: string): void {
    this.messages.push(message);
    // Simulate receiving the message back (for echo-like behavior)
    if (this.onmessage) this.onmessage({ data: message });
  }

  public getSentMessages(): string[] {
    return this.messages;
  }
}

// Assign our mock to the global WebSocket
Object.defineProperty(global, 'WebSocket', {
  writable: true,
  value: MockWebSocket,
});

describe('WebSocketService', () => {
  it('should connect to the WebSocket server', async () => {
    const service = new WebSocketService('wss://localhost:8001/ws/chat/test-conversation?token=test-token');
    await service.connect();
    expect(service.isConnected()).toBe(true);
    service.disconnect();
  });

  it('should send and receive messages', async () => {
    const service = new WebSocketService('wss://localhost:8001/ws/chat/test-conversation?token=test-token');
    await service.connect();

    const receivedMessages: string[] = [];
    service.onMessage((message) => {
      receivedMessages.push(message);
    });

    service.send('Hello from client');

    // Give some time for message to be sent and received
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(receivedMessages).toContain('Hello from client');
    service.disconnect();
  });
});
