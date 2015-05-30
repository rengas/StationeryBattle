/**
 * Created with JetBrains WebStorm.
 * User: sunchenchen
 * Date: 13-1-25
 * Time: PM2:55
 */

// @author U096089W Saikrishnan Ranganathan
window.requestAnimFrame = (function () {
    return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            return window.setTimeout(callback, 1000 / 60);
        };
})();
// @author U096089W Saikrishnan Ranganathan
window.cancelRequestAnimFrame = (function () {
    return window.cancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame ||
        window.mozCancelRequestAnimationFrame ||
        window.oCancelRequestAnimationFrame ||
        window.msCancelRequestAnimationFrame ||
        clearTimeout
})();


/**
 *
 * GAME STATE CONSTANTS
 */
const GAME_NOT_READY = -1;
const GAME_STATE_P1 = 1;
const GAME_STATE_P2 = 2;
const GAME_STATE_SIMULATING_PHYSICS_P1 = 3;
const GAME_STATE_SIMULATING_PHYSICS_P2 = 4;
const GAME_STATE_WON_P1 = 5;
const GAME_STATE_WON_P2 = 6;
const GAME_STATE_DRAW = 7;

/**
 *
 * Global Variables
 */
var CURRENT_ITEM_SELECTED = 0;
var FPS = 60;
var DELTA_T = 1 / FPS;
var CANVAS_WIDTH_IN_METER = 0.5;
var CANVAS_HEIGHT_IN_METER = 0.5;
var METER_TO_PIXEL_RATIO = 512 / CANVAS_WIDTH_IN_METER;
var DEBUG_MODE = false;
var DRAW_BOUNDBOX = false;
var _currentItemSelected = -1;

var renderLoop;

var surfaceCanvas;
var itemCanvas;

var itemList = [];
var surfaceList = [];
var player1List = [];
var player2List = [];

var physicsEngine;

var logOnce = false;

var player1ItemImage = new Image();

var player2ItemImage = new Image();
// @author U099151W ChenChen Sun
function convertMeterToPixel(p) {
    p.x = p.x * METER_TO_PIXEL_RATIO
    p.y = p.y * METER_TO_PIXEL_RATIO;
    return p;
}
// @author U099151W ChenChen Sun
function convertPixelToMeter(a) {
    a = a / METER_TO_PIXEL_RATIO;
    return a;
}
// @author U099151W ChenChen Sun
var Vector = function (x, y) {
    this.x = x;
    this.y = y;
}

// @author U099151W ChenChen Sun
function constructPartialItem(item) {
    return {
        id:item.id,
        name:item.name,
        inPlay:item.inPlay,
        surfaceMu:item.surfaceMu,
        surfaceCrr:item.surfaceCrr,
        cx:item.cx,
        cy:item.cy,
        vx:item.vx,
        vy:item.vy,
        mass:item.mass,
        shape:item.shape,
        boundingBox:item.boundingBox,
        rotation:item.rotation,
        angularV:item.angularV,
        inertia:item.inertia,
        speculated:item.speculated
    }
}
// item and surface constructors
// @author U096089W Saikrishnan Ranganathan
var Item = function (id, name, inPlay, surfaceMu, cx, cy, rotation, vx, vy, mass, imagePath, boundingBox, shape, draw) {
    this.id = typeof id !== 'undefined' ? id : -1;
    this.name = typeof name !== 'undefined' ? name : 'item';
    this.inPlay = typeof inPlay !== 'undefined' ? inPlay : false;
    this.surfaceMu = typeof surfaceMu !== 'undefined' ? surfaceMu : 0.0;
    this.surfaceCrr = 5;
    this.cx = typeof cx !== 'undefined' ? cx : 0.0;
    this.cy = typeof cy !== 'undefined' ? cy : 0.0;
    this.rotation = typeof rotation !== 'undefined' ? rotation : 0.0;
    this.vx = typeof vx !== 'undefined' ? vx : 0.0;
    this.vy = typeof vy !== 'undefined' ? vy : 0.0;
    this.mass = typeof mass !== 'undefined' ? mass : 0.0;
    this.angularV = 0.0;
    this.inertia = 0.005;
    this.speculated = 0;

    this.imageObj = new Image();
    this.imageObj.src = typeof imagePath !== 'undefined' ? imagePath : null;
    var that = this;
    this.imageObj.onload = function () {


        that.shape = shape;
        // TEMP
        /*        var p1 = new Vector(-that.imageObj.width / (2 * METER_TO_PIXEL_RATIO), +that.imageObj.height / (2 * METER_TO_PIXEL_RATIO));
         var p2 = new Vector(that.imageObj.width / (2 * METER_TO_PIXEL_RATIO), +that.imageObj.height / (2 * METER_TO_PIXEL_RATIO));
         var p3 = new Vector(that.imageObj.width / (2 * METER_TO_PIXEL_RATIO), -that.imageObj.height / (2 * METER_TO_PIXEL_RATIO));
         var p4 = new Vector(-that.imageObj.width / (2 * METER_TO_PIXEL_RATIO), -that.imageObj.height / (2 * METER_TO_PIXEL_RATIO));
         that.shape.push(p1);
         that.shape.push(p2);
         that.shape.push(p3);
         that.shape.push(p4);*/
        // TEMP

        // [TODO] ADD shape loader here
        // for (var i=0; i< shape.length; i++
        // {
        //  this.shape.push(shape[i]);
        // }


        // [TODO] MODIFY

        that.boundingBox = boundingBox;
        // example
        //var p1 = new Vector(boundingBox[0].x, boundingBox[1].y);
        /* that.boundingBox.push(p1);
         that.boundingBox.push(p2);
         that.boundingBox.push(p3);
         that.boundingBox.push(p4);*/
    };

    this.isItemInPlay = function () {

        var surfaceWidth = itemCanvas.width;
        var surfaceHeight = itemCanvas.height;
        var p = convertMeterToPixel({x:this.cx, y:this.cy});
        if ((p.x - this.imageObj.width / (2 * METER_TO_PIXEL_RATIO)) > surfaceWidth ||
            (p.y - this.imageObj.height / (2 * METER_TO_PIXEL_RATIO)) > surfaceHeight ||
            (p.y - this.imageObj.height / (2 * METER_TO_PIXEL_RATIO)) < 0 ||
            (p.x - this.imageObj.width / (2 * METER_TO_PIXEL_RATIO)) < 0) {
            //if (p.x > surfaceWidth || p.y > surfaceHeight || p.x < 0 || p.y < 0) {
            this.inPlay = false;
            return false;
        }

        return true;
    };
}
// @author U099151W ChenChen Sun
Item.prototype.draw = function (canvas, context2D) {

    if (!this.inPlay) {
        return;
    }
    var p = convertMeterToPixel({x:this.cx, y:this.cy});
    context2D.save();
    context2D.translate(p.x, p.y);
    context2D.rotate(this.rotation);

    // draw bounding box
    if (this.id === _currentItemSelected) {
        context2D.save();
        context2D.beginPath();
        for (var i = 0; i < this.boundingBox.length; i++) {
            context2D.moveTo(this.boundingBox[i].x * METER_TO_PIXEL_RATIO, this.boundingBox[i].y * METER_TO_PIXEL_RATIO);
            context2D.lineTo(this.boundingBox[(i + 1) % this.boundingBox.length].x * METER_TO_PIXEL_RATIO,
                this.boundingBox[(i + 1) % this.boundingBox.length].y * METER_TO_PIXEL_RATIO)
        }
        context2D.lineWidth = 2;
        context2D.strokeStyle = '#00ff00';

        context2D.stroke();
        context2D.restore();
    }

    if (!DEBUG_MODE) {

        // draw shape
        context2D.save();
        context2D.beginPath();
        for (var i = 0; i < this.shape.length; i++) {
            context2D.moveTo(this.shape[i].x * METER_TO_PIXEL_RATIO, this.shape[i].y * METER_TO_PIXEL_RATIO);
            context2D.lineTo(this.shape[(i + 1) % this.shape.length].x * METER_TO_PIXEL_RATIO,
                this.shape[(i + 1) % this.shape.length].y * METER_TO_PIXEL_RATIO)
        }
        context2D.lineWidth = 2;
        context2D.strokeStyle = '#ffeebb';
        context2D.stroke();
        context2D.restore();


    }

    context2D.translate(this.boundingBox[0].x * METER_TO_PIXEL_RATIO, this.boundingBox[0].y * METER_TO_PIXEL_RATIO);

    var w = (this.boundingBox[2].x - this.boundingBox[0].x) * METER_TO_PIXEL_RATIO;
    var h = (this.boundingBox[2].y - this.boundingBox[0].y) * METER_TO_PIXEL_RATIO;
    if (this.inPlay)
        context2D.drawImage(this.imageObj, 0, 0, w, h);

    if (controller.playerList[0].isPlayersItem(this)) {
        context2D.drawImage(player1ItemImage, this.boundingBox[3].x, this.boundingBox[3].y);
    } else if (controller.playerList[1].isPlayersItem(this)) {
        context2D.drawImage(player2ItemImage, this.boundingBox[3].x, this.boundingBox[3].y);
    }

    context2D.restore();
}
// @author U099151W ChenChen Sun
var Surface = function (id, name, w, h, originX, originY, surfaceMu, imagePath, draw) {
    this.id = typeof id !== 'undefined' ? id : -1;
    this.name = typeof name !== 'undefined' ? name : 'item';
    this.surfaceMu = typeof surfaceMu !== 'undefined' ? surfaceMu : 0.0;
    this.surfaceCrr = 0.0;
    this.w = typeof w !== 'undefined' ? w : 0.0;
    this.h = typeof cy !== 'undefined' ? h : 0.0;
    this.originX = typeof vx !== 'undefined' ? originX : 0.0;
    this.originY = typeof vy !== 'undefined' ? originY : 0.0;
    this.imageObj = new Image();
    this.imageObj.src = typeof imagePath !== 'undefined' ? imagePath : null;
}
// @author U099151W ChenChen Sun
Surface.prototype.draw = function (canvas, context2D) {
    context2D.drawImage(this.imageObj, this.originX, this.originY);
}

/**
 * RENDERER PART HERE
 */
// @author U099151W ChenChen Sun
var Renderer = function () {
    this.itemCanvas = document.getElementById('itemCanvas');
    this.itemContext2D = this.itemCanvas.getContext('2d');
    this.surfaceCanvas = document.getElementById('surfaceCanvas');
    this.surfaceContext2D = this.surfaceCanvas.getContext('2d');
}

Renderer.prototype.draw = function (mousePosition, mouseState) {
    this.itemContext2D.clearRect(0, 0, this.itemCanvas.width, this.itemCanvas.height);

    var Trig = {
        distanceBetween2Points:function (point1x, point1y, point2x, point2y) {

            var dx = point2x - point1x;
            var dy = point2y - point1y;
            return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        }

    }
    var radius = 3;
    var twoPI = 2 * Math.PI;
    var pointDistance = parseInt(Trig.distanceBetween2Points(mousePosition.start[0], mousePosition.start[1], mousePosition.end[0], mousePosition.end[1]));

    // render the user input line and angle
    // @author A0072987L Soong Cun Kang
    if (mouseState === 3) {
        this.itemContext2D.save();
        this.itemContext2D.beginPath();
        this.itemContext2D.moveTo(mousePosition.start[0], mousePosition.start[1]);
        this.itemContext2D.lineTo(mousePosition.end[0], mousePosition.end[1])
        this.itemContext2D.lineWidth = 10;
        this.itemContext2D.strokeStyle = '#ff0000';
        this.itemContext2D.stroke();
        this.itemContext2D.restore();

        this.itemContext2D.save();
        this.itemContext2D.lineWidth = 10;

        if (pointDistance <= 30) {
            this.itemContext2D.strokeStyle = '#33FF00';
            this.itemContext2D.stroke();
            this.itemContext2D.restore();
        }
        else if (pointDistance <= 60) {
            this.itemContext2D.strokeStyle = '#33CC00';
            this.itemContext2D.stroke();
            this.itemContext2D.restore();
        }
        else if (pointDistance <= 90) {
            this.itemContext2D.strokeStyle = '#66CC00';
            this.itemContext2D.stroke();
            this.itemContext2D.restore();
        }

        else if (pointDistance <= 120) {
            this.itemContext2D.strokeStyle = '#669900';
            this.itemContext2D.stroke();
            this.itemContext2D.restore();
        }

        else if (pointDistance <= 170) {
            this.itemContext2D.strokeStyle = '#666600';
            this.itemContext2D.stroke();
            this.itemContext2D.restore();
        }

        else if (pointDistance <= 250) {
            this.itemContext2D.strokeStyle = '#CC0000';
            this.itemContext2D.stroke();
            this.itemContext2D.restore();
        }
        else {
            this.itemContext2D.strokeStyle = '#990000';
            this.itemContext2D.stroke();
            this.itemContext2D.restore();
        }

        this.itemContext2D.save();
        this.itemContext2D.beginPath();
        this.itemContext2D.arc(mousePosition.start[0], mousePosition.start[1], radius, 0, twoPI, false);
        this.itemContext2D.lineWidth = 10;
        this.itemContext2D.strokeStyle = '#ff0000';
        this.itemContext2D.stroke();
        this.itemContext2D.beginPath();
        this.itemContext2D.restore();
    }
    // render surfaces and items
    // @author U099151W ChenChen Sun
    for (var i = 0; i < itemList.length; i++) {
        itemList[i].draw(this.itemCanvas, this.itemContext2D);
    }


    for (var j = 0; j < surfaceList.length; j++) {
        surfaceList[j].draw(this.surfaceCanvas, this.surfaceContext2D);
    }
}

/**
 * Controller Part here
 */
// @author U099151W ChenChen Sun
var inputManager = function () {
    var _mouseDownX = 0.0;
    var _mouseDownY = 0.0;
    var _mouseUpX = 0.0;
    var _mouseUpY = 0.0;
    var _mouseMoveX = 0.0;
    var _mouseMoveY = 0.0;
    var _mouseStartX = 0.0;
    var _mouseStartY = 0.0;

    // state 0 : no item selected
    // state 1 : one item is selected
    var _mouseState = 0;

    var _force = 0.0;
    var _angle = 0.0;
    var FORCE_MODIFIER = 60;
    var _itemSelected = false;


    function selectItemSingular(mouseX, mouseY, itemId) {
        var item = itemList[itemId];
        var p = convertMeterToPixel({x:item.cx, y:item.cy});

        // translate
        mouseX = mouseX - p.x;
        mouseY = mouseY - p.y;

        // rotate
        var r = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
        var angle = Math.atan2(mouseY, mouseX);
        angle = angle - item.rotation;

        mouseX = r * Math.cos(angle);
        mouseY = r * Math.sin(angle);

        // [TODO] MOVE TO MAIN
        if (mouseX <= item.boundingBox[2].x * METER_TO_PIXEL_RATIO && mouseX >= item.boundingBox[0].x * METER_TO_PIXEL_RATIO
            && mouseY <= item.boundingBox[2].y * METER_TO_PIXEL_RATIO && mouseY >= item.boundingBox[0].y * METER_TO_PIXEL_RATIO)
            return itemId;
        else
            return -1;
    }

    function selectItem(mouseX, mouseY) {
        var selectedId = -1;
        _mouseState = 0;
        for (var i = 0; i < itemList.length; i++) {
            selectedId = selectItemSingular(mouseX, mouseY, i);
            if (selectedId !== -1) {
                _itemSelected = true;
                _mouseState = 1;
                break;
            }
        }
        _currentItemSelected = selectedId;

        if (_currentItemSelected != -1 && !controller.currentPlayer.isPlayersItem(itemList[_currentItemSelected])) {
            console.log("Not your item");
            _mouseState = 0;
            _currentItemSelected = -1;
        }
    }

    this.initial = function (itemCanvas) {
        itemCanvas.addEventListener('mousedown', this.mouseDown);
        itemCanvas.addEventListener('mouseup', this.mouseUp);
        itemCanvas.addEventListener('mousemove', this.mouseMove);
    }

    this.mouseDown = function (evt) {
        _mouseDownX = evt.pageX;
        _mouseDownY = evt.pageY;
        if (_mouseState === 0) {
            selectItem(_mouseDownX, _mouseDownY);
            console.log('mouseDown State 0');
            console.log(_mouseState);
        }
        if (_mouseState === 1) {
            selectItem(_mouseDownX, _mouseDownY);
            console.log('mouseDown: select');
            if (_mouseState === 1)
                _mouseState = 2;
        }
        console.log('mouseDown');
        console.log(_mouseState);
    }

    this.mouseUp = function (evt) {
        _mouseUpX = evt.pageX;
        _mouseUpY = evt.pageY;
        if (_mouseUpX === _mouseDownX && _mouseUpY === _mouseDownY) {

            if (_mouseState === 2) {
                _mouseStartX = evt.pageX;
                _mouseStartY = evt.pageY;
                _mouseState = 3;
            }
            else if (_mouseState === 3) {
                var offsetX = _mouseUpX - _mouseStartX;
                var offsetY = _mouseUpY - _mouseStartY;
                _force = Math.sqrt(offsetX * offsetX + offsetY * offsetY) / FORCE_MODIFIER;
                _angle = Math.atan2(offsetY, offsetX);

                var distanceVecX = itemList[_currentItemSelected].cx - _mouseStartX / METER_TO_PIXEL_RATIO;
                var distanceVecY = itemList[_currentItemSelected].cy - _mouseStartY / METER_TO_PIXEL_RATIO;
                var distanceVec = new Vector(distanceVecX, distanceVecY);

                logOnce = true;
                console.log('mouseUp: send');
                console.log(_force + ", " + _angle / Math.PI * 180);
                console.log(JSON.stringify(constructPartialItem(itemList[_currentItemSelected])));
                console.log("Player Item List: ");
                console.log(controller.currentPlayer.itemList);


                physicsEngine.postMessage({cmd:'initial', itemOnScreen:JSON.stringify(constructPartialItem(itemList[_currentItemSelected])),
                    force:_force, angle:(_angle), distanceVec:distanceVec});

                controller.currentGameState = controller.currentPlayer.id === 1 ? GAME_STATE_SIMULATING_PHYSICS_P1 : GAME_STATE_SIMULATING_PHYSICS_P2;

                _currentItemSelected = -1;
                _mouseState = 0;
            }
        }
    }

    this.mouseMove = function (evt) {
        _mouseMoveX = evt.pageX;
        _mouseMoveY = evt.pageY;
    }

    this.isItemSelected = function () {
        return _itemSelected;
    }

    this.selectedItemId = function () {
        return _currentItemSelected;
    }

    this.getPlayerForceAndAngle = function () {
        return {force:_force, angle:_angle};
    }
    this.getPlayerMouse = function () {
        return {start:[_mouseStartX, _mouseStartY], end:[_mouseMoveX, _mouseMoveY]};
    }
    this.getMouseState = function () {
        return _mouseState;
    }
};
// @author U096089W Saikrishnan Ranganathan
var Controller = function (playersAndItems) {
    this.currentGameState = GAME_NOT_READY;
    this.playerList = [];


    if (typeof playersAndItems === 'undefined' || !playersAndItems.length > 0) {
        throw "empty playerAndItems list";
    }

    //initialize player list
    for (var i = 0; i < playersAndItems.length; i++) {
        this.playerList.push(new Player(playersAndItems[i].id, playersAndItems[i].items));
    }

    this.currentPlayer = this.playerList[0];
    this.inputManager = new inputManager();
};
// @author U096089W Saikrishnan Ranganathan
Controller.prototype.endGame = function () {

    var player1 = this.playerList[0];
    var player2 = this.playerList[1];

    if (player1.score.getValue() > player2.score.getValue()) {
        this.currentGameState = GAME_STATE_WON_P1;
    } else if (player1.score.getValue() < player2.score.getValue()) {
        this.currentGameState = GAME_STATE_WON_P2;
    } else {
        this.currentGameState = GAME_STATE_DRAW;
    }

    // print winner is.. screen
    var context2D = itemCanvas.getContext('2d');
    context2D.save();
    context2D.font = "italic 20pt Calibri";
    context2D.textAlign = "center";
    context2D.textBaseline = "middle";
    context2D.fillStyle = 'red'

    if (this.currentGameState === GAME_STATE_WON_P1) {
        context2D.fillText("Game Over. Winner is Player 1", itemCanvas.width / 2, itemCanvas.height / 2);
    } else if (this.currentGameState === GAME_STATE_WON_P2) {
        context2D.fillText("Game Over. Winner is Player 2", itemCanvas.width / 2, itemCanvas.height / 2);
    } else {
        context2D.fillText("Game Over. Draw", itemCanvas.width / 2, itemCanvas.height / 2);
    }
    context2D.restore();

    // unhook renderer from setInterval and terminate physics worker
    cancelRequestAnimFrame(renderLoop);
    physicsEngine.terminate();
    console.log("game ends");
};
// @author U096089W Saikrishnan Ranganathan
Controller.prototype.drawCurrentPlayer = function () {

    var context2D = surfaceCanvas.getContext('2d');
    context2D.save();
    context2D.font = "bold 15px sans-serif";
    context2D.textBaseline = "top";
    var playerTurn = "";

    if (this.currentGameState === GAME_STATE_P1) {
        playerTurn = "Player 1 Turn";
    } else if (this.currentGameState === GAME_STATE_P2) {
        playerTurn = "Player 2 Turn";
    }

    context2D.fillStyle = 'purple'
    context2D.fillText(playerTurn, 210, 5);

    context2D.restore();

}
// @author U096089W Saikrishnan Ranganathan
Controller.prototype.setRendererLoop = function (renderer, physicsEngine) {
    if (!DEBUG_MODE) {
        renderLoop = requestAnimationFrame(animLoop);

        function animLoop() {

            renderLoop = requestAnimationFrame(animLoop);

            renderer.draw(controller.inputManager.getPlayerMouse(), controller.inputManager.getMouseState());

            var itemL = [];
            for (var i = 0; i < itemList.length; i++) {
                var newItem = constructPartialItem(itemList[i]);
                itemL.push(newItem);
            }
            physicsEngine.postMessage({'cmd':'updateItems', 'itemsOnScreen':JSON.stringify(itemL)});
            controller.updateScore();
            controller.drawCurrentPlayer();
        }
    } else {
        renderLoop = function (evt) {
            // press d
            if (evt.keyCode === 100) {
                setTimeout(
                    function () {
                        renderer.draw(controller.inputManager.getPlayerMouse(), controller.inputManager.getMouseState());

                        var itemL = [];
                        for (var i = 0; i < itemList.length; i++) {
                            var newItem = constructPartialItem(itemList[i]);
                            itemL.push(newItem);
                        }
                        physicsEngine.postMessage({'cmd':'updateItems', 'itemsOnScreen':JSON.stringify(itemL)});
                        controller.updateScore();
                        controller.drawCurrentPlayer();
                    }
                    , DELTA_T * 1000);
            }
        }
        window.addEventListener('keypress', renderLoop);
    }
};

// initialize item start location, player number, etc
// @author U099151W ChenChen Sun
Controller.prototype.initial = function (renderer, physicsEngine) {

    // init game item and surfaces
    this.loadResources();

    // get user input
    // set item initial speed event
    this.inputManager.initial(renderer.itemCanvas);

    this.setRendererLoop(renderer, physicsEngine);

    this.currentPlayer = this.playerList[0];
    this.currentGameState = GAME_NOT_READY;

};

Controller.prototype.loadResources = function () {
    // [TODO] using config.xml to load automatically
    // load items

    // hardcoded first
    var newSurface = new Surface(surfaceList.length, 'woodenSurface', 512, 512, 0, 0, 0.5, 'resources/img/surface/WoodenSurface.jpg', null);
    surfaceList.push(newSurface);


    var itemStats = JSON.parse(itemConfigure).items;
    for (var i = 0; i < itemStats.length; i++) {
        var newItem = new Item(itemList.length, itemStats[i].name, false, itemStats[i].surfaceMu,
            itemStats[i].center.cx, itemStats[i].center.cy,
            itemStats[i].rotation, itemStats[i].velocity.vx, itemStats[i].velocity.vy,
            itemStats[i].mass, itemStats[i].imagePath, itemStats[i].boundingBox, itemStats[i].shape, null);
        itemList.push(newItem);

    }
    //itemList[0].inPlay = true;
    var itemRegion = document.getElementById('itemRegion');
    for (var i = 0; i < itemStats.length; i++) {
        var imgWidth = (itemStats[i].boundingBox[2].x - itemStats[i].boundingBox[0].x) * METER_TO_PIXEL_RATIO;
        var newImg = document.createElement('img');
        newImg.src = itemStats[i].imagePath;
        newImg.draggable = true;
        newImg.width = imgWidth;
        newImg.id = 'item_' + i;
        newImg.ondragstart = function (ev) {
            ev.dataTransfer.setData('ID', ev.target.id);
        }
        itemRegion.appendChild(newImg);
    }

    // itemCanvas displays the item on the position when the img is dropped
    var itemCanvas = document.getElementById('itemCanvas');
    itemCanvas.ondragover = function (ev) {
        ev.preventDefault();
    }
    itemCanvas.ondrop = function (ev) {
        ev.preventDefault();

        // remove item from select region
        var imgId = ev.dataTransfer.getData('ID');
        var itemId = imgId.split('_')[1];
        itemList[itemId].inPlay = true;
        itemList[itemId].cx = ev.clientX / METER_TO_PIXEL_RATIO;
        itemList[itemId].cy = ev.clientY / METER_TO_PIXEL_RATIO;

        // push to the correct player list
        var playerId = document.getElementById('playerSelect').innerHTML.split(' ')[1];
        if (playerId === '1') {
            player1List.push(itemList[itemId]);
            document.getElementById('playerSelect').innerHTML = 'Player 2 selects item';
        } else if (playerId === '2') {
            player2List.push(itemList[itemId]);
            document.getElementById('playerSelect').innerHTML = 'Player 1 selects item';
        }


        var imgElement = document.getElementById(imgId);
        var itemRegion = imgElement.parentNode;
        itemRegion.removeChild(imgElement);
        if (itemRegion.childElementCount === 1) {
            document.getElementById('playerSelect').innerHTML = 'Game Starts';
            controller.currentGameState = GAME_STATE_P1;
        }

        console.log(itemId);
        console.log(ev.clientX);
        console.log(ev.clientY);
    }

    // REMOVE this line to MODIFY
    //player1List.push(itemList[0]);

    // test case
    if (DEBUG_MODE) {
        itemList[2].vx = 4;
        itemList[2].vy = 8;
        itemList[3].cx = 0.4;
        itemList[3].cy = 0.3;
        itemList[3].vx = 0;
        itemList[3].vy = 0;
        //item1.angularV = 10;
        //item2.vy = -2;
        //item1.vy=8;
    }

}
// @author U096089W Saikrishnan Ranganathan
// when receiving messages from physics engine thread
function updateFromPhysicsEngine(e) {
    var update = JSON.parse(e.data);

    controller.updateGameState();

    // case when physics simulation is done
    if (update.type === 'updateItemsState' && update.items.length === 0 &&
        (controller.currentGameState === GAME_STATE_SIMULATING_PHYSICS_P1 || controller.currentGameState === GAME_STATE_SIMULATING_PHYSICS_P2)) {
        console.log("Update game state called with current game state " + controller.currentGameState);

    }

    if (update.type === 'updateItemsState') {
        var i = 0;
        //console.log("main Thread update:" + e.data);
        for (i = 0; i < update.items.length; i++) {
            var itemToUpdate = itemList[update.items[i].id];

            itemToUpdate.cx = update.items[i].cx;
            itemToUpdate.cy = update.items[i].cy;
            itemToUpdate.vx = update.items[i].vx;
            itemToUpdate.vy = update.items[i].vy;
            itemToUpdate.angularV = update.items[i].angularV;
            itemToUpdate.rotation = update.items[i].rotation;
            itemToUpdate.speculated = update.items[i].speculated;
            //controller.currentGameState = (controller.currentPlayer.id === 1 ? GAME_STATE_SIMULATING_PHYSICS_P1 : GAME_STATE_SIMULATING_PHYSICS_P2);

        }
    }
    else if (update.type === 'setItemInMotion') {
        var itemToSetInMotion = itemList[update.item.id];

        delete itemList[update.item.id];

        itemToSetInMotion.cx = update.item.cx;
        itemToSetInMotion.cy = update.item.cy;
        itemToSetInMotion.vx = update.item.vx;
        itemToSetInMotion.vy = update.item.vy;
        itemToSetInMotion.angularV = update.item.angularV;
        itemToSetInMotion.rotation = update.item.rotation;

        //console.log("main Thread impulse:" + e.data);

        logOnce = true;
        itemList[update.item.id] = itemToSetInMotion;
    }
    //console.log('Physics Engine said: ', e.data);
}
// @author U096089W Saikrishnan Ranganathan
Controller.prototype.updateScore = function (canvas) {
    var player1 = this.playerList[0];
    var player2 = this.playerList[1];

    var player1ItemList = player1.itemList;
    var player2ItemList = player2.itemList;

    // update score
    // need to check every render loop?
    for (var i = 0; i < player1ItemList.length; i++) {
        if (!player1ItemList[i].isItemInPlay()) {
            player1ItemList.splice(i, 1);
            console.log("Player 2 score incremented\n Player 1 list");
            console.log(player1ItemList);
            player2.score.increment();
        }
    }

    for (var i = 0; i < player2ItemList.length; i++) {
        if (!player2ItemList[i].isItemInPlay()) {
            player2ItemList.splice(i, 1);
            console.log("Player 1 score incremented\n PLayer2 list");
            console.log(player2ItemList);
            player1.score.increment();
        }
    }

    //update score on screen
    var context2D = surfaceCanvas.getContext('2d');
    context2D.save();
    context2D.font = "bold 15px sans-serif";
    context2D.textBaseline = "top";

    context2D.fillStyle = 'green'
    context2D.fillText("Player 1: " + player1.score.getValue(), 8, 5);

    context2D.fillStyle = 'blue'
    context2D.fillText("Player 2: " + player2.score.getValue(), 430, 5);

    context2D.restore();

    if (!this.playerList[0].isStillInPlay() || !this.playerList[1].isStillInPlay()) {
        this.endGame();
    }
};
// @author U096089W Saikrishnan Ranganathan
Controller.prototype.updateGameState = function () {

//    if (this.currentGameState !== GAME_STATE_SIMULATING_PHYSICS_P1 || this.currentGameState !== GAME_STATE_SIMULATING_PHYSICS_P2) {
//        throw "Unexpected Current Game State: " + this.currentGameState;
//    }
    this.updateScore();

    if (this.currentGameState === GAME_STATE_SIMULATING_PHYSICS_P1) {
        this.currentGameState = GAME_STATE_P2;
        this.currentPlayer = this.playerList[1];
    } else if (this.currentGameState === GAME_STATE_SIMULATING_PHYSICS_P2) {
        this.currentGameState = GAME_STATE_P1;
        this.currentPlayer = this.playerList[0];
    }
};
// @author U096089W Saikrishnan Ranganathan
var Player = function (id, itemList) {
    this.itemList = itemList;
    this.id = id;
    this.inPlay = true;

    this.score = function () {
        var value = 0;

        return {
            increment:function (inc) {
                value += typeof inc === 'number' ? inc : 1;
            },
            getValue:function () {
                return value;
            }
        };
    }();

    this.isPlayersItem = function (item) {
        for (var i = 0; i < this.itemList.length; i++) {
            if (item.id === this.itemList[i].id) {
                return true;
            }
        }
        return false;
    };

    this.isStillInPlay = function () {
        var isStillInPlay = false;

        if (controller.currentGameState === GAME_NOT_READY)
            return true;

        for (var i = 0; i < this.itemList.length; i++) {
            if (itemList[i].isItemInPlay()) {
                isStillInPlay = true;
            }
        }

        this.inPlay = isStillInPlay;
        return isStillInPlay;

    };
};


/**
 *  Physics Engine Init
 **/
var physicsEngine;
var renderer;
var controller;
// @author U096089W Saikrishnan Ranganathan
window.onload = function () {
    physicsEngine = new Worker('PhysicsEngine/PhysicsEngine-sync.js');
    physicsEngine.addEventListener('message', updateFromPhysicsEngine, false);
    renderer = new Renderer();
    surfaceCanvas = document.getElementById("surfaceCanvas");
    itemCanvas = document.getElementById('itemCanvas');
    player1ItemImage.src = 'resources/img/item/Player 1.png';
    player2ItemImage.src = 'resources/img/item/Player 2.png';

    try {
        controller = new Controller([
            {id:1, items:player1List},
            {id:2, items:player2List}
        ]);
        controller.initial(renderer, physicsEngine);
    }
    catch (e) {
        if (e === "empty playerAndItems list") {
            console.log("Players and Items list not initialized");
        }
    }
}
