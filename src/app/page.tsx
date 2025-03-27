"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

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

type EventDetail = {
  address: string;
  name: string;
  start: string;
  end: string;
  startSale: string;
  endSale: string;
  nftSymbol: string;
};

const contract = getContract({
  client,
  address: "0x10e296eAf59D063Ab26412892803A025d83a3D5B",
  chain: baseSepolia,
});

export default function HomePage() {
  const router = useRouter();
  const [eventDetails, setEventDetails] = useState<EventDetail[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);

  const { data, isLoading, error } = useReadContract({
    contract,
    method: "function getAllEvents() external view returns (address[] memory)",
  });

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (data) {
        const details = await Promise.all(
          data.map(async (eventAddress: string) => {
            const provider = new ethers.JsonRpcProvider(
              "https://base-sepolia.g.alchemy.com/v2/rUkR8zbPWCVxMa6moNb6PBmyHPlVj_6m"
            );
            const eventContract = new ethers.Contract(
              eventAddress,
              [
                {
                  inputs: [],
                  name: "eventName",
                  outputs: [
                    { internalType: "string", name: "", type: "string" },
                  ],
                  stateMutability: "view",
                  type: "function",
                },
                {
                  inputs: [],
                  name: "eventStart",
                  outputs: [
                    { internalType: "uint256", name: "", type: "uint256" },
                  ],
                  stateMutability: "view",
                  type: "function",
                },
                {
                  inputs: [],
                  name: "eventEnd",
                  outputs: [
                    { internalType: "uint256", name: "", type: "uint256" },
                  ],
                  stateMutability: "view",
                  type: "function",
                },
                {
                  inputs: [],
                  name: "eventTiketStartSale",
                  outputs: [
                    { internalType: "uint256", name: "", type: "uint256" },
                  ],
                  stateMutability: "view",
                  type: "function",
                },
                {
                  inputs: [],
                  name: "eventTiketEndSale",
                  outputs: [
                    { internalType: "uint256", name: "", type: "uint256" },
                  ],
                  stateMutability: "view",
                  type: "function",
                },
                {
                  inputs: [],
                  name: "symbol",
                  outputs: [
                    { internalType: "string", name: "", type: "string" },
                  ],
                  stateMutability: "view",
                  type: "function",
                },
              ],
              provider
            );

            try {
              const name = await eventContract.eventName();
              const start = await eventContract.eventStart();
              const end = await eventContract.eventEnd();
              const startSale = await eventContract.eventTiketStartSale();
              const endSale = await eventContract.eventTiketEndSale();
              const nftSymbol = await eventContract.symbol();

              return {
                address: eventAddress,
                name: String(name),
                start: new Date(Number(start) * 1000).toLocaleString(),
                end: new Date(Number(end) * 1000).toLocaleString(),
                startSale: new Date(Number(startSale) * 1000).toLocaleString(),
                endSale: new Date(Number(endSale) * 1000).toLocaleString(),
                nftSymbol: String(nftSymbol),
              };
            } catch (err) {
              console.error(`Error fetching details for ${eventAddress}:`, err);
              return null;
            }
          })
        );

        // Filter out any null responses
        const filteredDetails = details.filter(
          (detail) => detail !== null
        ) as EventDetail[];
        // Reverse the array so that the latest created event appears first
        setEventDetails(filteredDetails.reverse());
      }
    };

    fetchEventDetails();
  }, [data]);

  if (error) {
    console.error("Error reading contract:", error);
  }

  const showMoreEvents = () => {
    setVisibleCount((prevCount) => prevCount + 8);
  };

  return (
    <main>
      <div className="justify-center flex flex-col items-center mb-12 mt-4">
        <h2 className="text-xl text-bold mb-2">Connect your wallet</h2>
        <ConnectButton client={client} />
      </div>

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
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {eventDetails.slice(0, visibleCount).map((event, index) => (
              <Card key={index} className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription>
                    <p>Symbol: {event.nftSymbol}</p>
                    <p>Start: {event.start}</p>
                    <p>End: {event.end}</p>
                    <p>Sale Start: {event.startSale}</p>
                    <p>Sale End: {event.endSale}</p>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline">View Details</Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {visibleCount < eventDetails.length && (
            <div className="mt-7 flex justify-center">
              <Button onClick={showMoreEvents} variant="link">
                Show more events
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
