"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Header from "@/components/ui/header";

// Example placeholder event data
const events = [
  { id: 1, title: "Blockchain Summit", desc: "Learn about blockchain tech" },
  { id: 2, title: "Crypto Expo", desc: "The biggest crypto event in town" },
  { id: 3, title: "NFT Meetup", desc: "All about NFTs and digital art" },
  { id: 4, title: "Web3 Conference", desc: "Decentralized future is here" },
  { id: 5, title: "Dev meetup", desc: "Dinner and chit-chat sesh for devs" },
  { id: 6, title: "Hackaton 2025", desc: "Biggest Hackaton for Solidity devs" },
];

export default function HomePage() {
  return (
    <main className="container mx-auto p-4">
      <Header />

      {/* Search bar & Create button */}
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <Input
          type="text"
          placeholder="Search events..."
          className="w-full max-w-sm"
        />
        <Button className="whitespace-nowrap">Create Event</Button>
      </div>

      {/* Events grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {events.map((event) => (
          <Card key={event.id} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              <CardDescription>{event.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Replace with Next.js Link for dynamic routing, e.g., /events/[id] */}
              <Button variant="outline">View Details</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
