import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { Resend as ResendClient } from "resend";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google,
    GitHub,
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_RESEND_FROM ?? "Marquee <onboarding@resend.dev>",
      async sendVerificationRequest({ identifier: to, url, provider }) {
        const resend = new ResendClient(provider.apiKey);
        const { host } = new URL(url);
        const { error } = await resend.emails.send({
          from: provider.from as string,
          to,
          subject: `Logga in på Marquee`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#131418; padding:32px; color:#f2f1ee;">
              <div style="max-width:420px; margin:0 auto; background:#1c1d22; border-radius:16px; padding:32px; border:1px solid #2c2d33;">
                <p style="font-family:Georgia, serif; font-style:italic; font-size:22px; margin:0 0 20px;">Marquee</p>
                <p style="font-size:15px; line-height:1.6; margin:0 0 24px; color:#c9c8c4;">
                  Klicka på knappen nedan för att logga in på <strong>${host}</strong>. Länken är giltig i 24 timmar.
                </p>
                <a href="${url}" style="display:inline-block; padding:13px 24px; border-radius:10px; background:#e3a752; color:#2b1c04; font-weight:700; text-decoration:none; font-size:14px;">
                  Logga in
                </a>
                <p style="font-size:12.5px; color:#8a8a86; margin:28px 0 0;">
                  Bad du inte om den här länken kan du ignorera det här mejlet.
                </p>
              </div>
            </div>
          `,
          text: `Logga in på Marquee: ${url} (giltig i 24 timmar)`,
        });
        if (error) throw new Error(`Resend kunde inte skicka mejlet: ${error.message}`);
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/kolla-mejlen",
  },
  callbacks: {
    // We use database sessions (default whenever an adapter is configured),
    // so `user` here is the row from the `user` table — expose its id on
    // the session so server code can scope queries to the signed-in user.
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
