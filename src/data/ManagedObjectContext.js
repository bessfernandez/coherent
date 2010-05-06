/*jsl:import ManagedObject.js*/

/** The managed object context.
 */
coherent.ManagedObjectContext= Class.create({

    /** Returns the object with the specified ID or null if there's no object
        with that ID.
        @param {coherent.ManagedObjectId} objectId - The ID of the object to
            retrieve
        @type coherent.ManagedObject
     */
    objectRegisteredWithId: function(objectId)
    {
    },
    
    /** Returns the object with the specified ID. If the object is not already
        in the context, this will return a fault.
        @param {coherent.ManagedObjectId} objectId - The ID of the object to
            retrieve
        @type coherent.ManagedObject
     */
    objectWithId: function(objectId)
    {
    },
    
    /** Returns an array of the objects that are registered with this context.
        @type coherent.ManagedObject[]
     */
    registeredObjects: function()
    {
    },
    
    /** Returns an array of objects that have been inserted into the context.
        These objects will be created in the persistent store when the context
        is saved.
        @type coherent.ManagedObject[]
     */
    insertedObjects: function()
    {
    },
    
    /** Returns an array of objects that have been updated in the context since
        the last save.
        @type coherent.ManagedObject[]
     */
    updatedObjects: function()
    {
    },
    
    /** Returns an array of objects deleted from the context since the last
        save.
        @type coherent.ManagedObject[]
     */
    deletedObjects: function()
    {
    },
    
    /** Reset a context to its initial state. This discards any references to
        managed objects in the context. Any ManagedObjects received from the
        context should also be discarded because their link to the context will
        be broken.
     */
    reset: function()
    {
    },
    
    /** Insert a managed object into the context.
        @param {coherent.ManagedObject} managedObject - The object to insert into
            the managed object context.
     */
    insertObject: function(managedObject)
    {
    },
    
    /** Delete a managed object from the context.
        @param {coherent.ManagedObject} managedObject - The object to delete from
            the managed object context.
     */
    deleteObject: function(managedObject)
    {
    },
    
    /** Refresh an object from the persistent store. If `mergeChanges` is `false`,
        the object is set to be a fault and the properties are loaded when
        accessed.
        
        @param {coherent.ManagedObject} managedObject - The object to refresh.
        @param {Boolean} [mergeChanges=false] - Whether the current values should
            be retained and merged with the refreshed values.
     */
    refreshObject: function(managedObject, mergeChanges)
    {
    }
});
