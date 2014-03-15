/**
 * Created by hen on 3/8/14.
 */
 
 

var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 1060 - margin.left - margin.right;
var height = 800 - margin.bottom - margin.top;
var centered;

var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300
};

var detailVis = d3.select("#detailVis").append("svg").attr({
    width:350,
    height:200
})

var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
    })

var svg = canvas.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });


var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);//.precision(.1);

var path = d3.geo.path().projection(projection);


var dataSet = {};

var screencoord = projection([-71.06, 42.36]);

var g = svg.append("g");

var completeDataSet;


radScale = d3.scale.linear(); 

function loadStations() {
    d3.csv("../data/NSRDB_StationsMeta.csv",function(error,data){
    		    
    		    
    		    
    		    
    	// Some locations fall outside our map; just remove them
    	// I used a filter without being told to!  Yay!
    	var cleandata = data.filter(function(d){
    		if (projection([parseFloat(d['NSRDB_LON(dd)']), parseFloat(d['NSRDB_LAT (dd)'])]))
    		{
    			return d;
    		}
    	});
    	
    	console.log(completeDataSet);
    	
    	var stations = g.selectAll("circle")
		.data(cleandata)
		.enter()
		.append("circle")
    		.attr("class", "station")
		.attr("cx", function(d) {
			screencoord = projection([parseFloat(d['NSRDB_LON(dd)']), parseFloat(d['NSRDB_LAT (dd)'])]);
			if (screencoord)
			{
				return screencoord[0];
			}
			return 0;
		})
		.attr("cy", function(d) {
			screencoord = projection([parseFloat(d['NSRDB_LON(dd)']), parseFloat(d['NSRDB_LAT (dd)'])]);
			if (screencoord)
			{
				return screencoord[1];
			}
			return 0;
		})
		.attr("r", function(d){
			if (completeDataSet[d.USAF] && completeDataSet[d.USAF].sum > 0)
			{
				console.log(completeDataSet[d.USAF].sum);
				return radScale(completeDataSet[d.USAF].sum);
			}
			return 1
		});
		
	stations.classed("hasData", function(d) {
		if (completeDataSet[d.USAF] && completeDataSet[d.USAF].sum > 0)
		{
			return true;
		}
		return false;
	});
    		    
	//loadStats();
    });
}


function loadStats() {

    d3.json("../data/reducedMonthStationHour2003_2004.json", function(error,data){
        completeDataSet= data;

        // Can't use raw data for circle radiuses (unless we like a big 
        // blue block instead of a map) so make a scale
        
        
	var max = d3.max(completeDataSet, function(d) {
		console.log(d);
		return d.sum;
	});
	
        
        radScale.domain([0, 100000000]).range([0, 10]);
        
        console.log(radScale.domain());
	
        loadStations();
    })

}


d3.json("../data/us-named.json", function(error, data) {

	var usMap = topojson.feature(data,data.objects.states).features;
	
	
	/*svg.selectAll(".states")
		.data(usMap)
		.enter()
		.append("path")
		.attr("class", "state")
		.attr("d", path)
		.on("click", clicked);*/
		
	
	// Use nested groups like in example to facilitate zooming	
	g.append("g")
		.attr("id", "states")
		.selectAll("path")
		.data(usMap)
		.enter()
		.append("path")
		.attr("class", "state")
		.attr("d", path)
		.on("click", clicked);
		
	
	// Test point placement and zooming with Boston
	/*var screencoord = projection([-71.06, 42.36]);
	var boston = g.append("circle")
		.attr("cx", screencoord[0])
		.attr("cy", screencoord[1])
		.attr("r", 2)
		.attr("fill", "red");*/
	
        loadStats();
});



// ALL THESE FUNCTIONS are just a RECOMMENDATION !!!!
var createDetailVis = function(){

}


var updateDetailVis = function(data, name){
  
}



// ZOOMING
function clicked(d) 
{
	var x, y, k;
	
	if (d && centered !== d) 
	{
		var centroid = path.centroid(d);
		x = centroid[0];
		y = centroid[1];
		k = 4;
		centered = d;
	} 
	else 
	{
		x = width / 2;
		y = height / 2;
		k = 1;
		centered = null;
	}
	
	g.selectAll("path")
		.classed("active", centered && function(d) 
		{ return d === centered; });
	
	g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
		.style("stroke-width", 1 / k + "px");
}

