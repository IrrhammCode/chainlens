ChainLens - Blockchain Analytics Platform

A comprehensive blockchain analytics platform built for the Monthly builder 2025. Features multi-chain wallet analysis, NFT gallery, analytics dashboard, and AI chat with Gemini AI integration using Tatum APIs.

## 🚀 Features

### Core Features
- **Multi-Chain Wallet Analysis** - Check balances across 6 chains
- **DeFi Portfolio Tracking** - Comprehensive portfolio analysis with risk assessment
- **NFT Gallery** - Multi-chain NFT collection tracking
- **Real-time Analytics** - Live blockchain data and insights
- **AI Chat Assistant** - Intelligent blockchain analysis with Gemini AI

### Supported Blockchains
- **Ethereum (ETH)** - Mainnet
- **Polygon (MATIC)** - Layer 2
- **BNB Smart Chain (BNB)** - Binance Chain
- **Arbitrum (ETH)** - Layer 2
- **Base (ETH)** - Coinbase Layer 2
- **Optimism (ETH)** - Layer 2

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Tatum API Key (Get from `https://tatum.io/`)
- Gemini API Key (Get from Google AI Studio `https://aistudio.google.com/app/apikey`)
- (Optional) Telegram Bot Token (Get from `@BotFather`)

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd chainlens
npm install
```

2. **Set up environment variables (.env)**
```env
# Required
TATUM_API_KEY=your_tatum_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000

# Telegram (optional but recommended)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
WEB_SERVER_URL=http://localhost:3000
```

3. **Start the server**
```bash
# Development
npm run dev

# Production/simple
npm start
```

4. **Open your browser**
```
http://localhost:3000
```

## 🤖 AI Chat (Frontend)

You can chat with the AI in the web UI (AI Assistant tab). Supported commands (English):

1) "Check wallet 0x123... on Ethereum"
2) "Check wallet 0x123... across all chains"
3) "Analyze portfolio 0x123... on Polygon"
4) "Analyze portfolio 0x123... multi-chain"
5) "Show gas price on Ethereum"
6) "List supported chains"
7) "Show system status"
8) "Show MCP status"
9) "Restart MCP server"
10) "Force fallback mode"

Notes:
- The server pre-fetches on-chain context (native balances + token counts per chain) and grounds Gemini responses.
- Gas price is fetched directly via Tatum RPC and returned even without Gemini.

## 📱 Telegram Bot

Run the Telegram bot (requires `TELEGRAM_BOT_TOKEN` in `.env`):
```bash
# Start only the bot
npm run start:bot

# Start web server + bot together
npm run start:both
```

Supported Telegram commands:
- `/start` — Welcome + web link
- `/help` — List all commands
- `/status` — System status
- `/chains` — Supported chains
- `/gas` — Gas prices (Ethereum)
- `/analyze <0x...>` — Wallet analysis (single chain)
- `/analyze_multi <0x...>` — Wallet analysis (multi-chain)
- `/portfolio <0x...>` — Portfolio analysis (single chain)
- `/portfolio_multi <0x...>` — Portfolio analysis (multi-chain)
- `/nft <0x...>` — NFT analysis (single chain)
- `/nft_multi <0x...>` — NFT analysis (multi-chain)
- `/chat <your question>` — AI chat

Configuration:
- Set `WEB_SERVER_URL` if your web server runs on a different host or port (defaults to `http://localhost:3000`).

## 🔧 Configuration

### Environment Variables
```env
TATUM_API_KEY=your_tatum_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
WEB_SERVER_URL=http://localhost:3000
```

### API Endpoints
- `GET /` — Main web interface
- `POST /api/chat` — AI chat endpoint
- `GET /api/status` — System status
- `GET /api/chains` — Supported chains
- `GET /api/gas/:chain` — Gas price by chain (e.g., `ethereum`)
- `POST /api/mcp-restart` — Restart Gemini MCP server
- `POST /api/force-fallback` — Force fallback mode
- `POST /api/test-multichain` — Test multi-chain (wallet/portfolio/nft)

## 📊 Architecture

### Backend
- **Express.js** - Web server
- **Tatum APIs** - Blockchain data source
- **Gemini AI** - Natural-language responses grounded with on-chain context
- **Fallback System** - Enhanced multi-chain analysis

### Frontend
- **Vanilla JavaScript** - Lightweight and fast
- **Responsive Design** - Mobile-first approach
- **Real-time Updates** - Live data refresh

### AI System
- **Gemini AI** - Advanced AI analysis powered by Google's Gemini
- **Fallback System** - Multi-chain analysis when Gemini unavailable
- **Context Detection** - Smart query understanding
- **Multi-chain Support** - Comprehensive blockchain analysis

## 🔍 Troubleshooting

1. **Gemini AI Not Starting**
   - Check if `GEMINI_API_KEY` is valid
   - Verify network connectivity
   - System will automatically use fallback mode

2. **API Key Issues**
   - Test with: `GET /api/test-current-key`
   - Get new key from `https://tatum.io/`

3. **Port Already in Use**
   - Change `PORT` in `.env`

## 🚀 Deployment

### PM2 (example)
```bash
npm install -g pm2
pm2 start server-simple.js --name chainlens
pm2 save
pm2 startup
```

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ for the Monthly Builder 2025
