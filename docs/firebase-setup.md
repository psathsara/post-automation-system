# Firebase setup

## 1. Create the Firebase project

1. Go to the Firebase Console.
2. Create a project for the internal ERP platform.
3. Add a web app and copy the Firebase client config values into `.env.local`.
4. Enable Firestore Database in production mode.
5. Enable Firebase Storage.

## 2. Create the Admin SDK key

1. Open Project settings.
2. Go to Service accounts.
3. Generate a new private key.
4. Copy these values into `.env.local`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_STORAGE_BUCKET`

Keep the service account JSON out of git. This project stores only individual environment variables.

## 3. Add local environment values

Copy `.env.example` to `.env.local`, then fill every Firebase value.

Generate `AUTH_SECRET` with a long random value. In PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 4. Deploy security rules

Install Firebase CLI, log in, then deploy:

```powershell
npm install -g firebase-tools
firebase login
firebase init firestore storage
firebase deploy --only firestore:rules,storage
```

Use the included `firestore.rules` and `storage.rules` files.

## 5. Seed default users

After `.env.local` is filled:

```powershell
npm run seed:firebase
```

Default development credentials:

- SUPER ADMIN: `admin` / `Admin123`
- ADMIN: `admin` / `Admin1234`
- USER: `user` / `User123`

The first two accounts intentionally share the username because that was requested. For production, move to unique usernames and rotate all default passwords.
