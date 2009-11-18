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
    install: function(script)
    {
        if (!script)
            return;
        
        function insertScript(source)
        {
            if (!source || !source.length)
                return;
            
            var script = document.createElement('script');
            if (coherent.Browser.IE)
                script.text= source;
            else
                script.appendChild(document.createTextNode(source));
            script.type = 'text/javascript';
            script.defer = false;
            var head = document.getElementsByTagName('head').item(0);
            head.appendChild(script);
        }
        
        if ('string'===typeof(script))
        {
            insertScript(script);
            return;
        }
        
        script.forEach(insertScript);
    }
};
