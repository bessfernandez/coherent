/*jsl:import kvo.js*/


/** SortDescriptors are a helper class that is used to sort groups of 
    KVO-compliant objects by a specific keypath.
    
    @property {String} keyPath - The path to the property that is used for comparisons
    @property {Boolean} ascending - When `true`, values are compared in ascending
        order. When `false`, values are compared in descending order.
    @property {Function} [comparisonFn] - A function to use when comparing values.
        If no comparison function is specified, the default is
        {@link coherent.compareValues}.
 */
coherent.SortDescriptor= Class.create({

    /** Initialise a new SortDescriptor.
        
        @param {String} keyPath - The path to the key to compare on each object
        @param {Boolean} ascending - Whether this descriptor sorts values in
               ascending (true) or descending (false) order.
        @param {Function} [comparisonFn] - Either the name of the comparison
               method, which must be defined on the values to compare, or a
               reference to a comparison function. This function must take one
               parameter, the object to compare against, and must return -1,0,1
               based on whether the this value is less than, equal to, or
               greater than the comparison value.
        @throws {InvalidArgumentError} if `comparisonFn` is neither a string nor
                a function.
     */
    constructor: function(keyPath, ascending, comparisonFn)
    {
        this.keyPath= keyPath;
        this.ascending= ascending;
        this.comparisonFn= comparisonFn || this.defaultCompare;

        var comparisonType= typeof(this.comparisonFn);
        if ("string"!=comparisonType && "function"!=comparisonType)
            throw new InvalidArgumentError( "comparisonFn must be either the name of a method or a function reference" );
    },
    
    /** Find the comparison function on o.
        
        @param {Object} o - The object on which `comparisonFn` should be found.
        @returns {Function} A method reference to the method on o
        @throws {TypeError} if the comparisonFn member doesn't resolve to a function.
     */
    resolveComparisonFn: function(o)
    {
        var fn= this.comparisonFn;
        if ("string"===typeof(fn))
            fn= o[fn];
        if ("function"!==typeof(fn))
            throw new TypeError( "comparisonFn does not resolve to a function" );
        
        return fn;
    },
    
    /** Compare two objects using the comparison function to determine their
        sort order.
        
        @param {Object} object1 - The first object
        @param {Object} object2 - The second object
        @returns {Number} -1 if object1 preceeds object2, 0 if object1 and
                 object2 are equal, 1 if object1 follows object2.
     */
    compareObjects: function(object1, object2)
    {
        if (!object1.valueForKeyPath || !object2.valueForKeyPath)
            throw new InvalidArgumentError( "Objects are not Key Value compliant" );
        var v1= object1.valueForKeyPath(this.keyPath);
        var v2= object2.valueForKeyPath(this.keyPath);

        var fn= this.resolveComparisonFn(v1);
    
        return fn.call(v1, v2);
    },
    
    /** Default comparison function which will work for Strings, Numbers, Dates,
        and Booleans. This method is meant to be called as a method of one of the
        objects to compare (via the call method).
        @returns {Number} -1,0,1 depending on sort order.
     */
    defaultCompare: function(o)
    {
        return coherent.compareValues(this, o);
    },
    
    /** Return a SortDescriptor that sorts in the reverse order to this descriptor.
        @returns {coherent.SortDescriptor} a new SortDescriptor.
     */
    reversedSortDescriptor: function()
    {
        return new coherent.SortDescriptor(this.keyPath, !this.ascending,
                                           this.comparisonFn);
    }

});


/** Compare two objects according to the specified sort descriptors.
    @returns -1 if obj1 appears before obj2, 1 if obj1 appears after obj2,
             and 0 if obj1 is equal to obj2. If no sort descriptors have
             been set, all objects are equal.
 */
coherent.SortDescriptor.comparisonFunctionFromDescriptors= function(sortDescriptors)
{
    /** A simple sort function that uses all the sort descriptors associated
        with this coherent.ArrayController. The first descriptor that returns
        a non-zero value (AKA not equal) terminates the comparison. Note,
        this sort function receives the indexes from the arranged array and
        uses those indexes to find the objects to compare in the content
        array.
    
        @param index1   the index in the content array of the first object
        @param index2   the index in the content array of the second object
        @returns -1 if obj1 is less than obj2, 0 if the two objects are equal,
                 1 if obj1 is greater than obj2.
     */
    var numberOfSortDescriptors= sortDescriptors.length;

    if (!numberOfSortDescriptors)
        return null;
    else
        return function compareObjects(obj1, obj2)
        {
            var s;
            var result;
    
            for (s=0; s<numberOfSortDescriptors; ++s)
            {
                result= sortDescriptors[s].compareObjects(obj1, obj2);
                if (0===result)
                    continue;

                if (!sortDescriptors[s].ascending)
                    result*=-1;
                return result>0?1:-1;
            }

            return 0;
        };
}