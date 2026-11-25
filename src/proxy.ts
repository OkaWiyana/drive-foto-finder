import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isMaintenanceMode =
    process.env.MAINTENANCE_MODE?.trim().toLowerCase() === "true";

  if (!isMaintenanceMode) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Layanan sedang dalam pemeliharaan sementara. Silakan coba lagi nanti.",
      },
      {
        status: 503,
        headers: {
          "Retry-After": "300",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  const maintenanceUrl = new URL("/maintenance", request.url);
  return NextResponse.rewrite(maintenanceUrl, {
    status: 503,
    headers: {
      "Retry-After": "300",
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|models/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
