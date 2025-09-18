/**
 * Tatum ChainLens - Telegram Bot
 * 
 * Telegram bot integration for Tatum ChainLens blockchain analytics platform.
 * Features multi-chain wallet analysis, portfolio tracking, NFT analysis, and AI chat.
 * 
 * @author Tatum ChainLens Team
 * @version 1.0.0
 * @license MIT
 */

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

// Bot configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_SERVER_URL = process.env.WEB_SERVER_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
    console.log('📝 Please add TELEGRAM_BOT_TOKEN to your .env file');
    console.log('🔗 Get your bot token from @BotFather on Telegram');
    process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Tatum ChainLens Telegram Bot Started');
console.log('🔗 Web Server URL:', WEB_SERVER_URL);
console.log('📊 Features: Multi-chain analysis, Portfolio tracking, NFT analysis, AI chat');

// Helper function to call web server API
async function callWebAPI(endpoint, data = null) {
    try {
        const config = {
            method: data ? 'POST' : 'GET',
            url: `${WEB_SERVER_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('Web API Error:', error.message);
        return null;
    }
}

// Format wallet address from message
function extractWalletAddress(message) {
    const addressRegex = /0x[a-fA-F0-9]{40}/g;
    const matches = message.match(addressRegex);
    return matches ? matches[0] : null;
}

// Format response for Telegram
function formatTelegramResponse(response) {
    // Convert markdown to HTML for better Telegram display
    let formatted = response
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '\n');
    
    // Limit message length for Telegram
    if (formatted.length > 4000) {
        formatted = formatted.substring(0, 4000) + '\n\n... (truncated)';
    }
    
    return formatted;
}

// Start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🚀 <b>Welcome to Tatum ChainLens Bot!</b>

I'm your blockchain analytics assistant powered by Tatum APIs and AI chat.

<b>🔍 Available Commands:</b>
/help - Show all commands
/status - Check system status
/chains - List supported blockchains
/analyze - Analyze wallet (with address)
/portfolio - Portfolio analysis (with address)
/nft - NFT analysis (with address)
/chat - AI chat mode

<b>💡 Examples:</b>
• <code>/analyze 0x1234...</code> - Analyze wallet
• <code>/portfolio 0x1234...</code> - Portfolio analysis
• <code>/nft 0x1234...</code> - NFT analysis
• <code>/chat What is Ethereum?</code> - AI chat

<b>🌐 Web Interface:</b>
<a href="${WEB_SERVER_URL}">Open Web Dashboard</a>

<i>Powered by Tatum ChainLens - MCP Hackathon 2025</i>
    `;
    
    bot.sendMessage(chatId, welcomeMessage, { 
        parse_mode: 'HTML',
        disable_web_page_preview: true
    });
});

// Help command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
📚 <b>Tatum ChainLens Bot Help</b>

<b>🔍 Wallet Analysis:</b>
/analyze <code>0x1234...</code> - Single chain analysis
/analyze_multi <code>0x1234...</code> - Multi-chain analysis

<b>📊 Portfolio Tracking:</b>
/portfolio <code>0x1234...</code> - Portfolio analysis
/portfolio_multi <code>0x1234...</code> - Multi-chain portfolio

<b>🖼️ NFT Analysis:</b>
/nft <code>0x1234...</code> - NFT collection analysis
/nft_multi <code>0x1234...</code> - Multi-chain NFT analysis

<b>🤖 AI Chat:</b>
/chat <code>your question</code> - Ask anything about blockchain

<b>ℹ️ System Info:</b>
/status - System status
/chains - Supported blockchains
/gas - Gas prices

<b>💡 Tips:</b>
• Use /chat for general questions
• Include wallet address for analysis
• All analysis uses real blockchain data
• Multi-chain commands analyze across 6 chains

<i>Need more help? Visit our web dashboard!</i>
    `;
    
    bot.sendMessage(chatId, helpMessage, { 
        parse_mode: 'HTML',
        disable_web_page_preview: true
    });
});

// Status command
bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        const status = await callWebAPI('/api/status');
        
        if (status) {
            const statusMessage = `
📊 <b>System Status</b>

<b>🖥️ Server:</b>
• Status: ${status.server.status}
• Port: ${status.server.port}
• Uptime: ${Math.round(status.server.uptime)}s

<b>🤖 MCP Server:</b>
• Connected: ${status.mcp.connected ? '✅ Yes' : '❌ No'}
• Status: ${status.mcp.status}
• Fallback Mode: ${status.mcp.fallbackMode ? '✅ Active' : '❌ Inactive'}

<b>🔄 Last Error:</b>
${status.mcp.lastError || 'None'}

<i>Timestamp: ${new Date(status.timestamp).toLocaleString()}</i>
            `;
            
            bot.sendMessage(chatId, statusMessage, { parse_mode: 'HTML' });
        } else {
            bot.sendMessage(chatId, '❌ Unable to get system status. Web server may be down.');
        }
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error getting system status: ' + error.message);
    }
});

// Chains command
bot.onText(/\/chains/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        const chains = await callWebAPI('/api/chains');
        
        if (chains) {
            let chainsMessage = '🔗 <b>Supported Blockchains</b>\n\n';
            
            chains.chains.forEach((chain, index) => {
                chainsMessage += `${index + 1}. <b>${chain.name}</b> (${chain.symbol})\n`;
            });
            
            chainsMessage += `\n<b>MCP Status:</b> ${chains.mcpConnected ? '✅ Connected' : '❌ Disconnected'}`;
            
            bot.sendMessage(chatId, chainsMessage, { parse_mode: 'HTML' });
        } else {
            bot.sendMessage(chatId, '❌ Unable to get supported chains. Web server may be down.');
        }
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error getting chains: ' + error.message);
    }
});

// Analyze wallet command
bot.onText(/\/analyze (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const address = match[1];
    
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        bot.sendMessage(chatId, '❌ Invalid wallet address format. Please use a valid Ethereum address.');
        return;
    }
    
    try {
        bot.sendMessage(chatId, '🔍 Analyzing wallet... Please wait.');
        
        const response = await callWebAPI('/api/chat', {
            message: `Analyze wallet ${address}`
        });
        
        if (response) {
            const formattedResponse = formatTelegramResponse(response.response);
            bot.sendMessage(chatId, formattedResponse, { 
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
        } else {
            bot.sendMessage(chatId, '❌ Unable to analyze wallet. Web server may be down.');
        }
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error analyzing wallet: ' + error.message);
    }
});

// Multi-chain analyze command
bot.onText(/\/analyze_multi (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const address = match[1];
    
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        bot.sendMessage(chatId, '❌ Invalid wallet address format. Please use a valid Ethereum address.');
        return;
    }
    
    try {
        bot.sendMessage(chatId, '🔍 Analyzing wallet across all chains... Please wait.');
        
        const response = await callWebAPI('/api/test-multichain', {
            address: address,
            type: 'wallet'
        });
        
        if (response && response.success) {
            const formattedResponse = formatTelegramResponse(response.result);
            bot.sendMessage(chatId, formattedResponse, { 
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
        } else {
            bot.sendMessage(chatId, '❌ Unable to analyze wallet. Web server may be down.');
        }
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error analyzing wallet: ' + error.message);
    }
});

// Portfolio command
bot.onText(/\/portfolio (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const address = match[1];
    
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        bot.sendMessage(chatId, '❌ Invalid wallet address format. Please use a valid Ethereum address.');
        return;
    }
    
    try {
        bot.sendMessage(chatId, '📊 Analyzing portfolio... Please wait.');
        
        const response = await callWebAPI('/api/chat', {
            message: `Portfolio analysis ${address}`
        });
        
        if (response) {
            const formattedResponse = formatTelegramResponse(response.response);
            bot.sendMessage(chatId, formattedResponse, { 
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
        } else {
            bot.sendMessage(chatId, '❌ Unable to analyze portfolio. Web server may be down.');
        }
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error analyzing portfolio: ' + error.message);
    }
});

// Multi-chain portfolio command
bot.onText(/\/portfolio_multi (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const address = match[1];
    
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        bot.sendMessage(chatId, '❌ Invalid wallet address format. Please use a valid Ethereum address.');
        return;
    }
    
    try {
        bot.sendMessage(chatId, '📊 Analyzing portfolio across all chains... Please wait.');
        
        const response = await callWebAPI('/api/test-multichain', {
            address: address,
            type: 'portfolio'
        });
        
        if (response && response.success) {
            const formattedResponse = formatTelegramResponse(response.result);
            bot.sendMessage(chatId, formattedResponse, { 
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
        } else {
            bot.sendMessage(chatId, '❌ Unable to analyze portfolio. Web server may be down.');
        }
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error analyzing portfolio: ' + error.message);
    }
});

// NFT command
bot.onText(/\/nft (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const address = match[1];
    
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        bot.sendMessage(chatId, '❌ Invalid wallet address format. Please use a valid Ethereum address.');
        return;
    }
    
    try {
        bot.sendMessage(chatId, '🖼️ Analyzing NFTs... Please wait.');
        
        const response = await callWebAPI('/api/chat', {
            message: `NFT analysis ${address}`
        });
        
        if (response) {
            const formattedResponse = formatTelegramResponse(response.response);
            bot.sendMessage(chatId, formattedResponse, { 
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
        } else {
            bot.sendMessage(chatId, '❌ Unable to analyze NFTs. Web server may be down.');
        }
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error analyzing NFTs: ' + error.message);
    }
});

// Multi-chain NFT command
bot.onText(/\/nft_multi (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const address = match[1];
    
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        bot.sendMessage(chatId, '❌ Invalid wallet address format. Please use a valid Ethereum address.');
        return;
    }
    
    try {
        bot.sendMessage(chatId, '🖼️ Analyzing NFTs across all chains... Please wait.');
        
        const response = await callWebAPI('/api/test-multichain', {
            address: address,
            type: 'nft'
        });
        
        if (response && response.success) {
            const formattedResponse = formatTelegramResponse(response.result);
            bot.sendMessage(chatId, formattedResponse, { 
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
        } else {
            bot.sendMessage(chatId, '❌ Unable to analyze NFTs. Web server may be down.');
        }
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error analyzing NFTs: ' + error.message);
    }
});

// AI Chat command
bot.onText(/\/chat (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const message = match[1];
    
    try {
        bot.sendMessage(chatId, '🤖 Processing your question... Please wait.');
        
        const response = await callWebAPI('/api/chat', {
            message: message
        });
        
        if (response) {
            const formattedResponse = formatTelegramResponse(response.response);
            bot.sendMessage(chatId, formattedResponse, { 
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
        } else {
            bot.sendMessage(chatId, '❌ Unable to process your question. Web server may be down.');
        }
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error processing your question: ' + error.message);
    }
});

// Gas prices command
bot.onText(/\/gas/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        const response = await callWebAPI('/api/gas/ethereum');
        
        if (response) {
            const gasMessage = `
⛽ <b>Current Gas Prices (Ethereum)</b>

<b>Slow:</b> ${response.gasPrice.slow} Gwei
<b>Standard:</b> ${response.gasPrice.standard} Gwei
<b>Fast:</b> ${response.gasPrice.fast} Gwei
<b>Base Fee:</b> ${response.gasPrice.baseFee} Gwei

<i>Use these prices to optimize your transactions!</i>
            `;
            
            bot.sendMessage(chatId, gasMessage, { parse_mode: 'HTML' });
        } else {
            bot.sendMessage(chatId, '❌ Unable to get gas prices. Web server may be down.');
        }
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error getting gas prices: ' + error.message);
    }
});

// Error handling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

bot.on('error', (error) => {
    console.error('Bot error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down Telegram bot...');
    bot.stopPolling();
    process.exit(0);
});

console.log('✅ Telegram bot is running and ready to receive messages!');
console.log('📱 Send /start to your bot to begin');
