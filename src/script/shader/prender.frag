#define PARTICLE_LIFE_SPEED 2.0

#define HUGE 9E16
#define PI 3.14159265
#define V vec3(0.,1.,-1.)
#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))

// ------

precision highp float;

varying vec3 vPos;
varying vec3 vObjVert;
varying vec3 vNor;
varying float vLife;
varying float vLen;

uniform bool depth;

uniform float time;
uniform float frames;
uniform vec2 resolution;
uniform vec3 cameraPos;
uniform vec3 lightPos;

uniform sampler2D textureEyeball;

// ------

vec3 catColor( float _p ) {
  return 0.5 + 0.5 * vec3(
    cos( _p ),
    cos( _p + PI / 3.0 * 2.0 ),
    cos( _p + PI / 3.0 * 4.0 )
  );
}

mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

void main() {
  float decay = exp( -0.2 * vLen );
  float dif = dot( -vNor, normalize( vec3( 1.0 ) ) );
  vec2 uv = vec2(
    atan( vObjVert.z, vObjVert.x ) / PI / 2.0 + 0.5,
    atan( vObjVert.y, length( vObjVert.xz ) ) / PI + 0.5
  );
  vec3 color = texture2D( textureEyeball, uv ).xyz;
  color = mix( vec3( 0.0 ), color, decay );

  gl_FragColor = vec4( color, 1.0 );
}