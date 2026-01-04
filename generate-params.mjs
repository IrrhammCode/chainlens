
import { createWalletClient, custom, parseUnits, toHex } from 'viem';
import { sepolia } from 'viem/chains';
import { createWalletClient, custom, parseUnits, toHex } from 'viem';
import { sepolia } from 'viem/chains';
import { erc7715ProviderActions } from 'd:/code/Agent-7715/chainlens/node_modules/@metamask/smart-accounts-kit/dist/actions/index.mjs';

// Mock Window.ethereum
const mockTransport = custom({
    request: async (req) => {
        if (req.method === 'wallet_grantPermissions') {
            console.log("CAPTURED PARAMS:", JSON.stringify(req.params, null, 2));
            return [{ context: "0xMOCK_CONTEXT" }];
        }
        return [];
    }
});

async function run() {
    const walletClient = createWalletClient({
        chain: sepolia,
        transport: mockTransport
    }).extend(erc7715ProviderActions());

    const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
    const sessionAccountAddress = "0x8d96009cc01a2f64687b1c42f025407d57dfa053";

    // Simulate what the React App does in useActivateAgent.ts
    const permissions = await walletClient.requestExecutionPermissions([{
        chainId: sepolia.id,
        expiry: Math.floor(Date.now() / 1000) + 604800,
        signer: {
            type: "account",
            data: { address: sessionAccountAddress }
        },
        permission: {
            type: "erc20-token-periodic",
            data: {
                tokenAddress: usdcAddress,
                periodAmount: parseUnits("10", 18), // 18 decimals!
                periodDuration: 86400,
                justification: "Daily Limit"
            }
        },
        isAdjustmentAllowed: true
    }]);
}

run();
