# 🤖 ChainLens - Autonomous DeFi Trading Agent

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Network](https://img.shields.io/badge/network-Ethereum%20Sepolia-grey)
![Status](https://img.shields.io/badge/status-Live%20Demo-green)

**ChainLens** is a next-generation autonomous DeFi trading agent. It leverages **ERC-7715 (Advanced Permissions)** to enable "Set & Forget" trading strategies without custodying user funds.

> **The Vision:** Shift DeFi from *"User manually executing every trade"* to *"User setting policy, Agent executing strategy."*

---

## 🏆 Participating Tracks

We are submitting **ChainLens** for the following MetaMask Developer Hackathon tracks:

1.  **✨ Best Integration - Existing Project**
    - Integrated ERC-7715 Advanced Permissions into the existing **ChainLens** analytics platform to transform it from a passive tracker to an active autonomous agent.
2.  **🎨 Most Creative Use of Advanced Permissions**
    - Built a fully autonomous execution engine that handles complex strategies (DCA, Grid, Limit) purely through permission delegation.
3.  **⚡ Best Use of Envio**
    - Integrated HyperSync for real-time multi-chain portfolio tracking and instant event indexing.
3.  **💬 Best Feedback**
    - Provided detailed technical feedback on Smart Accounts Kit documentation and DX (see Feedback section).
4.  **📱 Best Social Media Presence on X**
    - Documented the entire build journey and UX transformation (see Social Media section).

---

## 🚀 Features

### Core Trading Strategies
- **DCA (Dollar Cost Averaging)** - Automated periodic purchases with configurable budget and frequency
- **Limit Orders** - Execute trades only when price hits your target (real-time price from CoinGecko)
- **Grid Trading** - Place multiple orders at calculated grid levels for range-bound markets

### Autonomous Execution
- **ERC-7715 Permissions** - One-time approval for unlimited authorized transactions
- **Non-Custodial** - Funds never leave your wallet, agent only has execution permission
- **Real-Time Monitoring** - Agent runs 24/7, monitoring markets and executing strategies
- **Multi-Strategy Support** - Switch between DCA, Limit Orders, and Grid Trading seamlessly

### Real-Time Analytics
- **Envio HyperSync Integration** - Lightning-fast multi-chain event indexing
- **Cross-Chain Portfolio** - Track assets across Sepolia, Arbitrum, and Base
- **Live Activity Feed** - Real-time transaction history and whale detection alerts
- **Transaction History** - View all agent executions with Etherscan verification

---

## 🛠️ Installation

### Prerequisites
- **Node.js 18+**
- **MetaMask Flask** (Required for ERC-7715 support)
- **Sepolia ETH** (For agent wallet gas fees)

### Quick Start

```bash
# Clone and install
git clone <repository-url>
cd chainlens
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your keys

# Start server
npm start
```

Server runs on `http://localhost:3000`

### Environment Variables

Create `.env` file based on `.env.example`:

```env
# REQUIRED API KEYS
TATUM_API_KEY=your_tatum_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# AGENT RELAYER (Required for Real Execution)
# Private key for the backend to execute trades on Sepolia
AGENT_PRIVATE_KEY=0xYOUR_AGENT_PRIVATE_KEY

# ENVIO HYPERSYNC (Required for Agent)
# Leave empty to use Public Sepolia Endpoint
ENVIO_API_TOKEN=

# SERVER CONFIGURATION
PORT=3000
# Optional: Telegram Bot
TELEGRAM_BOT_TOKEN=
WEB_SERVER_URL=http://localhost:3000
```

---

## 🎮 Usage

### 1. Connect Wallet
- Open `http://localhost:3000` in browser with MetaMask Flask
- Connect your Sepolia wallet
- System scans your portfolio across multiple chains

### 2. Configure Strategy

**DCA Configuration:**
- Set daily budget (e.g., $10)
- Set frequency (Every Hour / 4 Hours / Daily / Weekly)
- Click "Activate Agent"

**Limit Order Configuration:**
- Set target ETH price (e.g., $3500)
- Set order amount (e.g., $100)
- Click "Activate Agent"

**Grid Trading Configuration:**
- Set price range (Min: $3200, Max: $3600)
- Set grid levels (3-20 levels)
- Set amount per order (e.g., $50)
- Click "Activate Agent"

### 3. Grant Permission
- MetaMask Flask popup appears
- Review permission details (amount, duration, target token)
- Sign once to authorize agent

### 4. Monitor Execution
- Agent executes automatically based on strategy
- View real-time logs in console
- Check transaction history table
- Verify on Etherscan via provided links

---

## 📊 Architecture

### Technology Stack
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Permissions** | ERC-7715 via Smart Accounts Kit | Delegated execution rights |
| **Frontend** | Vanilla JS + ES Modules | Lightweight, fast UI |
| **Backend** | Node.js + Express | Agent orchestration |
| **Blockchain** | Viem + Sepolia | On-chain interactions |
| **Indexing** | Envio HyperSync | Multi-chain event data |
| **Pricing** | CoinGecko API | Real-time ETH/USD price |

### How It Works

```
User → Grants Permission (ERC-7715)
       ↓
Backend → Stores Permission Context
       ↓
Agent → Monitors Market Conditions
       ↓
Agent → Executes Trade (Using Delegated Key)
       ↓
User → Receives Notification + Transaction Proof
```

---

## 🔐 Advanced Permissions Usage

This project leverages **ERC-7715 (Advanced Permissions)** via the MetaMask Smart Accounts Kit to enable autonomous agent operations without custodying user funds.

### Code Usage Links

#### Requesting Advanced Permissions
📍 **Frontend Permission Request:**
- **File:** [`public/app.js`](public/app.js#L587-L607)
- **Lines:** 587-607
- **Description:** Uses `requestExecutionPermissions()` from the Smart Accounts Kit to request periodic token spending permissions with granular caveats (amount limits, time windows, justification).

#### Redeeming/Using Advanced Permissions
📍 **Backend Permission Redemption:**
- **File:** [`server-simple.js`](server-simple.js#L1033-L1050)
- **Lines:** 1033-1050  
- **Description:** Agent wallet uses the granted session key to execute transactions on behalf of the user. The permission context is validated server-side before each execution.

📍 **Permission Storage & Validation:**
- **File:** [`server-simple.js`](server-simple.js#L1004-L1024)
- **Lines:** 1004-1024
- **Description:** Agent registration endpoint stores the granted permission context in an in-memory map, which is later used to validate execution requests.

### How It Works
1. **User grants permission** once via MetaMask popup (configured with daily budget, duration, target token)
2. **Backend stores** the permission context (cryptographic proof)
3. **Agent executes** trades autonomously within the granted limits
4. **User retains custody** - funds never leave their wallet, agent only has execution permission

---

## 📊 Envio Usage

We integrated **Envio HyperSync** for real-time blockchain event indexing and portfolio analytics.

### Code Usage Links

#### HyperSync Client Initialization
📍 **Service Setup:**
- **File:** [`services/hypersync.js`](services/hypersync.js#L1-L50)
- **Lines:** 1-50
- **Description:** Configures HyperSync client for Ethereum Sepolia, Arbitrum Sepolia, and Base Sepolia chains with event indexing for portfolio tracking.

#### Portfolio Data Fetching
📍 **Multi-Chain Portfolio Scan:**
- **File:** [`services/hypersync.js`](services/hypersync.js#L60-L150)
- **Lines:** 60-150
- **Description:** Uses HyperSync to query `Transfer` and `Swap` events across multiple chains for comprehensive portfolio analysis.

#### Real-Time Trade Monitoring
📍 **Live Event Streaming:**
- **File:** [`server-simple.js`](server-simple.js#L200-L350)
- **Lines:** 200-350
- **Description:** HyperSync endpoint provides real-time transaction history for the dashboard's live activity feed.

### How We Use Envio

**ChainLens** uses Envio HyperSync for:

1. **Cross-Chain Portfolio Tracking:** Scans user wallet across Sepolia, Arbitrum Sepolia, and Base Sepolia
2. **Real-Time Activity Feed:** Streams live blockchain events to dashboard
3. **Historical Analytics:** Query past trades for strategy backtesting

**Key Benefits:**
- ⚡ 10-100x faster than traditional RPC indexing
- 🌐 Multi-chain support with single API  
- 📊 Rich event data with decoded parameters
- 🔄 Real-time updates for live dashboard

---

## 💬 Feedback

### Hackathon Feedback Provided

During development, we identified several areas where MetaMask Advanced Permissions and the Smart Accounts Kit could be improved:

#### 1. Documentation Gaps
- **Issue:** Limited examples for `erc20-token-periodic` permission type
- **Impact:** Required reverse-engineering SDK source code to understand caveat structure
- **Suggestion:** Add comprehensive examples for each permission type in docs

#### 2. Permission Context Validation
- **Issue:** No clear documentation on how to validate/verify permission context server-side
- **Impact:** Had to implement custom validation logic, potential security risks
- **Suggestion:** Provide utility functions or best practices for backend validation

#### 3. Error Messages
- **Issue:** Generic error messages when permission request fails
- **Impact:** Difficult to debug user-facing issues
- **Suggestion:** More descriptive error codes and user-friendly messages

#### 4. Testnet Support
- **Issue:** Some features work inconsistently on Sepolia vs Mainnet
- **Impact:** Required extensive fallback logic for demo reliability
- **Suggestion:** Dedicated testnet documentation and test token faucets

### Feature Requests
- **Permission Templates:** Pre-configured permission sets for common DeFi use cases
- **Dashboard Integration:** Built-in UI component for viewing active permissions
- **Revocation API:** Programmatic way to revoke permissions from frontend

---

## 📱 Social Media

### Project Journey on X (Twitter)

Follow our project journey and see how MetaMask Advanced Permissions transformed the DeFi user experience.

🐦 **Twitter Thread:** [ChainLens Development Journey](https://x.com/BabyBoomWeb3/status/2007059992822886649?s=20)



---

Built with ❤️ for the Monthly Builder 2025 & MetaMask Developer Hackathon
