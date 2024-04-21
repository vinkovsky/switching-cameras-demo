"use client";

import { Canvas } from "@react-three/fiber";
import { useEditorStore } from "./editor-store";

import Box from "./box";
import GizmoViewCube from "./gizmo-view-cube";
import { Camera } from "./camera-view";

const Viewport = (): JSX.Element => {
  const { count, incrementCount, decrementCount } = useEditorStore(
    (state) => state
  );

  return (
    <Canvas onDoubleClick={incrementCount} onContextMenu={decrementCount}>
      <Camera />
      {/* <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={10} /> */}
      <GizmoViewCube />
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />

      <Box position={[-1.2, 0, 0]} />
      <Box position={[count, 0, 0]} />
    </Canvas>
  );
};

export default Viewport;
