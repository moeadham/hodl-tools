/* eslint-disable no-undef */
import chai from "chai";
import chaiHttp from "chai-http";

chai.use(chaiHttp);
const expect = chai.expect;
const APP_URL = "http://127.0.0.1:5005";

describe("Hodl tools tests.", () => {
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
  it(`Get Solana Balance of one address`, async () => {
    // Make a GET request to the solana balance endpoint
    const response = await chai
        .request(APP_URL)
        .get("/sol/balance/")
        .query({addresses: ["4LNnfXdNrnR72mgJdPp6iw3FD8BccX2dPc3iofNxN8VY",
          "CU3JXqmgde95HgWnepAZctb3qeHXA7eT3qv6LQWB4Egz",
          "HRokvtG4fCSx9gcbt4Qj8YS8rGvQQ3EtxdLmRyWdK9g7",
          "Gy39eu4SNp4qtSUEXg6HJ9GLd1t5XdNCw2WoBg1FWyd4",
        ]});
    const result = response.text;
    console.log(result);
    expect(response).to.have.status(200);
    expect(result).to.be.a("string");
    expect(parseFloat(result)).to.be.a("number").and.not.to.be.NaN;
  });
});
