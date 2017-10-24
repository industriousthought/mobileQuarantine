
attribute vec2 a_texcoord;
attribute vec4 a_position;
attribute vec4 a_instance;
attribute vec4 a_pose;

uniform mat4 u_cameraMatrix;
uniform vec2 u_canvasDims;

varying vec2 v_texcoord;

mat4 scaleTranslateMatrix(vec3 scale, vec3 translate) {
    mat4 m = mat4(1.);
    m[0][0] = scale.x;
    m[1][1] = scale.y;
    m[2][2] = scale.z;
    m[3][0] = translate.x;
    m[3][1] = translate.y;
    m[3][2] = translate.z;

    return m;
}

mat4 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

void main() {

    mat4 rotM = rotationMatrix(vec3(0, 0, -1), a_instance.z);
    mat4 textureM = scaleTranslateMatrix(vec3(a_pose.z, a_pose.w, 1), vec3(a_pose.x, a_pose.y, 0));
    mat4 scaleM = scaleTranslateMatrix(vec3(a_instance.w * 2.0, a_instance.w * 2.0, 1), vec3(0, 0, 0));
    mat4 translateM = scaleTranslateMatrix(vec3(1, 1, 1), vec3(a_instance.x + u_canvasDims.x, a_instance.y + u_canvasDims.y, 0));

    v_texcoord = (textureM * vec4(a_texcoord, 0, 1)).xy;
    gl_Position = u_cameraMatrix * translateM * rotM * scaleM * a_position;
}
