import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";

const BASE_SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL!;
const BASE_SEPOLIA_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID!);

console.log("API route /api/getEventABI is registered"); // Debugging log

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("API /api/getEventABI called"); // Debugging log

  if (req.method !== "GET") {
    console.error("Invalid method:", req.method); // Debugging log
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address } = req.query;

  if (!address || typeof address !== "string") {
    console.error("Invalid or missing address parameter:", address); // Debugging log
    return res.status(400).json({ error: "Invalid or missing address parameter" });
  }

  try {
    console.log("Fetching contract code for address:", address); // Debugging log

    // Initialize the provider
    const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL, BASE_SEPOLIA_CHAIN_ID);

    // Fetch the contract's code to verify its existence
    const code = await provider.getCode(address);
    if (code === "0x") {
      console.error("Contract not found at address:", address); // Debugging log
      return res.status(404).json({ error: "Contract not found at the specified address" });
    }

    console.log("Contract code found, fetching ABI from BaseScan"); // Debugging log

    // Fetch the ABI from BaseScan
    const actualABI = await fetchABIFromBaseScan(address);

    console.log("ABI fetched successfully:", actualABI); // Debugging log

    res.status(200).json({ abi: actualABI });
  } catch (error) {
    console.error("Error fetching ABI:", error); // Debugging log
    res.status(500).json({ error: "Failed to fetch ABI" });
  }
}

async function fetchABIFromBaseScan(address: string): Promise<any> {
  try {
    const BASESCAN_API_KEY = process.env.NEXT_PUBLIC_BASESCAN_API_KEY!;
    const BASESCAN_API_URL = `https://api.basescan.org/api`;

    console.log("Fetching ABI from BaseScan for address:", address); // Debugging log

    const response = await fetch(
      `${BASESCAN_API_URL}?module=contract&action=getabi&address=${address}&apikey=${BASESCAN_API_KEY}`
    );

    const data = await response.json();

    if (data.status !== "1") {
      console.error("Failed to fetch ABI from BaseScan:", data.result); // Debugging log
      throw new Error(`Failed to fetch ABI: ${data.result}`);
    }

    console.log("ABI fetched from BaseScan:", data.result); // Debugging log
    return JSON.parse(data.result);
  } catch (error) {
    console.error("Error fetching ABI from BaseScan:", error); // Debugging log
    throw error;
  }
}
