/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

/* globals marked */
"use strict";

var isCordova;
var isWin;
var isWeb;

var $htmlContent;

$(document).ready(function() {
  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  var locale = getParameterByName("locale");

  var extSettings;
  loadExtSettings();

  isCordova = parent.isCordova;
  isWin = parent.isWin;
  isWeb = parent.isWeb;

  $(document).on('drop dragend dragenter dragover', function(event) {
    event.preventDefault();
  });

  $('#aboutExtensionModal').on('show.bs.modal', function() {
    $.ajax({
      url: 'README.md',
      type: 'GET'
    }).done(function(mdData) {
      //console.log("DATA: " + mdData);
      if (marked) {
        var modalBody = $("#aboutExtensionModal .modal-body");
        modalBody.html(marked(mdData, {sanitize: true}));
        handleLinks(modalBody);
      } else {
        console.log("markdown to html transformer not found");
      }
    }).fail(function(data) {
      console.warn("Loading file failed " + data);
    });
  });

  function handleLinks($element) {
    $element.find("a[href]").each(function() {
      var currentSrc = $(this).attr("href");
      $(this).bind('click', function(e) {
        e.preventDefault();
        var msg = {command: "openLinkExternally", link: currentSrc};
        window.parent.postMessage(JSON.stringify(msg), "*");
      });
    });
  }


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

  $("#changeStyleButton").bind('click', function() {
    currentStyleIndex = currentStyleIndex + 1;
    if (currentStyleIndex >= styles.length) {
      currentStyleIndex = 0;
    }
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + " " + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $("#resetStyleButton").bind('click', function() {
    currentStyleIndex = 0;
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + " " + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $("#zoomInButton").bind('click', function() {
    currentZoomState++;
    if (currentZoomState >= zoomSteps.length) {
      currentZoomState = 6;
    }
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + " " + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $("#zoomOutButton").bind('click', function() {
    currentZoomState--;
    if (currentZoomState < 0) {
      currentZoomState = 0;
    }
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + " " + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $("#zoomResetButton").bind('click', function() {
    currentZoomState = 3;
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + " " + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $("#aboutButton").on("click", function(e) {
    $("#aboutExtensionModal").modal({show: true});
  });

  $("#printButton").on("click", function(e) {
    window.print();
  });

  $("#findInFile").bind('click', function() {
    showSearchEngine();
  });

  if (isCordova) {
    $("#printButton").hide();
  }

  // Init internationalization
  $.i18n.init({
    ns: {namespaces: ['ns.viewerHTML']},
    debug: true,
    lng: locale,
    fallbackLng: 'en_US'
  }, function() {
    $('[data-i18n]').i18n();
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

  $("#searchButton").bind('click', function() {
    doSearch();
  });

  searchInput();
});


function setContent(content, fileDirectory) {
  $htmlContent = $("#htmlContent");

  $htmlContent.append(content);

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
}

function showSearchEngine(e) {
  $('#searchToolbar').slideDown(500);
  // or $('#searchToolbar').show(); ever
  $('#searchBox').val('');
  $('#searchBox').focus();
  //$( "div" ).css( "visibility", "hidden" );
}

function cancelSearch(e) {
  $('#searchToolbar').slideUp(500);
  // or $('#searchToolbar').hide(); ever
  //$('#searchBox').hide();
}

function searchInput() {
  // Search UI
  $('#searchBox').keyup(function(e) {
    if (e.keyCode === 13) { // Start the search on ENTER
      doSearch();
    } else if (e.keyCode == 27) { // Hide search on ESC
      cancelSearch();
    } else {
      //do something
    }
  });

  $('#clearSearchButton').on('click', function(e) {
    cancelSearch();
  });

  window.addEventListener("keydown", function keydown(evt) {
    var handled = false;
    var cmd = (evt.ctrlKey ? 1 : 0) |
            (evt.altKey ? 2 : 0) |
            (evt.shiftKey ? 4 : 0) |
            (evt.metaKey ? 8 : 0);
    /*
     First, handle the key bindings that are independent whether an input
     control is selected or not.
     */
    if (cmd === 1 || cmd === 8 || cmd === 5 || cmd === 12) {
      // either CTRL or META key with optional SHIFT.
      switch (evt.keyCode) {
        case 70://f
          //open custom search/find text
          handled = true;
          break;
        case 71: //g
          //find next
          handled = true;
          break;
        case 61:  // FF/Mac "="
        case 107: // FF "+" and "="
        case 187: // Chrome "+"
        case 171: // FF with German keyboard
                  //zoom in
          handled = true;
          break;
        case 173: // FF/Mac "-"
        case 109: // FF "-"
        case 189: // Chrome "-"
                  //zoom out
          handled = true;
          break;
        case 48: // "0"
        case 96: // "0" on Numpad of Swedish keyboard
          //set scale
          handled = true;
          break;
      }
    }

    // CTRL or META without shift
    if (cmd === 1 || cmd === 8) {
      switch (evt.keyCode) {
        case 70:
          showSearchEngine();//f
          break;
        case 83: //s
          //download/save file
          handled = true;
          break;
      }
    }

    // CTRL+ALT or Option+Command
    if (cmd === 3 || cmd === 10) {
      switch (evt.keyCode) {
        case 80: //p
          //presentaion mode
          handled = true;
          break;
        case 71: //g
          //focus page number dialoge
          handled = true;
          break;
      }
    }

    if (handled) {
      evt.preventDefault();
      return;
    }
  });
}

function doSearch() {
  var str = document.getElementById("searchBox").value;
  if (str === "") {
    //alert ("Please enter some text to search!");
    return;
  }
  var supported = false;
  var found = false;
  if (window.find) {        // Firefox, Google Chrome, Safari
    found = window.find(str);
    $(str).scroll();
    if (!found) {
      //The following text was not found:\n" + str
    }
  }
  else {
  }
}