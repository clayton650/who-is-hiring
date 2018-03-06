//TODO: Local storage for comment object array or cache in DB?

const commenter = {

	totalSeedCommentCount: 0,
	loadedSeedCommentCount: 0,
	commentObjectGroupArray: [],
	commentObjectLocatorArray: [],
	totalCommentCount: 0,
	loadedCommentCount: 0,
	loadCommentObjectArray: [],
	test: 'clayton',

	domain: 'https://hacker-news.firebaseio.com/',
	comment_path: 'v0/item/',
	user_path:'v0/user/',

	init: function(configObject){
		this.commentObjectGroupArray = [];
		this.totalSeedCommentCount = 0;
		this.loadedSeedCommentCount = 0;
		this.totalCommentCount = 0;
		this.loadCommentObjectArray = [];

		var self = this;

		$(this).on('seedCommentLoaded', function(){
			self.loadedSeedCommentCount++
			if(self.loadedSeedCommentCount === self.totalSeedCommentCount){
				$(self).trigger('ready');
			}
		})

		$(this).on('commentLoaded', function(e, data){
			if(data){
				self.loadCommentObjectArray.push(data.commentObject);
			}
			if(self.totalCommentCount === self.loadCommentObjectArray.length){
				self.sort(self.loadCommentObjectArray);
				$(self).trigger('loaded', [{commentObjectArray:self.loadCommentObjectArray}]);
				//self.totalCommentCount = 0; //TODO - figure out why this breaks the filter loading
				//self.loadCommentObjectArray = [];
			}
		});

		self.setSeedComments();

		return this;
	},
	setSeedComments: function(){
		var self = this;
		var url = this.domain+this.user_path+"whoishiring"+".json";
		$.get(url).done(function(res){

			var seeds = res.submitted.slice(0,12); //for testing
 
			self.totalSeedCommentCount = seeds.length;

			self._commentObjectGroupArrayFactory(seeds);

		});
	},
	//TODO: handle errors
	getComment: function(comment_id, callback_fn){

		var url = this.domain+this.comment_path+comment_id+".json";

		$.get(url).done(function(commentObject){
			if (callback_fn && (typeof callback_fn == "function")) {
		  	callback_fn(commentObject); 
		  }
		});
	},
	preloadComments: function(commentObjectArray){
		this.totalCommentCount = commentObjectArray.length;
		this.loadCommentObjectArray = [];
		//var totalCommentCount = this.totalCommentCount;
		var self = this;
		commentObjectArray.forEach(function(commentObject,i){
			if(commentObject.text){
				$(self).trigger("commentLoaded", [{commentObject:commentObject}]);
			}else{
				self.getComment(commentObject.id, function(res){
					if(res.text){
						commentObject.text = res.text;
						commentObject.by = res.by;
						commentObject.time = res.time;
						$(self).trigger("commentLoaded", [{commentObject:commentObject}]);
					}else{
						//This is an 'empty comment' so don't load it
						self.totalCommentCount -= 1; //decrament counter
						$(self).trigger("commentLoaded")
					}
				});
			}
		});
	},
	findCommentObjectGroup: function(date_title){

		return this.commentObjectGroupArray.find(cog => cog.date_title === date_title.toLowerCase());
	},
	getAllComments(group_type){
		var commentObjectArray = [];
		this.commentObjectGroupArray.forEach(function(commentObjectGroup){
			if(group_type && group_type !== "all"){
				if(group_type === "freelancers"){
					commentObjectArray = commentObjectGroup.freelance_comments.kid_object_array.concat(commentObjectArray);
				}else if(group_type === "seeker"){
					commentObjectArray = commentObjectGroup.seeker_comments.kid_object_array.concat(commentObjectArray);
				}else{
					commentObjectArray = commentObjectGroup.job_comments.kid_object_array.concat(commentObjectArray);
				}
			}else{
				commentObjectArray = commentObjectGroup.freelance_comments.kid_object_array.concat(commentObjectArray);
				//commentObjectArray = commentObjectGroup.seeker_comments.kid_object_array.slice(0).concat(commentObjectArray);
				commentObjectArray = commentObjectGroup.job_comments.kid_object_array.concat(commentObjectArray);
				
			}
		});

		return commentObjectArray
	},
	//TODO: create a more generic find method
	findCommentObject: function(id){
		var id = parseInt(id);
		var commentObject;
		var co = this.commentObjectLocatorArray.find(co => co.id == id);
		if(co){
			commentObject = co.object;
		}
		return commentObject;
	},
	filter: function(commentObjectArray, property, value_array, exact_match = true){
		var filteredCommentObjectArray = [];
		commentObjectArray.forEach(function(commentObject){
			value_array.forEach(function(value){
				//TODO: Validate the property exists
				if(exact_match){
					if(commentObject[property]===value){
						filteredCommentObjectArray.push(commentObject);
					}
				}else{
					if(commentObject[property]){
						if(commentObject[property].toLowerCase().trim().includes(value.toLowerCase().trim())){
							filteredCommentObjectArray.push(commentObject);
						}
					}
				}
			});
		});
		return filteredCommentObjectArray
	},
	//TODO: sort options
	sort: function(commentObjectArray){
		commentObjectArray.sort(function(a, b) {
    	return b.id - a.id;
		})
	},
	//TODO: handle errors
	_commentObjectGroupArrayFactory: function(commentIdArray){

		var self = this;

		commentIdArray.forEach(function(commentId){
		
			self.getComment(commentId, function(commentObject){
				if(commentObject.type === "story" && !commentObject.deleted && !commentObject.dead && commentObject.title){
					var isFreelancer = commentObject.title.toLowerCase().includes("freelance");
					var time = parseInt(commentObject.time + '000');
					var date_title = moment(time).format('MMMM YYYY').toString().toLowerCase();
					//get or create commentObjectGroup
					var commentObjectGroup = self.findCommentObjectGroup(date_title);
					if(!commentObjectGroup){
						commentObjectGroup = {
							date_title: date_title,
							job_comments: {
								parent_object_array: [],
								kid_object_array: [],
							},
							freelance_comments: {
								parent_object_array: [],
								kid_object_array: [],
							},
							seeker_comments:{
								parent_object_array: [],
								kid_object_array: [],
							}
						}
						self.commentObjectGroupArray.push(commentObjectGroup);
					}

					//TODO kid comment factory?
					var kidCommentObjectArray;
					if(commentObject.kids){
						var kidCommentObjectArray =  commentObject.kids.map(function(kid_id){
							var kidObject = {
								parentObject: commentObject,
								id: kid_id,
							}
							return kidObject
						})
					}

					var commentObjectSubGroup;
					var sub_group_label;
					if(isFreelancer){
						commentObjectGroup.freelance_comments.parent_object_array.push(commentObject);
						commentObjectGroup.freelance_comments.kid_object_array = commentObjectGroup.freelance_comments.kid_object_array.concat(kidCommentObjectArray);
						commentObjectSubGroup = commentObjectGroup.freelance_comments.kid_object_array;
						sub_group_label = "freelancers";
					}else{
						var isSeeker = commentObject.title.toLowerCase().includes("who wants to be hired");
						if(isSeeker){
							commentObjectGroup.seeker_comments.parent_object_array.push(commentObject);
							commentObjectGroup.seeker_comments.kid_object_array = commentObjectGroup.seeker_comments.kid_object_array.concat(kidCommentObjectArray);
							commentObjectSubGroup = commentObjectGroup.seeker_comments.kid_object_array;
							sub_group_label = "seekers";
						}else{
							commentObjectGroup.job_comments.parent_object_array.push(commentObject);
							commentObjectGroup.job_comments.kid_object_array = commentObjectGroup.job_comments.kid_object_array.concat(kidCommentObjectArray);
							commentObjectSubGroup = commentObjectGroup.job_comments.kid_object_array;
							sub_group_label = "jobs";
						}
					}	

					kidCommentObjectArray.forEach(function(commentObject){
						var locatorObject = {
							id: commentObject.id,
							object: commentObject,
							group: commentObjectGroup,
							sub_group: commentObjectSubGroup,
							sub_group_label: sub_group_label,
						}
						self.commentObjectLocatorArray.push(locatorObject);
					});
				}

				$(self).trigger('seedCommentLoaded');
					
			});

		});
	},
	
};