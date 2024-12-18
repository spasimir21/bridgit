enum Color {
  None = 'None',
  Red = 'Red',
  Blue = 'Blue'
}

enum Player {
  Red = 'Red',
  Blue = 'Blue'
}

const _try = (f: () => void) => {
  try {
    f();
  } catch {}
};

function setupGame(size: number) {
  const root = document.querySelector(':root')! as any;

  const elements = {
    game: document.querySelector('#game')!,
    gridContainer: document.querySelector('#grid-container')!,
    grid: document.querySelector('#grid')!,
    squareGrid: document.querySelector('#square-grid')!,
    lineGrid: document.querySelector('#line-grid')!,
    lineAltGrid: document.querySelector('#line-alt-grid')!,
    turnText: document.querySelector('#turn-text')!
  };

  elements.game.classList.remove('hidden');

  const fixGridSize = () => {
    const bb = elements.gridContainer.getBoundingClientRect();

    let pixelSize = 0;

    if (bb.width > bb.height) {
      (elements.grid as any).style.width = `${bb.height}px`;
      (elements.grid as any).style.height = `${bb.height}px`;
      pixelSize = bb.height;
    } else {
      (elements.grid as any).style.width = `${bb.width}px`;
      (elements.grid as any).style.height = `${bb.width}px`;
      pixelSize = bb.width;
    }

    const rowGap = (pixelSize - 50 * (size * 2 + 1)) / (size * 2);
    root.style.setProperty('--row-gap', `${rowGap}px`);
  };

  window.addEventListener('resize', fixGridSize);
  fixGridSize();

  const redSquareRow = `<div class="red-row">
    ${'<div class="circle"></div>'.repeat(size)}
  </div>`;

  const blueSquareRow = `<div class="blue-row">
    ${'<div class="circle"></div>'.repeat(size + 1)}
  </div>`;

  elements.squareGrid.innerHTML = (redSquareRow + blueSquareRow).repeat(size) + redSquareRow;

  const grid = {
    a: Array.from({ length: size }, () => Array.from({ length: size }, () => Color.None)),
    b: Array.from({ length: size - 1 }, () => Array.from({ length: size - 1 }, () => Color.None))
  };

  const redSquares = Array.from({ length: size + 1 }, () => Array.from({ length: size }, () => false));
  const blueSquares = Array.from({ length: size }, () => Array.from({ length: size + 1 }, () => false));

  const redConnectedTop = new Set<number>();
  const redConnectedBottom = new Set<number>();
  const blueConnectedLeft = new Set<number>();
  const blueConnectedRight = new Set<number>();

  for (let i = 0; i < size; i++) {
    redConnectedTop.add(i);
    redConnectedBottom.add(size ** 2 + i);

    blueConnectedLeft.add((size + 1) * i);
    blueConnectedRight.add((size + 1) * i + size);
  }

  redSquares[0].fill(true);
  redSquares[size].fill(true);

  for (let i = 0; i < size; i++) {
    blueSquares[i][0] = true;
    blueSquares[i][size] = true;
  }

  let currentTurn = Math.random() < 0.5 ? Player.Red : Player.Blue;

  const play = (isVertical: boolean, isAlt: boolean, i: number, j: number) => {
    const line = (isAlt ? altLines : lines)[i][j][isVertical ? 'verticalLine' : 'horizontalLine'];
    if (!line.classList.contains('active')) return;

    line.classList.add(currentTurn.toLowerCase());

    (isAlt ? grid.b : grid.a)[i][j] = currentTurn as any;

    if (currentTurn === Player.Red) {
      let index1 = 0;
      let index2 = 0;

      if (isVertical) {
        _try(() => (redSquares[i][j] = true));
        _try(() => (redSquares[i + 1][j] = true));

        index1 = i * size + j;
        index2 = (i + 1) * size + j;
      } else {
        _try(() => (redSquares[i + 1][j] = true));
        _try(() => (redSquares[i + 1][j + 1] = true));

        index1 = (i + 1) * size + j;
        index2 = (i + 1) * size + j + 1;
      }

      const isTop = redConnectedTop.has(index1) || redConnectedTop.has(index2);
      const isBottom = redConnectedBottom.has(index1) || redConnectedBottom.has(index2);

      if (isTop) {
        redConnectedTop.add(index1);
        redConnectedTop.add(index2);
      }

      if (isBottom) {
        redConnectedBottom.add(index1);
        redConnectedBottom.add(index2);
      }

      if (isTop && isBottom) {
        win(Color.Red);
        return;
      }
    } else {
      let index1 = 0;
      let index2 = 0;

      if (isVertical) {
        _try(() => (blueSquares[i][j + 1] = true));
        _try(() => (blueSquares[i + 1][j + 1] = true));

        index1 = i * (size + 1) + j + 1;
        index2 = (i + 1) * (size + 1) + j + 1;
      } else {
        _try(() => (blueSquares[i][j] = true));
        _try(() => (blueSquares[i][j + 1] = true));

        index1 = i * (size + 1) + j;
        index2 = i * (size + 1) + j + 1;
      }

      const isLeft = blueConnectedLeft.has(index1) || blueConnectedLeft.has(index2);
      const isRight = blueConnectedRight.has(index1) || blueConnectedRight.has(index2);

      if (isLeft) {
        blueConnectedLeft.add(index1);
        blueConnectedLeft.add(index2);
      }

      if (isRight) {
        blueConnectedRight.add(index1);
        blueConnectedRight.add(index2);
      }

      if (isLeft && isRight) {
        win(Color.Blue);
        return;
      }
    }

    currentTurn = currentTurn === Player.Red ? Player.Blue : Player.Red;
    update();
  };

  const lines = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => {
      const element = document.createElement('div');
      element.classList.add('line');

      const verticalLine = document.createElement('div');
      verticalLine.classList.add('vertical-line');
      verticalLine.addEventListener('click', () => play(true, false, i, j));

      const horizontalLine = document.createElement('div');
      horizontalLine.classList.add('horizontal-line');
      horizontalLine.addEventListener('click', () => play(false, false, i, j));

      element.appendChild(verticalLine);
      element.appendChild(horizontalLine);

      return { row: element, verticalLine, horizontalLine };
    })
  );

  const altLines = Array.from({ length: size - 1 }, (_, i) =>
    Array.from({ length: size - 1 }, (_, j) => {
      const element = document.createElement('div');
      element.classList.add('line');

      const verticalLine = document.createElement('div');
      verticalLine.classList.add('vertical-line');
      verticalLine.addEventListener('click', () => play(true, true, i, j));

      const horizontalLine = document.createElement('div');
      horizontalLine.classList.add('horizontal-line');
      horizontalLine.addEventListener('click', () => play(false, true, i, j));

      element.appendChild(verticalLine);
      element.appendChild(horizontalLine);

      return { row: element, verticalLine, horizontalLine };
    })
  );

  for (const row of lines) {
    const rowElement = document.createElement('div');
    rowElement.classList.add('line-row');
    rowElement.append(...row.map(i => i.row));
    elements.lineGrid.appendChild(rowElement);
  }

  for (const row of altLines) {
    const rowElement = document.createElement('div');
    rowElement.classList.add('line-row');
    rowElement.append(...row.map(i => i.row));
    elements.lineAltGrid.appendChild(rowElement);
  }

  const update = () => {
    root.style.setProperty('--turn-color', currentTurn === Player.Red ? 'tomato' : 'lightseagreen');
    elements.turnText.textContent = `${currentTurn}'s Turn`;

    for (const row of lines)
      for (const line of row) {
        line.horizontalLine.classList.remove('active');
        line.verticalLine.classList.remove('active');
      }

    for (const row of altLines)
      for (const line of row) {
        line.horizontalLine.classList.remove('active');
        line.verticalLine.classList.remove('active');
      }

    if (currentTurn === Player.Red) {
      for (let i = 0; i <= size; i++) {
        for (let j = 0; j < size; j++) {
          if (!redSquares[i][j]) continue;

          _try(() => grid.a[i][j] === Color.None && lines[i][j].verticalLine.classList.add('active'));
          _try(() => grid.a[i - 1][j] === Color.None && lines[i - 1][j].verticalLine.classList.add('active'));

          _try(() => grid.b[i - 1][j] === Color.None && altLines[i - 1][j].horizontalLine.classList.add('active'));
          _try(
            () => grid.b[i - 1][j - 1] === Color.None && altLines[i - 1][j - 1].horizontalLine.classList.add('active')
          );
        }
      }
    } else {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j <= size; j++) {
          if (!blueSquares[i][j]) continue;

          _try(() => grid.a[i][j] === Color.None && lines[i][j].horizontalLine.classList.add('active'));
          _try(() => grid.a[i][j - 1] === Color.None && lines[i][j - 1].horizontalLine.classList.add('active'));

          _try(() => grid.b[i][j - 1] === Color.None && altLines[i][j - 1].verticalLine.classList.add('active'));
          _try(
            () => grid.b[i - 1][j - 1] === Color.None && altLines[i - 1][j - 1].verticalLine.classList.add('active')
          );
        }
      }
    }

    let isDraw = true;

    for (let i = 0; i < grid.a.length; i++) {
      for (let j = 0; j < grid.a[0].length; j++) {
        if (grid.a[i][j] == Color.None) isDraw = false;
      }
    }

    for (let i = 0; i < grid.b.length; i++) {
      for (let j = 0; j < grid.b[0].length; j++) {
        if (grid.b[i][j] == Color.None) isDraw = false;
      }
    }

    if (isDraw) {
      win(Color.None);
      return;
    }
  };

  update();

  const win = (winner: Color) => {
    for (const row of lines)
      for (const line of row) {
        line.horizontalLine.classList.remove('active');
        line.verticalLine.classList.remove('active');
      }

    for (const row of altLines)
      for (const line of row) {
        line.horizontalLine.classList.remove('active');
        line.verticalLine.classList.remove('active');
      }

    // prettier-ignore
    elements.turnText.textContent =
        winner === Color.Red ? "Red Wins!"
      : winner === Color.Blue ? 'Blue Wins!'
      : 'Draw!';

    // @ts-ignore
    // prettier-ignore
    elements.turnText.style.color =
        winner === Color.Red ? "tomato"
      : winner === Color.Blue ? 'lightseagreen'
      : 'black';
  };
}

export { setupGame };
