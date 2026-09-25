// 1. Configuración de Escena, Cámara y Renderizador Realista
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x010309, 0.0008);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 45, 130);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.outputEncoding = THREE.sRGBEncoding;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.rotateSpeed = 0.5;
controls.maxDistance = 250;
controls.minDistance = 15;

// -------------------------------------------------------------
// 💡 2. ILUMINACIÓN REALISTA FOTOMÉTRICA
// -------------------------------------------------------------
const ambientLight = new THREE.AmbientLight(0x1a2b4c, 1.8);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0x60b5ff, 3.5);
keyLight.position.set(50, 80, 50);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xff77aa, 1.5);
fillLight.position.set(-50, -30, -50);
scene.add(fillLight);

const centerPointLight = new THREE.PointLight(0x00d4ff, 7, 150);
centerPointLight.position.set(0, 0, 0);
scene.add(centerPointLight);

// -------------------------------------------------------------
// ⭐ 3. TEXTURA HD DE ESTRELLA (BRILLO INTERMEDIO EQUILIBRADO)
// -------------------------------------------------------------
function createHDStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const cx = 64, cy = 64;

  const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
  radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  radGrad.addColorStop(0.2, 'rgba(128, 210, 255, 0.65)');
  radGrad.addColorStop(0.5, 'rgba(30, 100, 255, 0.2)');
  radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx, 8); ctx.lineTo(cx, 120);
  ctx.moveTo(8, cy); ctx.lineTo(120, cy);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

const starTextureMap = createHDStarTexture();

const galaxyGroup = new THREE.Group();
scene.add(galaxyGroup);

const particleCount = 35000;
const galaxyGeo = new THREE.BufferGeometry();
const galaxyPos = new Float32Array(particleCount * 3);
const galaxyColors = new Float32Array(particleCount * 3);

const colorCore = new THREE.Color(0xffffff);
const colorMid = new THREE.Color(0x38bdf8);
const colorOuter = new THREE.Color(0x0369a1);

const arms = 4;
const radiusMax = 170;

for (let i = 0; i < particleCount; i++) {
  const r = Math.pow(Math.random(), 2.2) * radiusMax;
  const armIndex = i % arms;
  const armAngle = (armIndex / arms) * Math.PI * 2;
  const spin = r * 0.11;

  const randomX = (Math.random() - 0.5) * (12 + r * 0.08);
  const randomY = (Math.random() - 0.5) * (8 + r * 0.06);
  const randomZ = (Math.random() - 0.5) * (12 + r * 0.08);

  galaxyPos[i * 3] = Math.cos(armAngle + spin) * r + randomX;
  galaxyPos[i * 3 + 1] = randomY;
  galaxyPos[i * 3 + 2] = Math.sin(armAngle + spin) * r + randomZ;

  const mixRatio = r / radiusMax;
  let finalColor = new THREE.Color();
  if (mixRatio < 0.25) {
    finalColor.lerpColors(colorCore, colorMid, mixRatio / 0.25);
  } else {
    finalColor.lerpColors(colorMid, colorOuter, (mixRatio - 0.25) / 0.75);
  }

  galaxyColors[i * 3] = finalColor.r;
  galaxyColors[i * 3 + 1] = finalColor.g;
  galaxyColors[i * 3 + 2] = finalColor.b;
}

galaxyGeo.setAttribute('position', new THREE.BufferAttribute(galaxyPos, 3));
galaxyGeo.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));

const galaxyMat = new THREE.PointsMaterial({
  size: 2.3,
  map: starTextureMap,
  vertexColors: true,
  transparent: true,
  opacity: 0.78,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const spiralGalaxy = new THREE.Points(galaxyGeo, galaxyMat);
galaxyGroup.add(spiralGalaxy);

// -------------------------------------------------------------
// 💎 4. NÚCLEO REALISTA DE CRISTAL FÍSICO CON ANILLOS Y POLVO
// -------------------------------------------------------------
const coreGroup = new THREE.Group();
scene.add(coreGroup);

const crystalGeo = new THREE.IcosahedronGeometry(11, 2);
const crystalMat = new THREE.MeshPhysicalMaterial({
  color: 0x00f0ff,
  emissive: 0x002b4d,
  roughness: 0.1,
  metalness: 0.1,
  transmission: 0.9,
  thickness: 2.5,
  ior: 1.52,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  wireframe: false
});
const coreCrystal = new THREE.Mesh(crystalGeo, crystalMat);
coreGroup.add(coreCrystal);

const wireMat = new THREE.MeshBasicMaterial({
  color: 0xe0f2fe,
  wireframe: true,
  transparent: true,
  opacity: 0.35
});
const wireMesh = new THREE.Mesh(crystalGeo, wireMat);
wireMesh.scale.setScalar(1.06);
coreGroup.add(wireMesh);

function createOrbitalRing(radius, tubeRadius, color, rotX, rotY) {
  const ringGeo = new THREE.TorusGeometry(radius, tubeRadius, 16, 100);
  const ringMat = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.8,
    roughness: 0.2,
    emissive: color,
    emissiveIntensity: 0.3
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = rotX;
  ring.rotation.y = rotY;
  return ring;
}

const ring1 = createOrbitalRing(18, 0.35, 0x38bdf8, Math.PI / 3, 0);
const ring2 = createOrbitalRing(22, 0.25, 0x818cf8, -Math.PI / 4, Math.PI / 6);
const ring3 = createOrbitalRing(26, 0.2, 0xf472b6, Math.PI / 6, -Math.PI / 3);

coreGroup.add(ring1);
coreGroup.add(ring2);
coreGroup.add(ring3);

const coreDustCount = 1200;
const coreDustGeo = new THREE.BufferGeometry();
const coreDustPos = new Float32Array(coreDustCount * 3);

for (let i = 0; i < coreDustCount; i++) {
  const r = 12 + Math.random() * 18;
  const theta = Math.random() * Math.PI * 2;
  const phi = (Math.random() - 0.5) * Math.PI;

  coreDustPos[i * 3] = r * Math.cos(theta) * Math.cos(phi);
  coreDustPos[i * 3 + 1] = r * Math.sin(phi);
  coreDustPos[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);
}

coreDustGeo.setAttribute('position', new THREE.BufferAttribute(coreDustPos, 3));
const coreDustMat = new THREE.PointsMaterial({
  size: 1.4,
  map: starTextureMap,
  color: 0x38bdf8,
  transparent: true,
  opacity: 0.7,
  blending: THREE.AdditiveBlending
});
const coreDust = new THREE.Points(coreDustGeo, coreDustMat);
coreGroup.add(coreDust);

// Texto flotante Puro (SIN NINGÚN FONDO O CAJA)
function createCenterTextTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Limpieza total del canvas para asegurar 100% transparencia de fondo
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 54px "Trebuchet MS", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const x = canvas.width / 2;
  const y = canvas.height / 2;

  // 1. Trazado exterior oscuro muy grueso para dar contraste instantáneo sobre estrellas
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 14;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);

  // 2. Resplandor dorado sutil en la letra
  ctx.shadowColor = '#ffe600';
  ctx.shadowBlur = 12;

  // 3. Gradiente de relleno Dorado / Blanco deslumbrante
  const textGradient = ctx.createLinearGradient(0, y - 30, 0, y + 30);
  textGradient.addColorStop(0, '#ffffff');
  textGradient.addColorStop(0.5, '#fffbeb');
  textGradient.addColorStop(1, '#fde047');

  ctx.fillStyle = textGradient;
  ctx.fillText(text, x, y);

  return new THREE.CanvasTexture(canvas);
}

const centerTextSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: createCenterTextTexture("Tú eres mi universo entero ❤️"),
  transparent: true,
  depthWrite: false
}));

// Posición directamente arriba del núcleo (sin tapar nada)
centerTextSprite.scale.set(50, 12.5, 1);
centerTextSprite.position.set(0, 20, 0);
coreGroup.add(centerTextSprite);

// -------------------------------------------------------------
// 💬 5. AUTOS CON MENSAJES SUAVES
// -------------------------------------------------------------
const frases = [
  "Eres mi lugar favorito en el mundo 💖",
  "Amo la forma en que me miras ✨",
  "Contigo cada segundo vale la pena ⏳❤️",
  "Eres el sueño del que nunca quiero despertar 🌙",
  "Mi corazón sonríe cada vez que te piensa 💓",
  "Llegaste tú y todo se volvió hermoso 🌸",
  "Eres la casualidad más bonita de mi vida 💫",
  "Tu sonrisa ilumina todas mis galaxias 🌌",
  "Amo todo de ti, sin excepción 💕",
  "Haces que mi mundo sea más bonito 🌎✨",
  "Tu amor es mi refugio perfecto 🏡❤️",
  "A tu lado la vida sabe mejor 🍯✨",
  "Eres mi pensamiento favorito del día 💭❤️",
  "Donde tú estás, ahí es mi hogar 💖",
  "Gracias por coincidir conmigo en esta vida 👩‍❤️‍👨",
  "Eres el amor de todas mis vidas ♾️❤️",
  "Mi felicidad tiene tu nombre ✍️💖",
  "Tenerte a mi lado es mi mayor fortuna 🏆❤️",
  "Cada día a tu lado es un regalo 🎁✨",
  "Amo construir este futuro contigo 🔮💖",
  "Eres mi copiloto favorita 🏎️💖",
  "Pisa el acelerador de mi corazón ❤️🚀",
  "Juntos en cada curva dura 🛣️❤️",
  "Velocidad, ritmo y pasión 🔥✨",
  "Mi premio más grande eres tú 🏆💖",
  "Viajando juntos hacia las estrellas 🌌🚘"
];

function createCleanTextTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.lineWidth = 5;
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);

  ctx.fillStyle = '#f8fafc';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return new THREE.CanvasTexture(canvas);
}

const texturasFrases = frases.map((frase) => createCleanTextTexture(frase));

const CANTIDAD_AUTOS = 400;
const CANTIDAD_IMAGENES = 20;

const textureLoader = new THREE.TextureLoader();
const autosGroup = new THREE.Group();
scene.add(autosGroup);

const carMaterials = [];
let imagenesCargadas = 0;
const itemsAnimados = [];

for (let i = 0; i < CANTIDAD_IMAGENES; i++) {
  const numImagen = i + 1;
  const imagePath = `IMG/carro${numImagen}.png`;

  textureLoader.load(imagePath, (texture) => {
    carMaterials[i] = new THREE.SpriteMaterial({ map: texture, transparent: true });
    imagenesCargadas++;

    if (imagenesCargadas === CANTIDAD_IMAGENES) {
      construirGalaxia3D();
    }
  });
}

function construirGalaxia3D() {
  for (let i = 0; i < CANTIDAD_AUTOS; i++) {
    const matIndex = i % CANTIDAD_IMAGENES;

    const carSprite = new THREE.Sprite(carMaterials[matIndex]);
    carSprite.scale.set(5.5, 3.5, 1);

    const textMat = new THREE.SpriteMaterial({ map: texturasFrases[i % texturasFrases.length], transparent: true });
    const textSprite = new THREE.Sprite(textMat);
    textSprite.scale.set(11.5, 2.6, 1);
    textSprite.position.set(0, -3.1, 0);

    const itemGroup = new THREE.Group();
    itemGroup.add(carSprite);
    itemGroup.add(textSprite);

    const angle = (i / CANTIDAD_AUTOS) * Math.PI * 26;
    const radius = 28 + (i / CANTIDAD_AUTOS) * 120;
    const height = Math.sin(i * 0.2) * 18 + (Math.random() - 0.5) * 20;

    itemGroup.position.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );

    itemsAnimados.push({
      group: itemGroup,
      baseY: height,
      speed: 1.0 + Math.random() * 1.5,
      offset: Math.random() * Math.PI * 2
    });

    autosGroup.add(itemGroup);
  }
}

// -------------------------------------------------------------
// 6. LOOP DE ANIMACIÓN Y RENDERIZADO
// -------------------------------------------------------------
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  coreCrystal.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2;
  coreCrystal.rotation.y += 0.006;
  wireMesh.rotation.y -= 0.004;

  ring1.rotation.z += 0.005;
  ring2.rotation.z -= 0.007;
  ring3.rotation.z += 0.004;

  coreDust.rotation.y += 0.003;

  galaxyGroup.rotation.y += 0.0006;
  autosGroup.rotation.y += 0.0006;

  itemsAnimados.forEach(item => {
    item.group.position.y = item.baseY + Math.sin(elapsedTime * item.speed + item.offset) * 2.0;
  });

  centerPointLight.intensity = 5.5 + Math.sin(elapsedTime * 2.0) * 1.2;

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
