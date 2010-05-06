/*jsl:import ManagedObjectId.js*/





/** The base class for managed objects.
 */
coherent.ManagedObject= Class.create(coherent.KVO, {

    constructor: function()
    {
        this.base();
        this.__fault= false;
        this.__modified= false;
        this.__serverData= {};
        this.__updatedData= {};
        this.__relations= {};
    },
    
    /** Return the object's unique ID. This is unique across all entities.
        @type coherent.ManagedObjectId
     */
    objectId: function()
    {
        return this.__objectId;
    },
    
    /** Return the managed object context for this object.
        @type coherent.ManagedObjectContext
     */
    managedObjectContext: function()
    {
        return this.__managedObjectContext;
    },
    
    /** Change or set the managed object context for this managed object. This
        method should be used with extreme care.
        @private
        @param {coherent.ManagedObjectContext} managedObjectContext
     */
    setManagedObjectContext: function(managedObjectContext)
    {
        this.__managedObjectContext= managedObjectContext;
    },
    
    /** Return whether the ManagedObject has been inserted into the context and
        needs to be created into the context.
        @type Boolean
     */
    isInserted: function()
    {
    },

    /** Returns whether the ManagedObject has been updated since fetching.
        @type Boolean
     */
    isUpdated: function()
    {
    },
    
    /** Returns whether the ManagedObject has been deleted since it was fetched
        or last committed.
        @type Boolean
     */
    isDeleted: function()
    {
    },
    
    /** Returns whether the ManagedObject is currently a fault. When a property
        is ready or written to a fault, the ManagedObject is fetched from the
        persistent store.
        @type Boolean
     */
    isFault: function()
    {
    },
    
    primitiveValueForKey: function(key)
    {
        return this.__updatedData[key] || this.__serverData[key];
    },
    
    setPrimitiveValueForKey: function(value, key)
    {
        this.__modified= true;
        this.__updatedData[key]= value;
    }

});