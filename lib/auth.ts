import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { parseSuperPerms, parseSitePerms } from "@/lib/permissions";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role        = (user as any).role;
        token.siteId      = (user as any).siteId;
        token.siteSlug    = (user as any).siteSlug;
        token.isMaster    = (user as any).isMaster;
        token.isOwner     = (user as any).isOwner;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role        = token.role;
        (session.user as any).id          = token.sub;
        (session.user as any).siteId      = token.siteId;
        (session.user as any).siteSlug    = token.siteSlug;
        (session.user as any).isMaster    = token.isMaster;
        (session.user as any).isOwner     = token.isOwner;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      id: "superadmin",
      name: "Super Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const admin = await prisma.superAdmin.findUnique({
          where: { email: credentials.email as string },
        });
        if (!admin) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          admin.password
        );
        if (!valid) return null;
        const perms = parseSuperPerms(admin.permissions, admin.isMaster);
        return { id: admin.id, email: admin.email, name: admin.name, role: "superadmin", isMaster: admin.isMaster, permissions: perms };
      },
    }),
    Credentials({
      id: "siteadmin",
      name: "Site Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        siteSlug: { label: "Site", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.siteSlug) return null;
        const site = await prisma.site.findUnique({
          where: { slug: credentials.siteSlug as string },
        });
        if (!site) return null;
        const admin = await prisma.siteAdmin.findUnique({
          where: { email_siteId: { email: credentials.email as string, siteId: site.id } },
        });
        if (!admin) return null;
        const valid = await bcrypt.compare(credentials.password as string, admin.password);
        if (!valid) return null;
        const perms = parseSitePerms(admin.permissions, admin.isOwner);
        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "siteadmin",
          siteId: site.id,
          siteSlug: site.slug,
          isOwner: admin.isOwner,
          permissions: perms,
        };
      },
    }),
    Credentials({
      id: "siteuser",
      name: "Site User",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        siteSlug: { label: "Site", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.siteSlug) return null;
        const site = await prisma.site.findUnique({
          where: { slug: credentials.siteSlug as string },
        });
        if (!site) return null;
        const user = await prisma.siteUser.findUnique({
          where: { email_siteId: { email: credentials.email as string, siteId: site.id } },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: "siteuser",
          siteId: site.id,
          siteSlug: site.slug,
        };
      },
    }),
  ],
});
