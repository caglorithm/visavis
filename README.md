# visavis
This is a small personal project to learn JavaScript and THREE.js (my first time I'm writing JS, please be nice). Coming from Processing, I found THREE.js to be insanely fast for being executed in the Browser.

The 3D OBJ animated geo models shown here were downloaded using this little [tool](https://github.com/karimnaaji/vectiler).


### Manhattan 
Audioreactive animations using the system microphone. The volume is saved in a queue and waves propagate from the center of the scene outwards. In the first example `manhattan_big.obj` only the roofs are selected to move up and down according to the delayed volume. This example is rendered with `MeshPhongMaterial`, `drawWireframe = false`.

![demo](assets/3.gif)
![demo](assets/4.gif)

### Mt. Everest 
With several shaders implemented. Shaders and `audioHandler.js` are borrowed from [here](https://www.airtightinteractive.com/demos/js/badtvshader/) and [here](https://www.airtightinteractive.com/demos/js/uberviz/audioanalysis/). Generally, [airtightinteractive.com](https://www.airtightinteractive.com/2013/10/making-audio-reactive-visuals/) was a great resource for me to learn THREE.js. 

![demo](assets/1.gif)
![demo](assets/2.gif)
