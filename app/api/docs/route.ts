import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.3",
    info: {
      title: "BuildTrack: Construction Project Intelligence API",
      version: "1.0.0",
      description:
        "High-performance REST API for enterprise civil engineering and infrastructure projects.",
    },
    servers: [{ url: "/api/v1", description: "V1 Endpoints" }],
    paths: {
      "/auth/register": {
        post: {
          summary: "Register new operator credential",
          responses: { "201": { description: "User registered" } },
        },
      },
      "/projects": {
        get: {
          summary: "List all construction projects with rollup progress",
          parameters: [
            { name: "page", in: "query" },
            { name: "pageSize", in: "query" },
            { name: "q", in: "query" },
            { name: "status", in: "query" },
          ],
          responses: { "200": { description: "Project list" } },
        },
        post: {
          summary: "Create new infrastructure project",
          responses: { "201": { description: "Project created" } },
        },
      },
      "/tasks": {
        get: {
          summary: "List tasks with dependency status and overdue detection",
          responses: { "200": { description: "Tasks list" } },
        },
        post: {
          summary: "Create task with dependency cycle check",
          responses: { "201": { description: "Task created" } },
        },
      },
      "/tasks/{id}/transition": {
        post: {
          summary: "Execute atomic task status transition with prerequisite validation",
          responses: {
            "200": { description: "Transition completed" },
            "409": { description: "Blocked by incomplete prerequisites" },
          },
        },
      },
      "/budget": {
        get: { summary: "Retrieve project budget vs actual variance analysis" },
        post: { summary: "Update category budget allocation" },
      },
      "/expenses": {
        get: { summary: "List certified expense payment certificates" },
        post: { summary: "Record certified financial expense" },
      },
      "/materials": {
        get: { summary: "Material warehouse inventory levels" },
        post: { summary: "Catalog new material SKU" },
      },
      "/materials/{id}/issue": {
        post: {
          summary: "Issue material stock to site (Transactional check against available stock)",
          responses: {
            "200": { description: "Stock dispatched" },
            "409": { description: "Insufficient stock" },
          },
        },
      },
      "/material-requests/{id}/approve": {
        post: { summary: "Approve or fulfill material indent request" },
      },
      "/reports/financial/{projectId}": {
        get: { summary: "Generate certified PDF financial audit report" },
      },
      "/analytics/summary": {
        get: { summary: "Company-wide project intelligence aggregates and 3D skyline telemetry" },
      },
      "/notifications": {
        get: { summary: "List system alerts and notifications" },
        patch: { summary: "Mark notifications as read" },
      },
      "/activity-logs": {
        get: { summary: "Audit trail activity records" },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
