import React, { Component } from 'react';
import * as d3 from "d3";
import './index.css';
import _ from 'lodash';

var line = d3.line().curve(d3.curveBasis);

class Whiteboard extends Component {
  constructor(props) {
    super(props);
    this.svgRef = null;
    this.svg = null;
    this.buffer = [];
    this.dragstarted = this.dragstarted.bind(this);
  }

  componentDidMount() {
    this.svg = d3.select(this.svgRef)
    .call(d3.drag()
        .container(function() { return this; })
        .subject(function() { var p = [d3.event.x, d3.event.y]; return [p, p]; })
        .on("start", this.dragstarted));

    this.props.rtc.on('channelMessage', (room, label, message) => {
      console.log("message received");
      console.log("label => ", label);
      console.log("message => ", message);
      var d = message.payload.d;
      var remote = this.svg.append("path").datum(d);
      remote.attr("d", line);
    });
  }

  dragstarted() {
    console.log("drag started");
    var d = d3.event.subject,
        active = this.svg.append("path").datum(d),
        x0 = d3.event.x,
        y0 = d3.event.y;

    d3.event.on("drag", () => {
      var x1 = d3.event.x,
          y1 = d3.event.y,
          dx = x1 - x0,
          dy = y1 - y0;

      if (dx * dx + dy * dy > 100) {
        d.push([x0 = x1, y0 = y1]);
      } else {
        d[d.length - 1] = [x1, y1];
      }
      active.attr("d", line);
    });

    d3.event.on("end", () => {
      console.log("drag ended");
      this.props.rtc.sendDirectlyToAll(
        "whiteboard",
        "end",
        { d: d,}
      );
    });
  }

  render() {
    return (
      <div>
        <svg width="960" height="500" ref={(ref) => this.svgRef = ref}>
          <rect fill="#fff" width="100%" height="100%"></rect>
        </svg>
      </div>
    );
  }
}

export default Whiteboard;
