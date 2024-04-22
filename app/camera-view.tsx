import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  PerspectiveCamera as PerspectiveCameraImpl,
  OrthographicCamera as OrthographicCameraImpl,
  Vector3,
  Vector2,
  Vector4,
  Quaternion,
  Matrix4,
  Spherical,
  Box3,
  Raycaster,
  Sphere,
  EventDispatcher,
  Scene,
  Group,
} from "three";
import CameraControlsImpl from "camera-controls";
import {
  CameraControls,
  OrthographicCamera,
  PerspectiveCamera,
} from "@react-three/drei";

// export function Camera() {
//   const gl = useThree((state) => state.gl);

//   const set = useThree((state) => state.set);
//   const get = useThree((state) => state.get);
//   const scene = useThree((state) => state.scene);

//   const controls = useMemo(
//     () => new Controls(gl.domElement, scene),
//     [gl.domElement, scene]
//   );

//   useEffect(() => {
//     if (scene.children.length) {
//       fitCameraToSceneBoundingSphere(controls.object, scene);
//     }

//     console.log("scene.children.length", scene.children.length);
//   }, [controls.object, scene.children]);

//   useFrame((_, delta) => {
//     controls.update(delta);
//     gl.render(scene, controls.currentCamera);
//   }, -1);

//   useEffect(() => {
//     const oldControls = get().controls;
//     const oldCamera = get().camera;
//     set({
//       controls: controls.object as unknown as EventDispatcher,
//       camera: controls.currentCamera,
//     });
//     return () => set({ controls: oldControls, camera: oldCamera });
//   }, [controls, get, set]);

//   return (
//     <>
//       <primitive object={controls.object} />
//       <primitive object={controls.currentCamera} />
//     </>
//   );
// }

// https://discourse.threejs.org/t/how-to-animation-switch-camera-from-perspective-to-orthographic-like-3d-program-maya-blender-unity-etc-in-three-js/9470/5
export function Camera() {
  const [oldType, setOldType] = useState("PerspectiveCamera");
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);

  const proxyRef = useRef<Group>(null);
  const cameraControlsRef = useRef<CameraControlsImpl>(null);
  const orthographicRef = useRef<OrthographicCameraImpl>(null);
  const perspectiveRef = useRef<PerspectiveCameraImpl>(null);

  const { set } = useThree(({ get, set }) => ({ get, set }));

  useEffect(() => {
    set({ camera: perspectiveRef.current! });

    const handleWindowMouseMove = (event: {
      clientX: number;
      clientY: number;
    }) => {
      setCoords({ x: event.clientX, y: event.clientY });

      gl.domElement.dispatchEvent(
        new PointerEvent("pointerdown", {
          button: 1,
          pointerType: "mouse",
          clientX: event.clientX,
          clientY: event.clientY,
        })
      );
    };
    window.addEventListener("mousemove", handleWindowMouseMove);

    return () => window.removeEventListener("mousemove", handleWindowMouseMove);
  }, []);

  useFrame((_, delta) => {
    // HACK: Mouse capture resets when switching cameras because MapControls creates a new instance
    // of itself. The group element and proxyRef is part of this hack in order to keep the MapControls
    // target property from resetting.
    console.log(cameraControlsRef.current);
    if (camera.type !== oldType) {
      const exec = gl.domElement.dispatchEvent(
        new PointerEvent("pointerdown", {
          button: 1,
          pointerType: "mouse",
          clientX: coords.x,
          clientY: coords.y,
        })
      );
      console.log(exec);
      setOldType(camera.type);
    }

    // console.log({
    //   button: 0,
    //   pointerType: "mouse",
    //   clientX: coords.x,
    //   clientY: coords.y,
    // });

    if (!cameraControlsRef.current || !proxyRef.current) return;

    if (cameraControlsRef.current !== proxyRef.current.userData["controls"]) {
      if (proxyRef.current.userData["controls"]) {
        cameraControlsRef.current
          .getTarget(new Vector3())
          .copy(proxyRef.current.userData["controls"].getTarget(new Vector3()));
        cameraControlsRef.current.update(delta);
      }
      proxyRef.current.userData["controls"] = cameraControlsRef.current;
    }

    const angle = cameraControlsRef.current.polarAngle;

    if (+angle.toFixed(2) === 0.0) {
      if (
        camera.type === "OrthographicCamera" ||
        !orthographicRef.current ||
        !perspectiveRef.current ||
        !cameraControlsRef.current
      )
        return;

      orthographicRef.current.position.copy(perspectiveRef.current.position);
      const distance = cameraControlsRef.current.distance;
      const halfWidth =
        frustumWidthAtDistance(perspectiveRef.current, distance) / 2;
      const halfHeight =
        frustumHeightAtDistance(perspectiveRef.current, distance) / 2;

      orthographicRef.current.top = halfHeight;
      orthographicRef.current.bottom = -halfHeight;
      orthographicRef.current.left = -halfWidth;
      orthographicRef.current.right = halfWidth;
      orthographicRef.current.zoom = 1;
      orthographicRef.current.lookAt(
        cameraControlsRef.current.getTarget(new Vector3())
      );
      orthographicRef.current.updateProjectionMatrix();

      set({ camera: orthographicRef.current });
    } else if (camera.type === "OrthographicCamera") {
      if (
        !orthographicRef.current ||
        !perspectiveRef.current ||
        !cameraControlsRef.current
      )
        return;

      const oldY = perspectiveRef.current.position.y;
      perspectiveRef.current.position.copy(orthographicRef.current.position);
      perspectiveRef.current.position.y = oldY / orthographicRef.current.zoom;
      perspectiveRef.current.updateProjectionMatrix();

      set({ camera: perspectiveRef.current });
    }
  });

  useFrame((state) => {
    gl.render(state.scene, camera);
  }, 1);

  return (
    <>
      <group ref={proxyRef}></group>
      <CameraControls ref={cameraControlsRef} domElement={gl.domElement} />
      <PerspectiveCamera
        ref={perspectiveRef}
        position={[0, 0, 5]}
        fov={70}
        far={4000}
      />
      <OrthographicCamera ref={orthographicRef} near={1} far={4000} />
    </>
  );
}

// https://gist.github.com/nickyvanurk/9ac33a6aff7dd7bd5cd5b8a20d4db0dc
class Controls {
  perspectiveCamera: PerspectiveCameraImpl;
  orthographicCamera: OrthographicCameraImpl;
  currentCamera: PerspectiveCameraImpl | OrthographicCameraImpl;
  object: CameraControlsImpl;

  constructor(private container: HTMLElement, private scene: Scene) {
    this.perspectiveCamera = new PerspectiveCameraImpl(
      70,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      4000
    );
    this.orthographicCamera = new OrthographicCameraImpl(
      this.container.clientWidth / -2,
      this.container.clientWidth / 2,
      this.container.clientHeight / 2,
      this.container.clientHeight / -2,
      0.1,
      4000
    );
    this.currentCamera = this.perspectiveCamera;

    const subsetOfTHREE = {
      Vector2: Vector2,
      Vector3: Vector3,
      Vector4: Vector4,
      Quaternion: Quaternion,
      Matrix4: Matrix4,
      Spherical: Spherical,
      Box3: Box3,
      Sphere: Sphere,
      Raycaster: Raycaster,
    };

    CameraControlsImpl.install({ THREE: subsetOfTHREE });

    this.object = new CameraControlsImpl(this.currentCamera, this.container);
    this.object.setPosition(1, 1, 1);
    this.object.setTarget(0, 0, 0);
    this.object.restThreshold = 0.1;
    this.object.dollyToCursor = true;
  }

  dispose() {
    this.object.disconnect();
    this.object.dispose();
  }

  update(delta: number) {
    if (this.object.polarAngle <= 0.01) {
      if (this.currentCamera.type === "PerspectiveCamera") {
        this.setOrthographicCamera();
      }
    } else if (this.currentCamera.type === "OrthographicCamera") {
      this.setPerspectiveCamera();
    }

    this.object.update(delta);
  }

  private updateOrthographicCameraFrustum() {
    const { distance } = this.object;

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
    this.currentCamera = this.orthographicCamera;
    this.object.camera = this.orthographicCamera;
    this.orthographicCamera.updateProjectionMatrix();
  }

  setPerspectiveCamera() {
    const oldY = this.perspectiveCamera.position.y;
    this.perspectiveCamera.position.copy(this.orthographicCamera.position);
    this.perspectiveCamera.position.y = oldY / this.orthographicCamera.zoom;
    this.currentCamera = this.perspectiveCamera;
    this.object.camera = this.perspectiveCamera;
    this.perspectiveCamera.updateProjectionMatrix();
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

export const fitCameraToSceneBoundingSphere = (
  controls: CameraControlsImpl,
  scene: Scene
) => {
  const boundingBox = new Box3();
  const center = new Vector3();
  const sphere = new Sphere();

  const defaultRadius = 1;
  const bbox = boundingBox.setFromObject(scene);

  if (controls.fitToSphere) {
    // https://stackoverflow.com/a/63243915/11416728
    controls.fitToSphere(
      bbox.getBoundingSphere(sphere.set(bbox.getCenter(center), defaultRadius)),
      true
    );
  }
};
