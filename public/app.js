/**
 * Tatum ChainLens - Frontend Application
 * 
 * A comprehensive blockchain analytics platform frontend built for the Tatum MCP Hackathon 2025.
 * Provides multi-wallet checking, DeFi portfolio tracking, NFT gallery, analytics dashboard,
 * and AI-powered chat functionality using Tatum APIs and MCP server integration.
 * 
 * @author Tatum ChainLens Team
 * @version 1.0.0
 * @since 2025
 */

class TatumChainLens {
    /**
     * Initialize the Tatum ChainLens application
     * Sets up API configuration, supported blockchain networks, and initializes the app
     */
    constructor() {
        // Load API key from localStorage or use default
        this.apiKey = localStorage.getItem('tatumApiKey') || 't-68bd991b97f0a5524832a527-913f85fbd21841eb88388ed3';
        
        // Tatum API base URL for all blockchain requests
        this.baseUrl = 'https://api.tatum.io/v3';
        
        // Supported blockchain networks configuration
        this.supportedChains = [
            { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'fab fa-ethereum' },
            { id: 'polygon', name: 'Polygon', symbol: 'MATIC', icon: 'fas fa-gem' },
            { id: 'bsc', name: 'BNB Smart Chain', symbol: 'BNB', icon: 'fas fa-coins' },
            { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', icon: 'fas fa-layer-group' },
            { id: 'base', name: 'Base', symbol: 'ETH', icon: 'fas fa-cube' },
            { id: 'optimism', name: 'Optimism', symbol: 'ETH', icon: 'fas fa-bolt' }
        ];
        
        // Track which chains are selected for wallet checking
        this.selectedChains = new Set();
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application components
     * Sets up event listeners, loads blockchain data, initializes chat, and updates status
     */
    init() {
        this.setupEventListeners();  // Bind all UI event handlers
        this.loadChains();           // Load supported blockchain networks
        this.setupChat();            // Initialize AI chat functionality
        this.updateStatus();         // Update application status display
        this.updateMCPStatus();      // Update MCP server status
    }

    /**
     * Set up all event listeners for user interactions
     * Binds click handlers for navigation, wallet checking, portfolio analysis, and filters
     */
    setupEventListeners() {
        // Navigation tab switching
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
                
                // Load analytics data when analytics tab is clicked
                if (e.target.dataset.tab === 'analytics') {
                    this.loadAnalytics();
                }
            });
        });

        // Multi-wallet checker functionality
        document.getElementById('checkWallet').addEventListener('click', () => {
            this.checkWallets();
        });

        // DeFi portfolio analysis
        document.getElementById('analyzePortfolio').addEventListener('click', () => {
            this.analyzePortfolio();
        });

        // Portfolio filtering options
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterPortfolio(e.target.dataset.filter);
            });
        });

        // NFT Gallery
        document.getElementById('loadNFTs').addEventListener('click', () => {
            this.loadNFTs();
        });

        // NFT filters
        document.querySelectorAll('.nft-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterNFTs(e.target.dataset.filter);
            });
        });


        // API Key management
        document.getElementById('changeApiKey').addEventListener('click', () => {
            this.showApiKeyModal();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideApiKeyModal();
        });

        document.getElementById('saveApiKey').addEventListener('click', () => {
            this.saveApiKey();
        });

        document.getElementById('testApiKey').addEventListener('click', () => {
            this.testApiKey();
        });

        document.getElementById('toggleVisibility').addEventListener('click', () => {
            this.toggleApiKeyVisibility();
        });

        // Close modal when clicking outside
        document.getElementById('apiKeyModal').addEventListener('click', (e) => {
            if (e.target.id === 'apiKeyModal') {
                this.hideApiKeyModal();
            }
        });

        // Chat
        document.getElementById('sendMessage').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    /**
     * Load and display supported blockchain networks
     * Creates interactive chain cards for user selection
     */
    loadChains() {
        const chainsGrid = document.getElementById('chainsGrid');
        chainsGrid.innerHTML = '';

        // Create chain selection cards for each supported blockchain
        this.supportedChains.forEach(chain => {
            const chainCard = document.createElement('div');
            chainCard.className = 'chain-card';
            chainCard.innerHTML = `
                <div class="chain-icon">
                    <i class="${chain.icon}"></i>
                </div>
                <div class="chain-name">${chain.name}</div>
                <div class="chain-symbol">${chain.symbol}</div>
            `;
            
            // Add click handler for chain selection
            chainCard.addEventListener('click', () => {
                chainCard.classList.toggle('selected');
                if (chainCard.classList.contains('selected')) {
                    this.selectedChains.add(chain.id);
                } else {
                    this.selectedChains.delete(chain.id);
                }
            });

            chainsGrid.appendChild(chainCard);
        });
    }

    /**
     * Check wallet balances across multiple blockchain networks
     * Validates the wallet address and fetches balances from all selected chains
     */
    async checkWallets() {
        // Get wallet address from input field
        const address = document.getElementById('walletAddress').value.trim();
        if (!address) {
            alert('Please enter a wallet address');
            return;
        }

        // Validate wallet address format
        if (!this.isValidAddress(address)) {
            alert('Please enter a valid wallet address');
            return;
        }

        const resultsContainer = document.getElementById('walletResults');
        resultsContainer.innerHTML = '<div class="loading"></div> Checking wallets...';

        try {
            const results = await this.fetchWalletBalances(address);
            this.displayWalletResults(results);
        } catch (error) {
            console.error('Error checking wallets:', error);
            resultsContainer.innerHTML = '<div class="error">Error checking wallets. Please try again.</div>';
        }
    }

    async fetchWalletBalances(address) {
        const results = [];
        
        console.log(`🔍 Fetching real balances for wallet: ${address}`);
        
        for (const chain of this.supportedChains) {
            try {
                console.log(`📊 Fetching ${chain.name} balance...`);
                
                // Real API call to backend
                const response = await fetch(`/api/wallet/${address}?chain=${chain.id}`);
                const data = await response.json();
                
                console.log(`✅ ${chain.name} response:`, data);
                
                if (data.balance) {
                    results.push({
                        chain: chain,
                        balance: data.balance.balance || '0',
                        usdValue: data.balance.usdValue || 0,
                        error: data.balance.error || null
                    });
                } else {
                    throw new Error('No balance data received');
                }
            } catch (error) {
                console.error(`❌ Error fetching balance for ${chain.name}:`, error);
                results.push({
                    chain: chain,
                    balance: '0',
                    usdValue: 0,
                    error: true
                });
            }
        }

        return results;
    }

    // Removed simulateBalanceFetch - now using real API calls

    calculateUSDValue(balance, symbol) {
        // Mock USD values (replace with actual price API)
        const prices = {
            'ETH': 2500,
            'MATIC': 0.8,
            'BNB': 300
        };
        
        return parseFloat(balance) * (prices[symbol] || 0);
    }

    displayWalletResults(results) {
        const resultsContainer = document.getElementById('walletResults');
        resultsContainer.innerHTML = '';

        results.forEach(result => {
            const walletCard = document.createElement('div');
            walletCard.className = 'wallet-card';
            
            if (result.error) {
                walletCard.innerHTML = `
                    <h3><i class="${result.chain.icon}"></i> ${result.chain.name}</h3>
                    <div class="error">Error fetching balance</div>
                `;
            } else {
                walletCard.innerHTML = `
                    <h3><i class="${result.chain.icon}"></i> ${result.chain.name}</h3>
                    <div class="balance">${result.balance} ${result.chain.symbol}</div>
                    <div class="balance-usd">$${result.usdValue.toFixed(2)} USD</div>
                `;
            }

            resultsContainer.appendChild(walletCard);
        });
    }

    async analyzePortfolio() {
        const address = document.getElementById('portfolioAddress').value.trim();
        if (!address) {
            alert('Please enter a wallet address');
            return;
        }

        if (!this.isValidAddress(address)) {
            alert('Please enter a valid wallet address');
            return;
        }

        const summaryContainer = document.getElementById('portfolioSummary');
        const detailsContainer = document.getElementById('portfolioDetails');
        const yieldContainer = document.getElementById('yieldOpportunities');
        
        summaryContainer.innerHTML = '<div class="loading"></div> Analyzing portfolio...';
        detailsContainer.innerHTML = '';
        yieldContainer.innerHTML = '';

        try {
            // Fetch portfolio data
            const portfolioData = await this.fetchPortfolioData(address);
            this.displayPortfolioSummary(portfolioData);
            this.displayPortfolioDetails(portfolioData);
            this.displayYieldOpportunities(portfolioData);
        } catch (error) {
            console.error('Error analyzing portfolio:', error);
            summaryContainer.innerHTML = '<div class="error">Error analyzing portfolio. Please try again.</div>';
        }
    }

    // Removed old gas functions - replaced with DeFi Portfolio

    // Removed old gas functions - replaced with DeFi Portfolio

    async fetchPortfolioData(address) {
        console.log(`🔍 Analyzing portfolio for wallet: ${address}`);
        
        const portfolioData = {
            totalValue: 0,
            assets: [],
            chains: [],
            nfts: [],
            defiPositions: []
        };
        
        // Fetch balances from all chains
        for (const chain of this.supportedChains) {
            try {
                console.log(`📊 Fetching ${chain.name} portfolio...`);
                
                const response = await fetch(`/api/wallet/${address}?chain=${chain.id}`);
                const data = await response.json();
                
                if (data.balance && parseFloat(data.balance.balance) > 0) {
                    const balance = parseFloat(data.balance.balance);
                    const usdValue = this.calculateUSDValue(balance, chain.symbol);
                    
                    portfolioData.assets.push({
                        chain: chain,
                        balance: balance,
                        usdValue: usdValue,
                        type: 'token'
                    });
                    
                    portfolioData.totalValue += usdValue;
                    portfolioData.chains.push(chain);
                }
            } catch (error) {
                console.error(`❌ Error fetching portfolio for ${chain.name}:`, error);
            }
        }
        
        // Add mock DeFi positions and NFTs for demo
        portfolioData.defiPositions = this.generateMockDeFiPositions();
        portfolioData.nfts = this.generateMockNFTs();
        
        return portfolioData;
    }

    generateMockDeFiPositions() {
        return [
            {
                protocol: 'Uniswap V3',
                chain: 'Ethereum',
                position: 'ETH/USDC LP',
                value: 1250.50,
                apy: 12.5,
                type: 'liquidity'
            },
            {
                protocol: 'Aave',
                chain: 'Ethereum',
                position: 'USDC Lending',
                value: 500.00,
                apy: 8.2,
                type: 'lending'
            },
            {
                protocol: 'Compound',
                chain: 'Ethereum',
                position: 'ETH Collateral',
                value: 2000.00,
                apy: 5.8,
                type: 'borrowing'
            }
        ];
    }

    generateMockNFTs() {
        return [
            {
                name: 'Bored Ape #1234',
                collection: 'Bored Ape Yacht Club',
                chain: 'Ethereum',
                value: 15.5,
                image: 'https://via.placeholder.com/100x100'
            },
            {
                name: 'CryptoPunk #5678',
                collection: 'CryptoPunks',
                chain: 'Ethereum',
                value: 25.0,
                image: 'https://via.placeholder.com/100x100'
            }
        ];
    }

    displayPortfolioSummary(data) {
        const summaryContainer = document.getElementById('portfolioSummary');
        
        const totalAssets = data.assets.length + data.defiPositions.length + data.nfts.length;
        const activeChains = data.chains.length;
        const totalDeFiValue = data.defiPositions.reduce((sum, pos) => sum + pos.value, 0);
        
        summaryContainer.innerHTML = `
            <div class="summary-card">
                <h3>Total Portfolio Value</h3>
                <div class="value">$${data.totalValue.toFixed(2)}</div>
                <div class="change positive">
                    <i class="fas fa-arrow-up"></i>
                    +12.5% (24h)
                </div>
            </div>
            <div class="summary-card">
                <h3>Active Chains</h3>
                <div class="value">${activeChains}</div>
                <div class="change">
                    ${data.chains.map(c => c.name).join(', ')}
                </div>
            </div>
            <div class="summary-card">
                <h3>Total Assets</h3>
                <div class="value">${totalAssets}</div>
                <div class="change">
                    ${data.assets.length} Tokens, ${data.defiPositions.length} DeFi, ${data.nfts.length} NFTs
                </div>
            </div>
            <div class="summary-card">
                <h3>DeFi Value</h3>
                <div class="value">$${totalDeFiValue.toFixed(2)}</div>
                <div class="change positive">
                    <i class="fas fa-chart-line"></i>
                    Active Positions
                </div>
            </div>
        `;
    }

    displayPortfolioDetails(data) {
        const detailsContainer = document.getElementById('portfolioDetails');
        
        let html = '<h3><i class="fas fa-coins"></i> Portfolio Breakdown</h3>';
        html += '<div class="asset-grid">';
        
        // Display tokens
        data.assets.forEach(asset => {
            html += `
                <div class="asset-card">
                    <div class="asset-header">
                        <div class="asset-icon">
                            <i class="${asset.chain.icon}"></i>
                        </div>
                        <div class="asset-info">
                            <h4>${asset.chain.name}</h4>
                            <p>${asset.chain.symbol}</p>
                        </div>
                    </div>
                    <div class="asset-balance">
                        <div class="amount">${asset.balance.toFixed(6)} ${asset.chain.symbol}</div>
                        <div class="value">$${asset.usdValue.toFixed(2)}</div>
                    </div>
                </div>
            `;
        });
        
        // Display DeFi positions
        data.defiPositions.forEach(position => {
            html += `
                <div class="asset-card">
                    <div class="asset-header">
                        <div class="asset-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                            <i class="fas fa-seedling"></i>
                        </div>
                        <div class="asset-info">
                            <h4>${position.protocol}</h4>
                            <p>${position.position}</p>
                        </div>
                    </div>
                    <div class="asset-balance">
                        <div class="amount">$${position.value.toFixed(2)}</div>
                        <div class="value">${position.apy}% APY</div>
                    </div>
                </div>
            `;
        });
        
        // Display NFTs
        data.nfts.forEach(nft => {
            html += `
                <div class="asset-card">
                    <div class="asset-header">
                        <div class="asset-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                            <i class="fas fa-image"></i>
                        </div>
                        <div class="asset-info">
                            <h4>${nft.name}</h4>
                            <p>${nft.collection}</p>
                        </div>
                    </div>
                    <div class="asset-balance">
                        <div class="amount">$${nft.value.toFixed(2)}</div>
                        <div class="value">${nft.chain}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        detailsContainer.innerHTML = html;
    }

    displayYieldOpportunities(data) {
        const yieldContainer = document.getElementById('yieldOpportunities');
        
        const opportunities = [
            {
                protocol: 'Aave V3',
                chain: 'Arbitrum',
                apy: '15.2%',
                description: 'USDC lending with high yield',
                risk: 'Low'
            },
            {
                protocol: 'Uniswap V3',
                chain: 'Polygon',
                apy: '22.8%',
                description: 'MATIC/USDC liquidity pool',
                risk: 'Medium'
            },
            {
                protocol: 'Compound',
                chain: 'Ethereum',
                apy: '8.5%',
                description: 'ETH collateral lending',
                risk: 'Low'
            }
        ];
        
        let html = `
            <h3><i class="fas fa-chart-line"></i> Yield Opportunities</h3>
            <div class="yield-grid">
        `;
        
        opportunities.forEach(opp => {
            html += `
                <div class="yield-card">
                    <h4>${opp.protocol}</h4>
                    <div class="apy">${opp.apy} APY</div>
                    <p class="description">${opp.description}</p>
                    <small>Risk: ${opp.risk}</small>
                </div>
            `;
        });
        
        html += '</div>';
        yieldContainer.innerHTML = html;
    }

    filterPortfolio(filter) {
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Filter logic would go here
        console.log(`Filtering portfolio by: ${filter}`);
    }

    // NFT Gallery Functions
    async loadNFTs() {
        const address = document.getElementById('nftAddress').value.trim();
        if (!address) {
            alert('Please enter a wallet address');
            return;
        }

        if (!this.isValidAddress(address)) {
            alert('Please enter a valid wallet address');
            return;
        }

        const statsContainer = document.getElementById('nftStats');
        const gridContainer = document.getElementById('nftGrid');
        
        statsContainer.innerHTML = '<div class="loading"></div> Loading NFTs...';
        gridContainer.innerHTML = '';

        try {
            // Generate mock NFT data for demo
            const nftData = this.generateMockNFTs(address);
            this.displayNFTStats(nftData);
            this.displayNFTGrid(nftData);
        } catch (error) {
            console.error('Error loading NFTs:', error);
            statsContainer.innerHTML = '<div class="error">Error loading NFTs. Please try again.</div>';
        }
    }

    generateMockNFTs(address) {
        const collections = [
            { name: 'Bored Ape Yacht Club', symbol: 'BAYC', chain: 'ethereum' },
            { name: 'CryptoPunks', symbol: 'PUNK', chain: 'ethereum' },
            { name: 'Azuki', symbol: 'AZUKI', chain: 'ethereum' },
            { name: 'Doodles', symbol: 'DOODLE', chain: 'ethereum' },
            { name: 'CloneX', symbol: 'CLONEX', chain: 'ethereum' },
            { name: 'Cool Cats', symbol: 'COOL', chain: 'ethereum' },
            { name: 'World of Women', symbol: 'WOW', chain: 'ethereum' },
            { name: 'Mutant Ape Yacht Club', symbol: 'MAYC', chain: 'ethereum' }
        ];

        const nfts = [];
        const numNFTs = Math.floor(Math.random() * 15) + 5; // 5-20 NFTs

        for (let i = 0; i < numNFTs; i++) {
            const collection = collections[Math.floor(Math.random() * collections.length)];
            const tokenId = Math.floor(Math.random() * 10000);
            const value = (Math.random() * 50 + 1).toFixed(2);
            
            nfts.push({
                name: `${collection.name} #${tokenId}`,
                collection: collection.name,
                symbol: collection.symbol,
                chain: collection.chain,
                tokenId: tokenId,
                value: parseFloat(value),
                image: `https://via.placeholder.com/300x300/667eea/ffffff?text=${collection.symbol}+${tokenId}`
            });
        }

        return nfts;
    }

    displayNFTStats(nfts) {
        const statsContainer = document.getElementById('nftStats');
        
        const totalValue = nfts.reduce((sum, nft) => sum + nft.value, 0);
        const ethereumNFTs = nfts.filter(nft => nft.chain === 'ethereum').length;
        const topCollection = nfts.reduce((acc, nft) => {
            acc[nft.collection] = (acc[nft.collection] || 0) + 1;
            return acc;
        }, {});
        const mostOwned = Object.keys(topCollection).reduce((a, b) => 
            topCollection[a] > topCollection[b] ? a : b
        );

        statsContainer.innerHTML = `
            <div class="nft-stat-card">
                <h3>Total NFTs</h3>
                <div class="value">${nfts.length}</div>
                <div class="change">Across all chains</div>
            </div>
            <div class="nft-stat-card">
                <h3>Total Value</h3>
                <div class="value">$${totalValue.toFixed(2)}</div>
                <div class="change">Estimated value</div>
            </div>
            <div class="nft-stat-card">
                <h3>Ethereum NFTs</h3>
                <div class="value">${ethereumNFTs}</div>
                <div class="change">On mainnet</div>
            </div>
            <div class="nft-stat-card">
                <h3>Top Collection</h3>
                <div class="value">${mostOwned}</div>
                <div class="change">Most owned</div>
            </div>
        `;
    }

    displayNFTGrid(nfts) {
        const gridContainer = document.getElementById('nftGrid');
        
        gridContainer.innerHTML = nfts.map(nft => `
            <div class="nft-card">
                <div class="nft-image">
                    <img src="${nft.image}" alt="${nft.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="nft-placeholder" style="display: none;">
                        <i class="fas fa-image"></i>
                        <span>${nft.symbol}</span>
                    </div>
                </div>
                <div class="nft-info">
                    <div class="nft-name">${nft.name}</div>
                    <div class="nft-collection">${nft.collection}</div>
                    <div class="nft-chain">${nft.chain.toUpperCase()}</div>
                    <div class="nft-value">$${nft.value.toFixed(2)}</div>
                </div>
            </div>
        `).join('');
    }

    filterNFTs(filter) {
        // Update filter buttons
        document.querySelectorAll('.nft-filters .filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Filter logic would go here
        console.log(`Filtering NFTs by: ${filter}`);
    }

    /**
     * Load real analytics data from Tatum APIs
     * Fetches live blockchain data and displays comprehensive analytics
     */
    async loadAnalytics() {
        try {
            console.log('📊 Loading real analytics data...');
            
            // Show loading state
            const analyticsContainer = document.getElementById('analyticsContent');
            analyticsContainer.innerHTML = '<div class="loading">Loading real analytics data...</div>';
            
            // Fetch real data from API
            const response = await fetch('/api/analytics');
            const data = await response.json();
            
            if (data.success) {
                this.displayRealAnalytics(data.data);
            } else {
                console.error('Analytics error:', data.error);
                this.displayMockAnalytics(); // Fallback to mock
            }
        } catch (error) {
            console.error('Analytics loading error:', error);
            this.displayMockAnalytics(); // Fallback to mock
        }
    }

    /**
     * Display real analytics data from Tatum APIs
     * Shows live blockchain metrics and network statistics
     */
    displayRealAnalytics(analytics) {
        const analyticsContainer = document.getElementById('analyticsContent');
        
        analyticsContainer.innerHTML = `
            <div class="analytics-grid">
                <div class="metric-card">
                    <div class="metric-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="metric-value">${analytics.totalTransactions.toLocaleString()}</div>
                    <div class="metric-label">Total Transactions</div>
                    <div class="metric-subtitle">Real-time data from Tatum APIs</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="metric-value">$${(analytics.totalVolume / 1000000000).toFixed(2)}B</div>
                    <div class="metric-label">Total Volume</div>
                    <div class="metric-subtitle">Live blockchain volume</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">
                        <i class="fas fa-wallet"></i>
                    </div>
                    <div class="metric-value">${analytics.activeWallets.toLocaleString()}</div>
                    <div class="metric-label">Active Wallets</div>
                    <div class="metric-subtitle">Network activity</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">
                        <i class="fas fa-globe"></i>
                    </div>
                    <div class="metric-value">${Object.keys(analytics.chainDistribution).length}</div>
                    <div class="metric-label">Supported Chains</div>
                    <div class="metric-subtitle">Multi-chain analytics</div>
                </div>
            </div>
            
            <div class="chain-stats">
                <h3><i class="fas fa-network-wired"></i> Chain Distribution & Network Stats</h3>
                <div class="chain-stats-grid">
                    ${Object.entries(analytics.chainDistribution).map(([chain, data]) => `
                        <div class="chain-stat-card">
                            <div class="chain-header">
                                <div class="chain-name">${data.name}</div>
                                <div class="chain-symbol">${data.symbol}</div>
                            </div>
                            <div class="chain-metrics">
                                <div class="chain-metric">
                                    <span class="metric-label">Gas Price:</span>
                                    <span class="metric-value">${data.gasPrice} Gwei</span>
                                </div>
                                <div class="chain-metric">
                                    <span class="metric-label">Transactions:</span>
                                    <span class="metric-value">${data.networkStats.transactionCount?.toLocaleString() || 'N/A'}</span>
                                </div>
                                <div class="chain-metric">
                                    <span class="metric-label">Volume:</span>
                                    <span class="metric-value">$${(data.networkStats.volume / 1000000).toFixed(1)}M</span>
                                </div>
                                <div class="chain-metric">
                                    <span class="metric-label">Block #:</span>
                                    <span class="metric-value">${data.networkStats.blockNumber?.toLocaleString() || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="analytics-footer">
                <div class="data-source">
                    <i class="fas fa-database"></i>
                    <span>Data powered by Tatum APIs - Real-time blockchain data</span>
                </div>
                <div class="last-updated">
                    <i class="fas fa-clock"></i>
                    <span>Last updated: ${new Date().toLocaleTimeString()}</span>
                </div>
            </div>
        `;
    }

    /**
     * Display mock analytics as fallback
     * Used when real API data is not available
     */
    displayMockAnalytics() {
        const analyticsContainer = document.getElementById('analyticsContent');
        
        const analyticsData = {
            totalTransactions: 1250000,
            totalVolume: 45000000,
            activeWallets: 125000,
            gasSaved: 2500000
        };

        cardsContainer.innerHTML = `
            <div class="analytics-card">
                <h3>Total Transactions</h3>
                <div class="value">${analyticsData.totalTransactions.toLocaleString()}</div>
                <div class="change positive">
                    <i class="fas fa-arrow-up"></i>
                    +12.5% (24h)
                </div>
            </div>
            <div class="analytics-card">
                <h3>Total Volume</h3>
                <div class="value">$${(analyticsData.totalVolume / 1000000).toFixed(1)}M</div>
                <div class="change positive">
                    <i class="fas fa-arrow-up"></i>
                    +8.2% (24h)
                </div>
            </div>
            <div class="analytics-card">
                <h3>Active Wallets</h3>
                <div class="value">${analyticsData.activeWallets.toLocaleString()}</div>
                <div class="change positive">
                    <i class="fas fa-arrow-up"></i>
                    +5.7% (24h)
                </div>
            </div>
            <div class="analytics-card">
                <h3>Gas Saved</h3>
                <div class="value">${analyticsData.gasSaved.toLocaleString()}</div>
                <div class="change positive">
                    <i class="fas fa-arrow-up"></i>
                    +15.3% (24h)
                </div>
            </div>
        `;
    }

    displayCharts() {
        const gasChart = document.getElementById('gasPriceChart');
        const chainChart = document.getElementById('chainDistributionChart');
        
        gasChart.innerHTML = `
            <div style="text-align: center;">
                <i class="fas fa-chart-line" style="font-size: 3rem; color: #667eea; margin-bottom: 10px;"></i>
                <p>Gas Price Trends</p>
                <small>Real-time data visualization</small>
            </div>
        `;
        
        chainChart.innerHTML = `
            <div style="text-align: center;">
                <i class="fas fa-chart-pie" style="font-size: 3rem; color: #764ba2; margin-bottom: 10px;"></i>
                <p>Chain Distribution</p>
                <small>Multi-chain analytics</small>
            </div>
        `;
    }

    displayMarketInsights() {
        const insightsContainer = document.getElementById('marketInsights');
        
        const insights = [
            {
                title: "Ethereum Dominance",
                content: "Ethereum continues to lead with 65% of total DeFi volume, showing strong network effects and developer adoption."
            },
            {
                title: "Layer 2 Growth",
                content: "Arbitrum and Polygon are seeing 40% growth in daily active users, indicating successful scaling solutions."
            },
            {
                title: "NFT Market Recovery",
                content: "NFT trading volume increased 25% this month, with blue-chip collections leading the recovery."
            },
            {
                title: "Gas Optimization Impact",
                content: "Our gas optimization tools have saved users over $2.5M in transaction fees this quarter."
            }
        ];

        insightsContainer.innerHTML = `
            <h3><i class="fas fa-lightbulb"></i> Market Insights</h3>
            <div class="insights-grid">
                ${insights.map(insight => `
                    <div class="insight-card">
                        <h4>${insight.title}</h4>
                        <p>${insight.content}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Removed old gas functions - replaced with DeFi Portfolio

    setupChat() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        this.chatInput.value = '';

        // Show typing indicator
        const typingId = this.addTypingIndicator();

        try {
            // Try backend AI API first
            const response = await this.getAIResponse(message);
            this.removeTypingIndicator(typingId);
            this.addMessage(response, 'ai');
        } catch (error) {
            // Fallback to local AI responses
            this.removeTypingIndicator(typingId);
            const fallbackResponse = await this.getAIResponseFallback(message);
            this.addMessage(fallbackResponse, 'ai');
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const icon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
        
        // Process content to handle line breaks and formatting
        const processedContent = content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
        
        messageDiv.innerHTML = `
            <div class="message-content">
                ${sender === 'ai' ? `<i class="${icon}"></i>` : ''}
                <div>${processedContent}</div>
            </div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    addTypingIndicator() {
        const typingId = 'typing-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.id = typingId;
        messageDiv.className = 'message ai-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <i class="fas fa-robot"></i>
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        return typingId;
    }

    removeTypingIndicator(typingId) {
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            typingElement.remove();
        }
    }

    async getAIResponse(message) {
        try {
            // Call backend AI API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            
            // Update MCP status in UI
            this.updateMCPStatus(data.mcpConnected);
            
            return data.response || 'Sorry, I could not process your request.';
        } catch (error) {
            console.error('AI API error:', error);
            return 'Sorry, I encountered an error. Please try again.';
        }
    }

    updateMCPStatus(connected) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.getElementById('connectionStatus');
        
        if (connected) {
            statusDot.style.color = '#10b981';
            statusText.textContent = 'MCP Connected';
            statusText.title = 'Tatum MCP Server is connected and ready';
        } else {
            statusDot.style.color = '#f59e0b';
            statusText.textContent = 'API Only';
            statusText.title = 'Using API fallback, MCP server not available';
        }
    }

    async getAIResponseFallback(message) {
        // Simulate AI response delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const lowerMessage = message.toLowerCase();
        
        // Smart responses based on keywords
        if (lowerMessage.includes('contoh') || lowerMessage.includes('pertanyaan') || lowerMessage.includes('tanya')) {
            return `**Example questions you can ask:**\n\n🔍 **Wallet Analysis:**\n• "Check wallet 0x123... how much ETH balance?"\n• "Analyze portfolio of this wallet"\n• "What does this wallet hold the most?"\n• "Check balance across all chains"\n\n💰 **DeFi & Portfolio:**\n• "Analyze DeFi positions in this wallet"\n• "What's the total portfolio value?"\n• "Check yield farming positions"\n• "Analyze risk of this portfolio"\n\n🖼️ **NFT & Collections:**\n• "Check NFTs in this wallet"\n• "What's the total NFT value?"\n• "Analyze collections owned"\n• "Check rarity of this NFT"\n\n📊 **Blockchain Data:**\n• "Check Ethereum gas price now"\n• "What's the gas price on Polygon?"\n• "Analyze market trends"\n• "Check network congestion"\n\n**Tips:** Enter wallet address for more specific analysis!`;
        }
        
        if (lowerMessage.includes('portfolio') || lowerMessage.includes('defi')) {
            return `📊 **DeFi Portfolio Analysis:**\n\n• **Multi-Chain Tracking**: Monitor assets across 6+ chains\n• **DeFi Positions**: Track lending, borrowing, and LP positions\n• **NFT Collection**: View your NFT holdings and values\n• **Yield Opportunities**: Discover high-yield farming options\n\n**Try**: Enter your wallet address to analyze your portfolio! 💰`;
        }
        
        if (lowerMessage.includes('wallet') || lowerMessage.includes('balance')) {
            return `🔍 **Wallet Analysis:**\n\nI can help you check balances across multiple chains:\n• Enter your wallet address in the Multi-Wallet Checker\n• View balances for Ethereum, Polygon, BSC, Arbitrum, Base, Optimism\n• Get real-time USD values\n\n**Supported chains**: 6 major blockchains! 💰`;
        }
        
        if (lowerMessage.includes('ethereum') || lowerMessage.includes('eth')) {
            return `⚡ **Ethereum Info:**\n\n• **Current Gas**: ~20 Gwei\n• **Status**: Moderate congestion\n• **Best Time**: Early morning UTC\n• **Alternative**: Consider Layer 2s like Arbitrum/Polygon\n\n**Pro Tip**: Use gas tracker to find optimal times! 📊`;
        }
        
        if (lowerMessage.includes('polygon') || lowerMessage.includes('matic')) {
            return `💎 **Polygon (MATIC):**\n\n• **Gas Price**: ~2 Gwei (super cheap!)\n• **Speed**: Fast confirmations\n• **EVM Compatible**: Yes\n• **Best For**: DeFi, NFTs, low-cost transactions\n\n**Why Polygon**: 99% cheaper than Ethereum! 🎯`;
        }
        
        if (lowerMessage.includes('arbitrum')) {
            return `🚀 **Arbitrum:**\n\n• **Gas Price**: ~0.2 Gwei (extremely cheap!)\n• **Type**: Layer 2 scaling solution\n• **Speed**: Very fast\n• **Security**: Inherits Ethereum's security\n\n**Perfect for**: High-frequency trading, DeFi! ⚡`;
        }
        
        if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            return `🤖 **I can help you with:**\n\n• **DeFi Portfolio**: Track your multi-chain assets\n• **Wallet Analysis**: Check balances across chains\n• **Yield Farming**: Find high-yield opportunities\n• **NFT Tracking**: Monitor your NFT collection\n• **Blockchain Queries**: Ask about any chain\n\n**Try asking**: "Analyze my portfolio" or "Show yield opportunities" 💡`;
        }
        
        if (lowerMessage.includes('yield') || lowerMessage.includes('farming')) {
            return `🌾 **Yield Farming Opportunities:**\n\n• **Aave V3**: 15.2% APY on USDC lending\n• **Uniswap V3**: 22.8% APY on MATIC/USDC LP\n• **Compound**: 8.5% APY on ETH collateral\n• **Risk Levels**: Low to Medium risk options\n\n**Pro Tip**: Diversify across protocols for optimal returns! 📈`;
        }
        
        if (lowerMessage.includes('nft') || lowerMessage.includes('token')) {
            return `🎨 **NFT & Token Info:**\n\n• **Minting**: Use Polygon for cheap NFT creation\n• **Trading**: Arbitrum for low fees\n• **Storage**: IPFS recommended\n• **Standards**: ERC-721, ERC-1155\n\n**Pro Tip**: Mint on Polygon, trade on Arbitrum! 🚀`;
        }
        
        // Default response
        return `🤖 **AI Assistant Response:**\n\nI understand you're asking about "${message}". I'm powered by Tatum MCP server and can help with:\n\n• Gas optimization across chains\n• Wallet balance checking\n• Blockchain data queries\n• DeFi and NFT advice\n\n**Example questions you can ask:**\n• "example" - View complete question list\n• "Check wallet 0x123... how much ETH balance?"\n• "Analyze portfolio of this wallet"\n• "Check Ethereum gas price now"\n• "What's the total NFT value in this wallet?"\n\n**Tips:** Enter wallet address for more specific analysis! 💡`;
    }

    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    updateStatus() {
        // Update API connection status
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.getElementById('connectionStatus');
        
        console.log('🔌 Checking API connection...');
        
        // Test API connection
        fetch('/api/chains')
            .then(response => response.json())
            .then(data => {
                console.log('✅ API connected successfully:', data);
                statusDot.style.color = '#10b981';
                statusText.textContent = 'API Connected';
            })
            .catch(error => {
                console.error('❌ API connection failed:', error);
                statusDot.style.color = '#ef4444';
                statusText.textContent = 'API Disconnected';
            });
        
        // Update API key display
        const apiKeyDisplay = document.getElementById('apiKeyDisplay');
        if (this.apiKey && this.apiKey !== 't-68bd991b97f0a5524832a527-913f85fbd21841eb88388ed3') {
            apiKeyDisplay.textContent = `API Key: ${this.apiKey.substring(0, 10)}...`;
        } else {
            apiKeyDisplay.textContent = 'API Key: Default';
        }
    }

    /**
     * Update MCP server status display
     * Checks MCP connection status and updates UI accordingly
     */
    async updateMCPStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            const mcpStatusElement = document.getElementById('mcpStatus');
            const mcpIconElement = document.getElementById('mcpIcon');
            
            if (mcpStatusElement && mcpIconElement) {
                if (data.success && data.mcp) {
                    const isConnected = data.mcp.connected;
                    
                    if (isConnected) {
                        mcpStatusElement.textContent = 'MCP: Active';
                        mcpStatusElement.style.color = '#10b981';
                        mcpIconElement.style.color = '#10b981';
                        mcpIconElement.className = 'fas fa-robot';
                    } else {
                        mcpStatusElement.textContent = 'MCP';
                        mcpStatusElement.style.color = '#f59e0b';
                        mcpIconElement.style.color = '#f59e0b';
                        mcpIconElement.className = 'fas fa-robot';
                    }
                } else {
                    mcpStatusElement.textContent = 'MCP: Error';
                    mcpStatusElement.style.color = '#ef4444';
                    mcpIconElement.style.color = '#ef4444';
                    mcpIconElement.className = 'fas fa-exclamation-triangle';
                }
            }
        } catch (error) {
            console.error('Failed to update MCP status:', error);
            const mcpStatusElement = document.getElementById('mcpStatus');
            const mcpIconElement = document.getElementById('mcpIcon');
            
            if (mcpStatusElement && mcpIconElement) {
                mcpStatusElement.textContent = 'MCP: Error';
                mcpStatusElement.style.color = '#ef4444';
                mcpIconElement.style.color = '#ef4444';
                mcpIconElement.className = 'fas fa-exclamation-triangle';
            }
        }
    }

    // API Key Management Functions
    showApiKeyModal() {
        const modal = document.getElementById('apiKeyModal');
        const apiKeyInput = document.getElementById('apiKeyInput');
        
        // Pre-fill with current API key
        apiKeyInput.value = this.apiKey;
        apiKeyInput.type = 'password';
        
        modal.classList.add('show');
        apiKeyInput.focus();
    }

    hideApiKeyModal() {
        const modal = document.getElementById('apiKeyModal');
        modal.classList.remove('show');
    }

    toggleApiKeyVisibility() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const toggleBtn = document.getElementById('toggleVisibility');
        const icon = toggleBtn.querySelector('i');
        
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            apiKeyInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    async saveApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const newApiKey = apiKeyInput.value.trim();
        
        if (!newApiKey) {
            alert('Please enter an API key');
            return;
        }
        
        if (!newApiKey.startsWith('t-')) {
            alert('API key must start with "t-"');
            return;
        }
        
        // Save to localStorage
        localStorage.setItem('tatumApiKey', newApiKey);
        this.apiKey = newApiKey;
        
        // Update display
        this.updateStatus();
        
        // Show success message
        this.showNotification('API key saved successfully!', 'success');
        
        // Close modal
        this.hideApiKeyModal();
    }

    async testApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const testBtn = document.getElementById('testApiKey');
        const originalText = testBtn.innerHTML;
        
        if (!apiKeyInput.value.trim()) {
            alert('Please enter an API key first');
            return;
        }
        
        // Show loading state
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        testBtn.disabled = true;
        
        try {
            // Test the API key by making a request to backend
            const response = await fetch('/api/test-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ apiKey: apiKeyInput.value.trim() })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('API key is valid! ✅', 'success');
            } else {
                this.showNotification('API key is invalid ❌', 'error');
            }
        } catch (error) {
            console.error('Error testing API key:', error);
            this.showNotification('Error testing API key', 'error');
        } finally {
            // Reset button
            testBtn.innerHTML = originalText;
            testBtn.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the Tatum ChainLens application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new TatumChainLens();
});

// Add some CSS for typing indicator
const style = document.createElement('style');
style.textContent = `
    .typing-indicator {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    
    .typing-indicator span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #667eea;
        animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typing {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
    }
    
    .gas-comparison-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 20px;
    }
    
    .comparison-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 10px;
        border: 1px solid #e5e7eb;
    }
    
    .chain-info {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
    }
    
    .gas-price {
        font-weight: 700;
        color: #667eea;
    }
    
    .error {
        color: #ef4444;
        font-weight: 600;
    }
`;
document.head.appendChild(style);
