
import React, { Component } from 'react';
import * as d3 from 'd3'
import './SimpleChart.css';
// const flare = require('./flare.json');


class SimpleChart extends Component {

  componentDidMount() {

    var svg = d3.select(this.chartRef),
        width = +svg.attr("width"),
        height = +svg.attr("height"),
        g = svg.append("g").attr("transform", "translate(230,0)");

    var tree = d3.tree()
        .size([height - 400, width - 5]);

    var cluster = d3.cluster()
        .size([height, width - 500]);

    var stratify = d3.stratify()
        .parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf(".")); });

    var INITIAL_ID = '00000000'
    var OBJECT_TYPE_ORGANIZATION = 'O'
    var OBJECT_TYPE_POSITION = 'S'

    var orgStratify = d3.stratify()
                        .parentId( d => {

                          // if (d.OrganizationId === '00000000') {
                          //   return null
                          // }

                          if (d.ObjectType === OBJECT_TYPE_POSITION) {
                            if (d.OrganizationId === INITIAL_ID) {
                              return null
                            }
                            return d.OrganizationId;
                          } else {
                            if (d.ParentOrganizationId === INITIAL_ID) {
                              return null
                            }
                            return d.ParentOrganizationId
                          }

                          // if (!d.ManagerPositionId) {
                          //   console.log(d.ObjectId)
                          // }
                          //
                          //
                          // return d.ManagerPositionId

                          // if (!d.ManagerPositionId) {
                          //   return d.
                          // }

                          // return d.OrganizationId
                        } )
                        .id( d => {
                          if (d.ObjectType === OBJECT_TYPE_ORGANIZATION ) {
                            return d.ObjectId // should probably mix in type
                          }
                        } )

    d3.json(process.env.PUBLIC_URL + '/data/bestrun.json', (error,data) => {
      if (error) throw error;

      var flatHierarchyData = data.d.EmployeeHierarchy.results.filter( d => {

        if (d.ObjectType === OBJECT_TYPE_POSITION && d.HasTeam) {
          return false; // displayed by the org objects
        }
        // if (!d.ManagerPositionId) {
        //   return false;
        // }

        // if (d.ObjectId === '50014625'){
        //   return false;
        // }

        // if (d.ObjectType === 'O') {
        //   return false;
        // }

        return true;
      } )
      var root = orgStratify(flatHierarchyData)
      cluster(root);

      var link = g.selectAll(".link")
          .data(root.descendants().slice(1))
        .enter().append("path")
          .attr("class", "link")
          .attr("d", diagonal);

      var node = g.selectAll(".node")
          .data(root.descendants())
        .enter().append("g")
          .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

      node.append("circle")
          .attr("r", 2.5);

      node.append("text")
          .attr("dy", 3)
          .attr("x", function(d) { return d.children ? -8 : 8; })
          .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
          .text(function(d) {


          if ( d.data.ObjectType === OBJECT_TYPE_ORGANIZATION ) {
            return 'Org: ' + d.data.OrganizationName + ' - ' + ( d.data.EmployeeName === '' ? 'vacant' : d.data.EmployeeName )
          }

            if (d.data.EmployeeName || d.data.PositionName) {
              return d.data.EmployeeName + ` (${d.data.PositionName})`
            } else {
              // Empty position, return org/pos
              return 'Org: ' + d.data.OrganizationName + d.data.ManagerName
            }
          });

      d3.selectAll("input")
          .on("change", changed);

      var timeout = setTimeout(function() {
        d3.select("input[value=\"tree\"]")
            .property("checked", true)
            .dispatch("change");
      }, 1000);

      function changed() {
        timeout = clearTimeout(timeout);
        (this.value === "tree" ? tree : cluster)(root);
        var t = d3.transition().duration(750);
        node.transition(t).attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
        link.transition(t).attr("d", diagonal);
      }
    });

    // d3.csv(process.env.PUBLIC_URL + "flare.csv", function(error, data) {
    //   if (error) throw error;
    //
    //   var root = stratify(data)
    //       .sort(function(a, b) { return (a.height - b.height) || a.id.localeCompare(b.id); });
    //
    //   cluster(root);
    //
    //   var link = g.selectAll(".link")
    //       .data(root.descendants().slice(1))
    //     .enter().append("path")
    //       .attr("class", "link")
    //       .attr("d", diagonal);
    //
    //   var node = g.selectAll(".node")
    //       .data(root.descendants())
    //     .enter().append("g")
    //       .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
    //       .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
    //
    //   node.append("circle")
    //       .attr("r", 2.5);
    //
    //   node.append("text")
    //       .attr("dy", 3)
    //       .attr("x", function(d) { return d.children ? -8 : 8; })
    //       .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
    //       .text(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1); });
    //
    //   d3.selectAll("input")
    //       .on("change", changed);
    //
    //   var timeout = setTimeout(function() {
    //     d3.select("input[value=\"tree\"]")
    //         .property("checked", true)
    //         .dispatch("change");
    //   }, 1000);
    //
    //   function changed() {
    //     timeout = clearTimeout(timeout);
    //     (this.value === "tree" ? tree : cluster)(root);
    //     var t = d3.transition().duration(750);
    //     node.transition(t).attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
    //     link.transition(t).attr("d", diagonal);
    //   }
    // });

    function diagonal(d) {
      return "M" + d.y + "," + d.x
          + "C" + (d.parent.y + 100) + "," + d.x
          + " " + (d.parent.y + 100) + "," + d.parent.x
          + " " + d.parent.y + "," + d.parent.x;
    }


  }
  render() {
    return <div>
      <svg className="chart" width="1280" height="2400" ref={ ref => this.chartRef = ref }>
      </svg>
    </div>
  }
}

// function Test(props) {
//   return <div>hi from the test component.</div>
// }

export default SimpleChart
