# Tasks: Real-time Chat Interface (Improved and Refined)

**Input**: Design documents from `/specs/002-overall-goal-the/`
**Prerequisites**: plan.md (required), research.md, data-model.md, quickstart.md

## Phase 3.1: Setup, Contracts, and Database
- [x] T001 **[P]** Install backend dependencies: `pip install -r backend/requirements.txt`.
- [x] T002 **[P]** Activate backend virtual environment: `source backend/venv/bin/activate`.
- [x] T003 **[P]** Define OpenAPI specification for chat endpoints in `specs/002-overall-goal-the/contracts/openapi.yml`.
- [x] T004 Create Alembic migration for chat tables in `backend/alembic/versions/`.
- [x] T005 Apply the database migration: `alembic upgrade head`.
- [x] T006 **[P]** Define Pydantic models for `Message`, `Reaction`, and `Attachment` in `backend/app/schemas/chat.py`.

## Phase 3.2: Backend TDD - Authentication & Core Services
- [x] T007 **[P]** Write failing unit test for WebSocket authentication in `backend/tests/unit/test_chat_auth.py`.
- [x] T008 Implement dependency for authenticating users for WebSocket connections in `backend/app/dependencies.py`.
- [x] T009 Create a WebSocket manager and a protected endpoint at `/ws/chat/{conversation_id}`.
- [x] T010 **[P]** Write failing unit test for `get_message_history` service.
- [x] T011 Implement `get_message_history` service and API endpoint.
- [x] T012 **[P]** Write failing unit test for `send_message` service.
- [x] T013 Implement `send_message` logic and broadcast via WebSocket.
- [x] T014 **[P]** Write failing unit test for `add_reaction` service.
- [x] T015 Implement `add_reaction` logic and broadcast.
- [x] T016 **[P]** Write failing unit test for file upload service.
- [x] T017 Implement file upload endpoint and service logic.
- [x] T018 Implement typing indicator and presence logic in the WebSocket manager.

## Phase 3.3: Frontend Integration (TDD)
- [x] T019 **[P]** Write failing test for WebSocket connection service in `src/lib/websocket.test.ts`.
- [x] T020 Implement WebSocket service in `src/lib/websocket.ts` to handle connection and message passing.
- [ ] T021 **[P]** Write failing test for fetching message history in `src/app/(app)/partner/page.test.tsx`.
- [ ] T022 **Wire up** the existing UI in `src/app/(app)/partner/page.tsx` to fetch and display chat history.
- [ ] T023 **Connect** the chat input UI to send messages via the WebSocket service.
- [ ] T024 **Connect** the UI to display typing indicators and presence updates received from the WebSocket.
- [ ] T025 **Wire up** the reaction UI to send and display reactions.
- [ ] T026 **Integrate** the file upload UI with the backend API and render the returned media previews.
- [ ] T027 **[P]** Address and implement any UI gaps or adjustments needed for the chat feature, ensuring consistency with the existing design system.

## Phase 3.4: Integration and End-to-End Testing
- [ ] T028 **[P]** Write integration tests for the full chat feature in `tests/integration/test_chat.py` based on the scenarios in `quickstart.md`.

## Phase 3.5: Polish and Documentation
- [ ] T029 Implement comprehensive error handling for all backend services and endpoints.
- [ ] T030 Implement frontend error handling for WebSocket disconnects and API failures.
- [ ] T031 **[P]** Update project documentation for the new chat API and WebSocket protocol.

## Dependencies
- **Phase 3.1** is the prerequisite for all subsequent phases.
- **TDD Cycles**: For each feature, the test task must be completed before the corresponding implementation task.
- **Backend before Frontend**: Backend services should be implemented and tested before the frontend UI is fully integrated.

## Parallel Example
```
# After Phase 3.1 is complete, the following TDD cycles can start in parallel:
Task: "T007 [P] Write failing unit test for WebSocket authentication..."
Task: "T010 [P] Write failing unit test for get_message_history service..."
Task: "T019 [P] Write failing test for WebSocket connection service..."
```
