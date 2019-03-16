//============================== Car Inits ======================
function init_testdrive() {
	console.log('=== INIT TESTDRIVE ===');
	var colliders = [
					  [ [-200,200], [-200,-16], [-175,-16], [-129,200] ], 
					  [ [ -20, -20 ], [ -10, 0 ], [ -40, 20 ], [ -80, 20 ], [ -120, 0 ], [ -90, -40 ] ],
					  [ [ -124, -143], [-175, -16], [-200,-16], [-200,-200] ],
					  [ [-124,-143], [-200,-200], [20,-200], [20,-145] ],
					  [ [20, -145], [20,-200], [200,-200], [178,-110] ],
					  [ [193,81], [178,-110], [200,-200], [200,81] ],
					  [ [193, 81], [200, 81], [200,149], [193,149] ],
					  [ [98,161],[-50,100],[-35,-3],[118,37], [143,112] ],
					  [ [27,-79],[136,-70],[53,-37] ]
					];
	var elevators = [
					  [1, [[-175, -39], [-33,19], [-45, 95], [-149,108]]],
					  [2, [[127,-68], [115,41], [24,14], [54,-43]]],
					  [4, [[127,-68], [115,41], [60,22], [76,-49]]],
					  [6, [[127,-68], [115,41], [83,32], [102,-62]]],
					];
	var cardef1 = [2.0, 'toycar', 'carroot', 'vrtulka1','tockoloL', 'tockoloR', 'nekola', 'nekola2', 'koloLP', 'koloPP', 'vrtulka1','carlight','carlight',  'idle.mp3','gears.mp3','tire.mp3','engine.mp3','cardoor.mp3','glass.mp3'];
	var cardef2 = [1, 'toycar2', 'carroot', 'vrtulka1','tockoloL', 'tockoloR', 'nekola', 'nekola2', 'koloLP', 'koloPP', 'vrtulka1','carlight','carlight',  'idle.mp3','gears.mp3','tire.mp3','engine.mp3','cardoor.mp3','glass.mp3'];
	var cardef3 = [1, 'toycar3', 'carroot', 'vrtulka1','tockoloL', 'tockoloR', 'nekola', 'nekola2', 'koloLP', 'koloPP', 'vrtulka1','carlight','carlight',  'idle.mp3','gears.mp3','tire.mp3','engine.mp3','cardoor.mp3','glass.mp3'];
	var cardefs = [cardef1, cardef2, cardef3];
	init_world(colliders,elevators, cardefs, 1000/25, true);
	cars[0].car_x = -54;
	cars[0].car_z = 146;
	cars[0].car_rot = -2;
	cars[1].car_x = -36;
	cars[1].car_z = 118;
	cars[1].car_rot = -1.9;
	cars[2].car_x = -119;
	cars[2].car_z = 19;
	cars[2].car_rot = -2;
	makebig('toycar');
	//---
	chasercam = document.getElementById('carworld__chasercam');
	//---
	audio_welcome = new Audio('welcome.wav');
	audio_honk = new Audio('honk.mp3');
	console.log('=== TESTDRIVE INITALIZED ===');
}

$('document').ready(setTimeout(
	init_testdrive,2000));

window.addEventListener( "keydown", readkeydown, true )
window.addEventListener( "keyup", readkeyup, true )

function readkeydown(e){
    e = e || window.event;
	blockKeys(e);
	car_keyboard(e.keyCode,true,0,'38','40','37','39','49') //arrowkeys + 1
	car_keyboard(e.keyCode,true,1,'87','83','65','68','50') //AWSD + 2
	car_keyboard(e.keyCode,true,2,'73','75','74','76','51') //IJKL + 3
    if (e.keyCode == 69) { //e
		audio_welcome.play();
		makebig('toycar2');
	}
	else if (e.keyCode == 79) { //o
		console.log('car pos: '+cars[0].car_x+','+cars[0].car_z);
	}
	else if (e.keyCode == 85) { //u
		cars[0].car_do_collide = !cars[0].car_do_collide;
		console.log(cars[0].car_name+' collisions: '+cars[0].car_do_collide);
	}
	else if (e.keyCode == 81) { //q
		audio_honk.play();
		makesmall('toycar2');
	}
};

function readkeyup(e){
	e = e || window.event;
	blockKeys(e);
	car_keyboard(e.keyCode,false,0,'38','40','37','39','49') //arrowkeys + 1
	car_keyboard(e.keyCode,false,1,'87','83','65','68','50') //AWSD + 2
	car_keyboard(e.keyCode,false,2,'73','75','74','76','51') //IJKL + 3
};

function blockKeys(e) {
	if(e.keyCode > 64 && e.keyCode < 91) {
		e.preventDefault();
	}
}

function car_scene_update() {
	var meanx = 0;
	var meanz = 0;
	var maxdist = 0;
	var activec = 0;
	for(var i=0; i<cars.length; ++i) {
		if(cars[i].car_engine_on) {
			activec+=1;
			meanx += cars[i].car_x;
			meanz += cars[i].car_z;
			for(var j=0; j<cars.length; ++j) {
				if(i!=j && cars[j].car_engine_on) {
					maxdist = Math.max(maxdist, (Math.pow(cars[i].car_x-cars[j].car_x,2)+Math.pow(cars[i].car_z-cars[j].car_z,2)));
				}
			}
		}
	}
	if(activec==0) {
		meanx = cars[0].car_x;
		meanz = cars[0].car_z;
		maxdist = 0;
		activec = 1;
	}
	//console.log('max: ' + maxdist);
	meanx /= activec;
	meanz /= activec;
	var bonus = maxdist/250;
	bonus = Math.min(200 ,bonus);
	chasercam.setAttribute('position', meanx + ' '+ (55+bonus*0.5) +' ' + (meanz+150+bonus));
}

function makesmall(car) {
	document.getElementById(car+'__texbump').setAttribute('url', '"bump.jpg"');
	document.getElementById(car+'__texwhl').setAttribute('url', '"whl.jpg"');
	document.getElementById(car+'__texcarfront').setAttribute('url', '"carfront.jpg"');
	document.getElementById(car+'__texdoors').setAttribute('url', '"doors.jpg"');
	document.getElementById(car+'__texcarroof').setAttribute('url', '"carroof.jpg"');
	document.getElementById(car+'__texinterior').setAttribute('url', '"interior.jpg"');
	document.getElementById(car+'__carroot').setAttribute('scale', '1 1 1');
};
		
function makebig(car) {
	document.getElementById(car+'__texbump').setAttribute('url', '"2bump.jpg"');
	document.getElementById(car+'__texwhl').setAttribute('url', '"2whl.jpg"');
	document.getElementById(car+'__texcarfront').setAttribute('url', '"2carfront.jpg"');
	document.getElementById(car+'__texdoors').setAttribute('url', '"2doors.jpg"');
	document.getElementById(car+'__texcarroof').setAttribute('url', '"2carroof.jpg"');
	document.getElementById(car+'__texinterior').setAttribute('url', '"2interior.jpg"');
	document.getElementById(car+'__carroot').setAttribute('scale', '2 2 2');
};
