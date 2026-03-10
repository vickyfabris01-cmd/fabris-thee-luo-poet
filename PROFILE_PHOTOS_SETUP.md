# Profile Photos Table Setup

## Overview

Profile photos are now saved in a dedicated `profile_photos` table in Supabase. This allows storing multiple profile photos with an active flag so admins can manage photo history and toggle between saved photos.

## Database Schema

### Create the `profile_photos` table in Supabase SQL:

```sql
create table profile_photos (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  active boolean default false,
  created_at timestamp with time zone default now(),

  constraint unique_active_photo unique (active) where active = true
);

-- Create index for faster queries
create index on profile_photos(active);
create index on profile_photos(created_at);
```

## Features

1. **Profile Photo Upload**
   - When a user uploads a photo in Dashboard Settings, it's automatically saved to Supabase storage and the `profile_photos` table
   - New uploads automatically become active (all previous photos set to inactive)
   - Stores: `user_id`, `image_url` (from storage), `active` (boolean), `created_at` (timestamp)

2. **Photo History Management**
   - Users can view all their uploaded photos in Settings page
   - Each photo shows upload date and active status indicator
   - Admin can toggle any photo to be active with one click

3. **Home Page Display**
   - The active profile photo is automatically fetched and displayed on the Homepage
   - Only authenticated users' photos are shown
   - Falls back gracefully if no photo is set

4. **Backward Compatibility**
   - Photos are still stored in the `profiles` table `photo_history` field for backward compatibility
   - New photos are saved to both tables automatically

## How It Works

### Upload Flow (Settings Page)

1. User uploads image → Gets cropped
2. File uploaded to Supabase storage at `media/profile-photos/`
3. Record inserted into `profile_photos` table with:
   - `user_id`: From auth context
   - `image_url`: Storage URL
   - `created_at`: Current timestamp
   - `active`: true
4. All other photos for this user set to `active: false`
5. Profile updated with new photo (backward compatibility)

### Display Flow (Home Page)

1. Component gets `user.id` from auth context
2. Calls `getActiveProfilePhoto(user_id)`
3. Fetches latest record where `user_id` = user.id AND `active` = true
4. Displays `image_url` in profile section

### Toggle Active Photo Flow (Settings - Photo History)

1. Admin clicks "Set as Active" on a previous photo
2. Record with matching `image_url` found in `profile_photos`
3. All OTHER photos for user set to `active: false`
4. Selected photo set to `active: true`
5. UI updates to show which photo is active

## Database Queries Used

### In `src/lib/db.js`

- `getActiveProfilePhoto(userId)` - Fetches the active profile photo for a user
- `getUserProfilePhotos(userId)` - Fetches all profile photos for a user (newest first)

### Used in Settings and Home:

- `insertRecord('profile_photos', {...})` - Save new photo record
- `updateRecord('profile_photos', photoId, {...})` - Update active status

## Files Modified

1. **src/lib/db.js**
   - Added `getActiveProfilePhoto(userId)` - Fetch active photo
   - Added `getUserProfilePhotos(userId)` - Fetch all photos

2. **src/pages/dashboard/Settings.jsx**
   - Modified `handleCropComplete()` - Now saves to `profile_photos` table
   - Modified `handleMakeLive()` - Now toggles `active` status in `profile_photos` table
   - Imports `supabase` directly for user_id queries
   - Imports `deleteRecord` from db.js

3. **src/pages/Home.jsx**
   - Imports `getActiveProfilePhoto` from db.js
   - Added `useAuth()` hook to get user.id
   - Added `useEffect` to fetch active profile photo on load
   - Added Profile Photo section displaying the active photo

## Testing Checklist

- [ ] Create `profile_photos` table in Supabase using SQL above
- [ ] Upload a profile photo in Dashboard Settings
- [ ] Verify photo appears on Home page when logged in
- [ ] Upload another profile photo
- [ ] Verify both photos appear in Photo History
- [ ] Click "Set as Active" on first photo
- [ ] Verify Home page updates to show first photo
- [ ] Check Supabase: only one photo should have `active = true`
- [ ] Delete a photo from history
- [ ] Verify photo is removed and if it was active, next one becomes active
- [ ] Test without auth: profile section should not appear

## Notes

- Photos are stored in Supabase Storage under `media/profile-photos/`
- Only one photo per user can have `active = true` (enforced by unique constraint)
- Photos persist even after deletion from active status
- Admin can reactivate any previous photo from history at any time
