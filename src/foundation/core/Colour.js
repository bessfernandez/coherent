/*jsl:import ../../foundation.js*/

/** A wrapper for colour objects */
var Colour= Class._create({
  constructor: function(r, g, b, a)
  {
    this.r=r||0;
    this.g=g||0;
    this.b=b||0;
    this.a=a||1;
  },

  toString: function()
  {
    return [this.r, this.g, this.b, this.a].join(',');
  },
  
  subtract: function(colour)
  {
    return new Colour(this.r-colour.r,
              this.g-colour.g,
              this.b-colour.b,
              this.a-colour.a);
  }
});

Colour.transparent= new Colour(255,255,255,0);
Colour.black= new Colour(0,0,0,1);
Colour.white= new Colour(255,255,255,1);

Colour.fromString= function(colour)
{
  if (typeof(colour) != "string")
    return colour;
  
  colour= colour.toLowerCase();
  if (colour in Colour)
    return Colour[colour];

  var rgb;

  if ((rgb= colour.match(/^rgb(?:a)?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d(?:\.\d+)?)\s*)?\)$/i)))
    return new Colour(parseInt(rgb[1], 10),
              parseInt(rgb[2], 10),
              parseInt(rgb[3], 10),
              parseInt(rgb[4]||1, 10));

  if ('#'!==colour.charAt(0))
    throw new Error('Invalid colour: ' + colour);
  
  if (4==colour.length)
    return new Colour(parseInt(colour.charAt(1)+colour.charAt(1), 16),
              parseInt(colour.charAt(2)+colour.charAt(2), 16),
              parseInt(colour.charAt(3)+colour.charAt(3), 16));
    else
    return new Colour(parseInt(colour.substr(1,2), 16),
              parseInt(colour.substr(3,2), 16),
              parseInt(colour.substr(5,2), 16));
}
