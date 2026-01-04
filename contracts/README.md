# ChainLens Contracts

## Why no contracts?

ChainLens uses **ERC-7715 (Agent Permissions)** which allows an **Autonomous Agent (EOA)** to execute transactions on behalf of the user directly.

Unlike older patterns that require deploying a "Smart Wallet" or "Executor Contract" for every user, ERC-7715 allows us to grant permissions directly to the Agent's Key.

## Target Contracts

The Agent interacts with existing DeFi protocols:
- **USDC (Sepolia)**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- **Uniswap V3**: `0xE592427A0AEce92De3Edee1F18E0157C05861564`

No new deployment is needed to run the Agent!
