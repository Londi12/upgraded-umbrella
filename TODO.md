# Job Matching Fix & Improvement - Step-by-Step

## Current Status
✅ Plan approved  
✅ 1.1 fuse.js confirmed in package.json  
🔄 Phase 1: Fix crashes (exports + safe scoring)

## TODO Steps

### Phase 1: Fix 'Job matching failed' (2 files)
- [x] **1.1** package.json: fuse.js present ✅
- [x] **1.2** lib/sa-job-knowledgebase.ts exports OK ✅
- [ ] **1.3** app/api/ai-job-match/route.ts: Per-job try-catch + new scoreJobAgainstCV() 
- [ ] **1.4** Test: Upload CV → Match → No crash, see scores


### Phase 2: Improve Accuracy (1 file)
- [ ] **2.1** Enhance scoring: Synonyms, recency, fuzzy location
- [ ] **2.2** Test 5 CV-job pairs for realistic scores

### Phase 3: Deploy
- [ ] **3.1** `npm run build`
- [ ] **3.2** `git commit/push` → Vercel deploy
- [ ] **3.3** Monitor logs, live test

**Next Step:** Fix sa-job-knowledgebase.ts exports + robust detectJobFamily


