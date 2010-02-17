if ("undefined"!==typeof(coherent))
    throw new Error("Library module (coherent) already defined");

/**
 *  @namespace
 */
var coherent= {
    /** The version of the Coherent library. */
    version: "@VERSION@",
    
    /** Helper method to generate an unique ID. Basically this is a simply
        increasing value. It's not really unique outside of the page, so you
        shouldn't use this value for synchronising components across pages or
        communicating with servers.
        @type Number
     */
    generateUid: function()
    {
        return ++(coherent.__nextUid);
    },
    
    __nextUid: 0,
        
    globalObject: (function(){ return this; })()
};


/** Boolean flags to indicate which browser is currently running. Purists will
    tell you that browser sniffing is passé, but sometimes there's really no
    other way...
    
    @namespace
 */
coherent.Browser= {
    /** If the browser is Microsoft Internet Explorer, this is the version. */
    IE: !!(window.attachEvent && !window.opera) && (function(){
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
    MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/),
    /** Is the application running under Selenium tests? */
    SeleniumActive: (-1!==window.name.indexOf('selenium'))
};




/** Boolean flags to indicate various language & DOM support options. This is
 *  in lieu of simply sniffing the browser, because sometimes that works better.
 *  
 *  @namespace
 */
coherent.Support= {
    /** Does the browser support JavaScript getters & setters? */
    Properties: ('__defineGetter__' in Object.prototype),
    /** Does the browser support native query selector? */
    QuerySelector: ('querySelector' in document),
    /** Does the browser support touch events? */
    Touches: !!document.createTouch,
    /** Does the browser support RGBA colors? */
    CSS3ColorModel: false,
    /** Initial value for whether the browser supports CSS transitions. If the
        browser supports Properties, this will be updated later when you actually
        ask for the value. Otherwise, the browser definitely doesn't support
        CSS transitions.
     */
    CSSTransitions: false,
    /** Initial value for whether the browser supports CSS3 border images. If
        the browser supports properties, this will be updated when the code
        actually asks for the value. There are no browsers that support border
        images but do not support properties.
     */
    BorderImage: false,
    /** Determine whether the browser supports Drag & Drop properly. Mozilla
        prior to 3.5 doesn't work correctly. When running under Selenium, native
        drag and drop is disabled.
     */
    DragAndDrop: !coherent.Browser.SeleniumActive &&
                 ((coherent.Browser.Safari && !coherent.Browser.MobileSafari) ||
                   coherent.Browser.IE ||
                  (coherent.Browser.Mozilla && !!window.localStorage))
};




if (coherent.Support.Properties)
{
    /*  Define a getter function that will determine whether the CSS3 Color Model
        is available. When invoked, this function will replace itself with the
        correct value.
     */    
    coherent.Support.__defineGetter__('CSS3ColorModel', function()
        {
            delete this.CSS3ColorModel;
            var test = document.createElement("span");
            try {
                test.style.backgroundColor = "rgba(100,100,100,0.5)";
                return this.CSS3ColorModel=(test.style.length === 1);
            } catch(e) {}
            return (this.CSS3ColorModel=false);
         });

    /*  Define a getter function that will determine whether CSSTransitions are
        available only when actually asked. When invoked, this function will
        replace itself with the correct value.
     */
    coherent.Support.__defineGetter__('CSSTransitions', function()
        {
            delete this.CSSTransitions;
            var test = document.createElement("span");
            try {
                test.style.setProperty("-webkit-transition-duration", "1ms", "");
                return this.CSSTransitions=(test.style.length === 1);
            } catch(e) {}
            return (this.CSSTransitions=false);
        });
        
    /*  Define a getter function that will determine whether CSS3 Border Images
        are available only when actually asked. When invoked, this function will
        replace itself with the correct value.
     */
    coherent.Support.__defineGetter__('BorderImage', function()
        {
            delete this.BorderImage;
            var style = document.createElement('div').style;
            try {
                style.cssText = '-webkit-border-image: inherit; -moz-border-image: inherit;';
                return this.BorderImage=((style.WebkitBorderImage == 'inherit') || (style.MozBorderImage == 'inherit'));
            } catch (e) {}
            return (this.BorderImage=false);
        });
}




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
        
    return Object.prototype.toString.call(o).slice(8,-1).toLowerCase();
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
