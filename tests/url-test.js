/*jsl:import test-helpers.js*/

Test.create('url-test', {

    setup: function()
    {
    },

    testParse: function(t)
    {
        var url= new URL('http://coherent.apple.com');
        
        t.assertEqual('http', url.protocol);
        t.assertEqual('coherent.apple.com', url.host);
        t.assertEqual('', url.path);
    }
    
});
