import { GizmoHelper, GizmoViewcube } from "@react-three/drei";
import { RootState, ThreeEvent, useThree } from "@react-three/fiber";
import { EffectComposer, Grid } from "@react-three/postprocessing";

import { Suspense, useEffect, useRef } from "react";
import { Box3, Spherical, Vector3, Sphere, Group, Scene } from "three";
import CameraControlsImpl, { EventDispatcher } from "camera-controls";

const sphere = new Sphere();
const sphericalCoords = new Spherical();
const boundingBox = new Box3();
const center = new Vector3();
const pos = new Vector3();
const defaultRadius = 1;
const enableTransition = true;

const X = "X";
const Y = "Y";
const Z = "Z";

const GizmoViewCube = () => {
  const scene = useThree<Scene>((state) => state.scene);
  const controls = useThree((state) => state.controls);

  console.log(controls);
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

    const bbox = boundingBox.setFromObject(scene);

    if (controls.fitToSphere) {
      // https://stackoverflow.com/a/63243915/11416728
      controls.fitToSphere(
        bbox.getBoundingSphere(
          sphere.set(bbox.getCenter(center), defaultRadius)
        ),
        enableTransition
      );
    }

    if (controls.rotateTo) {
      controls.rotateTo(point.theta, point.phi, enableTransition);
    }
  };

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    const { face, eventObject, stopPropagation } = event;
    stopPropagation();

    console.log(eventObject);

    if (eventObject.position.length() === 0) {
      tweenCamera(face ? face.normal : eventObject.position);
    } else {
      tweenCamera(eventObject.position);
    }

    return null;
  };

  return (
    <>
      <GizmoHelper
        margin={[80, 80]}
        alignment="bottom-center"
        renderPriority={2}
      >
        <group ref={group}>
          <GizmoViewcube
            onClick={onClick}
            color="#1F78FF"
            textColor="#FFFFFF"
            hoverColor="#bbdeff"
            strokeColor="#000000"
            // faces={[X, Y, Z, Y, Z, X]}
            // opacity={0.8}
            font="20px Arial"
          />
        </group>
      </GizmoHelper>

      {/* <Suspense fallback={null}>
        <EffectComposer>
          <Grid scale={0.1} />
        </EffectComposer>
      </Suspense> */}
    </>
  );
};

export default GizmoViewCube;
