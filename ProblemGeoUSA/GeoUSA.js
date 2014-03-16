/**
 * Created by hen on 3/8/14.
 */
 
 

var margin = {
    top: 20,
    right: 20,
    dright: 100, 
    bottom: 20,
    dbottom: 100,
    left: 20
};

var width = 850 - margin.left - margin.right;
var height = 500 - margin.bottom - margin.top;
var centered;

var dheight = 300,
	dwidth = 500;

var detailVis = d3.select("#detailVis").append("svg").attr({
    width: dwidth,
    height: dheight
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

var detaillabel = detailVis.append("text")
		.attr("x", margin.left)
		.attr("y", margin.top)
		.text("No Station Selected");


var dataSet = {};

var screencoord = projection([-71.06, 42.36]);

var g = svg.append("g");

var completeDataSet;

var bargroups, bars;


var radScale = d3.scale.linear(); 
var yScale = d3.scale.linear();  
var xScale = d3.scale.ordinal().rangeRoundBands([margin.left, dwidth - margin.dright - margin.left], .8, 0).domain(['00:00:00 AM', '01:00:00 AM', '02:00:00 AM', '03:00:00 AM', '04:00:00 AM', '05:00:00 AM', '06:00:00 AM', '07:00:00 AM', '07:00:00 AM', '09:00:00 AM', '10:00:00 AM', '11:00:00 AM', '12:00:00 PM', '13:00:00 PM', '14:00:00 PM', '15:00:00 PM', '16:00:00 PM', '17:00:00 PM', '18:00:00 PM', '19:00:00 PM', '20:00:00 PM', '21:00:00 PM', '22:00:00 PM', '23:00:00 PM', ]);


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
    	
    	// Sort data so the smaller stations will end up written last and 
    	// therefore not be covered up by bigger stations while hovering
    	cleandata.sort(function(a, b) {
    		if (completeDataSet[a.USAF] && completeDataSet[b.USAF])
    		{
    			return d3.descending(completeDataSet[a.USAF].sum, completeDataSet[b.USAF].sum);
    		}
    		return d3.descending(a.USAF, b.USAF);
    	});
    	
    	// Make the empty detail vis
    	createDetailVis();
    	
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
				return radScale(completeDataSet[d.USAF].sum);
			}
			return 1
		})
		.on("mouseover", function(d){
			// Need to come back and make this not grow when zoomed, it's a little crazy this way
			g.append("foreignObject")
				.attr("id", "hovernode")
				.attr("x", function() {
					screencoord = projection([parseFloat(d['NSRDB_LON(dd)']), parseFloat(d['NSRDB_LAT (dd)'])]);
					if (screencoord)
					{
						return screencoord[0] + 3;
					}
					return 0;
				})
				.attr("y", function() { 
					screencoord = projection([parseFloat(d['NSRDB_LON(dd)']), parseFloat(d['NSRDB_LAT (dd)'])]);
					if (screencoord)
					{
						return screencoord[1] + 3;
					}
					return 0;
				 })
				.attr("width", 300)
				.attr("height", 40)
				.html(function(){
					return "<p class=\"tooltip\"><span>" + d.STATION + ": " + completeDataSet[d.USAF].sum + "</span></p>";
				});
		})
		.on("mouseout", function(){	
			d3.selectAll("#hovernode")
				.transition()
				.duration(100)
				.remove();
		})
		.on("click", updateDetailVis);
		
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
        completeDataSet = data;

        // Can't use raw data for circle radiuses (unless we like a big 
        // blue block instead of a map) so make a scale
        
        var max = 0,
        	detailmax = 0;
        
	for (var key in data) {
		max = Math.max(max, data[key].sum);
		
		for (var dkey in data[key].hourly) {
			detailmax = Math.max(detailmax, data[key].hourly[dkey]);
		}
	}
	
	// 1's a little small to hover over, so we make 2 the lower limit
        radScale.domain([0, max]).range([2, 10]);
        yScale.domain([detailmax, 0]).range([margin.top, dheight - margin.dbottom]);
	
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


// Make Detail
var createDetailVis = function(){

	
		var xAxis = d3.svg.axis().scale(xScale).orient("bottom")
		var yAxis = d3.svg.axis().scale(yScale).orient("right");
		
		
		detailVis.append("g")
			.attr("id", "xaxis")
			.attr("class", "axis")
			.attr("transform", "translate(0," + (dheight - margin.dbottom) + ")")
			.call(xAxis)
			.selectAll("text")  
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", ".15em")
			.attr("transform", function(d) {
				return "rotate(-65)" 
			});
			
		detailVis.append("g")
			.attr("id", "yaxis")
			.attr("class", "axis")
			.attr("transform", "translate(" + (dwidth - margin.dright - margin.left) + ", 0)")
			.call(yAxis);
			
		
		bargroups = detailVis.append("g")
			.selectAll("g")
			.data(xScale.domain())
			.enter()
			.append("g")
			.attr("id", function(d){
				return "bar" + d[0] + d[1];
			})
			.attr("transform", function(d, i) { 
				return "translate(" + xScale(d) +", 0)"; });
			
		
		bars = bargroups.append("rect")
			.attr("width", 10)
			.attr("height", 0)
			.attr("y", function(d) {
					return (dheight - margin.dbottom);
				})
			.attr("fill", "black");
		
			
}


// Change Detail
var updateDetailVis = function(data, name){
	detaillabel.text(data.STATION);
	
	bargroups.selectAll("rect")
		.transition()
		.attr("height", function(d){
			console.log(yScale(completeDataSet[data.USAF].hourly[d]));
			return (dheight - margin.dbottom) - yScale(completeDataSet[data.USAF].hourly[d]);
		})
		.attr("y", function(d) {
			return yScale(completeDataSet[data.USAF].hourly[d]);
		});
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

