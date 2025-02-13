import React from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

type Props = {};

function AppBar({}: Props) {
  const session: any = useSession();

  return (
    <div className="navbar bg-base-100 text-base-content">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost text-xl">
          Liqwik
        </Link>
      </div>
      {session?.status === "authenticated" ? (
        <button className="avatar placeholder" onClick={() => signOut()}>
          <div className="bg-neutral text-neutral-content rounded-full w-8">
            <span className="text-xs capitalize">
              {session?.data?.user?.username[0]}
            </span>
          </div>
        </button>
      ) : null}
    </div>
  );
}

export default AppBar;
