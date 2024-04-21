import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CameraControls,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from "@react-three/drei";
import {
  Group,
  PerspectiveCamera as PerspectiveCameraImpl,
  OrthographicCamera as OrthographicCameraImpl,
  Vector3,
} from "three";
import CameraControlsImpl from "camera-controls";
import { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/Addons.js";

// export function Camera() {
//   const [oldType, setOldType] = useState("PerspectiveCamera");
//   const [coords, setCoords] = useState({ x: 0, y: 0 });

//   const gl = useThree((state) => state.gl);
//   const camera = useThree((state) => state.camera);

//   const proxyRef = useRef<Group>(null);

//   const orthographicRef = useRef<OrthographicCameraImpl>(null);
//   const perspectiveRef = useRef<PerspectiveCameraImpl>(null);
//   const cameraControlsRef = useRef<CameraControlsImpl>(null);

//   const { set } = useThree(({ get, set }) => ({ get, set }));

//   useEffect(() => {
//     if (perspectiveRef.current) {
//       set({ camera: perspectiveRef.current });
//       const handleWindowMouseMove = (event: {
//         clientX: number;
//         clientY: number;
//       }) => {
//         setCoords({ x: event.clientX, y: event.clientY });
//       };
//       window.addEventListener("mousemove", handleWindowMouseMove);

//       return () =>
//         window.removeEventListener("mousemove", handleWindowMouseMove);
//     }
//   }, []);

//   useFrame(({ clock }) => {
//     if (!cameraControlsRef.current || !proxyRef.current) return;

//     if (camera.type !== oldType) {
//       console.log("switching camera type");
//       gl.domElement.dispatchEvent(
//         new PointerEvent("pointerdown", {
//           button: 0,
//           pointerType: "mouse",
//           clientX: coords.x,
//           clientY: coords.y,
//         })
//       );

//       setOldType(camera.type);
//     }

//     if (cameraControlsRef.current !== proxyRef.current.userData["controls"]) {
//       if (proxyRef.current.userData["controls"]) {
//         cameraControlsRef.current.target
//           // .getTarget(new Vector3())
//           .copy(proxyRef.current.userData["controls"].target);
//         // .copy(proxyRef.current.userData["controls"].getTarget(new Vector3()));

//         // cameraControlsRef.current.update(clock.getDelta());
//         cameraControlsRef.current.update();
//       }
//       proxyRef.current.userData["controls"] = cameraControlsRef.current;
//     }

//     const angle = cameraControlsRef.current.getPolarAngle();
//     // const angle = cameraControlsRef.current.polarAngle;

//     console.log(angle.toFixed(2));
//     if (+angle.toFixed(2) === 0.0) {
//       if (
//         camera.type === "OrthographicCamera" ||
//         !orthographicRef.current ||
//         !perspectiveRef.current ||
//         !cameraControlsRef.current
//       )
//         return;

//       orthographicRef.current.position.copy(perspectiveRef.current.position);
//       const distance = perspectiveRef.current.position.distanceTo(
//         cameraControlsRef.current.target
//         // cameraControlsRef.current.getTarget(new Vector3())
//       );
//       const halfWidth =
//         frustumWidthAtDistance(perspectiveRef.current, distance) / 2;
//       const halfHeight =
//         frustumHeightAtDistance(perspectiveRef.current, distance) / 2;

//       orthographicRef.current.top = halfHeight;
//       orthographicRef.current.bottom = -halfHeight;
//       orthographicRef.current.left = -halfWidth;
//       orthographicRef.current.right = halfWidth;
//       orthographicRef.current.zoom = 1;
//       orthographicRef.current.lookAt(
//         // cameraControlsRef.current.getTarget(new Vector3())
//         cameraControlsRef.current.target
//       );
//       orthographicRef.current.updateProjectionMatrix();

//       set({ camera: orthographicRef.current });
//     } else if (camera.type === "OrthographicCamera") {
//       if (
//         !orthographicRef.current ||
//         !perspectiveRef.current ||
//         !cameraControlsRef.current
//       )
//         return;

//       const oldY = perspectiveRef.current.position.y;
//       perspectiveRef.current.position.copy(orthographicRef.current.position);
//       perspectiveRef.current.position.y = oldY / orthographicRef.current.zoom;
//       perspectiveRef.current.updateProjectionMatrix();

//       set({ camera: perspectiveRef.current });
//     }
//   });

//   useFrame((state) => {
//     gl.render(state.scene, camera);
//   }, 1);

//   return (
//     <>
//       <group ref={proxyRef} />
//       <OrbitControls ref={cameraControlsRef} makeDefault />
//       {/* <CameraControls ref={cameraControlsRef} makeDefault dollyToCursor /> */}
//       <PerspectiveCamera
//         ref={perspectiveRef}
//         position={[10, 10, 0]}
//         far={4000}
//       />
//       <OrthographicCamera ref={orthographicRef} near={1} far={4000} />
//     </>
//   );
// }

export function Camera() {
  const { set, gl, camera } = useThree(({ get, set, gl, camera }) => ({
    get,
    set,
    gl,
    camera,
  }));

  const size = useThree(({ size }) => size);

  const controls = useRef(new Controls(size, gl.domElement));

  useEffect(() => {
    controls.current.updateFrustum();
  }, []);

  useFrame(({ clock }) => {
    controls.current.update();
  });

  useFrame((state) => {
    gl.render(state.scene, controls.current.currentCamera);
  }, 1);

  return null;
}

export class Controls {
  perspectiveCamera: PerspectiveCameraImpl;
  orthographicCamera: OrthographicCameraImpl;
  currentCamera: PerspectiveCameraImpl | OrthographicCameraImpl;
  controls: OrbitControlsImpl;

  constructor(
    private size: { width: number; height: number },
    private container: HTMLElement
  ) {
    this.perspectiveCamera = new PerspectiveCameraImpl(
      70,
      size.width / size.height,
      0.1,
      4000
    );
    this.orthographicCamera = new OrthographicCameraImpl(
      size.width / -2,
      size.width / 2,
      size.height / 2,
      size.height / -2,
      0.1,
      4000
    );
    this.currentCamera = this.perspectiveCamera;
    this.currentCamera.position.set(0, 0, 5);
    this.currentCamera.lookAt(0, 1, 0);

    this.controls = new OrbitControlsImpl(this.currentCamera, this.container);
    this.controls.enableDamping = true;
    this.controls.panSpeed = 1.2;
    this.controls.dampingFactor *= 2;
  }

  dispose() {
    this.controls.dispose();
  }

  update() {
    if (this.controls.getPolarAngle() <= 0.001) {
      if (this.currentCamera.type === "PerspectiveCamera") {
        this.setOrthographicCamera();
      }
    } else if (this.currentCamera.type === "OrthographicCamera") {
      this.setPerspectiveCamera();
    }

    this.controls.update();
  }

  private updateOrthographicCameraFrustum() {
    const distance = this.orthographicCamera.position.distanceTo(
      this.controls.target
    );
    const halfWidth =
      frustumWidthAtDistance(this.perspectiveCamera, distance) / 2;
    const halfHeight =
      frustumHeightAtDistance(this.perspectiveCamera, distance) / 2;
    const halfSize = { x: halfWidth, y: halfHeight };
    this.orthographicCamera.top = halfSize.y;
    this.orthographicCamera.bottom = -halfSize.y;
    this.orthographicCamera.left = -halfSize.x;
    this.orthographicCamera.right = halfSize.x;
  }

  updateFrustum() {
    this.perspectiveCamera.aspect =
      this.container.clientWidth / this.container.clientHeight;
    this.updateOrthographicCameraFrustum();
    this.currentCamera.updateProjectionMatrix();
  }

  setOrthographicCamera() {
    this.orthographicCamera.position.copy(this.perspectiveCamera.position);
    this.updateOrthographicCameraFrustum();
    this.orthographicCamera.updateProjectionMatrix();
    this.currentCamera = this.orthographicCamera;
    this.controls.object = this.orthographicCamera;
  }

  setPerspectiveCamera() {
    const oldY = this.perspectiveCamera.position.y;
    this.perspectiveCamera.position.copy(this.orthographicCamera.position);
    this.perspectiveCamera.position.y = oldY / this.orthographicCamera.zoom;
    this.perspectiveCamera.updateProjectionMatrix();
    this.currentCamera = this.perspectiveCamera;
    this.controls.object = this.perspectiveCamera;
  }
}

function frustumHeightAtDistance(
  camera: PerspectiveCameraImpl,
  distance: number
) {
  const vFov = (camera.fov * Math.PI) / 180;
  return Math.tan(vFov / 2) * distance * 2;
}

function frustumWidthAtDistance(
  camera: PerspectiveCameraImpl,
  distance: number
) {
  return frustumHeightAtDistance(camera, distance) * camera.aspect;
}
