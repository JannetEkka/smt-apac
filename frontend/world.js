// SMT World — the 3D "brain": 8 pair-nodes orbiting, colored by SMT's current call.
// Click a node → app.js renders the decision card. Data from GET /world.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const API = window.SMT_API || "";
const COLORS = { LONG: 0x35d07f, SHORT: 0xff5c6c, WAIT: 0x9aa3b2, BLOCK: 0x6b7280 };

const canvas = document.getElementById("brainCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(0, 0, 9);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const key = new THREE.PointLight(0xffffff, 0.8);
key.position.set(5, 5, 8);
scene.add(key);

// Central "core" = the JUDGE.
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.1, 1),
  new THREE.MeshStandardMaterial({ color: 0x4f7cff, roughness: 0.3, metalness: 0.4, wireframe: true })
);
scene.add(core);

const nodes = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function resize() {
  const r = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

function placeNodes(pairs) {
  const keys = Object.keys(pairs);
  keys.forEach((pair, i) => {
    const a = (i / keys.length) * Math.PI * 2;
    const d = pairs[pair];
    const mat = new THREE.MeshStandardMaterial({ color: COLORS[d.action] || COLORS.WAIT, roughness: 0.35 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.45 + d.conf * 0.35, 24, 24), mat);
    mesh.position.set(Math.cos(a) * 3.6, Math.sin(a) * 3.6, Math.sin(i) * 0.6);
    mesh.userData = { pair, decision: d };
    scene.add(mesh);
    nodes.push(mesh);
  });
}

canvas.addEventListener("pointerdown", (e) => {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(nodes)[0];
  if (hit) window.renderDecision?.(hit.object.userData.decision);
});

function animate() {
  requestAnimationFrame(animate);
  core.rotation.y += 0.003;
  nodes.forEach((n, i) => (n.position.z = Math.sin(Date.now() / 1000 + i) * 0.6));
  controls.update();
  renderer.render(scene, camera);
}

fetch(`${API}/world`)
  .then((r) => r.json())
  .then((data) => {
    document.getElementById("brainSource").textContent = data.source || "demo";
    placeNodes(data.pairs);
    resize();
    animate();
    window.renderDecision?.(Object.values(data.pairs)[0]);
  })
  .catch((err) => {
    document.getElementById("decisionCard").innerHTML =
      `<div class="muted">Could not reach the API (${err}). Is the service running?</div>`;
  });
