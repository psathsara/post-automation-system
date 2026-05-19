import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

const required = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is required. Copy .env.example to .env.local and fill Firebase Admin values.`);
  }
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

const users = [
  {
    id: "super-admin-default",
    username: "admin",
    displayName: "Super Admin",
    role: "SUPER_ADMIN",
    password: "Admin123",
  },
  {
    id: "admin-default",
    username: "admin",
    displayName: "Admin",
    role: "ADMIN",
    password: "Admin1234",
  },
  {
    id: "user-default",
    username: "user",
    displayName: "Content User",
    role: "USER",
    password: "User123",
  },
] as const;

async function main() {
  const db = getFirestore();
  const now = new Date().toISOString();

  for (const user of users) {
    await db.collection("users").doc(user.id).set(
      {
        username: user.username,
        usernameLower: user.username.toLowerCase(),
        displayName: user.displayName,
        role: user.role,
        status: "ACTIVE",
        passwordHash: await bcrypt.hash(user.password, 12),
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

    console.log(`Seeded ${user.role}: ${user.username}`);
  }

  console.log("Default users seeded. Rotate passwords before production use.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
