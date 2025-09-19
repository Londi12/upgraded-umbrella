import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!resend) {
      console.log("Support request received (email service not configured):", { name, email, subject, message });
      return NextResponse.json({ message: "Support request logged (configure email service to send emails)" });
    }

    await resend.emails.send({
      from: "info@cvkonnekt.com",
      to: "info@cvkonnekt.com",
      subject: `Support Request: ${subject}`,
      html: `
        <h1>Support Request</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    return NextResponse.json({ message: "Support request sent successfully" });
  } catch (error) {
    console.error("Error sending support request:", error);
    return NextResponse.json({ error: "Failed to send support request" }, { status: 500 });
  }
}
