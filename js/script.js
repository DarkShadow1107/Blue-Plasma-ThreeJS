import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
console.clear();

let scene = new THREE.Scene();
scene.fog = new THREE.Fog("#fff", 100, 150);
scene.background = new THREE.Color("#fff");
let camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 500);
camera.position.set(3, 5, 8).setLength(15);
let renderer = new THREE.WebGLRenderer({
	antialias: true,
});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", (event) => {
	camera.aspect = innerWidth / innerHeight;
	camera.updateProjectionMatrix();
	baseRT.setSize(innerWidth, innerHeight);
	renderer.setSize(innerWidth, innerHeight);
});

let shiftCam = new THREE.Vector3(0, 2, 0);
camera.position.add(shiftCam);
let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.copy(shiftCam);

let light = new THREE.DirectionalLight(0xffffff, Math.PI);
light.position.setScalar(1);
scene.add(light, new THREE.AmbientLight(0xffffff, Math.PI * 0.5));

//scene.add(new THREE.GridHelper());

let gu = {
	time: { valu: 0 },
	baseRT: { value: null },
};

// render target
let baseScene = new THREE.Mesh(
	new THREE.PlaneGeometry(2, 2),
	new THREE.ShaderMaterial({
		uniforms: {
			time: gu.time,
		},
		vertexShader: `
    	varying vec2 vUv;
      void main() {
      	vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }
    `,
		fragmentShader: `
    	uniform float time;
      varying vec2 vUv;
      ${noise}
      void main(){
        float t = time * 0.2;
        
        vec2 uv = vUv;
        float n = snoise(vec3(uv * 10., t)) * 0.5 + 0.5;
        gl_FragColor = vec4(vec3(n), 1.);
      }
    `,
	})
);
let baseCam = new THREE.Camera();
let baseRT = new THREE.WebGLRenderTarget(innerWidth, innerHeight);
gu.baseRT.value = baseRT.texture;

// plane color
let planeColorHolder = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.2), new THREE.MeshBasicMaterial());
let planeColorHolderWire = new THREE.LineSegments(
	new THREE.EdgesGeometry(planeColorHolder.geometry),
	new THREE.LineBasicMaterial({ color: "#000000" })
);
planeColorHolder.add(planeColorHolderWire);

let planeColor = new THREE.Mesh(
	new THREE.PlaneGeometry(3, 3),
	new THREE.ShaderMaterial({
		uniforms: {
			baseRT: gu.baseRT,
		},
		vertexShader: `
    	varying vec2 vUv;
      void main(){
      	vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }
    `,
		fragmentShader: `
    	uniform sampler2D baseRT;
    	varying vec2 vUv;
      void main(){
      	vec2 uv = vUv;
      	float f = texture(baseRT, uv).r;
        vec3 col = mix(vec3(0), vec3(0, 0.5, 1), smoothstep(0.2, 0.,abs(f - 0.5)));
        gl_FragColor = vec4(col, 1.);
      }
    `,
	})
);
planeColor.position.z = 0.21;
planeColorHolder.add(planeColor);
planeColorHolder.position.y = 4;
scene.add(planeColorHolder);

// plane wire
let planeWire = new THREE.Mesh(
	new THREE.PlaneGeometry(50, 50, 50, 50).rotateX(Math.PI * -0.5),
	new THREE.ShaderMaterial({
		wireframe: true,
		uniforms: {
			baseRT: gu.baseRT,
		},
		vertexShader: `
    	uniform sampler2D baseRT;
      varying vec2 vUv;
      void main(){
        vUv = uv;
      
      	float f = texture(baseRT, uv).r;
        vec3 pos = position;
        pos.y += f * 2.;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
      }
    `,
		fragmentShader: `
      varying vec2 vUv;
    	void main(){
        float l = length(vUv - 0.5) * 2.;
        vec3 col = mix(vec3(0), vec3(1), smoothstep(0.75, 1., l));
      	gl_FragColor = vec4(col, 1);
      }
    `,
	})
);
scene.add(planeWire);

let clock = new THREE.Clock();
let t = 0;

renderer.setAnimationLoop(() => {
	let dt = clock.getDelta();
	t += dt;
	gu.time.value = t;
	controls.update();

	renderer.setRenderTarget(baseRT);
	renderer.render(baseScene, baseCam);
	renderer.setRenderTarget(null);
	renderer.render(scene, camera);

	renderer.render(scene, camera);
});
