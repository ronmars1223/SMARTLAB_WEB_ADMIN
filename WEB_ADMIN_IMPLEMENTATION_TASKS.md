# Web Admin Implementation Tasks

## 📋 Overview

This document lists all features that need to be implemented in the React web admin to sync with the Flutter mobile app. The mobile app is **100% complete** - all remaining work is on the web admin side.

---

## 🔴 HIGH PRIORITY - Critical Features

### 1. **Quantity Borrowed Management** ⚠️ CRITICAL

**Why:** Prevents over-borrowing and tracks available equipment accurately.

**What to Implement:**

#### Files to Modify:
- `src/components/RequestFormsPage.jsx`
- `src/components/EquipmentPage.jsx`
- `src/components/HistoryPage.jsx`

#### Tasks:
1. **Add `quantity_borrowed` field handling**
   - Read `quantity_borrowed` from equipment: `equipment_categories/{categoryId}/equipments/{itemId}/quantity_borrowed`
   - Initialize as `0` if not present

2. **Display available quantity**
   - In `EquipmentPage.jsx`: Show `Available: {quantity - quantity_borrowed}` 
   - Add color coding: green if available, red if not
   - Update equipment listings to show available quantity

3. **On Request Approval** (`RequestFormsPage.jsx`)
   ```javascript
   // When approving a request:
   const equipmentRef = ref(database, `equipment_categories/${categoryId}/equipments/${itemId}`);
   const currentBorrowed = equipment.quantity_borrowed || 0;
   await update(equipmentRef, {
     quantity_borrowed: currentBorrowed + requestedQuantity
   });
   ```

4. **On Request Rejection** (`RequestFormsPage.jsx`)
   ```javascript
   // If request was previously approved, decrement:
   if (request.status === 'approved') {
     await update(equipmentRef, {
       quantity_borrowed: Math.max(0, currentBorrowed - requestedQuantity)
     });
   }
   ```

5. **On Request Return** (`RequestFormsPage.jsx` or `HistoryPage.jsx`)
   ```javascript
   // When processing return:
   await update(equipmentRef, {
     quantity_borrowed: Math.max(0, currentBorrowed - returnedQuantity)
   });
   ```

6. **Prevent Over-borrowing**
   - Before approval, check: `availableQuantity >= requestedQuantity`
   - Show error if not enough available items
   - Disable approve button if insufficient quantity

**Database Path:**
```
equipment_categories/{categoryId}/equipments/{itemId}/quantity_borrowed
```

---

### 2. **Batch Request Support** ⚠️ CRITICAL

**Why:** Mobile app creates batch requests - web admin needs to display and manage them.

**What to Implement:**

#### Files to Modify:
- `src/components/RequestFormsPage.jsx`

#### Tasks:
1. **Display Batch Information**
   - Show `batchId` in request table (if present)
   - Show `batchSize` field: "Batch of {batchSize} items"
   - Add batch badge/indicator for batch requests

2. **Batch Grouping View**
   - Add toggle: "Group by Batch" / "Show Individual"
   - Group requests by `batchId`
   - Show batch header with total items
   - Collapsible batch groups

3. **Batch Filter**
   - Add filter dropdown: "All", "Batch Requests", "Individual Requests"
   - Filter logic: `batchId ? "Batch" : "Individual"`

4. **Batch Actions**
   - "Approve Batch" button (approves all items in batch)
   - "Reject Batch" button (rejects all items in batch)
   - Show batch members when viewing batch request details

5. **Batch Details Modal**
   - When clicking on batch request, show all items in the batch
   - Display batch summary: total items, status breakdown
   - Allow individual item actions within batch

**Example Implementation:**
```javascript
// Group requests by batchId
const groupedRequests = requests.reduce((acc, request) => {
  const key = request.batchId || 'individual';
  if (!acc[key]) acc[key] = [];
  acc[key].push(request);
  return acc;
}, {});

// Display batch badge
{batchId && (
  <span className="batch-badge">
    Batch of {batchSize} items
  </span>
)}
```

**Database Fields:**
```json
{
  "batchId": "batch-uuid-here",
  "batchSize": 3
}
```

---

## 🟡 MEDIUM PRIORITY - Important Features

### 3. **Signature Display** ⚠️ MEDIUM

**Why:** Students sign requests - web admin should display signatures for verification.

**What to Implement:**

#### Files to Modify:
- `src/components/RequestFormsPage.jsx` (request details modal)

#### Tasks:
1. **Parse Signature Data**
   ```javascript
   // Decode base64 signature
   const decodeSignature = (base64String) => {
     const decoded = atob(base64String);
     return JSON.parse(decoded);
   };
   
   // Structure: { points: [{x, y, isNewStroke}], strokeWidth: number }
   ```

2. **Render Signature**
   - Use HTML5 Canvas or SVG
   - Draw signature from points array
   - Handle stroke width
   - Support different canvas sizes

3. **Add to Request Details Modal**
   - Add "View Signature" button/section
   - Show signature canvas in modal
   - Handle cases where signature is missing

**Example Implementation:**
```javascript
const renderSignature = (signatureData) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const { points, strokeWidth } = signatureData;
  
  ctx.strokeStyle = '#000';
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  points.forEach((point, index) => {
    if (point.isNewStroke || index === 0) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  });
  
  return canvas.toDataURL();
};
```

**Signature Format:**
```json
{
  "signature": "base64-encoded-json-string",
  // Decoded: {
  //   "points": [
  //     {"x": number, "y": number, "isNewStroke": boolean}
  //   ],
  //   "strokeWidth": number
  // }
}
```

---

### 4. **Status Field Consistency** ⚠️ MEDIUM

**Why:** Mobile app uses standard status values - web admin should match.

**What to Implement:**

#### Files to Modify:
- `src/components/RequestFormsPage.jsx`
- `src/components/HistoryPage.jsx`
- `src/components/Dashboard.jsx`

#### Tasks:
1. **Remove `in_progress` Status**
   - Find all uses of `in_progress` status
   - Replace with `released` or map `in_progress` → `released`
   - Update status checks and filters

2. **Standardize Status Values**
   - Use only: `pending`, `approved`, `rejected`, `released`, `returned`
   - Update status dropdowns/filters
   - Update status badges/colors

3. **Backward Compatibility**
   - Map existing `in_progress` requests to `released`
   - Update database migration if needed

**Status Values:**
- `pending` - Initial request
- `approved` - Approved by admin/adviser
- `rejected` - Rejected by admin/adviser
- `released` - Item released for pickup
- `returned` - Item returned

---

### 5. **Metadata Fields Consistency** ⚠️ MEDIUM

**Why:** Mobile app expects specific metadata fields for tracking.

**What to Implement:**

#### Files to Modify:
- `src/components/RequestFormsPage.jsx` (handleStatusUpdate function)

#### Tasks:
1. **Add `processedAt` and `processedBy`**
   ```javascript
   // On approve/reject:
   await update(requestRef, {
     status: newStatus,
     processedAt: new Date().toISOString(),
     processedBy: currentUser.uid, // or currentUser.email
     updatedAt: new Date().toISOString()
   });
   ```

2. **Add `releasedAt` and `releasedBy`**
   ```javascript
   // On release:
   await update(requestRef, {
     status: 'released',
     releasedAt: new Date().toISOString(),
     releasedBy: currentUser.uid,
     updatedAt: new Date().toISOString()
   });
   ```

3. **Keep `updatedAt`**
   - Continue setting `updatedAt` on all updates
   - Use for general tracking

**Standard Fields:**
```json
{
  "processedAt": "2024-01-15T10:30:00.000Z",
  "processedBy": "admin-user-id",
  "releasedAt": "2024-01-16T09:00:00.000Z",
  "releasedBy": "admin-user-id",
  "returnedAt": "2024-01-20T14:00:00.000Z",
  "updatedAt": "2024-01-20T14:00:00.000Z"
}
```

---

## 🟢 LOW PRIORITY - Enhancements

### 6. **Enhanced Request Filtering & Search**

**What to Implement:**
- Filter by `batchId` (show only batch requests)
- Filter by `adviserId` (currently filters by name only)
- Filter by `labId` or `labRecordId` (currently filters by name only)
- Search by `itemNo` field
- Search by `batchId`

**Files to Modify:**
- `src/components/RequestFormsPage.jsx`

---

### 7. **Return Processing Enhancement**

**What to Implement:**
- Decrement `quantity_borrowed` when processing return (part of #1)
- Update equipment status if all items returned
- Send notification to student on return processing

**Files to Modify:**
- `src/components/RequestFormsPage.jsx`
- `src/components/HistoryPage.jsx`

---

## 📊 Implementation Priority

### Phase 1: Critical (Do First)
1. ✅ Quantity Borrowed Management
2. ✅ Batch Request Support

### Phase 2: Important (Do Next)
3. ✅ Signature Display
4. ✅ Status Field Consistency
5. ✅ Metadata Fields

### Phase 3: Enhancements (Nice to Have)
6. Enhanced Filtering
7. Return Processing Enhancement

---

## 🧪 Testing Checklist

### Quantity Management
- [ ] Create request → `quantity_borrowed` increments on approval
- [ ] Reject request → `quantity_borrowed` decrements (if was approved)
- [ ] Return item → `quantity_borrowed` decrements
- [ ] Available quantity = `quantity - quantity_borrowed`
- [ ] Over-borrowing prevention works

### Batch Requests
- [ ] Web admin groups batch requests by `batchId`
- [ ] Batch size displays correctly
- [ ] Approve batch → All items in batch approved
- [ ] Reject batch → All items in batch rejected
- [ ] Batch filter works

### Signature
- [ ] Signature displays correctly in request details
- [ ] Signature parsing handles base64 JSON format
- [ ] Missing signatures handled gracefully

### Status Values
- [ ] All status values match standard
- [ ] `in_progress` mapped to `released`
- [ ] Status filtering works correctly

### Metadata Fields
- [ ] `processedAt` and `processedBy` set on approve/reject
- [ ] `releasedAt` and `releasedBy` set on release
- [ ] `updatedAt` set on all updates

---

## 📝 Implementation Notes

1. **Backward Compatibility**: Handle existing requests that may not have new fields
2. **Error Handling**: Handle null/undefined `quantity_borrowed` gracefully
3. **Validation**: Ensure `quantity_borrowed <= quantity` at all times
4. **Performance**: Consider batch updates for multiple equipment items
5. **UI/UX**: Add loading states and error messages for all operations

---

## 🔗 Files to Modify

### Primary Files:
- `src/components/RequestFormsPage.jsx` - Main request management
- `src/components/EquipmentPage.jsx` - Equipment listings
- `src/components/HistoryPage.jsx` - Return processing

### Supporting Files (if needed):
- `src/utils/equipmentUtils.js` - Quantity calculation helpers
- `src/utils/signatureUtils.js` - Signature parsing/rendering
- `src/CSS/RequestFormsPage.css` - Batch UI styles

---

**Last Updated:** 2024-11-10  
**Status:** Ready for Implementation

