const moderator = {
	init: function(configObject){

		this.array_key = "moderator_comment_id_array";

		//Connect to Firebase
		var config = {
	    apiKey: "AIzaSyDjnab3P0Z4aQmYz-uS84m9v4q7fM5_ZsQ",
	    authDomain: "whoishiring-6725e.firebaseapp.com",
	    databaseURL: "https://whoishiring-6725e.firebaseio.com",
	    projectId: "whoishiring-6725e",
	    storageBucket: "whoishiring-6725e.appspot.com",
	    messagingSenderId: "565486271351"
  	};
		firebase.initializeApp(config);
		this.database = firebase.database();

		console.log("INIT");

		return this
	},
	reset: function(){
	},
	//toggle wrapper for add and remove methods
	update: function(id){
		//"destructuring assignments" source: https://stackoverflow.com/questions/2917175/return-multiple-values-in-javascript
		var id = parseInt(id);
		var favorite_array, added, removed
		var action = "added";
		[favorite_array, added] = this.add(id);
		if(!added){
			[favorite_array, removed] = this.remove(id);
			action = "removed";
		}
		return [favorite_array, action]
	},
	//TODO: validate id function
	add: function(id){
		var id = parseInt(id);
		var favorite_array = this.list();
		var added = false;
		if(favorite_array.indexOf(id) === -1){
			favorite_array.push(id);
			localStorage.setItem(this.array_key, JSON.stringify(favorite_array));
			added = true;
		}
		return [favorite_array, added]
	},
	remove: function(id){
		var id = parseInt(id);
		var favorite_array = this.list();
		var removed = false;
		var id_index = favorite_array.indexOf(id)
		if(id_index !== -1){
			favorite_array.splice(id_index, 1);
			localStorage.setItem(this.array_key, JSON.stringify(favorite_array));
			removed = true;
		}
		return [favorite_array, removed]
	},
	list: function(){
		
		var self = this;
		this.database.ref("/"+this.array_key).on("value", function(snapshot){

			$(self).trigger("loaded",[{list:snapshot.val()}]);

		});

		//return JSON.parse(localStorage.getItem(this.array_key)).map(k => parseInt(k));
	},
	isFavorite: function(id){
		var id = parseInt(id);
		var favorite_array = this.list();
		var isFavorite = true;
		if(favorite_array.indexOf(id)===-1){
			isFavorite = false
		}
		return isFavorite;
	}
};