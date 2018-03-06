const wikipedia = {
	init: function(configObject){
		this.inputForm = configObject.inputForm;
		return this
	},
	reset: function(){

	},
	lookup: function(term){
		//trim term
		//TODO: handle ajax errors
		var self = this;
		var url = "https://en.wikipedia.org/w/api.php?";
		$.ajax(
			{
			  url: url,
	          data: { 
	          	action: 'opensearch', 
	          	// prop:"extracts",
	          	// exintro:"",
	          	// rvsection:0, 
	          	search: term, 
	          	format: 'json' 
	          },
	          dataType: 'jsonp'
			})
			.done(function(res){
				var lookupObject = self._lookupFactory(res);
				$(self.inputForm).trigger("ready",[{lookupObject:lookupObject}]);
		});
	},
	_lookupFactory: function(res){
		//reorganize the wikipedia
		var term = res[0];
		var term_array = res[1];
		var description_array = res[2];
		var link_array = res[3];;
		var resultsArray = term_array.map(function(term, i){
			var resultObject = {
				term: term,
				description: description_array[i],
				link: link_array[i]

			}
			return resultObject;
		});

		var lookupObject ={
			term: term,
			results: resultsArray
		};

		return lookupObject;

	},
	render: function(lookupObject){
		//TODO: one result scenario
		var term = lookupObject.term;
		var resultObjectArray = lookupObject.results;
		var accordion_id = "wiki-accordion";
		var html_wrapper = $("<div>")
			.attr("id", accordion_id)
			.addClass("panel-group")
			.attr("role", "tablist");

		resultObjectArray.forEach(function(resultObject, i){

			//TODO: ignore results without descriptions?
			var term = resultObject.term;
			var description = resultObject.description;
			var link = resultObject.link;

			var html_panel = $("<div>").attr("class", "panel panel-default");
			//Build panel header
			var html_panel_heading = $("<div>")
				.attr("id", "heading"+i)
				.addClass("panel-heading")
				.attr("role","tab");
			var html_heading_title = $("<h4>").addClass("panel-title");
			var html_heading_a = $("<a>")
				.attr("role", "button")
				.attr("data-toggle", "collapse")
				.attr("data-parent", "#"+accordion_id )
				.attr("href","#collapse"+i)
				.html(term);

			// <span type="button" class="glyphicon glyphicon-share-alt util link pull-right"></span>
			var html_link_a = $("<a>")
				.attr("href", link)
				.attr("target", "_blank")
			var html_link_icon = $("<span>")
				.attr("class", "glyphicon glyphicon-share-alt pull-right")

			html_link_a.html(html_link_icon);
			
			html_heading_title
				.append(html_heading_a)
				.append(html_link_a);
			html_panel_heading.html(html_heading_title);

			//Build panel body
			var html_panel_body = $("<div>")
				.attr("id", "collapse"+i)
				.attr("class", "panel-collapse collapse")
				.attr("role", "tabpanel");

			//first panel should be open
			if(i===0){
				html_panel_body.addClass("in");
			}

			var html_description = $("<div>")
				.addClass("panel-body")
				.html(description);

			html_panel_body.html(html_description);

			html_panel
				.append(html_panel_heading)
				.append(html_panel_body);

			html_wrapper.append(html_panel);
	
		});

		return html_wrapper
	},
	draw: function(lookupObject, location){
		var html = this.render(lookupObject);
		$(location).html(html);
		return html
	}
};





