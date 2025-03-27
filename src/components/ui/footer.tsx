"use client";

import { BookHeart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#9120AC] to-[#DE35A0] p-6 mt-4 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <BookHeart />
        <pre className="text-sm">
          Made by Kelompok 5 of Pelita Bangsa Academy C3
        </pre>
      </div>
      <div>
        <pre className="text-sm">Blockpass 2025</pre>
      </div>
    </footer>
  );
}
