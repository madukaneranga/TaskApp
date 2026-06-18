const SUPPORT_EMAIL_TO = "support@addlinq.com";
const SUPPORT_EMAIL_SUBJECT = "TaskAPP - Kushan";

interface ProblemReportEmailParams {
  title: string;
  description: string;
  reporterEmail: string;
  reporterUserCode: string;
  reportId: string;
}

export async function sendProblemReportEmail(
  params: ProblemReportEmailParams
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set; skipping problem report email");
    return { sent: false, error: "Email not configured" };
  }

  const from = process.env.SUPPORT_EMAIL_FROM;
  if (!from) {
    console.warn("SUPPORT_EMAIL_FROM not set; skipping problem report email");
    return { sent: false, error: "Email sender not configured" };
  }

  const body = [
    "New problem report",
    "",
    `Title: ${params.title}`,
    "",
    "Description:",
    params.description,
    "",
    `Reporter: ${params.reporterUserCode} (${params.reporterEmail})`,
    `Report ID: ${params.reportId}`,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [SUPPORT_EMAIL_TO],
      subject: SUPPORT_EMAIL_SUBJECT,
      text: body,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Failed to send problem report email:", err);
    return { sent: false, error: "Failed to send support email" };
  }

  return { sent: true };
}
