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
import axios from "axios";
import {defineString} from "firebase-functions/params";
const BITQUERY_API_KEY = defineString("BITQUERY_API_KEY");

export const solBalance = onRequest((request, response) => {
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


  // Continue processing with the valid addresses array
  // Prepare the GraphQL query and variables
  const query = `
    query ($addresses: [String!]!) {
      solana(network: solana) {
        address(address: {in: $addresses}) {
          address
          balance
        }
      }
    }
  `;

  let variables = {addresses};
  variables = JSON.stringify(variables);
  logger.debug("variables", variables);

  // Make the API request to Bitquery
  axios.post("https://graphql.bitquery.io", {
    query: query,
    variables: JSON.stringify(variables),
  }, {
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": BITQUERY_API_KEY.value(),
    },
  })
      .then((apiResponse) => {
        const balances = apiResponse.data.data.solana.address;
        const totalBalance = balances.reduce((sum, account) => sum + account.balance, 0);
        logger.debug(`Total balance: ${totalBalance}`);
        response.set("Content-Type", "text/plain");
        response.send(totalBalance.toString());
        return;
      })
      .catch((error) => {
        logger.error("Error fetching SOL balances:", error);
        response.status(500).send("Error fetching SOL balances");
      });
});
