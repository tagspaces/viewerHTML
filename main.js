/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

/* globals marked, Mousetrap */
"use strict";

var $htmlContent;

$(document).ready(function() {
  var locale = getParameterByName("locale");

  var searchQuery = getParameterByName("query");

  var extSettings;
  loadExtSettings();

  // Init internationalization
  $.i18n.init({
    ns: {namespaces: ['ns.viewerHTML']},
    debug: true,
    lng: locale,
    fallbackLng: 'en_US'
  }, function() {
    $('[data-i18n]').i18n();
  });

  $htmlContent = $("#htmlContent");

  var styles = ['', 'solarized-dark', 'github', 'metro-vibes', 'clearness', 'clearness-dark'];
  var currentStyleIndex = 0;
  if (extSettings && extSettings.styleIndex) {
    currentStyleIndex = extSettings.styleIndex;
  }

  var zoomSteps = ['zoomSmallest', 'zoomSmaller', 'zoomSmall', 'zoomDefault', 'zoomLarge', 'zoomLarger', 'zoomLargest'];
  var currentZoomState = 3;
  if (extSettings && extSettings.zoomState) {
    currentZoomState = extSettings.zoomState;
  }

  $htmlContent.removeClass();
  $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + " " + zoomSteps[currentZoomState]);

  $("#changeStyleButton").on('click', function() {
    currentStyleIndex = currentStyleIndex + 1;
    if (currentStyleIndex >= styles.length) {
      currentStyleIndex = 0;
    }
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + " " + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $("#resetStyleButton").on('click', function() {
    currentStyleIndex = 0;
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + " " + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $("#zoomInButton").on('click', function() {
    currentZoomState++;
    if (currentZoomState >= zoomSteps.length) {
      currentZoomState = 6;
    }
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + " " + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $("#zoomOutButton").on('click', function() {
    currentZoomState--;
    if (currentZoomState < 0) {
      currentZoomState = 0;
    }
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + " " + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $("#zoomResetButton").on('click', function() {
    currentZoomState = 3;
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + " " + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  function saveExtSettings() {
    var settings = {
      "styleIndex": currentStyleIndex,
      "zoomState": currentZoomState
    };
    localStorage.setItem('viewerHTMLSettings', JSON.stringify(settings));
  }

  function loadExtSettings() {
    extSettings = JSON.parse(localStorage.getItem("viewerHTMLSettings"));
  }

  // Menu: hide readability items
  $("#readabilityFont").hide();
  $("#readabilityFontSize").hide();
  $("#themeStyle").hide();
  $("#readabilityOff").hide();
});

function setContent(content, fileDirectory) {
  $htmlContent = $("#htmlContent");
  $htmlContent.append(content);
  var cleanedHTML = $htmlContent.append(content);

  if (fileDirectory.indexOf("file://") === 0) {
    fileDirectory = fileDirectory.substring(("file://").length, fileDirectory.length);
  }

  var hasURLProtocol = function(url) {
    return (
            url.indexOf("http://") === 0 ||
            url.indexOf("https://") === 0 ||
            url.indexOf("file://") === 0 ||
            url.indexOf("data:") === 0
    );
  };

  // fixing embedding of local images
  $htmlContent.find("img[src]").each(function() {
    var currentSrc = $(this).attr("src");
    if (!hasURLProtocol(currentSrc)) {
      var path = (isWeb ? "" : "file://") + fileDirectory + "/" + currentSrc;
      $(this).attr("src", path);
    }
  });

  $htmlContent.find("a[href]").each(function() {
    var currentSrc = $(this).attr("href");
    var path;

    if (!hasURLProtocol(currentSrc)) {
      var path = (isWeb ? "" : "file://") + fileDirectory + "/" + currentSrc;
      $(this).attr("href", path);
    }

    $(this).bind('click', function(e) {
      e.preventDefault();
      if (path) {
        currentSrc = encodeURIComponent(path);
      }
      var msg = {command: "openLinkExternally", link: currentSrc};
      window.parent.postMessage(JSON.stringify(msg), "*");
    });
  });

  // View readability mode


  var readabilityViewer = document.getElementById("htmlContent");
  var fontSize = 14;

  $("#readabilityOn").on('click', function() {
    var documentClone = document.cloneNode(true);
    var article = new Readability(document.baseURI, documentClone).parse();
    $(readabilityViewer).html(article.content);
    readabilityViewer.style.fontSize ="large";// fontSize;//"large";
    readabilityViewer.style.fontFamily = "Helvetica, Arial, sans-serif";
    readabilityViewer.style.background = "#ffffff";
    readabilityViewer.style.color = "";

    $("#mhtmlViewer").html(article.content);
    if ($("#mhtmlViewer").data('clicked', true)) {
      $("#toSerifFont").show();
      $("#toSansSerifFont").show();
      $("#increasingFontSize").show();
      $("#decreasingFontSize").show();
      $("#readabilityOff").show();
      $("#whiteBackgroundColor").show();
      $("#blackBackgroundColor").show();
      $("#sepiaBackgroundColor").show();
      $("#themeStyle").show();
      $("#readabilityFont").show();
      $("#readabilityFontSize").show();
      $("#readabilityOn").hide();
      $("#changeStyleButton").hide();
      $("#resetStyleButton").hide();
    }
  });

  $("#readabilityOff").on('click', function() {
    $("#mhtmlViewer").html(cleanedHTML);
    readabilityViewer.style.fontSize = '';//"large";
    readabilityViewer.style.fontFamily = "";
    readabilityViewer.style.color = "";
    readabilityViewer.style.background = "";
    $("#readabilityOff").hide();
    $("#toSerifFont").hide();
    $("#toSansSerifFont").hide();
    $("#increasingFontSize").hide();
    $("#decreasingFontSize").hide();
    $("#whiteBackgroundColor").hide();
    $("#blackBackgroundColor").hide();
    $("#sepiaBackgroundColor").hide();
    $("#themeStyle").hide();
    $("#readabilityFont").hide();
    $("#readabilityFontSize").hide();
    $("#readabilityOn").show();
    $("#changeStyleButton").show();
    $("#resetStyleButton").show();
  });

  $("#toSansSerifFont").on('click', function(e) {
    e.stopPropagation();
    readabilityViewer.style.fontFamily = "Helvetica, Arial, sans-serif";
  });

  $("#toSerifFont").on('click', function(e) {
    e.stopPropagation();
    readabilityViewer.style.fontFamily = "Georgia, Times New Roman, serif";
  });

  $("#increasingFontSize").on('click', function(e) {
    e.stopPropagation();
    increaseFont();
  });

  $("#decreasingFontSize").on('click', function(e) {
    e.stopPropagation();
    decreaseFont();
  });

  $("#whiteBackgroundColor").on('click', function(e) {
    e.stopPropagation();
    readabilityViewer.style.background = "#ffffff";
    readabilityViewer.style.color = "";
  });

  $("#blackBackgroundColor").on('click', function(e) {
    e.stopPropagation();
    readabilityViewer.style.background = "#282a36";
    readabilityViewer.style.color = "#ffffff";
  });

  $("#sepiaBackgroundColor").on('click', function(e) {
    e.stopPropagation();
    readabilityViewer.style.color = "#5b4636";
    readabilityViewer.style.background = "#f4ecd8";
  });

  function increaseFont() {
    var style = window.getComputedStyle(readabilityViewer, null).getPropertyValue('font-size');
    var fontSize = parseFloat(style);
    readabilityViewer.style.fontSize = (fontSize + 1) + 'px';
  }

  function decreaseFont() {
    var style = window.getComputedStyle(readabilityViewer, null).getPropertyValue('font-size');
    var fontSize = parseFloat(style);
    readabilityViewer.style.fontSize = (fontSize - 1) + 'px';
  }

  Mousetrap.bind(['command++', 'ctrl++'], function(e) {
    increaseFont();
    return false;
  });

  Mousetrap.bind(['command+-', 'ctrl+-'], function(e) {
    decreaseFont();
    return false;
  });
}
