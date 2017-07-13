// AboutController.js
// For distribution, all controllers
// are concatanated into single app.js file
// by using Gulp

'use strict';

angular.module('mostPopularListingsApp.about', ['ngRoute', 'com.2fdevs.videogular',
  'com.2fdevs.videogular.plugins.controls',
  'com.2fdevs.videogular.plugins.overlayplay',
  'com.2fdevs.videogular.plugins.buffering',
  'com.2fdevs.videogular.plugins.poster'
])

// Routing configuration for this module
.config(['$routeProvider', function($routeprovider) {
  $routeprovider.when('/about', {
    controller: 'AboutController',
    templateUrl: 'components/views/aboutView.html'
  });
}])

// Controller definition for this module
.controller('AboutController', ['$scope', '$http', '$sce', '$interval', function($scope, $http, $sce, $interval) {

  // Just a housekeeping.
  // In the init method we are declaring all the
  // neccesarry settings and assignments to be run once
  // controller is invoked
  var self = this;



  function getCuePoint(startSec, msg, idx, func) {
    func = func || self.onConsoleCuePoint;
    //console.log(func);
    return {
      timeLapse: {
        start: startSec,
      },
      onEnter: self.onConsoleCuePoint.bind(self),
      params: {
        message: msg,
        id: idx
      }
    }
  }

  function initMp3(url, lrc) {
    //getAccessToken();
    self.ap = new APlayer({
      element: document.getElementById('player1'), // Optional, player element
      narrow: false, // Optional, narrow style
      autoplay: false, // Optional, autoplay song(s), not supported by mobile browsers
      showlrc: 1, // Optional, show lrc, can be 0, 1, 2, see: ###With lrc
      mutex: true, // Optional, pause other players when this player playing
      theme: '#ad7a86', // Optional, theme color, default: #b7daff
      mode: 'order', // Optional, play mode, can be `random` `single` `circulation`(loop) `order`(no loop), default: `circulation`
      preload: 'metadata', // Optional, the way to load music, can be 'none' 'metadata' 'auto', default: 'auto'
      listmaxheight: '513px', // Optional, max height of play list
      music: { // Required, music info, see: ###With playlist
        title: 'Text to Speech', // Required, music title
        author: 'Joanna', // Required, music author
        url: url, // Required, music url
        pic: 'http://devtest.qiniudn.com/Preparation.jpg', // Optional, music picture
        lrc: lrc // Optional, lrc, see: ###With lrc
      }
    });
  };




  function getAccessToken() {
    var conf = {
      url: "http://localhost:5000/getToken",
      method: 'GET',
    }
    $http(conf).then(function(data) {
      console.log("token:", data.data.access_token);
      self.access_token = data.data.access_token;
    }, function(error) {
      console.log(error);
    });
  }
  var markMap = {};

  self.speechText = "";

  function getSpeechMark(txt) {
    var conf = {
      url: "http://localhost:3000/marks",
      method: 'POST',
      data: { text: txt }
    }
    $http(conf).then(function(data) {
      //console.log("marks:", data.data);
      //console.log("json:", JSON.parse(data.data));
      //self.access_token = data.data.access_token;
      var marks = data.data;
      var markList = (marks.split('\n'));
      // console.log(markList);
      self.markList = [];
      var lyricsStr = "";
      var dom = document.getElementById('lyrics');
      angular.forEach(markList, function(item, idx) {
        if (item.length) {
          var obj = JSON.parse(item);
          // || obj.type == "word"
          if (obj.type == "word") {
            var tm = parseInt(obj.time)
            self.markList.push(obj);
            self.config.cuePoints.console.push(getCuePoint(obj.time / 1000, obj.value, idx));
            console.log("--2-");
            markMap[tm] = obj;

            var lyTime = formatSeconds(tm / 1000);
            var item = "[" + lyTime + "]" + obj.value + "\n";
            lyricsStr += item;

            // var spanNode = document.createElement("span");
            // spanNode.id = idx;
            // spanNode.innerText = obj.value + " ";
            // dom.appendChild(spanNode);
            //var text = "<span id='" + idx + "'>" + obj.value + "</span>";
            //self.speechText += text;
          }
        }
      });


      console.log(self.config.cuePoints);

      //console.log(lyricsStr);
      console.log("--mark map--");
      console.log(markMap);
      initMp3($scope.result, lyricsStr);
      console.log("----");
    }, function(error) {
      console.log(error);
    });
  }



  $scope.uploadText = function() {
    console.log($scope.text);
    //var API = "http://vop.baidu.com/server_api";
    var API = "http://localhost:3000/tts";
    var token = self.access_token;
    var text = $scope.text;
    //提交到服务器

    uploadFile(API, token, text, function(state, e) {
      switch (state) {
        case 'uploading':
          var percentComplete = Math.round(e.loaded * 100 / e.total) + '%';
          console.log(percentComplete);
          break;
        case 'ok':
          //alert(e.target.responseText);
          //alert(e.target.responseText);
          $scope.$apply(function() {
            //console.log(e.target.responseText);
            //$scope.result = window.URL.createObjectURL(e.target.responseText);
            var base64 = "data:audio/mpeg;base64,";
            $scope.result = base64 + e.target.responseText;

            //           this.media = [{
            // sources: [{
            //   src: $sce.trustAsResourceUrl("http://static.videogular.com/assets/audios/videogular.mp3"),
            //   type: "audio/mpeg"
            // }, ],
            self.media[0].sources[0].src = $scope.result;
            self.config.sources = self.media[0].sources;
            console.log(self.config);
            //console.log($scope.result);
            getSpeechMark(text);
          });
          console.log("上传成功");
          console.log(e);
          alert("上传成功");
          break;
        case 'error':
          alert("上传失败");
          break;
        case 'cancel':
          alert("上传被取消");
          break;
      }
    });
  }

  //上传
  function uploadFile(url, token, text, callback) {
    var fd = new FormData();
    fd.append("text", text);
    fd.append("token", token);
    var xhr = new XMLHttpRequest();
    if (callback) {
      xhr.upload.addEventListener("progress", function(e) {
        callback('uploading', e);
      }, false);
      xhr.addEventListener("load", function(e) {
        callback('ok', e);
      }, false);
      xhr.addEventListener("error", function(e) {
        callback('error', e);
      }, false);
      xhr.addEventListener("abort", function(e) {
        callback('cancel', e);
      }, false);
    }
    xhr.open("POST", url);
    xhr.send(fd);
  }

  function formatSeconds(seconds, format) {
    var ms = Math.floor((seconds * 1000) % 1000);
    var s = Math.floor(seconds % 60);
    var m = Math.floor((seconds * 1000 / (1000 * 60)) % 60);
    var strFormat = format || "MM:SS.XX";

    if (s < 10) s = "0" + s;
    if (m < 10) m = "0" + m;
    if (ms < 10) ms = "0" + ms;

    strFormat = strFormat.replace(/MM/, m);
    strFormat = strFormat.replace(/SS/, s);
    strFormat = strFormat.replace(/XX/, ms.toString().slice(0, 2));

    return strFormat;
  }

  //----------------------------------
  this.consoleCuePointsMessages = "click play to see cue points bindings!\n";
  this.API = null;
  this.barChartStyle = {};
  this.textStyle = {};
  this.chapterSelected = {};

  this.onPlayerReady = function(API) {
    this.API = API;
  };

  this.media = [{
    sources: [{
      src: $sce.trustAsResourceUrl("http://static.videogular.com/assets/audios/videogular.mp3"),
      type: "audio/mpeg"
    }, ],
    tracks: [{
      src: "assets/subs/pale-blue-dot.vtt",
      kind: "captions",
      srclang: "en",
      label: "English",
      default: "default"
    }]
  }];

  // Console
  this.onConsoleCuePoint = function onConsoleCuePoint(currentTime, timeLapse, params) {
    //var percent = (currentTime - timeLapse.start) * 100 / (timeLapse.end - timeLapse.start);
    //self.consoleCuePointsMessages = "time: " + currentTime + " -> (start/end/percent) " + timeLapse.start + "/" + timeLapse.end + "/" + percent + "% = " + params.message + "\n";
    //self.consoleCuePointsMessages = "cue time: " + timeLapse.start + "/" + params.message + "\n";
    console.log(currentTime);
    console.log("cue time: " + timeLapse.start + "/" + params.message + "\n");
    self.consoleCuePointsMessages = params.message;
    console.log(params.message);
    var id = params.id;
    self.currIdx = id;

  };





  this.config = {
    playsInline: false,
    autoHide: false,
    autoHideTime: 3000,
    autoPlay: false,
    //sources: this.media[0].sources,
    tracks: this.media[0].tracks,
    loop: false,
    preload: "auto",
    controls: false,
    theme: {
      url: "resources/bower/videogular-themes-default/videogular.css"
    },
    cuePoints: {
      console: [
        // {
        //   timeLapse: {
        //     start: 2
        //   },
        //   onEnter: this.onConsoleCuePoint.bind(this),
        //   //onLeave: this.onConsoleCuePoint.bind(this),
        //   //onUpdate: this.onConsoleCuePoint.bind(this),
        //   //onComplete: this.onConsoleCuePoint.bind(this),
        //   params: {
        //     message: "you can change cue points on the fly!"
        //   }
        // },
        // {
        //   timeLapse: {
        //     start: 3
        //   },
        //   onEnter: this.onConsoleCuePoint.bind(this),
        //   //onLeave: this.onConsoleCuePoint.bind(this),
        //   //onUpdate: this.onConsoleCuePoint.bind(this),
        //   //onComplete: this.onConsoleCuePoint.bind(this),
        //   params: {
        //     message: "because cue points are awesome!"
        //   }
        // },
        // {
        //   timeLapse: {
        //     start: 4
        //   },
        //   onEnter: this.onConsoleCuePoint.bind(this),
        //   //onLeave: this.onConsoleCuePoint.bind(this),
        //   //onUpdate: this.onConsoleCuePoint.bind(this),
        //   //onComplete: this.onConsoleCuePoint.bind(this),
        //   params: {
        //     message: "yay!! ^_^"
        //   }
        // }
      ],
      thumbnails: [{
          timeLapse: {
            start: 30
          },
          params: {
            thumbnail: "assets/thumbnails/30.png"
          }
        },
        {
          timeLapse: {
            start: 49,
            end: 60
          },
          params: {
            thumbnail: "assets/thumbnails/50.png"
          }
        }
      ]
    },
    plugins: {
      poster: {
        url: "assets/images/videogular.png"
      }
    }
  };
}]);