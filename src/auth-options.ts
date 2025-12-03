import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./utils/prisma-client";
import bcrypt from "bcrypt";
import CustomError from "./utils/custom-error";

const authOptions = {
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "" },
        password: { label: "Password", type: "password" },
        selectedRoleId: { label: "Selected Role ID", type: "text" },
      },
      async authorize(credentials, req) {
        try {
          if (!(credentials && credentials.username && credentials.password)) {
            throw new CustomError("Username and password are required", 400);
          }
          
          // Find user by email or username
          const { hashedPassword, ...user }: any = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.username },
                { username: credentials.username }
              ],
              isActive: true
            },
            include: {
              roles: {
                include: {
                  role: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          });
          
          if (!user || !user.isActive) {
            throw new CustomError("User not found or inactive", 401);
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
          
          // Include both role names and full role data (including UserRole IDs and verification status)
          return {
            ...user,
            roles: user.roles.map((role: any) => role.role.name),
            userRoles: user.roles.map((role: any) => ({
              userRoleId: role.id, // This is the UserRole ID
              roleId: role.role.id,
              roleName: role.role.name,
              isRoleVerified: role.isRoleVerified, // ✅ ADDED: Include verification status
              roleVerifiedAt: role.roleVerifiedAt, // ✅ ADDED: Include verification timestamp
            })),
            selectedRoleId: credentials.selectedRoleId || null,
          };
        } catch (error: any) {
          console.log("authorize error", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }: any) {
      return true;
    },
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token }: any) {
      if (token) {
        [
          "id", 
          "username", 
          "roles", 
          "userRoles",
          "firstName", 
          "middleName", 
          "lastName",
          "selectedRole",
          "selectedUserRoleId"
        ].forEach((key) => {
          session.user[key] = token[key];
        });
      }
      return session;
    },
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        [
          "id", 
          "username", 
          "roles", 
          "userRoles",
          "firstName", 
          "middleName", 
          "lastName"
        ].forEach((key) => {
          token[key] = user[key];
        });
        
        // Set selected role if provided during login
        if (user.selectedRoleId) {
          const selectedUserRole = user.userRoles.find(
            (ur: any) => ur.userRoleId === user.selectedRoleId
          );
          if (selectedUserRole) {
            token.selectedRole = selectedUserRole.roleName;
            token.selectedUserRoleId = selectedUserRole.userRoleId;
          }
        }
      }
      
      // Handle session updates (when role is changed)
      if (trigger === "update" && session) {
        if (session.selectedRole) {
          token.selectedRole = session.selectedRole;
          token.selectedUserRoleId = session.selectedUserRoleId;
        }
      }
      
      return token;
    },
  },
};

export default authOptions;