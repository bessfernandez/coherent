/*jsl:import startup.js*/

/** A collection of code used to handle script elements in HTML
    @namespace
*/
coherent.Scripts = {

    /** Extract scripts from an HTML string.
    
        @returns {String} a string object stripped of scripts with a property
            `scripts` which contains the stripped scripts
    */
    extract: function(input) 
    {
        var regex = RegExp("(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)", "img");
        var scripts = [];
        
        var stripped = new String(input.replace(regex, function() {
            scripts.push(arguments[1]);
            return '';
        }));
        
        stripped.scripts = scripts;
        
        return stripped;
    },
    
    /** Installs a script in the global scope.
    
        @param {String|String[]} script - The script or an array of scripts to
            install in the global scope.
     */
    install: function(source, href)
    {
        if (!source)
            return;
            
        var head = document.getElementsByTagName('head').item(0);
        var script = document.createElement('script');
        
        if (coherent.Browser.IE)
            script.text= source;
        else
            script.appendChild(document.createTextNode(source));

        script.type = 'text/javascript';
        script.defer = false;
        window.__filename__= href;
        head.appendChild(script);
        window.__filename__= null;

        console.log('inserted');
    },
    
    currentScriptUrl: function()
    {
        if (window.__filename__)
            return window.__filename__;

        var scripts= document.getElementsByTagName("script");
        if (!scripts || !scripts.length)
            throw new Error("Could not find script");

        var l= scripts.length;
        var s;
    
        for (--l; l>=0; --l)
        {
            s= scripts[l];
            if (s.src)
                return s.src;
        }
    
        throw new Error("No script tags with src attribute.");
    },
    
    currentScriptPrefix: function()
    {
        var currentUrl= this.currentScriptUrl();
        if (this.__currentPrefix && this.__currentUrl===currentUrl)
            return this.__currentPrefix;
    
        this.__currentUrl= currentUrl;
        var lastSlash= currentUrl.lastIndexOf('/');
        return currentUrl.substring(0, lastSlash+1);
    }
};
