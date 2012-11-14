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
			carModel.set({
				'topPosition' : topPosition,
				'colorId' : colorId++
			});
			topPosition += 95;
			var carView = new CarView({
				model : carModel
			});
			// append car view
			$(_this.el).append(carView.createCar().el);
		});
	}
});
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
		// set car position
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
			appRouter.isCarDriving = true;
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
		if(appRouter.isCarDriving === true) {
			// decrease speed to extend the overall time of driving
			var _this = this;
			_this.interval = setInterval(function() {
				var carId = _this.model.get("id");
				var carSpeed = _this.model.get("speed");
				var currentCarLeft = $(_this.el).position().left;
				_this.animateCar(_this.el, carSpeed, currentCarLeft);
				_this.animateRoad(carId, carSpeed, currentCarLeft);
				_this.increaseProgressValue(carId, carSpeed);
				if(_this.isAllMetersMaximized() === true) {
					_this.endRace();
				}
			}, 1);
		}
	},
	animateCar : function(carElement, carSpeed, currentCarLeft) {
		// move the car by changing its left position
		var newCarLeft = currentCarLeft + carSpeed;
		$(carElement).css('left', newCarLeft + 'px');
	},
	animateRoad : function(carId, carSpeed, currentCarLeft) {
		if(carId === appRouter.focusedCarId) {
			// move the road and the background objects
			currentRoadLeft = $("#road").position().left;
			newRoadLeft = currentRoadLeft - carSpeed;
			// if it's not the end of the road
			var endRoadLeft = $("#road").width() - $(window).width();
			// if it's not the end of the road
			if(newRoadLeft > -endRoadLeft) {
				$("#road").css('left', newRoadLeft + 'px');
			}
		}
	},
	increaseProgressValue : function(carId, carSpeed) {
		var maximumMeterValue = $('#car_progress_' + carId).attr('max');
		var currentProgressValue = $('#car_progress_' + carId).attr('value');
		// don't cross the meter's max value
		if(currentProgressValue < maximumMeterValue) {
			$('#car_progress_' + carId).attr('value', currentProgressValue + carSpeed);
			var roundedCurrentProgressValue = Math.round(currentProgressValue + carSpeed);
			$('#car_completed_' + carId).text(roundedCurrentProgressValue);
		} else {
			// initialize the value to prevent a value that is larger than maximum
			$('#car_completed_' + carId).text(maximumMeterValue);
		}
	},
	isAllMetersMaximized : function() {
		var allMetersMaximized = true;
		// iterate progresses and try to find a value that is smaller than maximum
		$('.progress').each(function(index) {
			var currentProgressValue = $(this).attr('value');
			var currentProgressMaximum = $(this).attr('max');
			if (currentProgressValue < currentProgressMaximum){
				allMetersMaximized = false;
			}
		});
		return allMetersMaximized;
	},
	endRace : function() {
		//display results
		$('#road').css('opacity', '0.1');
		$('#meters').css('opacity', '0.1');
		$('#countries').css('background', 'rgba(0,0,0,1)').fadeIn();
		$('#countries h4').show();
		$('#restart_race').show();
		$('#subtitle').show();
		// change title
		$('#countries h3').text("דירוג סופי - מהירות הורדה ממוצעת לפי מדינה");
		// change subtitle and show it
		$("#subtitle").html('לפי הדו"ח <a style="direction: ltr" href="http://www.oecd.org/internet/broadbandandtelecom/oecdbroadbandportal.htm#Services_and_speeds" target="_blank">Average advertised download speeds, by country</a>');
		clearInterval(this.interval);
	}
});
var MetersView = Backbone.View.extend({
	el : '#meters',
	initialize : function() {
		var carsModels = appRouter.carCollection.models;
		this.createMeters(carsModels);
	},
	createMeters : function(carsModels) {
		var _this = this;
		var topPosition = 240;
		_.each(carsModels, function(meterModel) {
			// tranform car model into meter model
			var maximumMeterValue = $('#road').width();
			meterModel.set({
				'topPosition' : topPosition,
				'maximumMeterValue' : maximumMeterValue
			});
			topPosition += 95;
			var meterView = new MeterView({
				model : meterModel
			});
			// append meter view
			$(_this.el).append(meterView.createMeter().el);
		});
	}
});
var MeterView = Backbone.View.extend({
	className : "meter",
	template : _.template($('#meter_template').html()),
	createMeter : function() {
		var meterModel = this.model;
		var element = this.getElement(meterModel);
		// set meter's position
		this.setPosition(meterModel);
		// return element to the parent view
		return element;
	},
	getElement : function(carModel) {
		// append in the current template
		var meterElement = this.template(carModel.toJSON());
		$(this.el).append(meterElement);
		return this;
	},
	setPosition : function(carModel) {
		// set car position
		$(this.el).css('top', carModel.get('topPosition') + 'px');
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
			flagModel.set({
				'place' : ++speedPlace
			});
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
	addIsraelToCollection : function() {
		// if the current model represents Israel, add it to the Cars Collection
		if(this.model.get('id') === 'il') {
			this.toggleFlag(true);
		}
		// set the car id which the camera wil follow (Israel is default)
		appRouter.focusedCarId = "il";
	},
	toggleFlag : function(init) {
		$(this.el).toggleClass('selected_flag');
		//start/stop animation
		// do not allow to unselect Israel, unless it's a part of the initiation
		if(this.model.get('id') !== 'il' || init === true) {
			if(this.model.get('selected') === true) {// if the current model is selected already
				this.selectFlag();
			} else {
				this.unselectFlag();
			}
			// update the selection count
			$("#selected_count").text(appRouter.carCollection.length);
			// if 5 cars were selected, create a view for the cars and display the race
			if(appRouter.carCollection.length === 5) {
				var carsView = new CarsView({
					collection : this.carCollection
				});
				var metersView = new MetersView({
					collection : this.carCollection
				});
				$('#subtitle').hide();
				$('#road').fadeIn();
			}
		}
	},
	selectFlag : function() {
		this.model.set({
			'selected' : false
		});
		appRouter.carCollection.remove(this.model);
	},
	unselectFlag : function() {
		this.model.set({
			'selected' : true
		});
		appRouter.carCollection.add(this.model);
	}
});

/* Router */
var AppRouter = Backbone.Router.extend({
	routes : {
		"*actions" : "load" /* Default Route */
	},
	load : function() {
		this.preloadImages(["images/car/1.svg", "images/car/2.svg", "images/car/3.svg", "images/car/4.svg", "images/car/5.svg", "images/flag.svg", "images/grass.jpg", "images/lane.gif", "images/margin_bg.png", "images/start.gif"]);
		this.setRestartButton();
		this.setIsCarDriving();
		// Load flags from JSON data
		this.loadFlags();
		this.loadCars();
	},
	preloadImages : function(arrayImages) {
		$(arrayImages).each(function() {
			(new Image()).src = this;
		});
	},
	setRestartButton : function() {
		$('#restart_race').click(function() {
			window.location = window.location
		})
	},
	setIsCarDriving : function() {
		this.isCarDriving = false;
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
