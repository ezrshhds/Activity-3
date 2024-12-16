import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/loaders/GLTFLoader.js';

// Scene Setup na pa winter wonderland taraw
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue na background
scene.fog = new THREE.Fog(0xd3eaf5, 20, 70);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(25, 15, 40);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbitcontrols ni
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;

// Snowy ground ni
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Lights ni diri
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(0xfff7e6, 0.8);
sunlight.position.set(10, 30, -15);
scene.add(sunlight);

// Restricted area sa angel
let restrictedArea = {
  x: 0,
  z: 0,
  radius: 10
};

function isOutsideRestrictedArea(x, z) {
  const dx = x - restrictedArea.x;
  const dz = z - restrictedArea.z;
  return Math.sqrt(dx * dx + dz * dz) >= restrictedArea.radius;
}

function getRandomPositionOutsideRestrictedArea() {
  let x, z;
  do {
    x = Math.random() * 70 - 35;
    z = Math.random() * 70 - 35;
  } while (!isOutsideRestrictedArea(x, z));
  return { x, z };
}

// Angel
const loader = new GLTFLoader();
loader.load(
  'https://trystan211.github.io/iite18_fitz_act3/angel_eyes.glb',
  (gltf) => {
    const shrine = gltf.scene;
    shrine.position.set(restrictedArea.x, 5, restrictedArea.z);
    shrine.scale.set(10, 10, 10);
    scene.add(shrine);

    const boundingBox = new THREE.Box3().setFromObject(shrine);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    restrictedArea.radius = Math.max(size.x, size.z) / 2 + 2;
    console.log(`Restricted area radius updated: ${restrictedArea.radius}`);
  },
  undefined,
  (error) => console.error('Error loading shrine model:', error)
);

// Snowy Trees ni diri
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
const leafMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

const trees = [];

for (let i = 0; i < 15; i++) {
  const position = getRandomPositionOutsideRestrictedArea();
  const treeGroup = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 10),
    trunkMaterial
  );
  trunk.position.set(0, 5, 0);
  treeGroup.add(trunk);

  for (let j = 0; j < 3; j++) {
    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(5 - j * 2, 4),
      leafMaterial
    );
    foliage.position.set(0, 10 + j * 3, 0);
    treeGroup.add(foliage);
  }

  treeGroup.position.set(position.x, 0, position.z);
  scene.add(treeGroup);
  trees.push(treeGroup);
}

// Ice blobs
const iceMaterial = new THREE.MeshStandardMaterial({
  color: 0x99d8ff,
  roughness: 0.5,
  metalness: 0.8
});

for (let i = 0; i < 10; i++) {
  const position = getRandomPositionOutsideRestrictedArea();

  const crystal = new THREE.Mesh(
    new THREE.IcosahedronGeometry(Math.random() * 1.5 + 1, 1),
    iceMaterial
  );
  crystal.position.set(position.x, 0.8, position.z);
  scene.add(crystal);
}

// Falling snow particles ni diri (diri nako siya gi animate)
const particleCount = 1500;
const particlesGeometry = new THREE.BufferGeometry();
const positions = [];
const velocities = [];

for (let i = 0; i < particleCount; i++) {
  positions.push(
    Math.random() * 100 - 50,
    Math.random() * 60 + 10,
    Math.random() * 100 - 50
  );
  velocities.push(0, Math.random() * -0.15, 0);
}

particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
particlesGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));

const particlesMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.4,
  transparent: true,
  opacity: 0.7
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Tree interaction ni diri
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(trees, true);
  if (intersects.length > 0) {
    const treeGroup = intersects[0].object.parent;

    treeGroup.scale.multiplyScalar(1.2);
    treeGroup.children.forEach((child) => {
      if (child.material) {
        child.material.color.set(0xa9a9a9); // Frosty color ni
      }
    });

    setTimeout(() => {
      treeGroup.scale.multiplyScalar(1 / 1.2);
      treeGroup.children.forEach((child) => {
        if (child.material) {
          child.material.color.set(
            child.geometry.type === 'ConeGeometry' ? 0xffffff : 0x8b4513
          );
        }
      });
    }, 2000);
  }
});

// Animation loop ni
const clock = new THREE.Clock();

const animate = () => {
  const positions = particlesGeometry.attributes.position.array;
  const velocities = particlesGeometry.attributes.velocity.array;

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 1] += velocities[i * 3 + 1];
    if (positions[i * 3 + 1] < 0) {
      positions[i * 3 + 1] = Math.random() * 60 + 10;
    }
  }

  particlesGeometry.attributes.position.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});