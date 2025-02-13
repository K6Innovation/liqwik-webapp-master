import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./utils/prisma-client";
import bcrypt from "bcrypt";
import CustomError from "./utils/custom-error";

const authOptions = {
  sesssion: {
    strategy: "jwt",
  },
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: "Username", type: "text", placeholder: "" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          if (!(credentials && credentials.username && credentials.password)) {
            throw new CustomError("Username and password are required", 400);
          }
          const { hashedPassword, ...user }: any = await prisma.user.findUnique(
            {
              where: {
                username: credentials.username,
              },
              include: {
                roles: {
                  include: {
                    role: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            }
          );
          if (!user || !user.isActive) {
            throw new CustomError("User not found", 401);
          }
          if (!hashedPassword) {
            throw new CustomError("User has no password", 401);
          }
          const valid = await bcrypt.compare(
            credentials.password,
            hashedPassword
          );
          if (!valid) {
            throw new CustomError("Invalid password", 401);
          }
          return {
            ...user,
            roles: user.roles.map((role: any) => role.role.name),
          };
        } catch (error: any) {
          console.log("authorize error", error);
          return null;
          // throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }: any) {
      return true;
    },
    async redirect({ url, baseUrl }: any) {
      return url || baseUrl;
    },
    async session({ session, token }: any) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (token) {
        ["id", "username", "roles", "firstName", "middleName", "lastName"].forEach(
          (key) => {
            session.user[key] = token[key];
          }
        );
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        ["id", "username", "roles", "firstName", "middleName", "lastName"].forEach(
          (key) => {
            token[key] = user[key];
          }
        );
      }
      return token;
    },
  },
};

export default authOptions;
