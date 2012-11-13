/* Models */
var CarModel = Backbone.Model.extend({});
var FlagModel = Backbone.Model.extend({});

/* Collections */
var CarCollection = Backbone.Collection.extend({
	model : CarModel
});
var FlagCollection = Backbone.Collection.extend({
	model : FlagModel,
	url : "data/flag.json.jpeg"
});

/* Views */
var CarView = Backbone.View.extend({
	className : "car",
	template : _.template($('#car_template').html()),
	createCar : function() {
		// create Car Element
		var carModel = this.model;
		var element = this.getElement(carModel);
		// set car's position
		this.setPosition(carModel);
		// count from 3 to 1
		this.countDown();
		// return element to the parent view
		return element;
	},
	getElement : function(carModel) {
		// append in the current template
		var carElement = this.template(carModel.toJSON());
		$(this.el).append(carElement);
		return this;
	},
	setPosition : function(carModel) {
		$(this.el).css('top', carModel.get('topPosition') + 'px');
	},
	countDown : function(number) {
		var _this = this;
		this.countStep("3", 500);
		this.countStep("2", 1000);
		this.countStep("1", 2000);
		this.countStep("GO", 3000);
		setTimeout(function() {
			$("#countdown").fadeOut();
			// boolean to start/stop driving
			_this.isDriving = true;
			// start driving
			_this.driveCar();
		}, 4000);
	},
	countStep : function(text, seconds) {
		setTimeout(function() {
			$("#countdown").text(text).fadeIn();
		}, seconds);
	},
	driveCar : function() {
		// increase car's position by its speed value, and make the moving object to follow it
		if(this.isDriving === true) {
			var carSpeed = this.model.get("speed") / 1.5; // decrease speed to extend the overall time of driving
			var _this = this;
			_this.interval = setInterval(function() {
				// move the car by changing its left position
				var currentLeft = $(_this.el).position().left;
				var newLeft = currentLeft + carSpeed;
				$(_this.el).css('left', newLeft + 'px');
				// if it's the car that is focused
				if(_this.model.get("id") == appRouter.focusedCarId) {
					// move the road and the background objects
					currentLeft = $("#road").position().left;
					newLeft = currentLeft - carSpeed;
					// if it's not the end of the road
					var endLeft = 8000 - $(window).width();
					if (newLeft > -endLeft){
						$("#road").css('left', newLeft + 'px');
					}
					else if ($(_this.el).position().left > 8000){
						// if the car has reached to the end, stop the interval
						_this.endRace();
					}
				}
			}, 1);
		}
	},
	endRace: function(){
		//display race & overall results
		$('#road').css('opacity', '0.1');
		$('#countries').css('background', 'rgba(0,0,0,1)').fadeIn();
		// change title
		$('#countries h3').text("תוצאות המרוץ");
		// display speed
		$('#countries h4').show();
		// hide count
		$('#selected_count_wrapper').hide();
		clearInterval(this.interval);
	}
});
var CarsView = Backbone.View.extend({
	el : '#cars',
	initialize : function() {
		// populate models and create views with them
		var carsModels = appRouter.carCollection.models;
		this.createCars(carsModels);
	},
	createCars : function(carsModels) {
		// loop through flags data and create their animations
		var _this = this;
		// initialize new car's top position and color ID
		var colorId = 1;
		var topPosition = 140;
		_.each(carsModels, function(carModel) {
			// set & increase new car's top position
			carModel.set({'topPosition': topPosition, 'colorId': colorId++});
			topPosition += 95;
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
		// set & increase new car's top position
		var speedPlace = 0;
		// loop through flags data and create their display
		var _this = this;
		_.each(flagsModels, function(flagModel) {
			flagModel.set({'place': ++speedPlace});
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
		// append element in the current template
		var flagModel = this.model;
		var flagElement = this.template(flagModel.toJSON());
		$(this.el).append(flagElement);
		this.addIsraelToCollection();
		return this;
	},
	addIsraelToCollection: function(){
		// if the current model represents Israel, add it to the Cars Collection
		if (this.model.get('id') === 'il'){
			this.toggleFlag(true);
		}
		// set the car id which the camera wil follow (Israel is default)
		appRouter.focusedCarId = "il";
	},
	toggleFlag : function(init) {
		$(this.el).toggleClass('selected_flag'); //start/stop animation
		// do not allow to unselect Israel, unless it's a part of the initiation
		if (this.model.get('id') !== 'il' || init === true){
			if (this.model.get('selected') === true){ // if the current model is selected already
				this.selectFlag();			
			}
			else{
				this.unselectFlag();	
			}
			// update the selection count
			$("#selected_count").text(appRouter.carCollection.length);
			// if 5 cars were selected, create a view for the cars and display the race
			if (appRouter.carCollection.length === 5){
				var carsView = new CarsView({
					collection : this.carCollection
				});
				$('#road').fadeIn();
			}
		}
	},
	selectFlag: function(){
			this.model.set({'selected': false});
			appRouter.carCollection.remove(this.model);
	},
	unselectFlag: function(){
			this.model.set({'selected': true});
			appRouter.carCollection.add(this.model);
	}
});

/* Router */
var AppRouter = Backbone.Router.extend({
	routes : {
		"*actions" : "load" /* Default Route */
	},
	load : function() {
		this.loadFlags(); /* Load flags from JSON data */
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
		// create cars collection
		this.carCollection = new CarCollection();
	}
});

/* Create router instance and start application */
var appRouter = new AppRouter();
Backbone.history.start();
