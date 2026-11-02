class MemoryGame {
  constructor() {
    this.symbols = ["A", "B", "C", "D", "E", "F", "G", "H"];
    this.board = document.getElementById("memory-board");
    this.overlay = document.getElementById("memory-overlay");
    this.overlayTitle = document.getElementById("memory-overlay-title");
    this.overlayMessage = document.getElementById("memory-overlay-message");
    this.overlayButton = document.getElementById("memory-overlay-button");
    this.timeElement = document.getElementById("memory-time");
    this.flipsElement = document.getElementById("memory-flips");
    this.pairsElement = document.getElementById("memory-pairs");
    this.restartButton = document.getElementById("memory-restart");
    this.locked = true;
    this.flips = 0;
    this.pairs = 0;
    this.timeRemaining = 90;
    this.firstCard = null;
    this.secondCard = null;

    this.overlayButton.addEventListener("click", () => this.start());
    this.restartButton.addEventListener("click", () => this.start());
    this.overlay.addEventListener("click", (event) => {
      if (event.target === this.overlay) this.start();
    });
    this.createBoard();
  }

  shuffle(cards) {
    for (let index = cards.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
    }
    return cards;
  }

  createBoard() {
    this.board.replaceChildren();
    const cards = this.shuffle([...this.symbols, ...this.symbols]);
    cards.forEach((symbol, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "memory-card";
      card.dataset.symbol = symbol;
      card.setAttribute("role", "gridcell");
      card.setAttribute("aria-label", `숨겨진 카드 ${index + 1}`);
      card.innerHTML = `
        <span class="memory-card__inner">
          <span class="memory-card__face memory-card__face--back"><span>${index % 2 === 0 ? "+" : "×"}</span></span>
          <span class="memory-card__face memory-card__face--front"><span>${symbol}</span></span>
        </span>`;
      card.addEventListener("click", () => this.flipCard(card));
      this.board.appendChild(card);
    });
  }

  start() {
    clearInterval(this.timer);
    this.locked = false;
    this.flips = 0;
    this.pairs = 0;
    this.timeRemaining = 90;
    this.firstCard = null;
    this.secondCard = null;
    this.updateStats();
    this.overlay.classList.remove("is-visible");
    this.createBoard();
    this.timer = setInterval(() => {
      this.timeRemaining -= 1;
      this.timeElement.textContent = String(this.timeRemaining);
      if (this.timeRemaining <= 0) this.endGame(false);
    }, 1000);
  }

  updateStats() {
    this.timeElement.textContent = String(this.timeRemaining);
    this.flipsElement.textContent = String(this.flips);
    this.pairsElement.textContent = String(this.pairs);
  }

  flipCard(card) {
    if (this.locked || card === this.firstCard || card.classList.contains("is-matched") || card.classList.contains("is-flipped")) return;
    card.classList.add("is-flipped");
    card.setAttribute("aria-label", `${card.dataset.symbol} 카드`);

    if (!this.firstCard) {
      this.firstCard = card;
      return;
    }

    this.secondCard = card;
    this.flips += 1;
    this.flipsElement.textContent = String(this.flips);

    if (this.firstCard.dataset.symbol === this.secondCard.dataset.symbol) {
      this.firstCard.classList.add("is-matched");
      this.secondCard.classList.add("is-matched");
      this.pairs += 1;
      this.pairsElement.textContent = String(this.pairs);
      this.resetSelection();
      if (this.pairs === this.symbols.length) this.endGame(true);
      return;
    }

    this.locked = true;
    setTimeout(() => {
      if (this.firstCard) this.firstCard.classList.remove("is-flipped");
      if (this.secondCard) this.secondCard.classList.remove("is-flipped");
      this.firstCard?.setAttribute("aria-label", "숨겨진 카드");
      this.secondCard?.setAttribute("aria-label", "숨겨진 카드");
      this.resetSelection();
    }, 850);
  }

  resetSelection() {
    this.firstCard = null;
    this.secondCard = null;
    this.locked = false;
  }

  endGame(won) {
    clearInterval(this.timer);
    this.locked = true;
    this.overlayTitle.textContent = won ? "승리했습니다!" : "시간 종료";
    this.overlayMessage.textContent = won
      ? `${this.flips}회 뒤집기로 모든 카드를 완성했습니다.`
      : "카드를 다시 섞어 한 번 더 도전해 보세요.";
    this.overlayButton.textContent = "다시 시작";
    this.overlay.classList.add("is-visible");
  }
}

new MemoryGame();
