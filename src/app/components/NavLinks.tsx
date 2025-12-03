import { HiOutlineScale, HiOutlineCog, HiOutlineLogout, HiOutlineSwitchHorizontal } from "react-icons/hi";
import { HiOutlineWallet } from "react-icons/hi2";

export const NavLinks = [
  {
    id: 1,
    href: (currentRole: string, userId: string) =>
      currentRole === "seller"
        ? `/sellers/${userId}/wallet`
        : `/buyers/${userId}/wallet`,
    label: "Wallet",
    icon: <HiOutlineWallet />,
  },
  {
    id: 2,
    href: "/settings",
    label: "Settings",
    icon: <HiOutlineCog />,
  },
  {
    id: 3,
    href: null,
    label: "Switch Role",
    icon: <HiOutlineSwitchHorizontal />,
    isSwitchRole: true,
  },
  {
    id: 4,
    href: null,
    label: "Sign Out",
    icon: <HiOutlineLogout />,
    isSignOut: true,
  },
];