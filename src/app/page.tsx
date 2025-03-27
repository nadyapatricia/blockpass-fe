"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ethers } from "ethers"; // Import ethers
import { useToast } from "@/hooks/use-toast";

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
  ticketTypes: { type: string; price: string }[]; // Add ticketTypes
};

const contract = getContract({
  client,
  address: "0xe17E3F83652E82Bc99c3ed825DD62fc455a0F4cc",
  chain: baseSepolia,
});

export default function HomePage() {
  const router = useRouter();
  const [eventDetails, setEventDetails] = useState<EventDetail[]>([]);
  const { data, isLoading, error } = useReadContract({
    contract,
    method: "function getAllEvents() external view returns (address[] memory)",
  });
  const { toast } = useToast();

  const handleMintTicket = async (eventAddress: string, ticketType: string) => {
    try {
      if (!window.ethereum) {
        throw new Error(
          "Ethereum provider not found. Please install MetaMask."
        );
      }

      // Initialize ethers.js provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // USDC token contract address (replace with the actual USDC token address)
      const usdcTokenAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // USDC on Base Sepolia Testnet
      const usdcToken = new ethers.Contract(
        usdcTokenAddress,
        [
          {
            inputs: [
              { internalType: "address", name: "spender", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" },
            ],
            name: "approve",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        signer
      );

      // Approve the event contract to spend the required amount of USDC
      const ticketPrice = ethers.parseUnits("100", 6); // Replace "100" with the actual ticket price in USDC
      const approveTx = await usdcToken.approve(eventAddress, ticketPrice);

      // Wait for the approval transaction to be mined
      await approveTx.wait();
      console.log("USDC approved successfully!");

      // Initialize the event contract
      const eventContract = new ethers.Contract(
        eventAddress,
        [
          {
            inputs: [
              { internalType: "string", name: "_ticketType", type: "string" },
            ],
            name: "mintTicket",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: "address",
                name: "buyer",
                type: "address",
              },
              {
                indexed: false,
                internalType: "string",
                name: "ticketType",
                type: "string",
              },
              {
                indexed: false,
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
              },
            ],
            name: "TicketMinted",
            type: "event",
          },
        ],
        signer
      );

      // Listen for the TicketMinted event
      eventContract.on("TicketMinted", (buyer, ticketType, tokenId) => {
        console.log("TicketMinted event:", { buyer, ticketType, tokenId });

        // Show a toast notification when the event is emitted
        toast({
          title: "Ticket Minted!",
          description: `You successfully minted a ${ticketType} ticket. Token ID: ${tokenId}`,
          duration: 10000,
        });

        // Remove the event listener after it's triggered
        eventContract.removeAllListeners("TicketMinted");
      });

      // Call the mintTicket function
      const tx = await eventContract.mintTicket(ticketType);

      // Wait for the transaction to be mined
      await tx.wait();

      console.log("Ticket minted successfully!");

      toast({
        title: "Ticket Minted!",
        description: `You successfully minted a ${ticketType} ticket`,
        duration: 10000,
      });
    } catch (error) {
      console.error("Error minting ticket:", error);

      // Show an error toast
      toast({
        title: "Error",
        description: "Failed to mint the ticket. Please try again.",
        duration: 5000,
      });
    }
  };

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
                {
                  inputs: [],
                  name: "getAllTickets",
                  outputs: [
                    {
                      components: [
                        {
                          internalType: "string",
                          name: "ticketType",
                          type: "string",
                        },
                        {
                          internalType: "uint256",
                          name: "price",
                          type: "uint256",
                        },
                        {
                          internalType: "uint256",
                          name: "maxSupply",
                          type: "uint256",
                        },
                        {
                          internalType: "uint256",
                          name: "minted",
                          type: "uint256",
                        },
                      ],
                      internalType: "struct EventContract.Ticket[]",
                      name: "",
                      type: "tuple[]",
                    },
                  ],
                  stateMutability: "view",
                  type: "function",
                },
              ],
              provider
            );

            try {
              // Fetch event details
              const name = await eventContract.eventName();
              const start = await eventContract.eventStart();
              const end = await eventContract.eventEnd();
              const startSale = await eventContract.eventTiketStartSale();
              const endSale = await eventContract.eventTiketEndSale();
              const nftSymbol = await eventContract.symbol();

              // Fetch ticket details using getAllTickets
              const tickets = await eventContract.getAllTickets();
              console.log("Raw Ticket Details:", tickets);

              // Map ticket details
              const ticketTypes = tickets.map((ticket: any) => ({
                type: ticket.ticketType,
                price: ethers.formatUnits(ticket.price, 6), // Format price from smallest unit
              }));

              return {
                address: eventAddress,
                name: String(name),
                start: new Date(Number(start) * 1000).toLocaleString(),
                end: new Date(Number(end) * 1000).toLocaleString(),
                startSale: new Date(Number(startSale) * 1000).toLocaleString(),
                endSale: new Date(Number(endSale) * 1000).toLocaleString(),
                nftSymbol: String(nftSymbol),
                ticketTypes, // Include ticket types
              };
            } catch (err) {
              console.error(`Error fetching details for ${eventAddress}:`, err);
              return null;
            }
          })
        );

        setEventDetails(
          details.filter((detail) => detail !== null) as EventDetail[]
        );
      }
    };

    fetchEventDetails();
  }, [data]);

  if (error) {
    console.error("Error reading contract:", error);
  }

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
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {eventDetails.map((event, index) => (
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
                {event.ticketTypes.map((ticket, idx) => (
                  <div key={idx} className="mb-4">
                    <p>
                      Ticket Type: {ticket.type} - Price: {ticket.price} USDC
                    </p>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleMintTicket(event.address, ticket.type)
                      }
                    >
                      Mint {ticket.type} Ticket
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
