/**
 * API Route Handler Integration/Unit Tests
 * Reference: plan.md §12
 */

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { GET as getCustomersHandler } from "@/app/api/customers/route";
import { GET as getCustomerDetailHandler } from "@/app/api/customers/[id]/route";

describe("API Security & Handlers", () => {
  it("rejects invalid login credentials without leaking info", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "nonexistent.user",
        password: "wrongpassword",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Invalid username or password");
  });

  it("authenticates valid seed user and sets session cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "priya.matchmaker",
        password: "demo123",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.displayName).toBe("Priya Sharma");

    // Check session cookie set
    const cookieHeader = res.headers.get("set-cookie");
    expect(cookieHeader).toContain("matchmaker_session=");
  });

  it("unauthenticated request to /api/customers is rejected with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/customers");
    const res = await getCustomersHandler(req);
    expect(res.status).toBe(401);
  });

  it("unauthenticated request to /api/customers/[id] is rejected with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/customers/sample-id");
    const res = await getCustomerDetailHandler(req, {
      params: Promise.resolve({ id: "sample-id" }),
    });
    expect(res.status).toBe(401);
  });
});
