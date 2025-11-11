// /pages/api/auth/send-otp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import { userOperations } from "../../../lib/database";
import { redis } from "../../../lib/redis"; // ✅ use redis instead of Map

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // ✅ 1. Check if user already exists
    const existingUser = await userOperations.findByEmail(email);
    console.log(`existingUser ${JSON.stringify(existingUser)}`);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
      });
    }

    // ✅ 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis with 5-minute TTL
    await redis.set(`otp:${email}`, otp, "EX", 300); // 300 seconds = 5 min
    console.log(`Generated OTP for ${email}: ${otp}`);
    console.log(`process.env.NEXT_PUBLIC_SMTP_USER ${process.env.NEXT_PUBLIC_SMTP_USER} process.env.NEXT_PUBLIC_SMTP_USER${process.env.NEXT_PUBLIC_SMTP_USER}`)
    // ✅ 3. Send OTP email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NEXT_PUBLIC_SMTP_USER,
        pass: process.env.NEXT_PUBLIC_SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Lync Bot" <${process.env.NEXT_PUBLIC_SMTP_USER}>`,
      to: email,
      subject: "Your OTP for Account Verification",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
      html: `<h3>Your OTP is: <b>${otp}</b></h3><p>It expires in 5 minutes.</p>`,
    });

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
}
