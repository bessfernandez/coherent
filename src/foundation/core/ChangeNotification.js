/*jsl:import ../../foundation.js*/

/** Enumerations for the types of changes.
  
    @property setting - A key's value has changed, the newValue property of
      the change notification will contain the new value. If the key
      represents an array, the newValue is the new array.
    
    @property insertion - An element or elements have been inserted into an
      array. The newValue property of the change notification will contain the
      new elements. The indexes property of the change notification will
      contain the index at which each element was inserted. The oldValue
      property will be null.
    
    @property deletion - An element or elements have been removed from an
      array. The newValue property of the change notification will be null.
      The oldValue property will contain the elements removed from the array.
      And the indexes property will contain the index of each element that was
      removed.
    
    @property replacement - An element or elements have been replace in an array.
      The newValue property of the change notification contains the new values
      for each element. The oldValue property contains the previous values for
      each element. And the indexes property will contain the index of each
      element replaced.
    
    @property validationError - The property has failed delayed validation. This
      can happen when the model values need to be sent to a server for
      validation.
    
    @namespace
 */
coherent.ChangeType=
{
  setting: 0,
  insertion: 1,
  deletion: 2,
  replacement: 3,
  validationError: 4
};



  
/** Change notifications are the root of all updates.
  @constructor
  
  @property {Object} object - The object for which this update is being sent
  @property {coherent.ChangeType} changeType - The type of change this
        notification represents, one of `setting`, `insertion`, `deletion`,
        or `replacement`.
  @property newValue - The new value for the property
  @property oldValue - The previous value for the property
  @property {Number[]} indexes - If the change is for an array, this is an
        array of modified indexes, otherwise, this will be undefined.
        
  @property {Set} notifiedObserverUids - this is the set UIDs from of observers
        that have already received notifications for this change.
 */
coherent.ChangeNotification= function(object, changeType, newValue, oldValue, indexes)
{
  this.object= object;
  this.changeType= changeType;
  this.newValue= newValue;
  this.oldValue= oldValue;
  this.indexes= indexes;
  this.notifiedObserverUids= {};
}
