"use client";

import * as THREE from "three";
import { makeTopping, type ToppingKind } from "./toppings";

/**
 * סצנת הפיצה — העתקה מדויקת של הטכניקה מהתפריט הדיגיטלי:
 * גיאומטריית טבעות מועתקת לפי מפת גבהים + צללית היקף, תאורת סטודיו,
 * לולאת רינדור חסכונית וגרירה לסיבוב — בתוספת raycasting להצמדת תוספות לבצק.
 */

export type PieScene = {
  canvas: HTMLCanvasElement;
  schedule(): void;
  dispose(): void;
  /** מוסיף תוספת; בלי מיקום — נקודה פנויה אקראית */
  addTopping(kind: ToppingKind, at?: { x: number; z: number }): string;
  removeTopping(id: string): void;
  clearToppings(): void;
  /** גרירת רפאים מהמגש */
  beginGhost(kind: ToppingKind, clientX: number, clientY: number): void;
  moveGhost(clientX: number, clientY: number): void;
  /** מסיים גרירה — מחזיר מיקום מקומי על הבצק או null אם מחוץ */
  endGhost(): { x: number; z: number } | null;
  hasGhost(): boolean;
};

type SceneCallbacks = {
  /** תוספת נגררה מהפיצה והושלכה החוצה */
  onToppingDiscarded(id: string): void;
  /** התוספת נעה על הפיצה */
  onToppingMoved(id: string): void;
};

export async function createPieScene(
  host: HTMLElement,
  stillImage: HTMLImageElement,
  callbacks: SceneCallbacks,
): Promise<PieScene> {
  const asset = (await (await fetch("/pizza-asset.json")).json()) as {
    map: string;
    edge: number[];
    surface: string;
    basil: string;
    poster: string;
  };
  stillImage.src = asset.poster || asset.map;

  let renderer: THREE.WebGLRenderer;
  let frame = 0;
  let ready = false;
  let visible = true;

  function useStill() {
    ready = false;
    cancelAnimationFrame(frame);
    frame = 0;
    if (renderer) renderer.domElement.hidden = true;
    stillImage.hidden = false;
  }

  // A canvas-backed texture also uploads reliably on ANGLE.
  async function loadMap(url: string, size: number, isColour: boolean) {
    const image = new Image();
    image.src = url;
    await image.decode();
    const buffer = document.createElement("canvas");
    buffer.width = size || image.naturalWidth;
    buffer.height = size || image.naturalHeight;
    buffer.getContext("2d")!.drawImage(image, 0, 0, buffer.width, buffer.height);
    const texture = new THREE.CanvasTexture(buffer);
    if (isColour) texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 6);
    return texture;
  }

  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(Math.max(1.25, devicePixelRatio), 1.8));
    renderer.setClearColor(0, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;

    const [colour, surface, basilMap] = await Promise.all([
      loadMap(asset.map, 1024, true),
      loadMap(asset.surface, 0, false),
      loadMap(asset.basil, 0, true),
    ]);

    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "group");
    canvas.setAttribute("aria-description", "פיצה תלת־ממדית. גררו לסיבוב, בחרו תוספות וגררו אותן על הפיצה.");
    canvas.style.touchAction = "none";
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 35);
    const platter = new THREE.Group();
    scene.add(platter);

    // ─── softbox environment (identical to menu) ───
    const softbox = document.createElement("canvas");
    softbox.width = 256;
    softbox.height = 128;
    const lightMap = softbox.getContext("2d")!;
    const lightFalloff = lightMap.createLinearGradient(0, 0, 0, 128);
    lightFalloff.addColorStop(0, "#ac9881");
    lightFalloff.addColorStop(0.54, "#4a443b");
    lightFalloff.addColorStop(1, "#27211b");
    lightMap.fillStyle = lightFalloff;
    lightMap.fillRect(0, 0, 256, 128);
    lightMap.fillStyle = "#fff5e4";
    lightMap.fillRect(28, 16, 56, 37);
    lightMap.fillStyle = "#dce6e9";
    lightMap.fillRect(174, 34, 22, 32);
    scene.environment = new THREE.CanvasTexture(softbox);
    scene.environment.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment.colorSpace = THREE.SRGBColorSpace;

    const hemisphere = new THREE.HemisphereLight(0xfff6e9, 0xb68b6a, 1.05);
    const windowLight = new THREE.DirectionalLight(0xfff0db, 2.05);
    windowLight.position.set(-3.8, 6, 2.4);
    windowLight.castShadow = true;
    const shadowSize = host.clientWidth < 480 ? 512 : 1024;
    windowLight.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(windowLight.shadow.camera, { left: -2.7, right: 2.7, top: 2.7, bottom: -2.7, near: 0.5, far: 12 });
    windowLight.shadow.camera.updateProjectionMatrix();
    windowLight.shadow.bias = -0.00026;
    windowLight.shadow.normalBias = 0.006;
    const bounce = new THREE.DirectionalLight(0xffe4bb, 0.52);
    bounce.position.set(2, 3, -4);
    scene.add(hemisphere, windowLight, bounce);

    // ─── pie geometry (identical math) ───
    const mapSize = surface.image.width;
    const samples = surface.image.getContext("2d")!.getImageData(0, 0, mapSize, mapSize).data;
    const TAU = Math.PI * 2;
    const smoothstep = THREE.MathUtils.smoothstep;
    const sides = asset.edge.length;
    function reliefAt(x: number, z: number) {
      const px = Math.max(0, Math.min(mapSize - 1, Math.round((0.5 + x / 4) * (mapSize - 1))));
      const py = Math.max(0, Math.min(mapSize - 1, Math.round((0.5 + z / 4) * (mapSize - 1))));
      return samples[(py * mapSize + px) * 4 + 2] / 255;
    }
    function topHeight(x: number, z: number, radius: number, angle: number) {
      const ridge = 0.899 + 0.014 * Math.sin(5 * angle + 0.4) + 0.009 * Math.cos(9 * angle);
      const crown = Math.exp(-Math.pow((radius - ridge) / 0.108, 2));
      const rise = 0.202 + 0.038 * Math.sin(4 * angle) + 0.024 * Math.cos(11 * angle + 0.3);
      return 0.061 + 0.082 * reliefAt(x, z) + crown * rise;
    }
    function surfaceHeight(x: number, z: number) {
      const radius = Math.hypot(x, z);
      const angle = Math.atan2(z, x);
      const edge = asset.edge[Math.round((angle / TAU + 1) % 1 * sides) % sides] ?? 0.96;
      if (radius > 2 * edge * 0.92) return 0.061; // מחוץ לבצק
      return topHeight(x, z, radius, angle);
    }

    const rings: Array<{ radius: number; uv?: number; surface?: boolean; height?: number; shade?: number }> = [];
    for (let j = 0; j <= 66; j++) {
      const t = Math.max(0.0001, j / 66);
      rings.push({ radius: t - 0.021 * smoothstep(t, 0.87, 1), uv: t - 0.065 * smoothstep(t, 0.79, 1), surface: true });
    }
    const sideProfile = [
      [0.99, 0.87, 0.95, 0.99], [0.998, 0.66, 0.964, 0.97], [1, 0.43, 0.976, 0.93],
      [0.995, 0.24, 0.984, 0.9], [0.981, 0.09, 0.991, 0.85], [0.962, -0.02, 0.996, 0.8],
      [0.925, -0.07, 0.994, 0.77], [0.78, -0.1, 0.98, 0.76], [0, -0.1, 0.97, 0.74],
    ];
    for (const [radius, height, uv, shade] of sideProfile) rings.push({ radius, height, uv, shade });

    const positions: number[] = [];
    const uvs: number[] = [];
    const colours: number[] = [];
    const indices: number[] = [];
    rings.forEach((ring, j) => {
      for (let i = 0; i < sides; i++) {
        const a = (TAU * i) / sides;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const edge = asset.edge[i];
        const r = ring.radius;
        const x = 2 * edge * r * c;
        const z = 2 * edge * r * s;
        const y = ring.surface
          ? topHeight(x, z, r, a)
          : topHeight(1.958 * edge * c, 1.958 * edge * s, 0.979, a) * ring.height! - 0.009;
        positions.push(x, y, z);
        const textureRadius = edge * (ring.uv ?? r);
        uvs.push(0.5 + 0.5 * textureRadius * c, 0.5 - 0.5 * textureRadius * s);
        const shade = ring.shade ?? 1;
        colours.push(shade, shade, shade);
        if (j > 0) {
          const inner = (j - 1) * sides + i;
          const next = (j - 1) * sides + ((i + 1) % sides);
          indices.push(inner, next, inner + sides, next, next + sides, inner + sides);
        }
      }
    });
    const dough = new THREE.BufferGeometry();
    dough.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    dough.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    dough.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
    dough.setIndex(indices);
    dough.computeVertexNormals();
    const pie = new THREE.Mesh(
      dough,
      new THREE.MeshStandardMaterial({
        map: colour,
        vertexColors: true,
        roughness: 1,
        roughnessMap: surface,
        bumpMap: surface,
        bumpScale: 0.011,
        envMapIntensity: 0.54,
      }),
    );
    pie.castShadow = pie.receiveShadow = true;
    platter.add(pie);

    // ─── basil material (leaf factory reused for the basil topping) ───
    const basilMaterial = new THREE.MeshStandardMaterial({
      map: basilMap,
      color: 0xe1efde,
      alphaTest: 0.55,
      side: THREE.DoubleSide,
      roughness: 0.51,
      bumpMap: basilMap,
      bumpScale: 0.0035,
      envMapIntensity: 0.48,
    });
    function makeBasilLeaf(): THREE.Mesh {
      const blade = new THREE.PlaneGeometry(1, 1, 16, 24);
      const angle = Math.random() * TAU;
      const length = 0.34 + Math.random() * 0.18;
      const width = 0.24 + Math.random() * 0.08;
      const curl = 0.03 + Math.random() * 0.03;
      const twist = (Math.random() - 0.5) * 0.7;
      const p = blade.attributes.position;
      const uv = blade.attributes.uv;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const x = 0;
      const z = 0;
      for (let i = 0; i < p.count; i++) {
        const u = uv.getX(i) * 2 - 1;
        const t = uv.getY(i);
        const mid = Math.sin(Math.PI * t);
        const across = (u * width) / 2 + twist * t * t * 0.1;
        const worldX = x + length * t * s - across * c;
        const worldZ = z + length * t * c + across * s;
        const cup = mid * (0.046 * (1 - u * u) + 0.032 * Math.abs(u) + twist * 0.045 * u);
        p.setXYZ(i, worldX - x, 0.008 + cup + curl * t * t, worldZ - z);
      }
      blade.computeVertexNormals();
      const leaf = new THREE.Mesh(blade, basilMaterial);
      leaf.castShadow = leaf.receiveShadow = true;
      return leaf;
    }

    // ─── plate (identical) ───
    const clay = "#dfd1b9";
    const rim = "#efdfc3";
    const line = "#986952";
    const profile: Array<[number, number, string]> = [
      [0.002, -0.112, clay], [0.74, -0.116, clay], [0.83, -0.165, clay], [0.9, -0.169, clay],
      [1.03, -0.116, clay], [1.76, -0.094, clay], [2.06, -0.055, clay], [2.194, -0.012, clay],
      [2.22, 0.02, rim], [2.215, 0.038, rim], [2.202, 0.045, rim], [2.184, 0.047, rim],
      [2.177, 0.047, line], [2.165, 0.046, line], [2.159, 0.046, rim], [2.136, 0.043, rim],
      [2.131, 0.042, line], [2.124, 0.041, line], [2.118, 0.04, rim], [2.086, 0.034, rim],
      [2.044, 0.021, clay], [1.99, 0.001, clay], [1.92, -0.019, clay], [1.76, -0.025, clay], [0.002, -0.026, clay],
    ];
    const ceramic = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 144);
    const glazeColours: number[] = [];
    for (let i = 0; i < ceramic.attributes.position.count; i++) {
      const tint = new THREE.Color(profile[i % profile.length][2]);
      glazeColours.push(tint.r, tint.g, tint.b);
    }
    ceramic.setAttribute("color", new THREE.Float32BufferAttribute(glazeColours, 3));
    const glazeSize = 128;
    const grain = new Uint8Array(glazeSize * glazeSize * 4);
    let randomState = 31991;
    for (let i = 0; i < grain.length; i += 4) {
      randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
      const sample = randomState / 4294967296;
      const lightness = sample < 0.017 ? 208 + sample * 450 : 249 + sample * 6;
      grain[i] = lightness;
      grain[i + 1] = lightness;
      grain[i + 2] = lightness;
      grain[i + 3] = 255;
    }
    const glaze = new THREE.DataTexture(grain, glazeSize, glazeSize);
    glaze.colorSpace = THREE.SRGBColorSpace;
    glaze.wrapS = glaze.wrapT = THREE.RepeatWrapping;
    glaze.magFilter = THREE.LinearFilter;
    glaze.minFilter = THREE.LinearMipmapLinearFilter;
    glaze.generateMipmaps = true;
    glaze.needsUpdate = true;
    const platePos = ceramic.attributes.position;
    const plateUV = ceramic.attributes.uv;
    for (let i = 0; i < platePos.count; i++) plateUV.setXY(i, platePos.getX(i) * 0.66, platePos.getZ(i) * 0.66);
    const plate = new THREE.Mesh(
      ceramic,
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        map: glaze,
        roughness: 0.32,
        clearcoat: 0.48,
        clearcoatRoughness: 0.24,
        envMapIntensity: 0.7,
      }),
    );
    plate.receiveShadow = true;
    platter.add(plate);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.05, 4.9),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader: `varying vec2 shadowUv;
          void main(){shadowUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `varying vec2 shadowUv;
          void main(){
            float distanceToCentre=length(shadowUv*2.0-1.0);
            float opacity=.66*(1.0-smoothstep(.48,1.0,distanceToCentre));
            gl_FragColor=vec4(.045,.027,.019,opacity);
          }`,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.09, -0.174, 0.06);
    scene.add(shadow);

    // ─── toppings layer ───
    const toppingsGroup = new THREE.Group();
    platter.add(toppingsGroup);
    const toppingMeshes = new Map<string, THREE.Object3D>();

    function placeOnPie(obj: THREE.Object3D, x: number, z: number) {
      obj.position.set(x, surfaceHeight(x, z) + 0.004, z);
      obj.rotation.y = Math.random() * TAU;
    }

    function randomSpot(): { x: number; z: number } {
      for (let attempt = 0; attempt < 24; attempt++) {
        const a = Math.random() * TAU;
        const r = 0.18 + Math.random() * 1.28;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        let free = true;
        for (const other of toppingMeshes.values()) {
          if (Math.hypot(other.position.x - x, other.position.z - z) < 0.24) {
            free = false;
            break;
          }
        }
        if (free) return { x, z };
      }
      return { x: (Math.random() - 0.5) * 2.4, z: (Math.random() - 0.5) * 2.4 };
    }

    function addTopping(kind: ToppingKind, at?: { x: number; z: number }) {
      const obj = kind.id === "basil" ? makeBasilLeaf() : makeTopping(kind);
      const spot = at ?? randomSpot();
      placeOnPie(obj, spot.x, spot.z);
      const uid = `${kind.id}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      obj.userData.uid = uid;
      obj.traverse((child) => {
        child.userData.toppingUid = uid;
      });
      toppingsGroup.add(obj);
      toppingMeshes.set(uid, obj);
      schedule();
      return uid;
    }

    function removeTopping(id: string) {
      const obj = toppingMeshes.get(id);
      if (!obj) return;
      toppingsGroup.remove(obj);
      toppingMeshes.delete(id);
      schedule();
    }

    function clearToppings() {
      toppingsGroup.clear();
      toppingMeshes.clear();
      schedule();
    }

    // ─── raycasting ───
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function toPointer(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect();
      pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    }
    /** נקודה מקומית על הבצק (מרחב platter) או null */
    function pickPie(clientX: number, clientY: number): { x: number; z: number } | null {
      toPointer(clientX, clientY);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(pie, false);
      if (!hits.length) return null;
      const local = platter.worldToLocal(hits[0].point.clone());
      return { x: local.x, z: local.z };
    }
    function pickTopping(clientX: number, clientY: number): THREE.Object3D | null {
      toPointer(clientX, clientY);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(toppingsGroup, true);
      return hits.length ? toppingMeshes.get(hits[0].object.userData.toppingUid ?? "") ?? null : null;
    }

    // ─── ghost drag from tray ───
    let ghost: THREE.Object3D | null = null;
    let lastGhostSpot: { x: number; z: number } | null = null;
    function beginGhost(kind: ToppingKind, clientX: number, clientY: number) {
      endGhostDiscard();
      ghost = kind.id === "basil" ? makeBasilLeaf() : makeTopping(kind);
      ghost.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of materials) {
            const clone = (m as THREE.Material).clone();
            (clone as THREE.MeshStandardMaterial).transparent = true;
            (clone as THREE.MeshStandardMaterial).opacity = 0.75;
            mesh.material = clone;
          }
        }
      });
      scene.add(ghost);
      moveGhost(clientX, clientY);
    }
    function moveGhost(clientX: number, clientY: number) {
      if (!ghost) return;
      lastGhostSpot = pickPie(clientX, clientY);
      const spot = lastGhostSpot ?? pickPizzaPlane(clientX, clientY);
      if (spot) {
        const world = platter.localToWorld(new THREE.Vector3(spot.x, surfaceHeight(spot.x, spot.z) + 0.22, spot.z));
        ghost.position.copy(world);
      }
      schedule();
    }
    /** מישור אופקי בגובה הפיצה — כדי שהרפאים יעקוב גם מחוץ לבצק */
    const fallPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.2);
    function pickPizzaPlane(clientX: number, clientY: number): { x: number; z: number } | null {
      toPointer(clientX, clientY);
      raycaster.setFromCamera(pointer, camera);
      const point = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(fallPlane, point)) return null;
      const local = platter.worldToLocal(point.clone());
      return { x: local.x, z: local.z };
    }
    function endGhostDiscard() {
      if (ghost) {
        scene.remove(ghost);
        ghost = null;
        lastGhostSpot = null;
        schedule();
      }
    }
    function endGhost(): { x: number; z: number } | null {
      if (!ghost) return null;
      const spot = lastGhostSpot;
      endGhostDiscard();
      return spot;
    }
    function hasGhost() {
      return Boolean(ghost);
    }

    // ─── render loop + rotation (identical, pauses during any drag) ───
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let playing = !reduced.matches;
    let rotateDrag: { id: number; x: number; y: number; angle: number; tilt: number } | null = null;
    let toppingDrag: { id: number; obj: THREE.Object3D; uid: string; overPie: boolean } | null = null;
    let tilt = 0.665;
    let last = 0;
    const busy = () => Boolean(rotateDrag || toppingDrag || ghost);

    function paint() {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      const viewHeight = Math.max(3.2, 5.02 / camera.aspect, 4.58 * Math.sin(tilt) + 0.4);
      const distance = viewHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      camera.position.set(0, distance * Math.sin(tilt) - 0.105, distance * Math.cos(tilt) + 0.27);
      camera.lookAt(0, -0.105, 0.27);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }
    function tick(time: number) {
      frame = 0;
      if (!ready || !visible || document.hidden) return;
      if (playing && !busy() && last) platter.rotation.y += Math.min((time - last) / 1000, 0.06) * 0.23;
      last = time;
      paint();
      if (playing && !busy()) frame = requestAnimationFrame(tick);
    }
    function schedule() {
      if (!ready || frame || !visible || document.hidden) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    }
    function setTilt(value: number) {
      tilt = THREE.MathUtils.clamp(value, 0.31, 1.26);
    }

    canvas.onpointerdown = (event) => {
      if (event.button !== 0) return;
      // תוספת קיימת? גרירה שלה
      const grabbed = pickTopping(event.clientX, event.clientY);
      if (grabbed) {
        const uid = grabbed.userData.uid as string;
        toppingDrag = { id: event.pointerId, obj: grabbed, uid, overPie: true };
        canvas.setPointerCapture(event.pointerId);
        schedule();
        return;
      }
      if (rotateDrag) return;
      rotateDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, angle: platter.rotation.y, tilt };
      canvas.setPointerCapture(event.pointerId);
    };
    canvas.onpointermove = (event) => {
      if (toppingDrag?.id === event.pointerId) {
        const spot = pickPie(event.clientX, event.clientY);
        toppingDrag.overPie = Boolean(spot);
        if (spot) {
          placeOnPie(toppingDrag.obj, spot.x, spot.z);
        } else {
          const planeSpot = pickPizzaPlane(event.clientX, event.clientY);
          if (planeSpot) {
            toppingDrag.obj.position.set(planeSpot.x, surfaceHeight(planeSpot.x, planeSpot.z) + 0.25, planeSpot.z);
          }
        }
        schedule();
        return;
      }
      if (rotateDrag?.id !== event.pointerId) return;
      platter.rotation.y = rotateDrag.angle + (event.clientX - rotateDrag.x) * 0.012;
      setTilt(rotateDrag.tilt + (event.clientY - rotateDrag.y) * 0.006);
      schedule();
    };
    const pointerEnd = (event: PointerEvent) => {
      if (toppingDrag?.id === event.pointerId) {
        if (!toppingDrag.overPie) {
          removeTopping(toppingDrag.uid);
          callbacks.onToppingDiscarded(toppingDrag.uid);
        } else {
          callbacks.onToppingMoved(toppingDrag.uid);
        }
        toppingDrag = null;
      }
      rotateDrag = null;
      schedule();
    };
    canvas.onlostpointercapture = canvas.onpointercancel = canvas.onpointerup = pointerEnd;
    canvas.onkeydown = (event) => {
      const arrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
      if (!arrows.includes(event.key)) return;
      event.preventDefault();
      if (event.key === "ArrowUp" || event.key === "ArrowDown") setTilt(tilt + (event.key === "ArrowUp" ? 0.08 : -0.08));
      else platter.rotation.y += event.key === "ArrowLeft" ? -0.18 : 0.18;
      schedule();
    };

    const resize = new ResizeObserver(() => {
      if (!ready) return;
      renderer.setSize(host.clientWidth, host.clientHeight, false);
      schedule();
    });
    resize.observe(host);
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) schedule();
    });
    io.observe(host);
    const onVisibility = () => schedule();
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", useStill);

    renderer.setSize(host.clientWidth, host.clientHeight, false);
    paint();
    host.append(canvas);
    stillImage.hidden = true;
    ready = true;
    schedule();

    return {
      canvas,
      schedule,
      addTopping,
      removeTopping,
      clearToppings,
      beginGhost,
      moveGhost,
      endGhost,
      hasGhost,
      dispose() {
        ready = false;
        cancelAnimationFrame(frame);
        resize.disconnect();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        renderer.dispose();
      },
    };
  } catch {
    useStill();
    // סצנה מינימלית כדי שה-API לא ישבור את הרכיב
    const noop = () => undefined;
    return {
      canvas: document.createElement("canvas"),
      schedule: noop,
      addTopping: () => `off-${Date.now()}`,
      removeTopping: noop,
      clearToppings: noop,
      beginGhost: noop,
      moveGhost: noop,
      endGhost: () => null,
      hasGhost: () => false,
      dispose: noop,
    };
  }
}
