# Quick Fix for CORS Error

## The Problem

CORS error preventing image uploads to Firebase Storage

## Immediate Fix

**The equipment form already works without images!** The code is designed to gracefully handle storage failures:

- ✅ Form submits successfully even if image upload fails
- ✅ Equipment is saved without the image URL
- ✅ You can edit equipment later and add the image

## To Enable Image Upload

### Option 1: Update Firebase Console (Easiest)

1. Go to https://console.firebase.google.com/
2. Select project: **smartlab-e2107**
3. Go to **Storage** → **Rules**
4. Replace with this code:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /equipment_images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

5. Click **Publish**

### Option 2: Continue Without Images

- Equipment can be added without images
- Images can be added later via URL in the equipment data
- This is fully functional for your system

## What to Do Now

The app should work fine without image uploads. To add equipment:

1. Fill in the form
2. Skip the image upload (or try it - it will fail gracefully)
3. Submit the form
4. Equipment will be saved successfully

You can fix the storage rules later when you have time to access the Firebase console.
