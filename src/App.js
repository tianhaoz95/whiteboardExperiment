import React, { Component } from 'react';
import Whiteboard from './Whiteboard';
import SimpleWebrtc from 'simplewebrtc/src/simplewebrtc';
import * as firebase from 'firebase';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      roomJoined:  false,
      peerCreated: false,
      connected: false,
    };
    this.rtc = new SimpleWebrtc({
      localVideoEl: '',
      remoteVideosEl: '',
      autoRequestMedia: false,
      url: "https://acumany-signal-master.herokuapp.com/",
    });
    this.fb = firebase.database().ref("/TestRoom");
  }

  componentDidMount() {
    this.rtc.on('connectionReady', (sessionId) => {
      console.log("sessionId => ", sessionId);
      this.setState({ connected: true });
      this.rtc.joinRoom("test_room", () => {
        this.rtc.sendDirectlyToAll("whiteboard", "initChannel", null);
        this.setState({ roomJoined: true });
      });
    })

    this.rtc.on('createdPeer', (peer) => {
      console.log(peer);
      this.setState({ peerCreated: true });
    });
  }

  renderNotReady() {
    return(
      <div>
        Not Ready
      </div>
    );
  }

  renderWhiteBoard() {

    return (
      <Whiteboard
        rtc={this.rtc}
        fb={this.fb}
        peerCreated={this.state.peerCreated}
        type="webrtc"/>
    );
  }

  render() {
    let content = null;

    if (this.state.roomJoined && this.state.connected) {
      content = this.renderWhiteBoard();
    }

    return (
      <div className="App">
        {content}
      </div>
    );
  }
}

export default App;
