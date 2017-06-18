import React, { Component } from 'react';
import * as d3 from "d3";
import './index.css';
import _ from 'lodash';
import { uploadAction, svg_to_pdf, download_pdf, sendInitReq } from './helper';
import moment from 'moment';
import { SketchPicker } from 'react-color';
import { Slider, Popover, Button } from 'antd';

var line = d3.line().curve(d3.curveBasis);

class Whiteboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      thickness: 3,
      color: "black",
      visible: false,
    };
    this.svgRef = null;
    this.svg = null;
    this.timestamp = 0;
    this.init = true;
    this.peerCreated = props.peerCreated;
    this.history = [];
    this.dragstarted = this.dragstarted.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);
    this.onChangeThickness = this.onChangeThickness.bind(this);
    this.handleVisibleChange = this.handleVisibleChange.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.peerCreated = nextProps.peerCreated;
  }

  componentDidMount() {
    var thisObj = this;
    this.svg = d3.select(this.svgRef)
    .call(d3.drag()
        .container(function() { return this; })
        .subject(function() { var p = [d3.event.x, d3.event.y]; return [p, p]; })
        .on("start", this.dragstarted));

    if (thisObj.props.type === "webrtc" && thisObj.peerCreated) {
      sendInitReq(this.props.rtc)
      .then((snap) => {
        console.log(snap);
        var history = snap.data.payload.history;
        _.forEach(history, (action) => {
          var data = action.data;
          var thickness = action.thickness;
          var color = action.color;
          var remote = this.svg.append("path")
            .attr("class", "my-path")
            .attr("stroke", color)
            .attr("stroke-width", thickness)
            .datum(data);
          remote.attr("d", line);
        });
        this.history = history;
        this.init = false;
      })
      .catch((err) => {
        console.log("fuck", err);
      });
    }

    this.props.rtc.on('channelMessage', (room, label, message) => {
      console.log("message received");
      console.log("label => ", label);
      console.log("message => ", message);
      if (label === "whiteboard" && message.type === "initReq" && this.history.length !== 0) {
        this.props.rtc.sendDirectlyToAll(
          "whiteboard",
          "initRes",
          {
            history: this.history,
          }
        );
      }
      if (label === "whiteboard" && message.type === "action") {
        var action = message.payload.action;
        this.history.push(action);
        var data = action.data;
        var thickness = action.thickness;
        var color = action.color;
        var remote = this.svg.append("path")
          .attr("class", "my-path")
          .attr("stroke", color)
          .attr("stroke-width", thickness)
          .datum(data);
        remote.attr("d", line);
      }
    });

    this.props.fb.on('child_added', (snap) => {
      var content = snap.val();
      console.log(content);
      if (content.timestamp !== this.timestamp) {
        var data = content.action.data;
        var thickness = content.action.thickness;
        var color = content.action.color;
        var remote = this.svg.append("path")
          .attr("class", "my-path")
          .attr("stroke", color)
          .attr("stroke-width", thickness)
          .datum(data);
        remote.attr("d", line);
        this.timestamp = content.timestamp;
      }
    });
  }

  dragstarted() {
    console.log("drag started");
    var d = d3.event.subject,
        active = this.svg.append("path")
        .attr("class", "my-path")
        .attr("stroke", this.state.color)
        .attr("stroke-width", this.state.thickness)
        .datum(d),
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
      var timestamp = moment().valueOf();
      this.timestamp = timestamp;
      var action = {
        data: d,
        thickness: this.state.thickness,
        color: this.state.color,
      };
      if (this.props.type === "webrtc") {
        this.history.push(action);
        console.log(this.history);
      }
      uploadAction(action, this.props.rtc, this.props.fb, this.props.type, timestamp);
      console.log("message sent");
    });
  }

  handleColorChange(color, event) {
    this.setState({ color: color.hex });
  }

  onChangeThickness(val) {
    this.setState({ thickness: val });
  }

  handleVisibleChange(visible) {
    this.setState({ visible });
  }

  handleDownload() {
    svg_to_pdf(this.svgRef, function (pdf) {
      download_pdf('SVG.pdf', pdf.output('dataurlstring'));
    });
  }

  render() {
    return (
      <div>
        <svg width="845px" height="595px" ref={(ref) => this.svgRef = ref}>
          <rect className="whiteboard-background"></rect>
        </svg>
        <div className="whiteboard-button">
          <Popover
            content={
              <div className="whiteboard-popover-container">
                <div>
                  <SketchPicker
                    color={ this.state.color }
                    onChange={this.handleColorChange}
                    />
                </div>
                <div className="whiteboard-slider">
                  <Slider
                    min={1}
                    max={50}
                    onChange={this.onChangeThickness}
                    value={this.state.thickness}
                    />
                </div>
                <Button
                  icon="download"
                  onClick={this.handleDownload}
                  className="whiteboard-download-btn"
                  >
                  Download
                </Button>
              </div>
            }
            trigger="click"
            placement="bottomRight"
            visible={this.state.visible}
            onVisibleChange={this.handleVisibleChange}
            >
            <Button
              icon="edit"
              type="primary"
              >
              Color Stroke and Download
            </Button>
          </Popover>
        </div>
      </div>
    );
  }
}

export default Whiteboard;
