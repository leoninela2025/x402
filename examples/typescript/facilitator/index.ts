/* eslint-env node */
import { config } from "dotenv";
import express from "express";
import { verify, settle } from "x402/facilitator";
import {
  PaymentRequirementsSchema,
  PaymentRequirements,
  evm,
  PaymentPayload,
  PaymentPayloadSchema,
} from "x402/types";
import cors from "cors";

config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const { createClientSepolia, createSignerSepolia } = evm;

const app = express();

// Configure express to parse JSON bodies
app.use(express.json());
app.use(cors());

type VerifyRequest = {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
};

type SettleRequest = {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
};

const client = createClientSepolia();

app.get("/verify", (req, res) => {
  res.json({
    endpoint: "/verify",
    description: "POST to verify x402 payments",
    body: {
      paymentPayload: "PaymentPayload",
      paymentRequirements: "PaymentRequirements",
    },
  });
});

app.post("/verify", async (req, res) => {
  try {
    const body: VerifyRequest = req.body;
    const paymentRequirements = PaymentRequirementsSchema.parse(body.paymentRequirements);
    const paymentPayload = PaymentPayloadSchema.parse(body.paymentPayload);
    console.log("Verifying payment with payload:", paymentPayload, "and requirements:", paymentRequirements);
    const valid = await verify(client, paymentPayload, paymentRequirements);
    console.log("Verification result:", valid);
    res.json(valid);
  } catch (error) {
    console.error("Error in /verify:", error);
    res.status(400).json({ error: "Invalid request" });
  }
});

app.get("/settle", (req, res) => {
  res.json({
    endpoint: "/settle",
    description: "POST to settle x402 payments",
    body: {
      paymentPayload: "PaymentPayload",
      paymentRequirements: "PaymentRequirements",
    },
  });
});

app.get("/supported", (req, res) => {
  res.json({
    kinds: [
      {
        x402Version: 1,
        scheme: "exact",
        network: "base-sepolia",
      },
    ],
  });
});

app.post("/settle", async (req, res) => {
  try {
    const signer = createSignerSepolia(PRIVATE_KEY as `0x${string}`);
    const body: SettleRequest = req.body;
    const paymentRequirements = PaymentRequirementsSchema.parse(body.paymentRequirements);
    const paymentPayload = PaymentPayloadSchema.parse(body.paymentPayload);
    console.log("Settling payment with payload:", paymentPayload, "and requirements:", paymentRequirements);
    const response = await settle(signer, paymentPayload, paymentRequirements);
    console.log("Settlement response:", response);
    res.json(response);
  } catch (error) {
    console.error("Error in /settle:", error);
    res.status(400).json({ error: "Invalid request" });
  }
});

app.listen(3002, () => {
  console.log(`Server listening at http://localhost:3002`);
});
