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

  var searchQuery = getParameterByName("query");

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

  $("#findInFile").on('click', function() {
    showSearchPanel();
  });

  $("#searchExtButton").on('click', function() {
    doSearch();
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

  function showSearchPanel(e) {
    //$('#searchToolbar').slideDown(500);
    $('#searchToolbar').show();
    $('#searchBox').val('');
    $('#searchBox').focus();
  }

  function cancelSearch() {
    //$('#searchToolbar').slideUp(500);
    $('#htmlContent').unhighlight();
    $('#searchToolbar').hide();
    //$('#searchBox').hide();
  }

  function initSearch() {
    // Search UI
    $('#searchBox').keyup(function(e) {
      if (e.keyCode === 13) { // Start the search on ENTER
        doSearch();
      } else if (e.keyCode == 27) { // Hide search on ESC
        cancelSearch();
      } else if (e.which === 32) {
        e.preventDefault();
        $('html, body').animate({
          scrollTop: offsetForNextPage()
        }, 1000);
      }
    });

    $('#clearSearchExtButton').on('click', function(e) {
      cancelSearch();
    });

    Mousetrap.bind(['command+f', 'ctrl+f'], function(e) {
      showSearchPanel();
      return false;
    });
  }

  initSearch();
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

function offsetForNextPage() {
  var bottom = $(window).scrollTop() + $(window).height();
  var result = $(window).scrollTop() + $(window).height() * 0.75; // minimum scroll amount
  $('p, span, div').each(function(idx) {
    if ($(this).offset().top >= bottom) {
      return false;
    }
    result = Math.max($(this).offset().top, result);
  });
  return result;
}

function doSearch() {
  $('#htmlContent').unhighlight();
  $('#searchBox').attr('placeholder', 'Search');
  var givenString = document.getElementById("searchBox").value;

  var selector = $('#htmlContent') || 'body';
  var topOfContent = $(selector).animate({scrollTop: $('#htmlContent').offset().top}, "fast");
  var caseSensitiveString = $('#htmlContent').highlight(givenString, {wordsOnly: false});
  var found, getSelection;

  if (window.find) { // Firefox, Google Chrome, Safari
    found = window.find(givenString);
    $('#htmlContent').highlight(givenString, {wordsOnly: false});
    getSelection = window.getSelection();

    var searchTermRegEx = new RegExp(found, "ig");
    var matches = $(selector).text().match(searchTermRegEx);
    if (matches) {
      if ($('.highlight').length) {//if match found, scroll to where the first one appears
        $(selector).animate({scrollTo:($("*:contains('"+ givenString +"'):first").offset().top)},"fast");
        //$(selector).animate({scrollTop: $('#htmlContent .highlight::selection').offset().top}, "fast");
        //$(selector).animate({scrollTo: getSelection}, "fast");
      } else {
        console.log("err");
      }
    }
    if (!found || (!found && !caseSensitiveString) || !caseSensitiveString) {
      $('#htmlContent').unhighlight();
      $('#searchBox').val('');
      $('#searchBox').attr('placeholder', 'Search text not found. Try again.');
      return topOfContent;
    }
  } else {
    console.log("Cant found string in content");
  }
}
