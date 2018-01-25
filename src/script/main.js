import xorshift from './xorshift';
xorshift( 13487134006 );
import GLCat from './glcat';
import step from './step';
import Tweak from './tweak';
import Automaton from './automaton.min';
import octahedron from './octahedron';

const glslify = require( 'glslify' );

// ------

const clamp = ( _value, _min, _max ) => Math.min( Math.max( _value, _min ), _max );
const saturate = ( _value ) => clamp( _value, 0.0, 1.0 );

// ------

let automaton = new Automaton( {
  gui: divAutomaton,
  data: `
  {"rev":20170418,"length":1,"resolution":1000,"params":{"cameraRot":[{"time":0,"value":-2,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":0.88,"value":0,"mode":4,"params":{"rate":1000,"damp":1},"mods":[false,false,false,false]},{"time":1,"value":8.874144482791154,"mode":5,"params":{"gravity":200,"bounce":0},"mods":[false,false,false,false]}],"iSeeYou":[{"time":0,"value":0,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":0.4,"value":0,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":1,"value":1,"mode":5,"params":{"gravity":10,"bounce":0},"mods":[false,false,false,false]}],"cameraFov":[{"time":0,"value":160,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":1,"value":90,"mode":4,"params":{"rate":500,"damp":1},"mods":[false,false,false,false]}],"postNoiseAmp":[{"time":0,"value":0.2,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":0.8,"value":0,"mode":4,"params":{"rate":400,"damp":1},"mods":[false,false,false,false]},{"time":1,"value":0.2,"mode":5,"params":{"gravity":10,"bounce":0},"mods":[false,false,false,false]}],"cameraPhase":[{"time":0,"value":0,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":0.1,"value":0,"mode":4,"params":{"rate":500,"damp":1},"mods":[false,false,false,false]},{"time":1,"value":17.761904761904763,"mode":5,"params":{"gravity":4,"bounce":0},"mods":[false,false,false,false]}],"cameraLen":[{"time":0,"value":16,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":0.5,"value":5,"mode":4,"params":{"rate":100,"damp":1},"mods":[false,false,false,false]},{"time":1,"value":5,"mode":0,"params":{},"mods":[false,false,false,false]}],"datamosh":[{"time":0,"value":0.3,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":0.92,"value":0.001,"mode":4,"params":{"rate":1000,"damp":1},"mods":[false,false,false,false]},{"time":1,"value":0.3,"mode":2,"params":{},"mods":[false,false,false,false]}],"ampDry":[{"time":0,"value":1.2,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":1,"value":1.2,"mode":1,"params":{},"mods":[false,false,{"freq":3,"amp":0.3,"reso":8,"recursion":4,"seed":1},false]}],"ampMotion":[{"time":0,"value":1,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":0.33,"value":0,"mode":2,"params":{},"mods":[false,false,false,false]},{"time":1,"value":1,"mode":5,"params":{"gravity":5,"bounce":0},"mods":[{"velocity":0},false,false,false]}]},"gui":{"snap":{"enable":false,"bpm":120,"offset":0}}}
`
} );
let auto = automaton.auto;

// ------

let width = 320;
let height = 320;
canvas.width = width;
canvas.height = height;

let gl = canvas.getContext( 'webgl' );
let glCat = new GLCat( gl );

// ------

let tweak = new Tweak( divTweak );

// ------

let oct = octahedron( 1 );

// ------

let totalFrame = 0;
let frame = 0;
let frames = 200;
let time = 0.0;
let init = true;
let secs = 1.0;
let deltaTime = 0.0;

let timeUpdate = () => {
  let reset = false;

  totalFrame ++;
  frame ++;
  if ( frames <= frame ) {
    frame = 0;
    reset = true;
  }
  
  let prevTime = time;
  time = secs * frame / frames;
  deltaTime = ( time + ( reset ? secs : 0.0 ) ) - prevTime;

  init = false;
};

// ------

let particlePixels = 4;
let particlesSqrt = 64;
let particles = particlesSqrt * particlesSqrt;
let vertPerParticle = oct.pos.length / 3;

let vboQuad = glCat.createVertexbuffer( [ -1, -1, 1, -1, -1, 1, 1, 1 ] );
let vboParticle = glCat.createVertexbuffer( ( () => {
  let ret = [];
  for ( let i = 0; i < particlesSqrt * particlesSqrt * vertPerParticle; i ++ ) {
    let ix = Math.floor( i / vertPerParticle ) % particlesSqrt;
    let iy = Math.floor( i / particlesSqrt / vertPerParticle );
    let iz = i % vertPerParticle;
    
    ret.push( ix * particlePixels );
    ret.push( iy );
    ret.push( iz );
  }
  return ret;
} )() );

// ------

let vertQuad = glslify( './shader/quad.vert' );

let programReturn = glCat.createProgram(
  vertQuad,
  glslify( './shader/return.frag' )
);

let programPcompute = glCat.createProgram(
  vertQuad,
  glslify( './shader/pcompute.frag' )
);

let programPrender = glCat.createProgram(
  glslify( './shader/prender.vert' ),
  glslify( './shader/prender.frag' )
);

let programPost = glCat.createProgram(
  vertQuad,
  glslify( './shader/post.frag' )
);

let programMotion = glCat.createProgram(
  vertQuad,
  glslify( './shader/motion.frag' )
);

let programMotionSel = glCat.createProgram(
  vertQuad,
  glslify( './shader/motionSel.frag' )
);

// ------

let framebufferReturn = glCat.createFloatFramebuffer( width, height );
let framebufferPcomputeReturn = glCat.createFloatFramebuffer( particlesSqrt * particlePixels, particlesSqrt );
let framebufferPcompute = glCat.createFloatFramebuffer( particlesSqrt * particlePixels, particlesSqrt );
let framebufferRender = glCat.createFloatFramebuffer( width, height );
let framebufferPrev = glCat.createFloatFramebuffer( width, height );
let framebufferMotion = glCat.createFloatFramebuffer( width, height );
let framebufferPost = glCat.createFloatFramebuffer( width, height );
let framebufferMosh = glCat.createFloatFramebuffer( width, height );
let framebufferMoshReturn = glCat.createFloatFramebuffer( width, height );

// ------

let textureRandomSize = 256;

let textureRandomUpdate = ( _tex ) => {
  glCat.setTextureFromArray( _tex, textureRandomSize, textureRandomSize, ( () => {
    let len = textureRandomSize * textureRandomSize * 4;
    let ret = new Uint8Array( len );
    for ( let i = 0; i < len; i ++ ) {
      ret[ i ] = Math.floor( xorshift() * 256.0 );
    }
    return ret;
  } )() );
};

let textureRandomStatic = glCat.createTexture();
glCat.textureWrap( textureRandomStatic, gl.REPEAT );
textureRandomUpdate( textureRandomStatic );

let textureRandom = glCat.createTexture();
glCat.textureWrap( textureRandom, gl.REPEAT );

let textureEyeball = glCat.createTexture();

let textureOctahedronPos = glCat.createTexture();
glCat.setTextureFromFloatArray( textureOctahedronPos, oct.pos.length / 3, 1, ( () => {
  let ret = [];
  for ( let i = 0; i < oct.pos.length / 3; i ++ ) {
    ret[ i * 4 + 0 ] = oct.pos[ i * 3 + 0 ];
    ret[ i * 4 + 1 ] = oct.pos[ i * 3 + 1 ];
    ret[ i * 4 + 2 ] = oct.pos[ i * 3 + 2 ];
    ret[ i * 4 + 3 ] = 1.0;
  }
  return ret;
} )() );

let textureOctahedronNor = glCat.createTexture();
glCat.setTextureFromFloatArray( textureOctahedronNor, oct.nor.length / 3, 1, ( () => {
  let ret = [];
  for ( let i = 0; i < oct.nor.length / 3; i ++ ) {
    ret[ i * 4 + 0 ] = oct.nor[ i * 3 + 0 ];
    ret[ i * 4 + 1 ] = oct.nor[ i * 3 + 1 ];
    ret[ i * 4 + 2 ] = oct.nor[ i * 3 + 2 ];
    ret[ i * 4 + 3 ] = 1.0;
  }
  return ret;
} )() );

// ------

let renderA = document.createElement( 'a' );

let saveFrame = () => {
  renderA.href = canvas.toDataURL();
  renderA.download = ( '0000' + totalFrame ).slice( -5 ) + '.png';
  renderA.click();
};

// ------

let cameraPos = [ 0.0, 0.0, 0.0 ];
let cameraRot = 0.0;
let cameraFov = 90.0;

let render = () => {
  gl.viewport( 0, 0, particlesSqrt * particlePixels, particlesSqrt );
  glCat.useProgram( programReturn );
  gl.bindFramebuffer( gl.FRAMEBUFFER, framebufferPcomputeReturn.framebuffer );
  gl.blendFunc( gl.ONE, gl.ONE );
  glCat.clear( 0.0, 0.0, 0.0, 0.0 );

  glCat.attribute( 'p', vboQuad, 2 );

  glCat.uniform2fv( 'resolution', [ particlesSqrt * particlePixels, particlesSqrt ] );

  glCat.uniformTexture( 'texture', framebufferPcompute.texture, 0 );

  gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

  // ------

  gl.viewport( 0, 0, particlesSqrt * particlePixels, particlesSqrt );
  glCat.useProgram( programPcompute );
  gl.bindFramebuffer( gl.FRAMEBUFFER, framebufferPcompute.framebuffer );
  gl.blendFunc( gl.ONE, gl.ONE );
  glCat.clear( 0.0, 0.0, 0.0, 0.0 );

  glCat.attribute( 'p', vboQuad, 2 );

  glCat.uniform1f( 'time', time );
  glCat.uniform1f( 'particlesSqrt', particlesSqrt );
  glCat.uniform1f( 'particlePixels', particlePixels );
  glCat.uniform1f( 'frame', frame % frames );
  glCat.uniform1f( 'frames', frames );
  glCat.uniform1i( 'init', init );
  glCat.uniform1f( 'deltaTime', deltaTime );
  glCat.uniform2fv( 'resolution', [ particlesSqrt * particlePixels, particlesSqrt ] );
  glCat.uniform3fv( 'cameraPos', cameraPos );
  glCat.uniform1f( 'cameraRot', cameraRot );
  
  glCat.uniformTexture( 'textureReturn', framebufferPcomputeReturn.texture, 0 );
  glCat.uniformTexture( 'textureRandom', textureRandom, 1 );

  gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

  // ------

  gl.viewport( 0, 0, width, height );
  glCat.useProgram( programPrender );
  gl.bindFramebuffer( gl.FRAMEBUFFER, framebufferRender.framebuffer );
  gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
  glCat.clear( 0.0, 0.0, 0.0, 1.0 );
  
  glCat.attribute( 'vuv', vboParticle, 3 );

  glCat.uniform1i( 'depth', false );
  glCat.uniform1f( 'time', time );
  glCat.uniform1f( 'frames', frames );
  glCat.uniform2fv( 'resolution', [ width, height ] );
  glCat.uniform2fv( 'resolutionPcompute', [ particlesSqrt * particlePixels, particlesSqrt ] );
  glCat.uniform3fv( 'cameraPos', cameraPos );
  glCat.uniform1f( 'cameraRot', cameraRot );
  glCat.uniform1f( 'cameraFov', cameraFov );
  glCat.uniform1f( 'vertPerParticle', vertPerParticle );
  glCat.uniform1f( 'iSeeYou', auto( 'iSeeYou' ) );

  glCat.uniformTexture( 'texturePcompute', framebufferPcompute.texture, 0 );
  glCat.uniformTexture( 'textureOctahedronPos', textureOctahedronPos, 1 );
  glCat.uniformTexture( 'textureOctahedronNor', textureOctahedronNor, 2 );
  glCat.uniformTexture( 'textureEyeball', textureEyeball, 3 );
  
  gl.drawArrays( gl.TRIANGLES, 0, particles * vertPerParticle );
  
  // ------

  gl.viewport( 0, 0, width, height );
  glCat.useProgram( programPost );
  gl.bindFramebuffer( gl.FRAMEBUFFER, framebufferPost.framebuffer );
  gl.blendFunc( gl.ONE, gl.ONE );
  glCat.clear( 0.0, 0.0, 0.0, 1.0 );

  glCat.attribute( 'p', vboQuad, 2 );

  glCat.uniform1f( 'time', time );
  glCat.uniform2fv( 'resolution', [ width, height ] );
  glCat.uniform1f( 'postNoiseAmp', auto( 'postNoiseAmp' ) );

  glCat.uniformTexture( 'texture', framebufferRender.texture, 0 );
  glCat.uniformTexture( 'textureRandom', textureRandomStatic, 1 );
  
  gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
  
  // ------

  gl.viewport( 0, 0, width, height );
  glCat.useProgram( programMotion );
  gl.bindFramebuffer( gl.FRAMEBUFFER, framebufferMotion.framebuffer );
  gl.blendFunc( gl.ONE, gl.ONE );
  glCat.clear( 0.0, 0.0, 0.0, 0.0 );

  glCat.attribute( 'p', vboQuad, 2 );

  glCat.uniform2fv( 'resolution', [ width, height ] );

  glCat.uniformTexture( 'texture', framebufferPost.texture, 0 );
  glCat.uniformTexture( 'textureP', framebufferPrev.texture, 1 );
  
  gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
  
  // ------

  gl.viewport( 0, 0, width, height );
  glCat.useProgram( programMotionSel );
  gl.bindFramebuffer( gl.FRAMEBUFFER, framebufferMoshReturn.framebuffer );
  gl.blendFunc( gl.ONE, gl.ONE );
  glCat.clear( 0.0, 0.0, 0.0, 1.0 );

  glCat.attribute( 'p', vboQuad, 2 );

  glCat.uniform2fv( 'resolution', [ width, height ] );
  glCat.uniform1f( 'threshold', auto( 'datamosh' ) );

  glCat.uniform1f( 'ampDry', auto( 'ampDry' ) );
  glCat.uniform1f( 'ampMotion', auto( 'ampMotion' ) );
  
  glCat.uniformTexture( 'textureMotion', framebufferMotion.texture, 0 );
  glCat.uniformTexture( 'textureCurrent', framebufferPost.texture, 1 );
  glCat.uniformTexture( 'textureMosh', framebufferMosh.texture, 2 );
  
  gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
  
  // ------

  gl.viewport( 0, 0, width, height );
  glCat.useProgram( programReturn );
  gl.bindFramebuffer( gl.FRAMEBUFFER, framebufferMosh.framebuffer );
  gl.blendFunc( gl.ONE, gl.ONE );
  glCat.clear( 0.0, 0.0, 0.0, 1.0 );

  glCat.attribute( 'p', vboQuad, 2 );

  glCat.uniform2fv( 'resolution', [ width, height ] );

  glCat.uniformTexture( 'texture', framebufferMoshReturn.texture, 0 );
  
  gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
  
  // ------

  gl.viewport( 0, 0, width, height );
  glCat.useProgram( programReturn );
  gl.bindFramebuffer( gl.FRAMEBUFFER, framebufferPrev.framebuffer );
  gl.blendFunc( gl.ONE, gl.ONE );
  glCat.clear( 0.0, 0.0, 0.0, 1.0 );

  glCat.attribute( 'p', vboQuad, 2 );

  glCat.uniform2fv( 'resolution', [ width, height ] );

  glCat.uniformTexture( 'texture', framebufferPost.texture, 0 );
  
  gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
  
  // ------

  gl.viewport( 0, 0, width, height );
  glCat.useProgram( programReturn );
  gl.bindFramebuffer( gl.FRAMEBUFFER, null );
  gl.blendFunc( gl.ONE, gl.ONE );
  glCat.clear( 0.0, 0.0, 0.0, 1.0 );

  glCat.attribute( 'p', vboQuad, 2 );

  glCat.uniform2fv( 'resolution', [ width, height ] );

  glCat.uniformTexture( 'texture', framebufferMosh.texture, 0 );
  
  gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
}

// ------

let update = () => {
  if ( frame % frames === 0 ) { xorshift( 79017846734887343443 ); }

  if ( !tweak.checkbox( 'play', { value: true } ) ) {
    setTimeout( update, 10 );
    return;
  }

  let cameraPhase = auto( 'cameraPhase' );
  let cameraLen = auto( 'cameraLen' );
  cameraPos = [
    cameraLen * Math.sin( cameraPhase ),
    0.0,
    cameraLen * Math.cos( cameraPhase )
  ];
  cameraRot = auto( 'cameraRot' );
  cameraFov = auto( 'cameraFov' );
  
  textureRandomUpdate( textureRandom );
  
  automaton.update( time );
  render();

  console.log( totalFrame );

  timeUpdate();

  if ( tweak.checkbox( 'save', { value: false } ) ) {
    saveFrame();
  }
  
  requestAnimationFrame( update );
};

// ------

step( {
  0: ( done ) => {
    let image = new Image();
    image.onload = () => {
      glCat.setTexture( textureEyeball, image );
    };
    image.src = 'images/eye.png';
    done();
  },

  1: ( done ) => {
    update();
  }
} );

window.addEventListener( 'keydown', ( _e ) => {
  if ( _e.which === 27 ) {
    tweak.checkbox( 'play', { set: false } );
  }
} );
