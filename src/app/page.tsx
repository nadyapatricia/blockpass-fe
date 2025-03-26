"use client";

import { useRouter } from "next/navigation";

import { client } from "./client";

import { ConnectButton } from "thirdweb/react";
import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { useReadContract } from "thirdweb/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const contract = getContract({
  client,
  address: "0x10e296eAf59D063Ab26412892803A025d83a3D5B",
  chain: baseSepolia,
});

export default function HomePage() {
  const router = useRouter();

  const { data, isLoading, error } = useReadContract({
    contract,
    method: "function getAllEvents() external view returns (address[] memory)",
  });

  if (error) {
    console.error("Error reading contract:", error);
  }

  console.log(data, "getAllEvents");

  return (
    <main className="">
      <ConnectButton client={client} />

      {/* Search bar & Create button */}
      <div className="my-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <Input
          type="text"
          placeholder="Search events..."
          className="w-full max-w-sm"
        />
        <Button
          className="whitespace-nowrap"
          onClick={() => router.push("/create-event")}
        >
          Create Event
        </Button>
      </div>

      {isLoading ? (
        <p>Loading events..</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data?.map((event, index) => (
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle>{index}</CardTitle>
                <CardDescription>{event}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Replace with Next.js Link for dynamic routing, e.g., /events/[id] */}
                <Button variant="outline">View Details</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
