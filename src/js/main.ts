/**
 * Made by Martin Goncharov 17.10.2020
 */


module Minesweeper {
    const BOARD_SELECTOR = '[data-js-board]';
    let boardArray = [];
    let gameEnded = false;

    const randomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const reinit = () => {
        $('#board').children().remove();
        hideMessage();
        gameEnded = false;
        Init();
    }

    export const Init = () => {
        preventRightClickContextMenu();
        initClickListeners();
        let boardData = {
            sizeX: 100,
            sizeY: 100,
            bombs: 0
        }
        boardData.bombs = Math.round((boardData.sizeX*boardData.sizeY) * 0.17);
        const BOARD_SCHEMA = generateBoard(boardData);
        generateBoardHTML(BOARD_SCHEMA);
    }

    const showMessageWithText = (text) => {
        $('.info-message').removeClass('hidden');
        $('.info-message').text(text);
    }
    const hideMessage = () => {
        $('.info-message').addClass('hidden');
    }

    const preventRightClickContextMenu = () => {
        let board = document.getElementById('board');
        if (board.addEventListener) {
            board.addEventListener('contextmenu', function (e) {
                e.preventDefault();
            }, false);
        } else {
            board.attachEvent('oncontextmenu', function () {
                window.event.returnValue = false;
            });
        }
    }

    const generateBoard = (data) => {
        let { sizeX, sizeY } = data;
        boardArray = [];
        for (let y = 0; y < sizeY; y++) {
            let column = [];

            for (let x = 0; x < sizeX; x++) {
                let boardRow = { x, y, isBomb: false, isFlagged: false, isDisarmed: false }
                column.push(boardRow);
            }
            boardArray.push(column)
        }
        boardArray = assignBombs(data, boardArray);
        return boardArray;
    }

    const generateBoardHTML = (boardSchema) => {
        const BOARD = $(BOARD_SELECTOR);

        boardSchema.map(column => {
            let rowHtml = $(`<div class="board-row"></div>`)
            column.map(row => {
                rowHtml.append(`<div class="cell " data-x=${row.x} data-y="${row.y}"></div>`)
            })
            BOARD.append(rowHtml);
        })

        initCellClickListener();
    }

    const assignBombs = (data, boardArray) => {
        let { sizeX, sizeY, bombs } = data;

        for (let i = 0; i < bombs; i++) {
            let randomX = randomInt(0, sizeX - 1);
            let randomY = randomInt(0, sizeY - 1);
            boardArray[randomY][randomX].isBomb = true
        }
        return boardArray

    }

    const initClickListeners = () => {
        $('.restart-button').off().on('click', e => {
            reinit();
        })
    }

    const initCellClickListener = () => {

        $('.cell').off().on('mousedown', e => {
            let cell = $(e.target);

            switch (e.which) {
                case 1: // Left Mouse
                    handleClick(cell, 'defuse');
                    break;
                case 3: // Right Mouse
                    handleClick(cell, 'flag');
                    break;
                default:
                    break;
            }
        });
    }

    const getCellElement = (cellX, cellY) => {
        return $(`.cell[data-x="${cellX}"][data-y="${cellY}"]`);

    }

    const showAllBombs = () => {
        boardArray.map(column => {
            column.map(cell => {
                if (cell.isBomb) {                    
                    getCellElement(cell.x, cell.y).addClass('bomb')
                }
            
            })
        })
    }

    const handleClick = (cell, action) => {
        const CLICKED_X = cell.data('x');
        const CLICKED_Y = cell.data('y');

        const CLICKED_CELL = boardArray[CLICKED_Y][CLICKED_X];

        if (CLICKED_CELL.isDisarmed || gameEnded === true) {
            return;
        }

        if (action == 'defuse') {
            if (CLICKED_CELL.isBomb) {
                $(cell).addClass('last-clicked')
                showAllBombs();
                gameEnded = true;
            } else {
                
                disarmCell(CLICKED_CELL)

            }
        } else if (action == 'flag') {
            changeCellState(CLICKED_X, CLICKED_Y, 'flag')

        }
    }

    const changeCellState = (cellX, cellY, state) => {
        let cell = $(`.cell[data-x="${cellX}"][data-y="${cellY}"]`);
        if (state === 'disarm') {
            cell.addClass('safe');
            cell.removeClass('flag');
            boardArray[cellY][cellX].isDisarmed = true;

        } else if (state === 'flag') {
            if (boardArray[cellY][cellX].isFlagged === true ) {
                cell.removeClass('flag')
                boardArray[cellY][cellX].isFlagged = false;
            } else {
                cell.addClass('flag')
                boardArray[cellY][cellX].isFlagged = true;
            }
            

        }
    }

    const disarmCell = (cell) => {
        boardArray[cell.y][cell.x].isDisarmed = true;
        let cellsAround: object = checkCellsAround(cell);
        let bombsAround = countBombsNearby(cellsAround);

        changeCellState(cell.x, cell.y, 'disarm');
        let $cell = $(`.cell[data-x="${cell.x}"][data-y="${cell.y}"]`);
        if (bombsAround > 0) {
            $cell.text(bombsAround)
            if (bombsAround === 1) {
                $cell.css('color', 'blue')
            } else if (bombsAround === 2) {
                $cell.css('color', 'green')
            } else if (bombsAround === 3) {
                $cell.css('color', 'red')
            } else if (bombsAround === 4) {
                $cell.css('color', 'purple')
            }
        } else {
            // check other cells and open them if they are not bombs and have no bombs nearby. If do, stop
            for (let neighbor in cellsAround) {
                if (cellsAround[neighbor].isBomb === false && 
                    cellsAround[neighbor].isFlagged === false && 
                    cellsAround[neighbor].isDisarmed === false ) {
                    
                        // setTimeout(() => {
                            disarmCell(cellsAround[neighbor])
                        // }, 10);
                }
            }

        }

        // check if next cells have no bombs, then open them too
    }

    const checkCellsAround = (cell) => {
        // If 5/12; open 4/12 4/11 4/13 5/11 5/13 6/11 6/12 6/13
        const { x, y } = cell;
        let result = { N: {}, E: {}, S: {}, W: {}, NE: {}, SE: {}, SW: {}, NW: {} };

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


    }

    const countBombsNearby = (cellsAround) => {
        let counter = 0;
        for (let cell in cellsAround) {
            if (cellsAround[cell].isBomb) {
                counter++;
            }
        }
        return counter;
    }



}


$(document).ready(() => {
    Minesweeper.Init();

})
