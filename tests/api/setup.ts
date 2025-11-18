import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import express from 'express';
import { registerRoutes } from '../../server/routes';

afterEach(() => {
  cleanup();
});

// Create a local test app that registers routes without requiring auth so
// integration tests that call `request(server)` can exercise endpoints
// without attaching Authorization headers.
const app = express();
app.use(express.json());
await registerRoutes(app, { requireAuth: false });

export { app as server };
