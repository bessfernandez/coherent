/** Boolean flags to indicate which browser is currently running. Purists will
    tell you that browser sniffing is passé, but sometimes there's really no
    other way...
  
    @namespace
 */
coherent.Browser= {
  /** If the browser is Microsoft Internet Explorer, this is the version. */
  IE: !!(window.attachEvent && !window.opera) && (function(){
      //  IE8 supports multiple version modes and exposes that via
      //  the document.documentMode property.
      if (document.documentMode)
        return document.documentMode;
      var ieVersionRegex= /MSIE (\d+)/;
      var match= ieVersionRegex.exec(navigator.userAgent);
      return match && parseInt(match[1],10);
    })(),
  /** Is the browser a version of Safari? */
  Safari: navigator.userAgent.indexOf('AppleWebKit/') > -1,
  /** Is the browser Safari 2, which has some pecular bugs? */
  Safari2: (function(){
      var safariVersionRegex= /AppleWebKit\/(\d+(?:\.\d+)?)/;
      var match= safariVersionRegex.exec(navigator.userAgent);
      return (match && parseInt(match[1],10)<420);
    })(),
  /** Is the browser some variant of Mozilla? */
  Mozilla:  navigator.userAgent.indexOf('Gecko') > -1 &&
        navigator.userAgent.indexOf('KHTML') == -1,
  /** Is the browser Mobile Safari (iPhone or iPod Touch) */
  MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
};
