import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

export default function CarouselBanner() {
  const arrayOfBanners = [
    "https://assets.loket.com/images/ss/1742800117_WkGnwz.png",
    "https://assets.loket.com/images/ss/1741925286_0lqiOd.jpg",
    "https://assets.loket.com/images/ss/1740782150_RZ0Wsh.jpg",
    "https://assets.loket.com/images/ss/1740817478_fnv50E.png",
  ];

  return (
    <Carousel className="w-full max-w-xs">
      <CarouselContent>
        {arrayOfBanners.map((imageUrl, index) => (
          <CarouselItem key={index}>
            <Image
              src={imageUrl}
              alt="Banner preview"
              className="h-full w-full object-cover"
              fill={true}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
