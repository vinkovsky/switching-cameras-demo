import { useEffect, useMemo } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
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
} from "three";
import CameraControlsImpl from "camera-controls";

export function Camera() {
  const { set, gl, get, camera } = useThree(({ get, set, gl, camera }) => ({
    get,
    set,
    gl,
    camera,
  }));

  const controls = useMemo(() => new Controls(gl.domElement), [gl.domElement]);

  useEffect(() => {
    extend({ CameraControlsImpl: controls.object });
  }, [controls]);

  useFrame((state, delta) => {
    controls.update(delta);
    gl.render(state.scene, controls.currentCamera);
  }, 1);

  useEffect(() => {
    const oldControls = get().controls;
    const oldCamera = get().camera;
    set({
      controls: controls.object as unknown as EventDispatcher,
      camera: controls.currentCamera,
    });
    return () => set({ controls: oldControls, camera: oldCamera });
  }, [controls, get, set]);

  return <primitive object={controls.object} />;
}

// https://gist.github.com/nickyvanurk/9ac33a6aff7dd7bd5cd5b8a20d4db0dc
class Controls {
  perspectiveCamera: PerspectiveCameraImpl;
  orthographicCamera: OrthographicCameraImpl;
  currentCamera: PerspectiveCameraImpl | OrthographicCameraImpl;
  object: CameraControlsImpl;

  constructor(private container: HTMLElement) {
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
    this.currentCamera.position.set(1, 1, 5);
    this.currentCamera.lookAt(1, 1, 1);

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

    this.object = new CameraControlsImpl(this.currentCamera);
    this.object.connect(this.container);
  }

  dispose() {
    this.object.disconnect();
    this.object.dispose();
  }

  update(delta: number) {
    if (this.object.polarAngle <= 0.001) {
      if (this.currentCamera.type === "PerspectiveCamera") {
        this.setOrthographicCamera();
      }
    } else if (this.currentCamera.type === "OrthographicCamera") {
      this.setPerspectiveCamera();
    }

    this.object.update(delta);
  }

  private updateOrthographicCameraFrustum() {
    const distance = this.orthographicCamera.position.distanceTo(
      this.object.getTarget(new Vector3())
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
