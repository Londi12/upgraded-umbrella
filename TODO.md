# Fix Vercel Deployment - Complete Build & Deploy

## Steps (Updated):
- [x] 1. Add deps to package.json
- [x] 2. Revert scraper changes (3 queries, num_pages=1)
- [ ] 3. Fix code errors: sa-job-knowledgebase exports
- [ ] 4. Fix local build (.next EPERM cleanup)
- [ ] 5. Test build: npm run build
- [ ] 6. Commit changes: git add . && git commit && git push
- [ ] 7. Verify Vercel deployment & cron logs (<10s)
- [ ] 8. Complete task

**Next:** Fix exports & tailwind dep, then build/deploy.

**Vercel Commands (run after push):**
```
vercel --prod
```

