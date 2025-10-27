# Firebase Storage Setup for Equipment Images

## Issue

CORS errors when uploading images to Firebase Storage are typically caused by missing or incorrect storage security rules.

## Solution

### 1. Update Firebase Storage Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **smartlab-e2107**
3. Navigate to **Storage** in the left sidebar
4. Click on the **Rules** tab
5. Replace the rules with:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Equipment images - readable by everyone, writable by authenticated users
    match /equipment_images/{imageId} {
      allow read: if true; // Anyone can read equipment images
      allow write: if request.auth != null; // Only authenticated users can upload
    }

    // Default: deny all access if not matched above
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

6. Click **Publish**

### 2. Enable Firebase Storage (if not already enabled)

1. In Firebase Console, go to **Storage**
2. If prompted, click **Get Started**
3. Choose **Production mode** (or **Test mode** for development)
4. Select your region and click **Enable**

### 3. Deploy Rules Using Firebase CLI (Alternative Method)

If you have Firebase CLI installed:

```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init storage

# Deploy storage rules
firebase deploy --only storage
```

## Temporary Workaround

The current implementation gracefully handles storage failures:

- If image upload fails, equipment will be saved WITHOUT the image
- The form will still submit successfully
- You can add/update the image later by editing the equipment

## Testing

After updating the rules:

1. Try adding equipment with an image
2. Check browser console for success messages
3. Verify image appears in Firebase Storage console

## Security Notes

- Current rules allow ANY authenticated user to upload images
- For production, consider adding more restrictive rules based on user roles
- Example: Only allow admin/lab_manager roles to upload

```javascript
match /equipment_images/{imageId} {
  allow read: if true;
  allow write: if request.auth != null &&
               (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'laboratory_manager');
}
```
