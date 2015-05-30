/**
 * Created with JetBrains WebStorm.
 * User: saikrishnanranganathan
 * Date: 25/1/13
 * Time: 12:09 PM
 * To change this template use File | Settings | File Templates.
 */


const DELTA_T = 1 / 60;
const FORCE_MULTIPLIER = 60;
const TORQUE_MULTIPLIER = 180;
const ANGLE_MULTIPLIER = 1;
var RENDER = true;
var RENDER_ONCE = false;
var STOP = false;
var SPECUTATION_ITERATION = 3;

/**
 *
 * Synchrotron Globals
 */

var currentTime = 0.0;
var accumulator = 0.0;
var previous = [];

/**
 *
 * Synchrotron Functions
 */
// @author U096089W Saikrishnan Ranganathan
var getTimeInSeconds = function () {
    return (new Date).getTime() / 1000;
};

// @author U096089W Saikrishnan Ranganathan
function createPreviousStateFromCurrent(current) {
    var result = [];

    for (var i = 0; i < current.length; i++) {
        result.push(constructPartialItem(current[i]));
    }

    return result;
}
// @author U096089W Saikrishnan Ranganathan
function getPreviousWithId(id) {
    for (var i = 0; i < previous.length; i++) {
        if (previous[i].id === id) {
            return previous[i];
        }
    }

    return null;
}

// @author U096089W Saikrishnan Ranganathan
function interpolate(current, interpolationRatio) {
    var result = [];

    if (previous.length <= 0) {
        return result;
    }

    for (var i = 0; i < current.length; i++) {
        var previousItem = getPreviousWithId(current[i].id);

        if (previousItem === null) {
            continue;
        }

        var iCx = current[i].cx * interpolationRatio + previousItem.cx * (1 - interpolationRatio);
        var iCy = current[i].cy * interpolationRatio + previousItem.cy * (1 - interpolationRatio);
        var iRotation = current[i].rotation * interpolationRatio + previousItem.rotation * (1 - interpolationRatio);
        var iVx = current[i].vx * interpolationRatio + previousItem.vx * (1 - interpolationRatio);
        var iVy = current[i].vy * interpolationRatio + previousItem.vy * (1 - interpolationRatio);
        var iAngularV = current[i].angularV * interpolationRatio + previousItem.angularV * (1 - interpolationRatio);

        var item = {id:current[i].id,
            name:current[i].name,
            inPlay:current[i].inPlay,
            surfaceMu:current[i].surfaceMu,
            surfaceCrr:current[i].surfaceCrr,
            cx:iCx,
            cy:iCy,
            vx:iVx,
            vy:iVy,
            mass:current[i].mass,
            shape:current[i].shape,
            boundingBox:current[i].boundingBox,
            rotation:iRotation,
            angularV:iAngularV,
            inertia:current[i].inertia,
            speculated:current[i].speculated};

        result.push(item);
    }

    return result;
}


var MOTION_BOUND = true;
var contactList = [];
// @author U099151W ChenChen Sun
var Contact = function (itemID1, itemID2) {
    this.id1 = itemID1;
    this.id2 = itemID2;
    this.impulse = 0;
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
// @author U096089W Saikrishnan Ranganathan
self.addEventListener('message', function (e) {
    var cmd = e.data.cmd;

    if (cmd === 'initial') {
        setItemInMotion(JSON.parse(e.data.itemOnScreen), e.data.force, e.data.angle, e.data.distanceVec);
    }
    else if (cmd === 'updateItems') {
        updateItemState(JSON.parse(e.data.itemsOnScreen));
    }

}, false);
// @author U099151W ChenChen Sun
// @author U096089W Saikrishnan Ranganathan
function updateItemState(items) {
    var returnItems = [];

    // sync code
    var newTime = getTimeInSeconds();
    var deltaTime = newTime - currentTime;
    var maxDeltaTime = 0.15;

    currentTime = newTime;

    // set threshold on fps to avoid spiralling
    deltaTime = Math.min(deltaTime, maxDeltaTime);

    accumulator += deltaTime;

    // collision engine starts to work
    if (MOTION_BOUND) {
        for (var m = 0; m < contactList.length; m++) {
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
                var collisionPoint = new Vector((result.returnP0.x + result.returnP1.x) / 2, (result.returnP0.y + result.returnP1.y) / 2);
                var item1dCollision = new Vector(-items[i].cx + collisionPoint.x, -items[i].cy + collisionPoint.y);
                var item2dCollision = new Vector(-items[j].cx + collisionPoint.x, -items[j].cy + collisionPoint.y);
                var normalToCollision = new Vector(speculatedP1.x - speculatedP0.x, speculatedP1.y - speculatedP0.y);
                var normalLength = Math.sqrt(normalToCollision.x * normalToCollision.x + normalToCollision.y * normalToCollision.y);
                normalToCollision.x = normalToCollision.x / normalLength;
                normalToCollision.y = normalToCollision.y / normalLength;

                performCollision(items[i], items[j], item1dCollision, item2dCollision, normalToCollision);
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
                for (var k = 0; k < result.points.length; k++) {
                    x += result.points[k].x;
                    y += result.points[k].y;
                    //console.log(result.points[k]);
                }
                var collisionPoint = new Vector(x / result.points.length, y / result.points.length);
                //console.log('collisionPoint: ' + collisionPoint.x + ' ' + collisionPoint.y);
                var item1dCollision = new Vector(-items[i].cx + collisionPoint.x, -items[i].cy + collisionPoint.y);
                var item2dCollision = new Vector(-items[j].cx + collisionPoint.x, -items[j].cy + collisionPoint.y);
                //console.log('item1 vector: ' + item1dCollision.x + ' ' + item1dCollision.y);
                //console.log('item2 vector: ' + item2dCollision.x + ' ' + item2dCollision.y);
                var normalToCollision = new Vector(speculatedP1.x - speculatedP0.x, speculatedP1.y - speculatedP0.y);
                var normalLength = Math.sqrt(normalToCollision.x * normalToCollision.x + normalToCollision.y * normalToCollision.y);
                normalToCollision.x = normalToCollision.x / normalLength;
                normalToCollision.y = normalToCollision.y / normalLength;
                performCollision(items[i], items[j], item1dCollision, item2dCollision, normalToCollision);
            }
        }

        contactList = [];
        // generate motion bound
        for (var i = 0; i < items.length; i++) {
            var newContact = generateContact(items, i);
            if (newContact.length !== 0) {
                if (contactList.length === 0)
                    contactList = newContact;
                else
                    contactList = contactList.concat(newContact);
            }
        }

        // push
        for (var k = 0; k < SPECUTATION_ITERATION; k++) {

            // generate motion bound

            // speculation contact testing
            for (var i = 0; i < contactList.length; i++) {
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
            for (var j = i + 1; j < items.length; j++) {
                var p1 = rotateAndTranslateItemShape(items[i]);
                var p2 = rotateAndTranslateItemShape(items[j]);

                var result = Intersection.intersectPolygonPolygon(p1, p2);

                // [TODO] This is buggy because multiple collision case is not handled
                if (result.status === 'No Intersection' && items[i].speculated && items[j].speculated) {
                    console.log('enter speculated no intersection');
                    items[i].speculated--;
                    items[j].speculated--;

                    var result = closestDistanceBetweenPolygons(p1, p2);
                    var collisionPoint = new Vector((result.returnP0.x + result.returnP1.x) / 2, (result.returnP0.y + result.returnP1.y) / 2);
                    var item1dCollision = new Vector(-items[i].cx + collisionPoint.x, -items[i].cy + collisionPoint.y);
                    var item2dCollision = new Vector(-items[j].cx + collisionPoint.x, -items[j].cy + collisionPoint.y);

                    var normalToCollision = new Vector(speculatedP1.x - speculatedP0.x, speculatedP1.y - speculatedP0.y);
                    normalLength = Math.sqrt(normalToCollision.x * normalToCollision.x + normalToCollision.y * normalToCollision.y);
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
                    for (var k = 0; k < result.points.length; k++) {
                        x += result.points[k].x;
                        y += result.points[k].y;
                        //console.log(result.points[k]);
                    }
                    var collisionPoint = new Vector(x / result.points.length, y / result.points.length);
                    //console.log('collisionPoint: ' + collisionPoint.x + ' ' + collisionPoint.y);
                    var item1dCollision = new Vector(-items[i].cx + collisionPoint.x, -items[i].cy + collisionPoint.y);
                    var item2dCollision = new Vector(-items[j].cx + collisionPoint.x, -items[j].cy + collisionPoint.y);
                    //console.log('item1 vector: ' + item1dCollision.x + ' ' + item1dCollision.y);
                    //console.log('item2 vector: ' + item2dCollision.x + ' ' + item2dCollision.y);
                    var normalToCollision = new Vector(speculatedP1.x - speculatedP0.x, speculatedP1.y - speculatedP0.y);
                    normalLength = Math.sqrt(normalToCollision.x * normalToCollision.x + normalToCollision.y * normalToCollision.y);
                    normalToCollision.x = normalToCollision.x / normalLength;
                    normalToCollision.y = normalToCollision.y / normalLength;
                    performCollision(items[i], items[j], item1dCollision, item2dCollision, normalToCollision);
                }
            }
        }
        for (var i = 0; i < items.length; i++) {
            // Check for collision
            for (var j = i + 1; j < items.length; j++) {
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

    while (accumulator >= DELTA_T) {

        previous = createPreviousStateFromCurrent(items);

        // update items' velocity and position
        for (var i = 0; i < items.length; i++) {
            var returnItem = computeCurrentSpeedAndPosition(items[i]);
            if (!returnItem.ignore) {
                returnItems.push(returnItem);
            }
        }


        if (RENDER_ONCE) {
            RENDER = false;
            RENDER_ONCE = false;
        }

        accumulator -= DELTA_T;

    }

    var alpha = accumulator / DELTA_T;
    returnItems = interpolate(returnItems, alpha);

    var JSONResult = JSON.stringify({'type':'updateItemsState', 'items':returnItems});
    self.postMessage(JSONResult);
}
// @author U099151W ChenChen Sun
function minMin(v1, v2) {
    var x, y;
    x = v1.x < v2.x ? v1.x : v2.x;
    y = v1.y < v2.y ? v1.y : v2.y;
    return new Vector(x, y);
}
// @author U099151W ChenChen Sun
function maxMax(v1, v2) {
    var x, y;
    x = v1.x > v2.x ? v1.x : v2.x;
    y = v1.y > v2.y ? v1.y : v2.y;
    return new Vector(x, y);
}
// @author U099151W ChenChen Sun
function generateContact(items, motionItemID) {
    // create motion bound box for item
    var motionItem = constructPartialItem(items[motionItemID]);
    var preBoundingBoxPoints = rotateAndTranslateItemBoundingBox(motionItem);
    var minPoint = new Vector(100000, 10000);
    var maxPoint = new Vector(-100000, -100000);
    // compute pre motion bounding box
    for (var m = 0; m < preBoundingBoxPoints.length; m++) {
        minPoint = minMin(minPoint, preBoundingBoxPoints[m]);
        maxPoint = maxMax(maxPoint, preBoundingBoxPoints[m]);
    }

    // compute post motion bounding box
    var postMotionItem = computeCurrentSpeedAndPosition(motionItem);
    var postBoundingBoxPoints = rotateAndTranslateItemBoundingBox(postMotionItem);
    // compute pre motion bound box
    for (var m = 0; m < postBoundingBoxPoints.length; m++) {
        minPoint = minMin(minPoint, postBoundingBoxPoints[m]);
        maxPoint = maxMax(maxPoint, postBoundingBoxPoints[m]);
    }
    var motionBox = [minPoint,
        new Vector(maxPoint.x, minPoint.y),
        maxPoint,
        new Vector(minPoint.x, maxPoint.y)];

    var motionContactList = []
    for (var i = 0; i < items.length; i++) {

        if (i === motionItemID)
            continue;

        var testItemPoints = rotateAndTranslateItemBoundingBox(items[i]);
        var result = Intersection.intersectPolygonPolygon(motionBox, testItemPoints);
        if (result.status === 'Intersection') {
            motionContactList.push(new Contact(motionItemID, i));
        }
        else {
            var testItemPoints = rotateAndTranslateItemBoundingBox(items[i]);
            for (var j = 0; j < testItemPoints.length; j++) {
                if (testItemPoints[j].x < minPoint.x || testItemPoints[j].x > maxPoint.x
                    || testItemPoints[j].y < minPoint.y || testItemPoints[j].y > maxPoint.y) {
                    break;
                }
                if (j === testItemPoints.length - 1) {
                    motionContactList.push(new Contact(motionItemID, i));
                }
            }

        }
    }
    //if (motionContactList.length !== 0)
    //console.log(motionContactList);
    return motionContactList;
}
// @author U096089W Saikrishnan Ranganathan
function setItemInMotion(item, force, angle, pointOfImpactFromCenter) {
    var returnItem = computeInitialSpeedAndSpin(item, force, angle, pointOfImpactFromCenter);

//    updateItemState([returnItem]);
    var JSONResult = JSON.stringify({'type':'setItemInMotion', 'item':returnItem});
    //console.log(JSONResult);
    self.postMessage(JSONResult);
}
// @author U096089W Saikrishnan Ranganathan
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
// @author U096089W Saikrishnan Ranganathan
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

        if (speed === 0 && item.angularV === 0.0) {
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
// @author U099151W ChenChen Sun
function Vector(x, y) {
    if (arguments.length > 0) {
        this.init(x, y);
    }
}

Vector.prototype.init = function (x, y) {
    this.x = x;
    this.y = y;
};
Vector.prototype.min = function (that) {
    return new Vector(Math.min(this.x, that.x), Math.min(this.y, that.y));
};
Vector.prototype.max = function (that) {
    return new Vector(Math.max(this.x, that.x), Math.max(this.y, that.y));
};
// @author U099151W ChenChen Sun
function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}
// @author U099151W ChenChen Sun
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
// @author U099151W ChenChen Sun
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
// @author U096089W Saikrishnan Ranganathan
function convertAngularVelocityToNormal(item, p) {
    var r = Math.sqrt(( (p.x - item.cx) * (p.x - item.cx) + (p.y - item.cy) * (p.y - item.cy) ));
    var normalV = r * item.angularV;
    var alpha = Math.atan2(( -p.y + item.cy), ( -p.x + item.cx));
    if (item.angularV > 0)
        alpha = +Math.PI / 2;
    else
        alpha = -Math.PI / 2;

    var normalVX = normalV * Math.cos(alpha);
    var normalVY = normalV * Math.sin(alpha);
    return {vx:normalVX, vy:normalVY};
}
// @author U099151W ChenChen Sun
function computeRadiusArm(item, p) {
    var r = new Vector((p.x - item.cx), (p.y - item.cy));
    return {x:-r.y, y:r.x};
}

// @author U099151W ChenChen Sun
function speculateCollision(item1, item2, contactNormal, p0, p1, contact) {

    // convert angular velocity to normal velocity
    var radiusArm1 = computeRadiusArm(item1, p0);
    var radiusArm2 = computeRadiusArm(item2, p1);

    contactNormal = new Vector(p1.x - p0.x, p1.y - p0.y);
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
    var denom1 = radiusAramNormal1 * radiusAramNormal1 / item1.inertia;
    var denom2 = radiusAramNormal2 * radiusAramNormal2 / item2.inertia;
    var denom = 1 / item1.mass + 1 / item2.mass + denom1 + denom2;

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
// @author U096089W Saikrishnan Ranganathan
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
// @author U099151W ChenChen Sun
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

// @author U096089W Saikrishnan Ranganathan
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

    var item1VPreCollision = new Vector(item1.vx - item1.angularV * item1dToCollision.y, item1.vy + item1.angularV * item1dToCollision.x);
    var item2VPreCollision = new Vector(item2.vx - item2.angularV * item2dToCollision.y, item2.vy + item2.angularV * item2dToCollision.x);

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
            ((item1dCollisionCrossNormal * item1dCollisionCrossNormal) / inertiaItem1 ) +
            ((item2dCollisionCrossNormal * item2dCollisionCrossNormal) / inertiaItem2));
    //console.log('impulse');
    //console.log(collisionImpulse);
    var collisionImpulseTimesNormalVector = new Vector(collisionImpulse * normalToCollision.x, collisionImpulse * normalToCollision.y);
    console.log('impulse normal')
    console.log(collisionImpulseTimesNormalVector.x + ' ' + collisionImpulseTimesNormalVector.y);

    // test
    var deltaVx = collisionImpulseTimesNormalVector.x * inverseMassItem1 + collisionImpulseTimesNormalVector.x * inverseMassItem2;
    var deltaVy = collisionImpulseTimesNormalVector.y * inverseMassItem1 + collisionImpulseTimesNormalVector.y * inverseMassItem2;
    var deltaAv1 = cross(item1dToCollision, collisionImpulseTimesNormalVector, angleBetweenItem1dAndNormal) / inertiaItem1;
    var deltaAv2 = -cross(item2dToCollision, collisionImpulseTimesNormalVector, angleBetweenItem2dAndNormal) / inertiaItem2;
    var VxPostCollision = deltaVx - item1dToCollision.y * deltaAv1 + item2dToCollision.y * deltaAv2;
    var VyPostCollision = deltaVy + item1dToCollision.x * deltaAv1 - item2dToCollision.x * deltaAv2;
    var VPostVec = new Vector(VxPostCollision, VyPostCollision);
    var postV = dot(VPostVec, normalToCollision);
    console.log('postRelV ' + postV);

    var finalLinearVelocityOfItem1 = new Vector((item1.vx + collisionImpulseTimesNormalVector.x * inverseMassItem1),
        (item1.vy + collisionImpulseTimesNormalVector.y * inverseMassItem1));

    var finalLinearVelocityOfItem2 = new Vector((item2.vx - collisionImpulseTimesNormalVector.x * inverseMassItem2),
        (item2.vy - collisionImpulseTimesNormalVector.y * inverseMassItem2));

    var finalAngularVelocityItem1 = item1.angularV + cross(item1dToCollision, collisionImpulseTimesNormalVector, angleBetweenItem1dAndNormal) / inertiaItem1;
    var finalAngularVelocityItem2 = item2.angularV - cross(item2dToCollision, collisionImpulseTimesNormalVector, angleBetweenItem2dAndNormal) / inertiaItem2;

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
// @author U096089W Saikrishnan Ranganathan
function cross(vector1, vector2, angleBetweenThem) {

    var vector1Mod = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    var vector2Mod = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

    //return vector1.x*vector2.y-vector1.y*vector2.x;

    return vector1Mod * vector2Mod * Math.sin(angleBetweenThem);
}
// @author A0073676U Renga S
function Intersection(status) {
    if (arguments.length > 0) {
        this.init(status);
    }
}

/*****
 intialize Intersection
 *****/
// @author A0073676U Renga S
Intersection.prototype.init = function (status) {
    // hold the status of the intersection
    this.status = status;
    // array to store the points
    this.points = new Array();
};


/*****
 add a single point
 *****/
// @author A0073676U Renga S
Intersection.prototype.addPoint = function (point) {
    this.points.push(point);
};
/*****
 *
 * To hold multiple points addPonits
 *
 *****/
// @author A0073676U Renga S
Intersection.prototype.addPoints = function (points) {
    this.points = this.points.concat(points);
};

/*****
 *
 *   Check intersection of line with a polygon
 *
 *****/
// @author A0073676U Renga S
Intersection.intersectLinePolygon = function (a1, a2, points) {
    var result = new Intersection("No Intersection");
    var length = points.length;

    for (var i = 0; i < length; i++) {
        var b1 = points[i];
        var b2 = points[(i + 1) % length];
        var inter = Intersection.intersectLineLine(a1, a2, b1, b2);

        result.addPoints(inter.points);
    }

    if (result.points.length > 0) result.status = "Intersection";

    return result;
};


/*****
 *
 * Check for intersection of a polygon with polygon
 *
 *****/
// @author A0073676U Renga S
Intersection.intersectPolygonPolygon = function (points1, points2) {
    var result = new Intersection("No Intersection");
    var length = points1.length;

    for (var i = 0; i < length; i++) {
        var a1 = points1[i];
        var a2 = points1[(i + 1) % length];
        var inter = Intersection.intersectLinePolygon(a1, a2, points2);

        result.addPoints(inter.points);
    }

    if (result.points.length > 0)
        result.status = "Intersection";

    return result;

};

/*****
 *
 *   Check intersection of line with a line
 *
 *****/
// @author A0073676U Renga S
Intersection.intersectLineLine = function (a1, a2, b1, b2) {
    var result;

    var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    var u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

    if (u_b != 0) {
        var ua = ua_t / u_b;
        var ub = ub_t / u_b;

        if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
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
        if (ua_t == 0 || ub_t == 0) {
            result = new Intersection("Coincident");
        } else {
            result = new Intersection("Parallel");
        }
    }

    return result;
};
