import type { NextApiRequest, NextApiResponse } from "next";
import { userOperations } from "../../../lib/database";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const existingUser = await userOperations.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
      });
    }

    // Call NestJS backend to send OTP
    const nestUrl = process.env.NEST_API_URL || 'http://localhost:4000';
    const response = await fetch(`${nestUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
}
