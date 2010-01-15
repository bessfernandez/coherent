/*jsl:import ../core/startup.js*/
/*jsl:import ../net/XHR.js*/
/*jsl:import ../core/asset.js*/

/** Creator for NIBs.
 */
function NIB(def)
{
    var oldDataModel= coherent.dataModel;
    var model= coherent.dataModel= NIB.__model;

    var v;
    var p;
    var ignore= coherent.KVO.typesOfKeyValuesToIgnore;
    var ctypeof= coherent.typeOf;
    var views= [];
    var specialKeys= NIB.specialKeys;

    for (p in def)
    {
        //  Skip owner, because it's special
        if (p in specialKeys)
            continue;
    
        v= def[p];

        if (v && 'function'===typeof(v) && v.__factoryFn__)
            v= v.call(model);

        if (v instanceof coherent.Asset)
            v= v.content();
        
        if (!(ctypeof(v) in ignore) && !('addObserverForKeyPath' in v))
            coherent.KVO.adaptTree(v);

        if (v instanceof coherent.View)
            views.push(v);
        model.setValueForKey(v, p);
    }

    model.__views= views;

    //  Setup linkages to the special objects
    for (var key in specialKeys)
    {
        var specialDef= def[key];
        var special= model.valueForKey(key);
        var modelValue;
    
        if (!special)
            continue;
        
        for (p in specialDef)
        {
            v= specialDef[p];
            if ('string'!==typeof(v))
            {
                special.setValueForKeyPath(v, p);
                continue;
            }
        
            //  See if the value is a keypath into the current model
            modelValue= model.valueForKeyPath(v);
            if (null===modelValue || 'undefined'===typeof(modelValue))
            {
                special.setValueForKeyPath(v, p);
                continue;
            }
        
            special.setValueForKeyPath(modelValue, p);
        }
    }

    coherent.dataModel= oldDataModel;
}

Object.extend(NIB, {

    asset: function(href, content)
    {
        return new coherent.Asset(href, content);
    },

    __scriptLoaded: function(href, owner, source)
    {
        var head= document.getElementsByTagName('head')[0];
        var script= document.createElement('script');
        script.type = 'text/javascript';
        script.defer = false;

        window.__filename__= href;
        var model= NIB.__model= new coherent.KVO();

        NIB.__model.setValueForKey(owner, 'owner');
        NIB.__model.setValueForKey(coherent.Application.shared, 'application');

        if (coherent.Browser.IE)
            script.text= source;
        else
            script.appendChild(document.createTextNode(source));
        head.appendChild(script);

        NIB.__model= null;
        window.__filename__= null;
        return model;
    },

    load: function(href, owner)
    {
        var d= XHR.get(href, null, {
                        responseContentType: 'text/plain'
                    });
        d.addCallback(NIB.__scriptLoaded.bind(null, href, owner));
        return d;
    },

    specialKeys: {
        'owner': true,
        'application': true
    }

});
