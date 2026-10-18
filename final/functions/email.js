const FROM = "Canopy Commons <notifications@mail.dantam.app>";
const MAX_AGE_MS = 6 * 60 * 60 * 1000;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function validateRequest(request, createdAtMs, now = Date.now()) {
  if (
    !request ||
    !/^[a-z0-9-]{1,100}$/.test(request.activityId ?? "") ||
    !Number.isFinite(createdAtMs) ||
    createdAtMs > now + 60_000 ||
    now - createdAtMs > MAX_AGE_MS
  ) {
    throw new Error("Invalid or expired activity email request.");
  }
}

export function buildActivityEmail(user, activity) {
  if (user.disabled || !user.emailVerified || !EMAIL.test(user.email ?? "")) {
    throw new Error("A verified account email is required.");
  }
  const required = ["title", "suburb", "startsAt", "description"];
  for (const field of required) {
    if (
      typeof activity?.[field] !== "string" ||
      !activity[field].trim() ||
      activity[field].length > 10_000
    )
      throw new Error("Activity information is incomplete.");
  }
  const details = `Canopy Commons activity details\n\n${activity.title}\nDate: ${activity.startsAt}\nLocation: ${activity.suburb}\n\n${activity.description}\n\nThis is activity information, not a booking confirmation.\n`;
  return {
    from: FROM,
    // The address comes from the signed in account, not from the form.
    to: [user.email],
    subject: "Your Canopy Commons activity details",
    text: "You requested information about a Canopy Commons activity. Your activity details are attached as a text file. This email does not confirm a booking.",
    attachments: [
      {
        filename: "canopy-activity.txt",
        content: Buffer.from(details, "utf8").toString("base64"),
        content_type: "text/plain",
      },
    ],
  };
}

export async function sendActivityEmail(
  payload,
  requestKey,
  apiKey,
  fetchImpl = fetch,
) {
  if (!apiKey || !requestKey || requestKey.length > 256)
    throw new Error("Email delivery is not configured.");
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": requestKey,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    // Keep the provider reply and the address out of the error message.
    throw new Error(
      `Email provider rejected the request (${response.status}).`,
    );
  }
  const result = await response.json();
  if (typeof result.id !== "string" || !result.id)
    throw new Error("Email provider did not acknowledge the message.");
  return result.id;
}
