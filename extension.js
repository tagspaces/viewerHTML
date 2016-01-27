/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

define(function(require, exports, module) {
  "use strict";

  console.log("Loading viewerHTML");

  var extensionID = "viewerHTML"; // ID should be equal to the directory name where the ext. is located
  var extensionSupportedFileTypes = ["html", "htm"];

  var TSCORE = require("tscore");

  var containerElID;
  var $containerElement;
  var currentFilePath;

  var extensionDirectory = TSCORE.Config.getExtensionPath() + "/" + extensionID;

  function init(filePath, containerElementID) {
    console.log("Initalization HTML Viewer...");
    containerElID = containerElementID;
    $containerElement = $('#' + containerElID);

    currentFilePath = filePath;
    $containerElement.empty();
    $containerElement.css("background-color", "white");
    $containerElement.append($('<iframe>', {
      "sandbox": "allow-same-origin allow-scripts allow-modals",
      "id": "iframeViewer",
      "nwdisable": "",
      //"nwfaketop": "",
      "src": extensionDirectory + "/index.html?&locale=" + TSCORE.currentLanguage,
    }));
    
    TSCORE.IO.loadTextFilePromise(filePath).then(function(content) {
      exports.setContent(content);
    }, 
    function(error) {
      TSCORE.hideLoadingAnimation();
      TSCORE.showAlertDialog("Loading " + filePath + " failed.");
      console.error("Loading file " + filePath + " failed " + error);
    });
    /*window.addEventListener("message", receiveMessage, false);
    function receiveMessage(event) {
      console.log("Test event: " + event);
      if (event.origin !== "http://example.org:8080") {
        //TSCORE.openLinkExternally();
      }
    }*/

    /* var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
    eventer(messageEvent,function(e) {
        var key = e.message ? "message" : "data";
        var data = e[key];
        console.log("Message: " + e);
    },false); */

  };

  function setFileType(fileType) {

    console.log("setFileType not supported on this extension");
  };

  function viewerMode(isViewerMode) {

    console.log("viewerMode not supported on this extension");
  };

  function setContent(content) {
    var fileDirectory = TSCORE.TagUtils.extractContainingDirectoryPath(currentFilePath);

    var bodyRegex = /\<body[^>]*\>([^]*)\<\/body/m; // jshint ignore:line
    var bodyContent;

    try {
      bodyContent = content.match(bodyRegex)[1];
    } catch (e) {
      console.log("Error parsing the body of the HTML document. " + e);
      bodyContent = content;
    }

    // removing all scripts from the document
    var cleanedBodyContent = bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

    var contentWindow = document.getElementById("iframeViewer").contentWindow;
    if (typeof contentWindow.setContent === "function") {
      contentWindow.setContent(cleanedBodyContent, fileDirectory);
    } else {
      // TODO optimize setTimeout
      window.setTimeout(function() {
        contentWindow.setContent(cleanedBodyContent, fileDirectory);
      }, 500);
    }
  };

  function getContent() {

    console.log("Not implemented");
  };
  
  exports.init = init;
  exports.getContent = getContent;
  exports.setContent = setContent;
  exports.viewerMode = viewerMode;
  exports.setFileType = setFileType;

});
