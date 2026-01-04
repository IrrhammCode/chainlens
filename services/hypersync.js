
// Envio HyperSync Service (ChainLens Proxy)
const { HypersyncClient } = require("@envio-dev/hypersync-client");
const { decodeEventLog, parseAbiItem, pad, formatUnits } = require("viem");

// Envio Endpoints
const CHAINS = {
    sepolia: "https://sepolia.hypersync.xyz",
    arbitrum: "https://arbitrum.hypersync.xyz",
    optimism: "https://optimism.hypersync.xyz",
    base: "https://base.hypersync.xyz"
};

const AGENT_ROUTER_ADDRESS = "0x08937bE70903b3ea4BA5D8FC8CA115401E1C1C6a"; // Sepolia
const TOKEN_ADDRESS = "0xc970a9C00AEAf314523B9B289F6644CcCbfE6930"; // Mock USDC

// ABIs
const TRANSFER_ABI = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");

class HyperSyncService {
    constructor() {
        this.clients = {};
        for (const [chain, url] of Object.entries(CHAINS)) {
            this.clients[chain] = new HypersyncClient({
                url,
                apiToken: process.env.ENVIO_API_TOKEN || "" // Optional
            });
        }
    }

    // --- NEW: Multi-Chain Portfolio Scan ---
    async getPortfolioStats(userAddress) {
        const stats = {
            totalTx: 0,
            activeChains: [],
            chainData: {}
        };

        const promises = Object.entries(this.clients).map(async ([chain, client]) => {
            try {
                // Scan for ANY Transfer event involving the user
                // This is extremely fast with HyperSync compared to RPC
                const query = {
                    fromBlock: 0,
                    logs: [{
                        topics: [
                            [ // Event Signature for Transfer
                                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
                            ],
                            [], // From (skip to catch receive too? No, usually topic1=from, topic2=to)
                            [pad(userAddress)] // Topic 2 (To) - Detection of "Inbound" assets means ownership
                        ]
                    }],
                    fieldSelection: { log: ['BlockNumber'] }
                };

                const result = await client.get(query);
                const count = result.data.logs.length;

                if (count > 0) {
                    stats.activeChains.push(chain);
                    stats.totalTx += count;
                    stats.chainData[chain] = count;
                }
            } catch (e) {
                console.warn(`HyperSync scan failed for ${chain}:`, e.message);
            }
        });

        await Promise.all(promises);
        return stats;
    }

    async getRecentTrades(limit = 20, userAddress) {
        try {
            // Default to Sepolia for "Recent Trades" view for now
            // In future, could aggregate all.
            const client = this.clients.sepolia;

            console.log(`🔍 HyperSync: Fetching trades for ${userAddress || "ALL"}...`);

            const transferQuery = {
                fromBlock: 5000000,
                logs: [{
                    address: [TOKEN_ADDRESS],
                    topics: userAddress ? [[], [pad(userAddress)]] : []
                }],
                fieldSelection: { log: ['TransactionHash', 'BlockNumber', 'Data', 'Topic0', 'Topic1', 'Topic2'] }
            };

            const transfers = await client.get(transferQuery);
            const trades = [];

            if (transfers.data && transfers.data.logs) {
                transfers.data.logs.forEach(log => {
                    try {
                        const decoded = decodeEventLog({
                            abi: [TRANSFER_ABI],
                            data: log.data,
                            topics: log.topics
                        });
                        trades.push({
                            type: "Transfer",
                            txHash: log.transactionHash,
                            block: Number(log.blockNumber),
                            timestamp: Math.floor(Date.now() / 1000),
                            details: `Transfer ${formatUnits(decoded.args.value, 18)} USDC` // Fixed formatUnits call
                        });
                    } catch (e) { }
                });
            }

            return trades.sort((a, b) => b.block - a.block).slice(0, limit);

        } catch (e) {
            console.error("HyperSync Error:", e);
            return [];
        }
    }
}

module.exports = new HyperSyncService();
