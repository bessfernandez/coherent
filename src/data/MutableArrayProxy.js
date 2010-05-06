/*jsl:import ../data.js*/

/** This class is a stand-in for a To-Many relation on a KVO object.
 */
coherent.MutableArrayProxy= Class._create(coherent.Array, {

    constructor: function(object, key)
    {
        var proto= object.constructor.prototype || object;
        var titleKey= key.titleCase();
        
        this._countOf= proto['countOf'+titleKey];
        this._objectAtIndex= proto['objectIn'+titleKey+'AtIndex'];
        this._objectsAtIndexes= proto[titleKey+'AtIndexes'];
        this._insertObjectAtIndex= proto['insertObjectIn'+titleKey+'AtIndex'];
        this._removeObjectAtIndex= proto['removeObjectFrom'+titleKey+'AtIndex'];
        this._addObject= proto['add'+titleKey+'Object'];
        this._addObjects= proto['add'+titleKey];
        this._removeObject= proto['remove'+titleKey+'Object'];
        this._removeObjects= proto['remove'+titleKey];
        
        if (!this._countOf || !this._objectAtIndex || !this._objectsAtIndexes ||
            !this._insertObjectAtIndex || !this._removeObjectAtIndex ||
            !this._addObject || !this._addObjects || !this._removeObject ||
            !this._removeObjects)
        {
            throw new Error('MutableArrayProxy: One or more required methods missing');
        }
    }

});