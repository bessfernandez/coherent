/*jsl:import ../core/startup.js*/
/*jsl:import ../net/XHR.js*/
/*jsl:import ../core/asset.js*/

/*jsl:declare NIB*/

(function() {

    function NIB(def)
    {
        var oldDataModel= coherent.dataModel;
        var model= coherent.dataModel= NIB.__model;
    
        var v;
        var p;
        var ignore= coherent.KVO.typesOfKeyValuesToIgnore;
        var ctypeof= coherent.typeOf;
    
        for (p in def)
        {
            //  Skip owner, because it's special
            if ('owner'===p)
                continue;
            
            v= def[p];

            if (v && 'function'===typeof(v) && v.__factoryFn__)
                v= v.call(model);

            if (v instanceof coherent.Asset)
                v= v.content();
                
            if (!(ctypeof(v) in ignore) && !('addObserverForKeyPath' in v))
                coherent.KVO.adaptTree(v);
        
            model.setValueForKey(v, p);
        }

        //  Setup linkages to the owner object
        if ('owner' in def)
        {
            var ownerDef= def.owner;
            var owner= model.valueForKey('owner');
            var modelValue;
            
            for (p in ownerDef)
            {
                v= ownerDef[p];
                if ('string'!==typeof(v))
                {
                    owner.setValueForKeyPath(v, p);
                    continue;
                }
                
                //  See if the value is a keypath into the current model
                modelValue= model.valueForKeyPath(v);
                if (null===modelValue || 'undefined'===typeof(modelValue))
                {
                    owner.setValueForKeyPath(v, p);
                    continue;
                }
                
                owner.setValueForKeyPath(modelValue, p);
            }
        }
        
        coherent.dataModel= oldDataModel;
    }

    function scriptLoaded(href, owner, source)
    {
        var head= document.getElementsByTagName('head')[0];
        var script= document.createElement('script');
        script.type = 'text/javascript';
        script.defer = false;
        
        window.__filename__= href;
        var model= NIB.__model= new coherent.KVO();
        NIB.__model.setValueForKey(owner, 'owner');
        if (coherent.Browser.IE)
            script.text= source;
        else
            script.appendChild(document.createTextNode(source));
        head.appendChild(script);
        
        NIB.__model= null;
        window.__filename__= null;
        return model;
    }
    
    Object.extend(NIB, {

        asset: function(href, content)
        {
            var prefix= coherent.Scripts.currentScriptPrefix();
            if (!prefix)
                throw new Error('NIB.asset only available during load.');
            if ('/'!==href.charAt(0))
                href= [prefix, href].join("");
            return new coherent.Asset(href, content, prefix);
        },
        
        load: function(href, owner)
        {
            var lastSlash= href.lastIndexOf('/');
            NIB.__prefix= href.substring(0, lastSlash+1);
            var d= XHR.get(href, null, {
                            responseContentType: 'text/plain'
                        });
            d.addCallback(scriptLoaded.bind(null, href, owner));
            return d;
        }

    });

    window.NIB= NIB;
    
})();