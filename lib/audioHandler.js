var source;
var buffer;
var audioBuffer;
var dropArea;
var audioContext;
//var processor;
var analyser;
var freqByteData;
var levels;
var isPlayingAudio = false;
var normLevel =0;
var promptPanel;

var BOX_COUNT = 100;
var BEAM_ROT_SPEED = 0.003;
var TILT_SPEED = 0.1;
var TILT_AMOUNT = 0.5;
var BEAT_HOLD_TIME = 60; //num of frames to hold a beat
var BEAT_DECAY_RATE = 0.97;
var BEAT_MIN = 0.6; //level less than this is no beat

var beatCutOff = 20;
var beatTime = 30; //avoid auto beat at start

function updateAudio(){

	if (!isPlayingAudio)return;
	analyser.getByteFrequencyData(freqByteData);

	var length = freqByteData.length;

	//GET AVG LEVEL
	var sum = 0;
	for(var j = 0; j < length; ++j) {
		sum += freqByteData[j];
	}

	// Calculate the average frequency of the samples in the bin
	var aveLevel = sum / length;

	normLevel = (aveLevel / 256) * sketchParams.volSens; //256 is the highest a freq data can be

	//BEAT DETECTION
	if (normLevel  > beatCutOff && normLevel > BEAT_MIN){
		beatCutOff = normLevel *1.1;
		beatTime = 0;
	}else{
		if (beatTime < BEAT_HOLD_TIME){
			beatTime ++;
		}else{
			beatCutOff *= BEAT_DECAY_RATE;
		}
	}
}

function getMicInput() {

	//x-browser
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	if (navigator.getUserMedia ) {

		navigator.getUserMedia(

			{audio: true}, 

			function(stream) {
			//called after user has enabled mic access
			source = audioContext.createBufferSource();
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 1024;

			microphone = audioContext.createMediaStreamSource(stream);
			microphone.connect(analyser);
			startViz();

			//promptPanel.style.display = 'none';
			//showTag();

		},

			// errorCallback
			function(err) {
				alert("Error getting mic input: " + err);
			});
	}else{
		alert("Could not getUserMedia");
	}
}

//load sample MP3
function loadSampleAudio() {

	source = audioContext.createBufferSource();
	analyser = audioContext.createAnalyser();
	analyser.fftSize = 1024;

	// Connect audio processing graph
	source.connect(analyser);
	analyser.connect(audioContext.destination);
	loadAudioBuffer("mp3/computer_jazz.mp3");
}

function loadAudioBuffer(url) {
	// Load asynchronously
	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.responseType = "arraybuffer";

	request.onload = function() {
		

		audioContext.decodeAudioData(request.response, function(buffer) {
				audioBuffer = buffer;
				finishLoad();
		 }, function(e) {
			console.log(e);
		});

	};

	request.send();
}

function finishLoad() {
	source.buffer = audioBuffer;
	source.loop = true;
	source.start(0.0);
	startViz();
}

function onDocumentDragOver(evt) {
	introPanel.style.display = 'none';
	promptPanel.style.display = 'inline';
	evt.stopPropagation();
	evt.preventDefault();
	return false;
}

//load dropped MP3
function onDocumentDrop(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	if (source) source.disconnect();

	var droppedFiles = evt.dataTransfer.files;

	var reader = new FileReader();

	reader.onload = function(fileEvent) {
		var data = fileEvent.target.result;
		initAudio(data);
	};

	reader.readAsArrayBuffer(droppedFiles[0]);
	promptPanel.innerHTML = '<h1>loading...</h1>';

}

function initAudio(data) {
	source = audioContext.createBufferSource();

	if(audioContext.decodeAudioData) {
		audioContext.decodeAudioData(data, function(buffer) {
			source.buffer = buffer;
			createAudio();
		}, function(e) {
			console.log(e);
		});
	} else {
		source.buffer = audioContext.createBuffer(data, false );
		createAudio();
	}
}


function createAudio() {
	//processor = audioContext.createJavaScriptNode(2048 , 1 , 1 );

	analyser = audioContext.createAnalyser();
	analyser.smoothingTimeConstant = 0.1;

	source.connect(audioContext.destination);
	source.connect(analyser);

	//analyser.connect(processor);
	//processor.connect(audioContext.destination);

	source.start(0);

	source.loop = true;

	startViz();
}

function startViz(){
	freqByteData = new Uint8Array(analyser.frequencyBinCount);
	levels = [];
	isPlayingAudio = true;

	//promptPanel.style.display = 'none';
	//showTag();

}