/* Models */
var CarModel = Backbone.Model.extend({});
var FlagModel = Backbone.Model.extend({});

/* Collections */
var CarCollection = Backbone.Collection.extend({
	model : CarModel
});
var FlagCollection = Backbone.Collection.extend({
	model : FlagModel,
	url : "data/flag.json"
});

/* Views */
var CarView = Backbone.View.extend({
	className: "car",
	template : _.template($('#car_template').html()),
	createCar : function() {
		// create Car Element
		var carModel = this.model;
		var element = this.getElement(carModel);
		this.driveCar();
		return element;
	},
	getElement : function(carModel) {
		// append in the current template
		var carElement = this.template(carModel.toJSON());
		$(this.el).append(carElement);
		return this;
	},
	driveCar: function(){
		// increase car's position by its speed value
		var carSpeed = this.model.get("speed");
		var _this = this;
		setInterval(function(){
			var currentLeft = $(_this.el).position().left;
			var newLeft = currentLeft + carSpeed;
			$(_this.el).css('left', newLeft + 'px');
			
			if (_this.model.get("id") == "6"){
				$("#road").css('left', newLeft + 'px');
			}
			
		}, 1000);
	}
});
var CarsView = Backbone.View.extend({
	el : '#cars',
	initialize : function() {
		// populate models and create views with them
		var carsModels = this.collection.models;
		this.createCars(carsModels);
	},
	createCars : function(carsModels) {
		// loop through flags data and create their animations
		var _this = this;
		_.each(carsModels, function(carModel) {
			var carView = new CarView({
				model : carModel
			});
			$(_this.el).append(carView.createCar().el);
		});
	}
});
var FlagsView = Backbone.View.extend({
	el : '#flags',
	initialize : function() {
		// populate models and create views with them
		var flagsModels = this.collection.models;
		this.createFlags(flagsModels);
	},
	createFlags : function(flagsModels) {
		// loop through flags data and create their animations
		var _this = this;
		_.each(flagsModels, function(flagModel) {
			var flagView = new FlagView({
				model : flagModel
			});
			$(_this.el).append(flagView.createFlag().el);
		});
	}
});
var FlagView = Backbone.View.extend({
	tagName : "li",
	className : "flag",
	template : _.template($('#flag_template').html()),
	events : {
		"click" : "toggleFlag"	//select/unselect flag for racing
	},
	createFlag : function() {
		var flagModel = this.model;
		this.initRequestAnimFrame();
		// animation settings
		var country_id = flagModel.get("id");
		var img_src = "images/flag/" + country_id + ".gif";
		var angularSpeed = 2;
		var lastTime = 0;
		var renderer = this.getRenderer(100, 100);
		var camera = this.getCamera(35, 1, 100, 1000, 700);
		var material = this.getMaterial(img_src);
		var sphere = this.getSphere(material);
		// add scene
		var scene = new THREE.Scene();
		scene.add(sphere);
		// add subtle ambient lighting
		var ambientLight = this.getAmbientLight(0x555555);
		scene.add(ambientLight);
		// add directional light source
		var directionalLight = this.getDirectionalLight(0xffffff, 1, 1, 1);
		scene.add(directionalLight);
		// add wrapper object that contains three.js objects
		var three = {
			renderer : renderer,
			camera : camera,
			scene : scene,
			sphere : sphere
		};
		// add texture
		this.createTexture(lastTime, angularSpeed, three, img_src);
		// return appended element back to FlagsView
		var element = this.getElement(renderer, flagModel);
		return element;
	},
	getRenderer : function(width, height) {
		var renderer = new THREE.WebGLRenderer();
		renderer.setSize(width, height);
		return renderer;
	},
	getElement : function(renderer, flagModel) {
		// append element in the current template
		var flagElement = this.template(flagModel.toJSON());
		$(this.el).append(flagElement + "<br />");
		$(this.el).append(renderer.domElement);
		return this;
	},
	getCamera : function(view_angle, aspect, near, far, z_position) {
		var camera = new THREE.PerspectiveCamera(view_angle, aspect, near, far);
		camera.position.z = z_position;
		return camera;
	},
	getSphere : function(material) {
		var sphere = new THREE.Mesh(this.getSphereGeometry(160, 200, 200), material);
		sphere.overdraw = true;
		return sphere;
	},
	getSphereGeometry : function(radius, segments, rings) {
		var sphereGeometry = new THREE.SphereGeometry(radius, segments, rings);
		return sphereGeometry;
	},
	getMaterial : function(img_src) {
		var material = new THREE.MeshLambertMaterial({
			map : THREE.ImageUtils.loadTexture(img_src)
		});
		return material;
	},
	getAmbientLight : function(color) {
		var ambientLight = new THREE.AmbientLight(color);
		return ambientLight;
	},
	getDirectionalLight : function(color, x_position, y_position, z_position) {
		var directionalLight = new THREE.DirectionalLight(color);
		directionalLight.position.set(x_position, y_position, z_position).normalize();
		return directionalLight;
	},
	createTexture : function(lastTime, angularSpeed, three, img_src) {
		// wait for texture image to load before starting the animation
		var _this = this;
		var textureImg = new Image();
		textureImg.onload = function() {
			_this.animateFlag(lastTime, angularSpeed, three, _this);
		};
		textureImg.src = img_src;
	},
	animateFlag : function(lastTime, angularSpeed, three) {
		var date = new Date();
		var time = date.getTime();
		var timeDiff = time - lastTime;
		// Calculate angle change and rotate it
		var angleChange = angularSpeed * timeDiff * 2 * Math.PI / 10000;
		three.sphere.rotation.y += angleChange;
		lastTime = time;
		// render animation
		three.renderer.render(three.scene, three.camera);
		// set recursive animation
		var _this = this;
		requestAnimFrame(function() {
			_this.animateFlag(lastTime, angularSpeed, three);
		});
	},
	initRequestAnimFrame : function() {
		// return by agent
		window.requestAnimFrame = (function(callback) {
			return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
			function(callback) {
				window.setTimeout(callback, 1000 / 60);
			};
		})();
	},
	toggleFlag : function() {
		$(this.el).css('background', 'green');
	}
});

/* Router */
var AppRouter = Backbone.Router.extend({
	routes : {
		"*actions" : "load" /* Default Route */
	},
	load : function() {
		// this.loadFlags(); /* Load flags from JSON data */ /**/
		this.loadCars();
	},
	loadFlags : function() {
		var flagCollection = new FlagCollection();
		// fetch data from JSON
		flagCollection.fetch({
			success : function(data) {
				var flagsView = new FlagsView({
					collection : data
				})
				return data;
			},
			error : function(response) {
				console.log("Error occured while accessing JSON Data. Response: ", response);
			}
		});
	},
	loadCars : function() {
		// create 6 cars collection
		var carCollection = new CarCollection([{
			id : "1",
			top : "0",
			left : "10",
			color : "red",
			speed: 149.616
		}, {
			id : "2",
			top : "100",
			left : "10",
			color : "orange",
			speed: 101.807
		}, {
			id : "3",
			top : "200",
			left : "10",
			color : "blue",
			speed: 72.003
		}, {
			id : "4",
			top : "300",
			left : "10",
			color : "green",
			speed: 71.866
		}, {
			id : "5",
			top : "400",
			left : "10",
			color : "yellow",
			speed: 69.973
		}, {
			id : "6",
			top : "500",
			left : "10",
			color : "purple",
			speed: 57.552
		}]);
		// create a view for the cars
		var carsView = new CarsView({
			collection : carCollection
		});
	}
});

/* Create router instance and start application */
var appRouter = new AppRouter();
Backbone.history.start();