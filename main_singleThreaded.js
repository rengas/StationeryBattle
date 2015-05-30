/**
 * Created with JetBrains WebStorm.
 * User: sunchenchen
 * Date: 13-1-25
 * Time: PM2:55
 */

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

var DRAW_BOUNDBOX = true;
var _currentItemSelected = -1;

var renderLoop;

var surfaceCanvas;
var itemCanvas;

// DEBUG
var DEBUG_MODE = false;
var LAST_FORCE;
var LAST_ANGLE;
var LAST_DISTANCEVEC;

var itemList = [];
var surfaceList = [];
var player1List = [];
var player2List = [];

var physicsEngine;

var logOnce = false;

var player1ItemImage = new Image();

var player2ItemImage = new Image();

function convertMeterToPixel(p) {
    p.x = p.x * METER_TO_PIXEL_RATIO
    p.y = p.y * METER_TO_PIXEL_RATIO;
    return p;
}

function convertPixelToMeter(a) {
    a = a / METER_TO_PIXEL_RATIO;
    return a;
}

var Vector = function (x, y) {
    this.x = x;
    this.y = y;
}


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
        speculated : item.speculated
    }
}
// item and surface constructors
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
    this.shape = shape;
    this.boundingBox = boundingBox;

    this.imageObj = new Image();
    this.imageObj.src = typeof imagePath !== 'undefined' ? imagePath : null;
    var that = this;
    this.imageObj.onload = function () {



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
        for (var i=0; i<this.boundingBox.length; i++) {
            context2D.moveTo(this.boundingBox[i].x * METER_TO_PIXEL_RATIO, this.boundingBox[i].y * METER_TO_PIXEL_RATIO);
            context2D.lineTo(this.boundingBox[(i+1)%this.boundingBox.length].x * METER_TO_PIXEL_RATIO,
                this.boundingBox[(i+1)%this.boundingBox.length].y * METER_TO_PIXEL_RATIO)
        }
        context2D.lineWidth = 2;
        context2D.strokeStyle = '#00ff00';

        context2D.stroke();
        context2D.restore();
    }

    //if (!DEBUG_MODE) {

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
    //}

    context2D.translate(this.boundingBox[0].x * METER_TO_PIXEL_RATIO, this.boundingBox[0].y * METER_TO_PIXEL_RATIO);

    var w = (this.boundingBox[2].x - this.boundingBox[0].x) * METER_TO_PIXEL_RATIO;
    var h = (this.boundingBox[2].y - this.boundingBox[0].y) * METER_TO_PIXEL_RATIO;
    context2D.drawImage(this.imageObj, 0, 0, w, h);

    if (controller.playerList[0].isPlayersItem(this)) {
        context2D.drawImage(player1ItemImage, this.boundingBox[3].x, this.boundingBox[3].y);
    } else if (controller.playerList[1].isPlayersItem(this)) {
        context2D.drawImage(player2ItemImage, this.boundingBox[3].x, this.boundingBox[3].y);
    }

    context2D.restore();
}

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

Surface.prototype.draw = function (canvas, context2D) {
    context2D.drawImage(this.imageObj, this.originX, this.originY);
}

/**
 * RENDERER PART HERE
 */
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

       /* if (_currentItemSelected != -1 && !controller.currentPlayer.isPlayersItem(itemList[_currentItemSelected])) {
            console.log("Not your item");
            _mouseState = 0;
            _currentItemSelected = -1;
        }*/
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


                // DEBUG
                LAST_FORCE = _force;
                LAST_ANGLE = _angle + Math.PI;
                LAST_DISTANCEVEC = distanceVec;

                var itemL = [];
                for (var i = 0; i < itemList.length; i++) {
                    var newItem = constructPartialItem(itemList[i]);
                    itemL.push(newItem);
                }

                setItemInMotion(itemL, constructPartialItem(itemList[_currentItemSelected]), _force, _angle + Math.PI, distanceVec);
                controller.currentGameState = controller.currentPlayer.id === 1 ? GAME_STATE_SIMULATING_PHYSICS_P1 : GAME_STATE_SIMULATING_PHYSICS_P2;


                _mouseState = 0;
                _currentItemSelected = -1;
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
    clearInterval(renderLoop);
    //physicsEngine.terminate();
    console.log("game ends");
};

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

Controller.prototype.setRendererLoop = function (renderer, physicsEngine) {
    if (!DEBUG_MODE) {
        renderLoop = setInterval(
            function () {
                renderer.draw(controller.inputManager.getPlayerMouse(), controller.inputManager.getMouseState());

                var itemL = [];
                for (var i = 0; i < itemList.length; i++) {
                    var newItem = constructPartialItem(itemList[i]);
                    itemL.push(newItem);
                }
                updateItemState(itemL);
                controller.updateScore();
                controller.drawCurrentPlayer();
            }
            , DELTA_T * 1000);
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
                        updateItemState(itemL);
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
Controller.prototype.initial = function (renderer, physicsEngine) {

    // init game item and surfaces
    this.loadResources();

    // get user input
    // set item initial speed event
    this.inputManager.initial(renderer.itemCanvas);

    this.setRendererLoop(renderer, physicsEngine);

    this.currentPlayer = this.playerList[0];
    this.currentGameState = GAME_STATE_P1;

};

Controller.prototype.loadResources = function () {
    // [TODO] using config.xml to load automatically
    // load items

    // hardcoded first
    var newSurface = new Surface(surfaceList.length, 'woodenSurface', 512, 512, 0, 0, 0.5, 'resources/img/surface/WoodenSurface.jpg', null);
    surfaceList.push(newSurface);


    var itemStats = JSON.parse(itemConfigure).items;
    for (var i = 0; i < itemStats.length; i++) {
        var newItem = new Item(itemList.length, itemStats[i].name, itemStats[i].inplay, itemStats[i].surfaceMu,
            itemStats[i].center.cx, itemStats[i].center.cy,
            itemStats[i].rotation, itemStats[i].velocity.vx, itemStats[i].velocity.vy,
            itemStats[i].mass, itemStats[i].imagePath, itemStats[i].boundingBox, itemStats[i].shape, null);
        itemList.push(newItem);
        if (i === 0)
            player1List.push(newItem);
        else
            player2List.push(newItem);
    }


    /*var item1 = new Item(itemList.length, 'pencil', true, 1.0, 1.0, 1.2, Math.PI/4, 0.0, 0.0, 2, 'resources/img/item/pencil.png', null);
     itemList.push(item1);
     var item2 = new Item(itemList.length, 'eraser', true, 1.0, 1.0, 0.7, Math.PI/2, 0.0, 0.0, 3.0, 'resources/img/item/eraser.png', null);
     itemList.push(item2);*/


    // test case
    if (DEBUG_MODE) {
        //itemList[1].cy = 0.18;
        //itemList[1].rotation = 2.6;
        var itemL = [];
        for (var i = 0; i < itemList.length; i++) {
            var newItem = constructPartialItem(itemList[i]);
            itemL.push(newItem);
        }

        /*
        var motionItem = constructPartialItem(itemList[2]);
        var angleVc = new Vector(0, 0);
        setItemInMotion(itemL,motionItem, 2.5, -Math.PI/2, angleVc);
        */

        // test case 1
        var motionItem = constructPartialItem(itemList[1]);
        var angleVc = new Vector(0.038476562500000006, -0.003124999999999989);
        setItemInMotion(itemL,motionItem, 0.9370461864580398, 4.6233393977501915, angleVc);

    }

}

// when receiving messages from physics engine thread
function updateFromPhysicsEngine(e) {
    var update = JSON.parse(e);

    // case when physics simulation is done
    if (update.type === 'updateItemsState' && update.items.length === 0 &&
        (controller.currentGameState === GAME_STATE_SIMULATING_PHYSICS_P1 || controller.currentGameState === GAME_STATE_SIMULATING_PHYSICS_P2)) {
        controller.updateGameState();
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

Controller.prototype.updateScore = function (canvas) {
    var player1 = this.playerList[0];
    var player2 = this.playerList[1];

    var player1ItemList = player1.itemList;
    var player2ItemList = player2.itemList;

    // update score
    // need to check every render loop?
    for (var i = 0; i < player1ItemList.length; i++) {
        if (!player1ItemList[i].isItemInPlay()) {
            player1ItemList.splice(i,1);
            console.log("Player 2 score incremented\n Player 1 list");
            console.log(player1ItemList);
            player2.score.increment();
        }
    }

    for (var i = 0; i < player2ItemList.length; i++) {
        if (!player2ItemList[i].isItemInPlay()) {
            player2ItemList.splice(i,1);
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

    if (!this.currentPlayer.isStillInPlay()) {
        this.endGame();
    }
};

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

        for (var i = 0; i < this.itemList.length; i++) {
            if (itemList[i].isItemInPlay()) {
                isStillInPlay = true;
            }
        }

        this.inPlay = isStillInPlay;
        return isStillInPlay;

    };
};

/*
 PHYSICS ENGINE PART !!!!!
 */

/**
 * Created with JetBrains WebStorm.
 * User: saikrishnanranganathan
 * Date: 25/1/13
 * Time: 12:09 PM
 * To change this template use File | Settings | File Templates.
 */

// @author U096089W
const DELTA_T = 1 / 60;
const FORCE_MULTIPLIER = 60;
const TORQUE_MULTIPLIER = 180;
const ANGLE_MULTIPLIER = 1;
var RENDER = true;
var RENDER_ONCE = false;
var STOP = false;
var SPECUTATION_ITERATION = 3;


var MOTION_BOUND = true;
var contactList = [];

var Contact = function(itemID1, itemID2) {
    this.id1 = itemID1;
    this.id2 = itemID2;
    this.impulse = 0;
}


self.addEventListener('message', function (e) {
    var cmd = e.data.cmd;

    if (cmd === 'initial') {
        setItemInMotion(JSON.parse(e.data.itemOnScreen), e.data.force, e.data.angle, e.data.distanceVec);
    }
    else if (cmd === 'updateItems') {
        updateItemState(JSON.parse(e.data.itemsOnScreen));
    }

}, false);

function updateItemState(items) {
    // collision engine starts to work
    if (MOTION_BOUND) {
        for (var m=0; m< contactList.length; m++) {
            var i = contactList[m].id1;
            var j = contactList[m].id2;

            var p1 = rotateAndTranslateItemShape(items[i]);
            var p2 = rotateAndTranslateItemShape(items[j]);

            var result = Intersection.intersectPolygonPolygon(p1, p2);

            // [TODO] This is buggy because multiple collision case is not handled
            if (result.status === 'No Intersection' && items[i].speculated && items[j].speculated) {
                console.log('enter speculated no intersection');
                items[i].speculated--;
                items[j].speculated--;

                var result = closestDistanceBetweenPolygons(p1, p2);
                var collisionPoint = new Vector((result.returnP0.x+result.returnP1.x)/2, (result.returnP0.y+result.returnP1.y)/2);
                var item1dCollision = new Vector(- items[i].cx + collisionPoint.x, - items[i].cy + collisionPoint.y);
                var item2dCollision = new Vector(- items[j].cx + collisionPoint.x, - items[j].cy + collisionPoint.y);
                var normalToCollision = new Vector(speculatedP1.x - speculatedP0.x, speculatedP1.y - speculatedP0.y);
                var normalLength = Math.sqrt(normalToCollision.x*normalToCollision.x + normalToCollision.y*normalToCollision.y);
                normalToCollision.x = normalToCollision.x / normalLength;
                normalToCollision.y = normalToCollision.y / normalLength;

                performCollision(items[i], items[j], item1dCollision, item2dCollision, normalToCollision);
                Manipulator.stopAtEdge(items, j);
            }
            if (result.status === 'No Intersection' && items[i].speculated && items[j].speculated) {
                //console.log('no intersection found');
            }
            if (result.status === 'Intersection') {

                console.log('enter intersection');
                //console.log('intersection point number: ' + result.points.length);
                items[i].speculated--;
                items[j].speculated--;

                var x = 0.0, y = 0.0;
                for (var k=0; k<result.points.length; k++) {
                    x += result.points[k].x;
                    y += result.points[k].y;
                    //console.log(result.points[k]);
                }
                var collisionPoint = new Vector(x/result.points.length, y/result.points.length);
                //console.log('collisionPoint: ' + collisionPoint.x + ' ' + collisionPoint.y);
                var item1dCollision = new Vector(-items[i].cx + collisionPoint.x, -items[i].cy + collisionPoint.y);
                var item2dCollision = new Vector(-items[j].cx + collisionPoint.x, -items[j].cy + collisionPoint.y);
                //console.log('item1 vector: ' + item1dCollision.x + ' ' + item1dCollision.y);
                //console.log('item2 vector: ' + item2dCollision.x + ' ' + item2dCollision.y);
                var normalToCollision = new Vector(speculatedP1.x - speculatedP0.x, speculatedP1.y - speculatedP0.y);
                var normalLength = Math.sqrt(normalToCollision.x*normalToCollision.x + normalToCollision.y*normalToCollision.y);
                normalToCollision.x = normalToCollision.x / normalLength;
                normalToCollision.y = normalToCollision.y / normalLength;
                performCollision(items[i], items[j], item1dCollision, item2dCollision, normalToCollision);
                Manipulator.stopAtEdge(items, j);
            }
        }

        contactList = [];
        // generate motion bound
        for (var i=0; i < items.length; i++) {
            var newContact = generateContact(items, i);
            if (newContact.length !== 0) {
                if (contactList.length === 0)
                    contactList = newContact;
                else
                    contactList = contactList.concat(newContact);
            }
        }

        // push
        for (var k=0; k < SPECUTATION_ITERATION; k++) {
            // generate motion bound


            //if (contactList.length !== 0)
                //console.log(contactList);

            // speculation contact testing
            for (var i=0; i< contactList.length; i++) {
                if (!STOP) {
                    //STOP = true;
                    var p1 = rotateAndTranslateItemShape(items[contactList[i].id1]);
                    var p2 = rotateAndTranslateItemShape(items[contactList[i].id2]);

                    // get the closest distance between two polygons
                    var result = closestDistanceBetweenPolygons(p1, p2);
                    speculateCollision(items[contactList[i].id1], items[contactList[i].id2], result.dv, result.returnP0, result.returnP1, contactList[i]);
                }
            }
        }
    }
    else {
        for (var i = 0; i < items.length; i++) {

            // Check for collision
            for (var j = i+1; j < items.length; j++) {

                var p1 = rotateAndTranslateItemShape(items[i]);
                var p2 = rotateAndTranslateItemShape(items[j]);

                var result = Intersection.intersectPolygonPolygon(p1, p2);

                // [TODO] This is buggy because multiple collision case is not handled
                if (result.status === 'No Intersection' && items[i].speculated && items[j].speculated) {
                    console.log('enter speculated no intersection');

                    items[i].speculated--;
                    items[j].speculated--;



                    var result = closestDistanceBetweenPolygons(p1, p2);
                    var collisionPoint = new Vector((result.returnP0.x+result.returnP1.x)/2, (result.returnP0.y+result.returnP1.y)/2);
                    var item1dCollision = new Vector(-items[i].cx + collisionPoint.x, -items[i].cy + collisionPoint.y);
                    var item2dCollision = new Vector(-items[j].cx + collisionPoint.x, -items[j].cy + collisionPoint.y);
                    var normalToCollision = new Vector(speculatedP1.x - speculatedP0.x, speculatedP1.y - speculatedP0.y);
                    normalLength = Math.sqrt(normalToCollision.x*normalToCollision.x + normalToCollision.y*normalToCollision.y);
                    normalToCollision.x = normalToCollision.x / normalLength;
                    normalToCollision.y = normalToCollision.y / normalLength;

                    performCollision(items[i], items[j], item1dCollision, item2dCollision, normalToCollision);
                }
                if (result.status === 'No Intersection' && items[i].speculated && items[j].speculated) {
                    //console.log('no intersection found');
                }
                if (result.status === 'Intersection') {

                    items[i].speculated--;
                    items[j].speculated--;

                    console.log('enter intersection');
                    //console.log('intersection point number: ' + result.points.length);


                    var x = 0.0, y = 0.0;
                    for (var k=0; k<result.points.length; k++) {
                        x += result.points[k].x;
                        y += result.points[k].y;
                        //console.log(result.points[k]);
                    }
                    var collisionPoint = new Vector(x/result.points.length, y/result.points.length);
                    //console.log('collisionPoint: ' + collisionPoint.x + ' ' + collisionPoint.y);
                    var item1dCollision = new Vector(-items[i].cx + collisionPoint.x, -items[i].cy + collisionPoint.y);
                    var item2dCollision = new Vector(-items[j].cx + collisionPoint.x, -items[j].cy + collisionPoint.y);
                    //console.log('item1 vector: ' + item1dCollision.x + ' ' + item1dCollision.y);
                    //console.log('item2 vector: ' + item2dCollision.x + ' ' + item2dCollision.y);
                    var normalToCollision = new Vector(speculatedP1.x - speculatedP0.x, speculatedP1.y - speculatedP0.y);
                    normalLength = Math.sqrt(normalToCollision.x*normalToCollision.x + normalToCollision.y*normalToCollision.y);
                    normalToCollision.x = normalToCollision.x / normalLength;
                    normalToCollision.y = normalToCollision.y / normalLength;
                    performCollision(items[i], items[j], item1dCollision, item2dCollision, normalToCollision);
                }
            }
        }
        for (var i = 0; i < items.length; i++) {
            // Check for collision
            for (var j = i+1; j < items.length; j++) {
                if (!STOP) {
                    //STOP = true;
                    var p1 = rotateAndTranslateItemShape(items[i]);
                    var p2 = rotateAndTranslateItemShape(items[j]);

                    // get the closest distance between two polygons
                    var result = closestDistanceBetweenPolygons(p1, p2);
                    speculateCollision(items[i], items[j], result.dv, result.returnP0, result.returnP1);
                }
            }
        }
    }

    var returnItems = [];
    // update items' velocity and position
    for (var i=0; i < items.length; i++) {
        var returnItem = computeCurrentSpeedAndPosition(items[i]);
        if (!returnItem.ignore) {
            returnItems.push(returnItem);
        }
    }


    if (RENDER_ONCE) {
        RENDER = false;
        RENDER_ONCE = false;
    }

    var JSONResult = JSON.stringify({'type':'updateItemsState', 'items':returnItems});
    updateFromPhysicsEngine(JSONResult);
}

function minMin(v1, v2) {
    var x, y;
    x = v1.x < v2.x ? v1.x : v2.x;
    y = v1.y < v2.y ? v1.y : v2.y;
    return new Vector(x, y);
}

function maxMax(v1, v2) {
    var x, y;
    x = v1.x > v2.x ? v1.x : v2.x;
    y = v1.y > v2.y ? v1.y : v2.y;
    return new Vector(x, y);
}

function generateContact(items, motionItemID) {
    // create motion bound box for item
    var motionItem = constructPartialItem(items[motionItemID]);
    var preBoundingBoxPoints = rotateAndTranslateItemBoundingBox(motionItem);
    var minPoint = new Vector(100000, 10000);
    var maxPoint = new Vector(-100000, -100000);
    // compute pre motion bounding box
    for (var m=0; m<preBoundingBoxPoints.length; m++) {
        minPoint = minMin(minPoint, preBoundingBoxPoints[m]);
        maxPoint = maxMax(maxPoint, preBoundingBoxPoints[m]);
    }

    // compute post motion bounding box
    var postMotionItem = computeCurrentSpeedAndPosition(motionItem);
    var postBoundingBoxPoints = rotateAndTranslateItemBoundingBox(postMotionItem);
    // compute pre motion bound box
    for (var m=0; m<postBoundingBoxPoints.length; m++) {
        minPoint = minMin(minPoint, postBoundingBoxPoints[m]);
        maxPoint = maxMax(maxPoint, postBoundingBoxPoints[m]);
    }
    var motionBox = [minPoint,
        new Vector(maxPoint.x, minPoint.y),
        maxPoint,
        new Vector(minPoint.x, maxPoint.y)];

    var motionContactList = []
    for (var i=0; i<items.length; i++) {

        if (i === motionItemID)
            continue;

        var testItemPoints = rotateAndTranslateItemBoundingBox(items[i]);
        var result = Intersection.intersectPolygonPolygon(motionBox, testItemPoints);
        if (result.status === 'Intersection') {
            motionContactList.push(new Contact(motionItemID, i));
        }
        else {
            var testItemPoints = rotateAndTranslateItemBoundingBox(items[i]);
            for (var j=0; j<testItemPoints.length; j++) {
                if (testItemPoints[j].x < minPoint.x || testItemPoints[j].x > maxPoint.x
                    || testItemPoints[j].y < minPoint.y || testItemPoints[j].y > maxPoint.y) {
                    break;
                }
                if (j === testItemPoints.length-1) {
                    motionContactList.push(new Contact(motionItemID, i));
                }
            }

        }
    }
    //if (motionContactList.length !== 0)
        //console.log(motionContactList);
    return motionContactList;
}

function setItemInMotion(items, item, force, angle, pointOfImpactFromCenter) {
    var returnItem = computeInitialSpeedAndSpin(item, force, angle, pointOfImpactFromCenter);
    Manipulator.stopAtEdge(items, returnItem);
//    updateItemState([returnItem]);
    var JSONResult = JSON.stringify({'type':'setItemInMotion', 'item':returnItem});
    //console.log(JSONResult);
    updateFromPhysicsEngine(JSONResult);
}

function computeInitialSpeedAndSpin(item, forceInput, angleInput, pointOfImpactFromCenter) {
    item.origin = "computeInitial";

    var linearImpulse = forceInput * DELTA_T * FORCE_MULTIPLIER;
    var angleOfImpact = angleInput * ANGLE_MULTIPLIER;
    var speed = linearImpulse / item.mass;

    item.vx = speed * Math.cos(angleOfImpact);
    item.vy = speed * Math.sin(angleOfImpact);

    var distanceToPointOfImpact = Math.sqrt(pointOfImpactFromCenter.x * pointOfImpactFromCenter.x + pointOfImpactFromCenter.y * pointOfImpactFromCenter.y);
    var angleMadeByDistanceVector = Math.atan2(pointOfImpactFromCenter.y, pointOfImpactFromCenter.x);

    var angleBetweenForceAndDistanceVectors = (2 * Math.PI) - angleOfImpact + angleMadeByDistanceVector;

    var torque = distanceToPointOfImpact * forceInput * Math.sin(angleBetweenForceAndDistanceVectors) * TORQUE_MULTIPLIER;
    var angularImpulse = torque * DELTA_T;

    item.angularV = angularImpulse / item.inertia;
    //console.log(item.angularV);
    //console.log(item.angularV);
//    console.log(angleOfImpact);

    return item;
}

function computeCurrentSpeedAndPosition(item) {
    item.origin = "computeCurrent";
    item.ignore = false;

    if (RENDER) {
        //console.log('in computeCurrentSpeed');
        //console.log(item.name);
        //console.log(item.vx + ' ' + item.vy);
        //console.log(item.cx + ' ' + item.cy);
        item.cx = item.cx + item.vx * DELTA_T;
        item.cy = item.cy + item.vy * DELTA_T;

        // update rotation based on angularV
        item.rotation = item.rotation + item.angularV * DELTA_T;

        var speed = Math.sqrt(item.vx * item.vx + item.vy * item.vy);

        if (speed === 0 && item.angularV === 0.0 && item.speculated !== 0) {
            item.ignore = true;
            return item;
        }

        var aFrictionLinear = item.surfaceMu * 9.8;

        // computer angular acceleration from friction
        var aFrictionAngular = item.surfaceCrr * 9.8;

        var velocityVectorAngle = Math.atan2(item.vy, item.vx);

        // reduce angularV based on alpha from friction
        if (Math.abs(item.angularV) > aFrictionAngular * DELTA_T) {
            var directionMultiplier = 1;

            if (item.angularV < 0) {
                directionMultiplier = -1;
            }
            item.angularV = (Math.abs(item.angularV) - (aFrictionAngular * DELTA_T)) * directionMultiplier;

        } else {
            item.angularV = 0;
        }

        if (speed > aFrictionLinear * DELTA_T) {
            speed = speed - (aFrictionLinear * DELTA_T);
        }
        else {
            speed = 0;
        }

        item.vx = speed * Math.cos(velocityVectorAngle);
        item.vy = speed * Math.sin(velocityVectorAngle);

    }

    return item;
}

/*
 The part of determining the closest distance between two polygons
 */

function Vector(x,y){if(arguments.length>0){this.init(x,y);}}
Vector.prototype.init=function(x,y){this.x=x;this.y=y;};
Vector.prototype.min=function(that){return new Vector(Math.min(this.x,that.x),Math.min(this.y,that.y));};
Vector.prototype.max=function(that){return new Vector(Math.max(this.x,that.x),Math.max(this.y,that.y));};

function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

function closestDistanceBetweenSegments(s1, s2) {
    var SMALL_NUM = 0.00000001;
    var u = new Vector(s1.p1.x - s1.p0.x, s1.p1.y - s1.p0.y);
    var v = new Vector(s2.p1.x - s2.p0.x, s2.p1.y - s2.p0.y);
    var w = new Vector(s1.p0.x - s2.p0.x, s1.p0.y - s2.p0.y);
    var a = dot(u, u);  // always >= 0
    var b = dot(u, v);
    var c = dot(v, v);  // always >= 0
    var d = dot(u, w);
    var e = dot(v, w);
    var D = a * c - b * b;  // always >= 0
    var sc, sN, sD = D; // sc = sN / sD, default sD = D >= 0
    var tc, tN, tD = D; // tc = tN / tD, default tD = D >= 0

    // compute the line parameters of the two closest points
    if (D < SMALL_NUM) {  // the lines are almost parallel
        sN = 0.0; // force using point P0 on segment S1
        sD = 1.0; // to prevent possible division by 0.0 later
        tN = e;
        tD = c;
    }
    else { // get the closest points on the infinite lines
        sN = (b * e - c * d);
        tN = (a * e - b * d);
        if (sN < 0.0) { // sc < 0 => the s=0 edge is visible
            sN = 0.0;
            tN = e;
            tD = c;
        }
        else if (sN > sD) { // sc > 1 -> the s=1 edge is visible
            sN = sD;
            tN = e + b;
            tD = c;
        }
    }

    if (tN < 0.0) {  // tc < 0 => the t = 0 edge is visible
        tN = 0.0;
        // recompute sc for this edge
        if (-d < 0.0)
            sN = 0.0;
        else if (-d > a)
            sN = sD;
        else {
            sN = -d;
            sD = a;
        }
    }
    else if (tN > tD) { // tc > 1 => the t =1 edge is visible
        tN = tD;
        // recompute sc for this edge
        if ((-d + b) < 0.0)
            sN = 0;
        else if ((-d + b) > a)
            sN = sD;
        else {
            sN = (-d + b);
            sD = a;
        }
    }

    // finally do the division to get sc and tc
    sc = (Math.abs(sN) < SMALL_NUM ? 0.0 : sN / sD);
    tc = (Math.abs(tN) < SMALL_NUM ? 0.0 : tN / tD);

    // get the difference of the two closest points
    var dv = new Vector(w.x + (sc * u.x) - (tc * v.x), w.y + (sc * u.y) - (tc * v.y)); // = S1(sc) -S2(tc)
    dv.x = -dv.x;
    dv.y = -dv.y;

    var p0 = new Vector(s1.p0.x + sc * u.x, s1.p0.y + sc * u.y);
    var p1 = new Vector(s2.p0.x + tc * v.x, s2.p0.y + tc * v.y);

    var d = Math.sqrt(dot(dv, dv));
    return {closestDistance:d, directionVector:dv, p0:p0, p1:p1};

}

function closestDistanceBetweenPolygons(p1, p2) {
    var closestDistance = 1000000.0;
    var directionVector = null;
    var returnP0, returnP1;
    var lineId = [];

    for (var i = 0; i < p1.length; i++) {
        var point1 = p1[i];
        var point2 = p1[(i + 1) % p1.length];

        var line1 = {p0:point1, p1:point2};

        for (var j = 0; j < p2.length; j++) {
            var point3 = p2[j];
            var point4 = p2[(j + 1) % p2.length];
            var line2 = {p0:point3, p1:point4};
            var result = closestDistanceBetweenSegments(line1, line2);

            /*
             if (i == 1 && j == 3) {
             console.log('p1: ' + p1[0].x + ' ' + p1[0].y);
             console.log('p2: ' + p1[1].x + ' ' + p1[1].y);
             console.log('p3: ' + p1[2].x + ' ' + p1[2].y);
             console.log('p4: ' + p1[3].x + ' ' + p1[3].y);
             }
             */

            //console.log(i + ' ' + j + ' ' + result.closestDistance);
            if (result.closestDistance < closestDistance) {
                closestDistance = result.closestDistance;
                directionVector = result.directionVector;
                returnP0 = result.p0;
                returnP1 = result.p1;
                lineId[0] = i;
                lineId[1] = j;
            }
        }
    }
    //console.log(lineId[0] + ' ' + lineId[1] + ' ' + closestDistance);
    return {d:closestDistance, dv:directionVector, returnP0:returnP0, returnP1:returnP1};
}

function convertAngularVelocityToNormal(item, p) {
    var r = Math.sqrt(( (p.x - item.cx) * (p.x - item.cx) + (p.y - item.cy) * (p.y - item.cy) ));
    var normalV = r * item.angularV;
    var alpha = Math.atan2(( -p.y + item.cy), ( -p.x + item.cx));
    if (item.angularV > 0)
        alpha =+ Math.PI/2;
    else
        alpha =- Math.PI/2;

    var normalVX = normalV * Math.cos(alpha);
    var normalVY = normalV * Math.sin(alpha);
    return {vx : normalVX, vy : normalVY};
}

function computeRadiusArm(item, p) {
    var r = new Vector((p.x - item.cx), (p.y - item.cy));
    return {x: -r.y, y : r.x};
}


function speculateCollision(item1, item2, contactNormal, p0, p1, contact) {

    // convert angular velocity to normal velocity
    var radiusArm1 = computeRadiusArm(item1, p0);
    var radiusArm2 = computeRadiusArm(item2, p1);

    contactNormal = new Vector(p1.x-p0.x, p1.y-p0.y);
    var normalMag = Math.sqrt(contactNormal.x * contactNormal.x + contactNormal.y * contactNormal.y);
    if (normalMag < 0.0000001)
        return;
    contactNormal.x = contactNormal.x / normalMag;
    contactNormal.y = contactNormal.y / normalMag;
    var shortestDistance = normalMag;
    var normalMag = Math.sqrt(contactNormal.x * contactNormal.x + contactNormal.y * contactNormal.y);

    var contactPoint1Velocity = new Vector(radiusArm1.x * item1.angularV + item1.vx, radiusArm1.y * item1.angularV + item1.vy);
    var contactPoint2Velocity = new Vector(radiusArm2.x * item2.angularV + item2.vx, radiusArm2.y * item2.angularV + item2.vy);

    var dv = new Vector(contactPoint2Velocity.x - contactPoint1Velocity.x, contactPoint2Velocity.y - contactPoint1Velocity.y);

    var distanceAngle = Math.atan2(contactNormal.y, contactNormal.x);

    var relativeV = (dv.x * contactNormal.x + dv.y * contactNormal.y) / normalMag;

    //console.log('relV: ' + relativeV);
    //console.log('normal mag: ' + normalMag);


    var remove = relativeV + shortestDistance / DELTA_T;

    var radiusAramNormal1 = (radiusArm1.x * contactNormal.x + radiusArm1.y * contactNormal.y) / normalMag;
    var radiusAramNormal2 = (radiusArm2.x * contactNormal.x + radiusArm2.y * contactNormal.y) / normalMag;
    var denom1 = radiusAramNormal1 * radiusAramNormal1/ item1.inertia;
    var denom2 = radiusAramNormal2 * radiusAramNormal2 / item2.inertia;
    var denom = 1/ item1.mass + 1/ item2.mass + denom1 + denom2;

    var IMPUSLE_MOD = 1.0;
    var impulseToApply = IMPUSLE_MOD * remove / denom;
    var newImpulse = Math.min(impulseToApply + contact.impulse, 0);

    var change = newImpulse - contact.impulse;
    contact.impulse = newImpulse;
    impulseToApply = change;

    var impulseX = impulseToApply * contactNormal.x;
    var impulseY = impulseToApply * contactNormal.y;

    item1.vx += impulseX / item1.mass;
    item1.vy += impulseY / item1.mass;
    item1.angularV += impulseToApply * radiusAramNormal1
        / item1.inertia;

    item2.vx -= impulseX / item2.mass;
    item2.vy -= impulseY / item2.mass;
    item2.angularV -= impulseToApply * radiusAramNormal2
        / item2.inertia;

    if (Math.abs(change) >= 0.0000001) {
        item1.speculated++;
        item2.speculated++;
    }

    speculatedP0 = p0;
    speculatedP1 = p1;

    /*if (remove >= 0) {
     //console.log("No collision speculated");
     item1.speculated = false;
     item2.speculated = false;
     return; // do nothing
     } else {
     console.log("Collision speculated, computing amount to remove");
     console.log('two closest points');
     console.log(p0.x + ' ' + p0.y);
     console.log(p1.x + ' ' + p1.y);


     //STOP = true;
     // remove just the right amount so they collide
     var radiusAramNormal1 = (radiusArm1.x * contactNormal.x + radiusArm1.y * contactNormal.y) / normalMag;
     var radiusAramNormal2 = (radiusArm2.x * contactNormal.x + radiusArm2.y * contactNormal.y) / normalMag;
     var denom1 = radiusAramNormal1 * radiusAramNormal1 / item1.inertia;
     var denom2 = radiusAramNormal2 * radiusAramNormal2 / item2.inertia;
     var denom = 1/ item1.mass + 1/ item2.mass + denom1 + denom2;

     var IMPUSLE_MOD = 1.0;
     var impulseToApply = IMPUSLE_MOD * remove / denom;
     var impulseX = impulseToApply * Math.cos(distanceAngle);
     var impulseY = impulseToApply * Math.sin(distanceAngle);

     item1.vx += impulseX / item1.mass;
     item1.vy += impulseY / item1.mass;
     item1.angularV += (impulseX * radiusArm1.x + impulseY * radiusArm1.y)
     / item1.inertia;

     item2.vx -= impulseX / item2.mass;
     item2.vy -= impulseY / item2.mass;
     item2.angularV -= (impulseX * radiusArm2.x + impulseY * radiusArm2.y)
     /  item2.inertia;

     item1.speculated = true;
     item2.speculated = true;

     // [TODO] TEMP just for test
     speculatedP0 = p0;
     speculatedP1 = p1;

     //RENDER_ONCE = true;
     }*/
}

function rotateAndTranslateItemShape(item) {
    var i;
    var newPoints = [];
    //console.log('center'+ ': ' + item.cx + ' ' + item.cy);
    for (i = 0; i < item.shape.length; i++) {
        // rotate
        //console.log('point' + i + ': ' + item.shape[i].x + ' ' + item.shape[i].y);
        var r = Math.sqrt(item.shape[i].x * item.shape[i].x + item.shape[i].y * item.shape[i].y);
        //console.log(r);
        var angle = Math.atan2(item.shape[i].y, item.shape[i].x);
        angle = angle + item.rotation;
        ;
        var rx = r * Math.cos(angle);
        var ry = r * Math.sin(angle);
        //console.log('point' + i + ': ' + rx + ' ' + ry);

        // translate

        var newPoint = new Vector(item.cx + rx, item.cy + ry);
        //console.log('point' + i + ': ' + newPoint.x + ' ' + newPoint.y);
        newPoints[i] = newPoint;
    }

    return newPoints;
}

function rotateAndTranslateItemBoundingBox(item) {
    var i;
    var newPoints = [];
    //console.log('center'+ ': ' + item.cx + ' ' + item.cy);
    for (i = 0; i < item.boundingBox.length; i++) {
        // rotate
        //console.log('point' + i + ': ' + item.boundingBox[i].x + ' ' + item.boundingBox[i].y);
        var r = Math.sqrt(item.boundingBox[i].x * item.boundingBox[i].x + item.boundingBox[i].y * item.boundingBox[i].y);
        //console.log(r);
        var angle = Math.atan2(item.boundingBox[i].y, item.boundingBox[i].x);
        angle = angle + item.rotation;
        ;
        var rx = r * Math.cos(angle);
        var ry = r * Math.sin(angle);
        //console.log('point' + i + ': ' + rx + ' ' + ry);

        // translate

        var newPoint = new Vector(item.cx + rx, item.cy + ry);
        //console.log('point' + i + ': ' + newPoint.x + ' ' + newPoint.y);
        newPoints[i] = newPoint;
    }

    return newPoints;
}


function performCollision(item1, item2, item1dToCollision, item2dToCollision, normalToCollision) {
    console.log('enter perform collision');

    console.log('Prev');
    console.log(item1.name);
    console.log('item1: ' + item1.vx + ' ' + item1.vy);
    console.log('item1: ' + item1.angularV);

    console.log(item2.name);
    console.log('item2: ' + item2.vx + ' ' + item2.vy);
    console.log('item2: ' + item2.angularV);

    var e = 1; // elastic coefficient, currently set to completely elastic
    var collisionImpulse = 0;

    var item1VPreCollision = new Vector(item1.vx - item1.angularV*item1dToCollision.y, item1.vy + item1.angularV*item1dToCollision.x);
    var item2VPreCollision = new Vector(item2.vx - item2.angularV*item2dToCollision.y, item2.vy + item2.angularV*item2dToCollision.x);

    var relativeVPreCollision = new Vector(item1VPreCollision.x - item2VPreCollision.x, item1VPreCollision.y - item2VPreCollision.y);
    var relVDotNormal = dot(relativeVPreCollision, normalToCollision);
    console.log('preRelV ' + relVDotNormal);
    console.log('normal ' + normalToCollision.x + ' ' + normalToCollision.y);
    var inverseMassItem1 = 1 / item1.mass;
    var inverseMassItem2 = 1 / item2.mass;

    var inertiaItem1 = item1.inertia;
    var inertiaItem2 = item2.inertia;

    var angleBetweenItem1dAndNormal = Math.atan2(normalToCollision.y, normalToCollision.x) - Math.atan2(item1dToCollision.y, item1dToCollision.x);
    var item1dCollisionCrossNormal = cross(item1dToCollision, normalToCollision, angleBetweenItem1dAndNormal);

    var angleBetweenItem2dAndNormal = Math.atan2(normalToCollision.y, normalToCollision.x) - Math.atan2(item2dToCollision.y, item2dToCollision.x);
    var item2dCollisionCrossNormal = cross(item2dToCollision, normalToCollision, angleBetweenItem2dAndNormal);

    //console.log(angleBetweenItem1dAndNormal/Math.PI*180);
    //console.log(angleBetweenItem2dAndNormal/Math.PI*180);

    collisionImpulse = (-(1 + e) * relVDotNormal) /
        (inverseMassItem1 + inverseMassItem2 +
            ((item1dCollisionCrossNormal * item1dCollisionCrossNormal) / inertiaItem1 )+
            ((item2dCollisionCrossNormal * item2dCollisionCrossNormal) / inertiaItem2));
    //console.log('impulse');
    //console.log(collisionImpulse);
    var collisionImpulseTimesNormalVector = new Vector(collisionImpulse*normalToCollision.x, collisionImpulse*normalToCollision.y);
    console.log('impulse normal')
    console.log(collisionImpulseTimesNormalVector.x + ' ' + collisionImpulseTimesNormalVector.y);

    // test
    var deltaVx = collisionImpulseTimesNormalVector.x * inverseMassItem1 + collisionImpulseTimesNormalVector.x * inverseMassItem2;
    var deltaVy = collisionImpulseTimesNormalVector.y * inverseMassItem1 + collisionImpulseTimesNormalVector.y * inverseMassItem2;
    var deltaAv1 = cross(item1dToCollision, collisionImpulseTimesNormalVector, angleBetweenItem1dAndNormal)/inertiaItem1;
    var deltaAv2 = -cross(item2dToCollision, collisionImpulseTimesNormalVector, angleBetweenItem2dAndNormal)/inertiaItem2;
    var VxPostCollision = deltaVx - item1dToCollision.y*deltaAv1 + item2dToCollision.y*deltaAv2;
    var VyPostCollision = deltaVy + item1dToCollision.x*deltaAv1 - item2dToCollision.x*deltaAv2;
    var VPostVec = new Vector(VxPostCollision, VyPostCollision);
    var postV = dot(VPostVec, normalToCollision);
    console.log('postRelV ' + postV);

    var finalLinearVelocityOfItem1 = new Vector((item1.vx + collisionImpulseTimesNormalVector.x * inverseMassItem1),
        (item1.vy + collisionImpulseTimesNormalVector.y * inverseMassItem1));

    var finalLinearVelocityOfItem2 = new Vector((item2.vx - collisionImpulseTimesNormalVector.x * inverseMassItem2),
        (item2.vy - collisionImpulseTimesNormalVector.y * inverseMassItem2));

    var finalAngularVelocityItem1 = item1.angularV + cross(item1dToCollision, collisionImpulseTimesNormalVector, angleBetweenItem1dAndNormal)/inertiaItem1;
    var finalAngularVelocityItem2 = item2.angularV - cross(item2dToCollision, collisionImpulseTimesNormalVector, angleBetweenItem2dAndNormal)/inertiaItem2;

    item1.vx = finalLinearVelocityOfItem1.x;
    item1.vy = finalLinearVelocityOfItem1.y;

    item2.vx = finalLinearVelocityOfItem2.x;
    item2.vy = finalLinearVelocityOfItem2.y;

    item1.angularV = finalAngularVelocityItem1;
    item2.angularV = finalAngularVelocityItem2;

   /* var finalRelV = new Vector(item1.vx-item2.vx - item1.angularV*item1dToCollision.y + item2.angularV*item2dToCollision.y,
        item1.vy-item2.vy + item1.angularV*item1dToCollision.x - item2.angularV*item2dToCollision.x );
    console.log('finalRelV: ' + dot(finalRelV, normalToCollision));
*/

    console.log('Post');
    console.log(item1.name);
    console.log('item1: ' + item1.vx + ' ' + item1.vy);
    console.log('item1: ' + item1.angularV);

    console.log(item2.name);
    console.log('item2: ' + item2.vx + ' ' + item2.vy);
    console.log('item2: ' + item2.angularV);
}

function cross(vector1, vector2, angleBetweenThem) {

    var vector1Mod = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    var vector2Mod = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

    //return vector1.x*vector2.y-vector1.y*vector2.x;

    return vector1Mod * vector2Mod * Math.sin(angleBetweenThem);
}

function Intersection(status) {
    if ( arguments.length > 0 ) {
        this.init(status);
    }
}
/*****
 intialize Intersection
 *****/
Intersection.prototype.init = function(status) {
    // hold the status of the intersection
    this.status = status;
    // array to store the points
    this.points = new Array();
};


/*****
 add a single point
 *****/
Intersection.prototype.addPoint = function(point) {
    this.points.push(point);
};
/*****
 *
 * To hold multiple points addPonits
 *
 *****/
Intersection.prototype.addPoints = function(points) {
    this.points = this.points.concat(points);
};

/*****
 *
 *   Check intersection of line with a polygon
 *
 *****/
Intersection.intersectLinePolygon = function(a1, a2, points) {
    var result = new Intersection("No Intersection");
    var length = points.length;

    for ( var i = 0; i < length; i++ ) {
        var b1 = points[i];
        var b2 = points[(i+1) % length];
        var inter = Intersection.intersectLineLine(a1, a2, b1, b2);

        result.addPoints(inter.points);
    }

    if ( result.points.length > 0 ) result.status = "Intersection";

    return result;
};


/*****
 *
 * Check for intersection of a polygon with polygon
 *
 *****/
Intersection.intersectPolygonPolygon = function(points1, points2) {
    var result = new Intersection("No Intersection");
    var length = points1.length;

    for ( var i = 0; i < length; i++ ) {
        var a1 = points1[i];
        var a2 = points1[(i+1) % length];
        var inter = Intersection.intersectLinePolygon(a1, a2, points2);

        result.addPoints(inter.points);
    }

    if ( result.points.length > 0 )
        result.status = "Intersection";

    return result;

};

/*****
 *
 *   Check intersection of line with a line
 *
 *****/
Intersection.intersectLineLine = function(a1, a2, b1, b2) {
    var result;

    var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    var u_b  = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

    if ( u_b != 0 ) {
        var ua = ua_t / u_b;
        var ub = ub_t / u_b;

        if ( 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ) {
            result = new Intersection("Intersection");
            result.points.push(
                new Vector(
                    a1.x + ua * (a2.x - a1.x),
                    a1.y + ua * (a2.y - a1.y)
                )
            );
        } else {
            result = new Intersection("No Intersection");
        }
    } else {
        if ( ua_t == 0 || ub_t == 0 ) {
            result = new Intersection("Coincident");
        } else {
            result = new Intersection("Parallel");
        }
    }

    return result;
};


// Manipulation part here
var Manipulator = function() {

}


Manipulator.SURFACE_X = 0.5;
Manipulator.SURFACE_Y = 0.5;

Manipulator.stopAtEdge = function(items, manipulatedItem) {
    var TIME_LEFT = Math.sqrt(manipulatedItem.vx*manipulatedItem.vx + manipulatedItem.vy*manipulatedItem.vy)
        / (manipulatedItem.surfaceMu*9.8);

    var p1 = new Vector(manipulatedItem.cx, manipulatedItem.cy);
    var p2 = new Vector(manipulatedItem.cx + TIME_LEFT*manipulatedItem.vx/2,
        manipulatedItem.cy + TIME_LEFT*manipulatedItem.vy/2);

    if(this.checkPathCollision(items, p1, p2, manipulatedItem.id) === 'No Intersection') {
        this.checkSurafceEdgeCollision(manipulatedItem, p1, p2);
    }

}


Manipulator.checkSurafceEdgeCollision = function(item, pathEnd1, pathEnd2) {

    // END point is outside the surface
    if (pathEnd2.x < 0)
        this.manageSufaceEdgeCollision(item, (-pathEnd2.x) / pathEnd1.x - pathEnd2.x);
    else if (pathEnd2.x > this.SURFACE_X)
        this.manageSufaceEdgeCollision(item, (pathEnd2.x-this.SURFACE_X)/(pathEnd2.x-pathEnd1.x));
    else if (pathEnd2.y < 0)
        this.manageSufaceEdgeCollision(item, (-pathEnd2.y) / pathEnd1.y - pathEnd2.y);
    else if (pathEnd2.y > this.SURFACE_Y)
        this.manageSufaceEdgeCollision(item, (pathEnd2.y-this.SURFACE_Y)/(pathEnd2.y-pathEnd1.y));

}

Manipulator.manageSufaceEdgeCollision = function(item, pathBoundaryRatio) {
    var RATIO_LIMIT = 0.9;
    if (pathBoundaryRatio < RATIO_LIMIT) {
        item.vx = item.vx * Math.sqrt(1-pathBoundaryRatio-0.01);
        item.vy = item.vy * Math.sqrt(1-pathBoundaryRatio-0.01);
    }
}

Manipulator.checkPathCollision = function(items, pathEnd1, pathEnd2, mId) {
    var p1 = pathEnd1;
    var p2 = pathEnd2;

    for (var i=0; i<items.length; i++) {
        if (i !== mId) {
            var checkedItem = rotateAndTranslateItemShape(items[i]);
            var result = Intersection.intersectLinePolygon(p1, p2,checkedItem);
            if (result.status === 'No Intersection') {
                continue;
            } else {
                return 'Intersection';
            }
        }

    }
    return 'No Intersection';

}

Manipulator.autoFocus = function(items, manipulatedItemId) {

}



/**
 *  Physics Engine Init
 **/
var physicsEngine;
var renderer;
var controller;
window.onload = function () {
    //physicsEngine = new Worker('PhysicsEngine/PhysicsEngine.js');
    //physicsEngine.addEventListener('message', updateFromPhysicsEngine, false);
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
