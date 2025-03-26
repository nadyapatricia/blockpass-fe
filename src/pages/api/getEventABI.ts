import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";

const BASE_SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL!;
const BASE_SEPOLIA_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address } = req.query;

  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "Invalid or missing address parameter" });
  }

  try {
    // Initialize the provider
    const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL, BASE_SEPOLIA_CHAIN_ID);

    // Fetch the contract's code to verify its existence
    const code = await provider.getCode(address);
    if (code === "0x") {
      return res.status(404).json({ error: "Contract not found at the specified address" });
    }

    // Replace this placeholder ABI with actual logic to retrieve the ABI
    // For example, you might fetch it from a database or a blockchain explorer API
    const actualABI = await fetchABIFromBaseScan(address); // Replace with actual logic

    res.status(200).json({ abi: actualABI });
  } catch (error) {
    console.error("Error fetching ABI:", error);
    res.status(500).json({ error: "Failed to fetch ABI" });
  }
}

async function fetchABIFromBaseScan(address: string): Promise<any> {
  try {
    const BASESCAN_API_KEY = process.env.NEXT_PUBLIC_BASESCAN_API_KEY!;
    const BASESCAN_API_URL = `https://api.basescan.org/api`;

    const response = await fetch(
      `${BASESCAN_API_URL}?module=contract&action=getabi&address=${address}&apikey=${BASESCAN_API_KEY}`
    );

    const data = await response.json();

    if (data.status !== "1") {
      throw new Error(`Failed to fetch ABI: ${data.result}`);
    }

    return JSON.parse(data.result);
  } catch (error) {
    console.error("Error fetching ABI from BaseScan:", error);
    throw error;
  }
}
