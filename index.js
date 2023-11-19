var cron = require("node-cron");
const web3 = require("@solana/web3.js");
require("dotenv").config();

const sdk = require("api")("@alchemy-docs/v1.0#xy9nvblorhsnpd");

const main = async () => {
  const listenAddress = process.env.LISTEN_ADDRESS; // Raydium Liquidity Pool V4x
  const fromAddress = process.env.FROM_ADDRESS; // sol
  const toAddress = process.env.TO_ADDRESS; // token

  (async () => {
    const publicKey = new web3.PublicKey(listenAddress);
    const solanaConnection = new web3.Connection(
      "https://docs-demo.solana-mainnet.quiknode.pro/",
      {
        wsEndpoint: process.env.QUICK_NODE_WSS_ENDPOINT,
      }
    );
    solanaConnection.onLogs(
      publicKey,
      async (logs, context) => {
        if (logs.err == null) {
          const apiKeys = process.env.ACHEMY_API_KEYS.split(",");
          const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

          sdk
            .getTransaction(
              {
                method: "getTransaction",
                jsonrpc: "2.0",
                params: [
                  logs.signature,
                  {
                    commitment: "finalized",
                    encoding: "jsonParsed",
                    maxSupportedTransactionVersion: 0,
                  },
                ],
                id: "1",
              },
              { apiKey: apiKey }
            )
            .then(({ data }) => {
              if (!data.result?.err && data.result?.meta?.innerInstructions) {
                if (
                  data.result.meta.innerInstructions.length > 0 &&
                  data.result.meta.innerInstructions[0].instructions.length == 2
                ) {
                  console.log(`valid signature: ${logs.signature}`);
                  const from =
                    data.result.meta.postTokenBalances[
                      data.result.meta.postTokenBalances.length - 2
                    ];
                  const to =
                    data.result.meta.postTokenBalances[
                      data.result.meta.postTokenBalances.length - 1
                    ];

                  if (
                    from.mint.toLowerCase() == fromAddress.toLowerCase() &&
                    to.mint.toLowerCase() == toAddress.toLowerCase()
                  ) {
                    const fromDecimal = from.uiTokenAmount.decimals;
                    const toDecimal = to.uiTokenAmount.decimals;

                    const fromAmount =
                      parseInt(
                        data.result.meta.innerInstructions[0].instructions[0]
                          .parsed.info.amount
                      ) /
                      10 ** fromDecimal;
                    const toAmount =
                      parseInt(
                        data.result.meta.innerInstructions[0].instructions[1]
                          .parsed.info.amount
                      ) /
                      10 ** toDecimal;
                    console.log(
                      "-----------------------------------------------------------------"
                    );
                    console.log(`detect signature: ${logs.signature}`);
                    console.log(
                      `from: ${fromAddress} -  amount: ${fromAmount}`
                    );
                    console.log(`to: ${toAddress} -  amount: ${toAmount}`);
                    console.log(
                      "-----------------------------------------------------------------"
                    );
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      },
      "finalized"
    );
  })();
};

main();
