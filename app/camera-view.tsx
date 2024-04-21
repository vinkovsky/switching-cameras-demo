import { useEffect, useMemo } from "react";
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
} from "three";
import CameraControlsImpl from "camera-controls";

export function Camera() {
  const gl = useThree((state) => state.gl);

  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);
  const scene = useThree((state) => state.scene);

  const controls = useMemo(
    () => new Controls(gl.domElement, scene),
    [gl.domElement, scene]
  );

  useEffect(() => {
    if (scene.children.length) {
      fitCameraToSceneBoundingSphere(controls.object, scene);
    }

    console.log("scene.children.length", scene.children.length);
  }, [controls.object, scene.children]);

  useFrame((_, delta) => {
    controls.update(delta);
    gl.render(scene, controls.currentCamera);
  }, -1);

  useEffect(() => {
    const oldControls = get().controls;
    const oldCamera = get().camera;
    set({
      controls: controls.object as unknown as EventDispatcher,
      camera: controls.currentCamera,
    });
    return () => set({ controls: oldControls, camera: oldCamera });
  }, [controls, get, set]);

  return (
    <>
      <primitive object={controls.object} />
      <primitive object={controls.currentCamera} />
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
