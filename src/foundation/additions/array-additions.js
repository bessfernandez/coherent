/*jsl:import ../core/base.js*/

/** @class
    @name Array
 */
 
Object.applyDefaults(Array, {

    /** Create an array from an array-like object.
        @param {Object} obj - an array-like object.
        @param {Number} [startIndex=0] - The starting index for copying values.
        @returns {Array} a new array containing all the values from the parameter.
     */
    from: (function(){
        if (coherent.Browser.IE)
            return function(obj, startIndex)
            {
                var len= obj.length;
                var result= [];
    
                for (var i=(startIndex||0); i<len; ++i) {
                    result.push(obj[i]);
                }
                return result;
            };
        else
            return function(obj, startIndex)
            {
                return Array.prototype.slice.call(obj, startIndex||0);
            };
    })(),    

    indexOf: function(array, obj, fromIndex) {
        return Array.prototype.indexOf.call(array, obj, fromIndex);
    },

    lastIndexOf: function(array, obj, fromIndex) {
        return Array.prototype.lastIndexOf.call(array, obj, fromIndex);
    },

    forEach: function(array, f, obj) {
        return Array.prototype.forEach.call(array, f, obj);
    },

    filter: function(array, f, obj) {
        return Array.prototype.filter.call(array, f, obj);
    },
    
    map: function(array, f, obj) {
        return Array.prototype.map.call(array, f, obj);
    },
    
    some: function(array, f, obj) {
        return Array.prototype.some.call(array, f, obj);
    },
    
    every: function(array, f, obj) {
        return Array.prototype.every.call(array, f, obj);
    },
    
    reduce: function(array, fun /*, initial*/)
    {
        if (arguments.length>2)
            return Array.prototype.reduce.apply(array, fun, arguments[2]);
        else
            return Array.prototype.reduce.apply(array, fun);
    },
    
    reduceRight: function(array, fun /*, initial*/)
    {
        if (arguments.length>2)
            return Array.prototype.reduceRight.apply(array, fun, arguments[2]);
        else
            return Array.prototype.reduceRight.apply(array, fun);
    }

});

/**#nocode-*/

Object.applyDefaults(Array.prototype, {

    /** Return an array containing the distinct elements from this array.
        @type Array
     */
    distinct: function()
    {
        var len= this.length;
        var result= new Array(len);
        var i;
        var e;
        var count= 0;
    
        for (i=0; i<len; ++i)
        {
            e= this[i];
            if (-1==result.indexOf(e))
                result[count++]= e;
        }
        //  trim to correct size
        result.length= count;
        return result;
    },

    /** Compare an array with another array.

        @param {Array} a - the other array
        @returns {Number} -1 if this array precedes a, 0 if the two arrays are equal,
            and 1 if this array follows a.
     */
    compare: function(a)
    {
        var lengthDifference= this.length - a.length;
        if (0!==lengthDifference)
            return lengthDifference;
        var i;
        var len= this.length;
        var v;
    
        while (len--)
        {
            if (0!==(v=coherent.compareValues(this[len], a[len])))
                return v;
        }
    
        return 0;
    },

    // Mozilla 1.8 & Safari 420+ has support for indexOf, lastIndexOf, forEach, filter, map, some, every
    // http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:lastIndexOf
    indexOf: function(obj, fromIndex)
    {
    	if ('undefined'===typeof(fromIndex)) {
    		fromIndex = 0;
    	} else if (fromIndex < 0) {
    		fromIndex = Math.max(0, this.length + fromIndex);
    	}
    	for (var i = fromIndex; i < this.length; i++) {
    		if (this[i] === obj)
    			return i;
    	}
    	return -1;
    },

    // http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:lastIndexOf
    lastIndexOf: function(obj, fromIndex)
    {
    	if ('undefined'===typeof(fromIndex)) {
    		fromIndex = this.length - 1;
    	} else if (fromIndex < 0) {
    		fromIndex = Math.max(0, this.length + fromIndex);
    	}
    	for (var i = fromIndex; i >= 0; i--) {
    		if (this[i] === obj)
    			return i;
    	}
    	return -1;
    },

    // http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:forEach
    forEach: function(f, obj) {
    	var l = this.length;	// must be fixed during loop... see docs
    	for (var i = 0; i < l; i++) {
    		f.call(obj, this[i], i, this);
    	}
    },
    
    // http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:filter

    filter: function(f, obj) {
    	var l = this.length;	// must be fixed during loop... see docs
    	var res = [];
    	for (var i = 0; i < l; i++) {
    		if (f.call(obj, this[i], i, this)) {
    			res.push(this[i]);
    		}
    	}
    	return res;
    },
    
    // http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:map
    map: function(f, obj) {
    	var l = this.length;	// must be fixed during loop... see docs
    	var res = [];
    	for (var i = 0; i < l; i++) {
    		res.push(f.call(obj, this[i], i, this));
    	}
    	return res;
    },
    
    // http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:some
    some: function(f, obj) {
    	var l = this.length;	// must be fixed during loop... see docs
    	for (var i = 0; i < l; i++) {
    		if (f.call(obj, this[i], i, this)) {
    			return true;
    		}
    	}
    	return false;
    },
    
    // http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:every
    every: function(f, obj) {
    	var l = this.length;	// must be fixed during loop... see docs
    	for (var i = 0; i < l; i++) {
    		if (!f.call(obj, this[i], i, this)) {
    			return false;
    		}
    	}
    	return true;
    },

    // http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:reduce
    reduce: function(fun /*, initial*/)
    {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value and an empty array
        if (0===len && 1===arguments.length)
            throw new TypeError();

        var i = 0;
        if (arguments.length >= 2)
            var rv = arguments[1];
        else
            do {
                if (i in this) {
                    rv = this[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= len)
                    throw new TypeError();
            } while (true);

        for (; i < len; i++)
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);

        return rv;
    },
        
    // http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:reduceRight    
    reduceRight: function(fun /*, initial*/)
    {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value, empty array
        if (0===len && 1===arguments.length)
            throw new TypeError();

        var i = len - 1;
        if (arguments.length >= 2)
            var rv = arguments[1];
        else
            do {
                if (i in this) {
                    rv = this[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError();
            } while (true);

        for (; i >= 0; i--)
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);

        return rv;
    }
    

});
