/* eslint-disable max-len */
/* eslint-disable no-invalid-this */
/* eslint-disable no-undef */
import chai from "chai";
import chaiHttp from "chai-http";

chai.use(chaiHttp);
const expect = chai.expect;
const APP_URL = "http://127.0.0.1:5005";
const TEST_API_KEY = "hodl-api-key-test";
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
          .send({btcBalance: 3.168003+20});
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
  it(`Get Metrics`, async function() {
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
  return;
  it(`Get Solana Balance of one address`, async () => {
    // Make a GET request to the solana balance endpoint
    const response = await chai
        .request(APP_URL)
        .get("/sol/balance/")
        .query({addresses: ["4LNnfXdNrnR72mgJdPp6iw3FD8BccX2dPc3iofNxN8VY"]});
    const result = response.text;
    console.log(result);
    expect(response).to.have.status(200);
    // Expect result to be a string number
    expect(result).to.be.a("string");
    expect(parseFloat(result)).to.be.a("number").and.not.to.be.NaN;
  });
  it(`Get Solana Balance of multiple addresses`, async () => {
    // Make a GET request to the solana balance endpoint
    const response = await chai
        .request(APP_URL)
        .get("/sol/balance/")
        .query({addresses: ["4LNnfXdNrnR72mgJdPp6iw3FD8BccX2dPc3iofNxN8VY",
          "CU3JXqmgde95HgWnepAZctb3qeHXA7eT3qv6LQWB4Egz",
          "HRokvtG4fCSx9gcbt4Qj8YS8rGvQQ3EtxdLmRyWdK9g7",
          "2YyVPpbV3yGSvJJRr5Zf5CzLCGurYXVXGDTRfPBCGguV",
          "6XrSRfg6ZCL54B4P34HCkiwUsCGexPHy2YxhUTKCnMgJ",
          "Gy39eu4SNp4qtSUEXg6HJ9GLd1t5XdNCw2WoBg1FWyd4",
        ]});
    const result = response.text;
    console.log(result);
    expect(response).to.have.status(200);
    expect(result).to.be.a("string");
    expect(parseFloat(result)).to.be.a("number").and.not.to.be.NaN;
  });
});
