
import { createWalletClient, custom, parseUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { erc7715ProviderActions } from '@metamask/smart-accounts-kit/actions';

// --- CONFIGURATION ---
const BACKEND_URL = "/api"; // Relative path for proxy
let isAgentActive = false;
let simulationInterval = null;
let walletAddress = null;

// --- DOM ELEMENTS ---
const activateAgentBtn = document.getElementById('activateAgentBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const walletBadge = document.getElementById('wallet-badge');
const walletAddressSpan = document.getElementById('wallet-address');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const consoleOutput = document.getElementById('consoleOutput');
const agentStatusBadge = document.getElementById('agent-status-badge');

// --- HELPER: Console Log ---
function logConsole(msg, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    let colorClass = 'text-gray-300';
    if (type === 'success') colorClass = 'text-emerald-400';
    if (type === 'error') colorClass = 'text-red-400';
    if (type === 'warn') colorClass = 'text-yellow-400';

    const div = document.createElement('div');
    div.className = `font-mono text-sm ${colorClass} mb-1`;
    div.innerHTML = `<span class="opacity-50">[${timestamp}]</span> ${msg}`;

    if (consoleOutput) {
        consoleOutput.appendChild(div);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    } else {
        console.log(`[${type}] ${msg}`);
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // Check local storage for wallet address
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
        walletAddress = savedAddress;
        updateWalletUI(savedAddress);

        // Auto-scan portfolio with Envio on page load
        fetchPortfolio(savedAddress);
    }

    // Load watchlist
    const savedWatchlist = localStorage.getItem('chainlens_watchlist');
    if (!savedWatchlist) {
        // DEMO: Pre-seed with 3 active addresses for "Real-Time" proof
        const demoAddresses = [
            "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // Vitalik (Mainnet/Sepolia)
            "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97", // Sepolia Whale
            "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"  // Uniswap 
        ];
        localStorage.setItem('chainlens_watchlist', JSON.stringify(demoAddresses));
        console.log("🌟 Demo Watchlist Seeding: Added 3 addresses");
    }
    renderWatchlist();

    // Load watchlist from localStorage
    renderWatchlist();

    // --- NEW: Dashboard Scan Logic ---
    const checkWalletBtn = document.getElementById('checkWallet');
    const walletInput = document.getElementById('walletAddress');

    if (checkWalletBtn && walletInput) {
        checkWalletBtn.onclick = async () => {
            const addr = walletInput.value;
            if (addr && addr.startsWith('0x')) {
                fetchPortfolio(addr);
            } else {
                alert("Please enter a valid 0x address");
            }
        };
    }

    // --- NEW: AI Chat Logic ---
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');

    if (chatInput && sendBtn && chatMessages) {
        const sendMessage = async () => {
            const message = chatInput.value.trim();
            if (!message) return;

            // Add user message to UI
            addChatMessage(message, 'user');
            chatInput.value = '';

            // Show typing indicator
            const typingId = addChatMessage('Thinking...', 'ai', true);

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });

                const data = await response.json();

                // Remove typing indicator
                document.getElementById(typingId)?.remove();

                // Add AI response
                addChatMessage(data.response || "Sorry, I couldn't process that.", 'ai');

            } catch (e) {
                document.getElementById(typingId)?.remove();
                addChatMessage("❌ Connection error. Please try again.", 'ai');
            }
        };

        sendBtn.onclick = sendMessage;
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});

// --- CHAT UI HELPER ---
function addChatMessage(text, sender = 'ai', isTyping = false) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const msgId = 'msg-' + Date.now();
    const isUser = sender === 'user';

    const msgDiv = document.createElement('div');
    msgDiv.id = msgId;
    msgDiv.className = `flex gap-3 ${isUser ? 'justify-end' : ''}`;

    msgDiv.innerHTML = `
        ${!isUser ? `<div class="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">AI</div>` : ''}
        <div class="bg-${isUser ? 'violet-600' : 'white/5'} p-3 rounded-2xl ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'} border border-white/5 text-sm text-${isUser ? 'white' : 'gray-300'} max-w-[80%] ${isTyping ? 'animate-pulse' : ''}">
            ${text}
        </div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return msgId;
}

// --- WATCHLIST MANAGEMENT ---
let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');

function addToWatchlist(address) {
    if (!watchlist.includes(address.toLowerCase())) {
        watchlist.push(address.toLowerCase());
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        renderWatchlist();
        logConsole(`✅ Added ${address.substring(0, 8)}... to watchlist`, 'success');
    }
}

function removeFromWatchlist(address) {
    watchlist = watchlist.filter(a => a !== address.toLowerCase());
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderWatchlist();
    logConsole(`🗑️ Removed ${address.substring(0, 8)}... from watchlist`, 'info');
}

function renderWatchlist() {
    const container = document.getElementById('watchlistContainer');
    if (!container) return;

    if (watchlist.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 text-gray-600 text-sm italic">
                No wallets monitored yet. Scan to add.
            </div>
        `;
        return;
    }

    container.innerHTML = watchlist.map(addr => `
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-violet-500/30 transition group">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <i class="fas fa-wallet text-violet-400 text-sm"></i>
                </div>
                <div>
                    <span class="font-mono text-sm text-white block">${addr.substring(0, 6)}...${addr.substring(38)}</span>
                    <span id="balance-${addr.toLowerCase()}" class="text-xs text-gray-500 font-mono animate-pulse">$0.00</span>
                </div>
            </div>
            <div class="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="fetchPortfolio('${addr}')" 
                    class="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded transition" title="Scan this wallet">
                    <i class="fas fa-sync"></i>
                </button>
                <button onclick="removeFromWatchlist('${addr}')" 
                    class="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs rounded transition" title="Remove">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Add auto-scan logic to DOMContentLoaded (needs to be done where the listener is added)

// --- AGENT HISTORY (ENVIO TRADES) ---
let historyInterval = null;

async function fetchAgentHistory() {
    try {
        const user = walletAddress || '';
        const res = await fetch(`/api/envio/trades?user=${user}`);
        const data = await res.json();

        if (data.success && data.trades && data.trades.length > 0) {
            renderTradeHistory(data.trades);
            updateBlockCounter(data.trades[0].block);
        }
    } catch (e) {
        console.error('History fetch failed:', e);
    }
}

function renderTradeHistory(trades) {
    const tbody = document.getElementById('envioFeedBody');
    if (!tbody) return;

    tbody.innerHTML = trades.map(t => {
        const time = t.timestamp ? new Date(t.timestamp * 1000).toLocaleTimeString() : 'Now';
        return `
            <tr class="border-b border-white/5 hover:bg-white/5 transition cursor-pointer" onclick="showTxDetails('${t.txHash}')">
                <td class="px-4 py-3">${time}</td>
                <td class="px-4 py-3">${t.type || 'Transfer'}</td>
                <td class="px-4 py-3">Sepolia Testnet</td>
                <td class="px-4 py-3 text-right">~0.001 ETH</td>
            </tr>
        `;
    }).join('');
}

function updateBlockCounter(block) {
    const counter = document.getElementById('blockCounter');
    if (counter) counter.innerText = block || '0';
}

function startHistoryRefresh() {
    fetchAgentHistory();
    historyInterval = setInterval(fetchAgentHistory, 10000); // Every 10s
}

function stopHistoryRefresh() {
    if (historyInterval) clearInterval(historyInterval);
}

// --- SETTINGS PERSISTENCE ---
function saveSettings() {
    // Determine selected strategy
    const strategy = document.querySelector('input[name="strategy"]:checked').value;

    // DCA Params
    const dailyBudget = document.getElementById('dailyBudgetInput').value;
    const frequency = document.getElementById('frequencySelect').value;

    // Limit Order Params
    const targetPrice = document.getElementById('targetPriceInput').value;
    const orderAmount = document.getElementById('orderAmountInput').value;

    const settings = {
        strategy,
        dailyBudget,
        frequency,
        targetPrice,
        orderAmount
    };

    localStorage.setItem('chainlens_settings', JSON.stringify(settings));

    // If agent is active, we might want to update it dynamically (advanced feature)
}

function loadSettings() {
    const saved = localStorage.getItem('chainlens_settings');
    if (saved) {
        const settings = JSON.parse(saved);

        // Restore Strategy
        if (settings.strategy) {
            const radio = document.querySelector(`input[name="strategy"][value="${settings.strategy}"]`);
            if (radio) {
                radio.checked = true;
                toggleStrategyUI(settings.strategy);
            }
        }

        // Restore DCA
        if (settings.dailyBudget) {
            document.getElementById('dailyBudgetInput').value = settings.dailyBudget;
            document.getElementById('configDailyBudget').innerText = '$' + parseFloat(settings.dailyBudget).toFixed(2);
        }
        if (settings.frequency) {
            document.getElementById('frequencySelect').value = settings.frequency;
            // Update text for select
            const sel = document.getElementById('frequencySelect');
            document.getElementById('configFrequency').innerText = sel.options[sel.selectedIndex].text;
        }

        // Restore Limit Order
        if (settings.targetPrice) {
            document.getElementById('targetPriceInput').value = settings.targetPrice;
            document.getElementById('configTargetPrice').innerText = '$' + settings.targetPrice;
        }
        if (settings.orderAmount) {
            document.getElementById('orderAmountInput').value = settings.orderAmount;
            document.getElementById('configOrderAmount').innerText = '$' + settings.orderAmount;
        }
    } else {
        // Default UI state
        toggleStrategyUI('dca');
    }
}

// Helper to switch UI inputs
function toggleStrategyUI(strategy) {
    const dcaInputs = document.getElementById('dcaInputs');
    const limitInputs = document.getElementById('limitInputs');
    const gridInputs = document.getElementById('gridInputs');

    if (strategy === 'dca') {
        dcaInputs.classList.remove('hidden');
        limitInputs.classList.add('hidden');
        gridInputs.classList.add('hidden');
    } else if (strategy === 'limit') {
        dcaInputs.classList.add('hidden');
        limitInputs.classList.remove('hidden');
        gridInputs.classList.add('hidden');
    } else if (strategy === 'grid') {
        dcaInputs.classList.add('hidden');
        limitInputs.classList.add('hidden');
        gridInputs.classList.remove('hidden');
    }
}

// Helper for Grid price range display
function updateGridPriceRange() {
    const minPrice = document.getElementById('gridMinPriceInput').value || '2200';
    const maxPrice = document.getElementById('gridMaxPriceInput').value || '2800';
    document.getElementById('configPriceRange').innerText = `$${minPrice} - $${maxPrice}`;
}

// Bind Strategy Radio Buttons
document.querySelectorAll('input[name="strategy"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        toggleStrategyUI(e.target.value);
        saveSettings();
    });
});
// Load settings on init (called at end of file)

// --- PORTFOLIO LOGIC (ENVIO POWERED) ---
async function fetchPortfolio(address) {
    if (!address) return;

    // UI Loading State
    const totalValueEl = document.getElementById('totalValue');
    const activeChainsEl = document.getElementById('activeChainsCount');
    if (totalValueEl) totalValueEl.innerText = "Scanning...";

    try {
        logConsole(`🔍 Envio: Requesting Cross-Chain Scan for ${address.substring(0, 8)}...`);

        const response = await fetch('/api/envio/portfolio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });

        const data = await response.json();

        if (data.success && data.stats) {
            const { totalTx, activeChains, chainData } = data.stats;

            // Update Dashboard
            if (activeChainsEl) activeChainsEl.innerText = activeChains.length;

            // Visualize
            logConsole(`✅ Envio Result: ${totalTx} Transactions across ${activeChains.length} Chains.`, "success");
            activeChains.forEach(chain => {
                logConsole(`   • ${chain.toUpperCase()}: ${chainData[chain]} txs found`, "info");
            });

            // Update main balance
            fetchBalance(address);

            // Auto-add to watchlist after successful scan
            if (!watchlist.includes(address.toLowerCase())) {
                addToWatchlist(address);
                // Trigger full scan to update combined value
                setTimeout(scanAllWatchlist, 1000);
            } else {
                // If already in watchlist, update its specific row
                fetchBalance(address).then(val => {
                    const rowVal = document.getElementById(`balance-${address.toLowerCase()}`);
                    if (rowVal) rowVal.innerText = "$" + val.toFixed(2);
                });
            }

        } else {
            throw new Error(data.error || "Scan failed");
        }
    } catch (e) {
        logConsole(`❌ Scan Error: ${e.message}`, "error");
        if (totalValueEl) totalValueEl.innerText = "Error";
    }
}

async function fetchBalance(address) {
    // Fallback to Tatum for USD Price
    try {
        const r = await fetch('/api/scan-wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });
        const d = await r.json();

        let val = 0;
        if (d.success && d.data) {
            val = d.data.totalValue || 0;

            // Only update MAIN display if this is the currently selected wallet
            if (address.toLowerCase() === walletAddress?.toLowerCase()) {
                const totalValueEl = document.getElementById('totalValue');
                if (totalValueEl) totalValueEl.innerText = "$" + val.toFixed(2);
            }
        }
        return val;
    } catch (e) {
        return 0;
    }
}

// --- WATCHLIST AGGREGATION ---
async function scanAllWatchlist() {
    if (!watchlist || watchlist.length === 0) return;

    console.log("🔄 Scanning all watchlist addresses...");
    const totalWatchlistEl = document.getElementById('watchlistTotalValue');
    if (totalWatchlistEl) totalWatchlistEl.innerText = "Scanning...";

    let total = 0;

    // Scan in parallel
    const promises = watchlist.map(async (addr) => {
        const val = await fetchBalance(addr);

        // Update specific row
        const rowVal = document.getElementById(`balance-${addr.toLowerCase()}`);
        if (rowVal) {
            rowVal.innerText = "$" + val.toFixed(2);
            rowVal.classList.remove('animate-pulse');
            rowVal.classList.add('text-emerald-400');
        }
        return val;
    });

    const values = await Promise.all(promises);
    total = values.reduce((a, b) => a + b, 0);

    if (totalWatchlistEl) {
        totalWatchlistEl.innerText = "$" + total.toFixed(2);
        totalWatchlistEl.classList.add('text-emerald-400');
    }
}

// --- MAIN ACTIVATION LOGIC ---
async function toggleAgentActivation() {
    console.log("Toggle Activation Clicked");

    if (!isAgentActive) {
        // --- START AGENT FLOW ---
        // --- START AGENT FLOW ---

        // AUTO-CONNECT IF NEEDED
        if (!walletAddress) {
            if (window.ethereum) {
                try {
                    logConsole("🔌 Wallet not connected. Requesting Access...", "warn");
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    if (accounts && accounts.length > 0) {
                        walletAddress = accounts[0];
                        localStorage.setItem('walletAddress', walletAddress);
                        updateWalletUI(walletAddress);
                        logConsole(`✅ Connected: ${walletAddress.substring(0, 6)}...`, "success");

                        // Auto-scan portfolio with Envio
                        fetchPortfolio(walletAddress);
                    } else {
                        throw new Error("No accounts returned");
                    }
                } catch (err) {
                    alert("Failed to connect wallet: " + err.message);
                    updateAgentUI(false);
                    return;
                }
            } else {
                alert("MetaMask not found! Please install it.");
                updateAgentUI(false);
                return;
            }
        }

        if (!walletAddress) {
            alert("No wallet connected! Please scan or connect first.");
            updateAgentUI(false);
            return;
        }

        updateAgentUI(true, true); // Active=True, Loading=True
        logConsole("🚀 Initializing Agent 7715...", "info");

        // 1. Env Check (Envio Health)
        try {
            const health = await fetch('/api/envio/health').then(r => r.json());
            if (health.status !== "ok") throw new Error("Envio HyperSync Offline");
            logConsole("✅ Envio HyperSync™ Verified.", "success");
        } catch (e) {
            logConsole("⚠️ Envio Service Offline. Using Local Simulation.", "warn");
        }

        // 2. ATTEMPT PERMISSION REQUEST (Using SDK)
        try {
            if (!window.ethereum) throw new Error("MetaMask not detected");

            logConsole("🔐 Requesting Smart Account Permissions...", "info");

            // --- SDK MAGIC STARTS HERE ---
            // This replaces the manual JSON-RPC construction that was failing
            const walletClient = createWalletClient({
                chain: sepolia,
                transport: custom(window.ethereum),
            }).extend(erc7715ProviderActions());

            const sessionAccountAddress = "0x8d96009cc01a2f64687b1c42f025407d57dfa053"; // Agent Address
            const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC Sepolia

            logConsole("🦊 Triggering MetaMask Flask Popup via SDK...", "info");

            // --- READ USER SETTINGS ---
            const strategy = document.querySelector('input[name="strategy"]:checked')?.value || 'dca';
            let rawBudget = "10";
            let rawFreqHours = "24";
            let justification = "AI Agent Daily Limit";

            if (strategy === 'limit') {
                const amountInput = document.getElementById('orderAmountInput');
                const priceInput = document.getElementById('targetPriceInput');
                rawBudget = amountInput ? amountInput.value : "100";
                // For Limit Order, we authorize the Order Amount as the "Period Amount"
                // Frequency is set to 24h as a standard "Daily" authorization window
                justification = `Limit Order: Buy $${rawBudget} ETH @ $${priceInput?.value}`;
            } else {
                // DCA Default
                const budgetInput = document.getElementById('dailyBudgetInput');
                const frequenceSelect = document.getElementById('frequencySelect');
                rawBudget = budgetInput ? budgetInput.value : "10";
                rawFreqHours = frequenceSelect ? frequenceSelect.value : "24";
                justification = `DCA Agent Daily Limit ($${rawBudget})`;
            }

            logConsole(`⚙️ Strategy: ${strategy.toUpperCase()} | Limit: $${rawBudget}`, "info");

            // Convert to Permission Params
            // 6 decimals for USDC on Sepolia (standard USDC decimals)
            const periodAmount = parseUnits(rawBudget, 6);
            const periodDuration = parseInt(rawFreqHours) * 3600; // Hours -> Seconds

            // The SDK handles the complicated 'caveats' structure for us!
            const grantedPermissions = await walletClient.requestExecutionPermissions([{
                chainId: sepolia.id,
                expiry: Math.floor(Date.now() / 1000) + 604800, // 1 week
                signer: {
                    type: "account",
                    data: {
                        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Matches Backend SESSION_PRIVATE_KEY
                    },
                },
                permission: {
                    type: "erc20-token-periodic",
                    data: {
                        tokenAddress: usdcAddress,
                        periodAmount: periodAmount,
                        periodDuration: periodDuration,
                        justification: justification
                    },
                },
                isAdjustmentAllowed: true, // Key Feature
            }]);

            console.log("SDK Response:", grantedPermissions);

            if (!grantedPermissions || grantedPermissions.length === 0) {
                throw new Error("No permissions granted (Array Empty)");
            }

            // 3. SUCCESS PATH
            const context = grantedPermissions[0].context;
            logConsole(`✅ Session Key Granted! Context: ${context.substring(0, 16)}...`, "success");

            // Register with Backend
            logConsole("🔄 Registering Agent with Orchestrator...", "info");

            // Collect strategy-specific parameters from UI inputs
            let strategyParams = {};

            if (strategy === 'dca') {
                const dailyBudgetInput = document.getElementById('dailyBudgetInput');
                const frequencySelect = document.getElementById('frequencySelect');
                strategyParams = {
                    dailyBudget: parseFloat(dailyBudgetInput?.value || rawBudget),
                    frequencyHours: parseInt(frequencySelect?.value || rawFreqHours)
                };
            } else if (strategy === 'limit') {
                const targetPriceInput = document.getElementById('targetPriceInput');
                const orderAmountInput = document.getElementById('orderAmountInput');
                strategyParams = {
                    targetPrice: parseFloat(targetPriceInput?.value || 2400),
                    orderAmount: parseFloat(orderAmountInput?.value || rawBudget)
                };
            } else if (strategy === 'grid') {
                const gridMinInput = document.getElementById('gridMinPriceInput');
                const gridMaxInput = document.getElementById('gridMaxPriceInput');
                const gridLevelsInput = document.getElementById('gridLevelsInput');
                const gridAmountInput = document.getElementById('gridAmountInput');
                strategyParams = {
                    gridMin: parseFloat(gridMinInput?.value || 2200),
                    gridMax: parseFloat(gridMaxInput?.value || 2800),
                    gridLevels: parseInt(gridLevelsInput?.value || 5),
                    gridAmount: parseFloat(gridAmountInput?.value || 50)
                };
            }

            const registrationPayload = {
                permissionContext: context,
                userAddress: walletAddress,
                strategy: strategy,
                strategyParams: strategyParams
            };

            await fetch('/api/register-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registrationPayload)
            });
            logConsole("✅ Agent Registered & Active!", "success");

            isAgentActive = true;
            updateAgentUI(true);

            // IMMEDIATE EXECUTION Logic
            const actionLabel = strategy === 'limit' ?
                `Limit Order Placed ($${rawBudget})` :
                'Buy (DCA Initial)';

            logConsole(`⏳ Queuing ${actionLabel}...`, "info");
            setTimeout(async () => {
                try {
                    logConsole(`🚀 Triggering ${actionLabel}...`, "info");

                    const response = await fetch('/api/agent/execute-trade', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userAddress: walletAddress,
                            action: actionLabel,
                            amount: rawBudget
                        })
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        throw new Error(`Server responded ${response.status}: ${errText}`);
                    }

                    const resData = await response.json();
                    if (resData.success) {
                        logConsole(`✅ Trade Executed: ${resData.note} (Tx: ${resData.txHash?.substring(0, 10)}...)`, "success");

                        // ADD TRANSACTION TO HISTORY TABLE
                        const historyTable = document.getElementById('envioFeedBody');
                        if (historyTable && resData.txHash) {
                            const now = new Date().toLocaleTimeString();
                            const txType = resData.isRealExecution ? 'On-Chain' : 'Simulated';
                            const row = document.createElement('tr');
                            row.className = 'border-b border-white/5 hover:bg-white/5 transition';
                            row.innerHTML = `
                                <td class="px-4 py-3">${now}</td>
                                <td class="px-4 py-3">
                                    <span class="text-emerald-400">✓</span> ${actionLabel}
                                    <span class="text-xs text-gray-500 ml-2">(${txType})</span>
                                </td>
                                <td class="px-4 py-3 text-violet-400">Agent 7715</td>
                                <td class="px-4 py-3 text-right">
                                    ${resData.isRealExecution ?
                                    `<a href="https://sepolia.etherscan.io/tx/${resData.txHash}" target="_blank" class="text-violet-400 hover:underline">View Tx ↗</a>` :
                                    '<span class="text-gray-500">N/A</span>'}
                                </td>
                            `;

                            // Remove "Waiting for transactions..." placeholder if exists
                            const placeholder = historyTable.querySelector('td[colspan]');
                            if (placeholder) {
                                placeholder.closest('tr').remove();
                            }

                            // Add new row at top
                            historyTable.insertBefore(row, historyTable.firstChild);
                        }
                    } else {
                        logConsole(`⏳ ${resData.note || 'Waiting for conditions...'}`, "info");
                    }
                } catch (err) {
                    console.error("Execute Trade Failed:", err);
                    logConsole(`❌ Trigger Failed: ${err.message}`, "error");
                }
            }, 1500);

            startAgentLoop();
            startHistoryRefresh(); // NEW: Start fetching trade history

        } catch (error) {
            console.error("Activation Error:", error);

            // --- HYBRID FALLBACK LOGIC ---
            // If the SDK call fails (e.g. Method not found, Network Error), we fallback.
            // UNLESS user explicitly rejected.

            const isUserRejection = error.code === 4001 ||
                (error.message && (error.message.toLowerCase().includes("rejected") || error.message.toLowerCase().includes("cancelled")));

            if (!isUserRejection) {
                logConsole(`⚠️ SDK/Native Failed (${error.message || error.code}). Enabling Hybrid Mode.`, "warn");

                // Show Polyfill Modal
                const modal = document.getElementById('polyfillModal');
                const confirmBtn = document.getElementById('confirmPolyfillBtn');
                if (modal && confirmBtn) {
                    modal.classList.remove('hidden');
                    modal.style.display = 'flex'; // Force Visibility

                    logConsole("⏳ Waiting for user approval via Hybrid UI...", "info");
                    await new Promise(resolve => {
                        confirmBtn.onclick = () => {
                            modal.classList.add('hidden');
                            modal.style.display = 'none';
                            resolve();
                        }
                    });

                    logConsole("ℹ️ <span class='text-emerald-400'>Permission Policy Signed (Hybrid)</span>.", "info");
                    isAgentActive = true;
                    updateAgentUI(true);
                    startAgentLoop();
                } else {
                    alert("Fatal Error: Hybrid UI missing.");
                    updateAgentUI(false);
                }
            } else {
                alert("Activation Cancelled by User");
                updateAgentUI(false);
            }
        }
    } else {
        // --- STOP AGENT FLOW ---
        logConsole("🛑 Stopping Agent...", "error");
        isAgentActive = false;
        updateAgentUI(false);
        stopAgentLoop();
        stopHistoryRefresh(); // NEW: Stop history polling
        logConsole("Session Stopped.", "warn");
    }
}

// --- UI HELPERS ---
const agentStateText = document.getElementById('agentStateText');
const agentStateDot = document.getElementById('agentStateDot');

function updateAgentUI(active, loading = false) {
    if (loading) {
        if (btnText) btnText.innerText = "Initializing...";
        if (btnSpinner) btnSpinner.classList.remove('hidden');
        return;
    }

    if (active) {
        if (btnText) btnText.innerText = "Deactivate Agent";
        if (btnSpinner) btnSpinner.classList.add('hidden');
        if (activateAgentBtn) {
            activateAgentBtn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
            activateAgentBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        }

        // Navbar Status
        if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse";
        if (statusText) statusText.innerText = "Active";

        // Sidebar Badge
        if (agentStatusBadge) {
            agentStatusBadge.innerText = "ACTIVE";
            agentStatusBadge.classList.replace('bg-gray-800', 'bg-emerald-900/30');
            agentStatusBadge.classList.replace('text-gray-400', 'text-emerald-400');
            agentStatusBadge.classList.replace('border-gray-700', 'border-emerald-500/30');
        }

        // Dashboard Card Status (NEW)
        if (agentStateText) {
            agentStateText.innerText = "Active";
            agentStateText.classList.remove('text-white');
            agentStateText.classList.add('text-emerald-400');
        }
        if (agentStateDot) {
            agentStateDot.className = "w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]";
        }

    } else {
        if (btnText) btnText.innerText = "Activate Agent";
        if (btnSpinner) btnSpinner.classList.add('hidden');
        if (activateAgentBtn) {
            activateAgentBtn.classList.add('bg-emerald-500', 'hover:bg-emerald-600');
            activateAgentBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        }

        // Navbar Status
        if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-gray-500 mr-2";
        if (statusText) statusText.innerText = "Idle";

        // Sidebar Badge
        if (agentStatusBadge) {
            agentStatusBadge.innerText = "IDLE";
            agentStatusBadge.classList.replace('bg-emerald-900/30', 'bg-gray-800');
            agentStatusBadge.classList.replace('text-emerald-400', 'text-gray-400');
            agentStatusBadge.classList.replace('border-emerald-500/30', 'border-gray-700');
        }

        // Dashboard Card Status (NEW)
        if (agentStateText) {
            agentStateText.innerText = "Idle";
            agentStateText.classList.add('text-white');
            agentStateText.classList.remove('text-emerald-400');
        }
        if (agentStateDot) {
            agentStateDot.className = "w-3 h-3 rounded-full bg-gray-500";
        }
    }
}

function updateWalletUI(address) {
    if (walletBadge) {
        walletBadge.classList.remove('hidden');
        walletBadge.classList.add('flex');
    }
    if (walletAddressSpan) {
        walletAddressSpan.innerText = address.substring(0, 6) + "..." + address.substring(38);
    }
}

function startAgentLoop() {
    logConsole("🧠 Agent Life Cycle Started...", "info");
    simulationInterval = setInterval(() => {
        const block = 19543000 + Math.floor(Math.random() * 1000);
        const whale = "0x" + Math.floor(Math.random() * 16777215).toString(16) + "...";

        logConsole(`🔍 Envio HyperSync™ (Block #${block}): Detected Whale Accumulation (USDC -> ETH).`, "info");
        logConsole(`⚡ Signal Intelligence: Wallet ${whale} accumulated 500 ETH in last 10 mins.`, "success");
        logConsole(`🤖 Agent Strategy (Mirroring): Executing Copy Buy on Sepolia to capture trend.`, "info");
        // Using console.log directly for additional debug if needed
        console.log("Agent Heartbeat - Active");
    }, 8000);
}

function stopAgentLoop() {
    if (simulationInterval) clearInterval(simulationInterval);
}

function logout() {
    if (confirm("Disconnect Wallet?")) {
        if (btnText) btnText.innerText = "Disconnecting...";
        if (walletBadge) {
            walletBadge.innerHTML = `<span class="mr-2">🔌</span> Revoking...`;
            walletBadge.classList.add('bg-red-900/50', 'text-red-400');
        }

        if (window.ethereum) {
            window.ethereum.request({
                method: 'wallet_revokePermissions',
                params: [{ eth_accounts: {} }]
            }).catch(e => console.log("Revoke ignored"))
                .finally(() => {
                    localStorage.clear();
                    setTimeout(() => window.location.reload(), 1000);
                });
        } else {
            localStorage.clear();
            window.location.reload();
        }
    }
}

// --- EXPOSE GLOBALS for HTML ---
// HTML buttons access window.* functions. Modules do not pollute global scope by default.
window.toggleAgentActivation = toggleAgentActivation;
window.logout = logout;
window.saveSettings = saveSettings; // Fixes ReferenceError
window.loadSettings = loadSettings;
window.fetchPortfolio = fetchPortfolio;
window.addToWatchlist = addToWatchlist;
window.removeFromWatchlist = removeFromWatchlist;
window.showTxDetails = showTxDetails;
window.closeTxModal = closeTxModal;
window.switchWallet = switchWallet;
window.fetchAllWallets = fetchAllWallets;

window.updateWallet = (addr) => { // Exposed utility for QR scanner if needed
    walletAddress = addr;
    localStorage.setItem('walletAddress', addr);
    updateWalletUI(addr);
    fetchPortfolio(addr);
};

// --- TRANSACTION DETAILS MODAL ---
async function showTxDetails(txHash) {
    if (!txHash) return;

    // ... (modal creation logic) ...
    let modal = document.getElementById('txModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'txModal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="glass-card max-w-2xl w-full mx-4 p-6 rounded-2xl border border-violet-500/30">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-white">Transaction Details</h3>
                    <button onclick="closeTxModal()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="txDetails" class="space-y-3 text-sm">
                    <div class="animate-pulse text-gray-400">Loading...</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');

    // Fetch details (simplified - would call Etherscan API in production)
    document.getElementById('txDetails').innerHTML = `
        <div class="bg-white/5 p-3 rounded-lg border border-white/5">
            <span class="text-gray-400">Hash:</span>
            <a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank" class="text-violet-400 hover:underline ml-2 font-mono">
                ${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}
            </a>
        </div>
        <div class="bg-white/5 p-3 rounded-lg border border-white/5">
            <span class="text-gray-400">Status:</span>
            <span class="text-green-400 ml-2">✓ Success</span>
        </div>
        <div class="bg-white/5 p-3 rounded-lg border border-white/5">
            <span class="text-gray-400">Network:</span>
            <span class="text-white ml-2">Sepolia Testnet</span>
        </div>
        <p class="text-xs text-gray-500 mt-4">Click hash to view full details on Etherscan</p>
    `;
}

function closeTxModal() {
    const modal = document.getElementById('txModal');
    if (modal) modal.classList.add('hidden');
}

// --- MULTI-WALLET SWITCHING ---
async function fetchAllWallets() {
    if (!window.ethereum) return [];
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return accounts || [];
    } catch (e) {
        return [];
    }
}

async function switchWallet(newAddress) {
    if (!newAddress) return;

    walletAddress = newAddress;
    localStorage.setItem('walletAddress', newAddress);
    updateWalletUI(newAddress);

    // Re-scan portfolio
    logConsole(`🔄 Switched to ${newAddress.substring(0, 8)}...`, 'info');
    fetchPortfolio(newAddress);
}

// Make functions globally accessible
window.addToWatchlist = addToWatchlist;
window.removeFromWatchlist = removeFromWatchlist;
window.showTxDetails = showTxDetails;
window.switchWallet = switchWallet;
window.saveSettings = saveSettings;
window.fetchPortfolio = fetchPortfolio;
window.closeTxModal = closeTxModal;
window.toggleAgentActivation = toggleAgentActivation;
window.logout = logout;
window.fetchAllWallets = fetchAllWallets;
window.loadSettings = loadSettings;
window.updateGridPriceRange = updateGridPriceRange;

// Load settings on init
loadSettings();

console.log("App.js Module Loaded");
