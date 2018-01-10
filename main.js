/* Copyright (c) 2013-present The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

'use strict';

sendMessageToHost({ command: 'loadDefaultTextContent' });

var $htmlContent;
var isWeb = (document.URL.startsWith('http') && !document.URL.startsWith('http://localhost:1212/'));

$(document).ready(init);
function init() {
  var locale = getParameterByName('locale');
  initI18N(locale, 'ns.viewerHTML.json');

  var searchQuery = getParameterByName('query');

  var extSettings;
  loadExtSettings();

  $htmlContent = $('#htmlContent');

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
  $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + ' ' + zoomSteps[currentZoomState]);

  $('#changeStyleButton').on('click', function() {
    currentStyleIndex = currentStyleIndex + 1;
    if (currentStyleIndex >= styles.length) {
      currentStyleIndex = 0;
    }
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + ' ' + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $('#resetStyleButton').on('click', function() {
    currentStyleIndex = 0;
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + ' ' + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $('#zoomInButton').on('click', function() {
    currentZoomState++;
    if (currentZoomState >= zoomSteps.length) {
      currentZoomState = 6;
    }
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + ' ' + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $('#zoomOutButton').on('click', function() {
    currentZoomState--;
    if (currentZoomState < 0) {
      currentZoomState = 0;
    }
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + ' ' + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  $('#zoomResetButton').on('click', function() {
    currentZoomState = 3;
    $htmlContent.removeClass();
    $htmlContent.addClass('markdown ' + styles[currentStyleIndex] + ' ' + zoomSteps[currentZoomState]);
    saveExtSettings();
  });

  function saveExtSettings() {
    var settings = {
      'styleIndex': currentStyleIndex,
      'zoomState': currentZoomState
    };
    localStorage.setItem('viewerHTMLSettings', JSON.stringify(settings));
  }

  function loadExtSettings() {
    extSettings = JSON.parse(localStorage.getItem('viewerHTMLSettings'));
  }

  // Menu: hide readability items
  $('#readabilityFont').hide();
  $('#readabilityFontSize').hide();
  $('#themeStyle').hide();
  $('#readabilityOff').hide();
};

// fixing embedding of local images
function fixingEmbeddingOfLocalImages($htmlContent, fileDirectory) {
  var hasURLProtocol = function(url) {
    return (
      url.indexOf('http://') === 0 ||
      url.indexOf('https://') === 0 ||
      url.indexOf('file://') === 0 ||
      url.indexOf('data:') === 0
    );
  };

  $htmlContent.find('img[src]').each(function() {
    var currentSrc = $(this).attr('src');
    if (!hasURLProtocol(currentSrc)) {
      var path = (isWeb ? '' : 'file://') + fileDirectory + '/' + currentSrc;
      $(this).attr('src', path);
    }
  });

  $htmlContent.find('a[href]').each(function() {
    var currentSrc = $(this).attr('href');
    var path;

    if(currentSrc.indexOf('#') === 0 ) {
      // Leave the default link behaviour by internal links
    } else {
      if (!hasURLProtocol(currentSrc)) {
        var path = (isWeb ? '' : 'file://') + fileDirectory + '/' + currentSrc;
        $(this).attr('href', path);
      }

      $(this).off();
      $(this).on('click', function(e) {
        e.preventDefault();
        if (path) {
          currentSrc = encodeURIComponent(path);
        }
        sendMessageToHost({command: 'openLinkExternally', link: currentSrc});
      });
    }
  });
}

function setContent(content, fileDirectory, sourceURL, scrappedOn) {
  // console.log(content);

  var bodyRegex = /\<body[^>]*\>([^]*)\<\/body/m; // jshint ignore:line
  var bodyContent;

  try {
    bodyContent = content.match(bodyRegex)[1];
  } catch (e) {
    console.log('Error parsing the body of the HTML document. ' + e);
    bodyContent = content;
  }
  //try {
  //  var scrappedOnRegex = /data-scrappedon='([^']*)'/m; // jshint ignore:line
  //  scrappedOn = content.match(scrappedOnRegex)[1];
  //} catch (e) {
  //  console.log('Error parsing the meta from the HTML document. ' + e);
  //}
  var sourceURLRegex = /data-sourceurl='([^']*)'/m; // jshint ignore:line
  var regex = new RegExp(sourceURLRegex);
  sourceURL = content.match(regex);
  var url = sourceURL ? sourceURL[1] : undefined;

  // removing all scripts from the document
  var cleanedBodyContent = bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');


  $htmlContent = $('#htmlContent');
  $htmlContent.empty().append(cleanedBodyContent);

  if (fileDirectory && fileDirectory.startsWith('file://')) {
    fileDirectory = fileDirectory.substring(('file://').length, fileDirectory.length);
  }

  fixingEmbeddingOfLocalImages($htmlContent, fileDirectory);

  // View readability mode
  var readabilityViewer = document.getElementById('htmlContent');
  var fontSize = 14;

  $('#readabilityOn').on('click', function() {
    try {
      var documentClone = document.cloneNode(true);
      var article = new Readability(document.baseURI, documentClone).parse();
      $(readabilityViewer).html(article.content);
      fixingEmbeddingOfLocalImages($(readabilityViewer, fileDirectory));
      readabilityViewer.style.fontSize = fontSize;//'large';
      readabilityViewer.style.fontFamily = 'Helvetica, Arial, sans-serif';
      readabilityViewer.style.background = '#ffffff';
      readabilityViewer.style.color = '';
      $('#readabilityOff').css('display', 'inline-block');
      $('#themeStyle').show();
      $('#readabilityFont').show();
      $('#readabilityFontSize').show();
      $('#readabilityOn').hide();
      $('#changeStyleButton').hide();
      $('#resetStyleButton').hide();
      $('#zoomInButton').hide();
      $('#zoomOutButton').hide();
      $('#zoomResetButton').hide();
    } catch (e) {
      console.log('Error handling' + e);
      var msg = {
        command: 'showAlertDialog',
        title: 'Readability Mode',
        message: 'This content can not be loaded.'
      };
      sendMessageToHost(msg);
    }
  });

  $('#readabilityOff').on('click', function() {
    $htmlContent.empty();
    $htmlContent.append(cleanedBodyContent);
    fixingEmbeddingOfLocalImages($htmlContent, fileDirectory);
    readabilityViewer.style.fontSize = '';//'large';
    readabilityViewer.style.fontFamily = '';
    readabilityViewer.style.color = '';
    readabilityViewer.style.background = '';
    $('#readabilityOn').show();
    $('#changeStyleButton').show();
    $('#resetStyleButton').show();
    $('#readabilityOff').hide();
    $('#readabilityFont').hide();
    $('#readabilityFontSize').hide();
    $('#themeStyle').hide();
  });

  $('#toSansSerifFont').on('click', function(e) {
    e.stopPropagation();
    readabilityViewer.style.fontFamily = 'Helvetica, Arial, sans-serif';
  });

  $('#toSerifFont').on('click', function(e) {
    e.stopPropagation();
    readabilityViewer.style.fontFamily = 'Georgia, Times New Roman, serif';
  });

  $('#increasingFontSize').on('click', function(e) {
    e.stopPropagation();
    increaseFont();
  });

  $('#decreasingFontSize').on('click', function(e) {
    e.stopPropagation();
    decreaseFont();
  });

  $('#whiteBackgroundColor').on('click', function(e) {
    e.stopPropagation();
    readabilityViewer.style.background = '#ffffff';
    readabilityViewer.style.color = '';
  });

  $('#blackBackgroundColor').on('click', function(e) {
    e.stopPropagation();
    readabilityViewer.style.background = '#282a36';
    readabilityViewer.style.color = '#ffffff';
  });

  $('#sepiaBackgroundColor').on('click', function(e) {
    e.stopPropagation();
    readabilityViewer.style.color = '#5b4636';
    readabilityViewer.style.background = '#f4ecd8';
  });

  if (sourceURL) {
    $('#openSourceURL').show();
  } else {
    $('#openSourceURL').hide();
  }

  $('#openSourceURL').on('click', function() {
    sendMessageToHost({command: 'openLinkExternally', link: sourceURL});
  });

  function increaseFont() {
    try {
      var style = window.getComputedStyle(readabilityViewer, null).getPropertyValue('font-size');
      console.log(style);
      console.debug(style);
      var fontSize = parseFloat(style);
      //if($('#readability-page-1').hasClass('page')){
      var page = document.getElementsByClassName('markdown');
      console.log(page[0].style);
      page[0].style.fontSize = (fontSize + 1) + 'px';
      page[0].style[11] = (fontSize + 1) + 'px';
      //} else {
      readabilityViewer.style.fontSize = (fontSize + 1) + 'px';
      //}
    } catch (e) {
      console.log('Error handling : ' + e);
      console.assert(e);
    }
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
