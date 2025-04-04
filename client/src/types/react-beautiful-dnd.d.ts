declare module 'react-beautiful-dnd' {
  import * as React from 'react';

  // DraggableProvided
  export interface DraggableProvided {
    draggableProps: React.DOMAttributes<HTMLElement> & {
      'data-rbd-draggable-context-id': string;
      'data-rbd-draggable-id': string;
      style?: React.CSSProperties;
      [key: string]: any;
    };
    dragHandleProps: React.DOMAttributes<HTMLElement> & {
      'data-rbd-drag-handle-draggable-id': string;
      'data-rbd-drag-handle-context-id': string;
      'aria-labelledby': string;
      tabIndex: number;
      role: string;
      [key: string]: any;
    } | null;
    innerRef: React.RefCallback<HTMLElement>;
  }

  // DroppableProvided
  export interface DroppableProvided {
    innerRef: React.RefCallback<HTMLElement>;
    droppableProps: {
      'data-rbd-droppable-id': string;
      'data-rbd-droppable-context-id': string;
      [key: string]: any;
    };
    placeholder?: React.ReactElement | null;
  }

  // Other necessary interfaces
  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    draggingOver: string | null;
    dropAnimation: {
      duration: number;
      curve: string;
      moveTo: {
        x: number;
        y: number;
      };
    } | null;
    mode: string | null;
    combineWith: string | null;
    combineTargetFor: string | null;
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith: string | null;
    draggingFromThisWith: string | null;
    isUsingPlaceholder: boolean;
  }

  export interface DragDropContextProps {
    onDragEnd: (result: DropResult, provided: ResponderProvided) => void;
    onDragStart?: (start: DragStart, provided: ResponderProvided) => void;
    onDragUpdate?: (update: DragUpdate, provided: ResponderProvided) => void;
    children: React.ReactNode;
    dragHandleUsageInstructions?: string;
    nonce?: string;
    enableDefaultSensors?: boolean;
    sensors?: Sensor[];
  }

  export interface DraggableProps {
    draggableId: string;
    index: number;
    children: (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot
    ) => React.ReactElement;
    isDragDisabled?: boolean;
    disableInteractiveElementBlocking?: boolean;
    shouldRespectForcePress?: boolean;
  }

  export interface DroppableProps {
    droppableId: string;
    children: (
      provided: DroppableProvided,
      snapshot: DroppableStateSnapshot
    ) => React.ReactElement;
    type?: string;
    mode?: 'standard' | 'virtual';
    isDropDisabled?: boolean;
    isCombineEnabled?: boolean;
    ignoreContainerClipping?: boolean;
    renderClone?: any;
    getContainerForClone?: () => HTMLElement;
  }

  export interface DropResult {
    draggableId: string;
    type: string;
    source: {
      droppableId: string;
      index: number;
    };
    destination: {
      droppableId: string;
      index: number;
    } | null;
    reason: 'DROP' | 'CANCEL';
    mode: 'FLUID' | 'SNAP';
    combine: any | null;
  }

  export interface ResponderProvided {
    announce: (message: string) => void;
  }

  export interface DragStart {
    draggableId: string;
    type: string;
    source: {
      droppableId: string;
      index: number;
    };
    mode: 'FLUID' | 'SNAP';
  }

  export interface DragUpdate extends DragStart {
    destination?: {
      droppableId: string;
      index: number;
    };
    combine?: any;
  }

  export interface Sensor {}

  export const DragDropContext: React.FunctionComponent<DragDropContextProps>;
  export const Droppable: React.FunctionComponent<DroppableProps>;
  export const Draggable: React.FunctionComponent<DraggableProps>;
}