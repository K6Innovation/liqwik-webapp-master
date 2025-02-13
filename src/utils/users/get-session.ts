import { getServerSession } from "next-auth";
import authOptions from "../../auth-options";

export default async function getSession() {
  return await getServerSession(authOptions);
}
