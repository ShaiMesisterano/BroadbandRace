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

});
var FlagsView = Backbone.View.extend({
	el : '#flags',
	template: _.template($('#flags_template').html()),
	events : {
		"click" : "selectFlag"	//select flag for racing
	},
	initialize : function() {
		var flagsModels = this.collection.models;
		this.createFlags(flagsModels);
	},
	createFlags : function(flagsModels) {
		var _this = this;
		//Loop through flags data and create their animations
		_.each(flagsModels, function(flagModel) {
			_this.createFlag(flagModel);
		});
	},
	createFlag : function(flagModel) {
		this.initRequestAnimFrame();
		var country_id = flagModel.get("id");
		var img_src = "images/flag/" + country_id + ".gif";
		var angularSpeed = 2;
		var lastTime = 0;
		var renderer = this.getRenderer(100, 100);
		this.appendRenderer(renderer, flagModel);
		var camera = this.getCamera(35, 1, 100, 1000, 700);
		var material = this.getMaterial(img_src);
		var sphere = this.getSphere(material);
		var scene = new THREE.Scene();
		scene.add(sphere);
		// add subtle ambient lighting
		var ambientLight = this.getAmbientLight(0x555555);
		scene.add(ambientLight);
		// add directional light source
		var directionalLight = this.getDirectionalLight(0xffffff, 1, 1, 1);
		scene.add(directionalLight);
		// create wrapper object that contains three.js objects
		var three = {
			renderer : renderer,
			camera : camera,
			scene : scene,
			sphere : sphere
		};
		this.createTexture(lastTime, angularSpeed, three, img_src);
	},
	getRenderer: function(width, height){
		var renderer = new THREE.WebGLRenderer();
		renderer.setSize(width, height);
		return renderer;
	},
	appendRenderer: function(renderer, flagModel){
		// append in current element
		$(this.el).append(renderer.domElement);
		var flagElement = this.template(flagModel.toJSON());
		$(this.el).append(flagElement);
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
	getSphereGeometry: function(radius, segments, rings){
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
	createTexture: function(lastTime, angularSpeed, three, img_src){
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
		var angleChange = angularSpeed * timeDiff * 2 * Math.PI / 10000;
		three.sphere.rotation.y += angleChange;
		lastTime = time;
		// render animation
		three.renderer.render(three.scene, three.camera);
		// restart animation
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
	selectFlag : function() {
		
	},
});

/* Router */
var AppRouter = Backbone.Router.extend({
	routes : {
		"*actions" : "load" /* Default Route */
	},
	load : function() {
		this.loadFlags(); /* Load flags from JSON data */
	},
	loadFlags : function() {
		var flagCollection = new FlagCollection();
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
	}
});

/* Create router instance and start application */
var appRouter = new AppRouter();
Backbone.history.start();
