/* eslint-disable max-len */
/* eslint-disable no-invalid-this */
/* eslint-disable no-undef */
import chai from "chai";
import chaiHttp from "chai-http";

chai.use(chaiHttp);
const expect = chai.expect;
const TEST = true;
let APP_URL;
let TEST_API_KEY;
if (TEST) {
  APP_URL = "http://127.0.0.1:5005";
  TEST_API_KEY = "hodl-api-key-test";
} else {
  APP_URL = "https://hodl-tools.web.app";
  TEST_API_KEY = process.env.API_KEY;
}
const DEFAULT_TIMEOUT = 10000;
describe("Hodl tools tests.", () => {
  const populateCache = true;
  if (populateCache) {
    it(`Add Balance Addresses`, async function() {
      this.timeout(DEFAULT_TIMEOUT);
      const response = await chai
          .request(APP_URL)
          .post("/admin/addBalanceAddresses")
          .set("API-KEY", TEST_API_KEY)
          .send({addresses: [
            {address: "4LNnfXdNrnR72mgJdPp6iw3FD8BccX2dPc3iofNxN8VY", name: "vault 1"},
            {address: "2YyVPpbV3yGSvJJRr5Zf5CzLCGurYXVXGDTRfPBCGguV", name: "vault 2"},
            {address: "CU3JXqmgde95HgWnepAZctb3qeHXA7eT3qv6LQWB4Egz", name: "vault 3"},
            {address: "HRokvtG4fCSx9gcbt4Qj8YS8rGvQQ3EtxdLmRyWdK9g7", name: "vault 4"},
            {address: "6XrSRfg6ZCL54B4P34HCkiwUsCGexPHy2YxhUTKCnMgJ", name: "vault 5"},
            {address: "Hjq4sA5KtW9Yazq4ePQnuQQMAPD8aEfnbtN9tyjyJuum", name: "vault 6"},
            {address: "CzzrXrPvvkepbBt8bTfCMMiLUEPXt5M17npoz2WDeimX", name: "vault 7"},
          ]});
      expect(response).to.have.status(200);
    });
    it(`Add Validator Addresses`, async function() {
      this.timeout(DEFAULT_TIMEOUT);
      const response = await chai
          .request(APP_URL)
          .post("/admin/addValidators")
          .set("API-KEY", TEST_API_KEY)
          .send({validators: [
            {voteAddress: "punK4RDD3pFbcum79ACHatYPLLE1hr5UNnQVUGNfeyP", name: "Sol Strategies"},
            {voteAddress: "CogentC52e7kktFfWHwsqSmr8LiS1yAtfqhHcftCPcBJ", name: "Cogent"},
          ]});
      expect(response).to.have.status(200);
    });
    it(`Add BTC Balance`, async function() {
      this.timeout(DEFAULT_TIMEOUT);
      const response = await chai
          .request(APP_URL)
          .post("/admin/addBtcBalance")
          .set("API-KEY", TEST_API_KEY)
          .send({btcBalance: 23.168});
      expect(response).to.have.status(200);
    });
    it(`Add SOL Balance`, async function() {
      this.timeout(DEFAULT_TIMEOUT);
      const response = await chai
          .request(APP_URL)
          .post("/admin/addSolBalance")
          .set("API-KEY", TEST_API_KEY)
          .send({solBalance: 130125.2186});
      expect(response).to.have.status(200);
    });
    it(`Add Disclaimer`, async function() {
      this.timeout(DEFAULT_TIMEOUT);
      const response = await chai
          .request(APP_URL)
          .post("/admin/addDisclaimer")
          .set("API-KEY", TEST_API_KEY)
          .send({disclaimer: "* as of press release dated October 29, 2024"});
      expect(response).to.have.status(200);
    });
    it(`Populate Cache`, async function() {
      this.timeout(DEFAULT_TIMEOUT);
      const response = await chai
          .request(APP_URL)
          .post("/admin/populateCache")
          .set("API-KEY", TEST_API_KEY)
          .send({});
      expect(response).to.have.status(200);
    });
  }
  it(`Get Sol Balance in text`, async function() {
    this.timeout(DEFAULT_TIMEOUT);
    const response = await chai
        .request(APP_URL)
        .get("/metrics/");
    expect(response).to.have.status(200);
    console.log(response.body);
    expect(response.body).to.have.property("solPrice").that.is.a("number");
    expect(response.body).to.have.property("cadUsdPrice").that.is.a("number");
    expect(response.body).to.have.property("portfolio").that.is.an("object");
    expect(response.body.portfolio).to.have.property("sol").that.is.an("object");
    expect(response.body.portfolio.sol).to.have.property("balance").that.is.a("number");
    expect(response.body.portfolio.sol).to.have.property("valueCad").that.is.a("number");
    expect(response.body.portfolio.sol).to.have.property("valueUsd").that.is.a("number");
    expect(response.body.portfolio).to.have.property("btc").that.is.an("object");
    expect(response.body.portfolio.btc).to.have.property("balance").that.is.a("number");
    expect(response.body.portfolio.btc).to.have.property("valueCad").that.is.a("number");
    expect(response.body.portfolio.btc).to.have.property("valueUsd").that.is.a("number");
    expect(response.body).to.have.property("validators").that.is.an("object");
    expect(response.body.validators).to.have.property("totalDelegatedSol").that.is.a("number");
    expect(response.body.validators).to.have.property("totalDelegatedToCad").that.is.a("number");
    expect(response.body.validators).to.have.property("totalDelegatedToUsd").that.is.a("number");
  });
  it(`Get Sol Balance Raw`, async function() {
    this.timeout(DEFAULT_TIMEOUT);
    const response = await chai
        .request(APP_URL)
        .get("/sol/balance/");
    expect(response).to.have.status(200);
    expect(response.text).to.be.a("string");
    expect(response.text).to.match(/^\d+(\.\d+)?$/);
  });
});
