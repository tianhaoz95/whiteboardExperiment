import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import * as firebase from 'firebase';

var config = {
  apiKey: "AIzaSyAkfhXbHKoSuF0X3zjvvJpEgka847punOk",
  authDomain: "tests-557c1.firebaseapp.com",
  databaseURL: "https://tests-557c1.firebaseio.com",
  projectId: "tests-557c1",
  storageBucket: "tests-557c1.appspot.com",
  messagingSenderId: "869037115426"
};
firebase.initializeApp(config);

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
