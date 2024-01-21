// 1. Import Statements
import '/style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 2. Constants and Global Variables
const baseSpeed = 1;
let lockOnMode = false;
let savedCameraRotation = new THREE.Euler();
let currentFocusIndex = 0;
let time = 0;
const planetObjects = {};
let focusableObjects = [];

// 3. Bodies
const planets = [
  {
    name: 'Sun',
    radius: 30,
    color: 0xffff00,
    texture: 'images/sun.jpg',
    position: { x: 0, y: 0, z: 0 },
  },
  {
    name: 'Mercury',
    radius: 0.3,
    color: 0xc0c0c0,
    texture: 'images/mercury.jpg',
    orbit: {
      semiMajorAxis: 60,
      semiMinorAxis: 58,
    },
  },
  {
    name: 'Venus',
    radius: 0.7,
    color: 0xffa500,
    texture: 'images/venus.jpg',
    orbit: {
      semiMajorAxis: 105,
      semiMinorAxis: 103,
    },
  },
  {
    name: 'Earth',
    radius: 3,
    color: 0x0000ff,
    texture: 'images/earth.jpg',
    orbit: {
      semiMajorAxis: 150,
      semiMinorAxis: 148,
      satellites: [
        {
          name: 'Moon',
          radius: 0.6,
          color: 0xc0c0c0,
          texture: 'images/moon.jpg',
          semiMajorAxis: 12,
          semiMinorAxis: 12, },
      ],
    },
  },
  {
    name: 'Mars',
    radius: 1.5,
    color: 0xff0000,
    texture: 'images/mars.jpg',
    orbit: {
      semiMajorAxis: 240,
      semiMinorAxis: 238,
    },
  },
  {
    name: 'Jupiter',
    radius: 15,
    color: 0xff9900,
    texture: 'images/jupiter.jpg',
    orbit: {
      semiMajorAxis: 400,
      semiMinorAxis: 398,
    },
  },
  {
    name: 'Saturn',
    radius: 12,
    color: 0xffcc00,
    texture: 'images/saturn.jpg',
    orbit: {
      semiMajorAxis: 600,
      semiMinorAxis: 598,
      satellites: [
        // Add Saturn's moons here if needed
      ],
    },
  },
  {
    name: 'Uranus',
    radius: 6,
    color: 0x00ccff,
    texture: 'images/uranus.jpg',
    orbit: {
      semiMajorAxis: 800,
      semiMinorAxis: 798,
    },
  },
  {
    name: 'Neptune',
    radius: 6,
    color: 0x0000ff,
    texture: 'images/neptune.jpg',
    orbit: {
      semiMajorAxis: 1000,
      semiMinorAxis: 998,
    },
  },
];

// 4. Initialize THREE.js Environment
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 0, 50);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg') });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const textureLoader = new THREE.TextureLoader();

const skyboxTexture = textureLoader.load('images/stars.jpg');
const skyGeometry = new THREE.SphereGeometry(2000, 32, 32);
const skyboxMaterial = new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide });
const skybox = new THREE.Mesh(skyGeometry, skyboxMaterial);
scene.add(skybox);

const sunLight = new THREE.PointLight(0xffffff, 100000, 10000);
sunLight.position.set(0, 0, 0); // Move the light source behind the Sun
sunLight.castShadow = true; // default false
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x101010, 0.5);
scene.add(ambientLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 5. Utility Functions
const updateCameraFocus = () => {
  const focusedObject = focusableObjects[currentFocusIndex];

  if (lockOnMode) {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    const distance = 30;
    camera.position.set(
      focusedObject.position.x - direction.x * distance,
      focusedObject.position.y - direction.y * distance,
      focusedObject.position.z - direction.z * distance
    );

    camera.lookAt(focusedObject.position);

    savedCameraRotation.copy(camera.rotation);
  } else {
    camera.rotation.copy(savedCameraRotation);
    controls.target.copy(focusedObject.position);
  }
};

// 6. Event Listeners
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    currentFocusIndex = (currentFocusIndex + 1) % focusableObjects.length;
    updateCameraFocus();
  } else if (event.key === 'ArrowLeft') {
    currentFocusIndex = (currentFocusIndex - 1 + focusableObjects.length) % focusableObjects.length;
    updateCameraFocus();
  } else if (event.key === 'l') {
    lockOnMode = !lockOnMode;
    updateCameraFocus();
  }
});

// 7. Create and Position Celestial Bodies
planets.forEach(planetData => {
  if (planetData.orbit) {
    planetData.orbit.orbitSpeed = baseSpeed / Math.sqrt(planetData.orbit.semiMajorAxis);
    if (planetData.orbit.satellites) {
      planetData.orbit.satellites.forEach(satelliteData => {
        satelliteData.orbitSpeed = baseSpeed / Math.sqrt(satelliteData.semiMajorAxis);
      });
    }
  }
});

planets.forEach(planetData => {
  let material;
  const geometry = new THREE.SphereGeometry(planetData.radius, 32, 32);

  if (planetData.name === 'Sun') {
    material = new THREE.MeshBasicMaterial({ map: textureLoader.load(planetData.texture) });
  } else {
    material = new THREE.MeshPhongMaterial({ map: textureLoader.load(planetData.texture) });
  }

  const celestialBody = new THREE.Mesh(geometry, material);
  scene.add(celestialBody);
  planetObjects[planetData.name] = { object: celestialBody, satellites: {} };

  focusableObjects.push(celestialBody);

  // Create satellites
  if (planetData.orbit && planetData.orbit.satellites) {
    planetData.orbit.satellites.forEach(satelliteData => {
      const satelliteGeometry = new THREE.SphereGeometry(satelliteData.radius, 32, 32);
      const satelliteMaterial = new THREE.MeshStandardMaterial({ map: textureLoader.load(satelliteData.texture) });

      const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);

      celestialBody.add(satellite);
      planetObjects[planetData.name].satellites[satelliteData.name] = satellite;

      focusableObjects.push(satellite);
    });
  }

  if (planetData.name === 'Saturn') {
    // Define inner and outer radius for the rings
    const innerRadius = 14; // Slightly larger than Saturn's radius
    const outerRadius = 22; // Arbitrary, can be adjusted for visual effect
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = -0.5 * Math.PI; // Rotate the ring to lie in the xy-plane
    celestialBody.add(ringMesh);
  }
  if (planetData.name != 'Sun') {
    celestialBody.castShadow = true;
    celestialBody.receiveShadow = true;
  }
});

// 8. Animation Loop
const animate = () => {
  requestAnimationFrame(animate);
  time += 0.01;

  planets.forEach(planetData => {
    if (planetData.orbit) {
      const planetObj = planetObjects[planetData.name].object;
      planetObj.position.x = planetData.orbit.semiMajorAxis * Math.cos(time * planetData.orbit.orbitSpeed);
      planetObj.position.z = planetData.orbit.semiMinorAxis * Math.sin(time * planetData.orbit.orbitSpeed);

      if (planetData.orbit.satellites) {
        planetData.orbit.satellites.forEach(satelliteData => {
          const satellite = planetObjects[planetData.name].satellites[satelliteData.name];
          satellite.position.set(
            satelliteData.semiMajorAxis * Math.cos(time * satelliteData.orbitSpeed),
            0,
            satelliteData.semiMinorAxis * Math.sin(time * satelliteData.orbitSpeed)
          );
        });
      }
    }
  });

  controls.update();

  if (lockOnMode) {
    updateCameraFocus();
  }

  renderer.render(scene, camera);
};

animate();
