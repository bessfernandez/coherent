/*jsl:import ../core/startup.js*/

/** An object proxy for XML objects vended from an Ajax Controller 
 *  
 *  @declare coherent.ModeledXMLProxy
 *  @extends coherent.KVO
 */
coherent.ModeledXMLProxy = Class.create(coherent.KVO, {
    
    // The root of the xml tree
    _xmlRoot: null,     // Root
    _xmlNode: null,     // This node
    
    constructor: function(root,node,model)
    {
        this._xmlRoot = root;
        this._xmlNode = node;
        this._xmlModel = model;
        this._valueCache = {};
        
        if (model) {
            if (coherent.typeOf(model) == "array") {
                this._xmlModel = model[0];
            }
        }
    },
    
    _typeOfChild: function(childName)
    {
        var type = "string";
        var toMany = false;
        
        if (!this._xmlModel) {
            return null;
        }
        
        var model = this._xmlModel[childName];
        
        if (model == undefined) {
            // If we don't have a model and we aren't requesting #content, then return string
            if (childName != "#content"){
                return {"type": "string", "toMany": false};                                     
            } else {
                return null;                                                 
            }
        }
        
        type = coherent.typeOf(model);
            
        if (type == "array") {
            toMany = true;
            type = coherent.typeOf(model[0]);
        }
        
        if (type == "string" && model == "xhtml") {
            type = "xhtml";
        }
        
        return {"type": type, "toMany": toMany};
    },

    _valueOfNode: function(node,type)
    {
        var stringValue = null;
        var value = null;
        var self = this;
                        
        if (type == "object") {
            return new coherent.ModeledXMLProxy(self._xmlRoot,node,model);
        }
        
        for (var child = node.firstChild; child; child = child.nextSibling) {
            
            if (type == "xhtml") {
                if (child.nodeType == 1 && (child.namespaceURI == coherent.ModeledXMLProxy.NS_XHTML)) {
                    return child.outerHTML || child.xml || child.innerHTML;
                }
            } else if ((child.nodeType == 3) || (child.nodeType == 4)){ // Text or CDATA
                // Ignore all whitespace #text
                if( !(/[^\t\n\r ]/.test(child.data)) )
                    continue;
                    
                stringValue = child.data;
            }					
        }
        
        if (stringValue) {
            if (type == "boolean") {
                if (stringValue == "true" ||
                    stringValue == "YES") {
                    value = true;
                } else if (stringValue == "false" ||
                            stringValue == "NO"){
                    value = false;
                }
            } else if (type == "number") {
                value = Number(stringValue);
                
                if (value == NaN)
                    value = stringValue;
            } else {
                value = stringValue;
            }
        }
    
        return value;
    },
        
    _valueOfChild: function(childName)
    {
        var self = this;
        var model = null;
        var type = null;
        var toMany = false;
        
        function childrenOfType(node,type)
        {
            var children = new Array();
            
            for (var child = node.firstChild; child; child = child.nextSibling) {
                var childName = child.nodeName;

                if( childName == type )
                    children.push(child);				
            }
            
            return children.length?children:undefined;
        }
         
        var typeObj = this._typeOfChild(childName);
        
        if (!typeObj) {
            return null;
        }
        
        type = typeObj.type;
        toMany = typeObj.toMany;
        
        if (childName == "#content") {
            return this._valueOfNode(this._xmlNode,type);
        }
        
        var nodes = childrenOfType(this._xmlNode,childName);
        var value = null;
        
        if  (toMany) {
            value = new Array();
            
            if (nodes){
                nodes.forEach(function(node){
                    value.push(self._valueOfNode(node,type));
                });
            }
        } else if (nodes && nodes.length){
            value = this._valueOfNode(nodes[0],type);
        }
        
        return value;
    },
    
    _rawValueForKey: function(key)
    {
        var value = null;
        
        if (0 === key.indexOf("$")) {
            // Return attribute
            value = this._xmlNode.getAttribute(key.substr(1));
        } else if (0 === key.indexOf("#")) {
            value = this._valueOfChild(key);
        } else {
            value = this._valueOfChild(key);
        }
        
        return value;
    },
    
    toString: function()
    {
        if(this._typeOfChild("#content")) {
            return this.valueForKey("#content");
        }
        
        return "OBJECT";
    },
    
    valueForKey: function(key)
    {
        var value = this._valueCache[key];
        
        if (!key || 0===key.length)
            throw new InvalidArgumentError( "the key is empty" );
        
        
        if (undefined === value) {
            var keyInfo;
            
            if (!this.__keys) {
                this.__keys = {};
            }
            
            this.__keys[key] = keyInfo = new coherent.ModeledXMLKeyInfo(this,key);

            value =  keyInfo.get(this);
        }
        
        // If this is an element with #content and it is accessed directly, return the #content, not
        // the wrapper object
        if (!this._valueAccessedViaKeyPath && value && (value instanceof coherent.ModeledXMLProxy)) {
            if(value._typeOfChild("#content")) {
                return value.valueForKey("#content");
            }
        }
        
        return value;
    },
    
    valueForKeyPath: function(keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath may not be empty" );
        
        //  if the keyPath is a string, split it into an array on the period
        //  between each key
        if ("string"==typeof(keyPath))
            keyPath= keyPath.split(".");
        
        this._valueAccessedViaKeyPath = true;
        
        var key= keyPath[0];
        var value = this.base(keyPath);
        
        delete this._valueAccessedViaKeyPath;
        
        // If this value came from a single keypath expansion
        if (1==keyPath.length && value){
            if (value instanceof coherent.ModeledXMLProxy) {
                if(value._typeOfChild("#content")) {
                    return value.valueForKey("#content");
                }
            }
        }

        // Use the default value
        return value;
    }
});

coherent.ModeledXMLProxy.NS_XHTML = "http://www.w3.org/1999/xhtml";

coherent.ModeledXMLKeyInfo = Class.create(coherent.KeyInfo,{
    constructor: function(obj, key)
    {
        var getPropsOriginal = coherent.KVO.getPropertyMethodsForKeyOnObject;
        var xmlValue = obj._rawValueForKey(key);
        
        coherent.KVO.getPropertyMethodsForKeyOnObject = function(key, obj) {
            return { value: xmlValue,
                     getter: function() {
                        return this._valueCache[key];
                     },
                     mutator: function(newValue) {
                        this.willChangeValueForKey(key);
                        this._valueCache[key] = newValue;
                        this.didChangeValueForKey(key);
                     }
             };
        }
        
        this.base(obj,key);
        
        obj._valueCache[this.key] = xmlValue;
        
        coherent.KVO.getPropertyMethodsForKeyOnObject = getPropsOriginal;
    }    
});