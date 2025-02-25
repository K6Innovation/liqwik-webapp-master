"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { HiBars3BottomRight } from "react-icons/hi2";
import { HiOutlineViewGrid, HiOutlineShoppingCart, HiOutlineUser, HiOutlineHome } from "react-icons/hi";
import { FiPlus } from "react-icons/fi";


type Props = {
  openNav: () => void;
};

function AppBar({ openNav }: Props) {
  const session: any = useSession();
  const userRoles = session?.data?.user?.roles || [];

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 w-full navbar bg-pink-700 text-white z-50">
        <div className="flex items-center h-full justify-between w-[90%] xl:w-[80%] mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            {session?.status === "authenticated" && (
              <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-pink-700" onClick={() => signOut()}>
                <span className="text-xs capitalize">{session?.data?.user?.username[0]}</span>
              </button>
            )}
            <h1 className="text-xl md:text-2xl font-bold">Liqwik</h1>
          </div>

          {/* Navigation Links */}
          <HiBars3BottomRight onClick={openNav} className="w-7 h-7 cursor-pointer text-white lg:hidden" />
        </div>
      </div>

      {/* Fixed Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 flex justify-around items-center border-t z-50">
        {/* Dashboard */}
        <Link href="/">
          <button className={`flex flex-col items-center text-gray-500 hover:text-pink-700`}>
            <HiOutlineViewGrid size={24} />
            <span className="text-xs">Dashboard</span>
          </button>
        </Link>

        {/* My Liqwick */}
        <Link href="/">
          <button className={`flex flex-col items-center text-gray-500 hover:text-pink-700`}>
            <HiOutlineHome size={24} />
            <span className="text-xs">My Liqwick</span>
          </button>
        </Link>

        {/* Floating Add Button */}
        
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white-700 text-white p-4 rounded-full shadow-lg">
            <div className="w-10 h-10 border-4 border-pink-700 bg-white rounded-full"></div>
            </div>
      

        {/* Marketplace */}
        <Link href="/">
          <button className={`flex flex-col items-center text-gray-500 hover:text-pink-700`}>
            <HiOutlineShoppingCart size={24} />
            <span className="text-xs">Marketplace</span>
          </button>
        </Link>

        {/* Profile */}
        <Link href="/">
          <button className={`flex flex-col items-center text-gray-500 hover:text-pink-700`}>
            <HiOutlineUser size={24} />
            <span className="text-xs">Profile</span>
          </button>
        </Link>
      </div>
    </>
  );
}

export default AppBar;
