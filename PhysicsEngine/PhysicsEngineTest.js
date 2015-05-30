/**
 * Created with JetBrains WebStorm.
 * User: saikrishnanranganathan
 * Date: 25/1/13
 * Time: 10:31 PM
 * To change this template use File | Settings | File Templates.
 */
// @author U096089W

 // just to push
var canvas = null;
var itemContext2D;

// COMMENT BY CHENCHEN
// using var FPS, const is rarely used
const FPS = 60;
const DELTA_T = 1 / FPS;

var renderLoop;
var physicsEngine;

var items = [];

var logOnce = false;


// Items on screen
ball = {
    id:0,
    name:"ball",
    inPlay:false,
    surfaceMu:0.6,
    x:100.0,
    y:50.0,
    r:10,
    c:"red",
    vx:0.0,
    vy:0.0,
    mass:1,
    draw:function (context2D) {
        context2D.beginPath();
        context2D.fillStyle = this.c;
        context2D.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
        context2D.fill();
    }

};

items[ball.id] = ball;

function init() {
    canvas = document.getElementById('surfaceCanvas');
    itemContext2D = canvas.getContext('2d');
    physicsEngine = new Worker('PhysicsEngine.js');

    physicsEngine.addEventListener('message', updateFromPhysicsEngine, false);

    document.getElementById("impulse").onclick = function () {
        logOnce = true;
        console.log("onclick works");
        var forceInput = document.getElementById("force").value;
        var angleInput = document.getElementById("angle").value;
        console.log(forceInput + ", " + angleInput);
        physicsEngine.postMessage({'cmd':'initial', 'itemOnScreen':JSON.stringify(ball), 'force':forceInput, 'angle':angleInput});
    };

    renderLoop = setInterval(draw, DELTA_T * 1000);
}

function updateFromPhysicsEngine(e) {
    var update = JSON.parse(e.data);

    if (update.type === 'updateItemsState') {
        var i = 0;


       // console.log("main Thread update:" + e.data);


        for (i = 0; i < update.items.length; i++) {
            var itemToUpdate = items[update.items[i].id];

            itemToUpdate.x = update.items[i].x;
            itemToUpdate.y = update.items[i].y;
            itemToUpdate.vx = update.items[i].vx;
            itemToUpdate.vy = update.items[i].vy;
        }
    }
    else if(update.type === 'setItemInMotion')
    {
        var itemToSetInMotion = items[update.item.id];

        delete items[update.item.id];

        itemToSetInMotion.x = update.item.x;
        itemToSetInMotion.y = update.item.y;
        itemToSetInMotion.vx = update.item.vx;
        itemToSetInMotion.vy = update.item.vy;

        console.log("main Thread impulse:"+ e.data);

        logOnce = true;
        items[update.item.id] = itemToSetInMotion;
    }

    //console.log('Physics Engine said: ', e.data);
}

window.onload = init;


function drawSurface() {
    itemContext2D.fillStyle = "black";
    itemContext2D.fillRect(0, 0, canvas.width, canvas.height);
}

function draw() {
    drawSurface();
    ball.draw(itemContext2D);
    // objects with function cannot be posted, JSON stringify removes functions
    physicsEngine.postMessage({'cmd':'updateItems', 'itemsOnScreen':JSON.stringify([ball])});
    // console.log("render loop executed at time:" + +new Date());
}