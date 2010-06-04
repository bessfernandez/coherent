/*jsl:declare coherent*/
if ('undefined'===typeof(coherent))
  /**
   *  @namespace
   */
  coherent= {};
  
coherent.version= "3.0.0";
coherent.__nextUid= 0;
coherent.global= window;
coherent.globalEval= window['eval'];

coherent.generateUid= function()
{
  return ++(coherent.__nextUid);
}


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








/** The base typeof operator doesn't handle dates, regular expressions, boolean
    values, arrays, and strings very well. This function takes care of these
    problems.
  
    @param o the object for which the type is requested
    @returns {String} a string with the type of the object.
 */
coherent.typeOf=function(o)
{
  if (null===o)
    return "null";

  var t= typeof(o);
  if ("object"!==t && "function"!==t)
    return t;
    
  return {}.toString.call(o).slice(8,-1).toLowerCase();
}

/** Compare two values. This handles pretty much every type possible. When the
    types don't match, the values are first converted to strings and then
    compared with a locale sensitive method.
  
    @param v1 - first value
    @param v2 - second value
    @returns {Number} -1 if v1 < v2, 0 if v1==v2, and 1 if v1>v2
 */
coherent.compareValues= function(v1, v2)
{
  var v1_type= coherent.typeOf(v1);
  
  //  If the types aren't the same, compare these objects lexigraphically.
  if (v1_type!==coherent.typeOf(v2))
  {
    var s_v1= String(v1);
    var s_v2= String(v2);
    return s_v1.localeCompare(s_v2);
  }
  switch (v1_type)
  {
    case "null":
      return 0;
      
    case "boolean":
    case "number":
      var v= (v1-v2);
      if (0===v)
        return v;
      return (v<0?-1:1);

    case "regexp":
    case "function":
      //  use default (lexigraphical) comparison
      break;

    case "string":
    case "array":
    case "object":
      if (v1.localeCompare)
        return v1.localeCompare(v2);
      if (v1.compare)
        return v1.compare(v2);
      //  Otherwise use default (lexigraphical) comparison
      break;
    
    case 'undefined':
      return true;
      
    default:
      throw new TypeError( "Unknown type for comparison: " + v1_type );
  }
  //  Default comparison is lexigraphical of string values.
  return String(v1).localeCompare(String(v2));
}




/** Compare two numbers. Used to sort an array numerically instead of lexigraphically.

    @param {Number} left - left value
    @param {Number} right - right value
    @returns {Number} -1 if left<right, 0 if left===right, and 1 if left>right
 */
coherent.compareNumbers= function(left, right)
{
  return left-right;
}

/** Compare two numbers. Used to sort an array numerically instead of lexigraphically.

    @param {Number} left - left value
    @param {Number} right - right value
    @returns {Number} 1 if left<right, 0 if left===right, and -1 if left>right
 */
coherent.reverseCompareNumbers= function(left, right)
{
  return right-left;
}




/** Function that will create an error constructor. This takes care of
    differences between browsers, except of course that MSIE simply doesn't
    support custom error types very well. This function allows you to have a
    custom initialiser for error types simply by defining a function with the
    same name as the error type.
  
    The return value of this function is the constructor for the new error type.
    If there's no custom constructor, this return value should be assigned to a
    global variable with the same name as the error type. That way new instances
    of the error can be created.
  
    @param {String} errorName - The name of the error subclass -- also the name
      of the initialiser function.
    @returns {Function} A function that is the constructor for the new error type.
 */
coherent.defineError= function(errorName)
{
  function error(message)
  {
    this.message= message;
    this.name= errorName;
  }
  error.prototype= new Error;
  error.prototype.constructor= error;
  error.prototype.name= errorName;
  return error;
}

var InvalidArgumentError= coherent.defineError("InvalidArgumentError");


/* Add console & console.log for browsers that don't support it. */
if ("undefined"===typeof(window.console))
  window.console= {};
if ('undefined'===typeof(window.console.log))
  /** @ignore */
  window.console.log= function(){};
if ('undefined'===typeof(window.console.error))
  /** @ignore */
  window.console.error= function(){};
