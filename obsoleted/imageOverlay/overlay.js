/**
 * Define an object to hold all our images for the game so images
 * are only ever created once. This type of object is known as a
 * singleton.
 */
var imageRepository = new function() {

    //Ensure all images have loaded before starting the game
    var numImages=4;
    var numLoaded=0;

    // Define images
    this.wood = new Image();
    this.objects = [];

    function imageLoaded() {
        numLoaded++;
        if (numLoaded === numImages)
        {
            window.init();
        }
    }

    this.wood.onload =function() {
        imageLoaded();
    }
    // Set images src
    this.wood.src= "imageOverlay/imgs/background/wood.png";

    // COMMENT BY CHENCHEN
    // THE NUMBER SEEMS NOT CORRECT
    for (x = 0; x <= 3; x++) {
        //create var for object
        var imageObj = new Image(); // new instance for each image
        //define the source
        imageObj.src = "imageOverlay/imgs/objects/ob"+x+".png";
        //push it inside the array
        this.objects.push(imageObj);
        // load the objects before game play
        this.objects[x].onload=function(){
            imageLoaded();
        }
    };

}

/**
 * Creates the Drawable object which will be the base class for
 * all drawable objects in the game. Sets up default variables
 * that all child objects will inherit, as well as the default
 * functions.
 */
function Drawable() {
    this.init = function(x, y) {
        // Defualt variables
        this.x = x;
        this.y = y;
    }
    this.canvasWidth = 0;
    this.canvasHeight = 0;

    // Define abstract function to be implemented in child objects
    this.draw = function() {
    };
}

/**
 * Creates the Background object which will become a child of
 * the Drawable object. The background is drawn on the "background"
 * canvas and creates the illusion of moving by panning the image.
 */
function Background() {
    // Implement abstract function
    this.draw = function() {
        this.context.drawImage(imageRepository.wood, this.x, this.y);
    };
}
// Set Background to inherit properties from Drawable
Background.prototype = new Drawable();


function objects(){
    this.draw = function(i,x,y) {
        this.init(x,y);
        this.context.drawImage(imageRepository.objects[i], this.x, this.y);
    };
}

objects.prototype=new Drawable();

/**
 * Creates the Game object which will hold all objects and data for
 * the game.
 */
function Game() {
    /*
     * Gets canvas information and context and sets up all game
     * objects.
     * Returns true if the canvas is supported and false if it
     * is not. This is to stop the animation script from constantly
     * running on older browsers.
     */
    this.init = function() {
        // Get the canvas element
        this.bgCanvas = document.getElementById('background');
        this.objectcanvas=document.getElementById('object');

        // Test to see if canvas is supported
        if (!this.bgCanvas.getContext) {
            return false;
        } else {
            this.bgContext = this.bgCanvas.getContext('2d');
            this.objectcanvas = this.objectcanvas.getContext('2d');

            // Initialize objects to contain their context and canvas
            // information
            Background.prototype.context = this.bgContext;
            Background.prototype.canvasWidth = this.bgCanvas.width;
            Background.prototype.canvasHeight = this.bgCanvas.height;

            objects.prototype.context = this.objectcanvas;
            objects.prototype.canvasWidth = this.objectcanvas.width;
            objects.prototype.canvasHeight = this.objectcanvas.height;

            // Initialize the background object
            this.background = new Background();
            this.background.init(0, 0); // Set draw point to 0,0
            //initalise objects
            this.objects = new objects();
            this.objects.init(0, 0); // Set draw point to 0,0

            return true;
        }
    };

}
/**
 * The animation loop. Calls the requestAnimationFrame shim to
 * optimize the game loop and draws all game objects. This
 * function must be a gobal function and cannot be within an
 * object.
 */

var game = new Game();




function init() {
    var canvas=document.getElementById('object');


    if(game.init())
    {

        //game.background.draw();
        game.background.draw();
        game.objects.draw(2,100,100);
        game.objects.draw(0,10,100);

        canvas.addEventListener('mousedown', function (e) {

            x= e.pageX;
            y= e.pageY;

            if(x>10&&x<10+64&&y>100&&y<164)
            {
                alert("object1")
            }


        })

    }
}









