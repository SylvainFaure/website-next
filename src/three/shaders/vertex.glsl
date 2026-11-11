uniform float time;
varying float pulse;

varying vec2 vUv;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec2 uQuadSize;
uniform vec2 uTextureSize;
uniform vec4 uCorners;

// varying vec3 vNormal;
varying vec2 vSize;

void main() {
  vUv = uv;
  float PI = 3.1415926;
  float sine = sin(PI*uProgress);
  float waves = sine*(0.1*sin(3.*length(uv) + 2.* uProgress));
  vec4 defaultState = modelMatrix * vec4( position, 1.0 );
  vec2 halfResolution = vec2(uResolution.x/2., uResolution.y/2.);
  vec4 fullScreenState = vec4( position, 1.);
  fullScreenState.x *= uTextureSize.x * 2.;
  fullScreenState.y *= uTextureSize.y * 2.;
  fullScreenState.z += uCorners.x;

  float cornersProgress = mix(
    mix(uCorners.z, uCorners.w, uv.x),
    mix(uCorners.x, uCorners.y, uv.x),
    uv.y
  );

  vec4 finalState = mix(defaultState, fullScreenState, cornersProgress + waves);

  vSize = mix(uQuadSize, vec2(uTextureSize.x * 2., uTextureSize.y * 2.), cornersProgress);
  gl_Position = projectionMatrix * viewMatrix * finalState;
}