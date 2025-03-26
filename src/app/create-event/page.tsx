"use client";

import type React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Upload, Plus, Trash2 } from "lucide-react";
import { useState, useRef } from "react";

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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Here you would typically send the data to your API
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
        // Convert camelCase to Title Case with spaces
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
      title: "Event created successfully!",
      description: (
        <div className="mt-2 max-h-[200px] overflow-y-auto text-sm">
          <p className="mb-2">
            Your event has been created with the following details:
          </p>
          <pre className="whitespace-pre-wrap rounded bg-slate-100 p-2 dark:bg-slate-800">
            {formattedDetails}
          </pre>
        </div>
      ),
      duration: 5000, // Show for 5 seconds
    });
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
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Banner preview"
                            className="h-full w-full object-cover"
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
