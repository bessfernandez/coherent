/*jsl:import ../core/../../foundation.js*/

/** @interface coherent.Array
  
 */
coherent.Array= Class._create({

  /** Retrieve an object at a specified index
      @param {Number} index
      @type Object
   */
  objectAtIndex: function(index)
  {
    throw new Error("Unimplemented");
  },
 
  /** Retrieve the number of objects in the array
      @type Number
   */
  count: function()
  {
    throw new Error("Unimplemented");
  },

  /** Insert an object at the specified index.
      @param {Object} object - The object to insert
      @param {Number} index - Where to insert the new object
   */
  insertObjectAtIndex: function(object, index)
  {
    throw new Error("Unimplemented");
  },
  
  /** Remove the object at the specified index from the array.
      @param {Number} index
   */
  removeObjectAtIndex: function(index)
  {
    throw new Error("Unimplemented");
  },

  /** Add an object to the end of the array.
      @param {Object} object - The new object
   */
  addObject: function(object)
  {
    throw new Error("Unimplemented");
  },

  /** Replace the object at the specified index with the new object.
      @param {Number} index - The index of the object to replace.
      @param {Object} newObject - The object which will replace the existing object.
   */
  replaceObjectAtIndexWithObject: function(index, newObject)
  {
    throw new Error("Unimplemented");
  },

  /** Create a copy of the array. */
  copy: function()
  {
    throw new Error("Unimplemented");
  },

  /** Add a collection of objects to the array.
      @param {Object[]} newObjects - the collection of objects to add
   */
  addObjects: function(newObjects)
  {
    newObjects.forEach(this.addObject, this);
  },
  
  /** Remove an object from the array.
    
      @param {Object} object - the object to remove
   */
  removeObject: function(object)
  {
    var index= this.indexOfObject(object);
    if (-1===index)
      return;
    this.removeObjectAtIndex(index);
  },
  
  /** Remove each of the given objects from the array.
  
      @param {Object[]} objects - an array of objects to remove
   */
  removeObjects: function(objects)
  {
    var len= objects.length;
    var indexes=[];
    var index;
    
    while (len--)
    {
      index= this.indexOfObject(objects.objectAtIndex(len));
      if (-1===index)
        continue;
      indexes.push(index);
    }
    
    if (indexes.length)
      this.removeObjectsAtIndexes(indexes);
  },

  /** Insert objects at specified indexes. The length of `newObjects` should be
      the same as `indexes` or the outcome is undefined.
      @param {Object[]} newObjects - The new objects to insert
      @param {Number[]} indexes - The indexes at which to insert the new objects
   */
  insertObjectsAtIndexes: function(newObjects, indexes)
  {
    var len= newObjects.length;
    for (var i=0; i<len; ++i)
      this.insertObjectAtIndex(newObjects[i], indexes[i]);
  },
  
  /** Retrieve the objects at the specified indexes.
      @param {Number[]} indexes
      @type Object[]
   */
  objectsAtIndexes: function(indexes)
  {
    var len= indexes.length;
    var result= new Array(len);
    for (var i=0; i<len; ++i)
      result[i]= this.objectAtIndex(indexes[i]);
    return result;
  },
  
  /** Find the index of the specified object in the array. Returns -1 if the
      object is not present in the array.
      @param {Object} object - The object to find
      @type Number
   */
  indexOfObject: function(object)
  {
    var len= this.count();
    for (var i=0; i<len; ++i)
      if (object===this.objectAtIndex(i))
        return i;
    return -1;
  },
  
  /** Determine whether the array contains a specific object.
      @param {Object} object - The object to check for inclusion in the array
   */
  containsObject: function(object)
  {
    return -1!==this.indexOfObject(object);
  },
  
  /** Execute a function for each element in this array.
      @param {Function} f - The function to execute
      @param {Object} obj - The scope for the function to execute in
   */
  forEach: function(f, obj)
  {
    var len= this.count();
    for (var i = 0; i < len; i++)
      f.call(obj, this.objectAtIndex(i), i, this);
  },
  
  filter: function(f, obj)
  {
    var len= this.count();
    var res= [];
    var value;
    for (var i = 0; i < len; i++)
    {
      value= this.objectAtIndex(i);
      if (f.call(obj, value, i, this))
        res.push(value);
    }
    return res;
  },

  map: function(f, obj)
  {
    var len= this.count();
    var res= [];
    for (var i = 0; i < len; i++)
    {
      res.push(f.call(obj, this.objectAtIndex(i), i, this));
    }
    return res;
  },

  some: function(f, obj)
  {
    var len= this.count();
    for (var i = 0; i < len; i++)
    {
      if (f.call(obj, this.objectAtIndex(i), i, this))
        return true;
    }
    return false;
  },

  every: function(f, obj)
  {
    var len= this.count();
    for (var i = 0; i < len; i++)
    {
      if (!f.call(obj, this.objectAtIndex(i), i, this))
        return false;
    }
    return true;
  }

});
 
