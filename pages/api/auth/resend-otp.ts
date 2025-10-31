// /pages/api/auth/resend-otp.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from './send-otp'; // reuse existing OTP sender

export default handler;
