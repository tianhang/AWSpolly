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
  init();

  function init() {
    getAccessToken();
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

  $scope.uploadText = function() {
    console.log($scope.text);
    //var API = "http://vop.baidu.com/server_api";
    var API = "http://localhost:5000/uploadText";
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
            console.log(e.target.responseText);
            //$scope.result = window.URL.createObjectURL(e.target.responseText);
            $scope.result = e.target.responseText;
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
}]);