$(function(){

	//** Message Handler ** //
	//app.messenger
	const message = messenger.init();

	//** Wikipedia Sidebar **//
	const wikiForm = "form#wiki"
	const wikiConfig = {
		inputForm: wikiForm,
	}
	//init wiki.wikipedia object
	const wiki = wikipedia.init(wikiConfig);

	//init wiki results with info message
	message.show("Use above field to search terms on Wikipedia", "warning", "#wiki-results",false, false)

	//used to ignore multipe submissions of same term in validation block below w/in submit event handler
	var previous_term;

	$(wikiForm).on("submit", function(e){
		e.preventDefault();
		var term = $("#wiki-input").val();
		//validate keyword
		if(term){
			//if there is something in the keyword field
			//remove spaces in term
			term = term.trim().replace(/\s+/g, " ");
			if(term){
				//ignore multiple sumbissions of same term
				if(term !== previous_term){
					//if there are term
					wiki.lookup(term);//Ajax call, when response is ready the form element will trigger 'ready' event which is handled below
					$("#wiki-input").val(term).blur();
					previous_term = term;
				}
			}else{
				//if keyword is now blank then user input spaces so show a warning message
				message.show("Can't search using an empty value", "warning");
				$("#wiki-input").val('').focus();
			}
		}
		//ELSE... just ignore empty submissions
	});

	//Handle wiki form ready event which is triggered when wiki.lookup is done with ajax call
	$(wikiForm).on("ready", function(e, data){
		var resultsObject = data.lookupObject;
		var results = data.lookupObject.results;
		if(results.length > 0){
			var html = wiki.draw(resultsObject,"#wiki-results").hide();
			$(html).collapse('hide').fadeIn("fast"); //Bootstrap collapse
		}else{
			$("#wiki-results").empty();
			message.show("No results found. Try another term.", "danger", "#wiki-results",false, false)
		}
	});

	//Clear the wikipedia input field when
	//UI is handled below using .clear-input class, shares UI with keyword input field 
	$("#clear-search-input").on("click", function(){
		$("#wiki-input").val("").focus();
		$("#wiki-results").empty();
		previous_term = "";
		message.show("Use above field to search terms on Wikipedia", "warning", "#wiki-results",false, false);

	});

	
	//** Comment ** //

	//** Init objects **
	//init comment.comment object
	const comment = commenter.init();
	//init app.load object
	const load = loader.init();
	//init app.favorite object
	const fav = favorite.init();
	//config and init app.app
	const appConfig = {
		commentGroupSelectWrapper: "#commentGroup",
		commentWrapper: "#comments > ul",
		groupTypeWrapper: "#groupType",
		filterWrapper: ".filter",
		favoriteObject: fav,
	};
	const draw = drawer.init(appConfig);

	//** Functions **
	function getCommentObjectArray(configObject){
		//DEFAULT: retrieve current state from DOM
		var date_title = $("#commentGroup").find(":selected").attr("data-date-title");
		var group_type = $("#groupType .active").attr("data-group-type").toLowerCase();
		var comment_filter = $(".filter .active").attr("data-filter").toLowerCase();
		var keyword = $("#keyword-input").val();
		var commentObjectGroup;
		var commentObjectArray=[];

		//load config objects if available, overide above values
		if(configObject){
			if(configObject.keyword){
				keyword = configObject.keyword;
				//Hack to support empty keyword scenario used with showing all favorites
				if(keyword === " "){
					keyword = "";
				}
			}
			if(configObject.date_title){
				date_title = configObject.date_title;
			}
			if(configObject.group_type){
				group_type = configObject.group_type;
			}
			if(configObject.comment_filter){
				comment_filter = configObject.comment_filter;
			}	
		}

		if(date_title === "all"){
			commentObjectArray = comment.getAllComments(group_type).slice(0);;
		}else{
			commentObjectGroup = comment.findCommentObjectGroup(date_title)
			//if findCommentObjectGroup did not find an object the date_title is not useful or available in configObject
			if(!commentObjectGroup){
				date_title = $("#commentGroup").find(":selected").attr("data-date-title");
				commentObjectGroup = comment.findCommentObjectGroup(date_title);
			}

			var freelance_comments = commentObjectGroup.freelance_comments.kid_object_array.slice(0)
			var seeker_comments = commentObjectGroup.seeker_comments.kid_object_array.slice(0)
			var job_comments = commentObjectGroup.job_comments.kid_object_array.slice(0)

			if(group_type==="all"){
				commentObjectArray = freelance_comments.concat(commentObjectArray);
				//commentObjectArray = seeker_comments.concat(commentObjectArray)
				commentObjectArray = job_comments.concat(commentObjectArray);
			}else if(group_type==="freelancers"){
				commentObjectArray = freelance_comments;
			}else if(group_type === "seeker"){
				 commentObjectArray = seeker_comments
			}else{
				commentObjectArray = job_comments
			}
		}

		//filter comments
		if(comment_filter==="favorite"){
			commentObjectArray = comment.filter(commentObjectArray,"id",fav.list())
		}
		//TODO: filter flagged items here

		//sort comments by date, newest first
		comment.sort(commentObjectArray);
		
		//update UI
		draw.navBar(date_title, group_type, comment_filter, keyword);
		draw.urlQuery(date_title, group_type, comment_filter, keyword);

		return commentObjectArray
	};
	//load.comments wrapper function
	function loadComments(count_to_load){
		load.comments(count_to_load, function(block_to_load, is_last){
			if(!is_last){
				$("#loaderWrapper").show();
			}else{
				$("#loaderWrapper").hide();
			}
			//comment objects may be empty, comment.preloadComments loads missing properties like text
			// When done the method emits "loaded" and is handled below
			comment.preloadComments(block_to_load);
		});
	};
	//init or update loader objec
	function initCommentLoader(configObject, count_to_load){
		Waypoint.destroyAll();
		var count_to_load = count_to_load | 25; //set default
		var commentObjectArray = getCommentObjectArray(configObject);

		if(commentObjectArray.length === 0){
			$("#loaderWrapper").hide();
			$("nav .filter, nav .navbar-form").css("visibility", "visible");
			message.show("No results found", "warning", "#comments > ul",false, false)
		}else{
			load.init({commentObjectArray: commentObjectArray});
			loadComments(count_to_load);
		}
		$("html, body").animate({ scrollTop: 0 }, "fast");
	};
	//** comment.comment event handlers **
	//Load select element with options and load initial comments
	$(comment).on('ready', function(){
		//Load the comment group select dropdown
		var url_query = get_urlquery(); //from utils.js file
		console.log("Here is the URL Query: ",url_query);
		draw.commentGroupSelect(comment.commentObjectGroupArray);
		initCommentLoader(url_query);
	});
	//Load comments when comment.preloadComments is done (called in loadComments() function)	
	$(comment).on("loaded", function(e, data){

		var commentObjectArray = data.commentObjectArray;
		var keyword = $("#keyword-input").val();
		//Comment Filter
		if(keyword){
			commentObjectArray = comment.filter(commentObjectArray,"text",[keyword],false);
		}

		draw.comments(commentObjectArray,function(commentArray){
			//attached waypoint event to 10th DOM item in commentArray.
			// When that object is in view the callback function will run
			// and load another 25 items
			toggleCommentToggle();
			if(commentObjectArray.length === 0){
				loadComments(25);
			}else{
				$("#loaderWrapper").hide();
				var triggerIndex = 9;
				if(commentObjectArray.length-1 < triggerIndex){
					triggerIndex = commentObjectArray.length-1;
				}
				var triggerElement = $(commentArray)[triggerIndex];
				if(triggerElement){
					triggerElement.addClass("track"); //for testing
					triggerElement.waypoint({
					  handler: function(direction){
					    loadComments(25);
					    this.destroy();
					  },
					  offset: 'bottom-in-view',
					})
				}else{
					//TODO: Do something when there are no more comments to load...
				}
			}
		});

		$("nav .filter, nav .navbar-form").css("visibility", "visible")

	});	
	//** User event handlers **
	//Load comments when the group dropdown select is changed, empty existing comments div
	$("#commentGroup").on("change", function(){
		$("#comments > ul").empty();
		initCommentLoader();
	});
	//Variables to support toggling between Browse and Favorite comments
	
	var all_fav_query = {date_title: "all", group_type: "all", comment_filter: "favorite", keyword:" "};
	var default_query = {date_title: "all", group_type: "all", keyword:" "};
	var save_url_query = {date_title: "all", group_type: "all", keyword:" "};
	var current_filter;

	//group type and filter button clicks
	$(".filter").on("click", "li", function(e){ 
		//toggle active classes

		//ignore util buttons/icons in filter button/li
		var is_util =  $(e.target).hasClass("util");

		if(!is_util){
			$(this).parents(".form-group").find("button").removeClass("active");
			$(this).addClass("active");
		
			var filter = $(this).attr('data-filter');

			if(current_filter !== filter){
				current_url_query = get_urlquery();

				if(!save_url_query.keyword){
					save_url_query.keyword = " "; //HACK...
				}
				save_url_query.comment_filter = filter;

				//empty comments div
				$("#comments > ul").empty();
				initCommentLoader(save_url_query);
	
				save_url_query = current_url_query;
				current_filter = filter;

			}
		}
		
	});

	$("#groupType").on("click", "button:not(.util)", function(){ 
		//toggle active classes
		$(this).parents(".form-group").find("button").removeClass("active");
		$(this).addClass("active");
		//empty comments div
		$("#comments > ul").empty();

		initCommentLoader();
	});

	//Toggle comment favorite on/off
	$(document).on("click", "button.favorite", function(){
		var comment_html = $(this).parents("li.comment")
		var id = comment_html.attr("data-id");
		var favorite_array, action;
		[favorite_array, action] = fav.update(id);
		var commentObject = comment.findCommentObject(id);
		//TODO: if !commentObject... validate id, ignore click? Show error message
		draw.comment(commentObject, function(updated_comment_html){
			comment_html.replaceWith(updated_comment_html);
			toggleCommentToggle();
		});
		draw.updateFavoriteButton();
	});

	$(document).on("click", "[data-action='reset-favorites']:not(.disabled)", function(){
		$('[data-toggle="popover"]').popover('show');
	});

	//Handle button clicks in popover
	$(document).on("click","[data-action='reset-favorites'] + .popover button",function(){
		var action = $(this).attr("data-action");
		//Delete all favorites 
		if(action==="delete"){
			fav.reset();
			$("#comments > ul").empty();
			initCommentLoader();
		}
		$('[data-action="reset-favorites"] + .popover').popover('hide');
	});

	//Hide popovers when clicking outside of one
	//SOURCE: https://stackoverflow.com/questions/11703093/how-to-dismiss-a-twitter-bootstrap-popover-by-clicking-outside
	$(document).on('click', function (e) {
    $('[data-toggle="popover"],[data-original-title]').each(function () {
        //the 'is' for buttons that trigger popups
        //the 'has' for icons within a button that triggers a popup
        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {                
            (($(this).popover('hide').data('bs.popover')||{}).inState||{}).click = false  // fix for BS 3.3.6

        }

	    });
	});

	//Support sudo disabled stat of icon by destroying popover everytime it is hidden
	$('[data-toggle="popover"]').on('hidden.bs.popover', function () {
  	$(this).popover('destroy'); //support deactive state of icon
	});

	//Listen for when user clicks the #keyword-button, if valid input, update the comments
	$("#keyword-button").on("click", function(e){
		e.preventDefault();
		var keywords = $("#keyword-input").val();

		//validate keyword
		if(keywords){
			//if there is something in the keyword field
			//remove spaces in keywords
			keywords = keywords.trim().replace(/\s+/g, " ");
			if(keywords){
				//if there are keywords
				$("#keyword-input").val(keywords).focus();
				$("#comments > ul").empty();
				initCommentLoader();
			}else{
				//if keyword is now blank then user input spaces so show a warning message
				message.show("Can't filter using an empty value", "warning");
				$("#keyword-input").val('').focus();
			}
		}else{
			//Reset keyword filter to no filter, if keywords is empty assume user is clearing previous filter
			$("#comments > ul").empty();
			initCommentLoader({keyword:" "});
		}
	});

	//Catch form submits when user hits return/enter and trigger the above #keyword-button click event
	$("form.navbar-form").on("submit", function(e){
		e.preventDefault();
		$("#keyword-button").trigger("click");
	});

	//Clear the keyword input field when 
	$("#clear-keyword-input").on("click", function(){
		$("#keyword-input").val("").focus();
		$("#comments > ul").empty();
		initCommentLoader();
	});

	//Listen for user typing in keyword input field and toggle the clear button
	$("form input").on("keyup", function(){
		var value = $(this).val();
		if(value){
			$(this).siblings(".clear-input").css("visibility", "visible");
		}else{
			$(this).siblings(".clear-input").css("visibility", "hidden");
		}
	});

	$(".reset").on("click", function(){
		$("#comments > ul").empty();
		initCommentLoader(default_query);
	});


	/* Handle link to related Hacker News comments */
	function openInNewTab(url){
		//Source: https://stackoverflow.com/questions/19851782/how-to-open-a-url-in-a-new-tab-using-javascript-or-jquery
		var win = window.open(url, '_blank');
		if (win) {
		    //Browser has allowed it to be opened
		    win.focus();
		} else {
		    //Browser has blocked it
		    message.show('Please allow popups for this website', "warning");
		}
	};
	$(".link").on("click", function(){
		var url_query = get_urlquery();
		var date_title = url_query.date_title;
		var group_type = url_query.group_type;
		var url;
		var id;
		if(date_title === "all"){
			openInNewTab("https://news.ycombinator.com/submitted?id=whoishiring");
		}else{
			var commentObjectGroup = comment.findCommentObjectGroup(date_title);
			var job_id = commentObjectGroup.job_comments.parent_object_array[0].id
			var fl_id = commentObjectGroup.freelance_comments.parent_object_array[0].id

			if(group_type==="all"){
				//TODO: Can only open one tab at once
				openInNewTab("https://news.ycombinator.com/item?id="+job_id);
				//openInNewTab("https://news.ycombinator.com/item?id="+fl_id);
			}else if(group_type==="freelancers"){
				openInNewTab("https://news.ycombinator.com/item?id="+fl_id);
			}else{
				openInNewTab("https://news.ycombinator.com/item?id="+job_id)
			}
		}	
	});
	//Toggle comment articles open and closed
	$(document).on("click", ".toggle-comment",function(){
		var article = $(this).siblings("article")
		if(article.hasClass("closed")){
			article.removeClass("closed")
			$(this).text("[ close ]");
		}else{
			article.addClass("closed")
			$(this).text("[ open ]");
		}

	});
	//Show/Hide comment toggle if content in article is overflowing
	//TODO: pass through one comment to support comment updates and not have to recheck everything
	function toggleCommentToggle(){
		$(".comment").each(function(){
			var article = $(this).find("article");
			var toggle = $(this).find(".toggle-comment");
			//SOURCE: https://stackoverflow.com/questions/7668636/check-with-jquery-if-div-has-overflowing-elements
			if (article.outerHeight() < article.prop('scrollHeight') ) {
	    	// your element have overflow
	    	toggle.show();
			}else{
			  // your element doesn't have overflow
			  toggle.hide();
			}
		});	
	}
	//Handle window resize event
	$(window).on('resize', function(){
		//retoggle the comment toggle buttons just in case the new window size causes the articals to overflow
		toggleCommentToggle();
	});

});