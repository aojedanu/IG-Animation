import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Ammo from "ammojs-typed";

let AmmoLib;
let scene, camera, renderer, controls;
let physicsWorld, tmpTrans;
let rigidBodies = [];
let sphere, sphereBody;
let trajectoryLine;
let clock = new THREE.Clock();
let sphereLaunched = false;

// Parámetros de lanzamiento
// Parámetros de lanzamiento
const params = {
  force: 50,
  angleH: 15, // CAMBIO 1: Era 0, ahora 15 para apuntar a las estructuras
  angleV: 15,
  showTrajectory: true,
  structureIndex: 0,

  launch: () => launchSphere(),
  reset: () => resetScene(),
};

Ammo().then((AmmoModule) => {
  AmmoLib = AmmoModule;
  init();
});

function init() {
  // Física
  const collisionConfiguration = new AmmoLib.btDefaultCollisionConfiguration();
  const dispatcher = new AmmoLib.btCollisionDispatcher(collisionConfiguration);
  const broadphase = new AmmoLib.btDbvtBroadphase();
  const solver = new AmmoLib.btSequentialImpulseConstraintSolver();

  physicsWorld = new AmmoLib.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration
  );
  physicsWorld.setGravity(new AmmoLib.btVector3(0, -9.8, 0));

  tmpTrans = new AmmoLib.btTransform();

  initThree();
  createGround();
  createStructureByIndex(); // Crear la estructura inicial
  createSphere();
  createTrajectoryLine();
  initGUI();


  animate();
}

// GUI
function initGUI() {
  const gui = new GUI();

  gui.add(params, "force", 5, 200, 1).name("Fuerza");
  gui.add(params, "angleH", -90, 90, 1).name("Ángulo Horizontal");
  gui.add(params, "angleV", 0, 80, 1).name("Ángulo Vertical");
  gui.add(params, "showTrajectory").name("Mostrar Trayectoria");

  gui.add(params, "launch").name("Lanzar");
  gui.add(params, "reset").name("Reiniciar Escena");

  gui.add(params, "structureIndex", {
    Torre: 0,
    Pared: 1,
    Piramide: 2,
    Cubo: 3,
  })
    .name("Estructura")
    .onChange(changeStructure);
}



// Cambiar estructura según índice numérico
function changeStructure() {
  clearBoxes();
  createStructureByIndex();
}

// Seleccionar estructura con if/else
function createStructureByIndex() {
  if (params.structureIndex == 0) {
    createTower();
  } else if (params.structureIndex == 1) {
    createWall();
  } else if (params.structureIndex == 2) {
    createPyramid();
  }
    else if(params.structureIndex == 3){
      createBigCube();
    }
}

// BORRAR TODOS LOS BLOQUES
function clearBoxes() {
  rigidBodies.forEach(({ mesh, body }) => {
    scene.remove(mesh);
    physicsWorld.removeRigidBody(body);
    AmmoLib.destroy(body);
  });
  rigidBodies = [];
}

// THREE.js
function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 50, 100);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 8, -30);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 3, 0);
  controls.update();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(20, 30, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Suelo
function createGround() {
  const groundGeo = new THREE.BoxGeometry(40, 1, 40);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a7d44 });

  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);

  const shape = new AmmoLib.btBoxShape(new AmmoLib.btVector3(20, 0.5, 20));
  const transform = new AmmoLib.btTransform();
  transform.setIdentity();
  transform.setOrigin(new AmmoLib.btVector3(0, -0.5, 0));

  const motionState = new AmmoLib.btDefaultMotionState(transform);
  const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
    0,
    motionState,
    shape,
    new AmmoLib.btVector3(0, 0, 0)
  );

  const body = new AmmoLib.btRigidBody(rbInfo);
  physicsWorld.addRigidBody(body);
}

// Crear un cubo con física
function createBox(x, y, z, sx, sy, sz, color, mass = 1) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    new THREE.MeshStandardMaterial({ color })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  scene.add(mesh);

  // Física
  const shape = new AmmoLib.btBoxShape(
    new AmmoLib.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
  );

  const transform = new AmmoLib.btTransform();
  transform.setIdentity();
  transform.setOrigin(new AmmoLib.btVector3(x, y, z));

  const localInertia = new AmmoLib.btVector3(0, 0, 0);
  shape.calculateLocalInertia(mass, localInertia);

  const motionState = new AmmoLib.btDefaultMotionState(transform);
  const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
    mass,
    motionState,
    shape,
    localInertia
  );

  const body = new AmmoLib.btRigidBody(rbInfo);
  physicsWorld.addRigidBody(body);

  rigidBodies.push({ mesh, body });
}

// Estructuras
function createTower() {
  const size = 1;
  const levels = 8;
  const offsetX = 5;

  for (let i = 0; i < levels; i++) {
    createBox(offsetX, i * size + 0.5, 0, size, size, size, 0xff8800);
  }
}


function createWall() {
  const size = 1;
  const offsetX = 5;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      createBox(j - 3 + offsetX, i + 0.5, 0, size, size, size, 0x44aaff);
    }
  }
}


function createPyramid() {
  const size = 1;
  const offsetX = 5;
  for (let level = 0; level < 6; level++) {
    const blocks = 6 - level;
    for (let i = 0; i < blocks; i++) {
      createBox(i - blocks / 2 + offsetX, level + 0.5, 0, size, size, size, 0xaaff44);
    }
  }
}

function createBigCube() {
  createBox(0, 2, 0, 4, 4, 4, 0xff00ff, 20);
}



// Crear esfera
function createSphere() {
  const geo = new THREE.SphereGeometry(0.5, 32, 32);
  sphere = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
  sphere.castShadow = true;
  sphere.position.set(0, 2, -18);
  scene.add(sphere);

  const shape = new AmmoLib.btSphereShape(0.5);

  const transform = new AmmoLib.btTransform();
  transform.setIdentity();
  transform.setOrigin(new AmmoLib.btVector3(0, 2, -18));

  const mass = 5;
  const localInertia = new AmmoLib.btVector3(0, 0, 0);
  shape.calculateLocalInertia(mass, localInertia);

  const motionState = new AmmoLib.btDefaultMotionState(transform);
  const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
    mass,
    motionState,
    shape,
    localInertia
  );

  sphereBody = new AmmoLib.btRigidBody(rbInfo);
  physicsWorld.addRigidBody(sphereBody);
}

// Trayectoria
function createTrajectoryLine() {
  const points = Array.from({ length: 50 }, () => new THREE.Vector3(0, 0, 0));
  trajectoryLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.6, transparent: true })
  );
  scene.add(trajectoryLine);
}

function updateTrajectory() {
  if (!trajectoryLine) return;
  if (sphereLaunched) {
    trajectoryLine.visible = false;
    return;
  }
  const pos = trajectoryLine.geometry.attributes.position.array;
  const start = sphere.position.clone();
  const dir = getLaunchDirection().multiplyScalar(params.force);
  const g = new THREE.Vector3(0, -9.8, 0);

  const dt = 0.05;

  for (let i = 0; i < 50; i++) {
    const t = dt * i;

    const p = start.clone()
      .add(dir.clone().multiplyScalar(t))
      .add(g.clone().multiplyScalar(0.5 * t * t));

    pos[i * 3] = p.x;
    pos[i * 3 + 1] = p.y;
    pos[i * 3 + 2] = p.z;

    if (p.y < 0) break;
  }

  trajectoryLine.geometry.attributes.position.needsUpdate = true;
  trajectoryLine.visible = params.showTrajectory;
}

function getLaunchDirection() {
  const h = params.angleH * Math.PI / 180;
  const v = params.angleV * Math.PI / 180;

  // Dirección base hacia adelante (eje Z positivo donde están las estructuras)
  return new THREE.Vector3(
    Math.cos(v) * Math.sin(h),  // Componente X
    Math.sin(v),                 // Componente Y
    Math.cos(v) * Math.cos(h)    // Componente Z
  ).normalize();
}

// Lanzar esfera
function launchSphere() {
  const transform = new AmmoLib.btTransform();
  transform.setIdentity();
  transform.setOrigin(new AmmoLib.btVector3(0, 2, -18));
  sphereBody.setWorldTransform(transform);

  sphereBody.setLinearVelocity(new AmmoLib.btVector3(0, 0, 0));
  sphereBody.setAngularVelocity(new AmmoLib.btVector3(0, 0, 0));

  const dir = getLaunchDirection().multiplyScalar(params.force * 2);
  const impulse = new AmmoLib.btVector3(dir.x, dir.y, dir.z);

  sphereBody.applyCentralImpulse(impulse);
  AmmoLib.destroy(impulse);
  sphereLaunched = true;
}

// Resetear escena manteniendo estructura seleccionada
function resetScene() {
  clearBoxes();
  createStructureByIndex();

  const transform = new AmmoLib.btTransform();
  transform.setIdentity();
  transform.setOrigin(new AmmoLib.btVector3(0, 2, -18));
  sphereBody.setWorldTransform(transform);

  sphereBody.setLinearVelocity(new AmmoLib.btVector3(0, 0, 0));
  sphereBody.setAngularVelocity(new AmmoLib.btVector3(0, 0, 0));
  sphereLaunched = false;
}

// FÍSICA
function updatePhysics(dt) {
  physicsWorld.stepSimulation(dt, 10);

  rigidBodies.forEach(({ mesh, body }) => {
    const motionState = body.getMotionState();
    if (motionState) {
      motionState.getWorldTransform(tmpTrans);
      mesh.position.set(
        tmpTrans.getOrigin().x(),
        tmpTrans.getOrigin().y(),
        tmpTrans.getOrigin().z()
      );
      mesh.quaternion.set(
        tmpTrans.getRotation().x(),
        tmpTrans.getRotation().y(),
        tmpTrans.getRotation().z(),
        tmpTrans.getRotation().w()
      );
    }
  });

  const ms = sphereBody.getMotionState();
  if (ms) {
    ms.getWorldTransform(tmpTrans);
    sphere.position.set(
      tmpTrans.getOrigin().x(),
      tmpTrans.getOrigin().y(),
      tmpTrans.getOrigin().z()
    );
    sphere.quaternion.set(
      tmpTrans.getRotation().x(),
      tmpTrans.getRotation().y(),
      tmpTrans.getRotation().z(),
      tmpTrans.getRotation().w()
    );
  }
}

// Loop
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  updatePhysics(dt);
  updateTrajectory();

  controls.update();
  renderer.render(scene, camera);
}
