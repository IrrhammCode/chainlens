
// landing.js - Simple Wallet Connection & Redirect

const connectBtn = document.getElementById('connectWalletBtn');
const heroConnectBtn = document.getElementById('heroConnectBtn');

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];

            // Show success state
            console.log('Connected', account);

            // Save to local storage for dashboard
            localStorage.setItem('walletAddress', account);

            // Visual Feedback
            if (connectBtn) {
                connectBtn.innerHTML = `<i class="fas fa-check-circle"></i> ${account.slice(0, 6)}...${account.slice(-4)}`;
                connectBtn.classList.add('bg-green-600', 'border-green-500');
            }
            if (heroConnectBtn) {
                heroConnectBtn.innerHTML = `<i class="fas fa-check-circle"></i> Connected`;
                heroConnectBtn.classList.add('bg-green-600');
            }

            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            console.error('User rejected connection', error);
            alert('Connection failed. Please try again.');
        }
    } else {
        alert('MetaMask is not installed. Please install it to use ChainLens.');
        window.open('https://metamask.io/download/', '_blank');
    }
}

// Bind events
if (connectBtn) connectBtn.addEventListener('click', connectWallet);
if (heroConnectBtn) heroConnectBtn.addEventListener('click', connectWallet);

console.log('Landing.js loaded');
