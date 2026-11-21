import { NextResponse } from "next/server";

import { requireVerifiedSenderSession } from "@/lib/auth/route-session";
import { getDb } from "@/lib/db/connection";
import { correctSentEnvelope, EnvelopeMutationError } from "@/lib/envelopes";
import { logRouteError } from "@/lib/security/logging";
import { getClientIpAddress, getRequestPathname } from "@/lib/security/request";

type EnvelopeEditRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: EnvelopeEditRouteContext,
) {
  const sessionResult = await requireVerifiedSenderSession(request);

  if (sessionResult instanceof Response) {
    return sessionResult;
  }

  const session = sessionResult;
  const { id } = await context.params;

  try {
    const result = await correctSentEnvelope(session.user.id, id, {
      actorEmail: session.user.email,
      database: getDb(),
      ipAddress: getClientIpAddress(request.headers),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof EnvelopeMutationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    logRouteError(error, {
      category: "envelope_edit_failure",
      ipAddress: getClientIpAddress(request.headers),
      message: "Unexpected failure while editing sent envelope.",
      path: getRequestPathname(request),
      userId: session.user.id,
    });

    return NextResponse.json(
      { error: "Unable to return this envelope to draft." },
      { status: 500 },
    );
  }
}
