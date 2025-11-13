# Mobile App & Web Admin Sync Requirements

## 📋 Overview

This document outlines the gaps and requirements for syncing the Flutter mobile app's borrowing functionality with the React web admin panel. The goal is to ensure both platforms work seamlessly together with consistent data structures and workflows.

## ✅ Mobile App - Completed Changes

**Status:** ✅ **ALL MOBILE APP TASKS COMPLETED** - Mobile app is fully synced with web admin requirements.

### Phase 1 - Completed Items:
1. ✅ **Laboratory Service** - Created `LaboratoryService` to fetch labs from Firebase `/laboratories`
2. ✅ **Form Updates** - Both single and batch forms now use `LaboratoryService` instead of hardcoded labs
3. ✅ **Request Data Structure** - Stores `labId`, `labRecordId`, and `laboratory` (display name)
4. ✅ **Quantity Management** - Removed `quantity_borrowed` increment on request creation (web admin handles it)
5. ✅ **Consistency** - Both forms use the same laboratory list from Firebase

### Phase 2 - Completed Items:
6. ✅ **BatchId Consistency** - Verified all items in batch share same `batchId`
7. ✅ **BatchSize Field** - Added `batchSize` field to all batch requests
8. ✅ **Available Quantity Display** - Shows `quantity - quantity_borrowed` in equipment listings with color coding
9. ✅ **Status Values** - Verified all match standard: `pending`, `approved`, `rejected`, `released`, `returned`
10. ✅ **Signature Format** - Properly base64-encoded JSON matching documented structure

**Files Modified:**
- `lib/home/service/laboratory_service.dart` (NEW)
- `lib/home/form_page.dart`
- `lib/home/batch_borrow_form_page.dart` (Updated: Added batchSize, verified batchId)
- `lib/home/widgets/form_sections.dart`
- `lib/home/service/form_service.dart`
- `lib/home/models/equipment_models.dart` (Updated: Added quantityBorrowed, availableQuantity)
- `lib/home/category_items_page.dart` (Updated: Display available quantity)
- `lib/home/widgets/signature_pad.dart` (Updated: Fixed signature encoding)

---

## 🔴 Critical Missing Features

### 1. **Quantity Borrowed Management** ⚠️ HIGH PRIORITY

**Current State:**
- ✅ Mobile app: Removed `quantity_borrowed` increment on request creation (COMPLETED)
- ❌ Mobile app does NOT decrement `quantity_borrowed` on return (not needed - web admin handles)
- ❌ Web admin does NOT handle `quantity_borrowed` at all (NEEDS IMPLEMENTATION)

**Required Actions:**

#### Web Admin Side (REMAINING WORK):
- [ ] Add `quantity_borrowed` field to equipment data model
- [ ] Display available quantity: `quantity - quantity_borrowed` in equipment listings
- [ ] On request **approval**: Increment `quantity_borrowed` by requested quantity
- [ ] On request **rejection**: Decrement `quantity_borrowed` if it was previously approved
- [ ] On request **return**: Decrement `quantity_borrowed` by returned quantity
- [ ] Prevent over-borrowing: Check `availableQuantity >= requestedQuantity` before approval

#### Mobile App Side:
- ✅ Remove `quantity_borrowed` increment from request creation (COMPLETED)
- ✅ Display available quantity from equipment data: `quantity - (quantity_borrowed || 0)` (COMPLETED)
  - Shows total and available quantity in equipment listings
  - Color coding: green if available, red if not available
  - Handles null/undefined `quantityBorrowed` gracefully

**Database Path:**
```
equipment_categories/{categoryId}/equipments/{itemId}/quantity_borrowed
```

---

### 2. **Batch Request Support** ⚠️ HIGH PRIORITY

**Current State:**
- ✅ Mobile app: Creates batch requests with shared `batchId` (COMPLETED)
- ✅ Mobile app: Added `batchSize` field to all batch requests (COMPLETED)
- ✅ Mobile app: Verified `batchId` consistency across all batch items (COMPLETED)
- ❌ Web admin: Does NOT display batch grouping (NEEDS IMPLEMENTATION)
- ❌ Web admin: Does NOT show batch relationships (NEEDS IMPLEMENTATION)

**Required Actions:**

#### Web Admin Side (REMAINING WORK):
- [ ] Add `batchId` field to request display
- [ ] Add `batchSize` field to request display
- [ ] Add batch grouping view: Group requests by `batchId`
- [ ] Add batch filter: "Show batch requests" / "Show individual requests"
- [ ] Batch actions: Approve/reject entire batch at once
- [ ] Display batch size: "Batch of {batchSize} items" badge
- [ ] Show batch members when viewing a batch request

#### Mobile App Side:
- ✅ Ensure `batchId` is consistently set for all items in a batch (COMPLETED)
- ✅ Added `batchSize` field to track total items in batch (COMPLETED)

**Database Field:**
```json
{
  "batchId": "batch-uuid-here",
  // ... other request fields
}
```

---

### 3. **Signature Display** ⚠️ MEDIUM PRIORITY

**Current State:**
- ✅ Mobile app: Stores signature as base64 JSON string (VERIFIED - matches documented format)
- ❌ Web admin: Does NOT display signature (NEEDS IMPLEMENTATION)

**Required Actions:**

#### Mobile App Side:
- ✅ Signature format verified (COMPLETED)
  - Base64-encoded JSON string
  - Structure: `{"points": [{"x": number, "y": number, "isNewStroke": boolean}], "strokeWidth": number}`
  - Properly encoded and ready for web admin parsing

#### Web Admin Side (REMAINING WORK):
- [ ] Add signature display in request details modal
- [ ] Parse base64 JSON signature format (decode base64, then parse JSON)
- [ ] Render signature using canvas or SVG
- [ ] Add "View Signature" button in request details

**Signature Format:**
```json
{
  "signature": "base64-encoded-json-string",
  // Decoded format:
  // {
  //   "points": [
  //     {"x": number, "y": number, "isNewStroke": boolean}
  //   ],
  //   "strokeWidth": number
  // }
}
```

---

### 4. **Status Field Consistency** ⚠️ MEDIUM PRIORITY

**Current State:**
- ✅ Mobile app: Uses standard values: `pending`, `approved`, `rejected`, `released`, `returned` (VERIFIED)
- ❌ Web admin: Uses `pending`, `approved`, `rejected`, `released`, `in_progress`, `returned` (NEEDS ALIGNMENT)

**Required Actions:**

#### Mobile App Side:
- ✅ Standardized status values verified (COMPLETED)
  - `pending` - Initial request
  - `approved` - Approved by admin/adviser
  - `rejected` - Rejected by admin/adviser
  - `released` - Item released for pickup
  - `returned` - Item returned
  - ✅ No `in_progress` or other non-standard values found

#### Web Admin Side (REMAINING WORK):
- [ ] Update status handling to match mobile app
- [ ] Remove `in_progress` status or map it to `released` for backward compatibility
- [ ] Ensure all status checks use standard values only

---

### 5. **Metadata Fields Consistency** ⚠️ MEDIUM PRIORITY

**Current State:**
- Mobile app sets: `processedAt`, `processedBy`
- Web admin sets: `updatedAt`, `reviewedBy`
- Mobile app expects: `releasedAt`, `releasedBy` (not implemented)

**Required Actions:**

#### Web Admin Side:
- [ ] Set `processedAt` and `processedBy` on approve/reject (in addition to `updatedAt`)
- [ ] Set `releasedAt` and `releasedBy` when status changes to `released`
- [ ] Keep `updatedAt` for general tracking

**Standard Fields:**
```json
{
  "processedAt": "2024-01-15T10:30:00.000Z",  // When approved/rejected
  "processedBy": "admin-user-id",             // Who approved/rejected
  "releasedAt": "2024-01-16T09:00:00.000Z",  // When released
  "releasedBy": "admin-user-id",              // Who released
  "returnedAt": "2024-01-20T14:00:00.000Z",  // When returned
  "updatedAt": "2024-01-20T14:00:00.000Z"    // Last update timestamp
}
```

---

### 6. **Laboratory Field Sync** ✅ COMPLETED

**Current State:**
- ✅ Mobile app: Uses `LaboratoryService` to fetch labs from Firebase (COMPLETED)
- ✅ Web admin: Uses dynamic labs from `/laboratories` collection
- ✅ Both forms use the same laboratory list (COMPLETED)

**Completed Actions:**

#### Mobile App Side (COMPLETED):
- ✅ Removed hardcoded laboratory dropdowns
- ✅ Created `LaboratoryService` to fetch from Firebase: `/laboratories`
- ✅ Displays `labName` from database
- ✅ Stores `labId` (e.g., "LAB001") in request
- ✅ Stores `labRecordId` (Firebase key) in request
- ✅ Uses same laboratory list for both single and batch forms
- ✅ Falls back to default labs if database is empty

#### Web Admin Side:
- ✅ Laboratory data is accessible to mobile app (already working)
- ✅ Laboratory filtering works with mobile app's lab assignments (already working)

**Request Structure:**
```json
{
  "laboratory": "Chemistry Laboratory",  // labName for display
  "labId": "LAB001",                     // Lab code
  "labRecordId": "-OdiENuWr_nd4YR0Mezz" // Firebase key
}
```

---

## 🟡 Enhancement Opportunities

### 7. **Request Details Display**

**Web Admin Should Show:**
- [ ] `itemNo` field (currently shown but verify it matches mobile format)
- [ ] `categoryName` (currently shown)
- [ ] `dateToBeUsed` and `dateToReturn` (currently shown)
- [ ] `adviserName` and `adviserId` (currently shown)
- [ ] Signature (missing - see #3)
- [ ] Batch information (missing - see #2)

### 8. **Notification Consistency**

**Verify Both Sides:**
- [ ] Notification structure matches
- [ ] Notification types are consistent
- [ ] Notification paths: `/notifications/{userId}` vs `/notifications/{userId}/{notificationId}`
- [ ] `isRead` field handling

**Current Notification Structure:**
```json
{
  "title": "Notification Title",
  "message": "Notification Message",
  "type": "info|success|error|warning",
  "timestamp": "2024-01-10T10:30:00.000Z",
  "isRead": false,
  "createdAt": "2024-01-10T10:30:00.000Z",
  "requestId": "optional",
  "itemName": "optional",
  "status": "optional"
}
```

### 9. **Request Filtering & Search**

**Web Admin Should Support:**
- [ ] Filter by `batchId` (to show batch requests)
- [ ] Filter by `adviserId` (currently filters by name)
- [ ] Filter by `labId` or `labRecordId` (currently filters by name)
- [ ] Search by `itemNo`
- [ ] Search by `batchId`

### 10. **Return Processing**

**Web Admin Current State:**
- ✅ Has return modal with condition, delay reason, notes
- ✅ Records return in history
- ❌ Does NOT update `quantity_borrowed` on return

**Required:**
- [ ] Decrement `quantity_borrowed` when processing return
- [ ] Update equipment status if all items returned
- [ ] Send notification to student on return processing

---

## 🔧 Implementation Checklist

### Phase 1: Critical Fixes

- [ ] **Quantity Borrowed Management** (WEB ADMIN - REMAINING)
  - [ ] Add `quantity_borrowed` field handling in web admin
  - [ ] Update quantity on approve/reject/return
  - [ ] Display available quantity
  - ✅ Mobile app: Removed increment on creation (COMPLETED)
  - ✅ Mobile app: Display available quantity (COMPLETED)

- [x] **Laboratory Sync** (COMPLETED)
  - [x] Update mobile app to fetch labs from Firebase
  - [x] Store `labId` and `labRecordId` in requests
  - [x] Remove hardcoded laboratory lists
  - [x] Create `LaboratoryService` for unified lab management

- [x] **Status Consistency** (MOBILE APP COMPLETED)
  - [x] Mobile app: Standardize status values (COMPLETED)
  - [x] Mobile app: Verified all status values match standard (COMPLETED)
  - [ ] Web admin: Update status handling to match mobile app (REMAINING)

### Phase 2: Batch Support

- [x] **Mobile App Batch Implementation** (COMPLETED)
  - [x] BatchId consistency verified (COMPLETED)
  - [x] BatchSize field added (COMPLETED)
- [ ] **Web Admin Batch Display** (REMAINING)
  - [ ] Add batch grouping in web admin
  - [ ] Add batch filter
  - [ ] Add batch actions
  - [ ] Display batchSize in UI

### Phase 3: Enhancements

- [x] **Mobile App Signature Format** (COMPLETED)
  - [x] Signature format verified - base64 JSON (COMPLETED)
- [ ] **Web Admin Signature Display** (REMAINING)
  - [ ] Parse and render signatures in web admin

- [ ] **Metadata Fields** (WEB ADMIN - REMAINING)
  - [ ] Add `processedAt`, `processedBy`, `releasedAt`, `releasedBy`

- [ ] **Enhanced Filtering**
  - [ ] Add batch and lab ID filters

---

## 📊 Database Schema Alignment

### Borrow Request Schema (Both Apps Should Use)

```json
{
  "requestId": "auto-generated-uuid",
  "userId": "student-user-id",
  "userEmail": "student@email.com",
  "itemId": "equipment-item-id",
  "categoryId": "category-id",
  "itemName": "Equipment Name",
  "categoryName": "Category Name",
  "itemNo": "LAB-XXXXX",
  "laboratory": "Laboratory Name",        // Display name
  "labId": "LAB001",                      // Lab code
  "labRecordId": "firebase-key",          // Firebase record ID
  "quantity": 1,
  "dateToBeUsed": "2024-01-15T00:00:00.000Z",
  "dateToReturn": "2024-01-20T00:00:00.000Z",
  "adviserName": "Teacher Name",
  "adviserId": "teacher-user-id",
  "status": "pending|approved|rejected|released|returned",
  "requestedAt": "2024-01-10T10:30:00.000Z",
  "signature": "optional-base64-json-signature",
  "batchId": "optional-batch-id",
  "batchSize": "optional-number-of-items-in-batch",
  "processedAt": "optional-iso-date",
  "processedBy": "optional-processor-user-id",
  "releasedAt": "optional-iso-date",
  "releasedBy": "optional-releaser-user-id",
  "returnedAt": "optional-iso-date",
  "updatedAt": "optional-iso-date"
}
```

### Equipment Schema (Add quantity_borrowed)

```json
{
  "id": "equipment-id",
  "name": "Equipment Name",
  "quantity": 10,
  "quantity_borrowed": 3,  // ADD THIS FIELD
  // ... other equipment fields
}
```

---

## 🧪 Testing Checklist

### Quantity Management
- [ ] Create request → `quantity_borrowed` increments
- [ ] Approve request → `quantity_borrowed` increments (if not already)
- [ ] Reject request → `quantity_borrowed` decrements (if was approved)
- [ ] Return item → `quantity_borrowed` decrements
- [ ] Available quantity = `quantity - quantity_borrowed`

### Batch Requests
- [x] Create batch → All items share same `batchId` (VERIFIED)
- [x] `batchSize` field is set correctly (VERIFIED)
- [ ] Web admin groups batch requests (NEEDS IMPLEMENTATION)
- [ ] Approve batch → All items in batch approved (NEEDS IMPLEMENTATION)
- [ ] Reject batch → All items in batch rejected (NEEDS IMPLEMENTATION)

### Laboratory Sync (COMPLETED)
- [x] Mobile app fetches labs from Firebase
- [x] Request stores correct `labId` and `labRecordId`
- [x] Web admin filters by lab correctly
- [x] Both single and batch forms use same lab list

### Status Flow
- [x] Mobile app uses standard status values (VERIFIED)
- [x] Status workflow verified: `pending` → `approved`/`rejected` → `released` → `returned` (VERIFIED)
- [ ] Web admin aligns status values (NEEDS IMPLEMENTATION)
- [ ] Status changes trigger correct notifications (VERIFIED in mobile app)

### Signature
- [x] Signature saved correctly in mobile app (VERIFIED)
- [x] Signature format is consistent - base64 JSON (VERIFIED)
- [ ] Signature displays correctly in web admin (NEEDS IMPLEMENTATION)

---

## 📝 Notes

1. **Backward Compatibility**: When updating fields, ensure existing requests still work
2. **Data Migration**: May need to migrate existing requests to include new fields
3. **Error Handling**: Handle cases where `quantity_borrowed` might be null/undefined
4. **Validation**: Validate that `quantity_borrowed <= quantity` at all times

---

## 🔗 Related Files

### Mobile App Files (ALL UPDATED - COMPLETE):
- ✅ `lib/home/service/laboratory_service.dart` - NEW: Laboratory service for Firebase integration
- ✅ `lib/home/form_page.dart` - UPDATED: Uses LaboratoryService instead of hardcoded labs
- ✅ `lib/home/batch_borrow_form_page.dart` - UPDATED: Uses LaboratoryService, added batchSize, verified batchId
- ✅ `lib/home/widgets/form_sections.dart` - UPDATED: Laboratory field integration
- ✅ `lib/home/service/form_service.dart` - UPDATED: Removed quantity_borrowed increment
- ✅ `lib/home/models/equipment_models.dart` - UPDATED: Added quantityBorrowed field and availableQuantity getter
- ✅ `lib/home/category_items_page.dart` - UPDATED: Display available quantity with color coding
- ✅ `lib/home/widgets/signature_pad.dart` - UPDATED: Fixed signature encoding to base64 JSON format
- `lib/home/borrowing_history_page.dart` - Return handling (no changes needed)

### Web Admin Files to Update:
- `src/components/RequestFormsPage.jsx` - Add batch support, quantity_borrowed, signature
- `src/components/HistoryPage.jsx` - Verify return handling
- `src/components/EquipmentPage.jsx` - Display available quantity

---

## 📊 Progress Summary

### ✅ Completed (Mobile App) - 100% COMPLETE
- ✅ Laboratory Service implementation
- ✅ Dynamic laboratory fetching from Firebase
- ✅ Request data structure with `labId`, `labRecordId`, `laboratory`
- ✅ Removed `quantity_borrowed` increment on creation
- ✅ Unified laboratory list for both forms
- ✅ BatchId consistency verified
- ✅ BatchSize field implemented
- ✅ Available quantity display with color coding
- ✅ Status values standardized and verified
- ✅ Signature format verified (base64 JSON)

### 🔄 Remaining Work (Web Admin Only)
- ❌ Quantity borrowed management (needs implementation)
- ❌ Batch request support (needs implementation)
- ❌ Signature display (needs implementation)
- ❌ Status consistency alignment (needs implementation)
- ❌ Metadata fields (`processedAt`, `processedBy`, etc.) (needs implementation)

### 📈 Overall Progress: ~60% Complete
- **Mobile App: 100% Complete** ✅
- **Web Admin: ~20% Complete** (All remaining work is on web admin side)

---

**Last Updated:** 2024-11-10  
**Status:** ✅ **Mobile App Fully Complete** - All web admin features pending implementation

