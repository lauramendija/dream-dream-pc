import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

const isMobile = window.innerWidth < 768;
gsap.registerPlugin(ScrollTrigger);

const container = document.getElementById('app');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a15, 0.04);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 6);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); //performance tweak
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5; 
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x9999ff, 0x111122, 1));
scene.add(new THREE.AmbientLight(0x666677, 0.35));

// Dust particles
const dustCount = isMobile ? 200 : 600;
const dustGeo = new THREE.BufferGeometry();
const dustPositions = new Float32Array(dustCount * 3);

for (let i = 0; i < dustCount; i++) {
  const x = (Math.random() - 0.5) * 20;  
  const y = (Math.random() - 0.5) * 15;  
  const z = (Math.random() - 0.5) * 30;   
  dustPositions[i * 3] = x;
  dustPositions[i * 3 + 1] = y;
  dustPositions[i * 3 + 2] = z;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

const dustTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/circle.png');

const dustMat = new THREE.PointsMaterial({
  color: 0xcfcfff,
  size: 0.15,                
  map: dustTexture,
  transparent: true,
  opacity: 0.18,
  blending: THREE.AdditiveBlending, // Glow
  depthWrite: false,
  sizeAttenuation: true
});

const dust = new THREE.Points(dustGeo, dustMat);
scene.add(dust);

// Dators
let model;
const loader = new GLTFLoader();
loader.load('pc2.glb', (gltf) => {
  model = gltf.scene;
  model.scale.set(0.8, 0.8, 0.8);
  model.position.set(0, 1, 0);
  model.rotation.y = Math.PI * 1.2;
  scene.add(model);
//tests
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  setupScrollAnimation();
  animate();
}, undefined, (error) => {
  console.error('Model failed to load', error);
});

// Bloom
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 1.2, 0.1));
composer.addPass(new FilmPass(0.25, 0.5, 1500, false));

// Scroll & ease-in
let targetCameraZ = 6;
let targetModelYRot = Math.PI * 1.2;

function setupScrollAnimation() {
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: '120vh',
    scrub: 1.5,
    onUpdate: (self) => {
      const progress = self.progress;
      targetCameraZ = 6 - 3.5 * progress;   
      targetModelYRot = Math.PI * (1.2 - 0.7 * progress);

      if (progress > 0.9) {
        gsap.to(container, { opacity: 0, duration: 0.3 });
      } else {
        gsap.to(container, { opacity: 1, duration: 0.3 });
      }
    }
  });
}

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

function animate() {
  requestAnimationFrame(animate);

  camera.position.z = lerp(camera.position.z, targetCameraZ, 0.05);
  camera.lookAt(0, 1, 0);

  if (model) {
    model.rotation.y = lerp(model.rotation.y, targetModelYRot, 0.03);
    model.rotation.y += 0.0005;
  }

  dust.rotation.y += 0.0003;

  composer.render();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});



//gsap main tekstam


gsap.from(["main.content h1", "main.content p"], {
  opacity: 0,
  duration: 0.3,
  ease: "power2.out",
  delay: 0.2,
  stagger: 0.3, // atšķirība starp virsrakstu un apakštekstu
  onComplete: () => {
    // Scroll fade out for both elements together
    gsap.to(["main.content h1", "main.content p"], {
      opacity: 0,
      scrollTrigger: {
        trigger: "main.content h1",  // trigger once on h1, affects both
        start: "top 35%",
        end: "bottom 1%",
        scrub: true,
       // markers: true,
      }
    });
  }
});
