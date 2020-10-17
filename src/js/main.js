/**
       * 1) Make board with parameters
       * 2) Place bombs randomly
       * 3) Clicking on a tile that is not a bomb will show number of bombs around it
       */
/**
 * TODO:
 *  Make win, loose sequence
 * Add animations
 * Add pictures
 */
var Minesweeper;
(function (Minesweeper) {
    var BOARD_SELECTOR = '[data-js-board]';
    var boardArray = [];
    var randomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    Minesweeper.Init = function () {
        preventRightClickContextMenu();
        var boardData = {
            sizeX: 24,
            sizeY: 24,
            bombs: 0
        };
        boardData.bombs = Math.round((boardData.sizeX * boardData.sizeY) * 0.17);
        var BOARD_SCHEMA = generateBoard(boardData);
        generateBoardHTML(BOARD_SCHEMA);
    };
    var preventRightClickContextMenu = function () {
        if (document.addEventListener) {
            document.addEventListener('contextmenu', function (e) {
                e.preventDefault();
            }, false);
        }
        else {
            document.attachEvent('oncontextmenu', function () {
                window.event.returnValue = false;
            });
        }
    };
    var generateBoard = function (data) {
        var sizeX = data.sizeX, sizeY = data.sizeY;
        boardArray = [];
        for (var y = 0; y < sizeY; y++) {
            var column = [];
            for (var x = 0; x < sizeX; x++) {
                var boardRow = { x: x, y: y, isBomb: false, isFlagged: false, isDisarmed: false };
                column.push(boardRow);
            }
            boardArray.push(column);
        }
        boardArray = assignBombs(data, boardArray);
        console.log(boardArray);
        return boardArray;
    };
    var generateBoardHTML = function (boardSchema) {
        var BOARD = $(BOARD_SELECTOR);
        boardSchema.map(function (column) {
            var rowHtml = $("<div class=\"board-row\"></div>");
            column.map(function (row) {
                rowHtml.append("<div class=\"cell \" data-x=" + row.x + " data-y=\"" + row.y + "\"></div>");
            });
            BOARD.append(rowHtml);
        });
        initCellClickListener();
    };
    var assignBombs = function (data, boardArray) {
        var sizeX = data.sizeX, sizeY = data.sizeY, bombs = data.bombs;
        for (var i = 0; i < bombs; i++) {
            var randomX = randomInt(0, sizeX - 1);
            var randomY = randomInt(0, sizeY - 1);
            boardArray[randomY][randomX].isBomb = true;
        }
        return boardArray;
    };
    var initCellClickListener = function () {
        $('.cell').mousedown(function (e) {
            var cell = $(e.target);
            switch (e.which) {
                case 1: // Left Mouse
                    handleClick(cell, 'defuse');
                    break;
                case 3: // Right Mouse
                    handleClick(cell, 'flag');
                    break;
                default:
                    alert('You have a strange Mouse!');
            }
        });
    };
    var handleClick = function (cell, action) {
        var CLICKED_X = cell.data('x');
        var CLICKED_Y = cell.data('y');
        var CLICKED_CELL = boardArray[CLICKED_Y][CLICKED_X];
        if (CLICKED_CELL.isDisarmed) {
            return;
        }
        if (action == 'defuse') {
            if (CLICKED_CELL.isBomb) {
                console.log('You lost :(');
                // Reveal all cells, bombs etc
                // Make a "LOST message"
            }
            else {
                console.log('Tried defusing', CLICKED_CELL);
                disarmCell(CLICKED_CELL);
            }
        }
        else if (action == 'flag') {
            console.log('Tried flagging', CLICKED_CELL);
            changeCellState(CLICKED_X, CLICKED_Y, 'flag');
        }
    };
    var changeCellState = function (cellX, cellY, state) {
        var cell = $(".cell[data-x=\"" + cellX + "\"][data-y=\"" + cellY + "\"]");
        if (state === 'disarm') {
            cell.addClass('safe');
            boardArray[cellY][cellX].isDisarmed = true;
        }
        else if (state === 'flag') {
            if (boardArray[cellY][cellX].isFlagged === true) {
                cell.removeClass('flag');
                boardArray[cellY][cellX].isFlagged = false;
            }
            else {
                cell.addClass('flag');
                boardArray[cellY][cellX].isFlagged = true;
            }
        }
    };
    var disarmCell = function (cell) {
        boardArray[cell.y][cell.x].isDisarmed = true;
        var cellsAround = checkCellsAround(cell);
        var bombsAround = countBombsNearby(cellsAround);
        changeCellState(cell.x, cell.y, 'disarm');
        var $cell = $(".cell[data-x=\"" + cell.x + "\"][data-y=\"" + cell.y + "\"]");
        if (bombsAround > 0) {
            $cell.text(bombsAround);
            if (bombsAround === 1) {
                $cell.css('color', 'blue');
            }
            else if (bombsAround === 2) {
                $cell.css('color', 'green');
            }
            else if (bombsAround === 3) {
                $cell.css('color', 'red');
            }
            else if (bombsAround === 4) {
                $cell.css('color', 'purple');
            }
        }
        else {
            // check other cells and open them if they are not bombs and have no bombs nearby. If do, stop
            for (var neighbor in cellsAround) {
                if (cellsAround[neighbor].isBomb === false &&
                    cellsAround[neighbor].isFlagged === false &&
                    cellsAround[neighbor].isDisarmed === false) {
                    disarmCell(cellsAround[neighbor]);
                }
            }
        }
        // check if next cells have no bombs, then open them too
    };
    var checkCellsAround = function (cell) {
        // If 5/12; open 4/12 4/11 4/13 5/11 5/13 6/11 6/12 6/13
        var x = cell.x, y = cell.y;
        var result = { N: {}, E: {}, S: {}, W: {}, NE: {}, SE: {}, SW: {}, NW: {} };
        if (x - 1 >= 0) { // get cell to W
            result.W = boardArray[y][x - 1];
        }
        if (y - 1 >= 0) { // get cell to N
            result.N = boardArray[y - 1][x];
        }
        if (x + 1 <= boardArray[0].length - 1) { // get cell to E
            result.E = boardArray[y][x + 1];
        }
        if (y + 1 <= boardArray.length - 1) { // get cell to S
            result.S = boardArray[y + 1][x];
        }
        if (x + 1 <= boardArray[0].length - 1 && y - 1 >= 0) { // get cell to NE
            result.NE = boardArray[y - 1][x + 1];
        }
        if (x - 1 >= 0 && y - 1 >= 0) { // get cell to NW
            result.NW = boardArray[y - 1][x - 1];
        }
        if (x + 1 <= boardArray[0].length - 1 && y + 1 <= boardArray.length - 1) { // get cell to SE
            result.SE = boardArray[y + 1][x + 1];
        }
        if (x - 1 >= 0 && y + 1 <= boardArray.length - 1) { // get cell to SW
            result.SW = boardArray[y + 1][x - 1];
        }
        return result;
    };
    var countBombsNearby = function (cellsAround) {
        var counter = 0;
        for (var cell in cellsAround) {
            if (cellsAround[cell].isBomb) {
                counter++;
            }
        }
        return counter;
    };
})(Minesweeper || (Minesweeper = {}));
$(document).ready(function () {
    Minesweeper.Init();
});
