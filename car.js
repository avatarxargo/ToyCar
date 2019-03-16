//X3D car driver class by David Hrusa
//2017
function Cardriver(colliders, elevators, carscale, namespace, name_root, name_switch, name_wheell, name_wheelr, name_tiltx, name_tiltz, name_turnl, name_turnr, name_speed, name_light1, name_light2, audio_idle, audio_running, audio_brake, audio_speed, audio_step, audio_crash) {
		//================== Init car variables =========================
		//--- X3D Model Parts
		this.car_name = namespace; //namespace of the included car
		this.car_name_root = name_root; //root of the car to move
		this.car_name_switch = name_switch; //model of the onoff switch to start the engine
		this.car_name_wheell = name_wheell; //wheels on the left
		this.car_name_wheelr = name_wheelr; //wheels on the right
		this.car_name_tiltx = name_tiltx; //Transform to tilt on x
		this.car_name_tiltz = name_tiltz; //Transform to tilt on z
		this.car_name_turnl = name_turnl; //Transform to turn when steering L
		this.car_name_turnr = name_turnr; //Transform to turn when steering R
		this.car_name_speed = name_speed; //Spins with car speed *0.25
		this.car_name_light1 = name_light1; //Light element 1 with on attribute
		this.car_name_light2 = name_light2; //Light element 2 with on attribute
		//--- Audio Files and Settings
		this.car_audio_idle = new Audio(audio_idle); //Looped sound when car is idle
		this.car_audio_idle.loop = true;
		if(!isNaN(this.car_audio_idle.duration))
		this.car_audio_idle.currentTime = Math.random()*this.car_audio_idle.duration;
		this.car_audio_running = new Audio(audio_running); //Looped sound when car is at full throtle
		this.car_audio_running.loop = true;
		if(!isNaN(this.car_audio_running.duration))
		this.car_audio_running.currentTime = Math.random()*this.car_audio_running.duration;
		this.car_audio_brake = new Audio(audio_brake); //One time sound when car is slowing down
		this.car_audio_speed = new Audio(audio_speed); //One time sound when car is speeding up
		this.car_audio_step = new Audio(audio_step); //One time sound when car changes elevation
		this.car_audio_crash = new Audio(audio_crash); //One time sound when car hits an object
		this.car_audio_spdlimit = 3*carscale; //How quickly the car must be going to trigger effects such as breaking sound.
		//--- Collision Parameters
		this.car_bounds = 200;
		this.car_do_collide = true;
		this.car_collision_id = cars.length; //ID in the list of cars in the scene
		cars[this.car_collision_id] = this;
		this.car_polygons = colliders; //list of 2D Polygons to test collision against
		this.car_elevators = elevators; //list of 2D Polygons to test collision against
		this.car_collisionsize = 5*carscale; //Added size of the car for collision testing in each direction
		this.car_carcollisionsize = 50*carscale; //Added size of the car for collision testing in each direction
		this.car_max_elevation_step = 4; //Maximum height the car can go up by without crashing
		//--- Current Instructions (USE THESE TO ISSUE COMMANDS TO THE VEHICLE)
		this.car_engine = 0; //direction of engine powering -1, 0, 1
		this.car_trndir = 0; //direction of wheel turning -1, 0, 1
		this.car_light = false; //is the light element set to on?
		//--- Current State Variables
		this.car_engine_on = false; //Is the engine running?
		this.car_x = 0; //current car x
		this.car_z = 0; //current car z
		this.car_y = 0; //current car y
		this.car_rot = 0; //current car overall rotation
		this.car_spd = 0; //current car speed
		this.car_wheelrot = 0; //rotation of wheels with movement
		this.car_wheeldir = 0; //current turning of wheels in terms of direction
		this.car_tiltx = 0; //current cabin tilt to sides
		this.car_tiltz = 0; //current cabin tilt to front and back
		this.car_tiltvelx = 0; //current cabin tilt to sides speed
		this.car_tiltvelz = 0; //current cabin tilt to front and back speed
		this.car_engine_last = 0; //direction of engine powering on last frame
		this.car_trndir_last = 0; //direction of wheel turning on last frame
		//--- General Parameters and Constrains
		this.car_scale = carscale;
		this.car_accel = (0.1*carscale);  //how quickly the car speeds up
		this.car_decel = 0.90; //percentage of speed reduced when not speeding up
		this.car_bumploss = 0.65; //how much velocity is lost when colliding with an obstacle.
		this.car_maxspd = 5*carscale; //maximal movement speed
		this.car_trnspd = 0.1; //how quickly the wheels turn
		this.car_maxtrnbodyspd = 0.10; //maximal speed of turning the whole car in high velocity
		this.car_detrnspd = 0.07;  //how quickly the wheels return to 0
		this.car_wheeldirmax = 0.7; //maximal turn of wheels
		this.car_tiltspdratio = 0.17; //how much speed tilts the car (speed is normalized speed/maxspeed)
		this.car_tiltturnratio = 0.1; //how much turn tilts the car (directly depends on turning)
		this.car_tiltveldecay = 0.90; //multipmlies velocity on each frame to slowly decay
		this.car_tiltpull = 0.1; //how much speed translates to tilt
		this.car_tiltmax = 0.15; //maximal tilt
		this.car_lastele = get_elevation([this.car_x,this.car_z],this.car_collisionsize,this.car_elevators); //last elevation of this car
		this.car_gravity = 0.3;//How fast the car drops from height;
		this.car_fallspd = 0; //How quickly the car is falling.
		this.car_y = this.car_lastele; //Car's current height
		//--- Add interactive elements
		var toggleEngineFun = function() {
			var car_id = this.getAttribute('car_id');
			console.log('car' + car_id);
			cars[car_id].car_engine_on = !cars[car_id].car_engine_on;
			cars[car_id].car_tiltz -= cars[car_id].car_tiltmax/2;
		};
		document.getElementById(this.car_name+'__'+this.car_name_switch).setAttribute('car_id', this.car_collision_id);
		document.getElementById(this.car_name+'__'+this.car_name_switch).onclick = toggleEngineFun;
		//---
		console.log(this.car_collision_id+' CONSTRUCTOR: '+this.car_name);
	
	this.update_car = function(doc){
		//speed
		var storespd = this.car_spd;
		if(!this.car_engine_on) {
			this.car_engine=0;
		}
		if (this.car_engine==0) {
			if(this.car_engine_last!=0 && this.car_spd > this.car_audio_spdlimit || this.car_spd < -this.car_audio_spdlimit) {
				monosound(this.car_audio_brake);
			}
			this.car_spd *= this.car_decel;
			if(this.car_spd<0.0001 && this.car_spd>-0.0001) {
				this.car_spd = 0;
			}
		} else {
			if(this.car_engine_last==0) {
				this.car_audio_speed = this.car_audio_speed.cloneNode();
				this.car_audio_speed.play();
			}
			this.car_spd += this.car_engine*this.car_accel;
			this.car_spd = Math.max(Math.min(this.car_spd,this.car_maxspd),-this.car_maxspd);
		}
		this.car_audio_running.volume = Math.max(Math.min((Math.sign(this.car_spd)*this.car_spd/this.car_maxspd),1),0);
		this.car_audio_idle.volume = Math.max(Math.min(0.5*(1-(Math.sign(this.car_spd)*this.car_spd/this.car_maxspd)),1),0);
		
		//movement audio
		if(!this.car_engine_on) {
			this.car_audio_idle.pause();
			this.car_audio_running.pause();
		} else {
			if(this.car_audio_idle.paused) {
				this.car_audio_idle.play();
			}
			if(this.car_audio_running.paused) {
				this.car_audio_running.play();
			}
		}
		
		//spinning wheels
		this.car_wheelrot += this.car_spd*(1/this.car_scale);
		while(this.car_wheelrot<-Math.PI*8) {
			this.car_wheelrot += Math.PI*8;
		}
		while(this.car_wheelrot>Math.PI*8) {
			this.car_wheelrot -= Math.PI*8;
		}
		//Turning factor
		//turning wheel direction
		if (this.car_trndir==0) {
			this.car_wheeldir -= Math.sign(this.car_wheeldir)*this.car_detrnspd;
			if(this.car_wheeldir<this.car_detrnspd*0.5 && this.car_wheeldir>-this.car_detrnspd*0.5) {
				this.car_wheeldir = 0;
			}
		} else {
			this.car_wheeldir += this.car_trndir*this.car_trnspd;
			if(this.car_wheeldir>this.car_wheeldirmax) {
				this.car_wheeldir = this.car_wheeldirmax;
			}
			if(this.car_wheeldir<-this.car_wheeldirmax) {
				this.car_wheeldir = -this.car_wheeldirmax;
			}
		}
		var deltarot = Math.max(Math.min(this.car_wheeldir*(this.car_spd/this.car_maxspd),this.car_maxtrnbodyspd),-this.car_maxtrnbodyspd);
		this.car_rot -= deltarot;
		//momentum
		this.car_z += this.car_spd*Math.cos(this.car_rot);
		this.car_x += this.car_spd*Math.sin(this.car_rot);
		//elevation
		var elevation = get_elevation([this.car_x,this.car_z],this.car_collisionsize,this.car_elevators);
		var elecol = false;
		if(this.car_lastele!=elevation) {
			var eledelta = elevation-this.car_lastele;
			if(elevation-this.car_y<this.car_max_elevation_step) {
				this.car_tiltz -= Math.sign(eledelta)*Math.sign(this.car_spd)*this.car_tiltmax;
				this.car_tiltx += (0.5-Math.random())*this.car_tiltmax;
				this.car_audio_step = this.car_audio_step.cloneNode();
				this.car_audio_step.play();
			} else {
				elecol = true;
				elevation = this.car_lastele;
			}
		}
		if(elevation<this.car_y) {
			this.car_fallspd += this.car_gravity;
			this.car_y -= this.car_fallspd;
		}
		if(elevation>=this.car_y) {
			this.car_y = elevation;
			this.car_fallspd = 0;
		}
		var flying = this.car_y>elevation;
		if(flying) {
			//console.log('flying');
			this.car_rot += deltarot;
			this.car_spd = storespd;
		}
		//collider
		var polycoli = collide_polygons([this.car_x, this.car_z], this.car_collisionsize, this.car_polygons);
		if ( this.car_do_collide && (elecol || collide_car(this.car_collision_id) || polycoli || 
		this.car_x > this.car_bounds-this.car_collisionsize || this.car_x < -this.car_bounds+this.car_collisionsize || this.car_z > this.car_bounds-this.car_collisionsize || this.car_z < -this.car_bounds+this.car_collisionsize ))
		{
			//jump on bounce
			this.car_z -= this.car_spd*Math.cos(this.car_rot);
			this.car_x -= this.car_spd*Math.sin(this.car_rot);
			this.car_spd = -this.car_spd*this.car_bumploss;
			monosound(this.car_audio_crash);
			//recover options
			if(polycoli) {
				for(var recover_angle=0; recover_angle<=0.5; recover_angle+=0.1) {
					var candidate = [this.car_x-this.car_spd*Math.sin(this.car_rot+recover_angle), this.car_z-this.car_spd*Math.cos(this.car_rot+recover_angle)];
					var candidate2 = [this.car_x-this.car_spd*Math.sin(this.car_rot-recover_angle), this.car_z-this.car_spd*Math.cos(this.car_rot-recover_angle)];
					if (!(elecol || collide_car(this.car_collision_id) || collide_polygons(candidate, this.car_collisionsize, this.car_polygons) || 
					candidate[0] > this.car_bounds-this.car_collisionsize || candidate[0] < -this.car_bounds+this.car_collisionsize || candidate[1] > this.car_bounds-this.car_collisionsize || candidate[1] < -this.car_bounds+this.car_collisionsize ))
					{
						//console.log(recover_angle);
						this.car_x = candidate[0];
						this.car_z = candidate[1];
						this.car_spd = -this.car_spd;
						this.car_rot += recover_angle;
						this.car_tiltx = -this.car_tiltmax*Math.sign(this.car_spd);
						break;
					} else if (!(elecol || collide_car(this.car_collision_id) || collide_polygons(candidate2, this.car_collisionsize, this.car_polygons) || 
					candidate2[0] > this.car_bounds-this.car_collisionsize || candidate2[0] < -this.car_bounds+this.car_collisionsize || candidate2[1] > this.car_bounds-this.car_collisionsize || candidate2[1] < -this.car_bounds+this.car_collisionsize ))
					{
						//console.log(-recover_angle);
						this.car_x = candidate2[0];
						this.car_z = candidate2[1];
						this.car_spd = -this.car_spd;
						this.car_rot -= recover_angle;
						this.car_tiltx = this.car_tiltmax*Math.sign(this.car_spd);
						break;
					}
				}
			}
			/*	else {
				recover_angle = -recover_angle;
				candidate = [this.car_x-this.car_spd*Math.sin(this.car_rot+recover_angle), this.car_z-this.car_spd*Math.cos(this.car_rot+recover_angle)];
				console.log(recover_angle);
				if (!(elecol || collide_car(this.car_collision_id) || collide_polygons(candidate, this.car_collisionsize, this.car_polygons) || 
					candidate[0] > this.car_bounds-this.car_collisionsize || candidate[0] < -this.car_bounds+this.car_collisionsize || candidate[1] > this.car_bounds-this.car_collisionsize || candidate[1] < -this.car_bounds+this.car_collisionsize ))
					{
						this.car_x = candidate[0];
						this.car_z = candidate[1];
						this.car_spd = -this.car_spd;
						this.car_rot += recover_angle;
					}
			}*/
		}
		//tilt
		this.car_tiltvelz -= this.car_tiltpull*this.car_tiltz;
		this.car_tiltvelz *= this.car_tiltveldecay;
		this.car_tiltz += this.car_tiltvelz + this.car_spd/this.car_maxspd*(-this.car_tiltspdratio);
		this.car_tiltz = Math.max( Math.min(this.car_tiltz,this.car_tiltmax),-this.car_tiltmax)
		this.car_tiltvelx -= this.car_tiltpull*this.car_tiltx;
		this.car_tiltvelx *= this.car_tiltveldecay;
		this.car_tiltx += this.car_tiltvelx + deltarot*(-this.car_tiltturnratio);
		this.car_tiltx = Math.max( Math.min(this.car_tiltx,this.car_tiltmax),-this.car_tiltmax)
		//update model
		document.getElementById(this.car_name+'__'+this.car_name_root).setAttribute('rotation', '0 1 0 '+this.car_rot);
		document.getElementById(this.car_name+'__'+this.car_name_root).setAttribute('translation', this.car_x+' '+this.car_y+' '+this.car_z);
		document.getElementById(this.car_name+'__'+this.car_name_wheelr).setAttribute('rotation', '0 1 0 '+(-this.car_wheelrot));
		document.getElementById(this.car_name+'__'+this.car_name_wheell).setAttribute('rotation', '0 1 0 '+this.car_wheelrot);
		document.getElementById(this.car_name+'__'+this.car_name_tiltz).setAttribute('rotation', '1 0 0 '+this.car_tiltz);
		document.getElementById(this.car_name+'__'+this.car_name_tiltx).setAttribute('rotation', '0 0 1 '+this.car_tiltx);
		document.getElementById(this.car_name+'__'+this.car_name_turnl).setAttribute('rotation', '0 0 1 '+this.car_wheeldir);
		document.getElementById(this.car_name+'__'+this.car_name_turnr).setAttribute('rotation', '0 0 1 '+this.car_wheeldir);
		document.getElementById(this.car_name+'__'+this.car_name_speed).setAttribute('rotation', '0 1 0 '+0.25*this.car_wheelrot);
		document.getElementById(this.car_name+'__'+this.car_name_light2).setAttribute('on', this.car_light);
		document.getElementById(this.car_name+'__'+this.car_name_light1).setAttribute('on', this.car_light);
		//last variables
		this.car_engine_last = this.car_engine;
		this.car_trndir_last = this.car_trndir;
		this.car_lastele = elevation;
	}
}

//============================== Car Functions ======================

/*Generalized init for the controlers and world definitions
	colliders - list of item[ [x,z],[x,z],[x,z]... ] CW polygons
	elevators - list of item[ height, [[x,z],[x,z],[x,z]...] ] CW polygons
	car_defs - list of arguments for creating new Cardriver() without the first two polygons
	ups - updates per second for the car update functions
*/
function init_world(colliders, elevators, car_defs, ups, render_poly=false) {
	//Create Scene
	//CW definition of polygons
	if(render_poly) {
		for(var i=0; i<colliders.length; ++i) {
			poly2mesh('carworld__carworld',colliders[i],3,'0.7 0.7 0.8');
		}
		//elevations
		for(var i=0; i<elevators.length; ++i) {
			poly2mesh('carworld__carworld',elevators[i][1],elevators[i][0],'0.3 0.3 0.5');
		}
	}
	cars = [];
	for(var i=0; i<car_defs.length; ++i) {
		create_car(colliders,elevators,car_defs[i]);
	} 
	console.log("CARS: "+cars);
	carIntervalId = setInterval(update_all_cars, ups);
}

//Only takes a single call to update all cars
function update_all_cars() {
	for(var i=0; i<cars.length; ++i) {
		cars[i].update_car();
	}	
	//implementing scene js has to provide this function for their purposes
	//this reduces periodic trigger overload
	car_scene_update();
}

//Reads key e, boolean isdown, updates car under car_id based on directional keys.
function car_keyboard(e,isdown,car_id,fkey,bkey,lkey,rkey,lightkey) {
	if(isdown) {
		if (e == fkey) {
			// up arrow
			cars[car_id].car_engine = 1;
		}
		else if (e == bkey) {
			// down arrow
			cars[car_id].car_engine = -1;
		}
		else if (e == lkey) {
		   // left arrow
		   cars[car_id].car_trndir = -1;
		}
		else if (e == rkey) {
		   // right arrow
		   cars[car_id].car_trndir = 1;
		}
		else if (e == lightkey) {
		   // right arrow
		   cars[car_id].car_light = !cars[car_id].car_light;
		}
	} else {
		if (e == fkey) {
			// up arrow
			cars[car_id].car_engine = 0;
		}
		else if (e == bkey) {
			// down arrow
			cars[car_id].car_engine = 0;
		}
		else if (e == lkey) {
		   // left arrow
		   cars[car_id].car_trndir = 0;
		}
		else if (e == rkey) {
		   // right arrow
		   cars[car_id].car_trndir = 0;
		}
	}
}

//Checks for collisions with other cars. Pushes them back if hit
function collide_car(my_id) {
	var myx = cars[my_id].car_x;
	var myz = cars[my_id].car_z;
	for (var i = 0; i < cars.length; i++) {
		if(i==my_id)
			continue;
		var tstx = cars[i].car_x;
		var tstz = cars[i].car_z;
		var dst2 = (myx-tstx)*(myx-tstx)+(myz-tstz)*(myz-tstz);
		if(dst2<cars[my_id].car_carcollisionsize+cars[i].car_carcollisionsize) {
			var mydir = cars[my_id].car_rot;
			var tstdir = cars[i].car_rot;
			cars[i].car_spd+=(Math.cos(mydir-tstdir)*cars[my_id].car_spd)
			cars[i].car_tiltx-=(Math.sin(mydir-tstdir)*cars[i].car_tiltmax*2)
			cars[i].car_wheeldir-=(Math.sin(mydir-tstdir)*cars[i].car_wheeldirmax)
			return true;
		}
	}
	return false;
}

//Plays the provided sound canceling the previous playback
function monosound(sound) {
	sound.pause();
	sound.currentTime = 0;
	sound.play();
}

//Inserts X3D indexed face set representing the CW polygons into the parent node 
function poly2mesh(parent_node, polygon, height, color) {
	var carworld = document.getElementById(parent_node);
	var shape = document.createElement('Shape');
	var appear = document.createElement('Appearance');
	var mater = document.createElement('Material');
	var idfs = document.createElement('IndexedFaceSet');
	var coord = document.createElement('Coordinate');
	mater.setAttribute('diffuseColor',color)
	verteces = [];
	coords = [];
	for (var i = 0; i < polygon.length; i++) {
		verteces[i*3] = polygon[i][0];
		verteces[i*3+1] = height;
		verteces[i*3+2] = polygon[i][1];
		if(i<polygon.length-2) {
			coords[i*3] = 0;
			coords[i*3+1] = i+2;
			coords[i*3+2] = i+1;
		}
	}
	//console.log(verteces);
	//console.log(coords);
	idfs.setAttribute('coordIndex', coords); //'0 1 2 3 2 1'
	coord.setAttribute('point', verteces); //'-20 0 -20 -40 0 20 -80 0 20 -80 0 -20'
		
	appear.appendChild(mater);
	idfs.appendChild(coord);
	shape.appendChild(idfs);
	shape.appendChild(appear);
	carworld.appendChild(shape);
}

//Returns the highest elevation at the given position out of the elevation list item[height [polygon]]
function get_elevation(pos, boundingbox, elevation_list) {
	var value = -Infinity;
	for (var i = 0; i < elevation_list.length ; i++) {
			if (this.collide_poly(pos, boundingbox, elevation_list[i][1])) {
				value = Math.max(value,elevation_list[i][0]);
			}
		}
	if (value == -Infinity) {
		value = 0;
	}
	return value;
}
	
//Collides a car center point with polygons provided
function collide_polygons(pos, boundingbox, polygon_list) {
		for (var i = 0; i < polygon_list.length ; i++) {
			if (this.collide_poly(pos, boundingbox, polygon_list[i])) {
				return true;
			}
		}
		return false;
	}
	
//Collides a car center point with polygon provided
function collide_poly(pos, boundingbox, polygon) {
		for(var i = 0; i < 36; ++i) {
			if(inside([pos[0]+boundingbox*Math.cos((10*i)/180*Math.PI), pos[1]+boundingbox*Math.sin((10*i)/180*Math.PI) ], polygon) ) {
				return true;
			}
		}
		return false;
	}
	
//Checks if points is inside a polygon
function inside(point, vs) {
		// ray-casting algorithm based on
		// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

		var x = point[0], y = point[1];

		var inside = false;
		for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
			var xi = vs[i][0], yi = vs[i][1];
			var xj = vs[j][0], yj = vs[j][1];

			var intersect = ((yi > y) != (yj > y))
				&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}

		return inside;
	}
		
//Creates a car from definition arrays
function create_car(col,ele,args) {
	new Cardriver(col,ele,args[0],args[1],args[2],args[3],args[4],args[5],args[6],args[7],args[8],args[9],args[10],args[11],args[12],args[13],args[14],args[15],args[16],args[17],args[18]);
}
