import request from "supertest";
import app from "../libs/api/src/app";
import { prisma } from "../libs/db/src/index.ts";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

beforeAll(async () => {
  // Ensure test DB is on the latest schema
  // (fastest path: reset; or use migrate deploy if you want to keep data)
  await prisma.$disconnect(); // safety if something has a stale connection
  process.env.NODE_ENV = "test";
  // run a reset via Prisma CLI if you prefer (but that needs a child_process)
  // here we'll just ensure the client connects which implies DATABASE_URL is right
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("FS routes", () => {
  it("creates folder at root", async () => {
    const res = await request(app)
      .post("/api/fs/folder")
      .send({ name: "Music", parentId: null })
      .set("Content-Type", "application/json");
    expect(res.status).toBe(201);
    expect(res.body?.node?.name).toBe("Music");
    expect(res.body?.node?.id).toMatch(/[a-f0-9-]{36}/);
  });

  it("lists root and sees our folder", async () => {
    const res = await request(app).get("/api/fs/list");
    expect(res.status).toBe(200);
    const names = (res.body.items ?? []).map((n: any) => n.name);
    expect(names).toContain("Music");
  });

  it("renames a folder", async () => {
    // create a folder, then rename it
    const created = await request(app)
      .post("/api/fs/folder")
      .send({ name: "Projects", parentId: null })
      .set("Content-Type", "application/json");
    const id = created.body.node.id;

    const renamed = await request(app)
      .patch(`/api/fs/node/${id}/rename`)
      .send({ name: "Projects (Renamed)" })
      .set("Content-Type", "application/json");
    expect(renamed.status).toBe(200);
    expect(renamed.body.node.name).toBe("Projects (Renamed)");
  });

  it("moves a node under another parent", async () => {
    const parent = await request(app)
      .post("/api/fs/folder")
      .send({ name: "Parent", parentId: null })
      .set("Content-Type", "application/json");

    const child = await request(app)
      .post("/api/fs/folder")
      .send({ name: "Child", parentId: null })
      .set("Content-Type", "application/json");

    const move = await request(app)
      .post("/api/fs/move")
      .send({ ids: [child.body.node.id], toParentId: parent.body.node.id })
      .set("Content-Type", "application/json");

    expect(move.status).toBe(200);
    expect(move.body.moved).toBe(1);

    // verify list under parent shows child
    const list = await request(app)
      .get(`/api/fs/list`)
      .query({ parentId: parent.body.node.id });
    const names = (list.body.items ?? []).map((n: any) => n.name);
    expect(names).toContain("Child");
  });
});
