import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// ================== VARIABLES ==================
let camera, scene, renderer, stats, controls;
let mixer;
let clock = new THREE.Clock();

let object;
let actions = {};
let activeAction = null;
let previousAction = null;

const loader = new FBXLoader();

// ⚠️ Capoeira ya viene en Character.fbx (base)
// Estas son SOLO las externas (sin skin)
const animationsList = [
    { name: "Praying", file: "Praying.fbx", key: "2" },
    { name: "Sitting Laughing", file: "Sitting Laughing.fbx", key: "2" },
    { name: "Old Man Idle", file: "Old Man Idle.fbx", key: "3" },
    { name: "Dying", file: "Dying.fbx", key: "4" },
    { name: "Female Pose", file: "Female Laying Pose.fbx", key: "5" }
];

// ================== INIT ==================
init();

function init() {

    const container = document.getElementById('container');

    // 📷 Cámara
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(80, 120, 150);

    // 🌍 Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e2f);
    scene.fog = new THREE.Fog(0x1e1e2f, 200, 1000);

    // 💡 Luces
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 🧱 Piso
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000),
        new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    // 🖥️ Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 🎮 Controles
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 80, 0);
    controls.update();

    // 📊 Stats
    stats = new Stats();
    container.appendChild(stats.dom);

    // 📐 Resize
    window.addEventListener('resize', onWindowResize);

    // ⌨️ Teclado
    window.addEventListener("keydown", onKeyDown);

    // 📦 Cargar modelo base
    loadBaseModel();
}

// ================== MODELO BASE (CON CAPOEIRA) ==================
function loadBaseModel() {

    loader.load('./assets/models/fbx/Character.fbx', function (group) {

        object = group;

        object.scale.set(0.5, 0.5, 0.5);
        object.position.set(0, 0, 0);

        object.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.frustumCulled = false;
            }
        });

        mixer = new THREE.AnimationMixer(object);

        scene.add(object);

        // 🎯 Centrar cámara
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        controls.target.copy(center);
        camera.lookAt(center);

        // 🔥 ACTIVAR CAPOEIRA (viene dentro del modelo)
        if (object.animations && object.animations.length > 0) {

            const baseAction = mixer.clipAction(object.animations[0]);

            actions["Capoeira"] = baseAction;

            activeAction = baseAction;
            baseAction.play();
        }

        // cargar demás animaciones
        loadAnimations();
    });
}

// ================== ANIMACIONES EXTERNAS ==================
function loadAnimations() {

    animationsList.forEach(anim => {

        loader.load('./assets/models/fbx/' + anim.file, function (animObj) {

            const clip = animObj.animations[0];
            const action = mixer.clipAction(clip);

            actions[anim.name] = action;

            console.log("Cargada:", anim.name);
        });

    });
}

// ================== CAMBIAR ANIMACIÓN ==================
function playAnimation(name) {

    if (!actions[name]) return;

    previousAction = activeAction;
    activeAction = actions[name];

    if (previousAction !== activeAction) {

        if (previousAction) previousAction.fadeOut(0.5);

        activeAction
            .reset()
            .fadeIn(0.5)
            .play();
    }
}

// ================== TECLADO ==================
function onKeyDown(e) {

    switch (e.key) {
        case "1":
            playAnimation("Praying");
            break;
        case "2":
            playAnimation("Sitting Laughing");
            break;
        case "3":
            playAnimation("Old Man Idle");
            break;
        case "4":
            playAnimation("Dying");
            break;
        case "5":
            playAnimation("Female Pose");
            break;
    }
}

// ================== RESIZE ==================
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ================== LOOP ==================
function animate() {

    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);

    renderer.render(scene, camera);

    stats.update();
}