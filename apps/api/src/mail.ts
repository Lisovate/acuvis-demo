import type { FastifyBaseLogger } from "fastify";

// No email provider yet: invites are logged so they can be picked up in dev
// and from the server logs until we wire one in.
export async function sendInviteEmail(
  log: FastifyBaseLogger,
  invite: { email: string; workspaceName: string; url: string },
) {
  log.info(
    { to: invite.email, workspace: invite.workspaceName, acceptUrl: invite.url },
    "invite email queued",
  );
}
