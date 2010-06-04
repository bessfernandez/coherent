/*jsl:import ../data.js*/

/** @class An ID for the managed object. This includes the entity class and the
    unique ID of the object.
  
    @property {coherent.EntityDescription} entity
    The entity associated with this ID
  
    @property {String|Number} id
    The unique ID for the managed object represented by this ManagedObjectId
 */
coherent.ManagedObjectId= function(entity, id)
{
  this.entity= entity;
  this.id= id;
}
coherent.ManagedObjectId.prototype.toString= function()
{
  return this.__stringValue ||
       (this.__stringValue=[this.entity.name, this.id].join("-"));
}
