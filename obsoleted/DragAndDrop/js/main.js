// add event handler
var addEvent = (function () {
    if (document.addEventListener) {
        return function (el, type, fn) {
            if (el && el.nodeName || el === window) {
                el.addEventListener(type, fn, false);
            } else if (el && el.length) {
                for (var i = 0; i < el.length; i++) {
                    addEvent(el[i], type, fn);
                }
            }
        };
    } else {
        return function (el, type, fn) {
            if (el && el.nodeName || el === window) {
                el.attachEvent('on' + type, function () { return fn.call(el, window.event); });
            } else if (el && el.length) {
                for (var i = 0; i < el.length; i++) {
                    addEvent(el[i], type, fn);
                }
            }
        };
    }
})();

var dragItems;
updateDataTransfer();
var dropAreas = document.querySelectorAll('[droppable=true]');

function cancel(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    return false;
}

// update event handlers
function updateDataTransfer() {
    dragItems = document.querySelectorAll('[draggable=true]');
    for (var i = 0; i < dragItems.length; i++) {
        addEvent(dragItems[i], 'dragstart', function (event) {
            event.dataTransfer.setData('obj_id', this.id);
            return false;
        });
    }
}

// dragover event handler
addEvent(dropAreas, 'dragover', function (event) {
    if (event.preventDefault) event.preventDefault();

    // little customization
    this.style.borderColor = "#000";
    return false;
});

// dragleave event handler
addEvent(dropAreas, 'dragleave', function (event) {
    if (event.preventDefault) event.preventDefault();

    // little customization
    this.style.borderColor = "#ccc";
    return false;
});

// dragenter event handler
addEvent(dropAreas, 'dragenter', cancel);

// drop event handler
addEvent(dropAreas, 'drop', function (event) {
    if (event.preventDefault) event.preventDefault();

    // get dropped object
    var iObj = event.dataTransfer.getData('obj_id');
    var oldObj = document.getElementById(iObj);

    // get its image src
    var oldSrc = oldObj.childNodes[0].src;
    oldObj.className += 'hidden';

    var oldThis = this;
    setTimeout(function() {
        oldObj.parentNode.removeChild(oldObj); // remove object from DOM

        // add similar object in another place
        oldThis.innerHTML += '<a id="'+iObj+'" draggable="true"><img src="'+oldSrc+'" /></a>';

        // and update event handlers
        updateDataTransfer();

        // little customization
        oldThis.style.borderColor = "#ccc";
    }, 500);

    return false;
});
var player1items=[0,0,0,0,0];
var player2items=[0,0,0,0,0];
var player1count=0;
var player2count=0;
var player1arrayloc=0;
var player2arrayloc=0;
function player1drop (event){
    var objectid= event.dataTransfer.getData('obj_id');
    console.log("item at player 1 is "+objectid);

    for(var i=0;i<player2items.length;i++)
    {
        if(objectid==player2items[i])
        {
            player2items.splice(i,1,0);
            player2count--;
        }
    }
    for(var i=0;i<player1items.length;i++)
    {
        if(player1items[i]==0)
        {
            player1items[i]=objectid;
            player1count++;
            break;
        }
    }

    console.log("player 1 count is "+player1count);

}
function player2drop (event){

    var objectid= event.dataTransfer.getData('obj_id');
    for(var i=0;i<player1items.length;i++)
    {
        if(objectid==player1items[i])
        {
            player1items.splice(i,1,0);
            player1count--;
        }
    }
    for(var i=0;i<player2items.length;i++)
    {
        if(player2items[i]==0)
        {
            player2items[i]=objectid;
            player2count++;
            break;
        }
    }
}

function spaceDrop(event){
    var objectid = event.dataTransfer.getData('obj_id');
    console.log("item dropped at space is "+objectid);
    for(var i=0;i<player2items.length;i++)
    {
        if(objectid==player2items[i])
        {
            player2items.splice(i,1,0);
            player2count--;
        }
    }
    for(var i=0;i<player1items.length;i++)
    {
        if(objectid==player1items[i])
        {
            player1items.splice(i,1,0);
            player1count--;

        }
    }
}

function playbuttonpressed(event){
    for (var i=0;i<5;i++)
    {

        console.log("player 1 items is "+ player1items[i]);
        console.log("player 2 items is "+ player2items[i]);
    }
    if(player1count!=player2count)
    {
        console.log("player 1 count is " + player1count);
        console.log("player 2 count is " + player2count);

        alert("Players don't have equal number of items")
    }
    else
    {
        var itemlists=JSON.parse(load);


        alert(itemlists.quantity);
        console.log("player 1 count is "+player1count);
        console.log("player 2 count is"+player2count)
    }
}