"use client";

import Link from "next/link";
import Image from "next/image";

import blockpassLogo from "@public/blockpass-logo.png";

export default function Header() {
  return (
    <header className="bg-white pb-5 flex justify-between items-center">
      {/* Left side: Logo */}
      <div className="flex items-center space-x-3">
        <Image
          src={blockpassLogo}
          alt="blockpass logo"
          width={250}
          height={90}
        />
      </div>

      {/* Right side: “My account” link */}
      <Link
        href="/my-account"
        className="text-bpGreen font-bold mr-6 text-lg hover:underline"
      >
        My account
      </Link>
    </header>
  );
}
