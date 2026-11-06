"use client";

import * as THREE from "three";

/** הגדרת תוספת — מחיר, שם ומפעל יצירת הרשת התלת-ממדית */
export type ToppingKind = {
  id: string;
  name: string;
  emoji: string;
  price: number;
};

/** בסיס לפיצה המשפחתית + מחירי התוספות — כל המחירים במקום אחד */
export const BASE_PRICE = 58;

export const TOPPINGS: ToppingKind[] = [
  { id: "pepperoni", name: "פפרוני", emoji: "🥓", price: 9 },
  { id: "mushroom", name: "פטריות", emoji: "🍄", price: 7 },
  { id: "olive", name: "זיתים שחורים", emoji: "🫒", price: 6 },
  { id: "pepper", name: "פלפל ירוק", emoji: "🫑", price: 6 },
  { id: "onion", name: "בצל סגול", emoji: "🧅", price: 6 },
  { id: "basil", name: "בזיליקום", emoji: "🌿", price: 6 },
  { id: "corn", name: "תירס", emoji: "🌽", price: 6 },
  { id: "mozzarella", name: "מוצרלה", emoji: "🧀", price: 8 },
];

/**
 * מפעל תוספות פרוצדורלי — אותה שיטה של הפיצה:
 * גיאומטריות בסיס + חומרים חמים MeshStandardMaterial + צללים.
 * הבזיליקום נוצר ב-scene (משתמש בטקסטורת העלה המקורית).
 */
export function makeTopping(kind: ToppingKind): THREE.Object3D {
  const group = new THREE.Group();
  const std = (color: number, roughness: number) =>
    new THREE.MeshStandardMaterial({ color, roughness, envMapIntensity: 0.5 });

  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0, ry = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  switch (kind.id) {
    case "pepperoni": {
      const body = std(0xb03428, 0.52);
      body.map = speckleTexture(0xc9553f, 0x8c231a);
      add(new THREE.CylinderGeometry(0.165, 0.158, 0.026, 28), body, 0, 0.013);
      add(new THREE.TorusGeometry(0.158, 0.011, 10, 28), std(0x8f281d, 0.5), 0, 0.013).rotation.x = Math.PI / 2;
      break;
    }
    case "mushroom": {
      const cap = add(
        new THREE.SphereGeometry(0.13, 18, 12, 0, TAU, 0, Math.PI * 0.55),
        std(0xd9c7a3, 0.6),
        0, 0.03,
      );
      cap.scale.set(1, 0.55, 0.86);
      add(new THREE.CylinderGeometry(0.028, 0.036, 0.045, 10), std(0xe9dfc8, 0.65), 0.01, 0.012, 0.012, 0.5);
      break;
    }
    case "olive": {
      add(new THREE.TorusGeometry(0.052, 0.026, 12, 20), std(0x211d1a, 0.32), 0, 0.012).rotation.x = Math.PI / 2;
      add(new THREE.TorusGeometry(0.042, 0.024, 12, 20), std(0x332c26, 0.3), 0.09, 0.012, 0.06).rotation.x = Math.PI / 2;
      break;
    }
    case "pepper": {
      const ring = add(new THREE.TorusGeometry(0.092, 0.02, 10, 24, TAU * 0.92), std(0x457a38, 0.42), 0, 0.014);
      ring.rotation.x = Math.PI / 2;
      break;
    }
    case "onion": {
      const ring = add(new THREE.TorusGeometry(0.078, 0.016, 10, 22, TAU * 0.85), std(0x9d6fae, 0.38), 0, 0.012);
      ring.rotation.x = Math.PI / 2;
      const inner = add(new THREE.TorusGeometry(0.055, 0.012, 10, 20, TAU * 0.8), std(0xb98fc9, 0.36), 0.02, 0.02, 0.03);
      inner.rotation.x = Math.PI / 2;
      break;
    }
    case "corn": {
      const kernel = std(0xf0c33c, 0.45);
      const geo = new THREE.SphereGeometry(0.026, 10, 8);
      const spots = [
        [0, 0, 0], [0.045, 0.008, 0.012], [-0.04, 0.006, 0.02], [0.012, 0.01, -0.045],
        [-0.02, 0.008, -0.038], [0.03, 0.014, -0.02],
      ] as const;
      for (const [x, y, z] of spots) add(geo, kernel, x, y + 0.014, z);
      break;
    }
    case "mozzarella": {
      const cheese = std(0xf6f0dd, 0.42);
      const a = add(new THREE.SphereGeometry(0.1, 14, 10), cheese, 0, 0.028);
      a.scale.set(1.3, 0.4, 0.9);
      const b = add(new THREE.SphereGeometry(0.07, 12, 9), cheese, 0.11, 0.02, 0.06, 0.8);
      b.scale.set(1.2, 0.42, 1);
      break;
    }
  }
  return group;
}

const TAU = Math.PI * 2;

/** טקסטורת נקודות עדינה לפפרוני */
function speckleTexture(light: number, dark: number): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = `#${light.toString(16).padStart(6, "0")}`;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = `#${dark.toString(16).padStart(6, "0")}`;
  let seed = 42;
  const rnd = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 26; i++) {
    ctx.beginPath();
    ctx.arc(rnd() * size, rnd() * size, 1 + rnd() * 2.2, 0, TAU);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
