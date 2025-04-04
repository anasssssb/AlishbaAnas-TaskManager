import { useEffect, useRef, useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import { Notification, Task, Comment } from '@shared/schema';

// WebSocket message types
type WebSocketMessageType = 'task_update' | 'comment_added' | 'notification' | 'task_assigned' | 'connected';

type WebSocketMessage = {
  type: WebSocketMessageType;
  payload: any;
};

// WebSocket context
interface WebSocketContextType {
  connected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// WebSocket provider
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Connect to WebSocket server
  useEffect(() => {
    if (!user) {
      // Not authenticated, don't connect
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setConnected(true);
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log('WebSocket message received:', message);
        setLastMessage(message);
        
        // Handle different message types
        handleWebSocketMessage(message);
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    // Connection closed
    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    });
    
    // Connection error
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to the real-time service',
        variant: 'destructive',
      });
    });
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [user, toast]);
  
  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    const { type, payload } = message;
    
    switch (type) {
      case 'connected':
        toast({
          title: 'Connected',
          description: 'Real-time updates are now active',
        });
        break;
        
      case 'notification':
        const notification = payload as Notification;
        toast({
          title: notification.title,
          description: notification.message,
        });
        break;
        
      case 'task_update':
        // Handle task updates
        if (payload.action === 'created') {
          const task = payload.task as Task;
          toast({
            title: 'New Task',
            description: `Task "${task.title}" has been created`,
          });
        } else if (payload.action === 'updated') {
          const task = payload.task as Task;
          toast({
            title: 'Task Updated',
            description: `Task "${task.title}" has been updated`,
          });
        } else if (payload.action === 'deleted') {
          toast({
            title: 'Task Deleted',
            description: `A task has been removed`,
          });
        }
        break;
        
      case 'comment_added':
        const { comment, task } = payload;
        toast({
          title: 'New Comment',
          description: `New comment on task "${task.title}"`,
        });
        break;
        
      case 'task_assigned':
        const assignedTask = payload.task as Task;
        toast({
          title: 'Task Assignment',
          description: `Task "${assignedTask.title}" has been assigned`,
        });
        break;
        
      default:
        break;
    }
  }, [toast]);
  
  // Send message to WebSocket server
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
      toast({
        title: 'Connection Error',
        description: 'Not connected to the real-time service',
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  return (
    <WebSocketContext.Provider
      value={{
        connected,
        sendMessage,
        lastMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

// Custom hook to use WebSocket context
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}