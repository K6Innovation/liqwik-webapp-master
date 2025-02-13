import getSession from "./get-session";

export default async function isAdmin() {
  const session = await getSession();
  return session?.user?.roles?.includes("admin");
}
