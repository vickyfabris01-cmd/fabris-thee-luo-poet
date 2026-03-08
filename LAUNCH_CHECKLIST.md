# Pre-Launch Checklist

**Last Updated:** February 3, 2026  
**Status:** ✅ Supabase Integration Complete

---

## ✅ Completed Tasks

### Backend Integration

- [x] Supabase project created
- [x] Database tables configured
- [x] Authentication provider set up
- [x] Real-time subscriptions enabled
- [x] CRUD operations implemented

### Frontend Migration

- [x] Public pages updated (Videos, Live, Invite)
- [x] Dashboard pages updated (Live, Invites)
- [x] Context provider configured
- [x] Error handling implemented
- [x] Loading states added

### Documentation

- [x] Copilot instructions updated
- [x] Integration guide created
- [x] Security audit completed
- [x] Setup documentation provided

### Code Quality

- [x] No linting errors
- [x] No missing imports
- [x] Proper error handling
- [x] Console logging in place

---

## 🔒 Security Checklist

- [ ] **Rotate Supabase credentials** (Keys are currently exposed locally)
  - Go to Supabase console → Settings → API
  - Regenerate anon key
  - Update `.env` file
- [ ] **Enable Row Level Security (RLS)**
  - Navigate to each table in Supabase
  - Enable RLS
  - Create appropriate policies for:
    - Authenticated users can read poems/videos
    - Only admin can modify poems/videos
    - Users can create invites
    - Users can create comments

- [ ] **Configure CORS** (if API exposed)
  - Set allowed origins in Supabase settings

---

## 🚀 Before First Deploy

### Environment Setup

- [ ] Create production Supabase project (separate from dev)
- [ ] Copy production URL and keys to `.env.production`
- [ ] Update deployment platform secrets

### Testing

- [ ] Test all public pages load data
- [ ] Test dashboard CRUD operations
- [ ] Test real-time updates (multi-tab)
- [ ] Test error states (bad credentials, network down)
- [ ] Test mobile responsiveness

### Database

- [ ] Seed initial data (poems, videos)
- [ ] Verify table constraints
- [ ] Test backup & recovery process

### Documentation

- [ ] Update README with setup instructions
- [ ] Create user guide for dashboard
- [ ] Document API changes

---

## 📋 Post-Launch Monitoring

### Performance

- [ ] Monitor Supabase query performance
- [ ] Check real-time subscription latency
- [ ] Review error logs daily

### Security

- [ ] Audit authentication logs
- [ ] Monitor for unusual API usage
- [ ] Check for data leaks

### User Experience

- [ ] Collect feedback on dashboard
- [ ] Monitor for broken features
- [ ] Track loading performance

---

## 🛠️ Maintenance Tasks

### Weekly

- [ ] Review error logs
- [ ] Backup Supabase database
- [ ] Check for security updates

### Monthly

- [ ] Analyze usage patterns
- [ ] Optimize slow queries
- [ ] Update dependencies

### Quarterly

- [ ] Performance review
- [ ] Security audit
- [ ] Architecture review

---

## 🔧 Common Operations

### Add a new table

1. Create table in Supabase SQL editor
2. Add `useSupabaseQuery('tableName')` in component
3. Implement CRUD functions if needed
4. Update context in Dashboard.jsx

### Add a new public page

1. Create component in `src/pages/`
2. Import necessary Supabase queries
3. Add route in `src/app/routes.jsx`
4. Ensure auth check if needed

### Rotate credentials

1. Go to Supabase Settings → API
2. Regenerate anon key
3. Update `.env` locally
4. Redeploy application

### Troubleshoot "No data" issue

1. Verify `.env` has correct URL/key
2. Check browser console for errors
3. Verify tables exist in Supabase
4. Check browser network tab
5. Call `refetch()` manually

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **Project Instructions:** See `COPILOT_INSTRUCTIONS.md`

---

## ⚠️ Known Limitations

1. **File Upload** - Not yet implemented
   - Use Supabase Storage when ready
   - Update `uploadMedia()` in Dashboard.jsx

2. **Offline Support** - Not yet implemented
   - Consider adding @react-query or redux-persist

3. **Notifications** - Not yet fully implemented
   - Set up webhook triggers for email

4. **RLS Policies** - Not yet configured
   - Enable in Supabase console before production

---

## 📚 Reference Files

- `INTEGRATION_COMPLETE.md` - Overview of all changes
- `SUPABASE_INTEGRATION.md` - Detailed architecture & patterns
- `SUPABASE_SETUP.md` - Database schema & setup
- `COPILOT_INSTRUCTIONS.md` - Developer guidelines
- `SECURITY_AUDIT.md` - Security status & recommendations

---

## ✅ Sign-Off

- **Supabase Integration:** Complete ✅
- **Code Quality:** Verified ✅
- **Documentation:** Complete ✅
- **Ready for Testing:** Yes ✅

**Next Step:** Begin pre-launch testing checklist
