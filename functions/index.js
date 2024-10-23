/* eslint-disable max-len */
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import {defineString} from "firebase-functions/params";
const HELIUS_API_KEY = defineString("HELIUS_API_KEY");

export const solBalance = onRequest(async (request, response) => {
  logger.debug(`Request received: ${JSON.stringify(request.query)}`);
  let addresses = request.query.addresses;
  logger.debug("addresses", addresses);
  if (!addresses) {
    logger.error(`Missing "addresses" query parameter. Please provide an address or an array of addresses.`);
    response.status(400).send("Missing \"addresses\" query parameter. Please provide an address or an array of addresses.");
    return;
  }

  // Ensure addresses is always an array
  if (!Array.isArray(addresses)) {
    addresses = [addresses];
  }

  if (addresses.length === 0) {
    logger.error("The \"addresses\" array is empty. Please provide at least one address.");
    response.status(400).send("The \"addresses\" array is empty. Please provide at least one address.");
    return;
  }

  const balances = [];
  for (const address of addresses) {
    const balance = await getAssetsWithNativeBalance(address);
    balances.push(balance);
  }
  const totalBalance = balances.reduce((sum, balance) => sum + balance, 0);

  response.set("Content-Type", "text/plain");
  response.send(totalBalance.toString());
});


const getAssetsWithNativeBalance = async (address) => {
  const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY.value()}`;
  logger.debug(`Getting balance for ${address}`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: address,
        displayOptions: {
          showFungible: false,
          showNativeBalance: true,
        },
      },
    }),
  });
  if (!response.ok) {
    const errorMessage = `Error fetching balance for ${address}: ${response.status} ${response.statusText}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  const {result} = await response.json();
  const balance = result.nativeBalance.lamports / 10 ** 9;
  logger.debug(`Balance for ${address}: ${balance}`);
  return balance;
};
