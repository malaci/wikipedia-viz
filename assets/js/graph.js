/**
 * Created by michael on 4/2/2017.
 */
var filter;
var com ={
	vis:{
		wiki:{

		}
	}
}
/**
 * DOM utility functions
 */
var _ = {
	$: function (id) {
		return document.getElementById(id);
	},

	all: function (selectors) {
		return document.querySelectorAll(selectors);
	},

	removeClass: function(selectors, cssClass) {
		var nodes = document.querySelectorAll(selectors);
		var l = nodes.length;
		for ( i = 0 ; i < l; i++ ) {
			var el = nodes[i];
			// Bootstrap compatibility
			el.className = el.className.replace(cssClass, '');
		}
	},

	addClass: function (selectors, cssClass) {
		var nodes = document.querySelectorAll(selectors);
		var l = nodes.length;
		for ( i = 0 ; i < l; i++ ) {
			var el = nodes[i];
			// Bootstrap compatibility
			if (-1 == el.className.indexOf(cssClass)) {
				el.className += ' ' + cssClass;
			}
		}
	},

	show: function (selectors) {
		this.removeClass(selectors, 'hidden');
	},

	hide: function (selectors) {
		this.addClass(selectors, 'hidden');
	},

	toggle: function (selectors, cssClass) {
		var cssClass = cssClass || "hidden";
		var nodes = document.querySelectorAll(selectors);
		var l = nodes.length;
		for ( i = 0 ; i < l; i++ ) {
			var el = nodes[i];
			//el.style.display = (el.style.display != 'none' ? 'none' : '' );
			// Bootstrap compatibility
			if (-1 !== el.className.indexOf(cssClass)) {
				el.className = el.className.replace(cssClass, '');
			} else {
				el.className += ' ' + cssClass;
			}
		}
	}
};


function updatePane (graph, filter) {
	// get max degree
	var maxDegree = 0,
		categories = {};

	// read nodes
	graph.nodes().forEach(function(n) {
		maxDegree = Math.max(maxDegree, graph.degree(n.id));
		if(n.attributes && n.attributes['1']){
			categories[n.attributes['1']] = true;
		}

	})

	// min degree
	_.$('min-degree').max = maxDegree;
	_.$('max-degree-value').textContent = maxDegree;

	// node category
	var nodecategoryElt = $('#node-category');
	nodecategoryElt.empty();
	Object.keys(categories).forEach(function(c) {
		//var optionElt = document.createElement("option");
		//optionElt.text = c;
		var checkbx_class ;
		switch(c) {
			case 'Places and Nature':
				checkbx_class="checkbox-success";
				break;
			case  'Sports':
				checkbx_class ="checkbox-danger";
				break;
			case 'Arts and Culture':
				checkbx_class ="checkbox-info";
				break;
			case 'Science and Society':
				checkbx_class ="checkbox-warning";
				break;
			default:
				checkbx_class ='checkbox-primary';
		}
		var optionElt = $("<div/>",{ "class": "checkbox " + checkbx_class });
		var labelElt = $("<label/>",{"type":"checkbox","for":c,"text":c})
		optionElt.append($("<input/>",{"type":"checkbox","id":c,"checked":"checked"}));
		optionElt.append(labelElt);
		//optionElt.text(c);
		optionElt.appendTo('#node-category');
	});
	_.$('min-degree').value = 0;
	// reset button
	//_.$('reset-btn').addEventListener("click", function(e) {
	//	_.$('min-degree').value = 0;
	//	_.$('min-degree-val').textContent = '0';
	//	_.$('node-category').selectedIndex = 0;
	//	filter.undo().apply();
	//	_.$('dump').textContent = '';
	//	_.hide('#dump');
	//});


}

sigma.classes.graph.addMethod('neighbors', function(nodeId) {
	var i,
			neighbors = {},
			index = this.allNeighborsIndex.get(nodeId).keyList() || {};
	for (i = 0; i < index.length; i++) {
		neighbors[index[i]] = this.nodesIndex.get(index[i]);
	}
	return neighbors;
});

function onMainView(e){
	com.vis.wiki.sigma.graph.clear();
	com.vis.wiki.sigma.refresh();
	lunchGraph('assets/data/main.gexf');
	$("#nav-link-secondary").addClass("hidden");
	$("#nav-link-in").addClass("hidden");

};


function onClick(e){
	//alert(e.data.node.label + ' ' +e.data.node.attributes['0'] + ' clicked !');
	e.target.settings('labelThreshold',8);
	if(e.data.node.attributes && e.data.node.attributes['0']){
		e.target.graph.clear();
		e.target.refresh();
		lunchGraph('assets/data/' + e.data.node.attributes['0']);
		$("#nav-link-secondary").html("<strong>" + e.data.node.label.toUpperCase()+ "</strong>");
		$("#nav-link-secondary").removeClass("hidden");
		$("#nav-link-in").removeClass("hidden");
	}

};
function onHover(e){
	//var neighbors = e.target.graph.neighbors(e.data.current.nodes[0].id);
	var filter = sigma.plugins.filter(com.vis.wiki.sigma);
	filter
			.undo('node-hover')
			.apply();
	if(com.vis.wiki.hoverTimer){
		clearTimeout(com.vis.wiki.hoverTimer);
	}

	if(e.data.current.nodes[0]){
		var origThreshold = e.target.settings('labelThreshold');
		com.vis.wiki.hoverTimer = setTimeout(function(){
			e.target.settings('labelThreshold',0);
			filter
					.neighborsOf(e.data.current.nodes[0].id,'node-hover')
					.apply();
			e.target.settings('labelThreshold',origThreshold);
		}, 800);

	}

};

function lunchGraph(file_to_open) {
	$('.graph-spinner').removeClass('hidden');
	 sigma.parsers.gexf(file_to_open, {
		container: 'graph-container',
		renderer: {
			type: 'canvas',
			container: 'graph-container'
		},
		settings: {
//        edgeColor: 'default',
//        defaultEdgeColor: '#ccc',
			"nodeBorderSize": 1,//Something other than 0
			"nodeBorderColor": "default",//exactly like this
			"defaultNodeBorderColor": "#696969",//Any color of your choice
			"defaultBorderView": "always",
			"labelThreshold": file_to_open.search("main.gexf")>-1 ? 0:5 ,
			"defaultLabelSize":11,
			"labelAlignment":"center",
			"fontStyle":"bold"


		}
	}, function (s) {
		filter = sigma.plugins.filter(s);
		updatePane(s.graph, filter);
		s.bind('clickNode', onClick);
		s.bind('hovers',onHover);
		com.vis.wiki.sigma= s;
		function applyMinDegreeFilter(e) {
			var v = e.target.value;
			//_.$('min-degree-val').textContent = v;

			filter
				.undo('min-degree')
				.nodesBy(
					function (n, options) {
						return this.graph.degree(n.id) >= options.minDegreeVal;
					},
					{
						minDegreeVal: +v
					},
					'min-degree'
				)
				.apply();
		}


		function applyCategoryFilter(e) {
			//var c = e.target[e.target.selectedIndex].value;

			var c = [];
			$( "#node-category input" ).each(function(i, el){
				var elem = $( el );
				if(elem.context.checked){
					c.push(elem.context.id);
				}
			})
			filter
				.undo('node-category')
				.nodesBy(
					function (n, options) {
						return !c.length || $.inArray(n.attributes[options.property], c) !== -1;
					},
					{
						property: '1'
					},
					'node-category'
				)
				.apply();
		}

		_.$('min-degree').addEventListener("input", applyMinDegreeFilter);  // for Chrome and FF
		_.$('min-degree').addEventListener("change", applyMinDegreeFilter); // for IE10+, that sucks
		_.$('node-category').addEventListener("change", applyCategoryFilter);
		 $('.graph-spinner').addClass('hidden')
	});
}