import { BaseEdge, Position } from '@xyflow/react';
import { AP_NODE_SIZE, ApNodeType } from '../flow-canvas-utils';

interface ReturnLoopedgeButtonProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  style?: React.CSSProperties;
  data: Record<string, unknown>;
  arrowHeadType?: string;
  markerEndId?: string;
}

const ReturnLoopedgeButton: React.FC<ReturnLoopedgeButtonProps> = (props) => {

  const offset = AP_NODE_SIZE[ApNodeType.LOOP_PLACEHOLDER].height + 6;

  const ARC_UP_RIGHT = 'a15,15 0 0,1 15,-15'
  const ARC_UP_LENGTH = 15;
  const ARROW = 'm-5 -6 l6 6  m-6 0 m6 0 l-6 6 m3 -6'
  const edgePath = `M ${props.targetX} ${props.targetY + offset} 
  v${-60 - offset + ARC_UP_LENGTH} ${ARC_UP_RIGHT} 
  h${props.sourceX - props.targetX - 30}
  ${ARROW}`;
  return (
    <>
      <BaseEdge path={edgePath}
        interactionWidth={0}
      />
    </>
  );
};

export { ReturnLoopedgeButton };
