import { GizmoHelper, GizmoViewcube } from "@react-three/drei";
import { ThreeEvent, useThree } from "@react-three/fiber";

import { useEffect, useRef } from "react";
import { Spherical, Vector3, Group, Scene, EventDispatcher } from "three";
import { fitCameraToSceneBoundingSphere } from "./camera-view";
import CameraControls from "camera-controls";

const sphericalCoords = new Spherical();
const pos = new Vector3();

const GizmoViewCube = () => {
  const scene = useThree<Scene>((state) => state.scene);
  const controls = useThree((state) => state.controls) as EventDispatcher &
    CameraControls;
  const group = useRef<Group | null>(null);

  useEffect(() => {
    if (group.current) {
      const [viewcube] = group.current.children;
      // Workaround for resizing the viewcube
      viewcube.scale.set(45, 45, 45);
    }
  }, []);
  /**
   * https://github.com/pmndrs/drei/issues/1399
   * https://github.com/seasick/3mf-color-changer/commit/96b5f34c1af3e43a63dca8eb4c46bd8984cf9dd4
   */
  const tweenCamera = (position: Vector3) => {
    const point = sphericalCoords.setFromVector3(
      pos.set(position.x, position.y, position.z)
    );

    fitCameraToSceneBoundingSphere(controls, scene);

    if (controls.rotateTo) {
      controls.rotateTo(point.theta, point.phi, true);
    }
  };

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    const { face, eventObject, stopPropagation } = event;
    stopPropagation();

    // console.log(eventObject);

    if (eventObject.position.length() === 0) {
      tweenCamera(face ? face.normal : eventObject.position);
    } else {
      tweenCamera(eventObject.position);
    }

    return null;
  };

  return (
    <GizmoHelper margin={[80, 80]} alignment="bottom-center" renderPriority={2}>
      <group ref={group}>
        <GizmoViewcube
          onClick={onClick}
          color="#1F78FF"
          textColor="#FFFFFF"
          hoverColor="#bbdeff"
          strokeColor="#000000"
          font="20px Arial"
        />
      </group>
    </GizmoHelper>
  );
};

export default GizmoViewCube;
