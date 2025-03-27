"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CircleUserRound } from "lucide-react";
import blockpassLogo from "@public/blockpass-logo.png";

export default function Header() {
  const router = useRouter();

  return (
    <header className="bg-gradient-to-r from-[#9120AC] to-[#DE35A0] p-6 flex justify-between items-center">
      {/* Left side: Logo */}
      <div
        className="flex items-center space-x-3 hover:cursor-pointer"
        onClick={() => router.push("/")}
      >
        <Image
          src={blockpassLogo}
          alt="blockpass logo"
          width={200}
          height={90}
        />
      </div>

      {/* Right side: “My account” link with icon */}
      <Link
        href="/my-account"
        className="flex items-center text-white font-bold text-lg hover:underline"
      >
        <CircleUserRound className="w-7 h-7" />
        <span className="hidden md:inline ml-2">My account</span>
      </Link>
    </header>
  );
}
