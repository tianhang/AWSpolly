// AboutController.js
// For distribution, all controllers
// are concatanated into single app.js file
// by using Gulp

'use strict';

angular.module('mostPopularListingsApp.about', ['ngRoute'])

// Routing configuration for this module
.config(['$routeProvider', function($routeprovider) {
  $routeprovider.when('/about', {
    controller: 'AboutController',
    templateUrl: 'components/views/aboutView.html'
  });
}])

// Controller definition for this module
.controller('AboutController', ['$scope', '$http', function($scope, $http) {

  // Just a housekeeping.
  // In the init method we are declaring all the
  // neccesarry settings and assignments to be run once
  // controller is invoked
  var self = this;
  //init();

  // Get the video element with id="myVideo"
  var vid = document.getElementById("myVideo");

  // Attach a "timeupdate" event to the video
  vid.addEventListener("timeupdate", getCurTime);

  vid.onplay = function() {
    myTimer();

  };
  // Display the current playback position of the video in a p element with id="demo"
  function getCurTime() {
    //document.getElementById("demo").innerHTML = "The current playback position is " + vid.currentTime + " seconds.";
    //console.log(vid.currentTime * 1000)
    var currtime = vid.currentTime * 1000;
  }

  function myTimer() {
    setInterval(function() {
      //console.log(vid.currentTime * 1000); // will get you a lot more updates.
      var time = parseInt(vid.currentTime * 1000);
      console.log(markMap[time]);
    }, 1);
  }

  $scope.playRecording = function() {
    console.log('play..');
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

      var lyricsStr = "";
      markList.forEach(function(item) {
        if (item.length) {
          var obj = JSON.parse(item);
          // || obj.type == "word"
          if (obj.type == "word") {
            var tm = parseInt(obj.time)
              // markMap[tm] = obj.value;
            console.log(tm);
            console.log(tm / 1000);
            console.log(formatSeconds(tm / 1000));
            var lyTime = formatSeconds(tm / 1000);
            var item = "[" + lyTime + "]" + obj.value + "\n";
            lyricsStr += item;
          }
        }
      });

      console.log(lyricsStr);
      //console.log($scope.result);
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
}]);