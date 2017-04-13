var clock = new THREE.Clock();

//var events = new Events();

var container;

var camera, scene, renderer, stats;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

// use this control only witout orbit
var mouseMoveControl = false;
var enableOrientationControl = false;
var orientationControl;

// geometry
var cityMesh;
var cityGeometry;
var cityGroup;
var wireframeGeometry;
var normalMaterial;

var originalPositions; 

var originalWireframe;
var wireframeGeometry;

// for manhattan_big
//var center = new THREE.Vector3( -2.5, 1.5,  0);

// for manhattan_bigger:
//var center = new THREE.Vector3( -8, 5,  0);

// for mteverst
//var center = new THREE.Vector3( -1.1, 1.6,  0);

// for mteverst_big
//var center = new THREE.Vector3( -2.8, 3.6,  0);

var center = new THREE.Vector3( 0, 0,  0);


// custom variables
var rooflist = [];

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

var SHADERS = false;

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
	console.log("TESTESTSETSETSETSE");

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
	//scene.add( ambient );

	var directionalLight = new THREE.DirectionalLight( 0xA0A0A0 );
	directionalLight.position.set( 0, 0, 1 );
	//scene.add( directionalLight );

	// ----------- MODEL -----------

	// load model, manipulate, add to mesh, add to group, add to scene

	var loader = new THREE.OBJLoader( manager );

	cityGroup = new THREE.Object3D();
	cityGeometry = new THREE.Geometry();

	loader.load( 'obj/david_big.obj', function ( object ) {
		// doesn't work: shadows?
		//cityGroup.castsShadow = true;
  		//cityGroup.receiveShadow = true;	

  		// loop through meshes in the Group() "object"	
		object.traverse( function ( child ) {
			if ( child instanceof THREE.Mesh ) {
				// get Geometry from BufferGeometry
				cityGeometry = new THREE.Geometry().fromBufferGeometry( child.geometry );
				child.castShadow = true;			
				
				// loop through / edit initial geometry here

				initializeCity();

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
				console.log("Geometry");
				console.log(cityGeometry);
				cityMesh = new THREE.Mesh(cityGeometry, normalMaterial);

			    // wireframe 
			    var drawWireframe = true;
			    if ( drawWireframe ) {
				    wireframeGeometry = new THREE.EdgesGeometry( cityMesh.geometry ); // or WireframeGeometry
				    wireframeGeometry.center( cityMesh.position ); // this re-sets the mesh position
				    wireframeGeometry.translate(0, 0, 5);
				    var mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 0.5 } );
				    var wireframe = new THREE.LineSegments( wireframeGeometry, mat );
				    cityMesh.add( wireframe );
			    }
			    

			}

			

		} );

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

		var geometry = new THREE.Geometry();
		geometry.vertices.push(
			new THREE.Vector3( -5, -5, 0 ),
			new THREE.Vector3( -5, 5, 0 ),
			new THREE.Vector3( 5, 5, 0 ),
			new THREE.Vector3( 5, -5, 0 ),
			new THREE.Vector3( -5, -5, 0 ),
			new THREE.Vector3( 5, 5, 0 ),
			new THREE.Vector3( 5, 5, 5 )
		);

		var line = new THREE.Line( geometry, material );
		scene.add( line );

		
		cityGeometry.computeBoundingBox ();


		var geometry = new THREE.Geometry();
		geometry.vertices.push(
			new THREE.Vector3( cityGeometry.boundingBox.min.x, cityGeometry.boundingBox.min.y, 0 ),
			new THREE.Vector3( cityGeometry.boundingBox.min.x, cityGeometry.boundingBox.max.y, 0 ),
			new THREE.Vector3( cityGeometry.boundingBox.max.x, cityGeometry.boundingBox.max.y, 0 ),
			new THREE.Vector3( cityGeometry.boundingBox.max.x, cityGeometry.boundingBox.min.y, 0 )
			//new THREE.Vector3( cityGeometry.boundingBox.min.y, -5, 0 ),
			//new THREE.Box3 (cityGeometry.boundingBox.min, cityGeometry.boundingBox.max)
			//new THREE.Vector3( 5, 5, 0 )
		);

		var line = new THREE.Line( geometry, material );
		cityMesh.add( line );


		// DRAW BOUNDING BOX OF OBJECT
		//  This is where introtowebgl uses CubeGeometry
		var geometry = new THREE.BoxGeometry(
			cityGeometry.boundingBox.min.x- cityGeometry.boundingBox.max.x,
			cityGeometry.boundingBox.min.y- cityGeometry.boundingBox.max.y,
			cityGeometry.boundingBox.min.z- cityGeometry.boundingBox.max.z);

		var material = new THREE.MeshBasicMaterial({color:0x00ff20});



		
		var cube = new THREE.Mesh(geometry,material);
		console.log('CUBE');
		console.log( cityMesh.position.x, cityMesh.position.y, cityMesh.position.z );
		cube.position.set( cityGeometry.boundingBox.min.x, cityGeometry.boundingBox.min.y, cityGeometry.boundingBox.min.z );
		console.log(cube);
		
		scene.add(cube);


		}

		// ----------- CENTER and ROTATE GEOMETRY TO MESH CENTER -------------

		// FOT THE MAP DATA FROM VECTILER WE NEED TO ROTATE THE MODEL PROPERLY
		var ROTATE_VECTILER = false
		if (ROTATE_VECTILER) {
			cityMesh.rotation.x= -Math.PI/2;
		}

		// ----------- CENTER GEOMETRY TO MESH CENTER 

		cityGeometry.center( cityMesh.position ); // this re-sets the mesh position
		cityMesh.position.multiplyScalar( - 1 );

		// deep copy oriringal positions array
		originalPositions = cityGeometry.vertices.map(function (v) { return v.clone() });

		// --------- position camera --------
		camera.position.z = 17;
		camera.position.y = 10;		
		
		// add to group and render
		cityGroup.add(cityMesh);
		scene.add( cityGroup );	

		// --------- debug output
		console.log("cityMesh");
		console.log(cityMesh);
		console.log("Bounding box");
		console.log(cityGeometry.boundingBox);
		// default: add group
		
		// instead, we could also add the Mesh directly
		//scene.add(cityMesh);

		// if I add this object directly, it interacts with light... why?
		// because it's a MeshPhongMaterial and lights attribute is true, if set to false it crashes
		// chack if lights are on if you want to use this material!!!
		//console.log(new THREE.Color( "#7833aa" ));
		//object.children[0].material.emissive = new THREE.Color( "#7833aa" );
		//scene.add(object);

	}, onProgress, onError );

	// ----------- CALLBACKS -----------

	// add some event listeners

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	//document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	//document.addEventListener( 'touchmove', onDocumentTouchMove, false );	
	
	window.addEventListener( 'resize', onWindowResize, false );


	// ----------- FX -----------


	// ----------- CONTROLS -----------

	// Add OrbitControls so that we can pan around with the mouse.
	controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener( 'change', render );

	// for smartphone device rotation control
    window.addEventListener('deviceorientation', function(e) {
      var gammaRotation = e.gamma ? e.gamma * (Math.PI / 6000) : 0;
      //cityMesh.rotation.z = gammaRotation;
      //cityMesh.rotation.x= -Math.PI/4;
	});

	if ( enableOrientationControl == true) {
		console.log("Orientation control enabled.");
    	orientationControl = new THREE.DeviceOrientationControls( cityGroup );
    	//camera.lookAt ( new THREE.Vector3( 0, 0, 10 ) );

    }

    // ---------------- SHADERS ----------------
    if (SHADERS) {
	material_depth = new THREE.MeshDepthMaterial();
	//initPostprocessing();

	//renderer.autoClear = false;

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
	//matChanger();


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
		size2:2.0
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
		nIntensity: 0.4
	}
	rgbPass.uniforms[ "angle" ].value = rgbParams.angle*Math.PI;
	rgbPass.uniforms[ "amount" ].value = rgbParams.amount;
	staticPass.uniforms[ "amount" ].value = staticParams.amount;
	staticPass.uniforms[ "size" ].value = staticParams.size2;
	
	onToggleShaders();
	} // if (SHADERS)	 
	//onParamsChange();

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
	composer = new THREE.EffectComposer( renderer);
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
//

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


// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------


function render() {

	// ----------- TIME KEEPING -----------

	//var delta = clock.getDelta(),
	//time = clock.getElapsedTime() * 10;
	

	// ----------- ANIMATION -----------

	updateAudio();
	animateBuildings();

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


function distance(){

}

function animateBuildings(){

	//console.log(normLevel);

	time = clock.getElapsedTime() * 10;

	//volumeHistory.push(Math.exp(normLevel+1)/5);
	(Math.random() < 0.1) && console.log('t', time, 'volume', normLevel);
	//(Math.random() < 0.1) && console.log('camera', camera);

	volumeHistory.push(normLevel);
	volumeHistory.shift();

	maxDistance = 10; // fix this!
	
	//wireframeGeometry.position.z = (0, 0, normLevel);
	//wireframeGeometry.position = new THREE.Vector3(0, 0, normLevel*5);
	wireframeGeometry.rotation.x = normLevel;
	(Math.random() < 0.1) && console.log(wireframeGeometry);
	//console.log(new Array(10).fill(0));
	var roofDistanceToCenter;
	var normDistance;
		


	// ANIMATE ROOFS
	if (1 == 0) {
		for ( var i = 0, l = rooflist.length; i < l; i ++ ) {					
			//var thisroof = originalPositions[ rooflist[i] ];
			//var roofDistanceToCenter = Math.sqrt((center.x+thisroof.x)**2 + (center.y+thisroof.y)**2);
			//var normDistance = historyLength - Math.round( roofDistanceToCenter / maxDistance * historyLength );
			
			//if (i == 100) console.log(volumeHistory[normDistance]);
			//cityGeometry.vertices[ rooflist[i] ].z = thisroof.z + 10*normLevel;// volumeHistory[normDistance]; //+ 0.2 * Math.abs((Math.sin( time * (1 / 2) + thisroof.x + (note-41)/90*Math.PI + thisroof.y))) - 0.01;
			//cityGeometry.vertices[ rooflist[i] ].z = thisroof.z + 0.2 * Math.abs((Math.sin( time * (1 / 2) + thisroof.x + thisroof.y))) - 0.01;
			//cityGeometry.vertices[ rooflist[i] ].z = thisroof.z + 0.2 * Math.abs((Math.sin( time * sketchParams.cubeSpeed *   normLevel * 10 * (1 / 2) + thisroof.x + sketchParams.volSens * (note-41)/90*Math.PI * 0 + thisroof.y))) - 0.01;
			//if (volumeHistory[normDistance] > 100) 
			//cityGeometry.vertices[ rooflist[i] ].z = thisroof.z //+ volumeHistory[normDistance]; // * normLevel * Math.sin( time * (1 / 2))**2;
		}
	}
	// ANIAMTE EVERYTHING
	if (1 == 1) {
		for ( var i = 0, l = cityGeometry.vertices.length; i < l; i += 10 ) {
			if (Math.random() < 0.2) {
			// this line loses me 10 fps if the model is large
			var roofDistanceToCenter = Math.sqrt((center.x+originalPositions[ i ].x)**2 + (center.y+originalPositions[ i ].y)**2);

			var normDistance = historyLength - Math.round( roofDistanceToCenter / maxDistance * historyLength );
			//cityGeometry.vertices[ i ].z = originalPositions[ i ].z + 20*(normLevel-0.2) * 0.1*(1-roofDistanceToCenter);

			// as many fps (10?) as this one
			cityGeometry.vertices[ i ].z = originalPositions[ i ].z + volumeHistory[normDistance] * 20;
			}
		}
	}
	

	//normalMaterial.needsUpdate = true;
	cityGeometry.verticesNeedUpdate = true;
	wireframeGeometry.verticesNeedUpdate = true; // only required if geometry previously-rendered


	if (SHADERS) {
	// randomize RGB shit
	randomRGB = true
	if (randomRGB) {
		rgbParams.angle = Math.random()*2
		if (Math.random() < 0.5) { rgbParams.amount = normLevel/20; }
		else { rgbParams.amount = 0.01*(Math.random()+1)/10; }
		//rgbParams.amount = (Math.random()+1)*normLevel*0.1;
	}

	
	onParamsChange();
	}	
}

function initializeCity(){
	for ( var i = 0, l = cityGeometry.vertices.length; i < l; i ++ ) {
		//cityGeometry.vertices[ i ].z = 0.35 * Math.sin( i / 2 );
		if ( cityGeometry.vertices[ i ].z > 0.04 ) {
			rooflist.push(i);
		}
	}

	console.log("roofs");
	console.log(rooflist);
}









// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------
// -------------------------------------------------------





function onParamsChange() {
	//copy gui params into shader uniforms
	badTVPass.uniforms[ "distortion" ].value = badTVParams.distortion;
	badTVPass.uniforms[ "distortion2" ].value = badTVParams.distortion2;
	badTVPass.uniforms[ "speed" ].value = badTVParams.speed;
	badTVPass.uniforms[ "rollSpeed" ].value = badTVParams.rollSpeed;

	staticPass.uniforms[ "amount" ].value = staticParams.amount;
	staticPass.uniforms[ "size" ].value = staticParams.size2;

	rgbPass.uniforms[ "angle" ].value = rgbParams.angle*Math.PI;
	rgbPass.uniforms[ "amount" ].value = rgbParams.amount;

	filmPass.uniforms[ "sCount" ].value = filmParams.count;
	filmPass.uniforms[ "sIntensity" ].value = filmParams.sIntensity;
	filmPass.uniforms[ "nIntensity" ].value = filmParams.nIntensity;
}






function initializeGui(){
	sketchParams = {
		volSens: 1.0,
		cubeSpeed: 1.0
	};
	gui = new dat.GUI({ autoPlace: true });
	gui.close();

	if (SHADERS) {
	var customContainer = document.getElementById('my-gui-container');
	document.querySelector('#gui').appendChild(gui.domElement);
	gui.add(sketchParams, 'volSens', 0, 5).listen().step(0.1);
	gui.add(sketchParams, 'cubeSpeed', -2, 2).step(0.1);	

	var f1 = gui.addFolder('Bokeh');
	f1.add( effectController, "enabled" ).onChange( matChanger );
	f1.add( effectController, "jsDepthCalculation" ).onChange( matChanger );
	f1.add( effectController, "shaderFocus" ).onChange( matChanger );
	f1.add( effectController, "focalDepth", 0.0, 200.0 ).listen().onChange( matChanger );

	f1.add( effectController, "fstop", 0.1, 22, 0.001 ).onChange( matChanger );
	f1.add( effectController, "maxblur", 0.0, 5.0, 0.025 ).onChange( matChanger );

	f1.add( effectController, "showFocus" ).onChange( matChanger );
	f1.add( effectController, "manualdof" ).onChange( matChanger );
	f1.add( effectController, "vignetting" ).onChange( matChanger );

	f1.add( effectController, "depthblur" ).onChange( matChanger );

	f1.add( effectController, "threshold", 0, 1, 0.001 ).onChange( matChanger );
	f1.add( effectController, "gain", 0, 100, 0.001 ).onChange( matChanger );
	f1.add( effectController, "bias", 0,3, 0.001 ).onChange( matChanger );
	f1.add( effectController, "fringe", 0, 5, 0.001 ).onChange( matChanger );

	f1.add( effectController, "focalLength", 16, 80, 0.001 ).onChange( matChanger );

	f1.add( effectController, "noise" ).onChange( matChanger );

	f1.add( effectController, "dithering", 0, 0.001, 0.0001 ).onChange( matChanger );

	f1.add( effectController, "pentagon" ).onChange( matChanger );

	f1.add( shaderSettings, "rings", 1, 8).step(1).onChange( shaderUpdate );
	f1.add( shaderSettings, "samples", 1, 13).step(1).onChange( shaderUpdate );	

			var f1 = gui.addFolder('Bad TV');
			f1.add(badTVParams, 'show').onChange(onToggleShaders);
			f1.add(badTVParams, 'distortion', 0.1, 20).step(0.1).listen().name("Thick Distort").onChange(onParamsChange);
			f1.add(badTVParams, 'distortion2', 0.1, 20).step(0.1).listen().name("Fine Distort").onChange(onParamsChange);
			f1.add(badTVParams, 'speed', 0.0,1.0).step(0.01).listen().name("Distort Speed").onChange(onParamsChange);
			f1.add(badTVParams, 'rollSpeed', 0.0,1.0).step(0.01).listen().name("Roll Speed").onChange(onParamsChange);
			f1.open();

			var f2 = gui.addFolder('RGB Shift');
			f2.add(rgbParams, 'show').onChange(onToggleShaders);
			f2.add(rgbParams, 'amount', 0.0, 0.1).listen().onChange(onParamsChange);
			f2.add(rgbParams, 'angle', 0.0, 2.0).listen().onChange(onParamsChange);
			f2.open();

			var f4 = gui.addFolder('Static');
			f4.add(staticParams, 'show').onChange(onToggleShaders);
			f4.add(staticParams, 'amount', 0.0,1.0).step(0.01).listen().onChange(onParamsChange);
			f4.add(staticParams, 'size2', 1.0,100.0).step(1.0).onChange(onParamsChange);
			f4.open();

			var f3 = gui.addFolder('Scanlines');
			f3.add(filmParams, 'show').onChange(onToggleShaders);
			f3.add(filmParams, 'count', 50, 1000).onChange(onParamsChange);
			f3.add(filmParams, 'sIntensity', 0.0, 2.0).step(0.1).onChange(onParamsChange);
			f3.add(filmParams, 'nIntensity', 0.0, 2.0).step(0.1).onChange(onParamsChange);
			f3.open();
	}
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

function matChanger( ) {
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