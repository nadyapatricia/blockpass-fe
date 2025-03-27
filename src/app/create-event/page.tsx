"use client";

import type React from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Upload, Plus, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import { ethers } from "ethers";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ToastAction } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MASTER_CONTRACT_ADDRESS = "0x10e296eaf59d063ab26412892803a025d83a3d5b"; // Replace with the actual address
const MASTER_CONTRACT_ABI: Array<{
  inputs?: Array<{
    internalType: string;
    name: string;
    type: string;
    indexed?: boolean;
  }>;
  name?: string;
  outputs?: Array<{ internalType: string; name: string; type: string }>;
  stateMutability?: string;
  type: string;
  anonymous?: boolean; // Added `anonymous` property
}> = [
  {
    inputs: [
      { internalType: "address", name: "_treasuryContract", type: "address" },
      { internalType: "address", name: "_usdc_token", type: "address" },
      {
        internalType: "address",
        name: "_ownerModifierAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "InsufficientBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidEventTiming",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSaleTiming",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidTicketData",
    type: "error",
  },
  {
    inputs: [],
    name: "NotOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferFail",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "eventAddress",
        type: "address",
      },
    ],
    name: "EventCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "FundsWithdrawn",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "_name", type: "string" },
      { internalType: "string", name: "_nftSymbol", type: "string" },
      { internalType: "uint256", name: "_start", type: "uint256" },
      { internalType: "uint256", name: "_end", type: "uint256" },
      { internalType: "uint256", name: "_startSale", type: "uint256" },
      { internalType: "uint256", name: "_endSale", type: "uint256" },
    ],
    name: "createEvent",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "eventContracts",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "eventCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllEvents",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "masterOwnerModifier",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "treasuryContract",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "usdc_token",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

declare global {
  interface Window {
    ethereum?: any; // Add type declaration for `window.ethereum`
  }
}

// Define the ticket type schema
const ticketTypeSchema = z.object({
  type: z.string().min(1, { message: "Ticket type is required" }),
  price: z.coerce
    .number()
    .positive({ message: "Price must be a positive number" }),
  supply: z.coerce
    .number()
    .int()
    .positive({ message: "Supply must be a positive integer" }),
});

const formSchema = z
  .object({
    eventName: z.string().min(3, {
      message: "Event name must be at least 3 characters.",
    }),
    eventDescription: z.string().min(10, {
      message: "Event description must be at least 10 characters.",
    }),
    nftCode: z.string().min(1, {
      message: "NFT code is required.",
    }),
    eventStartDate: z.date({
      required_error: "Event start date is required.",
    }),
    eventEndDate: z.date({
      required_error: "Event end date is required.",
    }),
    ticketSaleStartDate: z.date({
      required_error: "Ticket sale start date is required.",
    }),
    ticketSaleEndDate: z.date({
      required_error: "Ticket sale end date is required.",
    }),
    ticketTypes: z.array(ticketTypeSchema).min(1, {
      message: "At least one ticket type is required",
    }),
    bannerImage: z
      .instanceof(File)
      .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        `File size should be less than 5MB.`
      ),
  })
  .refine((data) => data.eventEndDate > data.eventStartDate, {
    message: "Event end date must be after event start date.",
    path: ["eventEndDate"],
  })
  .refine((data) => data.ticketSaleEndDate > data.ticketSaleStartDate, {
    message: "Ticket sale end date must be after ticket sale start date.",
    path: ["ticketSaleEndDate"],
  })
  .refine((data) => data.eventStartDate > data.ticketSaleEndDate, {
    message: "Event start date must be after ticket sale end date.",
    path: ["eventStartDate"],
  });

export default function CreateEventForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventName: "",
      eventDescription: "",
      nftCode: "",
      ticketTypes: [{ type: "", price: 0, supply: 0 }], // Start with one empty ticket type
    },
  });

  // Set up field array for dynamic ticket types
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ticketTypes",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);

    // Format dates for display in toast
    const formattedValues = {
      ...values,
      eventStartDate: format(values.eventStartDate, "PPP"),
      eventEndDate: format(values.eventEndDate, "PPP"),
      ticketSaleStartDate: format(values.ticketSaleStartDate, "PPP"),
      ticketSaleEndDate: format(values.ticketSaleEndDate, "PPP"),
      bannerImage: values.bannerImage.name,
      ticketTypes: values.ticketTypes.map(
        (ticket) =>
          `${ticket.type}: ${ticket.price} USDC (${ticket.supply} available)`
      ),
    };

    // Create a formatted string of form values
    const formattedDetails = Object.entries(formattedValues)
      .map(([key, value]) => {
        const formattedKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());

        if (key === "ticketTypes") {
          return `${formattedKey}:\n${(value as string[])
            .map((ticket) => `  - ${ticket}`)
            .join("\n")}`;
        }

        return `${formattedKey}: ${value}`;
      })
      .join("\n");

    toast({
      title: "We're creating your event...",
      description: (
        <div className="mt-2 max-h-[200px] overflow-y-auto text-sm">
          <p className="mb-2">Your event details:</p>
          <pre className="whitespace-pre-wrap rounded bg-slate-100 p-2 dark:bg-slate-800">
            {formattedDetails}
          </pre>
        </div>
      ),
      duration: 5000,
    });

    // Execute the createEvent function on the blockchain
    try {
      const eventAddress = await executeCreateEvent(
        values.eventName,
        values.nftCode,
        values.eventStartDate.getTime() / 1000,
        values.eventEndDate.getTime() / 1000,
        values.ticketSaleStartDate.getTime() / 1000,
        values.ticketSaleEndDate.getTime() / 1000
      );
      console.log("Event Address:", eventAddress);

      toast({
        title:
          "You will be prompted to sign another transaction to add your event's tickets",
        description: "Please approve in order to complete the event creation.",
        duration: 20000,
      });

      try {
        // Ensure the Ethereum provider is available
        if (!window.ethereum) {
          throw new Error(
            "Ethereum provider not found. Please install MetaMask."
          );
        }

        // Initialize the provider using ethers.BrowserProvider for MetaMask
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Initialize the event contract using the eventAddress
        const eventContract = new ethers.Contract(
          eventAddress,
          [
            {
              inputs: [
                {
                  internalType: "string[]",
                  name: "_ticketTypes",
                  type: "string[]",
                },
                {
                  internalType: "uint256[]",
                  name: "_prices",
                  type: "uint256[]",
                },
                {
                  internalType: "uint256[]",
                  name: "_maxSupplies",
                  type: "uint256[]",
                },
              ],
              name: "addTickets",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
          signer
        );

        // Extract ticket details from form values
        const ticketTypes = values.ticketTypes.map((ticket) => ticket.type);
        const prices = values.ticketTypes.map(
          (ticket) => ethers.parseUnits(ticket.price.toString(), 6) // Assuming USDC with 6 decimals
        );
        const maxSupplies = values.ticketTypes.map((ticket) => ticket.supply);

        // Call the addTickets function
        const tx = await eventContract.addTickets(
          ticketTypes,
          prices,
          maxSupplies
        );

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        console.log("Tickets added successfully:", receipt);

        toast({
          title: "Event created successfully!",
          description: "You can view your event on the home page.",
          action: (
            <ToastAction altText="Go to home" onClick={() => router.push("/")}>
              Go to home
            </ToastAction>
          ),
          duration: 15000,
        });
      } catch (error) {
        console.error("Error adding tickets:", error);
      }
    } catch (error) {
      console.error("Error creating event on blockchain:", error);
    }
  }

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (file: File) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create New Event</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="eventName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter event name" {...field} />
                </FormControl>
                <FormDescription>
                  The name of your event as it will appear to attendees.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="eventDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your event in detail"
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide a detailed description of your event.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nftCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NFT Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter NFT code" {...field} />
                </FormControl>
                <FormDescription>
                  The unique NFT code associated with this event.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="eventStartDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Event Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventEndDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Event End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="ticketSaleStartDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ticket Sale Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ticketSaleEndDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ticket Sale End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Ticket Types Section */}
          <div>
            <FormLabel className="block mb-2">Ticket Types</FormLabel>
            <FormDescription className="mb-4">
              Add different ticket types, prices, and supply quantities.
            </FormDescription>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center">
                      <FormField
                        control={form.control}
                        name={`ticketTypes.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? "sr-only" : ""}>
                              Ticket Type
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., VIP, Standard, Early Bird"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`ticketTypes.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? "sr-only" : ""}>
                              Price (USDC)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="e.g., 100"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`ticketTypes.${index}.supply`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? "sr-only" : ""}>
                              Supply
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="e.g., 100"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Remove button */}
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="h-10 w-10"
                          aria-label="Remove ticket type"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => append({ type: "", price: 0, supply: 0 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Ticket Type
            </Button>

            {form.formState.errors.ticketTypes?.root && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.ticketTypes.root.message}
              </p>
            )}
          </div>

          <FormField
            control={form.control}
            name="bannerImage"
            render={({ field: { value, onChange, ref, ...field } }) => (
              <FormItem>
                <FormLabel>Banner Image</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        {...field}
                        onChange={(e) => handleImageChange(e, onChange)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={triggerFileInput}
                        aria-label="Upload image"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>

                    {imagePreview && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">
                          Image Preview:
                        </p>
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-dashed">
                          <Image
                            src={imagePreview || "/placeholder.svg"}
                            alt="Banner preview"
                            className="h-full w-full object-cover"
                            fill={true}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Upload a banner image for your event. Maximum size: 5MB.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Create Event
          </Button>
        </form>
      </Form>
    </div>
  );
}

async function executeCreateEvent(
  name: string,
  nftSymbol: string,
  start: number,
  end: number,
  startSale: number,
  endSale: number
) {
  try {
    // Ensure the Ethereum provider is available
    if (!window.ethereum) {
      throw new Error("Ethereum provider not found. Please install MetaMask.");
    }

    // Initialize the provider using ethers.BrowserProvider for MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Initialize the contract
    const masterContract = new ethers.Contract(
      MASTER_CONTRACT_ADDRESS,
      MASTER_CONTRACT_ABI,
      signer
    );

    // Execute the createEvent function
    const tx = await masterContract.createEvent(
      name,
      nftSymbol,
      start,
      end,
      startSale,
      endSale
    );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    // Retrieve the event address from the transaction receipt
    const eventCreatedEvent = receipt.logs.find(
      (log: ethers.Log) => log.topics[0] === ethers.id("EventCreated(address)")
    );

    if (!eventCreatedEvent) {
      throw new Error("EventCreated event not found in transaction logs.");
    }

    const eventAddress = ethers.getAddress(
      `0x${eventCreatedEvent.topics[1].slice(26)}`
    );

    console.log("Event Address:", eventAddress);

    return eventAddress;
  } catch (error) {
    console.error("Error creating event on blockchain:", error);
    throw error;
  }
}
