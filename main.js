// VISAVIS
// caglorithm@github
// 2017

var clock = new THREE.Clock();

var container;

var camera, scene, renderer, stats;
var controls;
var meshControls;


var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

// use this control only witout orbit
var mouseMoveControl = false;
var enableOrientationControl = false;
var orientationControl;

// geometry
var thisMesh;
var thisGeometry;
var thisGroup;
var wireframeGeometry;
var normalMaterial;

var originalPositions; 

var originalWireframe;
var wireframeGeometry;
var wireframe;
var drawWireframe = false;

var center = new THREE.Vector3( 0, 0,  0);

// custom variables
var filteredVertices = [];

// animation
var time;

// audio
var historyLength = 50;
var volumeHistory = new Array(historyLength).fill(0);

// BOKEH

var postprocessing = { enabled  : true };

			var shaderSettings = {
				rings: 3,
				samples: 4
			};

			var singleMaterial = false;
			var mouse = new THREE.Vector2();
			var raycaster = new THREE.Raycaster();
			var distance = 100;
			var material_depth;
var effectController;


// SHADERS -----------------------

var SHADERS = true;

var composer;
var shaderTime = 0;
var badTVParams, badTVPass;		
var staticParams, staticPass;		
var rgbParams, rgbPass;	
var filmParams, filmPass;	
var renderPass, copyPass;

// --------------------------------------------------


init();
animate();

function init() {

	// audioHandler.js
	audioContext = new AudioContext();
	getMicInput();

	// ----------- RENDERER -----------

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.top = 0;
	
	// background color
	renderer.setClearColor (0x2e353f, 1);

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	container.appendChild( renderer.domElement );

	stats = new Stats();
	container.appendChild( stats.dom );	

	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) {

		console.log( item, loaded, total );

	};
	var onProgress = function ( xhr ) {
		if ( xhr.lengthComputable ) {
			var percentComplete = xhr.loaded / xhr.total * 100;
			console.log( Math.round(percentComplete, 2) + '% downloaded' );
		}
	};

	var onError = function ( xhr ) {
	};

	// ----------- CAMERA -----------

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 800 );
	

	// ----------- SCENE -----------

	scene = new THREE.Scene();
	//scene.fog = new THREE.FogExp2( 0xaaccff, 0.00007 );

	// ----------- LIGHTS -----------

	var ambient = new THREE.AmbientLight( 0x3010A0 );
	scene.add( ambient );

	var directionalLight = new THREE.DirectionalLight( 0xA0A0A0 );
	directionalLight.position.set( 0, 1, 0 );
	scene.add( directionalLight );

	// FLOOR
	//var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
	//floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
	//floorTexture.repeat.set( 10, 10 );
	//var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var floorMaterial = new THREE.MeshBasicMaterial( { color: 0x050505, wireframe: true, side: THREE.DoubleSide } );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -4;
	floor.rotation.x = Math.PI / 2;
	//scene.add(floor);

	// ----------- MODEL -----------

	// load model, manipulate, add to mesh, add to group, add to scene

	var loader = new THREE.OBJLoader( manager );

	thisGroup = new THREE.Object3D();
	thisGeometry = new THREE.Geometry();

	loader.load( 'obj/david_big.obj', function ( object ) {
		object.traverse( function ( child ) {
			if ( child instanceof THREE.Mesh ) {
				// get Geometry from BufferGeometry
				thisGeometry = new THREE.Geometry().fromBufferGeometry( child.geometry );

				// loop through / edit initial geometry here

				// not really used anymore, could comment out:
				filterVertices();

				// create new mesh from geometry and a material
				// normalMaterial doesn't work with lights!?

				normalMaterial = new THREE.MeshNormalMaterial({
				    polygonOffset: true,
				    polygonOffsetFactor: 1, // positive value pushes polygon further away
				    polygonOffsetUnits: 1
				});

				var material = new THREE.MeshPhongMaterial( {
						color: 0xffffff,
						specular:0xffffff,					
						shininess: 50,
						reflectivity: 1.0
					});

				thisMesh = new THREE.Mesh(thisGeometry, normalMaterial);

			    // wireframe 
			    if ( drawWireframe ) {
				    wireframeGeometry = new THREE.EdgesGeometry( thisMesh.geometry ); // or WireframeGeometry
				    wireframeGeometry.center( thisMesh.position ); // this re-sets the mesh position
				    wireframeGeometry.translate(0, 0, 5);
				    var mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 0.5 } );
				    wireframe = new THREE.LineSegments( wireframeGeometry, mat );
				    thisMesh.add( wireframe );
			    }
			    

			}

			

		} );

		// ----------- CENTER and ROTATE GEOMETRY TO MESH CENTER -------------

		// FOT THE MAP DATA FROM VECTILER WE NEED TO ROTATE THE MODEL PROPERLY
		var ROTATE_VECTILER = false
		if (ROTATE_VECTILER) {
			thisMesh.rotation.x= -Math.PI/2;
		}

		// ----------- CENTER GEOMETRY TO MESH CENTER 

		thisGeometry.center( thisMesh.position ); // this re-sets the mesh position
		thisMesh.position.multiplyScalar( - 1 );

		// deep copy oriringal positions array
		originalPositions = thisGeometry.vertices.map(function (v) { return v.clone() });

		// --------- position camera --------
		camera.position.z = 17;
		camera.position.y = 10;		
		
		// add to group and render
		thisGroup.add(thisMesh);
		scene.add( thisGroup );	

		// --------- debug output
		console.log("thisMesh");
		console.log(thisMesh);
		console.log("Bounding box");
		console.log(thisGeometry.boundingBox);


		// --------------- LEA{P} MO{T}ION TEST ---------

		var fingers = {};
  		var spheres = {};


		Leap.loop(function(frame) {

		    var fingerIds = {};
		    var handIds = {};

		    for (var index = 0; index < frame.pointables.length; index++) {

		      var pointable = frame.pointables[index];
		      var finger = fingers[pointable.id];

		      var pos = pointable.tipPosition;
		      var dir = pointable.direction;

		      var origin = new THREE.Vector3(pos[0], pos[1], pos[2]);
		      var direction = new THREE.Vector3(dir[0], dir[1], dir[2]);

		      if (!finger) {
		        finger = new THREE.ArrowHelper(origin, direction, 20, Math.random() * 0xffffff);
		        fingers[pointable.id] = finger;
		        scene.add(finger);
		      }

		      finger.position = origin;
		      finger.setDirection(direction);

		      fingerIds[pointable.id] = true;
		    }

		    for (fingerId in fingers) {
		      if (!fingerIds[fingerId]) {
		        scene.remove(fingers[fingerId]);
		        delete fingers[fingerId];
		      }
		    }
		    
		    if(frame.gestures.length > 0) console.log(frame.gestures);


		    controls.update(frame);
		    //meshControls.update(frame);
    		//renderer.render(scene, camera);
  		});


		// --------- TEMP: DRAW COORDINATE AXIS ---------

		drawCoords = false
		if (drawCoords) {
					// coordinate systems helper
		  var axes = new THREE.AxisHelper();            // add axes
		  scene.add( axes );
		  
		  var cube = new THREE.Mesh(
		                          new THREE.CubeGeometry( 1, .1, .1 ),
		                          new THREE.MeshLambertMaterial( { color: 0xff0000 } )
		                      );
		  cube.position.set(0.5,0,0);
		  scene.add( cube );
		  var cube = new THREE.Mesh(
		                          new THREE.CubeGeometry( .1, 1, .1 ),
		                          new THREE.MeshLambertMaterial( { color: 0x00ff00 } )
		                      );
		  cube.position.set(0,0.5,0);
		  scene.add( cube );
		  var cube = new THREE.Mesh(
		                          new THREE.CubeGeometry( .1, .1, 1 ),
		                          new THREE.MeshLambertMaterial( { color: 0x0000ff } )
		                      );
		  cube.position.set(0,0,0.5);
		  scene.add( cube );

		  var light = new THREE.PointLight( 0xFFFFFF );
		  light.position.set( 20, 20, 20 );
		  scene.add( light );

				var material = new THREE.LineBasicMaterial({
					color: 0xffffff,
					linewidth: 50
				});

		}

	}, onProgress, onError );

	// ----------- CALLBACKS -----------

	// add some event listeners

	//document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	//document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	//document.addEventListener( 'touchmove', onDocumentTouchMove, false );	
	document.addEventListener("keydown",keyDownHandler, false);
	window.addEventListener( 'resize', onWindowResize, false );


	// ----------- FX -----------


	// ----------- CONTROLS -----------

	// Add OrbitControls so that we can pan around with the mouse.
	controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener( 'change', render );

    controls = new THREE.LeapCameraControls(camera);
    meshControls = new THREE.LeapObjectControls(camera, thisGroup);

	// for smartphone device rotation control
    window.addEventListener('deviceorientation', function(e) {
      var gammaRotation = e.gamma ? e.gamma * (Math.PI / 6000) : 0;
      //thisMesh.rotation.z = gammaRotation;
      //thisMesh.rotation.x= -Math.PI/4;
	});

	if ( enableOrientationControl == true) {
		console.log("Orientation control enabled.");
    	orientationControl = new THREE.DeviceOrientationControls( thisGroup );
    	//camera.lookAt ( new THREE.Vector3( 0, 0, 10 ) );

    }

	 
	//onShaderParamsChange();

	// ---------------- DAT.GUI INTERFACE ----------------

	initializeGui();	
				
}


// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------


function onToggleShaders(){
	//Add Shader Passes to Composer
	//order is important 
	composer = new THREE.EffectComposer( renderer );
	composer.addPass( renderPass );

	if (filmParams.show){
		composer.addPass( filmPass );
	}

	if (badTVParams.show){
		composer.addPass( badTVPass );
	}

	if (rgbParams.show){
		composer.addPass( rgbPass );
	}

	if (staticParams.show){
		composer.addPass( staticPass );
	}

	composer.addPass( copyPass );
	copyPass.renderToScreen = true;
}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

}

function onDocumentMouseMove( event ) {

	mouseX = ( event.clientX - windowHalfX ) / 150;
	mouseY = ( event.clientY - windowHalfY ) / 150;

	mouse.x = ( event.clientX - windowHalfX ) / windowHalfX;
	mouse.y = - ( event.clientY - windowHalfY ) / windowHalfY;

	//postprocessing.bokeh_uniforms[ 'focusCoords' ].value.set(event.clientX / window.innerWidth, 1-event.clientY / window.innerHeight);
}

function onDocumentTouchStart( event ) {

	if ( event.touches.length == 1 ) {

		event.preventDefault();

		mouse.x = ( event.touches[ 0 ].pageX - windowHalfX ) / windowHalfX;
		mouse.y = - ( event.touches[ 0 ].pageY - windowHalfY ) / windowHalfY;

	}
}

function onDocumentTouchMove( event ) {

	if ( event.touches.length == 1 ) {

		event.preventDefault();

		mouse.x = ( event.touches[ 0 ].pageX - windowHalfX ) / windowHalfX;
		mouse.y = - ( event.touches[ 0 ].pageY - windowHalfY ) / windowHalfY;

	}

}



// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------

function animate() {
	
	if (SHADERS) {
		shaderTime += 0.1;
		
		badTVPass.uniforms[ 'time' ].value =  shaderTime;
		filmPass.uniforms[ 'time' ].value =  shaderTime;
		staticPass.uniforms[ 'time' ].value =  shaderTime;
	}

	

	if ( enableOrientationControl == true) {
		orientationControl.update();
	}

	stats.update();

	requestAnimationFrame( animate );
	

	if (SHADERS)
		composer.render( 0.1 );
	
	render();


}


function render() {

	// ----------- TIME KEEPING -----------

	//var delta = clock.getDelta(),
	//time = clock.getElapsedTime() * 10;
	

	// ----------- ANIMATION -----------

	updateAudio();
	animateVertices();

	// ----------- CAMERA -----------

	if (mouseMoveControl == true) {
		camera.position.x += ( mouseX - camera.position.x ) * .25;
		camera.position.y += ( - mouseY - camera.position.y ) * .25;
	}
	

	if (!enableOrientationControl)
		camera.lookAt( scene.position );

	// ----------- RENDERER -----------

	//renderBokeh();

	if (!SHADERS)
		renderer.render( scene, camera );
	//stats.update();

}


function animateVertices(){

	time = clock.getElapsedTime() * 10;

	//volumeHistory.push(Math.exp(normLevel+1)/5);
	(Math.random() < 0.1) && console.log('t', time, 'volume', normLevel);

	volumeHistory.push(normLevel);
	volumeHistory.shift();

	maxDistance = 10; // fix this!
	
	// ANIMATE WIREFRAME 
	if ( drawWireframe ) {
		//(Math.random() < 0.1) && wireframe.traverse( function ( object ) { object.visible = !object.visible; } );
	}	

	// ANIMATE filteredVertices
	if (1 == 0) {
		for ( var i = 0, l = filteredVertices.length; i < l; i ++ ) {					
			//var thisVertex = originalPositions[ filteredVertices[i] ];
			//var distanceToCenter = Math.sqrt((center.x+thisVertex.x)**2 + (center.y+thisVertex.y)**2);
			//var normDistance = historyLength - Math.round( distanceToCenter / maxDistance * historyLength );
			
			//if (i == 100) console.log(volumeHistory[normDistance]);
			//thisGeometry.vertices[ filteredVertices[i] ].z = thisVertex.z + 10*normLevel;// volumeHistory[normDistance]; //+ 0.2 * Math.abs((Math.sin( time * (1 / 2) + thisVertex.x + (note-41)/90*Math.PI + thisVertex.y))) - 0.01;
			//thisGeometry.vertices[ filteredVertices[i] ].z = thisVertex.z + 0.2 * Math.abs((Math.sin( time * (1 / 2) + thisVertex.x + thisVertex.y))) - 0.01;
			//thisGeometry.vertices[ filteredVertices[i] ].z = thisVertex.z + 0.2 * Math.abs((Math.sin( time * sketchParams.cubeSpeed *   normLevel * 10 * (1 / 2) + thisVertex.x + sketchParams.volSens * (note-41)/90*Math.PI * 0 + thisVertex.y))) - 0.01;
			//if (volumeHistory[normDistance] > 100) 
			//thisGeometry.vertices[ filteredVertices[i] ].z = thisVertex.z //+ volumeHistory[normDistance]; // * normLevel * Math.sin( time * (1 / 2))**2;
		}
	}

	// ANIAMTE EVERYTHING
	if (sketchParams.animation) {
		for ( var i = 0, l = thisGeometry.vertices.length; i < l; i += sketchParams.glitchSkip ) {
			if (Math.random() < sketchParams.glitchProbability) {
				// this line loses me 10 fps if the model is large
				var distanceToCenter = Math.sqrt((center.x+originalPositions[ i ].x)**2 + (center.y+originalPositions[ i ].y)**2);

				var normDistance = historyLength - Math.round( distanceToCenter / maxDistance * historyLength );
				//thisGeometry.vertices[ i ].z = originalPositions[ i ].z + 20*(normLevel-0.2) * 0.1*(1-distanceToCenter);

				// as many fps (10?) as this one
				sketchParams.glitchAmplitude = Math.exp(normLevel+1);
				thisGeometry.vertices[ i ].z = originalPositions[ i ].z + volumeHistory[normDistance] * sketchParams.glitchAmplitude * Math.sin(time/20*sketchParams.glitchRotationSpeed*normLevel);
				thisGeometry.vertices[ i ].x = originalPositions[ i ].x + volumeHistory[normDistance] * sketchParams.glitchAmplitude * Math.cos(time/20*sketchParams.glitchRotationSpeed*normLevel);


			}
		}
	}

	
	//normalMaterial.needsUpdate = true;
	thisGeometry.verticesNeedUpdate = true;

	if (drawWireframe) 
		wireframeGeometry.verticesNeedUpdate = true; // only required if geometry previously-rendered


	if (SHADERS) {
	// randomize RGB shift shader amount and angle
		randomRGB = true
		if (randomRGB) {
			if (normLevel>0.2) { 
				rgbParams.amount = normLevel/20; 
				rgbParams.angle = Math.random()*2
			}
			else { 
				rgbParams.amount = 0.01 * Math.sin(time/50); 
			}
			//rgbParams.amount = (Math.random()+1)*normLevel*0.1;
		}
		
		onShaderParamsChange();
	}	
}

function filterVertices(){
	for ( var i = 0, l = thisGeometry.vertices.length; i < l; i ++ ) {
		//thisGeometry.vertices[ i ].z = 0.35 * Math.sin( i / 2 );
		if ( thisGeometry.vertices[ i ].z > 0.04 ) {
			filteredVertices.push(i);
		}
	}

	console.log("Filtered vertices");
	console.log(filteredVertices);
}

function keyDownHandler(event){
	var keyPressed = String.fromCharCode(event.keyCode);

	if (keyPressed == "R") {
		for ( var i = 0, l = thisGeometry.vertices.length; i < l; i += 1 ) {
			thisGeometry.vertices[ i ].x = originalPositions[ i ].x;
			thisGeometry.vertices[ i ].y = originalPositions[ i ].y;
			thisGeometry.vertices[ i ].z = originalPositions[ i ].z;
		}
	}
}

// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------

function initializeGui(){


	sketchParams = {
		animation: true,
		volSens: 1.0,
		glitchAmplitude: 20.0,
		glitchProbability: 0.1,
		glitchSkip: 10,
		glitchRotationSpeed: 1
	};
	gui = new dat.GUI({ autoPlace: true });

	var customContainer = document.getElementById('my-gui-container');
	document.querySelector('#gui').appendChild(gui.domElement);
	
	var f0 = gui.addFolder('Animation');
	f0.add(sketchParams, 'animation');
	f0.add(sketchParams, 'volSens', 0, 4).listen().step(0.02);
	f0.add(sketchParams, 'glitchAmplitude', 0, 40).step(1);
	f0.add(sketchParams, 'glitchProbability', 0, 1).step(0.05);
	f0.add(sketchParams, 'glitchSkip', 1, 100).step(1);	
	f0.add(sketchParams, 'glitchRotationSpeed', 0, 1, 0.01)
	f0.open();

	if (SHADERS) {

	    // ---------------- BOKEH PARAMETERS ----------------
		material_depth = new THREE.MeshDepthMaterial();
		effectController  = {

			enabled: false,
			jsDepthCalculation: true,
			shaderFocus: true,

			fstop: 2.2,
			maxblur: 1.0,

			showFocus: false,
			focalDepth: 2.8,
			manualdof: false,
			vignetting: false,
			depthblur: false,

			threshold: 0.5,
			gain: 2.0,
			bias: 0.5,
			fringe: 0.7,

			focalLength: 35,
			noise: true,
			pentagon: false,

			dithering: 0.0001

		};

		console.log('POSTPROCESSING ' + postprocessing.enabled );

		// Shaders pass ----------------------------------
		//Create Shader Passes
		renderPass = new THREE.RenderPass( scene, camera );
		badTVPass = new THREE.ShaderPass( THREE.BadTVShader );
		rgbPass = new THREE.ShaderPass( THREE.RGBShiftShader );
		filmPass = new THREE.ShaderPass( THREE.FilmShader );
		staticPass = new THREE.ShaderPass( THREE.StaticShader );
		copyPass = new THREE.ShaderPass( THREE.CopyShader );

		//set shader uniforms
		filmPass.uniforms[ "grayscale" ].value = 0;

		badTVParams = {
			show: false,
			distortion: 2.0,
			distortion2: 1.0,
			speed: 0.3,
			rollSpeed: 0.01
		}

		staticParams = {
			show: false,
			amount:0.05,
			size:2.0
		}

		rgbParams = {
			show: false,
			amount: 0.005,
			angle: 0.0,
		}

		filmParams = {
			show: false,
			count: 800,
			sIntensity: 0.9,
			nIntensity: 0.4,
			grayscale: false
		}
		rgbPass.uniforms[ "angle" ].value = rgbParams.angle*Math.PI;
		rgbPass.uniforms[ "amount" ].value = rgbParams.amount;
		staticPass.uniforms[ "amount" ].value = staticParams.amount;
		staticPass.uniforms[ "size" ].value = staticParams.size;
		
		onToggleShaders();

		// ---------- MENU ITEMS ----------

		var f1 = gui.addFolder('Bokeh');
		f1.add( effectController, "enabled" ).onChange( bokehMatChanger );
		f1.add( effectController, "jsDepthCalculation" ).onChange( bokehMatChanger );
		f1.add( effectController, "shaderFocus" ).onChange( bokehMatChanger );
		f1.add( effectController, "focalDepth", 0.0, 200.0 ).listen().onChange( bokehMatChanger );

		f1.add( effectController, "fstop", 0.1, 22, 0.001 ).onChange( bokehMatChanger );
		f1.add( effectController, "maxblur", 0.0, 5.0, 0.025 ).onChange( bokehMatChanger );

		f1.add( effectController, "showFocus" ).onChange( bokehMatChanger );
		f1.add( effectController, "manualdof" ).onChange( bokehMatChanger );
		f1.add( effectController, "vignetting" ).onChange( bokehMatChanger );

		f1.add( effectController, "depthblur" ).onChange( bokehMatChanger );

		f1.add( effectController, "threshold", 0, 1, 0.001 ).onChange( bokehMatChanger );
		f1.add( effectController, "gain", 0, 100, 0.001 ).onChange( bokehMatChanger );
		f1.add( effectController, "bias", 0,3, 0.001 ).onChange( bokehMatChanger );
		f1.add( effectController, "fringe", 0, 5, 0.001 ).onChange( bokehMatChanger );

		f1.add( effectController, "focalLength", 16, 80, 0.001 ).onChange( bokehMatChanger );

		f1.add( effectController, "noise" ).onChange( bokehMatChanger );

		f1.add( effectController, "dithering", 0, 0.001, 0.0001 ).onChange( bokehMatChanger );

		f1.add( effectController, "pentagon" ).onChange( bokehMatChanger );

		f1.add( shaderSettings, "rings", 1, 8).step(1).onChange( shaderUpdate );
		f1.add( shaderSettings, "samples", 1, 13).step(1).onChange( shaderUpdate );	

		var f1 = gui.addFolder('Bad TV');
		f1.add(badTVParams, 'show').onChange(onToggleShaders);
		f1.add(badTVParams, 'distortion', 0.1, 20).step(0.1).listen().name("Thick Distort").onChange(onShaderParamsChange);
		f1.add(badTVParams, 'distortion2', 0.1, 20).step(0.1).listen().name("Fine Distort").onChange(onShaderParamsChange);
		f1.add(badTVParams, 'speed', 0.0,1.0).step(0.01).listen().name("Distort Speed").onChange(onShaderParamsChange);
		f1.add(badTVParams, 'rollSpeed', 0.0,1.0).step(0.01).listen().name("Roll Speed").onChange(onShaderParamsChange);
		f1.open();

		var f2 = gui.addFolder('RGB Shift');
		f2.add(rgbParams, 'show').onChange(onToggleShaders);
		f2.add(rgbParams, 'amount', 0.0, 0.1).listen().onChange(onShaderParamsChange);
		f2.add(rgbParams, 'angle', 0.0, 2.0).listen().onChange(onShaderParamsChange);
		f2.open();

		var f4 = gui.addFolder('Static');
		f4.add(staticParams, 'show').onChange(onToggleShaders);
		f4.add(staticParams, 'amount', 0.0,1.0).step(0.01).listen().onChange(onShaderParamsChange);
		f4.add(staticParams, 'size', 1.0,100.0).step(1.0).onChange(onShaderParamsChange);
		f4.open();

		var f3 = gui.addFolder('Scanlines');
		f3.add(filmParams, 'show').onChange(onToggleShaders);
		f3.add(filmParams, 'count', 50, 1000).onChange(onShaderParamsChange);
		f3.add(filmParams, 'sIntensity', 0.0, 2.0).step(0.1).onChange(onShaderParamsChange);
		f3.add(filmParams, 'nIntensity', 0.0, 2.0).step(0.1).onChange(onShaderParamsChange);
		f3.add(filmParams, 'grayscale').onChange(onToggleShaders);
		f3.open();
	}

	gui.close();
}

function onShaderParamsChange() {
	//copy gui params into shader uniforms
	badTVPass.uniforms[ "distortion" ].value = badTVParams.distortion;
	badTVPass.uniforms[ "distortion2" ].value = badTVParams.distortion2;
	badTVPass.uniforms[ "speed" ].value = badTVParams.speed;
	badTVPass.uniforms[ "rollSpeed" ].value = badTVParams.rollSpeed;

	staticPass.uniforms[ "amount" ].value = staticParams.amount;
	staticPass.uniforms[ "size" ].value = staticParams.size;

	rgbPass.uniforms[ "angle" ].value = rgbParams.angle*Math.PI;
	rgbPass.uniforms[ "amount" ].value = rgbParams.amount;

	filmPass.uniforms[ "sCount" ].value = filmParams.count;
	filmPass.uniforms[ "sIntensity" ].value = filmParams.sIntensity;
	filmPass.uniforms[ "nIntensity" ].value = filmParams.nIntensity;
	filmPass.uniforms[ "grayscale" ].value = filmParams.grayscale;
}



function initPostprocessing() {
	console.log('INIT 0 ' + postprocessing.enabled );

	postprocessing.scene = new THREE.Scene();

	postprocessing.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2,  window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
	postprocessing.camera.position.z = camera.position.z;

	postprocessing.scene.add( postprocessing.camera );

	var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
	postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );
	postprocessing.rtTextureColor = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );


	console.log('INIT 1 ' + postprocessing.enabled );
	var bokeh_shader = THREE.BokehShader;

	postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone( bokeh_shader.uniforms );

	postprocessing.bokeh_uniforms[ "tColor" ].value = postprocessing.rtTextureColor.texture;
	postprocessing.bokeh_uniforms[ "tDepth" ].value = postprocessing.rtTextureDepth.texture;

	postprocessing.bokeh_uniforms[ "textureWidth" ].value = window.innerWidth;

	postprocessing.bokeh_uniforms[ "textureHeight" ].value = window.innerHeight;

	postprocessing.materialBokeh = new THREE.ShaderMaterial( {

		uniforms: postprocessing.bokeh_uniforms,
		vertexShader: bokeh_shader.vertexShader,
		fragmentShader: bokeh_shader.fragmentShader,
		defines: {
			RINGS: shaderSettings.rings,
			SAMPLES: shaderSettings.samples
		}

	} );

	console.log('INIT 3 ' + postprocessing.enabled );

	postprocessing.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( window.innerWidth, window.innerHeight ), postprocessing.materialBokeh );
	postprocessing.quad.position.z = - 500;
	postprocessing.scene.add( postprocessing.quad );

}

function renderBokeh( ) {
		function linearize(depth) {
				var zfar = camera.far;
				var znear = camera.near;
				return -zfar * znear / (depth * (zfar - znear) - zfar);
			}


			function smoothstep(near, far, depth) {
				var x = saturate( (depth - near) / (far - near));
				return x * x * (3- 2*x);
			}

			function saturate(x) {
				return Math.max(0, Math.min(1, x));
			}

		if ( postprocessing.enabled ) {

				if ( effectController.jsDepthCalculation ) {

					raycaster.setFromCamera( mouse, camera );

					var intersects = raycaster.intersectObjects( scene.children, true );

					if ( intersects.length > 0 ) {

						var targetDistance = intersects[ 0 ].distance;

						distance += (targetDistance - distance) * 0.03;

						var sdistance = smoothstep(camera.near, camera.far, distance);

						var ldistance = linearize(1 -  sdistance);

						 (Math.random() < 0.1) && console.log('moo', targetDistance, distance, ldistance);

						postprocessing.bokeh_uniforms[ 'focalDepth' ].value = ldistance;

						effectController['focalDepth'] = ldistance;

					}

				}

					renderer.clear();

					// Render scene into texture

					scene.overrideMaterial = null;
					renderer.render( scene, camera, postprocessing.rtTextureColor, true );

					// Render depth into texture

					scene.overrideMaterial = material_depth;
					renderer.render( scene, camera, postprocessing.rtTextureDepth, true );
					
					//console.log(postprocessing.rtTextureDepth);
					// Render bokeh composite

					renderer.render( postprocessing.scene, postprocessing.camera );

				} else {

					scene.overrideMaterial = null;

					renderer.clear();
					renderer.render( scene, camera );

				}

}

function bokehMatChanger( ) {
	for (var e in effectController) {
		if (e in postprocessing.bokeh_uniforms)
		postprocessing.bokeh_uniforms[ e ].value = effectController[ e ];
	}

	postprocessing.enabled = effectController.enabled;
	postprocessing.bokeh_uniforms[ 'znear' ].value = camera.near;
	postprocessing.bokeh_uniforms[ 'zfar' ].value = camera.far;
	camera.setFocalLength(effectController.focalLength);
};    

function shaderUpdate() {
	postprocessing.materialBokeh.defines.RINGS = shaderSettings.rings;
	postprocessing.materialBokeh.defines.SAMPLES = shaderSettings.samples;

	postprocessing.materialBokeh.needsUpdate = true;

}