
function showError(errorText){
    const errorBoxDiv = document.getElementById('error-box')
    const errorTextElement = document.createElement('p')
    errorTextElement.innerText = errorText;
    errorBoxDiv.appendChild(errorTextElement)
    console.log(errorText)
}
showError('_______No ERROR :)_______')

function helloTriangle(){

    /* **************************** *
    *  PHASE ONE: 
    *           PREPARING DATA
    * **************************** */

    const canvas = document.getElementById('canvas')
    if(!canvas){
        showError('Cannot get canvas reference - check for typos oe loading script too early in HTML')
        return;
    }
    const gl = canvas.getContext('webgl2');
    if(!gl){
        showError('This browser does not support WebGL2 - this demo will not work!')
        return;
    }

    const triangleVertices = [
        // Top middle
        0.0, 0.5,
        // Bottom left
        -0.5, -0.5,
        //Bottom rigth
        0.5, -0.5
    ];
    // here gpu need 32 bit float number unlike js default 64 bit 
    // so we need to convert it for the gpu
    const triangleVerticesCpuBuffer = new Float32Array(triangleVertices)
    // send the data to the gpu , BUT gpu can't read js variables
    // so we create a buffer for the gpu
    // first we createBuffer then we attach the vairable its type (ARRAY_BUFFER) 
    // then we bufferDATA or we give it its data (triangleVerticesCpuBuffer)
    const triangleGeoBuffer = gl.createBuffer();        // create a buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer)   // attach it to ARRAY_BUFFER
    gl.bufferData(gl.ARRAY_BUFFER, triangleVerticesCpuBuffer, gl.STATIC_DRAW) // now give it its data

    /* 
        @vertexShaderSourceCode : hold glsl script
        @version : first line will tell wich glsl version to use
        @precision {lowp, mediump, highp}
            **(precision) mediump is to tell the gpu how precise the float calcs must be 
            ** mediump is default , and is close to highp but highp is more expensive
            ** especialy on mobile devices because it consume more batery
        @ in vec2 : input vector 2 axies (x, y) floats .. named 'vertexPosition'
        @gl_Position : is the output for the draw/render/paint
            vec4 (x, y, z, w) : x,y,z are coordinates in the axies and w is the devider
    */
    const vertexShaderSourceCode = `#version 300 es
        precision mediump float;

        in vec2 vertexPosition;


        void main(){
            gl_Position = vec4(vertexPosition, 0.0, 1.0);
        }
    `;

    // send the data to the gpu , BUT gpu can't read js variables
    // so we create a shader for the gpu
    // first we 'createShader' with type of (VERTEX_SHADER)
    // then we 'shaderSource' or we give it its data (vertexShaderSourceCode)
    // then we 'compileShader'
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSourceCode)
    gl.compileShader(vertexShader)
    // CHECK FOR ERROR IN THIS STEP ..
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        const compileError = gl.getShaderInfoLog(vertexShader);
        showError(`Failde to COMPILE vertex shader - ${compileError}`);
        return;
    }

    /* 
        @fragmentShaderSourceCode : hold glsl script
        @ out vec4 : output vector 4 for rgba colors channel (r,g,b,a) .. named 'vColor'
        @vColor : is the output for the draw/render/paint
    */
    const fragmentShaderSourceCode = `#version 300 es
        precision mediump float;

        out vec4 vColor;


        void main(){
            vColor = vec4(0.294, 0.0, 0.51, 1.0);
        }
    `;
    // send the data to the gpu , BUT gpu can't read js variables
    // so we create a shader for the gpu
    // first we 'createShader' with type of (FRAGMENT_SHADER)
    // then we 'shaderSource' or we give it its data (fragmentShaderSourceCode)
    // then we 'compileShader'
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSourceCode)
    gl.compileShader(fragmentShader)
    // CHECK FOR ERROR IN THIS STEP ..
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        const compileError = gl.getShaderInfoLog(fragmentShader);
        showError(`Failde to COMPILE fragment shader - ${compileError}`);
        return;
    }

    // now using our vertexShader and fragmentShader we create a program
    // we attach both vertexShader and fragmentShader with 'attachShader' to the program 
    // then we link the program using 'linkProgram'
    const triangleShaderProgram = gl.createProgram()
    gl.attachShader(triangleShaderProgram, vertexShader)
    gl.attachShader(triangleShaderProgram, fragmentShader)
    gl.linkProgram(triangleShaderProgram)
    // CHECK FOR ERROR IN THIS STEP ..
    if(!gl.getProgramParameter(triangleShaderProgram, gl.LINK_STATUS)){
        const compileError = gl.getShaderInfoLog(triangleShaderProgram);
        showError(`Failde to LINK shaders - ${compileError}`);
        return;
    }

    // using 'getAttribLocation' to get the 'vertexPosition'
    const vertexPositionAttribLocation = gl.getAttribLocation(triangleShaderProgram, 'vertexPosition');
    // CHECK FOR ERROR IN THIS STEP ..
    if(vertexPositionAttribLocation < 0){
        showError(`Failde to get attrib location!`);
        return;
    }


    /* **************************** *
    *  PHASE TWO: 
    *           Pipeline..
    * **************************** */

    // Output merger - how to merge the shaded pixel fragment with the existing output image
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
    gl.clearColor(0.08, 0.08, 0.08, 1.0); // define the clear color
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear color & depth

    // Rasterizer - wich pixels are part of triangle
    gl.viewport(0, 0, canvas.width, canvas.height)

    // Set GPU program (vertex + fragment shader pair)
    gl.useProgram(triangleShaderProgram)
    gl.enableVertexAttribArray(vertexPositionAttribLocation)

    // Input assembler - how to read vertices from our gpu triangle buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
    gl.vertexAttribPointer(
        /* index: which attribute to use */
       vertexPositionAttribLocation,
       /* size: how many components in that attribute*/
       2,
       /* type: what is the data type stored in the GPU buffer for this attribute? */
       gl.FLOAT,
       /* normalized: detemines how to convert ints to floats, is that's what you're doing */
       false, 
       /* stride: how many bytes to move forward in the buffer to find the same attribute for the next vertex */
       /* 0: means the gpu will figure it out OR we can do it ourselves */
       2 * Float32Array.BYTES_PER_ELEMENT , 
       /* offset : how many bytes should the input assembler skip into the buffer when reading attributes */
       0
   )

    // Draw call (also configures primitive assembly)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
}

try{
    helloTriangle()
}catch(err){
    showError(`Uncaugth Javascript exeption: ${err}`)
}