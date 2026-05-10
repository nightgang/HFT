# HFT Backend — Advanced Features DB/Service/Routes/Test Rollout

## Plan
1. Add new migration(s) to create missing DB tables for advanced feature models/services.
2. Align model SQL + fix any model bugs to match the new schema.
3. Verify/complete API routes for each feature.
4. Update DI wiring in `backend/index.js` if any services are missing.
5. Implement comprehensive tests (migration + model CRUD + route smoke tests).

## Progress
- [x] Step 1: Create migration 007 (advanced features schema)
- [ ] Step 2: Align models to schema (incl. any SQL bugs)
- [ ] Step 3: Verify/complete routes
- [ ] Step 4: Verify DI wiring
- [ ] Step 5: Add/extend Jest tests

