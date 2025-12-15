import NextAuth from "next-auth";
import authOptions from "@/auth-options";

const handlers = NextAuth(authOptions);

export { handlers as GET, handlers as POST};

// export async function GET(req: any, res: any) {
//   // Do whatever you want here, before the request is passed down to `NextAuth`
//   console.log("auth", req.method, req.url);
//   return await NextAuth(req, res, authOptions);
// }

// export async function POST(req: any, res: any) {
//   // Do whatever you want here, before the request is passed down to `NextAuth`
//   console.log("auth", req.method, req.url);
//   return await NextAuth(req, res, authOptions);
// }
