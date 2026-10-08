import { Injectable, signal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { TicketEvent } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client | null = null;
  isConnected = signal<boolean>(false);
  latestEvent = signal<TicketEvent | null>(null);
  slaAlerts = signal<TicketEvent[]>([]);

  connect(): void {
    if (this.client && this.client.active) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const brokerURL = `${protocol}//${host}/ws-servicedesk`;

    this.client = new Client({
      brokerURL: brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.isConnected.set(true);
        console.log('WebSocket Connected successfully to ServiceDesk STOMP broker');

        // Subscribe to general ticket updates
        this.client?.subscribe('/topic/tickets', (msg: IMessage) => {
          try {
            const event: TicketEvent = JSON.parse(msg.body);
            this.latestEvent.set(event);
          } catch (e) {
            console.error('Error parsing ticket event', e);
          }
        });

        // Subscribe to SLA alerts
        this.client?.subscribe('/topic/sla-alerts', (msg: IMessage) => {
          try {
            const alertEvent: TicketEvent = JSON.parse(msg.body);
            this.slaAlerts.update((alerts) => [alertEvent, ...alerts].slice(0, 10));
          } catch (e) {
            console.error('Error parsing SLA alert', e);
          }
        });
      },
      onDisconnect: () => {
        this.isConnected.set(false);
      },
      onStompError: (frame) => {
        console.warn('STOMP Error:', frame.headers['message']);
        this.isConnected.set(false);
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.isConnected.set(false);
    }
  }
}
