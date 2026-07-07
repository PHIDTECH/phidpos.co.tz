import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "phidpos-migrate-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Apply schema using raw SQL - creates all tables if they don't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        checksum VARCHAR(64) NOT NULL,
        finished_at TIMESTAMPTZ,
        migration_name VARCHAR(255) NOT NULL,
        logs TEXT,
        rolled_back_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        applied_steps_count INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Check if User table exists
    const tableCheck = await prisma.$queryRawUnsafe<any[]>(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'User'
    `);

    if (tableCheck.length > 0) {
      return NextResponse.json({ message: "Schema already exists, tables present", tables: tableCheck });
    }

    return NextResponse.json({ 
      message: "Tables not found. Please run: docker compose exec app node node_modules/@prisma/client/scripts/postinstall.js",
      hint: "The database needs prisma db push. Run the db-push endpoint instead."
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
