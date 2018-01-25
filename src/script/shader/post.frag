#define HUGE 9E16
#define PI 3.14159265
#define V vec3(0.,1.,-1.)
#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))

// ------

precision highp float;

uniform float time;
uniform vec2 resolution;
uniform float postNoiseAmp;

uniform sampler2D texture;
uniform sampler2D textureRandom;

// ------

float dither( vec2 pix ) {
  vec2 p = mod( floor( pix ), 2.0 );
  return (
    p == V.xx ? 0.0 :
    p == V.yy ? 0.25 :
    p == V.xy ? 0.5 :
    0.75
  );
}

vec2 barrel( float _amp, vec2 _uv ) {
	vec2 uv = _uv;
	float corn = length( vec2( 0.5 ) );
	float amp = min( _amp * 3.0, PI * corn );
	float zoom = corn / ( tan( corn * amp ) + corn );
	return saturate( ( uv + normalize( uv - 0.5 ) * tan( length( uv - 0.5 ) * amp ) ) * zoom + 0.5 * ( 1.0 - zoom ) );
}

vec2 fractalNoiseV2( vec2 uv ) {
  vec2 ret = vec2( 0.0 );
  for ( int i = 0; i < 4; i ++ ) {
    float p = pow( 2.0, float( i + 1 ) );
    ret += ( texture2D( textureRandom, uv * 0.01 * p ).xy - 0.5 ) / p;
  }
  return ret;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  uv += fractalNoiseV2( uv * 4.0 ) * postNoiseAmp;
  float vig = 1.14 - length( uv - 0.5 ) * 0.8;

  vec3 tex = vec3(
    texture2D( texture, barrel( 0.3, uv ) ).x,
    texture2D( texture, barrel( 0.34, uv ) ).y,
    texture2D( texture, barrel( 0.38, uv ) ).z
  );

  vec3 col = mix(
    vec3( 0.0 ),
    tex,
    vig
  );

  col = vec3(
    smoothstep( -0.04, 0.9, col.x ),
    smoothstep( 0.0, 1.0, col.y ),
    smoothstep( -0.1, 1.1, col.z )
  );
  col = pow( col, vec3( 1.0 / 2.2 ) );

  gl_FragColor = vec4( col, 1.0 );
}