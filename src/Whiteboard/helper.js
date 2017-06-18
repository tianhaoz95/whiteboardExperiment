import moment from 'moment';
import { svgAsDataUri } from 'save-svg-as-png';
import jsPDF from 'jspdf';

export function uploadActionToFirebase(action, ref, timestamp) {
  return new Promise((resolve, reject) => {
    var pushRef = ref.push();
    pushRef.set({
      action: action,
      timestamp: timestamp,
    })
    .then(() => {
      resolve({
        type: "success",
        payload: null,
      });
    })
    .catch((err) => {
      reject({
        type: "fail",
        payload: err,
      });
    });
  });
}

export function uploadActionToRtc(action, rtc, timestamp) {
  rtc.sendDirectlyToAll(
    "whiteboard",
    "action",
    {
      action: action,
      timestamp: timestamp,
    }
  );
}

export function uploadAction(action, rtc, fb, type, timestamp) {
  switch (type) {
    case "webrtc": {
      uploadActionToRtc(action, rtc, timestamp);
      break;
    }

    case "firebase": {
      uploadActionToFirebase(action, fb, timestamp)
      .then(() => {
        console.log("action uploaded to firebase");
      })
      .catch((err) => {
        console.log("fuck", err);
      });
      break;
    }

    default: console.log("you are a long way from home");
  }
}

export function svg_to_pdf(svg, callback) {
  svgAsDataUri(svg, {}, function(svg_uri) {
    var image = document.createElement('img');

    image.src = svg_uri;
    image.onload = function() {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      var doc = new jsPDF('landscape', 'pt');
      var dataUrl;

      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, image.width, image.height);
      dataUrl = canvas.toDataURL('image/jpeg');
      doc.addImage(dataUrl, 'JPEG', 0, 0, image.width, image.height);

      callback(doc);
    }
  });
}

export function download_pdf(name, dataUriString) {
  var link = document.createElement('a');
  link.addEventListener('click', function(ev) {
    link.href = dataUriString;
    link.download = name;
    document.body.removeChild(link);
  }, false);
  document.body.appendChild(link);
  link.click();
}

export function sendInitReq(rtc) {
  return new Promise((resolve, reject) => {
    var count = 0;
    var req = setInterval(() => {
      console.log("sending initial request");
      rtc.sendDirectlyToAll("whiteboard", "initReq", null);
      count = count + 1;
      if (count === 15) {
        clearInterval(req);
        reject({
          type: "fail",
          description: "no response for initialize"
        });
      }
    }, 200);
    rtc.on('channelMessage', (room, label, message) => {
      if (label === "whiteboard" && message.type === "initRes") {
         clearInterval(req);
         resolve({
           type: "success",
           description: "got initialize response",
           data: message,
         });
      }
    });
  });
}
