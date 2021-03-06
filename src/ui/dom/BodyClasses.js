/*jsl:import ../../ui.js*/

/* Setup browser classnames on the body */
(function(){

  var bodyclass= document.documentElement.className;
  
  if (coherent.Browser.Safari)
    bodyclass+= ' safari';
  if (coherent.Browser.MobileSafari)
    bodyclass+= ' mobile-safari';
  if (coherent.Browser.Mozilla)
    bodyclass+= ' mozilla';
  if (coherent.Browser.IE)
    bodyclass+= ' msie msie' + coherent.Browser.IE;
  if (coherent.Browser.iPad)
    bodyclass+= ' ipad';
    
  var ua= window.navigator.userAgent;
  if (/Windows/.test(ua))
    bodyclass+= ' windows';
  if (/Macintosh/.test(ua))
    bodyclass+= ' mac';

  bodyclass+= ' ui-loading';
  document.documentElement.className= bodyclass.trim();
})();
