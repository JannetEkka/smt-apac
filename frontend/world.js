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
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(r.width, r.height);   // updateStyle=true → canvas CSS size matches buffer (correct hit-math)
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

// Click-to-select: distinguish a click from an orbit-drag (OrbitControls also owns pointerdown),
// then pick the node under the cursor — with a forgiving nearest-node fallback so you don't have to
// land pixel-perfect on a moving sphere.
let downX = 0, downY = 0, downT = 0;
canvas.addEventListener("pointerdown", (e) => { downX = e.clientX; downY = e.clientY; downT = Date.now(); });
canvas.addEventListener("pointerup", (e) => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6 || Date.now() - downT > 500) return; // was a drag/orbit
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  let pick = raycaster.intersectObjects(nodes)[0]?.object;
  if (!pick) {                                    // fallback: nearest node in screen space
    let best = 0.18;                              // ignore clicks too far from any coin
    for (const n of nodes) {
      const p = n.position.clone().project(camera);
      const dist = Math.hypot(p.x - pointer.x, p.y - pointer.y);
      if (dist < best) { best = dist; pick = n; }
    }
  }
  if (pick) {
    window.renderDecision?.(pick.userData.decision);
    controls.autoRotate = false;                  // stop spinning once the user engages a pair
  }
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
