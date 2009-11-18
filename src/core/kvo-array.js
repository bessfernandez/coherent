/*jsl:import kvo.js*/
/*jsl:import array-additions.js*/

/** Add some methods to the Array prototype to support Key Value functionality.
    
    @scope Array.prototype
 */
Class.extend(Array, {

    /** Does the array contain the specified object?
        @param {Object} obj - the object to find
        @returns {Boolean} `true` if the object is contained in the array
     */
    containsObject: function(obj)
    {
        return -1!==this.indexOf(obj);
    },
    
    /** Retrieve the "value" of a particular key for an Array object. This will
        invoke `valueForKey` on each array element and return an array of the
        results.
      
        @param {String} key - the name of the attribute to retrieve.
      
        @returns {Array} an array containing the values for the particular key
            on each element of the array
        @throws `InvalidArgumentError` if the key is not specified
     */
    valueForKey: function(key)
    {
        if (!key || 0===key.length)
            throw new InvalidArgumentError("the key is empty");

        if ('@count'==key)
            return this.length;
        
        //  create an array to hold the results
        var value= new Array(this.length);
        var index;
        var len= this.length;
        var v;
    
        for (index=0; index<len; ++index)
        {
            v= this[index];
            value[index]= v?v.valueForKey(key):null;
        }
        return value;
    },

    /** Set a value for a particular key for all elements of the Array.
      
        @param value - the value to assign
        @param {String} key - the name of the attribute to assign
      
        @throws `InvalidArgumentError` if the key is not specified
     */
    setValueForKey: function(value, key)
    {
        if (!key || 0===key.length)
            throw new InvalidArgumentError("key is empty");

        var index;
        var len= this.length;
        for (index=0; index<len; ++index)
            this[index].setValueForKey(value, key);
    },

    /** Find the indexes of the specified objects. Begins searching from the
        beginning of the array. Returns an empty array if none of the objects
        appear in this array.
      
        @param {Array} objects - the objects to find
        @returns {Number[]} the indexes of the specified objects
     */
    indexesOfObjects: function(objects)
    {
        var i;
        var len= objects.length;
        var result= [];
    
        var index;
    
        for (i=0; i<len; ++i)
        {
            index= this.indexOf(objects[i]);
            if (-1===index)
                continue;
            result.push(index);
        }
    
        return result;
    },

    /** Append the object to the end of the array. This method begins observing
        changes for the new element and notifies its observers of the insertion.
      
        @param object - the object to add to the array
     */
    addObject: function(object)
    {
        var index= this.length;
        var change= new coherent.ChangeNotification(this,
                                                coherent.ChangeType.insertion,
                                                [object], null, [index]);
        this.push(object);
        this.observeElementAtIndex(index);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },

    /** Add all the objects in the array to this array. This method begins
        observing all the new elements and will send a change notification for
        the insertion.
      
        @param {Array} array - the new objects to add
     */
    addObjects: function(array)
    {
        var len= array.length;
        var insertedIndex = this.length;
        var newObjects = [];
        var newIndexes = [];
        var change= new coherent.ChangeNotification(this,
                                                coherent.ChangeType.insertion,
                                                newObjects, null, newIndexes);
        
        for (var index=0; index < len; ++index)
        {
            var object = array[index];
            
            // Add object to array and start observing
            this.push(object);
            this.observeElementAtIndex(insertedIndex);
            // Add object and index to our change notification
            newObjects.push(object);
            newIndexes.push(insertedIndex++);
        }
        
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },

    /** Insert an object at the specified index. Wrapper for the standard splice
        method that observes the new element and fires a change notification for
        the array's observers.
      
        @param object - the object to insert into the array
        @param {Number} index - where in the array to insert the object
        
        @throws `RangeError` if the index is either less than 0 or greater than
                or equal to the length of the array.
     */
    insertObjectAtIndex: function(object, index)
    {
        if (index<0 || index>=this.length)
            throw new RangeError( "index must be within the bounds of the array" );

        var change= new coherent.ChangeNotification(this,
                                                coherent.ChangeType.insertion,
                                                [object], null, [index]);
        this.splice(index, 0, object);
        this.observeElementAtIndex(index);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },

    /** Insert a number of objects at the specified indexes. The indexes need
        not be contiguous. New elements will be observed for changes and a
        single change notification will be sent for the entire insertion.
        
        @param {Array} objects - an array of objects to insert
        @param {Number[]} indexes - an array of indexes for where the objects
            should be inserted.
        
        @throws `InvalidArgumentError` if the length of `objects` does not equal
                the length of `indexes`.
     */
    insertObjectsAtIndexes: function(objects, indexes)
    {
        if (objects.length!==indexes.length)
            throw new InvalidArgumentError('length of objects and indexes parameters must be equal');
        
        var len= objects.length;
        var i;
        var index;
        
        for (i=0; i<len; ++i)
        {
            index= indexes[i];
            this.splice(index, 0, objects[i]);
            this.observeElementAtIndex(index);
        }
        
        var change= new coherent.ChangeNotification(this,
                                                coherent.ChangeType.insertion,
                                                objects, null, indexes);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },

    /** Replace an object in the array with a new object. Fires a change
        notification for the replacement.
        
        @param object - the new object
        @param {Number} index - the index of the old object to replace
     */
    replaceObjectAtIndex: function(object, index)
    {
        var oldValue= this[index];
        this[index]= object;

        var change= new coherent.ChangeNotification(this,
                                                coherent.ChangeType.replacement,
                                                [object], [oldValue], [index]);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
        
    },

    /** Replace an array of objects with new objects. Fires a single change
        notification for the entire change.
        
        @param {Array} objects - the new objects
        @param {Number[]} indexes - the indexes of the old objects to replace
     */
    replaceObjectsAtIndexes: function(objects, indexes)
    {
        var oldValues= [];
        var len= objects.length;
        var i;
        var index;
        
        for (i=0; i<len; ++i)
        {
            index= indexes[i];
            oldValues[i]= this[index];
            this.stopObservingElementAtIndex(index);
            this[index]= objects[i];
            this.observeElementAtIndex(index);
        }
        
        var change= new coherent.ChangeNotification(this,
                                                coherent.ChangeType.replacement,
                                                objects, null, indexes);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },    
    
    /** Remove an object from the array. This will automatically stop observing
        changes to the element.
        
        @param object - the object to remove
     */
    removeObject: function(object)
    {
        var index= this.indexOf(object);
        if (-1===index)
            return;
        this.removeObjectAtIndex(index);
    },
    
    /** Remove each of the given objects from the array. Changes to the removed
        objects will no longer trigger change notifications.
        
        @param {Array} objects - an array of objects to remove
     */
    removeObjects: function(objects)
    {
        var len= objects.length;
        var indexes=[];
        var index;
        
        for (var i=0; i<len; ++i)
        {
            index= this.indexOf(objects[i]);
            if (-1===index)
                continue;
            indexes.push(index);
        }
        
        if (indexes.length)
            this.removeObjectsAtIndexes(indexes);
    },
    
    /** Remove all the objects with the given indexes. Removed elements will no
        longer trigger change notifications (unless they appear more than once).
        
        @param {Number[]} indexes - the indexes of the objects to remove
     */
    removeObjectsAtIndexes: function(indexes)
    {
        var index;
        var sortedIndexes = indexes.sort(coherent.reverseCompareNumbers);
        var len=indexes.length;
        var oldValues = [];
        
        for (index=0; index<len; ++index)
        {
            var actualIndex = sortedIndexes[index];
            this.stopObservingElementAtIndex(actualIndex);
            oldValues.push(this[actualIndex]);
            this.splice(actualIndex, 1);
        }

        var change= new coherent.ChangeNotification(this, coherent.ChangeType.deletion,
                                                null, oldValues, sortedIndexes);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);                                               
    },
    
    /** Remove an object from the array at the specified index.
      
        @param {Number} index - the location of the object to remove
     */
    removeObjectAtIndex: function(index)
    {
        if (index<0 || index>=this.length)
            throw new RangeError( "index must be within the bounds of the array" );
        this.stopObservingElementAtIndex(index);
        var oldValue= this.splice(index, 1);
        var change= new coherent.ChangeNotification(this,
                                                coherent.ChangeType.deletion,
                                                null, oldValue, [index]);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },

    /** Remove all objects from the array.
     */
    removeAllObjects: function()
    {
        var index;
        var indexArray= [];
        var len= this.length;
    
        indexArray.length= len;
        for (index=0; index<len; ++index)
        {
            this.stopObservingElementAtIndex(index);
            indexArray[index]= index;
        }

        var oldValue= this.splice(0, len);
        var change= new coherent.ChangeNotification(this, coherent.ChangeType.deletion,
                                                null, oldValue, indexArray);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },

    /** Retrieve a sub-set of this array containing the objects at the specified
        array indexes.
      
        @param {Number[]} indexes - the indexes of the retrieved objects
        @returns {Array} a new array containing only those objects at the
            specified indexes.
     */
    objectsAtIndexes: function(indexes)
    {
        var i;
        var result= [];
        var len= indexes.length;
        result.length= indexes.length;
    
        for (i=0; i<len; ++i)
            result[i]= this[indexes[i]];
        return result;
    },

    /** Change notification handler for array elements. This handler receives a
        notification for changes to the key values of array elements.
      
        @param {coherent.ChangeNotification} change - a ChangeNotification object
        @param {String} keyPath - the key path that has changed
        @param context - the context information original specified for this key
     */
    observeChildObjectChangeForKeyPath: function(change, keyPath, context)
    {
        //  Determine the index of the object generating the change
        //  notification, but since elements can move around, I need to look
        //  up the index.
        var obj= change.object;
        var elementIndex= this.indexOf(obj);

        if (!this.__uid)
            this.initialiseKeyValueObserving();
            
        if (-1===elementIndex)
        {
            //  no longer actually in the array
            obj._removeParentLink(this, null, this.__uid);
            return;
        }
        
        //  Pass this along up the change
        var elementChange= new coherent.ChangeNotification(obj,
                                                   coherent.ChangeType.replacement,
                                                   [change.newValue],
                                                   [change.oldValue],
                                                   [elementIndex]);
        elementChange.notifiedObserverUids= Object.clone(change.notifiedObserverUids);
        this.notifyObserversOfChangeForKeyPath(elementChange, keyPath);
    },

    /** Setup the observer structure for an array element. This allows the array to
        propagate change notifications for its elements.
      
        @private
        @param {Number} index - the index of the element to observe
     */
    observeElementAtIndex: function(index)
    {
        var value= this[index];

        if (!value || !value._addParentLink)
            return;

        if (!this.__uid)
            this.initialiseKeyValueObserving();
            
        value._addParentLink(this, null, this.__uid);
    },

    /** Cancel observing change notifications for the specified element.
        
        @private
        @param {Number} index - the index of the element to ignore
     */
    stopObservingElementAtIndex: function(index)
    {
        var value= this[index];

        if (!value || !value._removeParentLink)
            return;

        if (!this.__uid)
            this.initialiseKeyValueObserving();

        value._removeParentLink(this, null, this.__uid);
    },

    /** Initialise Key Value Observing for this array.
        @private
     */
    initialiseKeyValueObserving: function()
    {
        /*  This array has never had an observer. I'll probe it to make certain
            the container relationships are established correctly.
         */
        var index;
        var len= this.length;
    
        this.__observers= {};
        this.__uid= this.__uid||coherent.generateUid();
        
        for (index=0; index<len; ++index)
            this.observeElementAtIndex(index);
    }
    
});

//  Add all KVO methods to Arrays
coherent.KVO.adapt(Array.prototype);
