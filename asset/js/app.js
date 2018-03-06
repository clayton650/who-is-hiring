
const drawer = {
	init: function(configObject){
		this.commentGroupSelectWrapper = configObject.commentGroupSelectWrapper;
		this.commentWrapper = configObject.commentWrapper;
		this.groupTypeWrapper = configObject.groupTypeWrapper;
		this.filterWrapper = configObject.filterWrapper;
		this.favoriteObject = configObject.favoriteObject;
		return this;
	},
	commentGroupSelect: function(commentObjectGroupArray){
		var self = this;
		commentObjectGroupArray.forEach(function(commentObjectGroup){
			var optionHtml = $("<option>").html(commentObjectGroup.date_title.capitalize()).attr("data-date-title", commentObjectGroup.date_title);
			$(self.commentGroupSelectWrapper).append(optionHtml)
		});
	},
	_renderComment: function(commentObject){

		var id = commentObject.id
		var isFavorite = this.favoriteObject.isFavorite(id);

		var li = $("<li>").attr("class","row comment").attr("data-id", id);
		var aside = $("<aside>").attr("class","col-md-2");

		var buttonGroup = $("<div>").attr("class","btn-group btn-group-xs").attr("role","group");
		//Favorite Button
		var buttonOk = $("<button>").attr("class", "btn btn-default favorite").attr("type", "button");
		var spanOk = $("<span>").attr("class", "glyphicon glyphicon-ok");
		buttonOk.html(spanOk);
		if(isFavorite){
			buttonOk.removeClass("btn-default").addClass("btn-success").addClass("active");
			buttonOk.attr("title", "Already a favorites")
		}else{
			buttonOk.attr("title", "Add to favorites")
		}

		//TODO: Moderate Button
		//var buttonFlag = $("<button>").attr("class", "btn btn-default moderate").attr("type", "button");
		//var spanRemove = $("<span>").attr("class", "glyphicon glyphicon-flag");
		//buttonFlag.append(spanRemove);

		//Link Button
		var linkA = $("<a>").attr("class","btn").attr("href","https://news.ycombinator.com/item?id="+id).attr("target","_blank");
		var spanArrow = $("<span>").attr("class", "glyphicon glyphicon-share-alt hn-orange");
		linkA.html(spanArrow);
		
		//Assemble the buttons into the button group
		buttonGroup.append(buttonOk).append(linkA)

		var time = moment(parseInt(commentObject.time + '000')).format("MM/DD/YY");
		var details = $("<ul>");
		var timeLi = $("<li>").html(time);
		var byLi = $("<li>");
		
		var byA = $("<a>")
			.attr("href","https://news.ycombinator.com/user?id="+commentObject.by)
			.addClass("hn-orange")
			.attr("target","_blank")
			.text(commentObject.by);

		byLi.html(byA)

		details.append(timeLi).append(byLi);

		aside.append(buttonGroup).append(details);

		var article = $("<article>")
			.attr("class","col-md-10 closed")
			.html(commentObject.text);

		var toggle = $("<div>")
			.attr("class","toggle-comment col-md-12")
			.text("[ open ]");

		li.append(aside).append(article).append(toggle);

		return li
	},
	comments: function(commentObjectArray, callback_fn){
		var self = this;
		var commentArray = [];
		commentObjectArray.forEach(function(commentObject){
			var li = self._renderComment(commentObject);
			commentArray.push(li);
			$(self.commentWrapper).append(li);
		});
		if (callback_fn && (typeof callback_fn == "function")) {
		 	callback_fn(commentArray); 
		}
	},
	comment: function(commentObject, callback_fn){

		var li = this._renderComment(commentObject);

		if (callback_fn && (typeof callback_fn == "function")) {
		 	callback_fn(li); 
		}
	},
	navBar:function(date_title, group_type, comment_filter, keyword){
		
		//Don't check if keyword is undefined since we need to support empty keyword scenarios
		$("#keyword-input").val(keyword);
		if(keyword){
			$("#clear-keyword-input").css("visibility", "visible");
		}else{
			$("#clear-keyword-input").css("visibility", "hidden");
		}
		
		if(date_title){
			$(this.commentGroupSelectWrapper+" option").prop("selected", false);
			$(this.commentGroupSelectWrapper+" option[data-date-title='"+date_title+"']").prop("selected", true);
		}
		if(group_type){
			var button = $(this.groupTypeWrapper+" [data-group-type='"+group_type+"']")
			var buttons = $(button).siblings()
			this.toggleButton(button, buttons);
		}
		if(comment_filter){
			var button = $(this.filterWrapper+" [data-filter='"+comment_filter+"']");
			var buttons = $(this.filterWrapper+" li");
			this.toggleButton(button, buttons);
		}

		this.updateFavoriteButton();
	},
	toggleButton:function(button, buttons){
		$(buttons).removeClass("active");
		$(button).addClass("active");
	},
	urlQuery: function(date_title, group_type, comment_filter, keyword){
		var parameter_array = [];
		if(date_title){
			parameter_array.push("date_title="+date_title);
		}
		if(group_type){
			parameter_array.push("group_type="+group_type);
		}
		if(comment_filter){
			parameter_array.push("comment_filter="+comment_filter);
		}
		if(keyword){
			parameter_array.push("keyword="+keyword);
		}
		var urlquery = array_to_urlquery(parameter_array)
		//replaceState?
		history.pushState({state:parameter_array},null,window.location.pathname+urlquery);
	},
	updateFavoriteButton: function(){
		var fav_count = this.favoriteObject.list().length
		$(this.filterWrapper+" [data-filter='favorite'] .badge").text(fav_count);
		var reset_button = $(this.filterWrapper+" [data-action='reset-favorites']")
		if(fav_count===0){
			reset_button.addClass("disabled");
		}else{
			reset_button.removeClass("disabled");
		}
	}
};


const loader = {
	init: function(configObject){
		if(configObject){
			this.commentObjectArray = configObject.commentObjectArray.slice(0);//clone
			this.commentObjectToLoadArray = configObject.commentObjectArray.slice(0); //clone
		}else{
			this.commentObjectArray = [];
			this.commentObjectToLoadArray = [];
		}
		return this
	},
	comments: function(count_per_block, callback_fn){

		var block_to_load = this.commentObjectToLoadArray.splice(0,count_per_block);
		var is_last = (this.commentObjectToLoadArray.length === 0 ? true:false);

		if(callback_fn && (typeof callback_fn == "function")) {
		 	callback_fn(block_to_load, is_last); 
		}else{
			return block_to_load, is_last;
		}
	}
};


const favorite = {
	init: function(configObject){

		this.array_key = "favorite_comment_id_array";

		//setup local stroge
		if(localStorage.getItem(this.array_key)===null){
			localStorage.setItem(this.array_key, "[]");
		}
		return this
	},
	reset: function(){
		localStorage.removeItem(this.array_key);
		this.init();
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
		return JSON.parse(localStorage.getItem(this.array_key)).map(k => parseInt(k));
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


const messenger = {

	init: function(configObject){
			return this
	},
	show: function(message, type, location="body", timeout=1500, click_to_hide=true){

		var div = $("<div>");
		div.attr("class", "alert alert-dismissible fade in");
		div.addClass("alert-"+type);
		div.html(message);

		if(location==="body"){
			div.addClass("fixed");
		}

		$(location).append(div);
		$(div).slideDown("fast");

		if(timeout){
			setTimeout(function(){ $(div).slideUp("fast"); }, timeout);
		}
		if(click_to_hide){
			$(div).on("click", function(){
				$(this).slideUp("fast")
			});
		}
		

	}


}


