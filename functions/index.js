/* eslint-disable no-unused-vars */
/* eslint-disable require-jsdoc */
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
import {getDatabase, getDatabaseWithUrl} from "firebase-admin/database";
import {initializeApp} from "firebase-admin/app";
const app = initializeApp();
const HELIUS_API_KEY = defineString("HELIUS_API_KEY");
const ADMIN_API_KEY = defineString("ADMIN_API_KEY");

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

export const addBalanceAddresses = onRequest(async (request, response) => {
  await validateOnRequestAdmin(request);
  const addresses = request.body.addresses;
  for (const address of addresses) {
    await storeData({ref: `balanceAddresses/${address.name}`, data: address.address});
  }
  response.send("OK");
});

export const addValidators = onRequest(async (request, response) => {
  await validateOnRequestAdmin(request);
  const validators = request.body.validators;
  for (const validator of validators) {
    await storeData({ref: `validators/${validator.name}`, data: validator.voteAddress});
  }
  response.send("OK");
});

export const addBtcBalance = onRequest(async (request, response) => {
  await validateOnRequestAdmin(request);
  const btcBalance = request.body.btcBalance;
  await storeData({ref: `btcBalance`, data: btcBalance});
  response.send("OK");
});

export const populateCache = onRequest(async (request, response) => {
  await validateOnRequestAdmin(request);
  await updateCache();
  response.send("OK");
});

async function updateCache() {
  await updateSolPrice();
  await updateBtcPrice();
  await updateCadUsdPrice();
  const validators = await getValidatorsCached();
  for (const [name, voteAddress] of Object.entries(validators)) {
    await updateValidatorInfo(voteAddress);
  }
  const addresses = await getBalanceAddressesCached();
  logger.debug(`Addresses: ${JSON.stringify(addresses)}`);
  for (const [name, address] of Object.entries(addresses)) {
    await updateAddressBalance(address);
  }
}


export const getMetrics = onRequest(async (request, response) => {
  const solBalance = await getPortfolioSolBalanceCached();
  const delegatedBalance = await getValidatorBalanceCached();
  const solPrice = await getSolPriceCached();
  const btcPrice = await getBtcPriceCached();
  const btcBalance = await getBtcBalanceCached();
  const cadUsdPrice = await getCadUsdPriceCached();
  const metrics = {
    solPrice,
    btcPrice,
    cadUsdPrice,
    portfolio: {
      sol: {
        balance: Number(solBalance.toFixed(2)),
        valueCad: Number((solBalance * solPrice * cadUsdPrice).toFixed(2)),
        valueUsd: Number((solBalance * solPrice).toFixed(2)),
      },
      btc: {
        balance: Number(btcBalance.toFixed(8)),
        valueCad: Number((btcBalance * btcPrice * cadUsdPrice).toFixed(2)),
        valueUsd: Number((btcBalance * btcPrice).toFixed(2)),
      },
    },
    validators: {
      totalDelegatedSol: delegatedBalance,
      totalDelegatedToCad: Number((delegatedBalance * solPrice * cadUsdPrice).toFixed(2)),
      totalDelegatedToUsd: Number((delegatedBalance * solPrice).toFixed(2)),
    },
  };
  response.send(metrics);
});

// Helius APIs
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


// Stakewiz APIs
const getValidatorInfo = async (voteAddress) => {
  const url = `https://api.stakewiz.com/validator/${voteAddress}`;
  const response = await fetch(url);
  const data = await response.json();
  logger.debug(`Validator info for ${voteAddress}: ${JSON.stringify(data)}`);
  return data.activated_stake;
};

// SOL Price
const getPrice = async (crypto) => {
  const url = `https://cryptoprices.cc/${crypto}/`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorMessage = `Error fetching ${crypto} price: ${response.status} ${response.statusText}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  const price = Number((await response.text()).trim());
  logger.debug(`${crypto} price: ${price}`);
  return price;
};

// CADUSD:
const getCadUsdPrice = async () => {
  const url = "https://bcd-api-dca-ipa.cbsa-asfc.cloud-nuage.canada.ca/exchange-rate-lambda/exchange-rates";
  const response = await fetch(url);
  if (!response.ok) {
    const errorMessage = `Error fetching CAD/USD price: ${response.status} ${response.statusText}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  const data = await response.json();
  logger.debug(`CAD/USD price data: ${JSON.stringify(data).slice(0, 50)}`);
  const cadUsdRate = data.ForeignExchangeRates.find(
      (rate) => rate.ExchangeRateId === 5734780,
  ).Rate;
  logger.debug(`CAD/USD price: ${cadUsdRate}`);
  return Number(cadUsdRate);
};


// Real Time Database:
let dbGlobal = null;

function getDb() {
  if (!dbGlobal) {
    if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
      logger.debug(`Using database emulator with URL: ${process.env.FIREBASE_DATABASE_EMULATOR_HOST}?ns=fake-server`);
      dbGlobal = getDatabaseWithUrl(`http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}?ns=fake-server`);
    } else {
      dbGlobal = getDatabase(app);
    }
  }
  return dbGlobal;
}

async function storeData({ref, data}) {
  const db = getDb();
  await db.ref(ref).set(data);
}

async function getData({ref}) {
  const db = getDb();
  const snapshot = await db.ref(ref).get();
  return snapshot.val();
}

async function deleteData({ref}) {
  const db = getDb();
  await db.ref(ref).remove();
}

async function deleteAllData() {
  const db = getDb();
  await db.ref().remove();
}

// Get SOL price cached
const getSolPriceCached = async () => {
  const solPrice = await getData({ref: "cache/solPrice"});
  return solPrice;
};

// Get BTC price cached
const getBtcPriceCached = async () => {
  const btcPrice = await getData({ref: "cache/btcPrice"});
  return btcPrice;
};

const updateSolPrice = async () => {
  const price = await getPrice("SOL");
  await storeData({ref: "cache/solPrice", data: price});
  return price;
};

const updateBtcPrice = async () => {
  const price = await getPrice("BTC");
  await storeData({ref: "cache/btcPrice", data: price});
  return price;
};

const getBtcBalanceCached = async () => {
  const btcBalance = await getData({ref: "btcBalance"});
  return btcBalance;
};

// Get CADUSD price cached
const getCadUsdPriceCached = async () => {
  const cadUsdPrice = await getData({ref: "cache/cadUsdPrice"});
  return cadUsdPrice;
};

const updateCadUsdPrice = async () => {
  const price = await getCadUsdPrice();
  await storeData({ref: "cache/cadUsdPrice", data: price});
  return price;
};


const updateValidatorInfo = async (voteAddress) => {
  const info = await getValidatorInfo(voteAddress);
  await storeData({ref: `cache/validatorInfo/${voteAddress}`, data: info});
  return info;
};

// Get Address Balance cached
const getPortfolioSolBalanceCached = async () => {
  const addresses = await getData({ref: `cache/addressBalance`});
  if (!addresses) {
    return 0;
  }
  const solBalance = Object.values(addresses).reduce((sum, balance) => sum + balance, 0);
  logger.debug(`SOL balance: ${solBalance}`);
  return solBalance;
};

// Get Validator info cached
const getValidatorBalanceCached = async (voteAddress) => {
  const validatorInfo = await getData({ref: `cache/validatorInfo`});
  if (!validatorInfo) {
    return 0;
  }
  logger.debug(`Validator info: ${JSON.stringify(validatorInfo)}`);
  const delegatedBalance = Object.values(validatorInfo).reduce((sum, balance) => sum + balance, 0);
  logger.debug(`Delegated balance: ${delegatedBalance}`);
  return delegatedBalance;
};

const updateAddressBalance = async (address) => {
  const balance = await getAssetsWithNativeBalance(address);
  await storeData({ref: `cache/addressBalance/${address}`, data: balance});
  return balance;
};

// Get Validators (list)
const getValidatorsCached = async () => {
  const validators = await getData({ref: "validators"});
  return validators;
};

// Get BalanceAddresses (list)
const getBalanceAddressesCached = async () => {
  const balanceAddresses = await getData({ref: "balanceAddresses"});
  return balanceAddresses;
};

async function validateOnRequestAdmin(req) {
  const apiKey = req.get("API-KEY");
  if (!apiKey) {
    logger.error("API key is missing");
    throw new Error("API key is required");
  }

  if (apiKey !== ADMIN_API_KEY.value()) {
    logger.error("Invalid API key");
    throw new Error("Invalid API key");
  }
  return true;
}
