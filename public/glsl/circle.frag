
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
  vec4 textureColor = texture2D(u_texture, v_texcoord);
  if (textureColor.a < 0.5) {
    discard;
  }
  gl_FragColor = vec4(textureColor.rgb, textureColor.a);
}
