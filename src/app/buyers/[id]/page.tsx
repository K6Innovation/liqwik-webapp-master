"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import BuyerDashboard from "@/app/components/buyer/dashboard";

export default function Home() {
  const session = useSession();
  const [user, setUser] = useState<any>();
  const [selectedRole, setSelectedRole] = useState<any>();
  const [data, setData] = useState<any>();

  if (session?.status === "unauthenticated") {
    const callbackUrl = window.location.href;
    redirect(`/api/auth/signin?callbackUrl=${encodeURI(callbackUrl)}`);
  }

  useEffect(() => {
    if (session?.status === "authenticated" && session?.data?.user) {
      setUser(session.data.user);
    }
  }, [session]);

  useEffect(() => {
    if (user?.roles) {
      const role = user.roles[0];
      setSelectedRole(role);
    }
  }, [user]);

  useEffect(() => {
    if (!selectedRole) return;
    const userId = user.id;
    const dataEndpoint = `/api/buyers/${userId}/assets`;
    (async () => {
      const data = await fetch(dataEndpoint).then((res) => res.json());
      setData(data);
    })();
  }, [selectedRole]);

  return (
    <>
      {session.status === "loading" ? (
        <div className="p-4 grid justify-items-center ...">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : selectedRole === "buyer" ? (
        <BuyerDashboard assets={data} />
      ) : (
        <div>Unknown View</div>
      )}
    </>
  );
}
