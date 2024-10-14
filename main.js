import WindowManager from './WindowManager.js';

const t = THREE;
let camera, scene, renderer, world;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let sceneOffsetTarget = {x: 0, y: 0};
let sceneOffset = {x: 0, y: 0};
let globes = []; // Updated to track globes instead of cubes

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;

function getTime() {
    return (new Date().getTime() - today) / 1000.0;
}

if (new URLSearchParams(window.location.search).get("clear")) {
    localStorage.clear();
} else {
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState != 'hidden' && !initialized) {
            init();
        }
    });

    window.onload = () => {
        if (document.visibilityState != 'hidden') {
            init();
        }
    };
}

function init() {
    initialized = true;
    setupScene();
    setupWindowManager();
    resize();
    updateWindowShape(false);
    render();
    window.addEventListener('resize', resize);
}

function setupScene() {
    camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);
    camera.position.z = 2.5;
    scene = new t.Scene();
    scene.background = new t.Color(0.0);
    scene.add(camera);
    renderer = new t.WebGLRenderer({antialias: true, depthBuffer: true});
    renderer.setPixelRatio(pixR);
    world = new t.Object3D();
    scene.add(world);
    renderer.domElement.setAttribute("id", "scene");
    document.body.appendChild(renderer.domElement);
}

function setupWindowManager() {
    windowManager = new WindowManager();
    windowManager.setWinShapeChangeCallback(updateWindowShape);
    windowManager.setWinChangeCallback(windowsUpdated);
    let metaData = {foo: "bar"};
    windowManager.init(metaData);
    windowsUpdated();
}

function windowsUpdated() {
    updateNumberOfGlobes();
}

function updateNumberOfGlobes() {
    let wins = windowManager.getWindows();

    // Check if we're in the initial load state and already have a globe
    if (globes.length >= 1 && wins.length <= 1) {
        return; // Prevent creating more globes if we're still on the initial window
    }

    // Proceed to create a globe if we don't have any, or if new windows have been added
    while (globes.length < wins.length) {
        let i = globes.length; // Use the current length of globes to determine the new globe's index
        
        const dotsGeometry = new t.Geometry();
        const color = globes.length === 0 ? 0xffffff : new t.Color().setHSL(i * 0.1, 1.0, 0.5);
        const dotMaterial = new t.PointsMaterial({ color: color, size: 1.5 });

        for (let j = 0; j < 1000; j++) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos((Math.random() * 2) - 1);
            const x = 250 * Math.sin(phi) * Math.cos(theta);
            const y = 250 * Math.sin(phi) * Math.sin(theta);
            const z = 250 * Math.cos(phi);
            dotsGeometry.vertices.push(new t.Vector3(x, y, z));
        }

        const dots = new t.Points(dotsGeometry, dotMaterial);
        dots.position.set(0, 0, 0); // Optionally adjust the position if needed

        world.add(dots);
        globes.push(dots); // Add the new globe to our tracking array
    }
}


function updateWindowShape(easing = true) {
    sceneOffsetTarget = {x: -window.screenX, y: -window.screenY};
    if (!easing) sceneOffset = sceneOffsetTarget;
}

function render() {
    let t = getTime();

    windowManager.update();

    sceneOffset.x += (sceneOffsetTarget.x - sceneOffset.x) * 0.05;
    sceneOffset.y += (sceneOffsetTarget.y - sceneOffset.y) * 0.05;

    world.position.x = sceneOffset.x;
    world.position.y = sceneOffset.y;

    let wins = windowManager.getWindows();
    // Update each globe's position and rotation
    for (let i = 0; i < globes.length; i++) {
        let globe = globes[i];
        let win = wins[i];
        let posTarget = {x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5)}

        globe.position.x += (posTarget.x - globe.position.x) * 0.05;
        globe.position.y += (posTarget.y - globe.position.y) * 0.05;
        
        // Slowing down the rotation speed by multiplying time with a smaller factor
        globe.rotation.x = t * 0.1; // Slowed down from 0.5 to 0.1
        globe.rotation.y = t * 0.1; // Slowed down from 0.3 to 0.1
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}


function resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    camera.left = 0;
    camera.right = width;
    camera.top = 0;
    camera.bottom = height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
