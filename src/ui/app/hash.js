/*jsl:import ../dom/event.js*/
/*jsl:import ../dom/event-ie.js*/

/*!
    Adapted from the dojo.hash source code.
  
    Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
    Available via Academic Free License >= 2.1 OR the modified BSD license.
    see: http://dojotoolkit.org/license for details
*/

/**#nocode+*/

(function(){

  // Global vars
  var _recentHash = null;
  var _ieUriMonitor = null;
  var _pollFrequency = 100;

  //Internal functions
  function _getHash()
  {
    var hash = window.location.href;
    var index= hash.indexOf("#");
    if (-1===index)
      return "";
    return decodeURIComponent(hash.substring(index+1));
  }

  function _dispatchEvent()
  {
    var hashValue= _getHash();
    var change= new coherent.ChangeNotification(coherent.hash,
                          coherent.ChangeType.setting,
                          hashValue);
    coherent.hash.notifyObserversOfChangeForKeyPath(change, 'value');
  }

  function _pollLocation()
  {
    var newHash= _getHash();
    
    console.log('hash=', newHash);
    
    if (newHash===_recentHash)
      return;

    _recentHash = newHash;
    _dispatchEvent();
  }
  
  function _replace(hash)
  {
    if (_ieUriMonitor)
    {
      if (_ieUriMonitor.isTransitioning())
      {
        _replace.delay(_pollFrequency, hash);
        return;
      }
      
      var href = _ieUriMonitor.iframe.location.href;
      var index = href.indexOf('?');
      // main frame will detect and update itself
      _ieUriMonitor.iframe.location.replace(href.substring(0, index) + "?" + hash);
      return;
    }
    
    window.location.replace("#"+hash);
    _pollLocation();
  }

  /** IE doesn't add changes to the URI's hash into the history unless the hash
      value corresponds to an actual named anchor in the document. To get around
      this IE difference, we use a background IFrame to maintain a back-forward
      history, by updating the IFrame's query string to correspond to the
      value of the main browser location's hash value.
     
      E.g. if the value of the browser window's location changes to
     
      #action=someAction
     
      ... then we'd update the IFrame's source to:
     
      ?action=someAction
     
      This design leads to a somewhat complex state machine, which is
      described below:
     
      s1: Stable state - neither the window's location has changed nor
          has the IFrame's location. Note that this is the 99.9% case, so
          we optimize for it.
          Transitions: s1, s2, s3
      s2: Window's location changed - when a user clicks a hyperlink or
          code programmatically changes the window's URI.
          Transitions: s4
      s3: Iframe's location changed as a result of user pressing back or
          forward - when the user presses back or forward, the location of
          the background's iframe changes to the previous or next value in
          its history.
          Transitions: s1
      s4: IEUriMonitor has programmatically changed the location of the
          background iframe, but it's location hasn't yet changed. In this
          case we do nothing because we need to wait for the iframe's
          location to reflect its actual state.
          Transitions: s4, s5
      s5: IEUriMonitor has programmatically changed the location of the
          background iframe, and the iframe's location has caught up with
          reality. In this case we need to transition to s1.
          Transitions: s1
     
      The hashchange event is always dispatched on the transition back to s1.
   */
  function IEUriMonitor()
  {
    // create and append iframe
    var iframe = document.createElement("iframe");
    var iframeId = "coherent-hash-iframe";
    var iframeSrc = coherent.hash.blankHtmlUrl;
    
    iframe.id = iframeId;
    iframe.src = iframeSrc + "?" + _getHash();
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    this.iframe = window[iframeId];
    
    var recentIframeQuery;
    var transitioning;
    var expectedIFrameQuery;
    var docTitle;
    var ifrOffline;
    var iframeLoc = this.iframe.location;
    var winLoc = window.location;

    function resetState()
    {
      _recentHash = winLoc.hash;
      recentIframeQuery = ifrOffline ? _recentHash : iframeLoc.search;
      transitioning = false;
      expectedIFrameQuery = null;
    }

    this.isTransitioning= function()
    {
      return transitioning;
    }
    
    this.pollLocation = function()
    {
      if (!ifrOffline)
      {
        try
        {
          //  See if we can access the iframe without a permission
          //  denied error.
          iframeLoc.search;
          //  Good, the iframe is same origin (no thrown exception)
          if (document.title != docTitle)
          {
            //sync title of main window with title of iframe.
            docTitle = this.iframe.document.title = document.title;
          }
        }
        catch(e)
        {
          //  Permission denied - server cannot be reached.
          ifrOffline = true;
          console.error("coherent.hash: Error adding history entry. Server unreachable.");
        }
      }
      if (transitioning && _recentHash === winLoc.hash)
      {
        // we're in an iframe transition (s4 or s5)
        if (ifrOffline || iframeLoc.search === expectedIFrameQuery)
        {
          // s5 (iframe caught up to main window or iframe offline), transition back to s1
          resetState();
          _dispatchEvent();
        }
        else
        {
          // s4 (waiting for iframe to catch up to main window)
          this.pollLocation.bindAndDelay(this, 0);
          return;
        }
      }
      else if (_recentHash === winLoc.hash &&
           (ifrOffline || recentIframeQuery === iframeLoc.search))
/*jsl:ignore*/        
      {
        //  We're in stable state (s1, iframe query == main window hash)
        //  do nothing
      }
/*jsl:end*/
      else
      {
        //  The user has initiated a URL change somehow.
        //  sync iframe query <-> main window hash
        if (_recentHash !== winLoc.hash)
        {
          //  s2 (main window location changed), set iframe url and
          //  transition to s4
          _recentHash = winLoc.hash;
          transitioning = true;
          expectedIFrameQuery = "?" + _getHash();
          iframe.src = iframeSrc + expectedIFrameQuery;

          //  We're updating the iframe src - set offline to false so
          //  we can check again on next poll.
          ifrOffline = false;
          
          //  Yielded transition to s4 while iframe reloads.
          this.pollLocation.bindAndDelay(this, 0);
          return;
        }
        else if (!ifrOffline)
        {
          //  s3 (iframe location changed via back/forward button),
          //  set main window url and transition to s1.
          winLoc.href = "#" + iframeLoc.search.substring(1);
          resetState();
          _dispatchEvent();
        }
      }
      this.pollLocation.bindAndDelay(this, _pollFrequency);
    }
    
    // initialize state (transition to s1)
    resetState();
    this.pollLocation.bindAndDelay(this, _pollFrequency);
  }
  
  function setup()
  {
    if (coherent.Support.HashChangeEvent)
    {
      //  need this IE browser test because "onhashchange" exists in IE8
      //  in IE7 mode
      Event.observe(window, "onhashchange", _dispatchEvent);
    }
    else
    {
      if (document.addEventListener)
      {
        //  Non-IE
        _recentHash = _getHash();
        //  Poll the window location for changes
        window.setInterval(_pollLocation, _pollFrequency);
      }
      else if (document.attachEvent)
      {
        //  For IE versions 7 and lower, use hidden iframe in versions
        //  of IE that don't have onhashchange event
        _ieUriMonitor = new IEUriMonitor();
      } 
      // else non-supported browser, do nothing.
    }
  }

  coherent.hash= new coherent.KVO();
  coherent.hash.value= _getHash();
  coherent.hash.setValue= function(hash)
  {
    if ('#'!==hash.charAt(0))
      hash= '#' + hash;
    window.location.href= hash;
  }
  coherent.hash.addObserverForKeyPath= function(observer, callback, keyPath, context)
  {
    setup();
    return coherent.KVO.prototype.addObserverForKeyPath.call(this, observer, callback, keyPath, context);
  }
    
  
})();

/**#nocode-*/
