// Escape the Paycheck interactive game
// Replaces the legacy trading quiz/stock simulation with a board-style cashflow game
(function () {
  'use strict';

  const CAREERS = {
    developer: {
      key: 'developer',
      label: 'Developer',
      emoji: '💻',
      summary: 'Low salary, low expenses. Great for building steady assets.',
      salary: 2600,
      expenses: 1500,
      passiveIncome: 120,
      debt: 2200,
      startingCash: 1800
    },
    salesperson: {
      key: 'salesperson',
      label: 'Salesperson',
      emoji: '🧑‍💼',
      summary: 'Commission ups and downs with lingering credit debt.',
      salary: 3200,
      expenses: 2300,
      passiveIncome: 160,
      debt: 4800,
      startingCash: 1400
    },
    nurse: {
      key: 'nurse',
      label: 'Nurse',
      emoji: '🩺',
      summary: 'Stable income and balanced lifestyle expenses.',
      salary: 3000,
      expenses: 1900,
      passiveIncome: 180,
      debt: 2600,
      startingCash: 2000
    },
    architect: {
      key: 'architect',
      label: 'Architect',
      emoji: '📐',
      summary: 'High salary, elevated lifestyle and loans to manage.',
      salary: 4200,
      expenses: 3200,
      passiveIncome: 220,
      debt: 7200,
      startingCash: 2500
    }
  };

  const BOARD = [
    { type: 'paycheck', label: 'Paycheck', icon: '💵', description: 'Collect your salary and pay monthly expenses.' },
    { type: 'doodad', label: 'Doodad', icon: '💸', description: 'Lifestyle splurge hits your wallet.' },
    { type: 'smallDeal', label: 'Small Deal', icon: '📈', description: 'Opportunity to buy a cash-flowing asset.' },
    { type: 'charity', label: 'Charity', icon: '🤲', description: 'Give to charity, gain a karma boost.' },
    { type: 'paycheck', label: 'Paycheck', icon: '💵', description: 'Another payday. Use it wisely!' },
    { type: 'bigDeal', label: 'Big Deal', icon: '🏢', description: 'Chance to acquire a major investment.' },
    { type: 'doodad', label: 'Doodad', icon: '💳', description: 'Unexpected expense strikes.' },
    { type: 'bonus', label: 'Windfall', icon: '🎁', description: 'Side hustle paid off with a surprise bonus.' },
    { type: 'paycheck', label: 'Paycheck', icon: '💵', description: 'Salary day plus your passive income.' },
    { type: 'smallDeal', label: 'Small Deal', icon: '🏠', description: 'Condo, index fund, or vending route?' },
    { type: 'downsized', label: 'Downsized', icon: '⚠️', description: 'Lose your salary for a turn.' },
    { type: 'charity', label: 'Charity', icon: '❤️', description: 'Give generously to unlock future perks.' },
    { type: 'paycheck', label: 'Paycheck', icon: '💵', description: 'Keep stacking cashflow.' },
    { type: 'bigDeal', label: 'Big Deal', icon: '🧱', description: 'Multi-family real estate or franchise offer.' },
    { type: 'doodad', label: 'Doodad', icon: '🛍️', description: 'Fun purchase that doesn’t pay you back.' },
    { type: 'boost', label: 'Passive Boost', icon: '⚡', description: 'Your investments outperform this month!' }
  ];

  const SMALL_DEALS = [
    { name: 'Index Fund ETF', cost: 650, passiveIncome: 35, value: 650, summary: 'Stable long-term growth with quarterly dividends.' },
    { name: 'Local Food Cart', cost: 900, passiveIncome: 65, value: 950, summary: 'Managed by a partner, you collect profits.' },
    { name: 'Peer Lending Pool', cost: 400, passiveIncome: 28, value: 400, summary: 'Diversified loans pay you monthly interest.' },
    { name: 'Solar Mini-Project', cost: 750, passiveIncome: 55, value: 820, summary: 'Sell energy back to the grid through subsidies.' },
    { name: 'REIT Fractional Share', cost: 500, passiveIncome: 40, value: 520, summary: 'Commercial real estate distributions.' }
  ];

  const BIG_DEALS = [
    { name: '4-Plex Rental', cost: 4500, passiveIncome: 320, value: 5200, debtShare: 0.65, summary: 'Leverage bank financing, collect rent after costs.' },
    { name: 'Eco Franchise', cost: 6200, passiveIncome: 410, value: 6900, debtShare: 0.5, summary: 'Hire a manager, share profits from sustainable goods.' },
    { name: 'Logistics Startup', cost: 5400, passiveIncome: 370, value: 6000, debtShare: 0.55, summary: 'Invest for equity and distribution rights.' },
    { name: 'Mobile App Venture', cost: 3200, passiveIncome: 260, value: 3800, debtShare: 0.35, summary: 'Royalties roll in from subscription upgrades.' },
    { name: 'Co-Working Space', cost: 7000, passiveIncome: 480, value: 7700, debtShare: 0.6, summary: 'Shared ownership with ongoing membership fees.' }
  ];

  const DOODADS = [
    { label: 'Concert Tour Tickets', cost: 350 },
    { label: 'Luxury Weekend Getaway', cost: 520 },
    { label: 'Gadget Upgrade Frenzy', cost: 450 },
    { label: 'Car Repair Surprise', cost: 390 },
    { label: 'Designer Wardrobe Refresh', cost: 610 },
    { label: 'Home Decor Glow Up', cost: 280 }
  ];

  const BONUS_EVENTS = [
    { label: 'Consulting Windfall', amount: 600 },
    { label: 'Referral Bonus', amount: 450 },
    { label: 'Dividend Surprise', amount: 520 },
    { label: 'Selling Old Gear', amount: 380 }
  ];

  const CHARITY_EVENTS = [
    { label: 'Local STEM Camp', cost: 200, reward: 30 },
    { label: 'Financial Literacy Class', cost: 150, reward: 40 },
    { label: 'Community Garden', cost: 250, reward: 45 },
    { label: 'Scholarship Fund', cost: 300, reward: 55 }
  ];

  const stateTemplate = () => ({
    careerKey: null,
    cash: 0,
    salary: 0,
    passiveIncome: 0,
    expenses: 0,
    debt: 0,
    netWorth: 0,
    position: 0,
    turnCount: 0,
    downsizedTurns: 0,
    charityTokens: 0,
    escaped: false,
    assets: [],
    eventLog: []
  });

  const getServerTimestamp = () => (
    typeof firebase !== 'undefined' &&
    firebase?.firestore?.FieldValue?.serverTimestamp
  ) ? firebase.firestore.FieldValue.serverTimestamp() : null;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeGame = {
    session: null,
    firebaseReady: false,
    firestore: null,
    diceRolling: false,
    state: stateTemplate(),
    audioContext: null,

    init: async () => {
      escapeGame.session = store.session.load();
      if (!escapeGame.session) {
        window.location.href = './index.html';
        return;
      }

      try {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.GAME_PROGRESS);
      } catch (error) {
        console.warn('Failed to clear saved game data:', error);
      }

      ensureFirebaseServices();

      escapeGame.resetState();
      escapeGame.bindUI();
      escapeGame.render();
      escapeGame.updateEventCard('Ready?', 'Roll the dice to start your journey toward financial freedom.');
      escapeGame.showGoalOverlay();
    },

    bindUI: () => {
      $('#rollDiceBtn')?.addEventListener('click', escapeGame.handleRoll);
      $('#victoryCloseBtn')?.addEventListener('click', escapeGame.closeVictory);
      $('#victoryContinueBtn')?.addEventListener('click', escapeGame.shareVictory);
      $('#closeDealModal')?.addEventListener('click', escapeGame.closeDealModal);
      $('#dealModal')?.addEventListener('click', (evt) => {
        if (evt.target.id === 'dealModal') {
          escapeGame.closeDealModal();
        }
      });
      $('#goalCloseBtn')?.addEventListener('click', escapeGame.hideGoalOverlay);
    },

    handleRoll: async () => {
      if (escapeGame.diceRolling) return;
      escapeGame.diceRolling = true;

      playTone(440, 0.12);

      const rollBtn = $('#rollDiceBtn');
      const diceResult = $('#diceResult');
      const turnInfo = $('#turnInfo');

      rollBtn.disabled = true;
      diceResult.classList.add('rolling');
      diceResult.textContent = '🎲';

      const roll = Math.floor(Math.random() * 6) + 1;

      setTimeout(async () => {
        diceResult.classList.remove('rolling');
        diceResult.textContent = roll;

        await escapeGame.animateMovement(roll);
        escapeGame.state.turnCount += 1;
        escapeGame.applyPassiveCashflow();

        const boardEvent = BOARD[escapeGame.state.position];
        await escapeGame.resolveEvent(boardEvent, roll);

        turnInfo.textContent = `Turn ${escapeGame.state.turnCount} • Rolled a ${roll}`;

        escapeGame.checkEscapeCondition();
        escapeGame.render();
        await escapeGame.persistProgress({
          roll,
          eventType: boardEvent.type,
          eventLabel: boardEvent.label
        });

        rollBtn.disabled = false;
        escapeGame.diceRolling = false;
      }, 780);
    },

    animateMovement: async (steps) => {
      const boardSize = BOARD.length;
      const startIndex = escapeGame.state.position;
      escapeGame.renderBoard();
      const boardContainer = $('#escapeBoard');

      if (!boardContainer) {
        escapeGame.state.position = (startIndex + steps) % boardSize;
        return;
      }

      const cells = Array.from(boardContainer.querySelectorAll('.escape-cell'));
      const stepDelay = CONFIG?.ESCAPE_GAME?.STEP_DELAY || 240;

      const clearHighlights = () => {
        cells.forEach(cell => cell.classList.remove('active', 'trail-step'));
      };

      clearHighlights();
      cells[startIndex]?.classList.add('trail-step');

      for (let hop = 1; hop <= steps; hop += 1) {
        const nextIndex = (startIndex + hop) % boardSize;
        clearHighlights();
        if (hop !== steps) cells[nextIndex]?.classList.add('trail-step');
        cells[nextIndex]?.classList.add('active');
        await delay(stepDelay);
      }

      escapeGame.state.position = (startIndex + steps) % boardSize;
      clearHighlights();
      cells[escapeGame.state.position]?.classList.add('active');
    },

    applyPassiveCashflow: () => {
      if (escapeGame.state.passiveIncome > 0) {
        escapeGame.state.cash += escapeGame.state.passiveIncome;
        escapeGame.pushLog(`Received $${escapeGame.state.passiveIncome.toFixed(0)} in passive income.`, 'passive');
      }
    },

    resolveEvent: async (event, roll) => {
      switch (event.type) {
        case 'paycheck':
          escapeGame.handlePaycheck();
          break;
        case 'smallDeal':
          await escapeGame.handleDeal(event, SMALL_DEALS, 'small');
          break;
        case 'bigDeal':
          await escapeGame.handleDeal(event, BIG_DEALS, 'big');
          break;
        case 'doodad':
          escapeGame.handleDoodad(event);
          break;
        case 'charity':
          escapeGame.handleCharity(event);
          break;
        case 'downsized':
          escapeGame.handleDownsize(event);
          break;
        case 'bonus':
          escapeGame.handleBonus(event);
          break;
        case 'boost':
          escapeGame.handlePassiveBoost(event);
          break;
        default:
          escapeGame.pushLog(`Nothing happened on this tile.`, 'neutral');
          escapeGame.updateEventCard(event.label, event.description);
      }
    },

    handlePaycheck: () => {
      if (escapeGame.state.downsizedTurns > 0) {
        escapeGame.state.downsizedTurns -= 1;
        escapeGame.pushLog('Downsized this month. Salary skipped!', 'warning');
        escapeGame.updateEventCard('Downsized', 'You are still downsized this month. No salary received.');
        return;
      }

      const takeHome = escapeGame.state.salary - escapeGame.state.expenses;
      escapeGame.state.cash += takeHome;
      escapeGame.pushLog(`Collected salary $${escapeGame.state.salary.toFixed(0)} and paid expenses $${escapeGame.state.expenses.toFixed(0)}. Net +$${takeHome.toFixed(0)}.`, 'income');
      escapeGame.updateEventCard('Paycheck Day', `Salary $${escapeGame.state.salary.toFixed(0)} - Expenses $${escapeGame.state.expenses.toFixed(0)} = Net ${takeHome >= 0 ? '+' : ''}$${takeHome.toFixed(0)}.`);
    },

    handleDeal: async (boardEvent, deck, dealType) => {
      const deal = { ...pickRandom(deck) };
      const modalBody = $('#dealModalBody');
      const actions = [{
        label: 'Invest Now',
        className: 'btn btn-primary',
        handler: () => {
          escapeGame.acceptDeal(deal, dealType);
          escapeGame.closeDealModal();
        }
      }, {
        label: 'Pass',
        className: 'btn btn-outline',
        handler: () => {
          escapeGame.pushLog(`You passed on ${deal.name}.`, 'neutral');
          escapeGame.closeDealModal();
          escapeGame.updateEventCard(boardEvent.label, `You skipped the ${dealType === 'small' ? 'small' : 'big'} deal.`);
        }
      }];

      modalBody.innerHTML = `
        <div class=\"deal-header\">
          <span class=\"deal-icon\">${dealType === 'small' ? '📈' : '🏢'}</span>
          <div>
            <h3>${deal.name}</h3>
            <p>${deal.summary}</p>
          </div>
        </div>
        <ul class=\"deal-stats\">
          <li><strong>Cost:</strong> $${deal.cost.toFixed(0)}</li>
          <li><strong>Monthly Cashflow:</strong> +$${deal.passiveIncome.toFixed(0)}</li>
          <li><strong>Estimated Value:</strong> $${deal.value.toFixed(0)}</li>
          ${deal.debtShare ? `<li><strong>Bank Financing:</strong> up to ${(deal.debtShare * 100).toFixed(0)}% available</li>` : ''}
        </ul>
      `;

      escapeGame.openDealModal(actions);
      escapeGame.updateEventCard(boardEvent.label, boardEvent.description, actions);
    },

    acceptDeal: (deal, dealType) => {
      const hasCash = escapeGame.state.cash >= deal.cost;
      let financed = 0;
      let downPayment = 0;

      if (!hasCash && dealType === 'big' && deal.debtShare) {
        const maxFinance = deal.cost * deal.debtShare;
        financed = Math.min(maxFinance, deal.cost - escapeGame.state.cash);
        downPayment = deal.cost - financed;
      } else {
        downPayment = deal.cost;
      }

      if (escapeGame.state.cash < downPayment) {
        escapeGame.pushLog(`Not enough cash to secure ${deal.name}.`, 'warning');
        escapeGame.updateEventCard('Deal Missed', `You needed $${downPayment.toFixed(0)} cash on hand to secure ${deal.name}.`);
        return;
      }

      escapeGame.state.cash -= downPayment;
      escapeGame.state.debt += financed;
      escapeGame.state.passiveIncome += deal.passiveIncome;
      escapeGame.state.assets.push({
        name: deal.name,
        passiveIncome: deal.passiveIncome,
        value: deal.value,
        cost: deal.cost,
        financed,
        acquiredAt: Date.now(),
        type: dealType
      });

      escapeGame.pushLog(`Acquired ${deal.name}! Passive income +$${deal.passiveIncome.toFixed(0)}.`, 'success');
      escapeGame.updateEventCard('Investment Acquired', `${deal.name} now pays you $${deal.passiveIncome.toFixed(0)} every turn.`);
    },

    handleDoodad: (event) => {
      const doodad = pickRandom(DOODADS);
      const amount = doodad.cost;
      escapeGame.state.cash = Math.max(0, escapeGame.state.cash - amount);
      escapeGame.pushLog(`Paid $${amount.toFixed(0)} for ${doodad.label}.`, 'expense');
      escapeGame.updateEventCard(event.label, `Spent $${amount.toFixed(0)} on ${doodad.label}. Lesson learned!`);
    },

    handleCharity: (event) => {
      const charity = pickRandom(CHARITY_EVENTS);
      if (escapeGame.state.cash < charity.cost) {
        escapeGame.pushLog(`Wanted to donate to ${charity.label}, but funds were too tight.`, 'neutral');
        escapeGame.updateEventCard('Charity Missed', 'You need more cash to contribute this time.');
        return;
      }

      escapeGame.state.cash -= charity.cost;
      escapeGame.state.charityTokens += 1;
      escapeGame.state.passiveIncome += charity.reward;

      escapeGame.pushLog(`Donated $${charity.cost.toFixed(0)} to ${charity.label}. Passive income +$${charity.reward.toFixed(0)}.`, 'success');
      escapeGame.updateEventCard(event.label, `Your generosity boosts goodwill! Passive income increased by $${charity.reward.toFixed(0)}.`);
    },

    handleDownsize: (event) => {
      escapeGame.state.downsizedTurns = CONFIG.ESCAPE_GAME.DOWNSIZE_TURNS;
      escapeGame.pushLog('Downsized! Your salary will be paused next turn.', 'warning');
      escapeGame.updateEventCard(event.label, event.description);
    },

    handleBonus: (event) => {
      const bonus = pickRandom(BONUS_EVENTS);
      escapeGame.state.cash += bonus.amount;
      escapeGame.pushLog(`Received a $${bonus.amount.toFixed(0)} ${bonus.label}.`, 'income');
      escapeGame.updateEventCard(event.label, `Unexpected ${bonus.label.toLowerCase()} adds $${bonus.amount.toFixed(0)} to your cash.`);
    },

    handlePassiveBoost: (event) => {
      const boost = Math.round(escapeGame.state.passiveIncome * 0.25) || 60;
      escapeGame.state.passiveIncome += boost;
      escapeGame.pushLog(`Investments flourished! Passive income increased by $${boost.toFixed(0)}.`, 'success');
      escapeGame.updateEventCard(event.label, event.description);
    },

    checkEscapeCondition: () => {
      const goalIncome = escapeGame.state.salary * CONFIG.ESCAPE_GAME.PASSIVE_GOAL_MULTIPLIER;
      if (!escapeGame.state.escaped && escapeGame.state.passiveIncome >= goalIncome) {
        escapeGame.state.escaped = true;
        escapeGame.onEscapeAchieved();
      }
    },

    onEscapeAchieved: async () => {
      escapeGame.pushLog('Passive income now exceeds salary! You escaped the paycheck!', 'victory');
      escapeGame.showVictoryOverlay();
      await escapeGame.persistProgress({ victory: true });
      escapeGame.recordVictoryHistory();
      escapeGame.updateProfileProgress();
    },

    showVictoryOverlay: () => {
      const overlay = $('#escapeVictory');
      const message = $('#victoryMessage');
      if (overlay) {
        overlay.classList.add('active');
        message.textContent = `Passive income $${escapeGame.state.passiveIncome.toFixed(0)} vs salary $${escapeGame.state.salary.toFixed(0)}.`;
      }
    },

    closeVictory: () => {
      $('#escapeVictory')?.classList.remove('active');
    },

    shareVictory: async () => {
      if (!escapeGame.state.escaped) {
        escapeGame.closeVictory();
        return;
      }

      const content = `🚀 I just escaped the paycheck trap in Escape the Paycheck! Passive income $${escapeGame.state.passiveIncome.toFixed(0)} vs salary $${escapeGame.state.salary.toFixed(0)}. Net worth now $${escapeGame.state.netWorth.toFixed(0)}. #escapeThePaycheck #EcoVest`;
      try {
        await api.createPost(content, null, null, ['#escapeThePaycheck', '#financialFreedom']);
        ui.toast('Victory shared to the community feed!', 'success');
        escapeGame.closeVictory();
        setTimeout(() => window.location.href = './feed.html', 1200);
      } catch (error) {
        ui.toast('Unable to post right now. Try again later.', 'error');
      }
    },

    recordVictoryHistory: async () => {
      const record = {
        username: escapeGame.session.username,
        gameType: 'escape',
        career: escapeGame.state.careerKey,
        salary: escapeGame.state.salary,
        passiveIncome: escapeGame.state.passiveIncome,
        expenses: escapeGame.state.expenses,
        debt: escapeGame.state.debt,
        cash: escapeGame.state.cash,
        netWorth: escapeGame.state.netWorth,
        turns: escapeGame.state.turnCount,
        escaped: escapeGame.state.escaped,
        assets: escapeGame.state.assets.map(asset => ({
          name: asset.name,
          passiveIncome: asset.passiveIncome,
          value: asset.value,
          cost: asset.cost,
          financed: asset.financed || 0,
          type: asset.type
        }))
      };

      store.gameHistory.add({
        ...record,
        completedAt: Date.now()
      });

      if (firebaseServices?.isInitialized?.()) {
        try {
          await firebaseDB.gameHistory.add(record);
        } catch (error) {
          console.warn('Failed to sync game history to Firebase:', error);
        }
      }
    },

    updateProfileProgress: () => {
      const session = store.session.load();
      if (!session) return;

      const profile = store.profiles.get(session.username);
      const baseScore = profile.profileScore || 0;
      const bonus = Math.max(40, Math.round(escapeGame.state.netWorth / 800));
      const newScore = baseScore + bonus;
      const newLevel = getLevel(newScore);

      store.profiles.update(session.username, {
        profileScore: Math.max(newScore, 60),
        level: newLevel
      });

      if (firebaseServices?.isInitialized?.()) {
        const user = firebaseAuth.getCurrentUser();
        if (user) {
          firebaseDB.profiles.update(user.uid, {
            profileScore: Math.max(newScore, 60),
            level: newLevel
          }).catch(error => console.warn('Failed to update profile level in Firebase:', error));
        }
      }
    },

    resetState: () => {
      const careers = Object.keys(CAREERS);
      const randomKey = careers[Math.floor(Math.random() * careers.length)];
      escapeGame.setCareer(randomKey);
    },

    setCareer: (careerKey) => {
      const career = CAREERS[careerKey];
      if (!career) return;

      escapeGame.state = {
        ...stateTemplate(),
        careerKey,
        cash: career.startingCash,
        salary: career.salary,
        passiveIncome: 0,
        expenses: career.expenses,
        debt: career.debt,
        netWorth: career.startingCash - career.debt,
        eventLog: []
      };
    },

    persistProgress: async () => {
      escapeGame.recalculateNetWorth();
    },

    showGoalOverlay: () => {
      const overlay = $('#goalOverlay');
      if (!overlay) return;
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
    },

    hideGoalOverlay: () => {
      const overlay = $('#goalOverlay');
      if (!overlay) return;
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    },

    recalculateNetWorth: () => {
      const assetsValue = escapeGame.state.assets.reduce((sum, asset) => sum + (asset.value || asset.cost || 0), 0);
      escapeGame.state.netWorth = escapeGame.state.cash + assetsValue - escapeGame.state.debt;
    },

    render: () => {
      escapeGame.recalculateNetWorth();
      escapeGame.renderCareer();
      escapeGame.renderStats();
      escapeGame.renderBoard();
      escapeGame.renderAssets();
      escapeGame.renderEventLog();
    },

    renderCareer: () => {
      const career = CAREERS[escapeGame.state.careerKey];
      if (!career) return;

      $('#careerEmoji').textContent = career.emoji;
      $('#careerName').textContent = `${career.label}`;
      $('#careerSummary').textContent = career.summary;
    },

    renderStats: () => {
      const format = (value) => `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      $('#statCash').textContent = format(escapeGame.state.cash);
      $('#statSalary').textContent = format(escapeGame.state.salary);
      $('#statPassive').textContent = format(escapeGame.state.passiveIncome);
      $('#statExpenses').textContent = format(escapeGame.state.expenses);
      $('#statDebt').textContent = format(escapeGame.state.debt);
      $('#statNetWorth').textContent = format(escapeGame.state.netWorth);

      const goalIncome = escapeGame.state.salary * CONFIG.ESCAPE_GAME.PASSIVE_GOAL_MULTIPLIER;
      const progress = Math.min(100, Math.round((escapeGame.state.passiveIncome / goalIncome) * 100));

      $('#progressFill').style.width = `${progress}%`;
      $('#progressAmount').textContent = `${format(escapeGame.state.passiveIncome)} / ${format(goalIncome)}`;
      $('#progressLabel').textContent = progress >= 100 ? 'Goal achieved!' : 'Passive vs Salary';
    },

    renderBoard: () => {
      const boardContainer = $('#escapeBoard');
      if (!boardContainer) return;
      boardContainer.innerHTML = '';

      BOARD.forEach((tile, index) => {
        const cell = document.createElement('div');
        cell.className = `escape-cell escape-cell-${tile.type}`;
        if (index === escapeGame.state.position) {
          cell.classList.add('active');
        }

        cell.innerHTML = `
          <div class=\"cell-icon\">${tile.icon}</div>
          <div class=\"cell-label\">${tile.label}</div>
          <p class=\"cell-description\">${tile.description}</p>
          ${index === escapeGame.state.position ? '<div class=\"pawn\">🧍‍♂️</div>' : ''}
        `;
        boardContainer.appendChild(cell);
      });
    },

    renderAssets: () => {
      const list = $('#assetsList');
      if (!list) return;

      if (!escapeGame.state.assets.length) {
        list.innerHTML = '<p class=\"empty-state\">No assets yet. Land on a deal tile to acquire a cash-flowing investment.</p>';
        return;
      }

      list.innerHTML = escapeGame.state.assets.map(asset => `
        <div class=\"asset-card\">
          <div class=\"asset-header\">
            <span class=\"asset-type\">${asset.type === 'big' ? '🏢 Big Deal' : '📈 Small Deal'}</span>
            <h3>${asset.name}</h3>
          </div>
          <ul class=\"asset-details\">
            <li><strong>Cashflow:</strong> +$${asset.passiveIncome.toFixed(0)}/turn</li>
            <li><strong>Cost:</strong> $${asset.cost.toFixed(0)}</li>
            <li><strong>Value:</strong> $${asset.value.toFixed(0)}</li>
            ${asset.financed ? `<li><strong>Financed:</strong> $${asset.financed.toFixed(0)}</li>` : ''}
          </ul>
        </div>
      `).join('');
    },

    renderEventLog: () => {
      const logContainer = $('#eventLog');
      if (!logContainer) return;
      logContainer.innerHTML = '';

      escapeGame.state.eventLog.slice(-CONFIG.ESCAPE_GAME.MAX_EVENT_LOG).reverse().forEach(entry => {
        const item = document.createElement('li');
        item.className = `event-log-item event-${entry.type}`;
        item.innerHTML = `<span class=\"event-message\">${entry.message}</span><span class=\"event-turn\">Turn ${entry.turn}</span>`;
        logContainer.appendChild(item);
      });
    },

    updateEventCard: (title, description, actions = []) => {
      $('#eventTitle').textContent = title;
      $('#eventDescription').textContent = description;
      const latestEventStat = $('#statLatestEvent');
      if (latestEventStat) {
        latestEventStat.textContent = title;
      }
      const actionsContainer = $('#eventActions');
      if (actionsContainer) {
        actionsContainer.innerHTML = '';
        if (Array.isArray(actions) && actions.length > 0) {
          actions.forEach(action => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = action.className || 'btn btn-outline';
            btn.textContent = action.label;
            btn.addEventListener('click', action.handler);
            actionsContainer.appendChild(btn);
          });
        }
      }
    },

    openDealModal: (actions) => {
      const modal = $('#dealModal');
      const body = $('#dealModalBody');
      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'deal-actions';

      actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = action.className;
        btn.textContent = action.label;
        btn.addEventListener('click', action.handler);
        actionsContainer.appendChild(btn);
      });

      body.appendChild(actionsContainer);
      modal.classList.add('active');
    },

    closeDealModal: () => {
      $('#dealModal')?.classList.remove('active');
    },

    pushLog: (message, type = 'info') => {
      escapeGame.state.eventLog.push({
        message,
        type,
        turn: escapeGame.state.turnCount || 0,
        timestamp: Date.now()
      });
      if (escapeGame.state.eventLog.length > CONFIG.ESCAPE_GAME.MAX_EVENT_LOG * 2) {
        escapeGame.state.eventLog.shift();
      }
    },

    resetGame: () => {
      if (!confirm('Start a new Escape the Paycheck game? Your current progress will be replaced.')) return;
      escapeGame.resetState();
      escapeGame.persistProgress();
      escapeGame.render();
      escapeGame.updateEventCard('New Career', 'Fresh start! Roll the dice to begin building cashflow.');
      escapeGame.showGoalOverlay();
    }
  };

  function ensureFirebaseServices() {
    if (typeof firebase === 'undefined') return;

    try {
      const config = (typeof window !== 'undefined' && window.getFirebaseConfig) ? window.getFirebaseConfig() : (window.__FIREBASE_CONFIG__ || null);
      if (!config) {
        console.warn('Firebase config not found.');
        return;
      }

      if (typeof firebaseServices === 'undefined' || !firebaseServices || !firebaseServices.isInitialized || !firebaseServices.isInitialized()) {
        const app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
        const auth = firebase.auth();
        const database = firebase.database();
        const storage = firebase.storage();
        const firestore = firebase.firestore();

        window.firebaseServices = {
          app,
          auth,
          database,
          storage,
          firestore,
          isInitialized: () => true
        };
      } else if (!firebaseServices.firestore && firebase.firestore) {
        firebaseServices.firestore = firebase.firestore();
      }
    } catch (error) {
      console.warn('Failed to ensure Firebase services:', error);
    }
  }

  function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function playTone() {
    // Sound disabled for this gameplay experience.
  }

  window.escapeGame = escapeGame;
  window.game = escapeGame; // backward compatibility for existing calls
})();


