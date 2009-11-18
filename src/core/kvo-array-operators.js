/*jsl:import kvo-array.js*/



/** Implementations of the Array Operators for Key Value Coding.
 *  
 *  @namespace
 */
coherent.ArrayOperator= {

    /** Determine the average value of all the values in the array. This assumes
        the array is entirely composed of Numbers.
        @param {Number[]} - the array of numbers to average
        @returns {Number} the average value
     */
    avg: function(values)
    {
        return this.sum(values) / values.length;
    },
    
    /** This method is implemented elsewhere.
     */
    count: function(values)
    {
        throw new InvalidArgumentError( "@count operator must end the keyPath" );
    },
    
    /** Return an array comprised the unique objects from the union of a set
        of arrays.
        @param {Array[]} values - the array of arrays to combine
        @returns {Array} a single array containing only the distinct objects
            from all the other arrays
     */
    distinctUnionOfArrays: function(values)
    {
        //  Return the distinct elements from the big flat array.
        return this.unionOfArrays(values).distinct();
    },
    
    distinctUnionOfObjects: function(values)
    {
        return values.distinct();
    },
    
    max: function(values)
    {
        var max= null;
        var i;
        var len;
        var v;
    
        for (i=0, len=values.length; i<len; ++i)
        {
            v= values[i];
            if (null===max || v>max)
                max= v;
        }
        return max;
    },
    
    min: function(values)
    {
        var min= null;
        var i;
        var len;
        var v;
    
        for (i=0, len=values.length; i<len; ++i)
        {
            v= values[i];
            if (null===min || v<min)
                min= v;
        }
        return min;
    },
    
    sum: function(values)
    {
        var sum= 0;
        var len= values.length;
        var i;
        for (i=0; i<len; ++i)
            sum+= values[i];
        return sum;
    },
    
    unionOfArrays: function(values)
    {
        //  TODO: Can't I just use: Array.prototype.concat.apply([], values)?
        var flattened= [];
        var len;
        var i;
        //  Flatten all arrays into a single BIG array
        for (i=0, len=values.length; i<len; ++i)
            flattened= flattened.concat( values[i] );
        return flattened;
    },
    
    unionOfObjects: function(values)
    {
        //  This seems to be a noop...
        return values;
    }
    
};
