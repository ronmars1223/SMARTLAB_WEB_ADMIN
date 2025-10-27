# Firebase Storage Rules to Copy

Copy these rules into Firebase Console → Storage → Rules

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow reading equipment images by everyone
    // Allow writing equipment images by authenticated users only
    match /equipment_images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Block access to all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## How to Apply

1. **Open** [Firebase Console](https://console.firebase.google.com/)
2. **Select** your project (smartlab-e2107)
3. **Click** "Storage" in left sidebar
4. **Click** "Rules" tab (if you don't see Rules, enable Storage first)
5. **Delete** all existing rules (if any)
6. **Paste** the rules above
7. **Click** "Publish"

## Steps to Enable Storage (if needed)

If you don't see the Storage section:

1. Go to Firebase Console
2. Click "Add another app" or "Continue project"
3. Click "Storage" in the sidebar
4. Click "Get started"
5. Select "Production mode"
6. Choose your storage region
7. Click "Enable"

## Test After Setup

After applying these rules, try uploading an equipment image again. The CORS error should be resolved!
