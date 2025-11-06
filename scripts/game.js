// Stock Trading Mini-Game module

const game = {
  companies: [
    { name: 'TechCorp', symbol: 'TECH', basePrice: 100 },
    { name: 'GreenEnergy', symbol: 'GREEN', basePrice: 80 },
    { name: 'FinancePro', symbol: 'FIN', basePrice: 120 },
    { name: 'HealthPlus', symbol: 'HEAL', basePrice: 90 },
    { name: 'RetailMax', symbol: 'RETAIL', basePrice: 70 },
    { name: 'CloudSys', symbol: 'CLOUD', basePrice: 110 }
  ],

  currentGame: null,

  // Initialize game
  init: () => {
    const session = store.session.load();
    if (!session) {
      window.location.href = './index.html';
      return;
    }

    game.startGame();
  },

  // Start new game
  startGame: () => {
    const session = store.session.load();
    
    game.currentGame = {
      round: 1,
      totalRounds: CONFIG.GAME.TOTAL_ROUNDS,
      coins: CONFIG.GAME.INITIAL_COINS,
      portfolio: {}, // { symbol: { shares: number, buyPrice: number } }
      companies: game.generateCompanies(),
      history: []
    };

    game.renderRound();
  },

  // Generate company prices for game
  generateCompanies: () => {
    const selected = [];
    const shuffled = [...game.companies].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < CONFIG.GAME.COMPANIES_PER_ROUND; i++) {
      const company = shuffled[i];
      selected.push({
        ...company,
        currentPrice: company.basePrice,
        priceChange: 0
      });
    }
    
    return selected;
  },

  // Update company prices with fluctuation
  updatePrices: () => {
    game.currentGame.companies.forEach(company => {
      const fluctuation = (Math.random() * (CONFIG.GAME.PRICE_FLUCTUATION_MAX - CONFIG.GAME.PRICE_FLUCTUATION_MIN) + CONFIG.GAME.PRICE_FLUCTUATION_MIN);
      const isPositive = Math.random() > 0.5;
      const change = isPositive ? fluctuation : -fluctuation;
      
      const newPrice = company.basePrice * (1 + change);
      company.priceChange = change;
      company.currentPrice = Math.round(newPrice * 100) / 100;
    });
  },

  // Render current round
  renderRound: () => {
    const container = $('#gameContainer');
    if (!container || !game.currentGame) return;

    const { round, totalRounds, coins, portfolio, companies } = game.currentGame;
    
    // Update prices for this round
    game.updatePrices();
    
    // Calculate portfolio value
    const portfolioValue = game.calculatePortfolioValue();
    const totalValue = coins + portfolioValue;
    
    // Progress bar
    const progress = (round / totalRounds) * 100;

    container.innerHTML = `
      <div class="game-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <p class="progress-text">รอบ ${round} / ${totalRounds}</p>
      </div>

      <div class="game-stats">
        <div class="stat-card">
          <div class="stat-label">EcoCoins</div>
          <div class="stat-value">${coins.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Portfolio Value</div>
          <div class="stat-value">${portfolioValue.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Value</div>
          <div class="stat-value">${totalValue.toFixed(2)}</div>
        </div>
      </div>

      <div class="companies-grid">
        ${companies.map(company => {
          const owned = portfolio[company.symbol] || { shares: 0, buyPrice: 0 };
          const profit = owned.shares > 0 ? (company.currentPrice - owned.buyPrice) * owned.shares : 0;
          const priceChangePercent = (company.priceChange * 100).toFixed(1);
          const priceChangeClass = company.priceChange >= 0 ? 'positive' : 'negative';
          
          return `
            <div class="company-card">
              <div class="company-header">
                <h3>${company.name}</h3>
                <span class="company-symbol">${company.symbol}</span>
              </div>
              <div class="company-price">
                <div class="price-value">$${company.currentPrice.toFixed(2)}</div>
                <div class="price-change ${priceChangeClass}">
                  ${company.priceChange >= 0 ? '↑' : '↓'} ${Math.abs(priceChangePercent)}%
                </div>
              </div>
              ${owned.shares > 0 ? `
                <div class="owned-info">
                  <p>Owned: ${owned.shares} shares</p>
                  <p>Buy Price: $${owned.buyPrice.toFixed(2)}</p>
                  <p class="profit ${profit >= 0 ? 'positive' : 'negative'}">
                    ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}
                  </p>
                </div>
              ` : ''}
              <div class="company-actions">
                <div class="action-group">
                  <label>Shares:</label>
                  <input type="number" min="1" value="1" id="shares-${company.symbol}" class="shares-input">
                </div>
                <div class="action-buttons">
                  <button class="btn btn-primary btn-sm" onclick="game.buyStock('${company.symbol}')">
                    Buy
                  </button>
                  ${owned.shares > 0 ? `
                    <button class="btn btn-outline btn-sm" onclick="game.sellStock('${company.symbol}')">
                      Sell
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="game-actions">
        <button class="btn btn-primary btn-lg" id="nextRoundBtn">Next Round</button>
        <button class="btn btn-outline" id="endGameBtn">End Game</button>
      </div>
    `;

    // Event listeners
    $('#nextRoundBtn')?.addEventListener('click', () => game.nextRound());
    $('#endGameBtn')?.addEventListener('click', () => game.endGame());
  },

  // Calculate portfolio value
  calculatePortfolioValue: () => {
    const { portfolio, companies } = game.currentGame;
    let value = 0;
    
    Object.keys(portfolio).forEach(symbol => {
      const company = companies.find(c => c.symbol === symbol);
      if (company) {
        value += portfolio[symbol].shares * company.currentPrice;
      }
    });
    
    return value;
  },

  // Buy stock
  buyStock: (symbol) => {
    const company = game.currentGame.companies.find(c => c.symbol === symbol);
    const sharesInput = $(`#shares-${symbol}`);
    const shares = parseInt(sharesInput.value) || 1;
    
    if (shares < 1) {
      ui.toast('Please enter a valid number of shares', 'error');
      return;
    }

    const cost = shares * company.currentPrice;
    
    if (cost > game.currentGame.coins) {
      ui.toast('Insufficient EcoCoins', 'error');
      return;
    }

    // Update portfolio
    if (!game.currentGame.portfolio[symbol]) {
      game.currentGame.portfolio[symbol] = { shares: 0, buyPrice: 0 };
    }
    
    const oldShares = game.currentGame.portfolio[symbol].shares;
    const oldBuyPrice = game.currentGame.portfolio[symbol].buyPrice;
    const newShares = oldShares + shares;
    const newBuyPrice = ((oldShares * oldBuyPrice) + cost) / newShares;
    
    game.currentGame.portfolio[symbol] = {
      shares: newShares,
      buyPrice: newBuyPrice
    };
    
    game.currentGame.coins -= cost;
    
    game.currentGame.history.push({
      type: 'buy',
      symbol,
      shares,
      price: company.currentPrice,
      round: game.currentGame.round
    });

    ui.toast(`Bought ${shares} shares of ${company.name}`, 'success');
    game.renderRound();
  },

  // Sell stock
  sellStock: (symbol) => {
    const company = game.currentGame.companies.find(c => c.symbol === symbol);
    const sharesInput = $(`#shares-${symbol}`);
    const shares = parseInt(sharesInput.value) || 1;
    const owned = game.currentGame.portfolio[symbol];
    
    if (!owned || owned.shares < shares) {
      ui.toast('Insufficient shares', 'error');
      return;
    }

    const revenue = shares * company.currentPrice;
    const profit = (company.currentPrice - owned.buyPrice) * shares;
    
    game.currentGame.portfolio[symbol].shares -= shares;
    if (game.currentGame.portfolio[symbol].shares === 0) {
      delete game.currentGame.portfolio[symbol];
    }
    
    game.currentGame.coins += revenue;
    
    game.currentGame.history.push({
      type: 'sell',
      symbol,
      shares,
      price: company.currentPrice,
      profit,
      round: game.currentGame.round
    });

    ui.toast(`Sold ${shares} shares of ${company.name}. Profit: $${profit.toFixed(2)}`, 'success');
    game.renderRound();
  },

  // Next round
  nextRound: () => {
    game.currentGame.round++;
    
    if (game.currentGame.round > game.currentGame.totalRounds) {
      game.endGame();
    } else {
      // Update base prices for next round
      game.currentGame.companies.forEach(company => {
        company.basePrice = company.currentPrice;
      });
      game.renderRound();
    }
  },

  // End game and show summary
  endGame: () => {
    const container = $('#gameContainer');
    if (!container || !game.currentGame) return;

    const { coins, portfolio, companies, totalRounds } = game.currentGame;
    
    // Sell all remaining stocks
    let finalCoins = coins;
    Object.keys(portfolio).forEach(symbol => {
      const company = companies.find(c => c.symbol === symbol);
      if (company) {
        finalCoins += portfolio[symbol].shares * company.currentPrice;
      }
    });
    
    const profit = finalCoins - CONFIG.GAME.INITIAL_COINS;
    const profitPercent = ((profit / CONFIG.GAME.INITIAL_COINS) * 100).toFixed(1);
    
    // Calculate new level
    const session = store.session.load();
    const profile = store.profiles.get(session.username);
    const currentScore = profile.profileScore || 0;
    const newScore = currentScore + Math.max(0, Math.round(profit));
    const calculatedLevel = getLevel(newScore);
    const isFirstGame = profile.level === 'Novice'; // Check if this is their first game
    
    // Ensure first-time users get at least Beginner level to access the feed
    const newLevel = isFirstGame ? (calculatedLevel === 'Novice' ? 'Beginner' : calculatedLevel) : calculatedLevel;

    // Save game history
    store.gameHistory.add({
      username: session.username,
      rounds: totalRounds,
      initialCoins: CONFIG.GAME.INITIAL_COINS,
      finalCoins: finalCoins,
      profit: profit,
      profitPercent: profitPercent,
      completedAt: Date.now()
    });

    // Update profile
    store.profiles.update(session.username, {
      profileScore: Math.max(newScore, 20), // Ensure minimum score of 20 for first-time users
      level: newLevel
    });

    // Show level achievement for first-time users
    if (isFirstGame) {
      const levelEmojis = {
        'Beginner': '🌱',
        'Intermediate': '📈',
        'Pro': '🏆'
      };
      ui.toast(`🎯 You are now a ${newLevel} Investor! ${levelEmojis[newLevel] || '✨'}`, 'success', 5000);
    }

    container.innerHTML = `
      <div class="game-summary">
        <h2>Game Complete! 🎉</h2>
        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-label">Starting Coins</div>
            <div class="stat-value">$${CONFIG.GAME.INITIAL_COINS.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Final Coins</div>
            <div class="stat-value">$${finalCoins.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Profit/Loss</div>
            <div class="stat-value ${profit >= 0 ? 'positive' : 'negative'}">
              ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Profit %</div>
            <div class="stat-value ${profit >= 0 ? 'positive' : 'negative'}">
              ${profitPercent >= 0 ? '+' : ''}${profitPercent}%
            </div>
          </div>
        </div>
        
        <div class="level-info">
          <p>Your Profile Score: <strong>${newScore}</strong></p>
          <p>Your Level: <strong class="level-badge level-${newLevel.toLowerCase()}">${newLevel}</strong></p>
        </div>

        <div class="summary-actions">
          ${isFirstGame ? `
            <button class="btn btn-primary btn-lg" id="continueToFeedBtn">Continue to Feed →</button>
          ` : `
            <button class="btn btn-primary" id="playAgainBtn">Play Again</button>
            <button class="btn btn-outline" id="postToFeedBtn">Post Result to Feed</button>
            <a href="./feed.html" class="btn btn-outline">Back to Feed</a>
          `}
        </div>
      </div>
    `;

    // First-time user: auto-redirect to feed
    if (isFirstGame) {
      $('#continueToFeedBtn')?.addEventListener('click', () => {
        window.location.href = './feed.html';
      });
      
      // Auto-redirect after 5 seconds
      setTimeout(() => {
        window.location.href = './feed.html';
      }, 5000);
    } else {
      // Returning users: normal options
      $('#playAgainBtn')?.addEventListener('click', () => {
        game.startGame();
      });

      $('#postToFeedBtn')?.addEventListener('click', async () => {
        const btn = $('#postToFeedBtn');
        btn.disabled = true;
        btn.textContent = 'Posting...';
        
        const profitText = profit >= 0 ? `gained ${profitPercent}%` : `lost ${Math.abs(profitPercent)}%`;
        const content = `Just finished a trading game! Started with $${CONFIG.GAME.INITIAL_COINS} and ${profitText}! Final: $${finalCoins.toFixed(2)} 🎯 #game #trading #${newLevel.toLowerCase()}`;
        
        try {
          const newPost = await api.createPost(content, null, null, ['#game', '#trading', `#${newLevel.toLowerCase()}`]);
          
          // Show success toast
          ui.toast('✅ Posted successfully!', 'success', 1500);
          
          // Redirect to feed with post ID after short delay
          setTimeout(() => {
            window.location.href = `./feed.html?highlight=${newPost.id}`;
          }, 1500);
        } catch (e) {
          ui.toast('Failed to post', 'error');
          btn.disabled = false;
          btn.textContent = 'Post Result to Feed';
        }
      });

      ui.toast(`Game completed! Profit: $${profit.toFixed(2)}`, 'success', 3000);
    }
  }
};
